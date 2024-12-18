import boto3
import os

def download_s3_bucket(bucket_name, local_directory):
    """
    Download semua file dari S3 bucket ke direktori lokal
    """
    try:
        # Inisialisasi S3 client
        s3 = boto3.client('s3')
        
        # Buat direktori lokal jika belum ada
        if not os.path.exists(local_directory):
            os.makedirs(local_directory)
        
        print(f"Mulai mengunduh file dari bucket: {bucket_name}")
        
        # List semua objek dalam bucket
        paginator = s3.get_paginator('list_objects_v2')
        for page in paginator.paginate(Bucket=bucket_name):
            if 'Contents' in page:
                for obj in page['Contents']:
                    # Dapatkan path file
                    file_key = obj['Key']
                    local_file_path = os.path.join(local_directory, file_key)
                    
                    # Buat direktori untuk file jika belum ada
                    os.makedirs(os.path.dirname(local_file_path), exist_ok=True)
                    
                    # Download file
                    print(f"Mengunduh: {file_key}")
                    s3.download_file(bucket_name, file_key, local_file_path)
        
        print("\nDownload selesai! Semua file telah diunduh ke:", local_directory)
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    # Ganti dengan nama S3 bucket Anda
    BUCKET_NAME = "diabetes-prediction-app-2023"  # Updated bucket name
    
    # Direktori lokal untuk menyimpan file
    LOCAL_DIR = "d:/Nopal/nyobak java/Belajar_JavaScript/AWS"
    
    # Jalankan fungsi download
    download_s3_bucket(BUCKET_NAME, LOCAL_DIR)
