from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

def run(server_class=HTTPServer, handler_class=SimpleHTTPRequestHandler):
    # Mengatur direktori kerja ke lokasi file ini
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Konfigurasi server
    port = 8000
    server_address = ('', port)
    
    # Membuat instance server
    httpd = server_class(server_address, handler_class)
    
    print(f"Server berjalan di http://localhost:{port}")
    httpd.serve_forever()

if __name__ == '__main__':
    run()
