// Theme toggle functionality
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeIconSun = document.getElementById('theme-icon-sun');
const themeIconMoon = document.getElementById('theme-icon-moon');

let currentTheme = localStorage.getItem('theme') || 'dark';

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
        themeIconSun.style.display = 'none';
        themeIconMoon.style.display = 'block';
    } else {
        themeIconSun.style.display = 'block';
        themeIconMoon.style.display = 'none';
    }
    localStorage.setItem('theme', theme);
}

themeToggleBtn.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(currentTheme);
});

// Apply theme on load
applyTheme(currentTheme);

// Tab switching
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('nav-tab')) {
        document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
        e.target.classList.add('active');
    }
});

// View switcher
document.addEventListener('click', (e) => {
    if (e.target.closest('#list-view-btn')) {
        document.getElementById('list-view-btn').classList.add('active');
        document.getElementById('board-view-btn').classList.remove('active');
        const container = document.querySelector('#notes-container');
        if (container) {
            container.classList.remove('board-view');
            container.classList.add('list-view');
        }
    } else if (e.target.closest('#board-view-btn')) {
        document.getElementById('board-view-btn').classList.add('active');
        document.getElementById('list-view-btn').classList.remove('active');
        const container = document.querySelector('#notes-container');
        if (container) {
            container.classList.remove('list-view');
            container.classList.add('board-view');
        }
    }
});

// Color palette functions
function toggleColorPalette(noteId) {
    const palette = document.getElementById(`palette-${noteId}`);
    if (palette) {
        // Hide other palettes
        document.querySelectorAll('.note-card-palette').forEach(p => {
            if (p !== palette) p.classList.remove('visible');
        });
        palette.classList.toggle('visible');
    }
}

function hidePalette(noteId) {
    const palette = document.getElementById(`palette-${noteId}`);
    if (palette) {
        palette.classList.remove('visible');
    }
}

// Hide palettes when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.note-card-color-btn') && !e.target.closest('.note-card-palette')) {
        document.querySelectorAll('.note-card-palette').forEach(p => p.classList.remove('visible'));
    }
});

// Markdown toggle functionality
function toggleMarkdownPreview(noteId) {
    const noteCard = document.querySelector(`.note-card[data-id="${noteId}"]`);
    if (!noteCard) return;

    const contentEl = noteCard.querySelector('.note-content');
    const markdownBtn = noteCard.querySelector('.note-card-markdown-btn');
    
    if (contentEl.contentEditable === 'true') {
        // Switch to preview mode
        const markdownContent = contentEl.textContent;
        const htmlContent = marked.parse(markdownContent);
        
        contentEl.innerHTML = htmlContent;
        contentEl.contentEditable = 'false';
        contentEl.classList.add('note-content-markdown');
        markdownBtn.classList.add('active');
        markdownBtn.title = "Edit markdown";
    } else {
        // Switch to edit mode
        // Get original content from data attribute or make HTMX call to get fresh content
        const originalContent = contentEl.dataset.originalContent || contentEl.textContent;
        contentEl.textContent = originalContent;
        contentEl.contentEditable = 'true';
        contentEl.classList.remove('note-content-markdown');
        markdownBtn.classList.remove('active');
        markdownBtn.title = "Toggle markdown preview";
    }
}

// Store original content when switching to preview
document.addEventListener('htmx:afterSettle', (e) => {
    // Store original content for markdown toggle
    document.querySelectorAll('.note-content[contenteditable="true"]').forEach(el => {
        if (!el.dataset.originalContent) {
            el.dataset.originalContent = el.textContent;
        }
    });
    
    // Auto-focus new notes
    if (e.detail.xhr.status === 200 && e.detail.requestConfig.verb === 'post' && e.detail.requestConfig.path === '/notes') {
        const newNoteContent = e.detail.target.querySelector('.note-content');
        if (newNoteContent) {
            newNoteContent.focus();
        }
    }
});

// Update original content when editing
document.addEventListener('input', (e) => {
    if (e.target.classList.contains('note-content') && e.target.contentEditable === 'true') {
        e.target.dataset.originalContent = e.target.textContent;
    }
});
