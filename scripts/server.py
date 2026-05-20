# scripts/server.py
from fastapi import FastAPI, UploadFile, File
import subprocess
import json
import uvicorn
import os

app = FastAPI()

@app.post("/parse-mse")
async def parse_mse(file: UploadFile = File(...)):
    content = await file.read()
    # Uložení dočasného souboru
    with open("temp.mse", "wb") as f:
        f.write(content)
    # Volání existujícího parseru
    result = subprocess.run(["python", "scripts/mse_parser.py", "temp.mse"], capture_output=True, text=True)
    return json.loads(result.stdout)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
