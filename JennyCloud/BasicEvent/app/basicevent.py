from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
import json
import asyncio
from typing import Dict, Any

app = FastAPI()

# Serve static files
app.mount("/", StaticFiles(directory=".", html=True), name="static")

class DemoManager:
    def __init__(self):
        self.current_step = 0
        self.is_running = False
        self.websocket = None
        
    async def send_message(self, message_type: str, data: Dict[str, Any] = None):
        if self.websocket and data is None:
            data = {}
        
        message = {
            "type": message_type,
            **data
        }
        
        if self.websocket:
            await self.websocket.send_text(json.dumps(message))
    
    async def log(self, message: str, log_type: str = "info"):
        await self.send_message("log", {
            "message": message,
            "log_type": log_type
        })
    
    async def update_step(self, step_index: int, status: str = "active"):
        await self.send_message("step_update", {
            "step": step_index,
            "status": status
        })
    
    async def update_expected_result(self, index: int, passed: bool):
        await self.send_message("expected_result", {
            "index": index,
            "passed": passed
        })
    
    async def update_map(self, **kwargs):
        await self.send_message("map_update", kwargs)
    
    async def show_popup(self, top: str = "55%", left: str = "50%"):
        await self.send_message("popup_show", {
            "top": top,
            "left": left
        })
    
    async def hide_popup(self):
        await self.send_message("popup_hide")
    
    async def update_demo_state(self, show_start: bool = True, reset: bool = False):
        await self.send_message("demo_state", {
            "show_start": show_start,
            "reset": reset
        })
    
    async def update_poi_layer(self, show: bool, markers: str = None):
        await self.send_message("poi_update", {
            "show": show,
            "markers": markers
        })
    
    async def show_alert_preview(self, show: bool):
        await self.send_message("alert_preview", {
            "show": show
        })
    
    async def execute_demo_step(self):
        if not self.is_running or self.current_step >= 10:
            return
        
        step_descriptions = [
            "Login as demo user",
            "Navigate to Interactive Map", 
            "Toggle heatmap layer: [✔] Tax Delinquent, [✔] Foreclosures",
            "Zoom to Topeka – 66604 ZIP code",
            "Click on a cluster near 29th & Gage",
            "View property popup with last tax status and owner info",
            "Click \"Add to Watchlist\"",
            "Enable campground POI layer",
            "Filter properties within 3 miles, export CSV",
            "End demo by previewing resident alerts"
        ]
        
        await self.update_step(self.current_step, "active")
        await self.log(f"Executing step {self.current_step + 1}: {step_descriptions[self.current_step]}", "action")
        
        # Execute specific step logic
        if self.current_step == 0:  # Login
            await asyncio.sleep(1)
            await self.log("Successfully logged in as demo_presenter_001.", "success")
            
        elif self.current_step == 1:  # Navigate to map
            await asyncio.sleep(1.5)
            await self.log("Navigated to Interactive Map.", "success")
            await self.update_map(background_color="#e6f7ff")
            
        elif self.current_step == 2:  # Toggle heatmap
            await asyncio.sleep(1)
            await self.update_map(show_heatmap=True)
            await self.log("Heatmap layers \"Tax Delinquent\" and \"Foreclosures\" enabled.", "success")
            await self.update_expected_result(0, True)
            
        elif self.current_step == 3:  # Zoom to Topeka
            await asyncio.sleep(2)
            await self.update_map(
                background_image="https://via.placeholder.com/800x400/4a90e2/ffffff?text=Topeka+Map",
                show_cluster=True
            )
            await self.log("Zoomed to Topeka – 66604 ZIP code.", "success")
            
        elif self.current_step == 4:  # Click cluster
            await asyncio.sleep(1)
            await self.update_map(cluster_active=True)
            await self.show_popup()
            await self.log("Clicked on property cluster. Property popup displayed.", "success")
            
        elif self.current_step == 5:  # View popup
            await asyncio.sleep(0.5)
            await self.log("Property details reviewed: Last Tax Status and Owner Info.", "success")
            await self.update_expected_result(1, True)
            
        elif self.current_step == 6:  # Add to watchlist
            await asyncio.sleep(1)
            await self.hide_popup()
            await self.log("Property added to Watchlist.", "success")
            await self.update_expected_result(2, True)
            
        elif self.current_step == 7:  # Enable POI layer
            await asyncio.sleep(1.5)
            await self.update_poi_layer(True)
            await self.log("Campground POI layer enabled. Two campgrounds displayed.", "success")
            
        elif self.current_step == 8:  # Filter and export
            await asyncio.sleep(2)
            await self.log("Filtered properties within 3 miles. Exporting CSV...", "info")
            await asyncio.sleep(1.5)
            await self.log("CSV export complete. File \"properties_filtered.csv\" downloaded.", "success")
            await self.update_expected_result(3, True)
            
        elif self.current_step == 9:  # Show alerts
            await asyncio.sleep(2)
            await self.show_alert_preview(True)
            await self.log("Resident Alerts preview displayed.", "success")
            await self.update_expected_result(4, True)
            self.is_running = False
            await self.log("Demo concluded.", "info")
            await self.update_demo_state(show_start=False)
            return
        
        self.current_step += 1
        if self.is_running:
            # Continue to next step automatically after a brief pause
            await asyncio.sleep(0.5)
            await self.execute_demo_step()
    
    async def start_demo(self):
        if not self.is_running:
            self.is_running = True
            self.current_step = 0
            await self.log("Starting ADAPT Web App Demo...", "info")
            await self.execute_demo_step()
    
    async def reset_demo(self):
        self.current_step = 0
        self.is_running = False
        await self.update_demo_state(show_start=True, reset=True)
        await self.log("Demo reset to initial state.", "info")

demo_manager = DemoManager()

@app.websocket("/ws/demo")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    demo_manager.websocket = websocket
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            action = message.get("action")
            
            if action == "start_demo":
                await demo_manager.start_demo()
            elif action == "reset_demo":
                await demo_manager.reset_demo()
            elif action == "add_to_watchlist":
                property_id = message.get("property_id")
                await demo_manager.log(f"Initiating \"Add to Watchlist\" action for property {property_id}...", "action")
                
    except WebSocketDisconnect:
        demo_manager.websocket = None

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
