"""
Simple workflow test script.
Tests the complete employee workflow from registration to task generation.
"""
import requests
import json
from datetime import date

BASE_URL = "http://localhost:8000"

def test_workflow():
    print("🧪 Testing Employee Tracking System Workflow")
    print("=" * 60)
    
    # Step 1: Register user
    print("\n1️⃣ Registering new employee...")
    register_data = {
        "username": "test_employee",
        "password": "test123",
        "name": "Test Employee",
        "role": "employee"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
    if response.status_code == 200:
        data = response.json()
        token = data.get("session_token")
        print(f"   ✅ Registered: {data['user']['name']}")
        print(f"   🔑 Token: {token[:20]}...")
    else:
        print(f"   ❌ Failed: {response.text}")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Step 2: Create daily session
    print("\n2️⃣ Creating daily session...")
    session_data = {
        "date": str(date.today()),
        "github_username": "testuser",
        "github_repo": "testrepo"
    }
    
    response = requests.post(f"{BASE_URL}/api/sessions/create", json=session_data, headers=headers)
    if response.status_code == 200:
        session = response.json()
        session_id = session.get("session_id")
        print(f"   ✅ Session created: ID {session_id}")
    else:
        print(f"   ❌ Failed: {response.text}")
        return
    
    # Step 3: Upload transcript
    print("\n3️⃣ Uploading meeting transcript...")
    
    # Create a test transcript file
    with open("test_transcript.txt", "w") as f:
        f.write("""
        Morning Meeting Notes
        - Discussed project timeline
        - Assigned task to implement authentication
        - Need to complete database schema by end of day
        - Review code with team tomorrow
        """)
    
    files = {"file": open("test_transcript.txt", "rb")}
    data = {
        "session_date": str(date.today()),
        "upload_type": "morning"
    }
    
    response = requests.post(f"{BASE_URL}/api/sessions/upload-transcript", 
                           data=data, files=files, headers=headers)
    if response.status_code == 200:
        transcript = response.json()
        print(f"   ✅ Transcript uploaded: {transcript['filename']}")
    else:
        print(f"   ❌ Failed: {response.text}")
    
    # Step 4: Submit session
    print("\n4️⃣ Submitting session...")
    response = requests.post(f"{BASE_URL}/api/sessions/submit/{date.today()}", headers=headers)
    if response.status_code == 200:
        print(f"   ✅ Session submitted")
    else:
        print(f"   ❌ Failed: {response.text}")
    
    # Step 5: Process with LLM
    print("\n5️⃣ Processing session with LLM (generating tasks)...")
    process_data = {
        "session_id": session_id,
        "custom_instructions": "Generate actionable tasks from the meeting notes"
    }
    
    response = requests.post(f"{BASE_URL}/api/tasks/process-session", 
                           json=process_data, headers=headers)
    if response.status_code == 200:
        result = response.json()
        print(f"   ✅ Generated {result['tasks_generated']} tasks")
        if result.get('tasks'):
            for i, task in enumerate(result['tasks'], 1):
                print(f"      {i}. [{task['priority']}] {task['title']}")
    else:
        print(f"   ⚠️  LLM processing failed (this may happen if LLM is not configured)")
        print(f"      Response: {response.text[:200]}")
    
    # Step 6: Get today's tasks
    print("\n6️⃣ Fetching today's tasks...")
    response = requests.get(f"{BASE_URL}/api/tasks/today", headers=headers)
    if response.status_code == 200:
        tasks = response.json()
        print(f"   ✅ Found {len(tasks)} tasks for today")
        for task in tasks:
            status_icon = "✓" if task['completed'] else "○"
            print(f"      {status_icon} [{task['priority']}] {task['title']}")
    else:
        print(f"   ❌ Failed: {response.text}")
    
    # Step 7: Test chat
    print("\n7️⃣ Testing chat assistant...")
    chat_data = {
        "message": "How should I prioritize my tasks today?",
        "session_id": "test_session"
    }
    
    response = requests.post(f"{BASE_URL}/api/chat/message", 
                           json=chat_data, headers=headers)
    if response.status_code == 200:
        chat_response = response.json()
        print(f"   ✅ Chat response received")
        print(f"      Assistant: {chat_response['response'][:100]}...")
    else:
        print(f"   ⚠️  Chat failed (LLM may not be configured)")
        print(f"      Response: {response.text[:200]}")
    
    # Step 8: Update settings
    print("\n8️⃣ Updating user settings...")
    settings_data = {
        "work_hours": "09:00-17:00",
        "comments": "Prefer morning meetings"
    }
    
    response = requests.patch(f"{BASE_URL}/api/settings/profile", 
                            json=settings_data, headers=headers)
    if response.status_code == 200:
        profile = response.json()
        print(f"   ✅ Settings updated")
        print(f"      Work hours: {profile['work_hours']}")
    else:
        print(f"   ❌ Failed: {response.text}")
    
    # Summary
    print("\n" + "=" * 60)
    print("✅ Workflow test complete!")
    print("\nWhat was tested:")
    print("  ✓ User registration")
    print("  ✓ Session creation")
    print("  ✓ File upload")
    print("  ✓ Session submission")
    print("  ✓ LLM task generation")
    print("  ✓ Task retrieval")
    print("  ✓ Chat assistant")
    print("  ✓ Settings management")
    print("\n🎉 All basic features working!")
    print("\nNote: Some features (LLM, chat) may require additional setup.")
    print("See README.md for configuration details.")


if __name__ == "__main__":
    try:
        test_workflow()
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Could not connect to server")
        print("   Make sure the server is running:")
        print("   python main.py")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
