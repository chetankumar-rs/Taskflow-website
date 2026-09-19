from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.database import get_db
from app.models.project import Project
from app.models.task import Task
from app.models.user import User
from app.schemas.dashboard import DashboardResponse

router = APIRouter(prefix="/dashboard1", tags=["dashboard"])


@router.get("", response_model=DashboardResponse)
def dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    projects = db.scalars(select(Project).where(Project.owner_id == user.id)).all()
    tasks = db.scalars(select(Task).join(Project).where(Project.owner_id == user.id)).all()
    recent = sorted(tasks, key=lambda task: task.updated_at, reverse=True)[:5]
    return DashboardResponse(
        total_projects=len(projects),
        total_tasks=len(tasks),
        completed_tasks=sum(task.status == "DONE" for task in tasks),
        pending_tasks=sum(task.status != "DONE" for task in tasks),
        tasks_by_status=dict(Counter(task.status for task in tasks)),
        tasks_by_priority=dict(Counter(task.priority for task in tasks)),
        recent_tasks=[{"id": task.id, "title": task.title, "status": task.status, "priority": task.priority, "project_id": task.project_id} for task in recent],
    )
