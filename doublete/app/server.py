from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
import json
import asyncio
import random
from typing import List

app = FastAPI()

# Sample journal entries
ALTERNATE_ENTRIES = [
    "0xBEBACAFE 0xBEBACAFE 0xBEBACAFE 0xBEBACAFE 0xBEBACAFE 0xBEBACAFE ",
    "0xBEBACAFE 0xBEBACAFE 0xBEBACAFE 0xBEBACAFE 0xBEBACAFE 0xBEBACAFE "
 
]

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                # Remove disconnected clients
                self.active_connections.remove(connection)

manager = ConnectionManager()

@app.websocket("/ws/reverse-search")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                
                if message.get("type") == "request_batch":
                    # Send initial batch of entries
                    entries = []
                    for i, entry in enumerate(ALTERNATE_ENTRIES[:50]):  # Send first 50
                        entries.append({
                            "id": f"entry_{i}",
                            "text": entry,
                            "relevance": (99 - i) / 100,
                            "timeline": random.randint(100000, 999999)
                        })
                    
                    response = {
                        "type": "batch_entries",
                        "entries": entries
                    }
                    await manager.send_personal_message(json.dumps(response), websocket)
                    
                    # Start sending periodic new entries
                    asyncio.create_task(send_periodic_entries(websocket))
                    
            except json.JSONDecodeError:
                await manager.send_personal_message(
                    json.dumps({"type": "error", "message": "Invalid JSON"}), 
                    websocket
                )
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)

async def send_periodic_entries(websocket: WebSocket):
    """Send new entries periodically to simulate real-time updates"""
    try:
        await asyncio.sleep(5)  # Wait 5 seconds before starting
        
        remaining_entries = ALTERNATE_ENTRIES[50:]  # Remaining entries
        
        for i, entry in enumerate(remaining_entries):
            if websocket not in manager.active_connections:
                break
                
            new_entry = {
                "type": "new_entry",
                "entry": entry,
                "relevance": random.uniform(0.7, 0.99),
                "timeline": random.randint(100000, 999999)
            }
            
            try:
                await manager.send_personal_message(json.dumps(new_entry), websocket)
                await asyncio.sleep(random.uniform(2, 8))  # Random delay between entries
            except:
                break
                
    except Exception as e:
        print(f"Error in periodic entries: {e}")

@app.get("/")
async def get():
    return HTMLResponse(open("index.html").read())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
