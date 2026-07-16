import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

const DOMAIN = 'hfzwood.com';
const EDITORIAL_CONTENT_MOUNT_PATH = '/mnt/hfzwood-content';
const PRODUCTION_ORIGIN = `https://${DOMAIN}`;

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

    const editorialContentFilesystem = new efs.FileSystem(this, 'EditorialContentFilesystem', {
      vpc,
      encrypted: true,
    });

    const editorialContentAccessPoint = editorialContentFilesystem.addAccessPoint(
      'EditorialContentAccessPoint',
      {
        path: '/hfzwood-content',
        createAcl: {
          ownerUid: '1000',
          ownerGid: '1000',
          permissions: '750',
        },
        posixUser: {
          uid: '1000',
          gid: '1000',
        },
      },
    );

    const taskDef = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      family: 'resin-calculator',
      cpu: 256,
      memoryLimitMiB: 512,
    });
    taskDef.addVolume({
      name: 'editorial-content',
      efsVolumeConfiguration: {
        fileSystemId: editorialContentFilesystem.fileSystemId,
        transitEncryption: 'ENABLED',
        authorizationConfig: {
          accessPointId: editorialContentAccessPoint.accessPointId,
        },
      },
    });

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
        CONTENT_DATA_DIR: EDITORIAL_CONTENT_MOUNT_PATH,
        REQUIRE_CONTENT_DATA_DIR: '1',
        CORS_ALLOWED_ORIGINS: PRODUCTION_ORIGIN,
      },
    });
    appContainer.addMountPoints({
      containerPath: EDITORIAL_CONTENT_MOUNT_PATH,
      sourceVolume: 'editorial-content',
      readOnly: false,
    });

    const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'Service', {
      cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      minHealthyPercent: 0,
      maxHealthyPercent: 100,
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
    editorialContentFilesystem.connections.allowDefaultPortFrom(
      fargateService.service,
      'Allow ECS tasks to mount editorial EFS'
    );

    new cdk.CfnOutput(this, 'AppUrl', { value: `https://${DOMAIN}` });
  }
}
