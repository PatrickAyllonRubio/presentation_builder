from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cerv_courses.db")

# Render/Neon usan "postgres://" pero SQLAlchemy necesita "postgresql://"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# psycopg2 no soporta channel_binding — lo eliminamos si viene en la URL
if "channel_binding" in DATABASE_URL:
    from urllib.parse import urlparse, urlencode, parse_qs, urlunparse
    parsed = urlparse(DATABASE_URL)
    params = {k: v for k, v in parse_qs(parsed.query).items() if k != "channel_binding"}
    clean_query = urlencode({k: v[0] for k, v in params.items()})
    DATABASE_URL = urlunparse(parsed._replace(query=clean_query))

# connect_args solo es necesario para SQLite
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

# Neon cierra conexiones inactivas — pool_pre_ping las reconecta automáticamente
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


# Dependency para inyectar la sesión de BD en cada endpoint
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
