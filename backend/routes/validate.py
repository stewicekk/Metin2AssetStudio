from fastapi import APIRouter, UploadFile, File
from mse_parser import parse_mse, validate_mse

router = APIRouter(prefix="/api/validate", tags=["validate"])


@router.post("")
async def validate_effect(file: UploadFile = File(...)):
    content = await file.read()
    text = content.decode("utf-8", errors="replace")
    issues = validate_mse(text)
    issues.append(f"File: {file.filename}")
    return {
        "filename": file.filename,
        "valid": len(issues) == 0,
        "issues": issues,
    }


@router.post("/parse")
async def parse_effect(file: UploadFile = File(...)):
    content = await file.read()
    text = content.decode("utf-8", errors="replace")
    result = parse_mse(text)
    return {
        "filename": file.filename,
        "data": result,
    }
