import requests
import json

# Test login API
url = "http://localhost:8000/api/auth/login"
data = {
    "username": "sarah_smith",
    "password": "password123"
}

try:
    print("Testing login API...")
    print(f"URL: {url}")
    print(f"Data: {json.dumps(data, indent=2)}")
    
    response = requests.post(url, json=data)
    
    print(f"\nResponse Status: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"Response Body: {response.text}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\nParsed JSON: {json.dumps(result, indent=2)}")
    else:
        print(f"\nError response - Status: {response.status_code}")
        try:
            error_data = response.json()
            print(f"Error JSON: {json.dumps(error_data, indent=2)}")
        except:
            print(f"Error text: {response.text}")
            
except Exception as e:
    print(f"Request failed: {e}")