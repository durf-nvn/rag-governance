from database import SessionLocal
import models
import utils

def create_superuser():
    # Open a connection to your Supabase database
    db = SessionLocal()
    
    admin_email = "admin@ctu.edu.ph"
    
    try:
        # Check if the admin already exists so we don't duplicate it
        existing_admin = db.query(models.User).filter(models.User.email == admin_email).first()
        
        if existing_admin:
            print(f"⚠️ Admin account ({admin_email}) already exists!")
            return

        # Securely hash the default password
        hashed_pwd = utils.hash_password("admin12345") 

        # Create the Superuser account
        new_admin = models.User(
            email=admin_email,
            full_name="CTU System Administrator",
            hashed_password=hashed_pwd,
            role="ADMIN",
            is_verified=True  # Admins bypass the lock!
        )
        
        db.add(new_admin)
        db.commit()
        print("✅ Superuser Admin account created successfully!")
        
    except Exception as e:
        print(f"❌ Error creating admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_superuser()