# delete-infra.ps1
# Destroys all AWS infrastructure for resin-calculator.
# Run from the deployment/cdk directory.
#
# Usage:
#   .\delete-infra.ps1 [profile]
# Example:
#   .\delete-infra.ps1 hfzwood

param(
    [string]$Profile = "hfzwood"
)

$Region = "eu-central-1"

Write-Host ""
Write-Host "=== Resin Calculator - Delete Infrastructure ==="
Write-Host ""

# 1. Destroy CDK app stack (also deletes ECR and CloudWatch logs)
Write-Host "[1/2] Destroying CDK app stack..."
Push-Location $PSScriptRoot
npx cdk destroy --all --force --profile $Profile
Pop-Location

# 2. Delete CDK bootstrap stack (no cdk command exists for this)
Write-Host "[2/2] Destroying CDK bootstrap stack..."
aws cloudformation delete-stack --stack-name CDKToolkit --region $Region --profile $Profile
aws cloudformation wait stack-delete-complete --stack-name CDKToolkit --region $Region --profile $Profile
Write-Host "      Done."

Write-Host ""
Write-Host "=== Done. Run bootstrap + cdk deploy to start fresh. ==="
Write-Host ""
