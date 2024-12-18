# PowerShell script untuk setup WAF dan Security Headers

# Variabel konfigurasi
$REGION = "us-east-1"
$WAF_NAME = "DiabetesPredictionWAF"
$HEADERS_POLICY_NAME = "DiabetesPredictionSecurityHeaders"

# Create WAF Web ACL
Write-Host "Creating WAF Web ACL..."
aws wafv2 create-web-acl `
    --name $WAF_NAME `
    --scope CLOUDFRONT `
    --region $REGION `
    --default-action Allow={} `
    --cli-input-json file://waf-config.json

# Get Web ACL ID
$WAF_ID = (aws wafv2 list-web-acls --scope CLOUDFRONT --region $REGION | ConvertFrom-Json).WebACLs | Where-Object { $_.Name -eq $WAF_NAME } | Select-Object -ExpandProperty Id

# Create Response Headers Policy
Write-Host "Creating Response Headers Policy..."
aws cloudfront create-response-headers-policy `
    --cli-input-json file://response-headers-policy.json

# Get Response Headers Policy ID
$HEADERS_POLICY_ID = (aws cloudfront list-response-headers-policies | ConvertFrom-Json).ResponseHeadersPolicyList.Items | Where-Object { $_.Name -eq $HEADERS_POLICY_NAME } | Select-Object -ExpandProperty Id

# Update distribution-config-update.json with actual IDs
Write-Host "Updating distribution configuration..."
$config = Get-Content distribution-config-update.json | ConvertFrom-Json
$config.DistributionConfig.WebACLId = "arn:aws:wafv2:us-east-1:$((aws sts get-caller-identity --query Account --output text)):global/webacl/$WAF_NAME/$WAF_ID"
$config.DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId = $HEADERS_POLICY_ID
$config | ConvertTo-Json -Depth 100 | Set-Content distribution-config-update.json

Write-Host "Security configuration completed!"
