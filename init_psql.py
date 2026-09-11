import os
import subprocess
import time
import psycopg2

def initialize_postgres():
    print("Checking PostgreSQL database connection...")
    try:
        conn = psycopg2.connect("dbname=civictrack host=localhost port=5432")
        print("✅ Connected to PostgreSQL database 'civictrack'!")
        conn.close()
        return True
    except Exception as e:
        print(f"Database connection attempt 1: {e}")

    # Try connecting to postgres default db to create civictrack db
    try:
        conn = psycopg2.connect("dbname=postgres host=localhost port=5432")
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM pg_database WHERE datname='civictrack'")
        exists = cur.fetchone()
        if not exists:
            cur.execute("CREATE DATABASE civictrack;")
            print("✅ Created PostgreSQL database 'civictrack'!")
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Could not connect to postgres server: {e}")
        return False

if __name__ == "__main__":
    initialize_postgres()
