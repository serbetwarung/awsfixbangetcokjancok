#!/bin/bash
yum update -y
yum install -y httpd python3 python3-pip git amazon-cloudwatch-agent

# Install Python dependencies
pip3 install flask boto3 numpy pandas scikit-learn

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "/aws/ec2/diabetes-prediction/access",
                        "log_stream_name": "{instance_id}"
                    },
                    {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "/aws/ec2/diabetes-prediction/error",
                        "log_stream_name": "{instance_id}"
                    }
                ]
            }
        }
    }
}
EOF

# Start CloudWatch agent
systemctl start amazon-cloudwatch-agent
systemctl enable amazon-cloudwatch-agent

# Clone application repository
cd /var/www/html
git clone https://github.com/yourusername/diabetes-prediction.git .

# Configure Apache
cat > /etc/httpd/conf.d/diabetes.conf << 'EOF'
<VirtualHost *:80>
    ServerName localhost
    DocumentRoot /var/www/html
    
    WSGIDaemonProcess diabetes python-path=/var/www/html
    WSGIProcessGroup diabetes
    WSGIScriptAlias / /var/www/html/app.wsgi

    <Directory /var/www/html>
        Require all granted
    </Directory>

    ErrorLog /var/log/httpd/error_log
    CustomLog /var/log/httpd/access_log combined
</VirtualHost>
EOF

# Start Apache
systemctl start httpd
systemctl enable httpd

# Set permissions
chown -R apache:apache /var/www/html
