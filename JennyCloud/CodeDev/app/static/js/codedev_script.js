// ide.js - Main logic for Jenny IDE

import hljs from "highlight.js";

// Improved boilerplate with correct newlines/indentation
const DEFAULT_FILES = {
  "index.html": {
    type: "html",
    content:
`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Web Project in Jenny IDE</title>
  <link rel="stylesheet" href="codedev_style.css">
  <script src="codedev_script.js"></script>
</head>
<body>
  <h1>Hello, Jenny IDE!</h1>
  <button onclick="console.log('Hello!')">Test Console</button>
</body>
</html>
`
  },
  "script.js": {
    type: "js",
    content:
`console.log("Your JS code goes here.");

document.querySelector('button')?.addEventListener('click', function() {
  alert("Button clicked!");
});
`
  },
  "style.css": {
    type: "css",
    content:
`body {
  background: #282a36;
  color: #f8f8f2;
  font-family: 'Fira Code', 'Consolas', monospace;
  margin: 0;
  padding: 0;
}

h1 {
  margin: 2em 0 1em 0;
  text-align: center;
  color: #bd93f9;
  text-shadow: 0 0 10px rgba(189, 147, 249, 0.5);
}

button {
  background: linear-gradient(135deg, #bd93f9, #ff79c6);
  color: #282a36;
  border: none;
  border-radius: 12px;
  font-size: 1.2em;
  padding: 0.7em 2.2em;
  cursor: pointer;
  transition: all 0.3s ease;
  display: block;
  margin: 3em auto;
  box-shadow: 0 4px 15px rgba(189, 147, 249, 0.3);
  font-weight: 600;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(189, 147, 249, 0.5);
  background: linear-gradient(135deg, #ff79c6, #bd93f9);
}

button:active {
  transform: translateY(0);
}
`
  },
  "README.md": {
    type: "md",
    content:
`# Welcome to Jenny IDE!

Start coding your next big thing!

- Edit files in the sidebar.
- Syntax highlighting and preview are live.
- Try modern HTML, CSS, and JS.

Enjoy!
`
  },
  "main.py": {
    type: "py",
    content:
`from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

app = FastAPI(title="Jenny IDE Backend API", version="1.0.0")

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class Item(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None
    price: float
    in_stock: bool = True

class User(BaseModel):
    id: Optional[int] = None
    username: str
    email: str
    full_name: Optional[str] = None

# In-memory storage (use database in production)
items_db = []
users_db = []

@app.get("/")
async def root():
    return {"message": "FastAPI Backend - Jenny IDE", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "fastapi-backend"}

# Items endpoints
@app.get("/items", response_model=List[Item])
async def get_items():
    return items_db

@app.post("/items", response_model=Item)
async def create_item(item: Item):
    item.id = len(items_db) + 1
    items_db.append(item)
    return item

@app.get("/items/{item_id}", response_model=Item)
async def get_item(item_id: int):
    item = next((item for item in items_db if item.id == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@app.put("/items/{item_id}", response_model=Item)
async def update_item(item_id: int, updated_item: Item):
    for i, item in enumerate(items_db):
        if item.id == item_id:
            updated_item.id = item_id
            items_db[i] = updated_item
            return updated_item
    raise HTTPException(status_code=404, detail="Item not found")

@app.delete("/items/{item_id}")
async def delete_item(item_id: int):
    for i, item in enumerate(items_db):
        if item.id == item_id:
            del items_db[i]
            return {"message": "Item deleted successfully"}
    raise HTTPException(status_code=404, detail="Item not found")

# Users endpoints
@app.get("/users", response_model=List[User])
async def get_users():
    return users_db

@app.post("/users", response_model=User)
async def create_user(user: User):
    user.id = len(users_db) + 1
    users_db.append(user)
    return user

@app.get("/users/{user_id}", response_model=User)
async def get_user(user_id: int):
    user = next((user for user in users_db if user.id == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
`
  },
  "requirements.txt": {
    type: "txt",
    content:
`fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
python-multipart==0.0.6
`
  }
};

const FILE_ICONS = {
  html: '<i class="fa-brands fa-html5" style="color:#e44d26"></i>',
  js: '<i class="fa-brands fa-js" style="color:#f7e018"></i>',
  css: '<i class="fa-brands fa-css3-alt" style="color:#2196f3"></i>',
  md: '<i class="fa-solid fa-book" style="color:#7be5fd"></i>',
  txt: '<i class="fa-regular fa-file-lines" style="color:#bbb"></i>',
  json: '<i class="fa-solid fa-brackets-curly" style="color:#7be67d"></i>',
  py: '<i class="fa-brands fa-python" style="color:#3572A5"></i>',
  default: '<i class="fa-regular fa-file" style="color:#d2d2d2"></i>'
};

const CODE_LANG = {
  html: "html",
  js: "javascript",
  css: "css",
  md: "markdown",
  json: "json",
  py: "python",
  txt: "plaintext"
};

