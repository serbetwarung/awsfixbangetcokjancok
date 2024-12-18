from zapv2 import ZAPv2
import time
import json

def security_test(target_url):
    """
    Melakukan security testing menggunakan OWASP ZAP
    """
    # Inisialisasi ZAP
    zap = ZAPv2(proxies={'http': 'http://127.0.0.1:8080', 'https': 'http://127.0.0.1:8080'})
    
    try:
        print('Memulai Security Test...')
        
        # Spider target untuk menemukan endpoints
        print('Spider scan target...')
        scan_id = zap.spider.scan(target_url)
        time.sleep(2)
        while int(zap.spider.status(scan_id)) < 100:
            print(f'Spider progress: {zap.spider.status(scan_id)}%')
            time.sleep(2)
            
        # Active Scan untuk menemukan vulnerabilities
        print('Active scan target...')
        scan_id = zap.ascan.scan(target_url)
        while int(zap.ascan.status(scan_id)) < 100:
            print(f'Active scan progress: {zap.ascan.status(scan_id)}%')
            time.sleep(5)
            
        # Generate report
        print('Generating report...')
        alerts = zap.core.alerts()
        
        # Kategorikan alerts berdasarkan risk level
        risk_levels = {
            'High': [],
            'Medium': [],
            'Low': [],
            'Informational': []
        }
        
        for alert in alerts:
            risk = alert.get('risk')
            if risk in risk_levels:
                risk_levels[risk].append({
                    'alert': alert.get('alert'),
                    'description': alert.get('description'),
                    'solution': alert.get('solution'),
                    'url': alert.get('url')
                })
        
        # Simpan report
        with open('security_report.json', 'w') as f:
            json.dump({
                'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
                'target_url': target_url,
                'findings': risk_levels
            }, f, indent=2)
            
        print('Security test selesai. Report tersimpan di security_report.json')
        
        # Print summary
        print('\nSecurity Test Summary:')
        for risk, alerts in risk_levels.items():
            print(f'{risk} Risk Issues: {len(alerts)}')
            
    except Exception as e:
        print(f'Error during security test: {str(e)}')
    finally:
        # Shutdown ZAP
        zap.core.shutdown()

if __name__ == '__main__':
    # Ganti dengan URL API Anda
    API_URL = 'https://api.diabetesprediction.com'
    security_test(API_URL)
