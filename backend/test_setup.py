"""
Simple test script to verify backend setup.
Run this to check if everything is configured correctly.
"""
import sys
import os

print("🔍 Employee Tracking System - Setup Verification")
print("=" * 60)

# Test 1: Python version
print("\n1. Checking Python version...")
version = sys.version_info
if version.major >= 3 and version.minor >= 8:
    print(f"   ✅ Python {version.major}.{version.minor}.{version.micro}")
else:
    print(f"   ❌ Python {version.major}.{version.minor}.{version.micro} (requires 3.8+)")

# Test 2: Required modules
print("\n2. Checking required modules...")
required_modules = [
    'fastapi',
    'uvicorn',
    'pydantic',
    'sqlite3',
]

for module in required_modules:
    try:
        __import__(module)
        print(f"   ✅ {module}")
    except ImportError:
        print(f"   ❌ {module} - Not installed")

# Test 3: Optional modules
print("\n3. Checking optional modules...")
optional_modules = [
    ('cv2', 'opencv-python'),
]

for module, package in optional_modules:
    try:
        __import__(module)
        print(f"   ✅ {package}")
    except ImportError:
        print(f"   ⚠️  {package} - Not installed (needed for video processing)")

# Test 4: Directory structure
print("\n4. Checking directory structure...")
base_dir = os.path.dirname(os.path.abspath(__file__))
required_dirs = [
    'api',
    'models',
    'services',
    'uploads',
]

for dir_name in required_dirs:
    dir_path = os.path.join(base_dir, dir_name)
    if os.path.exists(dir_path):
        print(f"   ✅ {dir_name}/")
    else:
        print(f"   ❌ {dir_name}/ - Missing")

# Test 5: Check Nexa services
print("\n5. Checking Nexa services integration...")
nexa_path = os.path.join(base_dir, '..', 'Nexa', 'services', 'services.py')
if os.path.exists(nexa_path):
    print(f"   ✅ Nexa services found")
    try:
        sys.path.insert(0, os.path.join(base_dir, '..'))
        from Nexa.services.services import UnifiedService
        print(f"   ✅ UnifiedService imported successfully")
    except ImportError as e:
        print(f"   ⚠️  UnifiedService import failed: {e}")
else:
    print(f"   ❌ Nexa services not found at {nexa_path}")

# Test 6: Database initialization
print("\n6. Testing database initialization...")
try:
    from models.database import Database
    db = Database()
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    conn.close()
    
    expected_tables = ['users', 'daily_sessions', 'tasks', 'chat_messages', 'audit_logs']
    found_tables = [table[0] for table in tables]
    
    print(f"   ✅ Database initialized with {len(found_tables)} tables")
    for table in expected_tables:
        if table in found_tables:
            print(f"      ✅ {table}")
        else:
            print(f"      ❌ {table} - Missing")
            
except Exception as e:
    print(f"   ❌ Database initialization failed: {e}")

# Test 7: Import all API routes
print("\n7. Testing API routes import...")
try:
    from api import auth, sessions, tasks, chat, settings, team
    print(f"   ✅ All API routes imported successfully")
except ImportError as e:
    print(f"   ❌ API routes import failed: {e}")

# Summary
print("\n" + "=" * 60)
print("✅ Setup verification complete!")
print("\nNext steps:")
print("1. Install missing dependencies: pip install -r requirements.txt")
print("2. Start the server: python main.py")
print("3. Visit API docs: http://localhost:8000/docs")
print("\nFor detailed instructions, see QUICKSTART.md")
