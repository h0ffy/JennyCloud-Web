from fastapi import FastAPI, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import asyncio
import json

app = FastAPI()

# Serve static files
app.mount("/static", StaticFiles(directory="."), name="static")

@app.get("/")
async def read_root():
    with open("index.html", "r") as f:
        return HTMLResponse(content=f.read())

@app.post("/api/run")
async def run_code(code: str = Form()):
    """Simulate running user code and return HTML fragments for HTMX OOB swap"""
    
    if not code.strip():
        return HTMLResponse(content="""
            <div id="output-display" hx-swap-oob="innerHTML"><div class="placeholder">Write some code first!</div></div>
            <div id="output-log" hx-swap-oob="innerHTML"><div class="placeholder-log">No code to execute.</div></div>
        """)
    
    try:
        # Simulate AI processing with a delay
        await asyncio.sleep(0.5)
        
        # Simple pattern matching for demonstration
        visual_output = '<div class="placeholder">Processing your code...</div>'
        console_output = '[Execution started]\n'
        
        # Check for print/log statements
        lines = code.split('\n')
        printed_items = []
        for line in lines:
            line = line.strip()
            if line.startswith('print(') or 'print:' in line or 'log:' in line:
                # Extract print content
                if 'print(' in line:
                    start = line.find('print(') + 6
                    end = line.rfind(')')
                    if end > start:
                        printed_items.append(line[start:end].strip("'\""))
                elif 'print:' in line:
                    printed_items.append(line.split('print:')[1].strip(" '\""))
                elif 'log:' in line:
                    printed_items.append(line.split('log:')[1].strip(" '\""))
        
        if printed_items:
            console_output += '\n'.join(printed_items) + '\n'
        
        # Check for visual elements
        if any(keyword in code.lower() for keyword in ['create', 'make', 'draw', 'element', 'scene', 'background']):
            visual_elements = []
            
            # Simple parsing for visual elements
            if 'cat' in code.lower():
                visual_elements.append('<div style="font-size: 48px; text-align: center; padding: 20px;">🐱</div>')
            if 'robot' in code.lower():
                visual_elements.append('<div style="font-size: 48px; text-align: center; padding: 20px;">🤖</div>')
            if 'sun' in code.lower():
                visual_elements.append('<div style="width: 80px; height: 80px; background: yellow; border-radius: 50%; margin: 20px auto;"></div>')
            if 'tree' in code.lower():
                visual_elements.append('<div style="font-size: 48px; text-align: center; padding: 20px;">🌳</div>')
            if 'house' in code.lower():
                visual_elements.append('<div style="font-size: 48px; text-align: center; padding: 20px;">🏠</div>')
            
            if visual_elements:
                visual_output = ''.join(visual_elements)
            else:
                visual_output = '<div style="padding: 20px; text-align: center; color: #666;">Visual elements created from your code!</div>'
        
        console_output += '[Execution complete in 0.05s]'
        
        return HTMLResponse(content=f"""
            <div id="output-display" hx-swap-oob="innerHTML">{visual_output}</div>
            <div id="output-log" hx-swap-oob="innerHTML">{console_output}</div>
        """)
        
    except Exception as e:
        return HTMLResponse(content=f"""
            <div id="output-display" hx-swap-oob="innerHTML"><div class="placeholder" style="color: red;">Execution error occurred.</div></div>
            <div id="output-log" hx-swap-oob="innerHTML"><div class="placeholder-log" style="color: red;">Error: {str(e)}</div></div>
        """)

@app.post("/api/helper")
async def ai_helper(prompt: str = Form()):
    """Generate code suggestions based on user prompt"""
    
    if not prompt.strip():
        return HTMLResponse(content="Please tell the AI helper what you want it to code!")
    
    try:
        # Simulate AI processing
        await asyncio.sleep(0.3)
        
        # Simple code generation based on prompts
        generated_code = "\n\n-- AI Helper added this: --\n"
        
        prompt_lower = prompt.lower()
        
        if 'cat' in prompt_lower:
            generated_code += """
Create an element: 'cat' {
  style: 'cute and fluffy',
  position: 'center',
  animation: 'purr gently',
}

On interaction (click the cat) {
  play sound: 'meow.mp3',
  show text: 'Hello human! *purrs*',
}"""
        
        elif 'robot' in prompt_lower:
            generated_code += """
Make a scene {
  background: 'futuristic-lab',
}

Create an element: 'robot' {
  style: 'shiny metallic',
  wears: 'LED lights',
  position: 'center',
  animation: 'beep and blink',
}

print('Robot activated!')"""
        
        elif 'dancing' in prompt_lower:
            generated_code += """
Create an element: 'dancer' {
  style: 'colorful and energetic',
  animation: 'spin and twirl',
  music: 'upbeat-tune.mp3',
}

On beat {
  change color: 'random rainbow',
  add sparkles: 'everywhere',
}"""
        
        else:
            # Generic code based on prompt
            generated_code += f"""
-- Generated from: "{prompt}" --

Make a scene {{
  theme: 'magical',
}}

Create an element: '{prompt.split()[0] if prompt.split() else "mystery"}' {{
  style: 'enchanted',
  position: 'center',
  special_power: 'grant wishes',
}}

print('Created something amazing!')"""
        
        return HTMLResponse(content=generated_code)
        
    except Exception as e:
        return HTMLResponse(content=f"\n\n-- Error generating code: {str(e)} --")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
