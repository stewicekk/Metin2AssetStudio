from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path
import json
import uuid
from datetime import datetime, timezone
from config import PROJECTS_DIR

router = APIRouter(prefix="/api/projects", tags=["projects"])


class ProjectCreate(BaseModel):
    name: str
    data: str


class ProjectUpdate(BaseModel):
    name: str | None = None
    data: str | None = None


def _list_projects() -> list[dict]:
    projects: list[dict] = []
    for f in PROJECTS_DIR.glob("*.json"):
        try:
            with open(f, "r", encoding="utf-8") as fh:
                p = json.load(fh)
            projects.append({
                "id": f.stem,
                "name": p.get("name", f.stem),
                "updated": p.get("updated", ""),
                "size": len(json.dumps(p)),
            })
        except Exception:
            pass
    projects.sort(key=lambda x: x["updated"], reverse=True)
    return projects


@router.get("")
async def list_projects():
    return _list_projects()


@router.get("/{project_id}")
async def get_project(project_id: str):
    filepath = PROJECTS_DIR / f"{project_id}.json"
    if not filepath.exists():
        raise HTTPException(404, "Project not found")
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


@router.post("")
async def create_project(project: ProjectCreate):
    project_id = uuid.uuid4().hex[:12]
    now = datetime.now(timezone.utc).isoformat()
    data = {
        "id": project_id,
        "name": project.name,
        "data": project.data,
        "created": now,
        "updated": now,
    }
    filepath = PROJECTS_DIR / f"{project_id}.json"
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    return {"id": project_id, "name": project.name}


@router.put("/{project_id}")
async def update_project(project_id: str, project: ProjectUpdate):
    filepath = PROJECTS_DIR / f"{project_id}.json"
    if not filepath.exists():
        raise HTTPException(404, "Project not found")
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    if project.name is not None:
        data["name"] = project.name
    if project.data is not None:
        data["data"] = project.data
    data["updated"] = datetime.now(timezone.utc).isoformat()
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    return {"status": "ok"}


@router.delete("/{project_id}")
async def delete_project(project_id: str):
    filepath = PROJECTS_DIR / f"{project_id}.json"
    if not filepath.exists():
        raise HTTPException(404, "Project not found")
    filepath.unlink()
    return {"status": "deleted"}
