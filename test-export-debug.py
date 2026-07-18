#!/usr/bin/env python3
import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:3000"

print("\n" + "="*60)
print("Debug Export Button Issue")
print("="*60)

# Step 1: Load reports
print("\n[STEP 1] Load reports from /api/technical-tests/reports")
try:
    req = urllib.request.Request(f"{BASE_URL}/api/technical-tests/reports")
    with urllib.request.urlopen(req, timeout=10) as response:
        content = response.read().decode('utf-8')
        data = json.loads(content)
        
        print(f"  Status: {response.status}")
        print(f"  Response keys: {data.keys()}")
        
        if 'data' in data:
            print(f"  data.reports: {data['data'].get('reports', [])}")
            print(f"  data.count: {data['data'].get('count')}")
            print(f"  data.latest: {data['data'].get('latest')}")
            
            latest = data['data'].get('latest', {})
            if latest:
                print(f"\n  Latest report found:")
                print(f"    - ID: {latest.get('id')}")
                print(f"    - Version: {latest.get('version')}")
                print(f"    - Report Date: {latest.get('reportDate')}")
        else:
            print(f"  Unexpected response structure: {data}")
        
except Exception as e:
    print(f"  Error: {str(e)}")

# Step 2: Test export with latest report
print("\n[STEP 2] Test export with latest report ID")
try:
    req = urllib.request.Request(f"{BASE_URL}/api/technical-tests/reports")
    with urllib.request.urlopen(req, timeout=10) as response:
        content = response.read().decode('utf-8')
        data = json.loads(content)
        latest_report = data['data'].get('latest', {})
        report_id = latest_report.get('id')
        
        if not report_id:
            print(f"  Error: No report ID found in latest report: {latest_report}")
        else:
            print(f"  Using report ID: {report_id}")
            
            # Step 3: Call export endpoint
            print("\n[STEP 3] Call export endpoint")
            payload = {"reportId": report_id}
            export_data = json.dumps(payload).encode('utf-8')
            
            req = urllib.request.Request(
                f"{BASE_URL}/api/technical-tests/export/pdf",
                data=export_data,
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            
            try:
                with urllib.request.urlopen(req, timeout=10) as response:
                    content = response.read()
                    print(f"  Status: {response.status}")
                    print(f"  Content-Type: {response.headers.get('Content-Type')}")
                    print(f"  Content-Length: {len(content)} bytes")
                    print(f"  ✓ Export successful!")
                    
            except urllib.error.HTTPError as e:
                content = e.read().decode('utf-8')
                print(f"  Status: {e.code}")
                try:
                    error_data = json.loads(content)
                    print(f"  Error: {error_data.get('error', {}).get('message')}")
                except:
                    print(f"  Response: {content[:200]}")
                    
except Exception as e:
    print(f"  Error: {str(e)}")

print("\n" + "="*60)
