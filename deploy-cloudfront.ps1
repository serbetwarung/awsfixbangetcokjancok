# PowerShell script untuk deploy ke S3 dan setup CloudFront

# Variabel konfigurasi
$BUCKET_NAME = "diabetes-prediction-app-2024"
$REGION = "us-east-1"
$DISTRIBUTION_COMMENT = "Diabetes Prediction App Distribution"

# Upload file ke S3
Write-Host "Uploading files to S3..."
aws s3 sync . s3://$BUCKET_NAME `
    --exclude ".git/*" `
    --exclude "node_modules/*" `
    --exclude "venv/*" `
    --exclude ".pytest_cache/*" `
    --exclude "__pycache__/*" `
    --exclude "*.ps1" `
    --exclude "*.sh" `
    --exclude "tests/*" `
    --exclude "coverage/*" `
    --exclude "package*.json" `
    --exclude "requirements*.txt" `
    --exclude "jest.config.js" `
    --exclude "*.zip" `
    --exclude "lambda_function.py" `
    --exclude "server.py"

# Membuat CloudFront distribution
Write-Host "Creating CloudFront distribution..."
$distribution_config = @{
    DistributionConfig = @{
        CallerReference = [DateTime]::Now.Ticks.ToString()
        Comment = $DISTRIBUTION_COMMENT
        DefaultCacheBehavior = @{
            TargetOriginId = "S3-$BUCKET_NAME"
            ViewerProtocolPolicy = "redirect-to-https"
            AllowedMethods = @("GET", "HEAD", "OPTIONS")
            CachedMethods = @("GET", "HEAD")
            ForwardedValues = @{
                QueryString = $true
                Cookies = @{
                    Forward = "none"
                }
            }
            MinTTL = 0
            DefaultTTL = 86400
            MaxTTL = 31536000
        }
        Enabled = $true
        Origins = @(
            @{
                DomainName = "$BUCKET_NAME.s3.amazonaws.com"
                Id = "S3-$BUCKET_NAME"
                S3OriginConfig = @{
                    OriginAccessIdentity = ""
                }
            }
        )
        DefaultRootObject = "index.html"
        PriceClass = "PriceClass_100"
        ViewerCertificate = @{
            CloudFrontDefaultCertificate = $true
        }
        CustomErrorResponses = @(
            @{
                ErrorCode = 403
                ResponsePagePath = "/error.html"
                ResponseCode = "404"
                ErrorCachingMinTTL = 300
            }
        )
    }
} | ConvertTo-Json -Depth 10

# Simpan konfigurasi ke file temporary
$config_file = "cloudfront-config.json"
$distribution_config | Out-File $config_file -Encoding UTF8

# Buat CloudFront distribution menggunakan file konfigurasi
Write-Host "Creating CloudFront distribution..."
aws cloudfront create-distribution --cli-input-json file://$config_file

# Hapus file konfigurasi temporary
Remove-Item $config_file

Write-Host "Deployment completed! Please wait 15-20 minutes for CloudFront distribution to be fully deployed."
Write-Host "Your CloudFront URL will be available in the AWS Console under CloudFront distributions."
