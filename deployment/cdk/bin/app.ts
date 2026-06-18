import * as cdk from 'aws-cdk-lib';
import { InfraStack } from '../lib/infra-stack';
import { AppStack } from '../lib/app-stack';

const app = new cdk.App();
const env = { account: '325866321073', region: 'eu-central-1' };

const infraStack = new InfraStack(app, 'InfraStack', { env });

new AppStack(app, 'AppStack', {
  env,
  repository: infraStack.repository,
  cognitoUserPoolId: infraStack.userPool.userPoolId,
});
