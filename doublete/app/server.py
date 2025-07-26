from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
import json
import asyncio
import random
from typing import List

app = FastAPI()

# Sample journal entries
ALTERNATE_ENTRIES = [
    "The parallel universe where I became a professional dream collector",
    "How the multiverse split when I sneezed during a quantum experiment",
    "My adventures in reverse chronological baking",
    "The timeline where my shadow started giving financial advice",
    "Documentation of spontaneous reality glitches in my kitchen",
    "The day my reflection decided to take a vacation",
    "Chronicles of backwards-flowing time in my bathroom",
    "How I accidentally created a temporal loop while making toast",
    "The universe where my plants started speaking in palindromes",
    "My experiences as a part-time reality warper",
    "The dimension where my socks gained consciousness",
    "Notes from the timeline where gravity works sideways",
    "The parallel world where my furniture rearranges itself",
    "How I became a professional déjà vu investigator",
    "The reality branch where my dreams leak into other people's thoughts",
    "My life as an accidental timeline curator",
    "The universe where my coffee mug predicts the future",
    "Documentation of spontaneous probability fluctuations",
    "The dimension where my bookshelf leads to alternate realities",
    "How I discovered my apartment exists in multiple dimensions",
    "The timeline where my groceries develop time travel capabilities",
    "My adventures in quantum grocery shopping",
    "The parallel universe where my jokes alter reality",
    "Chronicles of my temporally displaced garden",
    "The reality where my morning routine causes butterfly effects",
    "Notes from the dimension where my memories write themselves",
    "The timeline split caused by my recursive thinking",
    "How my stapler became a fixed point in spacetime",
    "The universe where my decisions create parallel worlds",
    "My experiences as an interdimensional tourist",
    "The reality where my thoughts manifest as weather patterns",
    "Documentation of temporal anomalies in my living room",
    "The dimension where my calendar rewrites history",
    "How I became entangled with my quantum doppelganger",
    "The timeline where my music changes past events",
    "My life as a temporal probability adjustor",
    "The parallel world where my words have physical weight",
    "Chronicles of my reality-bending meditation sessions",
    "The universe where my dreams affect stock markets",
    "Notes from the dimension of infinite possibilities",
    "The reality where my emotions create alternate timelines",
    "How I learned to navigate probability streams",
    "The timeline where my tea leaves rewrite fate",
    "My adventures in paradox resolution",
    "The dimension where my choices echo through time",
    "Documentation of reality fluctuations in my daily routine",
    "The parallel universe where my thoughts become tangible",
    "Chronicles of temporal photography experiments",
    "The reality where my breathing alters quantum states",
    "Notes from my career as a timeline maintenance worker"
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