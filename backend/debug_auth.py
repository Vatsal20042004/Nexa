import sqlite3
import hashlib

# Connect to database
conn = sqlite3.connect('employee_tracker.db')
conn.row_factory = sqlite3.Row  # This makes rows act like dictionaries
cursor = conn.cursor()

# Check all users in the database
cursor.execute('SELECT * FROM users')
users = cursor.fetchall()

print("All users in database:")
for user in users:
    print(f"ID: {user['id']}, Username: {user['username']}, Name: {user['name']}, Role: {user['role']}")
    print(f"Password hash: {user['password']}")
    print(f"Created: {user['created_at']}")
    print("-" * 50)

# Test the specific lookup that auth service does
username = "sarah_smith"
password = "password123"
hashed_password = hashlib.sha256(password.encode()).hexdigest()

print(f"\nTesting login for: {username}")
print(f"Password: {password}")
print(f"Hashed: {hashed_password}")

cursor.execute("""
    SELECT id, username, name, role, work_hours, comments, created_at
    FROM users
    WHERE username = ? AND password = ?
""", (username, hashed_password))

result = cursor.fetchone()
if result:
    print("✅ Login would succeed!")
    print(f"Found user: {dict(result)}")
else:
    print("❌ Login would fail!")
    
    # Check if username exists
    cursor.execute("SELECT username, password FROM users WHERE username = ?", (username,))
    user_check = cursor.fetchone()
    if user_check:
        print(f"Username exists but password doesn't match")
        print(f"Stored hash: {user_check['password']}")
        print(f"Expected hash: {hashed_password}")
        print(f"Hashes match: {user_check['password'] == hashed_password}")
    else:
        print("Username doesn't exist")

conn.close()