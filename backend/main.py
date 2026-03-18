from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.database import engine, Base
from app.routers import courses, modules, presentations

# Importar modelos para que SQLAlchemy los registre y cree las tablas
import app.models  # noqa: F401

load_dotenv()

# Crear todas las tablas al iniciar (equivalente a migrate en desarrollo)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CERV - Generador de Cursos",
    description="API para gestión de cursos, módulos y presentaciones",
    version="1.0.0",
)

# CORS: permite que el frontend React en localhost:5173 se comunique con la API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(courses.router, prefix="/api")
app.include_router(modules.router, prefix="/api")
app.include_router(presentations.router, prefix="/api")


@app.get("/")
def root():
    return {"status": "ok", "message": "CERV API funcionando"}
