from fastapi import APIRouter
from pydantic import BaseModel
from config import ANALYZE_MSE

router = APIRouter(prefix="/api/fixtures", tags=["fixtures"])


@router.get("")
async def list_fixtures(search: str | None = None, category: str | None = None):
    if not ANALYZE_MSE.exists():
        return {"fixtures": [], "total": 0}

    files = list(ANALYZE_MSE.glob("*.mse"))
    result = []
    categories: set[str] = set()

    for f in files:
        name = f.stem
        ext = f.suffix
        size = f.stat().st_size

        if search and search.lower() not in name.lower():
            continue

        cat = "default"
        if "_" in name:
            parts = name.split("_")
            if parts[0].isdigit():
                cat = "skill"
            elif "armor" in name.lower():
                cat = "armor"
        categories.add(cat)

        if category and category != cat:
            continue

        result.append({
            "name": name,
            "ext": ext,
            "size": size,
            "category": cat,
        })

    return {
        "fixtures": result,
        "total": len(result),
        "categories": sorted(categories),
    }


@router.get("/{fixture_name}")
async def get_fixture(fixture_name: str):
    filepath = ANALYZE_MSE / f"{fixture_name}.mse"
    if not filepath.exists():
        filepath = ANALYZE_MSE / fixture_name

    if not filepath.exists():
        from fastapi import HTTPException
        raise HTTPException(404, f"Fixture '{fixture_name}' not found")

    content = filepath.read_text(encoding="utf-8", errors="replace")
    return {"name": filepath.stem, "content": content, "size": filepath.stat().st_size}
