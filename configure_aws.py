import boto3
import json
import os

def setup_aws_credentials():
    """
    Setup AWS credentials untuk mengakses S3
    """
    try:
        # Buat direktori .aws jika belum ada
        aws_dir = os.path.expanduser('~/.aws')
        if not os.path.exists(aws_dir):
            os.makedirs(aws_dir)
        
        # Buat credentials file
        credentials_file = os.path.join(aws_dir, 'credentials')
        
        # Minta input credentials
        print("Masukkan AWS credentials Anda:")
        aws_access_key = input("AWS Access Key ID: ")
        aws_secret_key = input("AWS Secret Access Key: ")
        aws_region = input("AWS Region (default: ap-southeast-1): ") or "ap-southeast-1"
        
        # Tulis ke credentials file
        with open(credentials_file, 'w') as f:
            f.write("[default]\n")
            f.write(f"aws_access_key_id = {aws_access_key}\n")
            f.write(f"aws_secret_access_key = {aws_secret_key}\n")
            f.write(f"region = {aws_region}\n")
        
        print("\nAWS credentials berhasil disimpan!")
        
        # Test koneksi
        s3 = boto3.client('s3')
        response = s3.list_buckets()
        print("\nDaftar S3 buckets yang tersedia:")
        for bucket in response['Buckets']:
            print(f"- {bucket['Name']}")
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    setup_aws_credentials()