// Helper: Type from extension
function getFileType(name) {
  const ext = (name.split('.').pop() || "").toLowerCase();
  if (["html", "htm"].includes(ext)) return "html";
  if (["js"].includes(ext)) return "js";
  if (["css"].includes(ext)) return "css";
  if (["md", "markdown"].includes(ext)) return "md";
  if (["json"].includes(ext)) return "json";
  if (["py"].includes(ext)) return "py";
  if (["txt"].includes(ext)) return "txt";
  return "txt";
}

// Persistent State
function loadState() {
  let files = JSON.parse(localStorage.getItem("jenny-ide-files") || "null");
  if (!files) files = {...DEFAULT_FILES};
  let openTabs = JSON.parse(localStorage.getItem("jenny-ide-tabs") || "null") || ["index.html"];
  let activeTab = localStorage.getItem("jenny-ide-activeTab") || openTabs[0];
  return {files, openTabs, activeTab};
}
function saveState() {
  localStorage.setItem("jenny-ide-files", JSON.stringify(JennyIDE.files));
  localStorage.setItem("jenny-ide-tabs", JSON.stringify(JennyIDE.openTabs));
  localStorage.setItem("jenny-ide-activeTab", JennyIDE.activeTab);
}

// Helper to strip code fences and always remove first/last lines if they begin with ```
function cleanCodeResponse(resp) {
  // Do NOT strip newlines ever!
  let result = (resp || "");
  // Remove code fences ONLY, but do not strip/replace/compact/trim newlines anywhere
  // Remove triple backticks with possible language
  result = result.replace(/^```[a-zA-Z]*\s*\n([\s\S]*?)\n?```$/m, '$1');
  // Remove first line if it's a code fence (e.g., ```css)
  let lines = result.split("\n");
  if (lines.length && lines[0].trim().startsWith("```")) lines.shift();
  if (lines.length && lines[lines.length - 1].trim().startsWith("```")) lines.pop();
  result = lines.join("\n");
  // As above, always preserve original linebreaks.
  return result;
}

// Helper: escape HTML special characters for display in contenteditable PRE
function htmlEscape(str) {
  // Important: preserve all linebreaks as <br>, and replace special chars.
  // But *DO* use <span> markup for syntax highlighting (via hljs.highlight)
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\u00a0/g, " ")
    .replace(/\t/g, "    "); // optional: render tab as spaces
}

// Helper for setting innerHTML while preserving plain text + formatting (for syntax coloring)
function setHighlightHTML(pre, text, lang) {
  let html;
  // Use highlight.js if possible, but always preserve hard line-breaks.
  try {
    if (hljs.getLanguage(lang)) {
      html = hljs.highlight(text, {language: lang}).value;
    } else {
      html = htmlEscape(text);
    }
  } catch {
    html = htmlEscape(text);
  }

  // Force explicit <br> for every line ending due to contenteditable weirdness
  // (But highlight.js already inserts line structure. Avoid brute <br> splitting or you'll break highlighting.)
  // Instead: Accept highlight.js output, which keeps linebreaks.

  pre.innerHTML = html || "";
}

