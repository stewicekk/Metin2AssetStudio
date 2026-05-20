from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import json
from config import FRONTEND_DIST, PORT, HOST
from routes.projects import router as projects_router
from routes.validate import router as validate_router
from routes.fixtures import router as fixtures_router
from routes.export import router as export_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="Metin2 Asset Studio API",
    version="1.1.0",
    lifespan=lifespan,
)

app.include_router(projects_router)
app.include_router(validate_router)
app.include_router(fixtures_router)
app.include_router(export_router)


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "version": "1.1.0",
        "python": True,
    }


@app.get("/api/stats")
async def stats():
    from config import ANALYZE_MSE
    fixtures = list(ANALYZE_MSE.glob("*.mse")) if ANALYZE_MSE.exists() else []
    from config import PROJECTS_DIR
    projects = list(PROJECTS_DIR.glob("*.json"))
    return {
        "fixtures": len(fixtures),
        "projects": len(projects),
    }


if FRONTEND_DIST.exists() and (FRONTEND_DIST / "index.html").exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    for static_dir in ["public"]:
        p = FRONTEND_DIST / static_dir
        if p.exists():
            app.mount(f"/{static_dir}", StaticFiles(directory=str(p)), name=static_dir)

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            from fastapi.responses import JSONResponse
            return JSONResponse({"error": "Not found"}, status_code=404)
        filepath = FRONTEND_DIST / full_path
        if filepath.exists() and filepath.is_file():
            return FileResponse(str(filepath))
        return FileResponse(str(FRONTEND_DIST / "index.html"))
else:
    @app.get("/")
    async def root():
        return {"status": "ok", "message": "Frontend not built. Run: cd frontend && npm run build"}


def run():
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)


if __name__ == "__main__":
    run()
