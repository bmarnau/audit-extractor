#!/usr/bin/env python3
import json
import urllib.request

BASE_URL = "http://localhost:3000"

# Test CSV Export
print("\n[TEST CSV Export]")
try:
    payload = {"reportId": "REPORT-2026-07-16"}
    data = json.dumps(payload).encode('utf-8')
    
    req = urllib.request.Request(
        f"{BASE_URL}/api/technical-tests/export/csv",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    with urllib.request.urlopen(req, timeout=10) as response:
        content = response.read()
        print(f"  Status: {response.status}")
        print(f"  Content-Type: {response.headers.get('Content-Type')}")
        print(f"  Content-Length: {len(content)} bytes")
        print(f"  First 200 chars: {content[:200]}")
        
except Exception as e:
    print(f"  Error: {str(e)}")

# Test JSON Export
print("\n[TEST JSON Export]")
try:
    payload = {"reportId": "REPORT-2026-07-16"}
    data = json.dumps(payload).encode('utf-8')
    
    req = urllib.request.Request(
        f"{BASE_URL}/api/technical-tests/export/json",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    with urllib.request.urlopen(req, timeout=10) as response:
        content = response.read()
        print(f"  Status: {response.status}")
        print(f"  Content-Type: {response.headers.get('Content-Type')}")
        print(f"  Content-Length: {len(content)} bytes")
        print(f"  First 200 chars: {content[:200]}")
        
except Exception as e:
    print(f"  Error: {str(e)}")
