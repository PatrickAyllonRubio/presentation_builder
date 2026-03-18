import os
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from app.database import get_db
from app.models.presentation import Presentation
from app.models.module import Module
from app.models.resource import Resource
from app.schemas.presentation import PresentationCreate, PresentationUpdate, PresentationOut, ResourceOut

load_dotenv()
STORAGE_PATH = os.getenv("STORAGE_PATH", "./storage")

ALLOWED_TYPES = {
    "image": ["image/jpeg", "image/png", "image/webp"],
    "svg":   ["image/svg+xml"],
    "video": ["video/mp4", "video/webm"],
    "audio": ["audio/mpeg", "audio/mp3", "audio/wav"],
}

router = APIRouter(prefix="/modules/{module_id}/presentations", tags=["Presentaciones"])


def _get_module_or_404(module_id: int, db: Session):
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Módulo no encontrado")
    return module


def _get_presentation_or_404(presentation_id: int, module_id: int, db: Session):
    p = db.query(Presentation).filter(
        Presentation.id == presentation_id,
        Presentation.module_id == module_id
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Presentación no encontrada")
    return p


def _presentation_storage_path(course_id: int, module_id: int, presentation_id: int) -> str:
    return os.path.join(STORAGE_PATH, "courses", str(course_id), "modules", str(module_id), "presentations", str(presentation_id))


# ── CRUD Presentaciones ───────────────────────────────────────────────────────

@router.get("/", response_model=list[PresentationOut])
def list_presentations(module_id: int, db: Session = Depends(get_db)):
    _get_module_or_404(module_id, db)
    return db.query(Presentation).filter(Presentation.module_id == module_id).order_by(Presentation.order_index).all()


@router.post("/", response_model=PresentationOut, status_code=status.HTTP_201_CREATED)
def create_presentation(module_id: int, data: PresentationCreate, db: Session = Depends(get_db)):
    _get_module_or_404(module_id, db)
    presentation = Presentation(module_id=module_id, **data.model_dump())
    db.add(presentation)
    db.commit()
    db.refresh(presentation)
    return presentation


@router.get("/{presentation_id}", response_model=PresentationOut)
def get_presentation(module_id: int, presentation_id: int, db: Session = Depends(get_db)):
    return _get_presentation_or_404(presentation_id, module_id, db)


@router.patch("/{presentation_id}", response_model=PresentationOut)
def update_presentation(module_id: int, presentation_id: int, data: PresentationUpdate, db: Session = Depends(get_db)):
    presentation = _get_presentation_or_404(presentation_id, module_id, db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(presentation, field, value)
    db.commit()
    db.refresh(presentation)
    return presentation


@router.delete("/{presentation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_presentation(module_id: int, presentation_id: int, db: Session = Depends(get_db)):
    presentation = _get_presentation_or_404(presentation_id, module_id, db)
    # Eliminar archivos físicos
    module = db.query(Module).filter(Module.id == module_id).first()
    folder = _presentation_storage_path(module.course_id, module_id, presentation_id)
    if os.path.exists(folder):
        shutil.rmtree(folder)
    db.delete(presentation)
    db.commit()


# ── Recursos (upload de archivos) ─────────────────────────────────────────────

@router.get("/{presentation_id}/resources", response_model=list[ResourceOut])
def list_resources(module_id: int, presentation_id: int, db: Session = Depends(get_db)):
    _get_presentation_or_404(presentation_id, module_id, db)
    return db.query(Resource).filter(Resource.presentation_id == presentation_id).all()


@router.post("/{presentation_id}/resources", response_model=ResourceOut, status_code=status.HTTP_201_CREATED)
async def upload_resource(
    module_id: int,
    presentation_id: int,
    resource_type: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    presentation = _get_presentation_or_404(presentation_id, module_id, db)
    module = db.query(Module).filter(Module.id == module_id).first()

    # Validar tipo
    if resource_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Tipo inválido. Permitidos: {list(ALLOWED_TYPES.keys())}")
    if file.content_type not in ALLOWED_TYPES[resource_type]:
        raise HTTPException(status_code=400, detail=f"Formato no permitido para tipo '{resource_type}'")

    # Carpeta de destino: storage/courses/{id}/modules/{id}/presentations/{id}/{tipo}s/
    folder = os.path.join(
        _presentation_storage_path(module.course_id, module_id, presentation_id),
        f"{resource_type}s"
    )
    os.makedirs(folder, exist_ok=True)

    # Nombre único para evitar colisiones
    ext = os.path.splitext(file.filename)[1]
    stored_name = f"{uuid.uuid4().hex}{ext}"
    stored_path = os.path.join(folder, stored_name)

    with open(stored_path, "wb") as f:
        content = await file.read()
        f.write(content)

    resource = Resource(
        presentation_id=presentation_id,
        type=resource_type,
        original_name=file.filename,
        stored_path=stored_path,
        mime_type=file.content_type,
        size_bytes=len(content),
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource


@router.delete("/{presentation_id}/resources/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resource(module_id: int, presentation_id: int, resource_id: int, db: Session = Depends(get_db)):
    _get_presentation_or_404(presentation_id, module_id, db)
    resource = db.query(Resource).filter(
        Resource.id == resource_id,
        Resource.presentation_id == presentation_id
    ).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")
    if os.path.exists(resource.stored_path):
        os.remove(resource.stored_path)
    db.delete(resource)
    db.commit()
