from backend.db.firebase_db import firebase_db

def seed_database():
    print("[*] Seeding Firebase database collections...")
    firebase_db.seed_initial_data()
    print("[SUCCESS] Firebase database initialized and ready.")

if __name__ == "__main__":
    seed_database()
