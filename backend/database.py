import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("civictrack_db")

# PostgreSQL Database Configuration
# Default: postgresql://postgres:postgres@localhost:5432/civictrack or postgresql://aswanthss@localhost:5432/civictrack
POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "civictrack")

POSTGRES_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
ALT_POSTGRES_URL = f"postgresql://aswanthss@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
SQLITE_FALLBACK_URL = "sqlite:///./civictrack.db"

# Allow override via DATABASE_URL env var
DATABASE_URL = os.getenv("DATABASE_URL", POSTGRES_URL)

engine = None
SessionLocal = None

def init_db_engine():
    global engine, SessionLocal
    urls_to_try = [DATABASE_URL, ALT_POSTGRES_URL, f"postgresql://postgres@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}", SQLITE_FALLBACK_URL]
    
    for url in urls_to_try:
        try:
            logger.info(f"Attempting database connection to: {url}")
            if url.startswith("sqlite"):
                temp_engine = create_engine(url, connect_args={"check_same_thread": False})
            else:
                temp_engine = create_engine(url, pool_pre_ping=True)
            
            # Test connection
            with temp_engine.connect() as conn:
                pass
            
            engine = temp_engine
            SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
            logger.info(f"✅ Successfully connected to database: {url}")
            return engine
        except Exception as e:
            logger.warning(f"Failed to connect to {url}: {e}")

    # Fallback to SQLite if PostgreSQL fails
    logger.info("Using SQLite fallback engine...")
    engine = create_engine(SQLITE_FALLBACK_URL, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return engine

engine = init_db_engine()
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
