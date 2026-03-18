from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.module import Module
from app.models.course import Course
from app.schemas.module import ModuleCreate, ModuleUpdate, ModuleOut

router = APIRouter(prefix="/courses/{course_id}/modules", tags=["Módulos"])


def _get_course_or_404(course_id: int, db: Session):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    return course


@router.get("/", response_model=list[ModuleOut])
def list_modules(course_id: int, db: Session = Depends(get_db)):
    _get_course_or_404(course_id, db)
    return db.query(Module).filter(Module.course_id == course_id).order_by(Module.order_index).all()


@router.post("/", response_model=ModuleOut, status_code=status.HTTP_201_CREATED)
def create_module(course_id: int, data: ModuleCreate, db: Session = Depends(get_db)):
    _get_course_or_404(course_id, db)
    module = Module(course_id=course_id, **data.model_dump())
    db.add(module)
    db.commit()
    db.refresh(module)
    return module


@router.get("/{module_id}", response_model=ModuleOut)
def get_module(course_id: int, module_id: int, db: Session = Depends(get_db)):
    module = db.query(Module).filter(Module.id == module_id, Module.course_id == course_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Módulo no encontrado")
    return module


@router.patch("/{module_id}", response_model=ModuleOut)
def update_module(course_id: int, module_id: int, data: ModuleUpdate, db: Session = Depends(get_db)):
    module = db.query(Module).filter(Module.id == module_id, Module.course_id == course_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Módulo no encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(module, field, value)
    db.commit()
    db.refresh(module)
    return module


@router.delete("/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_module(course_id: int, module_id: int, db: Session = Depends(get_db)):
    module = db.query(Module).filter(Module.id == module_id, Module.course_id == course_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Módulo no encontrado")
    db.delete(module)
    db.commit()
