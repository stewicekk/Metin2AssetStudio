from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from config import FRONTEND_DIST, PORT, HOST

router = APIRouter(prefix="/api/export", tags=["export"])


class ExportRequest(BaseModel):
    format: str
    content: str
    name: str = "export"


@router.post("")
async def export_file(req: ExportRequest):
    if req.format not in ("mse", "eff", "mde", "json"):
        raise HTTPException(400, f"Unsupported format: {req.format}")
    return {
        "data": req.content,
        "ext": req.format,
        "name": f"{req.name}.{req.format}",
        "size": len(req.content),
    }


@router.get("/health")
async def health():
    fe_exists = FRONTEND_DIST.exists()
    fe_index = (FRONTEND_DIST / "index.html").exists() if fe_exists else False
    return {
        "status": "ok",
        "version": "1.1.0",
        "frontend": {"exists": fe_exists, "has_index": fe_index},
        "server": {"host": HOST, "port": PORT},
    }
