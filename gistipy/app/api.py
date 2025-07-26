from fastapi import FastAPI, Request, Query, Form,  HTTPException, UploadFile, File, Query
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse, StreamingResponse, RedirectResponse, JSONResponse
from fastapi import FastAPI, Query, Request, HTTPException 
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.templating import Jinja2Templates
from typing import List, Optional
import os
import json
import gzip
import io
from pathlib import Path

app = FastAPI(title="JennyCloud MarkDown", version="0.0.1",docs="/docs",rdoc="/rdoc")



# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static frontend
app.mount("/static", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "../static")), name="static")
templates = Jinja2Templates(directory=os.path.join(os.path.dirname(__file__), "../templates"))


# Configuration
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)



@app.get("/", response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse(
        "index.html",
        {"request": request}
    )
  

class FileContent(BaseModel):
    content: str

class FileCreate(BaseModel):
    filename: str
    content: str

class FileInfo(BaseModel):
    filename: str
    filetype: str
    size: int
    modified: str

class FolderInfo(BaseModel):
    name: str
    files: List[FileInfo]

@app.get("/")
async def root():
    return FileResponse("index.html")

@app.get("/api/files")
async def get_files():
    """Get list of all files organized by folders"""
    try:
        files = []
        folders = {}
        
        # Scan upload directory
        for file_path in UPLOAD_DIR.rglob("*"):
            if file_path.is_file():
                relative_path = file_path.relative_to(UPLOAD_DIR)
                parent_dir = str(relative_path.parent) if relative_path.parent != Path(".") else "root"
                
                file_info = FileInfo(
                    filename=file_path.name,
                    filetype=file_path.suffix.lstrip('.') or 'txt',
                    size=file_path.stat().st_size,
                    modified=file_path.stat().st_mtime
                )
                
                if parent_dir == "root":
                    files.append(file_info)
                else:
                    files.append(file_info)
                    #f parent_dir not in folders:
                    #    folders[parent_dir] = []
                    folders[parent_dir].append(file_info)
        
        return {
            "files": files,
            "folders": [{"name": name, "files": folder_files} for name, folder_files in folders.items()]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/files/{filename}")
async def get_file_content(filename: str):
    """Get content of a specific file"""
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return content
    except UnicodeDecodeError:
        # Handle binary files
        with open(file_path, 'rb') as f:
            content = f.read()
        return {"error": "Binary file cannot be displayed as text", "size": len(content)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/files")
async def create_file(file_data: FileCreate):
    """Create a new file"""
    file_path = UPLOAD_DIR / file_data.filename
    
    if file_path.exists():
        raise HTTPException(status_code=409, detail="File already exists")
    
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(file_data.content)
        return {"message": "File created successfully", "filename": file_data.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/files/{filename}")
async def update_file(filename: str, file_content: FileContent):
    """Update content of an existing file"""
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(file_content.content)
        return {"message": "File updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/files/{filename}")
async def delete_file(filename: str):
    """Delete a file"""
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        file_path.unlink()
        return {"message": "File deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/files/{filename}/download")
async def download_file(filename: str):
    """Download a file"""
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type='application/octet-stream'
    )

@app.post("/api/files/{filename}/compress")
async def compress_file(filename: str):
    """Compress a file using gzip"""
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        with open(file_path, 'rb') as f:
            file_content = f.read()
        
        compressed_content = gzip.compress(file_content)
        compressed_filename = f"{filename}.gz"
        compressed_path = UPLOAD_DIR / compressed_filename
        
        with open(compressed_path, 'wb') as f:
            f.write(compressed_content)
        
        return {"message": "File compressed successfully", "compressed_filename": compressed_filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/files/search")
async def search_files(q: str = Query(..., description="Search query")):
    """Search for files by content or filename"""
    try:
        results = []
        
        for file_path in UPLOAD_DIR.rglob("*"):
            if file_path.is_file():
                # Search in filename
                if q.lower() in file_path.name.lower():
                    results.append({
                        "filename": file_path.name,
                        "match_type": "filename",
                        "path": str(file_path.relative_to(UPLOAD_DIR))
                    })
                
                # Search in content (text files only)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if q.lower() in content.lower():
                            results.append({
                                "filename": file_path.name,
                                "match_type": "content",
                                "path": str(file_path.relative_to(UPLOAD_DIR))
                            })
                except (UnicodeDecodeError, PermissionError):
                    # Skip binary files or files without read permission
                    pass
        
        return {"query": q, "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/files/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a new file"""
    file_path = f"{UPLOAD_DIR}/{file.filename}"
    
    if file_path.exists():
        raise HTTPException(status_code=409, detail="File already exists")
    
    try:
        with open(file_path, 'wb') as f:
            content = await file.read()
            f.write(content)
        
        return {"message": "File uploaded successfully", "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)