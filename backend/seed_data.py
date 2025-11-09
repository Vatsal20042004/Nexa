"""
Seed database with demo users and team structure.
Run this script to create test users including a team leader.
"""
import sys
import os

# Add backend to path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from models.database import db
from services.auth_service import AuthService

def seed_users():
    """Create demo users for testing."""
    auth_service = AuthService(db)
    
    print("🌱 Seeding database with demo users...\n")
    
    users_to_create = [
        # Team Leader
        {
            "username": "team_leader",
            "password": "leader123",
            "name": "John Leader",
            "role": "team_leader"
        },
        # Team Members (Employees)
        {
            "username": "alice_dev",
            "password": "password123",
            "name": "Alice Johnson",
            "role": "employee"
        },
        {
            "username": "bob_dev",
            "password": "password123",
            "name": "Bob Smith",
            "role": "employee"
        },
        {
            "username": "carol_designer",
            "password": "password123",
            "name": "Carol Williams",
            "role": "employee"
        },
        {
            "username": "dave_qa",
            "password": "password123",
            "name": "Dave Brown",
            "role": "employee"
        },
        {
            "username": "eve_frontend",
            "password": "password123",
            "name": "Eve Davis",
            "role": "employee"
        },
    ]
    
    created_users = []
    
    for user_data in users_to_create:
        success, message, user_id = auth_service.register_user(
            username=user_data["username"],
            password=user_data["password"],
            name=user_data["name"],
            role=user_data["role"]
        )
        
        if success:
            print(f"✅ Created: {user_data['name']} ({user_data['username']}) - Role: {user_data['role']}")
            created_users.append({
                "id": user_id,
                "username": user_data["username"],
                "password": user_data["password"],
                "name": user_data["name"],
                "role": user_data["role"]
            })
        else:
            print(f"⚠️  {user_data['username']}: {message}")
    
    print(f"\n✅ Successfully created {len(created_users)} users!")
    return created_users


def seed_team_members(created_users):
    """Add team members to the team leader."""
    print("\n🔗 Creating team relationships...\n")
    
    # Find team leader and employees
    team_leader = next((u for u in created_users if u["role"] == "team_leader"), None)
    employees = [u for u in created_users if u["role"] == "employee"]
    
    if not team_leader:
        print("⚠️  No team leader found. Skipping team member creation.")
        return
    
    conn = db.get_connection()
    cursor = conn.cursor()
    
    role_mapping = {
        "alice_dev": "Senior Developer",
        "bob_dev": "Backend Developer",
        "carol_designer": "UI/UX Designer",
        "dave_qa": "QA Engineer",
        "eve_frontend": "Frontend Developer"
    }
    
    for emp in employees:
        try:
            role = role_mapping.get(emp["username"], "Team Member")
            email = f"{emp['username']}@company.com"
            
            cursor.execute("""
                INSERT INTO team_members (team_leader_id, member_user_id, role, email)
                VALUES (?, ?, ?, ?)
            """, (team_leader["id"], emp["id"], role, email))
            
            print(f"✅ Added {emp['name']} to team as {role}")
        except Exception as e:
            if "UNIQUE constraint failed" in str(e):
                print(f"⚠️  {emp['name']} already in team")
            else:
                print(f"❌ Error adding {emp['name']}: {e}")
    
    conn.commit()
    conn.close()
    
    print(f"\n✅ Team setup complete!")


def print_login_credentials(created_users):
    """Print login credentials for easy copy-paste."""
    print("\n" + "=" * 60)
    print("🔐 LOGIN CREDENTIALS")
    print("=" * 60)
    
    # Team Leader
    team_leaders = [u for u in created_users if u["role"] == "team_leader"]
    if team_leaders:
        print("\n👨‍💼 TEAM LEADER:")
        for tl in team_leaders:
            print(f"   Username: {tl['username']}")
            print(f"   Password: {tl['password']}")
            print(f"   Name:     {tl['name']}")
    
    # Employees
    employees = [u for u in created_users if u["role"] == "employee"]
    if employees:
        print("\n👥 TEAM MEMBERS:")
        for emp in employees:
            print(f"\n   Username: {emp['username']}")
            print(f"   Password: {emp['password']}")
            print(f"   Name:     {emp['name']}")
    
    print("\n" + "=" * 60)
    print("ℹ️  Login at: http://localhost:5000/login")
    print("=" * 60 + "\n")


def main():
    """Main seed function."""
    print("\n" + "🚀 " * 20)
    print("EMPLOYEE TRACKING SYSTEM - DATABASE SEEDER")
    print("🚀 " * 20 + "\n")
    
    # Create users
    created_users = seed_users()
    
    if not created_users:
        print("\n❌ No users were created. Exiting.")
        return
    
    # Create team relationships
    seed_team_members(created_users)
    
    # Print credentials
    print_login_credentials(created_users)
    
    print("✨ Database seeding complete!\n")
    print("Next steps:")
    print("1. Start backend: cd backend && python main.py")
    print("2. Start frontend: cd frontend && npm run dev")
    print("3. Login with credentials above")
    print("4. Access Team Leader features from the sidebar!\n")


if __name__ == "__main__":
    main()
