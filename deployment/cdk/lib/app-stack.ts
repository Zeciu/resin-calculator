import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

const DOMAIN = 'hfzwood.com';
/** Packaged editorial release corpus inside the container image (read-only in release mode). */
const PACKAGED_EDITORIAL_CONTENT_DIR = '/app/content';
const PRODUCTION_ORIGIN = `https://${DOMAIN}`;
const STRIPE_SECRET_NAME = 'hfzwood/stripe';
/**
 * Deployer IAM user. Trusted to assume the ECS task role locally (Option A) so local
 * development exercises the exact same DynamoDB permissions as the running task, instead
 * of maintaining a second, potentially drifting permission set on this user directly.
 */
const HFZWOOD_DEPLOYER_USER_ARN = 'arn:aws:iam::325866321073:user/hfzwood';

interface AppStackProps extends cdk.StackProps {
  repository: ecr.Repository;
  cognitoUserPoolId: string;
  cognitoUserPoolClientId: string;
}

export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'Vpc', { isDefault: true });

    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: DOMAIN,
    });

    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName: DOMAIN,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    const logGroup = logs.LogGroup.fromLogGroupName(this, 'LogGroup', '/ecs/resin-calculator');

    const cluster = new ecs.Cluster(this, 'Cluster', {
      clusterName: 'resin-calculator-cluster',
      vpc,
    });

    // Durable per-user commercial entitlements, with a reverse lookup by Stripe customer id
    // (replaces the filesystem-era hand-maintained customer index / fallback scan).
    const entitlementsTable = new dynamodb.Table(this, 'EntitlementsTable', {
      tableName: 'hfzwood-entitlements',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    entitlementsTable.addGlobalSecondaryIndex({
      indexName: 'stripeCustomerId-index',
      partitionKey: { name: 'stripeCustomerId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.KEYS_ONLY,
    });

    const taskDef = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      family: 'resin-calculator',
      cpu: 256,
      memoryLimitMiB: 512,
    });

    const stripePriceId =
      (this.node.tryGetContext('stripePriceId') as string | undefined)?.trim() ||
      (process.env.HFZWOOD_STRIPE_PRICE_ID || '').trim();

    const stripeSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      'HfzwoodStripeSecret',
      STRIPE_SECRET_NAME,
    );

    const appContainer = taskDef.addContainer('app', {
      containerName: 'resin-calculator',
      image: ecs.ContainerImage.fromEcrRepository(props.repository, 'latest'),
      portMappings: [{ containerPort: 5000 }],
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'ecs', logGroup }),
      environment: {
        AUTH_MODE: "cognito",
        COGNITO_USER_POOL_ID: props.cognitoUserPoolId,
        COGNITO_CLIENT_ID: props.cognitoUserPoolClientId,
        COGNITO_REGION: this.region,
        // Public content: packaged image corpus; no authoring code or mutation routes are deployed.
        CONTENT_DATA_DIR: PACKAGED_EDITORIAL_CONTENT_DIR,
        // Commercial/user state: DynamoDB (see EntitlementsTable below).
        ENTITLEMENTS_TABLE_NAME: entitlementsTable.tableName,
        CORS_ALLOWED_ORIGINS: PRODUCTION_ORIGIN,
        STRIPE_PRICE_ID: stripePriceId,
        STRIPE_CHECKOUT_SUCCESS_URL: `${PRODUCTION_ORIGIN}/account?billing=success`,
        STRIPE_CHECKOUT_CANCEL_URL: `${PRODUCTION_ORIGIN}/account?billing=cancel`,
        STRIPE_PORTAL_RETURN_URL: `${PRODUCTION_ORIGIN}/account`,
      },
      secrets: {
        STRIPE_SECRET_KEY: ecs.Secret.fromSecretsManager(stripeSecret, 'secret_key'),
        STRIPE_WEBHOOK_SECRET: ecs.Secret.fromSecretsManager(stripeSecret, 'webhook_secret'),
      },
    });
    entitlementsTable.grantReadWriteData(taskDef.taskRole);

    // Local development (Option A): let the hfzwood deployer user assume this exact task
    // role so `boto3` running locally gets the same DynamoDB permissions as the running
    // ECS task, rather than a second, separately maintained permission set.
    // `taskRole` is a concrete `iam.Role` at runtime (created internally by
    // `FargateTaskDefinition`), but is exposed only via the narrower `IRole` interface,
    // which does not include `assumeRolePolicy`; `grantAssumeRole` does not add a trust
    // statement for an external `ArnPrincipal` grantee, so the trust policy is updated
    // directly here instead.
    (taskDef.taskRole as iam.Role).assumeRolePolicy?.addStatements(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ArnPrincipal(HFZWOOD_DEPLOYER_USER_ARN)],
        actions: ['sts:AssumeRole'],
      }),
    );

    const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'Service', {
      cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      minHealthyPercent: 0,
      // AWS now defaults new/updated services to AvailabilityZoneRebalancing.ENABLED, which
      // requires maximumPercent > 100 (ApplicationLoadBalancedFargateService does not expose a
      // prop to disable AZ rebalancing directly). 200% allows at most one extra task briefly
      // during deployment; desiredCount remains 1.
      maxHealthyPercent: 200,
      circuitBreaker: { rollback: true },
      listenerPort: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificate,
      domainName: DOMAIN,
      domainZone: hostedZone,
      publicLoadBalancer: true,
      assignPublicIp: true,
      serviceName: 'resin-calculator-service',
      loadBalancerName: 'resin-calculator-alb',
      healthCheckGracePeriod: cdk.Duration.seconds(30),
      redirectHTTP: true,
    });
    fargateService.targetGroup.configureHealthCheck({ path: '/health' });
    fargateService.service.connections.allowFrom(
      fargateService.loadBalancer,
      ec2.Port.tcp(5000),
    );

    new cloudwatch.Alarm(this, 'AlbUnhealthyHostsAlarm', {
      alarmName: 'resin-calculator-alb-unhealthy-hosts',
      alarmDescription: 'ALB target group has unhealthy hosts.',
      metric: fargateService.targetGroup.metrics.unhealthyHostCount(),
      threshold: 0,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, 'EcsRunningTaskCountLowAlarm', {
      alarmName: 'resin-calculator-ecs-running-tasks-low',
      alarmDescription: 'ECS service has fewer than one running task.',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ECS',
        metricName: 'RunningTaskCount',
        dimensionsMap: {
          ClusterName: cluster.clusterName,
          ServiceName: fargateService.service.serviceName,
        },
        statistic: 'Minimum',
        period: cdk.Duration.minutes(1),
      }),
      threshold: 1,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
    });

    new cdk.CfnOutput(this, 'AppUrl', { value: `https://${DOMAIN}` });
    new cdk.CfnOutput(this, 'EntitlementsTableName', { value: entitlementsTable.tableName });
    new cdk.CfnOutput(this, 'TaskRoleArn', { value: taskDef.taskRole.roleArn });
  }
}
