import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

const DOMAIN = 'hfzwood.com';

export class InfraStack extends cdk.Stack {
  // Exported for AppStack to consume
  public readonly repository: ecr.Repository;
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ECR repository
    this.repository = new ecr.Repository(this, 'Repo', {
      repositoryName: 'resin-calculator',
      imageScanOnPush: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
    });

    // CloudWatch log group
    new logs.LogGroup(this, 'LogGroup', {
      logGroupName: '/ecs/resin-calculator',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Cognito User Pool
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'resin-calculator-user-pool',
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.userPoolClient = this.userPool.addClient('AppClient', {
      userPoolClientName: 'resin-calculator-client',
      generateSecret: false,
      authFlows: { userSrp: true },
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PROFILE],
        callbackUrls: [`https://${DOMAIN}/callback`, 'http://localhost:5173/callback'],
        logoutUrls: [`https://${DOMAIN}`, 'http://localhost:5173'],
      },
    });

    this.userPool.addDomain('HostedUIDomain', {
      cognitoDomain: { domainPrefix: `resin-calculator-${this.account}` },
    });

    // Outputs
    new cdk.CfnOutput(this, 'EcrUri', { value: this.repository.repositoryUri });
    new cdk.CfnOutput(this, 'UserPoolId', { value: this.userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: this.userPoolClient.userPoolClientId });
  }
}