/* ---- IDE OBJECT ---- */
window.JennyIDE = {
  files: {},
  openTabs: [],
  activeTab: "",
  wb: {},
  editors: {},
  ai: {},
  consoles: [],
  theme: "dark",
  // Theme Designer Assist toggle status (default: off)
  themeAssistAuto: (localStorage.getItem("jenny-ide-themeAssistAuto") === "true") || false,

  // Entry point
  init() {
    // Load state: files and layout
    let state = loadState();
    this.files = state.files;
    this.openTabs = state.openTabs;
    this.activeTab = state.activeTab;
    this.theme = localStorage.getItem("jenny-ide-theme") || "dark";
    this.themeAssistAuto = (localStorage.getItem("jenny-ide-themeAssistAuto") === "true") || false;

    this.renderMenus();

    // Launch main panels but DO NOT perform any actions or update content except on direct user activation.
    this.setupShortcuts();
    this.ai = AIHelper(this);

    this.applyTheme();
    this.renderMenus();

    // Only launch panels; do NOT auto-run/preview/refresh anything.
    this.launchSidebar();
    this.launchTabs();
    this.launchPreview();
    this.launchConsole();

    // Hide cover after everything is loaded and panels are launched
    setTimeout(() => {
      document.getElementById("ide-initial-cover").classList.add("hide");
    }, 100);

    // Render theme assist menu checkmark
    this.updateThemeAssistMenu();
  },

  renderMenus() {
    // Dynamic menus, keyboard access - already defined in HTML
    // (expand later if needed)
    this.updateThemeAssistMenu?.();
  },

  /* ---- FILE HANDLING ---- */
  newFile() {
    let fname = prompt("New File Name?", "untitled.js");
    if (!fname) return;
    if (this.files[fname]) return alert(`File "${fname}" already exists.`);
    // Default detect type
    this.files[fname] = {type: getFileType(fname), content:""};
    this.openTab(fname);
    saveState();
    this.refreshSidebar?.();
  },

  openFile() {
    // File open dialog: browser limited, can use input[type=file]
    let input = document.createElement("input");
    input.type = "file";
    input.multiple = false;
    input.accept = ".html,.js,.css,.md,.json,.txt,*/*";
    input.style.display = "none";
    input.onchange = e => {
      let file = input.files[0];
      if (!file) return;
      let reader = new FileReader();
      reader.onload = () => {
        this.files[file.name] = {
          type: getFileType(file.name),
          content: reader.result
        };
        this.openTab(file.name);
        saveState();
        this.refreshSidebar?.();
      };
      reader.readAsText(file);
    };
    document.body.appendChild(input);
    input.click();
    setTimeout(()=>document.body.removeChild(input),1000);
  },

  saveFile() {
    let fname = this.activeTab;
    let file = this.files[fname];
    if (!file) return;
    // Download as file
    let blob = new Blob([file.content], {type: "text/plain"});
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fname;
    link.click();
  },

  saveAll() {
    // Downloads as zip
    let zipScript = async () => {
      if (window.JSZip) {
        let zip = new JSZip();
        for (let [name, file] of Object.entries(this.files)) {
          zip.file(name, file.content);
        }
        let blob = await zip.generateAsync({type: "blob"});
        let link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "project.zip";
        link.click();
      } else {
        let script = document.createElement("script");
        script.onload = zipScript;
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js";
        document.head.appendChild(script);
      }
    };
    zipScript();
  },

  closeTab(name) {
    name = name || this.activeTab;
    let idx = this.openTabs.indexOf(name);
    if (idx >= 0) this.openTabs.splice(idx,1);
    if(this.activeTab === name)
      this.activeTab = this.openTabs[0] || "";
    saveState();
    this.refreshTabs?.();
  },

  openTab(name) {
    if (!this.files[name]) return alert("File does not exist");
    if (!this.openTabs.includes(name)) this.openTabs.push(name);
    this.activeTab = name;
    saveState();
    this.refreshTabs?.();
    this.refreshSidebar?.();
    // Auto-run preview on tab switch if HTML/CSS/JS is updated
    if (["index.html","style.css","script.js"].includes(name)) {
      this.runScript(true);
    }
    // Auto theme generation if enabled and editing style.css
    if (name === "style.css" && this.themeAssistAuto) {
      this.themeDesignerCssAuto();
    }
  },

  renameFile(oldname, newname) {
    if (!this.files[oldname]) return;
    if (this.files[newname]) return alert("File already exists.");
    this.files[newname] = {...this.files[oldname]};
    delete this.files[oldname];
    let t = this.openTabs.indexOf(oldname);
    if (t !== -1) this.openTabs[t] = newname;
    if(this.activeTab === oldname) this.activeTab = newname;
    saveState();
    this.refreshSidebar?.();
    this.refreshTabs?.();
  },

  deleteFile(name) {
    if (!this.files[name]) return;
    if(!confirm("Delete file "+name+"?")) return;
    delete this.files[name];
    let t = this.openTabs.indexOf(name);
    if (t !== -1) this.openTabs.splice(t,1);
    if(this.activeTab === name) this.activeTab = this.openTabs[0] || "";
    saveState();
    this.refreshSidebar?.();
    this.refreshTabs?.();
  },

  exitIDE() {
    if (!confirm("Exit IDE? Unsaved changes (not downloaded) may be lost.")) return;
    window.close();
  },

  /* ---- CONSOLE/OUTPUT ---- */
  logConsole(type, msg) {
    let c = this.consoles?.[0];
    if (!c) return;
    let div = document.createElement("div");
    div.className = "log " + (type || "info");
    div.textContent = msg + "";
    c.appendChild(div);
    c.scrollTop = c.scrollHeight;
  },
  clearConsole() {
    let c = this.consoles?.[0];
    if (!c) return;
    c.innerHTML = "";
  },
  runScript(safe) {
    // Always run preview (auto-update allowed per user request)
    let html = this.files["index.html"]?.content || "";
    let css = this.files["style.css"]?.content || "";
    let js = this.files["script.js"]?.content || "";

    let previewFrame = document.getElementById("ide-preview-frame");
    if (previewFrame) {
      let blob = new Blob([html.replace('</head>', `<style>${css}</style></head>`).replace('</body>', `<script>${js}<\/script></body>`)],
        {type:"text/html"});
      previewFrame.src = URL.createObjectURL(blob);
      setTimeout(()=>URL.revokeObjectURL(previewFrame.src),1000);
    }
  },

  /* ---- PANELS: WINBOX MANAGEMENT ---- */
  launchSidebar() {
    if (this.wb.sidebar) { this.wb.sidebar.close(); }
    this.wb.sidebar = new WinBox("Files", {
      class:"ide-file-explorer",
      x:2, y:38, width:240, height:window.innerHeight-40,
      minheight:180, max: false, min: false, resizable: true,
      background: "#333832",
      index: 30,
      onresize: ()=>{},
      onmove: ()=>{},
      onclose: ()=>{this.wb.sidebar = null;},
      mount: this.renderSidebar()
    });
    this.refreshSidebar = () => {
      let mount = this.renderSidebar();
      this.wb.sidebar?.mount?.(mount);
    };
  },
  launchTabs() {
    if (this.wb.tabs) { this.wb.tabs.close(); }
    this.wb.tabs = new WinBox("Editor", {
      class: "ide-tabs-container",
      x:244, y:38, width:window.innerWidth-530, height:window.innerHeight-228,
      minwidth:400, minheight:200, max: false,
      resizable: true, index: 40,
      onclose: ()=>{this.wb.tabs = null;},
      background: "#232736",
      mount: this.renderTabs()
    });
    this.refreshTabs = () => {
      let mount = this.renderTabs();
      this.wb.tabs?.mount?.(mount);
      // Do NOT auto-run preview here!
    };
  },
  launchPreview() {
    if (this.wb.preview) { this.wb.preview.close(); }
    this.wb.preview = new WinBox("Preview", {
      class: "ide-preview",
      x:window.innerWidth-270, y:38, width:260, height:window.innerHeight-230,
      minwidth:170, minheight:120, max: false, background: "#181c23",
      resizable: true, index: 42,
      onclose: ()=>{this.wb.preview = null;},
      mount: this.renderPreview()
    });
    this.refreshPreview = () => {
      let mount = this.renderPreview();
      this.wb.preview?.mount?.(mount);
    };
  },
  launchConsole() {
    if (this.wb.console) { this.wb.console.close(); }
    this.wb.console = new WinBox("Console", {
      class: "ide-console",
      x:244, y:window.innerHeight-183, width:window.innerWidth-273, height:181,
      minwidth:340, minheight:60, max:false, background: "#181c24",
      resizable: true, index: 55,
      onclose: ()=>{this.wb.console = null;},
      mount: this.renderConsole()
    });
    this.refreshConsole = () => {
      let mount = this.renderConsole();
      this.wb.console?.mount?.(mount);
    };
  },

  // Handle toggling panels (menu actions)
  toggleFileExplorer() {
    if (JennyIDE.wb.sidebar && JennyIDE.wb.sidebar.closed===false) {
      JennyIDE.wb.sidebar.close();
      JennyIDE.wb.sidebar = null;
    } else {
      JennyIDE.launchSidebar();
    }
  },
  toggleConsole() {
    if (JennyIDE.wb.console && JennyIDE.wb.console.closed===false) {
      JennyIDE.wb.console.close();
      JennyIDE.wb.console = null;
    } else {
      JennyIDE.launchConsole();
    }
  },
  togglePreview() {
    if (JennyIDE.wb.preview && JennyIDE.wb.preview.closed===false) {
      JennyIDE.wb.preview.close();
      JennyIDE.wb.preview = null;
    } else {
      JennyIDE.launchPreview();
    }
  },

  /* ---- RENDERERS FOR PANELS ---- */
  renderSidebar() {
    let root = document.createElement("div");
    root.className = "ide-file-explorer";
    let tree = document.createElement("div");
    tree.className = "tree";
    for (let name in this.files) {
      let file = this.files[name];
      let d = document.createElement("div");
      d.className = "file" + (this.activeTab === name ? " selected":"");
      d.innerHTML = (FILE_ICONS[file.type] || FILE_ICONS.default) + " " + name;
      d.title = "Open " + name;
      d.onclick = ()=>this.openTab(name);
      d.ondblclick = ()=>this.renameFilePrompt(name);
      // Context Menu: Delete
      d.oncontextmenu = (e)=>{
        e.preventDefault();
        if (confirm(`Delete file '${name}'?`)) {
          this.deleteFile(name);
        }
      };
      tree.appendChild(d);
    }
    root.appendChild(tree);

    // New file/add
    let newBtn = document.createElement("button");
    newBtn.textContent = "+ New File";
    newBtn.style = "margin:14px 8px 0 8px; width:calc(100% - 16px)";
    newBtn.onclick = ()=>this.newFile();
    root.appendChild(newBtn);
    return root;
  },

  renameFilePrompt(fname) {
    let newname = prompt("Rename file:", fname);
    if (!newname || newname === fname) return;
    this.renameFile(fname,newname);
  },

  renderTabs() {
    let container = document.createElement("div");
    container.className = "ide-tabs-container";

    // Tab bar
    let tabBar = document.createElement("div");
    tabBar.className = "ide-tab-bar";
    for (let fname of this.openTabs) {
      let file = this.files[fname];
      if (!file) continue;
      let tab = document.createElement("button");
      tab.className = "ide-tab" + (fname===this.activeTab?" active":"");
      tab.innerHTML = `<span class="icon">${
        FILE_ICONS[file.type] || FILE_ICONS.default
      }</span>${fname}<span class="close" title="Close Tab">&times;</span>`;
      tab.onclick = e => {
        if (e.target.classList.contains("close")){
          this.closeTab(fname);
        } else {
          this.openTab(fname);
        }
      };
      tab.oncontextmenu = e => {
        e.preventDefault();
        this.renameFilePrompt(fname);
      };
      tabBar.appendChild(tab);
    }
    container.appendChild(tabBar);

    // Editor pane with syntax highlighting overlay OR just syntax colored, editable code
    let editorPane = document.createElement("div");
    editorPane.className = "ide-editor-pane";
    let file = this.files[this.activeTab];
    if (!file) {
      editorPane.innerHTML = "<em>No file selected.</em>";
    } else if (file.type === "md") {
      // Markdown rendered as syntax-highlighted markdown only, not editable
      let mdprev = document.createElement("pre");
      mdprev.innerHTML = hljs.highlight(file.content, {language:"markdown"}).value;
      editorPane.appendChild(mdprev);
    } else {
      // Editable syntax-colored code: contenteditable PRE only
      let lang = CODE_LANG[file.type] || "plaintext";

      let pre = document.createElement("pre");
      pre.className = "hljs ide-editor-highlight";
      pre.contentEditable = "true";
      pre.spellcheck = false;
      pre.autocapitalize = "off";
      pre.autocorrect = "off";
      pre.style.margin = "0";
      pre.style.background = "transparent";
      pre.style.minHeight = "420px";
      pre.style.width = "100%";
      pre.style.outline = "none";
      pre.style.border = "none";
      pre.style.fontFamily = "inherit";
      pre.style.fontSize = "inherit";
      pre.style.lineHeight = "1.62";
      pre.style.padding = "0.6em 0.5em 0.6em 1.5em";
      pre.style.boxSizing = "border-box";
      pre.style.overflow = "auto";
      pre.setAttribute("data-lang", lang);

      // Caret preservation helpers
      function getPlainTextFromPre(element) {
        return element.innerText.replace(/\u200B/g, "");
      }
      function getCaretCharacterOffsetWithin(element) {
        let caretOffset = 0;
        let sel = window.getSelection();
        if (sel && sel.anchorNode && element.contains(sel.anchorNode)) {
          let range = sel.getRangeAt(0);
          let preRange = range.cloneRange();
          preRange.selectNodeContents(element);
          preRange.setEnd(range.endContainer, range.endOffset);
          caretOffset = preRange.toString().length;
        }
        return caretOffset;
      }
      function setCaretCharacterOffsetWithin(element, offset) {
        let nodeStack = [element], node, found = false, charCount = 0;
        let range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(true);
        while (!found && (node = nodeStack.pop())) {
          if (node.nodeType === 3) {
            let nextCharCount = charCount + node.length;
            if (offset <= nextCharCount) {
              range.setStart(node, offset - charCount);
              range.collapse(true);
              found = true;
              break;
            }
            charCount = nextCharCount;
          } else {
            let i = node.childNodes.length;
            while (i--) nodeStack.push(node.childNodes[i]);
          }
        }
        if (found) {
          let sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }

      function updateHighlightPreserveCaret(restoreCaret) {
        let caretPos = null;
        if (restoreCaret) {
          caretPos = getCaretCharacterOffsetWithin(pre);
        }
        let val = getPlainTextFromPre(pre);

        setHighlightHTML(pre, val, lang);

        if (restoreCaret && caretPos !== null) {
          setCaretCharacterOffsetWithin(pre, caretPos);
        }
      }

      pre.addEventListener("input", (e) => {
        let newVal = getPlainTextFromPre(pre);
        file.content = newVal;
        saveState();
        updateHighlightPreserveCaret(true);

        // Theme Assist debounced auto-regeneration if enabled & style.css
        if (this.activeTab === "style.css" && this.themeAssistAuto) {
          this.themeDesignerCssDebounced();
        }

        // Live preview auto-update for HTML/CSS/JS
        if (["index.html","style.css","script.js"].includes(this.activeTab)) {
          this.runScript(true);
        }
      });

      pre.addEventListener("blur", ()=>{
        saveState();
        JennyIDE.refreshSidebar?.();
      });

      pre.addEventListener("keydown", async e=>{
        if (e.key==="Tab" && !e.altKey && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          let val = getPlainTextFromPre(pre);
          let caretPos = getCaretCharacterOffsetWithin(pre);
          let before = val.slice(0, caretPos);
          let after = val.slice(caretPos);
          let suggestion = await JennyIDE.ai.codeComplete({file, before, after, lang:file.type});
          if (suggestion) {
            let insert = suggestion;
            let updated = before + insert + after;
            file.content = updated;
            saveState();
            setHighlightHTML(pre, updated, lang);
            setCaretCharacterOffsetWithin(pre, before.length + insert.length);

            // Theme Assist debounced auto-regeneration if enabled & style.css
            if (this.activeTab === "style.css" && this.themeAssistAuto) {
              this.themeDesignerCssDebounced();
            }

            // Live preview auto-update for HTML/CSS/JS
            if (["index.html","style.css","script.js"].includes(this.activeTab)) {
              this.runScript(true);
            }
          }
        }
      });

      setHighlightHTML(pre, file.content, lang);

      editorPane.appendChild(pre);
    }

    container.appendChild(editorPane);

    return container;
  },

  renderPreview() {
    let wrap = document.createElement("div");
    wrap.className = "ide-preview";
    let iframe = document.createElement("iframe");
    iframe.id = "ide-preview-frame";
    iframe.style = "width:100%; height:97%; min-height:160px; border:none; background:#14161d;";
    wrap.appendChild(iframe);
    // You may still want a manual "Run Preview" button, but not required for auto-run
    return wrap;
  },

  renderConsole() {
    let root = document.createElement("div");
    root.className = "ide-console";
    this.consoles = [root];
    return root;
  },

  /* ---- THEME ---- */
  toggleTheme() {
    this.theme = this.theme === "dark" ? "light" : "dark";
    localStorage.setItem("jenny-ide-theme", this.theme);
    this.applyTheme();
    this.refreshTabs?.();
  },
  applyTheme() {
    document.body.classList.toggle("theme-dark", this.theme==="dark");
    document.body.classList.toggle("theme-transition",true);
    setTimeout(()=>document.body.classList.remove("theme-transition"),400);
  },

  /* ---- THEME DESIGNER ASSIST TOGGLE ---- */
  toggleThemeAssist() {
    this.themeAssistAuto = !this.themeAssistAuto;
    localStorage.setItem("jenny-ide-themeAssistAuto", this.themeAssistAuto ? "true" : "false");
    this.updateThemeAssistMenu();
    // If enabling while .css tab is active and auto is on, trigger with debounce (not immediate)
    if (this.themeAssistAuto && this.activeTab === "style.css") {
      // Debounced trigger, not immediate
      this.themeDesignerCssDebounced();
    }
  },

  updateThemeAssistMenu() {
    // Set check mark or icon for theme assist auto menu
    const menuItem = document.getElementById("theme-assist-toggle-menu-item");
    const checkSpan = document.getElementById("theme-assist-toggle-check");
    if (this.themeAssistAuto) {
      checkSpan.innerHTML = '<i class="fa fa-check-square" style="color:#ffd700"></i>';
    } else {
      checkSpan.innerHTML = '<i class="fa-regular fa-square" style="color:#888"></i>';
    }
  },

  // Debounced trigger for Theme Designer Assist (3s after last edit)
  themeDesignerCssDebounced: function() {
    clearTimeout(this._themeDesignerCssTimeout);
    this._themeDesignerCssTimeout = setTimeout(() => {
      this.themeDesignerCssAuto();
    }, 3000);
  },

  /* ---- THEME DESIGNER ---- */
  // This now asks the LLM for the best theme type first, then uses that to generate CSS
  themeDesignerCssAuto: async function() {
    // Only run if style.css is the active tab and themeAssistAuto is on
    if (!this.themeAssistAuto || this.activeTab !== "style.css") return;

    // 1. Ask the LLM what is the best *type* of theme for the current project data
    // Compose a system prompt to make the LLM be a UI/UX theme expert
    // Project data: show a brief summary of filenames and file contents
    function fileSummary(files) {
      // Slightly abbreviated, useful for LLM
      let summary = Object.entries(files)
        .map(([name, file]) => `${name}: ${file.content.slice(0, 300).replace(/\n/g, " ").replace(/\s+/g, " ").trim()}${file.content.length > 300 ? "..." : ""}`)
        .join("\n---\n");
      return summary;
    }

    const summary = fileSummary(this.files);

    // Ask LLM for best type of theme (returns a summary like "A modern dark developer-centric theme", etc.).
    const themeTypePrompt = `Examine the following project structure/code and recommend the SINGLE most appropriate overall theme aesthetic for the CSS styles. Respond ONLY with a short phrase (no explanation), for example: "minimalist light", "futuristic neon dark", "developer dark mode with accent blue", "handwritten sketch", "retro pixel", etc.

Files and contents:
${summary}
`;

    let themeType = "modern dark with #ffd700 accent";
    try {
      let typeResp = await window.jenny?.chat.completions.create?.({
        messages: [
          { role: "system", content: "You are an expert in recommending web themes." },
          { role: "user", content: themeTypePrompt }
        ],
      });
      // Take the response as a phrase, strip leading/trailing quotes/periods.
      themeType = (typeResp?.content || themeType)
        .replace(/^["'\s]*/, '')
        .replace(/["'\.\s]*$/, '');
    } catch {}

    // Save user prompt for the next CSS step (allow edits as well)
    let themePrompt = window.prompt(
      `Theme Assist will design your CSS for:\n"${themeType}"\n\nYou may edit this description if you want:`,
      themeType
    );
    if (!themePrompt) return;

    localStorage.setItem("jenny-ide-themeAssistPrompt", themePrompt);

    // 2. Now ask the LLM to generate the CSS for this themePrompt
    const sysPrompt = "Write a modern CSS stylesheet for a web project, based on the following theme requirements. Respond only with the valid CSS code (do NOT include explanations or code fences). Your response must preserve all linebreaks exactly as you would write in a real .css file.";
    const user = `Theme requirements:\n${themePrompt}`;

    let completion = await window.jenny?.chat.completions.create?.({
      messages: [
        { role: "system", content: sysPrompt },
        { role: "user", content: user }
      ],
    });

    let css = cleanCodeResponse(completion?.content || "");

    this.files["style.css"] = {
      type: "css",
      content: css
    };

    saveState();

    // Refresh tabs and preview so the new CSS is visible
    this.refreshSidebar?.();
    this.refreshTabs?.();
    this.runScript?.(true);
  },

  /* ---- AI MENU FEATURES ---- */
  showAbout() {
    alert(`Jenny IDE\n\nFlexible multimodal web dev, inspired by VSCode, Atom and VS6.\n\nAI features provided by Jenny's AI agent and chat model.\n\n2024`);
  },
  showShortcuts() {
    alert(`Keyboard Shortcuts:
Ctrl+N - New File
Ctrl+O - Open File
Ctrl+S - Save File
Ctrl+W - Close Tab
Tab (in editor) - AI complete
Ctrl+E - AI refactor selected
`);
  },
  undo() { document.execCommand("undo"); },
  redo() { document.execCommand("redo"); },
  cut()  { document.execCommand("cut"); },
  copy() { document.execCommand("copy"); },
  paste(){ document.execCommand("paste"); },
  find() { document.execCommand("find"); },
  replace() { /* Could expand with dialog */ },

  /* ---- WINDOW RESIZE ---- */
  handleResize() {
    // Ensure the panels adapt responsively when resizing the window

    const menubarH = 36; // #ide-menubar height
    const sidebarW = 240; // sidebar width
    const previewW = 260; // preview width
    const padding = 2; // gutter for winboxes
    const consoleH = 181; // console height

    let w = window.innerWidth, h = window.innerHeight;

    // Sidebar
    if (this.wb.sidebar && !this.wb.sidebar.closed) {
      this.wb.sidebar.move(padding, menubarH + padding);
      this.wb.sidebar.resize(sidebarW, h - menubarH - padding*2);
    }

    // Tabs (Editor main area)
    if (this.wb.tabs && !this.wb.tabs.closed) {
      let tabsX = sidebarW + padding * 2;
      let tabsY = menubarH + padding;
      let tabsW = w - sidebarW - previewW - padding * 5; // 5 paddings for more natural gap!
      let tabsH = h - menubarH - consoleH - padding * 5;
      // Ensure min size
      tabsW = Math.max(340, tabsW);
      tabsH = Math.max(120, tabsH);

      this.wb.tabs.move(tabsX, tabsY);
      this.wb.tabs.resize(tabsW, tabsH);
    }

    // Preview (Right)
    if (this.wb.preview && !this.wb.preview.closed) {
      let prevX = w - previewW - padding;
      let prevY = menubarH + padding;
      let prevH = h - menubarH - consoleH - padding * 4;
      prevH = Math.max(120, prevH);
      this.wb.preview.move(prevX, prevY);
      this.wb.preview.resize(previewW, prevH);
    }

    // Console (bottom, spans main/tabs and preview)
    if (this.wb.console && !this.wb.console.closed) {
      let consX = sidebarW + padding * 2;
      let consY = h - consoleH - padding;
      let consW = w - sidebarW - padding * 3;
      consW = Math.max(320, consW);
      this.wb.console.move(consX, consY);
      this.wb.console.resize(consW, consoleH);
    }
  },

  /* ---- SHORTCUTS ---- */
  setupShortcuts() {
    document.addEventListener("keydown", (e)=>{
      if (e.ctrlKey && e.key==="s") { e.preventDefault(); this.saveFile(); }
      if (e.ctrlKey && e.key==="n") { e.preventDefault(); this.newFile(); }
      if (e.ctrlKey && e.key==="o") { e.preventDefault(); this.openFile(); }
      if (e.ctrlKey && e.key==="w") { e.preventDefault(); this.closeTab(); }
      if (e.key==="F5") { e.preventDefault(); this.runScript(true); }
      if (e.ctrlKey && e.key==="b") { e.preventDefault(); this.toggleConsole(); }
    });
    window.onresize = () => this.handleResize();
  }
};

/* ---- AI/LLM INTEGRATION ---- */
function AIHelper(IDE) {
  let selText = ()=>{
    let active = document.activeElement;
    let sel = "";
    if (active && (active.tagName==="TEXTAREA"||active.tagName==="INPUT"))
      sel = active.value.substring(active.selectionStart, active.selectionEnd);
    return sel;
  };
  return {
    async codeComplete({file, before, after, lang}) {
      if (!lang) lang = "plaintext";
      let completion = await window.jenny?.chat.completions.create?.({
        messages: [
          {role:"system", content:"Complete the following code using proper modern style. Respond only with a code completion (no explanations)."},
          {role:"user", content:[
            {type:"text", text:
`Language: ${lang}
Code so far:
${before}
[...]
${after}
--END--`
            }
          ]}],
      });
      let code = cleanCodeResponse(completion?.content);
      return code;
    },
    async refactor() {
      alert("Automatic code refactoring is now disabled.");
    },
    async explain() {
      let file = IDE.files[IDE.activeTab];
      if (!file) return;
      let textarea = document.querySelector(".ide-editor-pane textarea");
      if (!textarea) return;
      let sel = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd) || textarea.value;
      let completion = await window.jenny?.chat.completions.create?.({
        messages: [
          {role:"system", content:"You are a helpful explainer and documenter of code."},
          {role:"user", content: "Explain the following code:\n\n" + sel}
        ]
      });
      alert(cleanCodeResponse(completion?.content || "No explanation found."));
    },
    async fixBugs() {
      let file = IDE.files[IDE.activeTab];
      if (!file) return;
      let textarea = document.querySelector(".ide-editor-pane textarea");
      if (!textarea) return;
      let sel = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd) || textarea.value;
      let completion = await window.jenny?.chat.completions.create?.({
        messages: [
          {role:"system", content:"You are a world-class debugger and code fixer."},
          {role:"user", content:"Fix all bugs in this code. If there were any, return corrected code. If there are no bugs, return the code unchanged.\n\n"+sel}
        ]
      });
      let fixed = cleanCodeResponse(completion?.content ?? "");
      if (fixed && fixed.length > 3 && fixed !== sel) {
        let before = textarea.value.slice(0, textarea.selectionStart);
        let after = textarea.value.slice(textarea.selectionEnd);
        textarea.value = before + fixed + after;
        IDE.files[IDE.activeTab].content = textarea.value;
        saveState();
        let highlight = document.querySelector(".ide-editor-highlight");
        if (highlight) highlight.innerHTML = hljs.highlight(textarea.value, {language: CODE_LANG[file.type] || "plaintext"}).value;
      }
    },
    async generateFromPrompt() {
      let userPrompt = window.prompt("Describe what you want to generate:");
      if (!userPrompt) return;
      let completion = await window.jenny?.chat.completions.create?.({
        messages: [
          {role:"system", content:"Write complete code based on the following prompt. Respond only with a modern complete code snippet."},
          {role:"user", content:userPrompt}],
      });
      let code = cleanCodeResponse(completion?.content || "");
      let textarea = document.querySelector(".ide-editor-pane textarea");
      if (!textarea) {
        let highlight = document.querySelector(".ide-editor-highlight");
        if (highlight && highlight.isContentEditable) {
          let caretPos = (() => {
            let caretOffset = 0;
            let sel = window.getSelection();
            if (sel && sel.anchorNode && highlight.contains(sel.anchorNode)) {
              let range = sel.getRangeAt(0);
              let preRange = range.cloneRange();
              preRange.selectNodeContents(highlight);
              preRange.setEnd(range.endContainer, range.endOffset);
              caretOffset = preRange.toString().length;
            }
            return caretOffset;
          })();
          let text = highlight.innerText.replace(/\u200B/g, "");
          let before = text.slice(0, caretPos);
          let after = text.slice(caretPos);
          let updated = before + code + after;
          highlight.innerText = updated;
          let lang = highlight.getAttribute("data-lang") || "plaintext";
          try {
            highlight.innerHTML = hljs.highlight(updated, {language: lang}).value || "";
          } catch {
            highlight.textContent = updated;
          }
          (function setCaretCharacterOffsetWithin(element, offset) {
            let nodeStack = [element], node, found = false, charCount = 0;
            let range = document.createRange();
            range.selectNodeContents(element);
            range.collapse(true);
            while (!found && (node = nodeStack.pop())) {
              if (node.nodeType === 3) {
                let nextCharCount = charCount + node.length;
                if (offset <= nextCharCount) {
                  range.setStart(node, offset - charCount);
                  range.collapse(true);
                  found = true;
                  break;
                }
                charCount = nextCharCount;
              } else {
                let i = node.childNodes.length;
                while (i--) nodeStack.push(node.childNodes[i]);
              }
            }
            if (found) {
              let sel = window.getSelection();
              sel.removeAllRanges();
              sel.addRange(range);
            }
          })(highlight, before.length + code.length);          
          let IDEfile = IDE.files[IDE.activeTab];
          if (IDEfile) {
            IDEfile.content = highlight.innerText.replace(/\u200B/g, "");
            saveState();
          }
        }
        return;
      }
      textarea.value += "\n" + code;
      IDE.files[IDE.activeTab].content = textarea.value;
      saveState();
      let file = IDE.files[IDE.activeTab];
      let highlightEl = document.querySelector(".ide-editor-highlight");
      if (highlightEl) highlightEl.innerHTML = hljs.highlight(textarea.value, {language: CODE_LANG[file.type] || "plaintext"}).value;
    },
    async themeAssist() {
      // Theme designer assist should generate the contents of style.css using LLM.
      const userPrompt = window.prompt(
        "Describe the theme you want for your CSS (e.g. dark, light, colors, fonts, etc.):",
        "A modern dark theme with accent color #ffd700, soft panel backgrounds, and elegant buttons"
      );
      if (!userPrompt) return;
      // Compose the prompt for style.css
      const sysPrompt = "Write a modern CSS stylesheet for a web project, based on the following theme requirements. Respond only with the valid CSS code (do NOT include explanations or code fences). Your response must preserve all linebreaks exactly as you would write in a real .css file.";
      const user = `Theme requirements:\n${userPrompt}`;

      // LLM call
      let completion = await window.jenny?.chat.completions.create?.({
        messages: [
          { role: "system", content: sysPrompt },
          { role: "user", content: user }
        ],
      });

      // Clean and normalize CSS result
      let css = cleanCodeResponse(completion?.content || "");

      // Set/update style.css file - always preserve newlines
      IDE.files["style.css"] = {
        type: "css",
        content: css
      };

      // Open or switch to style.css tab
      IDE.openTab("style.css");
      saveState();
      IDE.refreshSidebar?.();
      IDE.refreshTabs?.();
    }
  };
}

// ---- BOOT ----
window.addEventListener("DOMContentLoaded", ()=>{
  JennyIDE.init();
  window.jennyIDE = JennyIDE;
  window.ide = JennyIDE;
  // For easy testing in console
});
