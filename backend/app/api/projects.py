from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.database import get_db
from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate

router = APIRouter(prefix="/projects", tags=["projects"])


def serialize(project: Project) -> ProjectResponse:
    return ProjectResponse.model_validate({**project.__dict__, "task_count": len(project.tasks)})


@router.get("", response_model=list[ProjectResponse])
def list_projects(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return [serialize(item) for item in db.scalars(select(Project).where(Project.owner_id == user.id).order_by(Project.created_at.desc())).all()]


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = Project(**payload.model_dump(), owner_id=user.id)
    db.add(project)
    db.commit()
    db.refresh(project)
    return serialize(project)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.scalar(select(Project).where(Project.id == project_id, Project.owner_id == user.id))
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return serialize(project)


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: int, payload: ProjectUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.scalar(select(Project).where(Project.id == project_id, Project.owner_id == user.id))
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, key, value)
    db.commit()
    db.refresh(project)
    return serialize(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.scalar(select(Project).where(Project.id == project_id, Project.owner_id == user.id))
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
