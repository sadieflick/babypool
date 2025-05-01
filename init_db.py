import sqlite3
import os

# Create and initialize the database
def init_db():
    # Connect to the database (will create it if it doesn't exist)
    conn = sqlite3.connect('baby_shower_game.db')
    
    # Read schema file
    with open('schema.sql') as f:
        conn.executescript(f.read())
    
    # Commit changes and close the connection
    conn.commit()
    conn.close()
    
    print("Database initialized successfully!")

if __name__ == '__main__':
    init_db()