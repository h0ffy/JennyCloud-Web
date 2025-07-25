from fastapi import FastAPI, Request, Query
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import asyncio
import re
import os
import json
from typing import List, Optional
from dataclasses import dataclass
from pathlib import Path
import mimetypes

app = FastAPI(title="J-Cloud CodeSearch API")

# Mock data for demonstration - in real implementation, this would connect to ManticoreSearch
@dataclass
class SearchResult:
    file_path: str
    repository: str
    content: str
    line_number: int
    file_type: str
    match_context: str

# Mock repositories and code files
MOCK_REPOSITORIES = [
    {"name": "frontend-app", "description": "React frontend application"},
    {"name": "backend-api", "description": "FastAPI backend service"},
    {"name": "data-pipeline", "description": "ETL data processing pipeline"},
    {"name": "mobile-app", "description": "React Native mobile app"},
    {"name": "ml-models", "description": "Machine learning models and training"}
]

MOCK_CODE_FILES = {
    "frontend-app": [
        {
            "path": "src/components/SearchBar.js",
            "content": """import React, { useState, useEffect } from 'react';
import { debounce } from 'lodash';

export function SearchBar({ onSearch, placeholder }) {
    const [query, setQuery] = useState('');
    
    const debouncedSearch = debounce((searchTerm) => {
        onSearch(searchTerm);
    }, 300);
    
    useEffect(() => {
        debouncedSearch(query);
    }, [query, debouncedSearch]);
    
    return (
        <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="search-input"
        />
    );
}""",
            "type": "js"
        },
        {
            "path": "src/utils/api.js",
            "content": """class ApiClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }
    
    async get(endpoint, params = {}) {
        const url = new URL(endpoint, this.baseURL);
        Object.keys(params).forEach(key => 
            url.searchParams.append(key, params[key])
        );
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }
    
    async search(query, filters = {}) {
        return this.get('/search', { q: query, ...filters });
    }
}

export default ApiClient;""",
            "type": "js"
        }
    ],
    "backend-api": [
        {
            "path": "app/models/user.py",
            "content": """from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<User(username='{self.username}', email='{self.email}')>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }""",
            "type": "py"
        },
        {
            "path": "app/services/search_service.py",
            "content": """import asyncio
from typing import List, Dict, Any
from manticoresearch import Client

class SearchService:
    def __init__(self, manticore_host: str = "localhost", manticore_port: int = 9308):
        self.client = Client(f"http://{manticore_host}:{manticore_port}")
        
    async def index_repository(self, repo_name: str, files: List[Dict[str, Any]]):
        \"\"\"Index code files into ManticoreSearch\"\"\"
        index_name = f"code_{repo_name}"
        
        # Create index if not exists
        await self._create_index(index_name)
        
        # Index files
        for file_data in files:
            await self._index_file(index_name, file_data)
    
    async def search_code(self, query: str, filters: Dict[str, Any] = None) -> List[Dict]:
        \"\"\"Search code across indexed repositories\"\"\"
        search_query = {
            "index": "code_*",
            "query": {
                "match": {"content": query}
            },
            "highlight": {
                "fields": ["content"],
                "pre_tags": ["<mark>"],
                "post_tags": ["</mark>"]
            },
            "limit": 50
        }
        
        if filters:
            search_query["query"] = {
                "bool": {
                    "must": [search_query["query"]],
                    "filter": self._build_filters(filters)
                }
            }
        
        results = await self.client.search(search_query)
        return self._format_results(results)
    
    async def _create_index(self, index_name: str):
        schema = {
            "index": index_name,
            "body": {
                "mappings": {
                    "properties": {
                        "file_path": {"type": "text"},
                        "repository": {"type": "keyword"},
                        "content": {"type": "text"},
                        "file_type": {"type": "keyword"},
                        "line_count": {"type": "integer"}
                    }
                }
            }
        }
        try:
            await self.client.indices.create(**schema)
        except Exception:
            pass  # Index might already exist
            
    def _build_filters(self, filters: Dict[str, Any]) -> List[Dict]:
        filter_clauses = []
        
        if filters.get("file_types"):
            filter_clauses.append({
                "terms": {"file_type": filters["file_types"]}
            })
            
        if filters.get("repository"):
            filter_clauses.append({
                "term": {"repository": filters["repository"]}
            })
            
        return filter_clauses
    
    def _format_results(self, raw_results: Dict) -> List[Dict]:
        formatted = []
        for hit in raw_results.get("hits", {}).get("hits", []):
            result = {
                "file_path": hit["_source"]["file_path"],
                "repository": hit["_source"]["repository"],
                "content": hit["_source"]["content"],
                "file_type": hit["_source"]["file_type"],
                "score": hit["_score"]
            }
            
            if "highlight" in hit:
                result["highlighted_content"] = hit["highlight"].get("content", [""])[0]
            
            formatted.append(result)
            
        return formatted""",
            "type": "py"
        }
    ],
    "data-pipeline": [
        {
            "path": "processors/text_processor.py",
            "content": """import re
from typing import List, Dict, Optional
from dataclasses import dataclass

@dataclass
class ProcessedText:
    original: str
    cleaned: str
    tokens: List[str]
    metadata: Dict[str, any]

class TextProcessor:
    def __init__(self, remove_stopwords: bool = True):
        self.remove_stopwords = remove_stopwords
        self.stopwords = self._load_stopwords()
    
    def process(self, text: str, language: str = "en") -> ProcessedText:
        \"\"\"Process text and return structured result\"\"\"
        cleaned = self._clean_text(text)
        tokens = self._tokenize(cleaned)
        
        if self.remove_stopwords:
            tokens = self._remove_stopwords(tokens, language)
        
        metadata = {
            "original_length": len(text),
            "cleaned_length": len(cleaned),
            "token_count": len(tokens),
            "language": language
        }
        
        return ProcessedText(
            original=text,
            cleaned=cleaned,
            tokens=tokens,
            metadata=metadata
        )
    
    def _clean_text(self, text: str) -> str:
        # Remove special characters and normalize whitespace
        cleaned = re.sub(r'[^\w\s]', ' ', text)
        cleaned = re.sub(r'\s+', ' ', cleaned)
        return cleaned.strip().lower()
    
    def _tokenize(self, text: str) -> List[str]:
        return text.split()
    
    def _remove_stopwords(self, tokens: List[str], language: str) -> List[str]:
        return [token for token in tokens if token not in self.stopwords.get(language, set())]
    
    def _load_stopwords(self) -> Dict[str, set]:
        # In real implementation, load from files
        return {
            "en": {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"}
        }""",
            "type": "py"
        }
    ]
}

