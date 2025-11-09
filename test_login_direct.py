import requests
import json

# Test the login API directly
url = "http://localhost:8000/api/auth/login"
data = {
    "username": "sarah_smith",
    "password": "password123"
}

print(f"Testing login API: {url}")
print(f"Payload: {json.dumps(data, indent=2)}")

try:
    response = requests.post(url, json=data, timeout=10)
    print(f"\nResponse Status: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"SUCCESS! Response: {json.dumps(result, indent=2)}")
    else:
        print(f"FAILED! Response: {response.text}")
        try:
            error = response.json()
            print(f"Error JSON: {json.dumps(error, indent=2)}")
        except:
            pass
            
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
except Exception as e:
    print(f"Unexpected error: {e}")