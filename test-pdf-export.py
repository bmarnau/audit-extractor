#!/usr/bin/env python3
import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:3000"

print("\n" + "="*60)
print("Testing Technical Audit PDF Export")
print("="*60)

# Test 1: PDF Export endpoint
print("\n[TEST 1] PDF Export POST /api/technical-tests/export/pdf")
try:
    payload = {
        "reportId": "REPORT-2026-07-16"
    }
    data = json.dumps(payload).encode('utf-8')
    
    print(f"  Payload: {json.dumps(payload)}")
    
    req = urllib.request.Request(
        f"{BASE_URL}/api/technical-tests/export/pdf",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            content = response.read()
            print(f"  Status Code: {response.status}")
            print(f"  Content-Type: {response.headers.get('Content-Type')}")
            print(f"  Response Length: {len(content)} bytes")
            print(f"  ✓ Export successful - PDF size: {len(content)} bytes")
    except urllib.error.HTTPError as e:
        content = e.read().decode('utf-8')
        print(f"  Status Code: {e.code}")
        try:
            error_data = json.loads(content)
            print(f"  Error: {error_data.get('error', {}).get('message')}")
        except:
            print(f"  Response: {content[:200]}")
        
except Exception as e:
    print(f"  ✗ Error: {str(e)}")

# Test 2: Check if findings endpoint works
print("\n[TEST 2] GET /api/technical-tests/findings")
try:
    req = urllib.request.Request(f"{BASE_URL}/api/technical-tests/findings")
    with urllib.request.urlopen(req, timeout=10) as response:
        content = response.read().decode('utf-8')
        data = json.loads(content)
        findings = data.get('data', {}).get('findings', [])
        print(f"  Status Code: {response.status}")
        print(f"  Findings Count: {len(findings)}")
        print(f"  ✓ Findings API working")
except Exception as e:
    print(f"  ✗ Error: {str(e)}")

# Test 3: Check recommendations endpoint
print("\n[TEST 3] GET /api/technical-tests/recommendations")
try:
    req = urllib.request.Request(f"{BASE_URL}/api/technical-tests/recommendations")
    with urllib.request.urlopen(req, timeout=10) as response:
        content = response.read().decode('utf-8')
        data = json.loads(content)
        recs = data.get('data', {}).get('recommendations', [])
        print(f"  Status Code: {response.status}")
        print(f"  Recommendations Count: {len(recs)}")
        print(f"  ✓ Recommendations API working")
except Exception as e:
    print(f"  ✗ Error: {str(e)}")

print("\n" + "="*60)