def get_file_language(file_path: str) -> str:
    """Determine language from file extension"""
    ext = Path(file_path).suffix.lower()
    language_map = {
        '.js': 'javascript',
        '.ts': 'typescript',
        '.py': 'python',
        '.html': 'html',
        '.css': 'css',
        '.json': 'json',
        '.yaml': 'yaml',
        '.yml': 'yaml',
        '.sql': 'sql',
        '.sh': 'bash',
        '.md': 'markdown'
    }
    return language_map.get(ext, 'text')

def highlight_matches(content: str, query: str) -> str:
    """Highlight search matches in content"""
    if not query.strip():
        return content
    
    # Simple highlighting - in real implementation, use proper tokenization
    pattern = re.compile(re.escape(query), re.IGNORECASE)
    return pattern.sub(f'<span class="match-highlight">{query}</span>', content)

def extract_context(content: str, query: str, context_lines: int = 3) -> List[Dict]:
    """Extract context around matches"""
    lines = content.split('\n')
    matches = []
    
    for i, line in enumerate(lines):
        if query.lower() in line.lower():
            start = max(0, i - context_lines)
            end = min(len(lines), i + context_lines + 1)
            
            context_lines_data = []
            for j in range(start, end):
                context_lines_data.append({
                    'line_number': j + 1,
                    'content': highlight_matches(lines[j], query),
                    'is_match': j == i
                })
            
            matches.append({
                'line_number': i + 1,
                'context': context_lines_data
            })
    
    return matches

@app.get("/repositories")
async def get_repositories():
    """Get list of available repositories"""
    html = ""
    for repo in MOCK_REPOSITORIES:
        html += f'''
        <div class="repo-item" data-repo="{repo['name']}" hx-get="/search" hx-target="#search-results">
            <strong>{repo['name']}</strong>
            <div style="font-size: 0.8rem; color: #8b949e; margin-top: 0.25rem;">
                {repo['description']}
            </div>
        </div>
        '''
    return HTMLResponse(html)

@app.get("/search")
async def search_code(
    q: str = Query("", description="Search query"),
    filetypes: str = Query("", description="Comma-separated file types"),
    repo: str = Query("", description="Repository filter")
):
    """Search code with filters"""
    if not q.strip():
        return HTMLResponse('<div class="no-results">Enter a search query to see results.</div>')
    
    # Parse filters
    file_type_filter = [ft.strip() for ft in filetypes.split(',') if ft.strip()] if filetypes else []
    
    # Mock search implementation
    results = []
    repositories_to_search = [repo] if repo else MOCK_CODE_FILES.keys()
    
    for repo_name in repositories_to_search:
        if repo_name not in MOCK_CODE_FILES:
            continue
            
        for file_data in MOCK_CODE_FILES[repo_name]:
            # Apply file type filter
            if file_type_filter and file_data['type'] not in file_type_filter:
                continue
            
            # Simple text search
            if q.lower() in file_data['content'].lower():
                matches = extract_context(file_data['content'], q)
                for match in matches[:2]:  # Limit matches per file
                    results.append({
                        'file_path': file_data['path'],
                        'repository': repo_name,
                        'file_type': file_data['type'],
                        'match': match,
                        'language': get_file_language(file_data['path'])
                    })
    
    # Sort by relevance (mock scoring)
    results.sort(key=lambda x: x['file_path'])
    
    if not results:
        return HTMLResponse('''
        <div class="no-results" style="text-align: center; padding: 2rem; color: #8b949e;">
            <div style="font-size: 2rem; margin-bottom: 1rem;">🔍</div>
            <h3>No results found</h3>
            <p>Try adjusting your search query or filters.</p>
        </div>
        ''')
    
    # Generate HTML results
    html = f'<div class="results-header" style="margin-bottom: 1rem; color: #8b949e;">Found {len(results)} results for "{q}"</div>'
    
    for result in results[:20]:  # Limit results
        context_html = ""
        for line_data in result['match']['context']:
            line_class = "match-line" if line_data['is_match'] else "context-line"
            context_html += f'''
            <div class="code-line {line_class}">
                <span class="line-number">{line_data['line_number']}</span>
                <span class="line-content">{line_data['content']}</span>
            </div>
            '''
        
        html += f'''
        <div class="search-result">
            <div class="result-header">
                <div class="result-path">{result['file_path']}</div>
                <div class="result-repo">{result['repository']}</div>
            </div>
            <div class="result-content">
                <pre><code class="language-{result['language']}">{context_html}</code></pre>
            </div>
        </div>
        '''
    
    return HTMLResponse(html)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

