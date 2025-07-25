from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from cassandra.cluster import Cluster
from cassandra.auth import PlainTextAuthProvider
import uuid
from datetime import datetime
from typing import Optional, List
import json
import os

app = FastAPI()

# Static files and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# ScyllaDB connection
def get_db_session():
    # Configure for local ScyllaDB - adjust for your setup
    cluster = Cluster(['127.0.0.1'], port=9042)
    session = cluster.connect()
    
    # Create keyspace if not exists
    session.execute("""
        CREATE KEYSPACE IF NOT EXISTS jennycloud 
        WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}
    """)
    
    session.set_keyspace('jennycloud')
    
    # Create tables if not exist
    session.execute("""
        CREATE TABLE IF NOT EXISTS notes (
            id UUID PRIMARY KEY,
            content TEXT,
            color TEXT,
            is_public BOOLEAN,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )
    """)
    
    session.execute("""
        CREATE TABLE IF NOT EXISTS public_notes (
            id UUID PRIMARY KEY,
            content TEXT,
            color TEXT,
            shared_at TIMESTAMP
        )
    """)
    
    return session

session = get_db_session()

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/notes")
async def get_notes(request: Request):
    rows = session.execute("SELECT * FROM notes ORDER BY created_at DESC")
    notes = []
    for row in rows:
        notes.append({
            'id': str(row.id),
            'content': row.content,
            'color': row.color or 'default',
            'is_public': row.is_public or False,
            'created_at': row.created_at,
            'updated_at': row.updated_at
        })
    return templates.TemplateResponse("notes_list.html", {"request": request, "notes": notes})

@app.post("/notes")
async def create_note(request: Request):
    note_id = uuid.uuid4()
    now = datetime.now()
    
    session.execute("""
        INSERT INTO notes (id, content, color, is_public, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (note_id, '', 'default', False, now, now))
    
    note = {
        'id': str(note_id),
        'content': '',
        'color': 'default',
        'is_public': False,
        'created_at': now,
        'updated_at': now
    }
    
    return templates.TemplateResponse("note_card.html", {"request": request, "note": note, "editable": True})

@app.put("/notes/{note_id}")
async def update_note(note_id: str, content: str = Form(...)):
    try:
        note_uuid = uuid.UUID(note_id)
        now = datetime.now()
        
        session.execute("""
            UPDATE notes SET content = ?, updated_at = ? WHERE id = ?
        """, (content, now, note_uuid))
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/notes/{note_id}/color")
async def update_note_color(note_id: str, color: str = Form(...)):
    try:
        note_uuid = uuid.UUID(note_id)
        now = datetime.now()
        
        session.execute("""
            UPDATE notes SET color = ?, updated_at = ? WHERE id = ?
        """, (color, now, note_uuid))
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/notes/{note_id}")
async def delete_note(note_id: str):
    try:
        note_uuid = uuid.UUID(note_id)
        session.execute("DELETE FROM notes WHERE id = ?", (note_uuid,))
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/notes/{note_id}/share")
async def share_note(request: Request, note_id: str):
    try:
        note_uuid = uuid.UUID(note_id)
        
        # Get the note
        row = session.execute("SELECT * FROM notes WHERE id = ?", (note_uuid,)).one()
        if not row:
            raise HTTPException(status_code=404, detail="Note not found")
        
        # Mark as public
        session.execute("UPDATE notes SET is_public = ? WHERE id = ?", (True, note_uuid))
        
        # Add to public notes
        session.execute("""
            INSERT INTO public_notes (id, content, color, shared_at)
            VALUES (?, ?, ?, ?)
        """, (note_uuid, row.content, row.color, datetime.now()))
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/public-notes")
async def get_public_notes(request: Request):
    rows = session.execute("SELECT * FROM public_notes ORDER BY shared_at DESC")
    notes = []
    for row in rows:
        notes.append({
            'id': str(row.id),
            'content': row.content,
            'color': row.color or 'default',
            'shared_at': row.shared_at
        })
    return templates.TemplateResponse("public_notes_list.html", {"request": request, "notes": notes})

@app.post("/notes/{note_id}/copy")
async def copy_note_to_board(request: Request, note_id: str):
    try:
        # Get the public note
        note_uuid = uuid.UUID(note_id)
        row = session.execute("SELECT * FROM public_notes WHERE id = ?", (note_uuid,)).one()
        if not row:
            raise HTTPException(status_code=404, detail="Public note not found")
        
        # Create new note in personal notes
        new_id = uuid.uuid4()
        now = datetime.now()
        
        session.execute("""
            INSERT INTO notes (id, content, color, is_public, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (new_id, row.content, row.color, False, now, now))
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
