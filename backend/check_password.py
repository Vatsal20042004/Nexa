import sqlite3
import hashlib

# Connect to database
conn = sqlite3.connect('employee_tracker.db')
cursor = conn.cursor()

# Get user info
cursor.execute('SELECT username, password FROM users WHERE username = ?', ('sarah_smith',))
result = cursor.fetchone()

if result:
    username, stored_password = result
    print(f"Username: {username}")
    print(f"Stored password: {stored_password}")
    
    # Check if it's already hashed (SHA-256 is 64 characters)
    if len(stored_password) == 64:
        print("Password appears to be already hashed (SHA-256)")
    else:
        print("Password appears to be plain text")
        # Hash the plain text to see what it should be
        hashed = hashlib.sha256(stored_password.encode()).hexdigest()
        print(f"Would hash to: {hashed}")
        
    # Test the hash for "password123"
    test_hash = hashlib.sha256("password123".encode()).hexdigest()
    print(f"password123 hashes to: {test_hash}")
    print(f"Passwords match: {stored_password == test_hash}")
else:
    print("User not found")

conn.close()