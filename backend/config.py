import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent

PORT = int(os.environ.get("PORT", "8000"))
HOST = os.environ.get("HOST", "0.0.0.0")
NODE_ENV = os.environ.get("NODE_ENV", "development")

PROJECTS_DIR = ROOT / "projects"
PROJECTS_DIR.mkdir(exist_ok=True)

FRONTEND_DIST = ROOT.parent / "frontend" / "dist"
ANALYZE_MSE = ROOT.parent / "frontend" / "public" / "analyze-mse"
