import 'htmx.org';
import { marked } from 'marked';

class FileManager {
    constructor() {
        this.apiBase = '/api';
        this.currentFile = null;
        this.initializeElements();
        this.setupEventListeners();
        this.setupHTMX();
    }

    initializeElements() {
        this.elements = {
            fileList: document.getElementById('fileListContainer'),
            contentTitle: document.getElementById('contentViewerTitle'),
            editorControls: document.querySelector('.editor-main-controls'),
            tabsContainer: document.querySelector('.tabs'),
            editorTab: document.querySelector('.tab-button[data-tab="editor"]'),
            previewTab: document.querySelector('.tab-button[data-tab="preview"]'),
            editorContent: document.getElementById('editorTabContent'),
            previewContent: document.getElementById('previewTabContent'),
            nonMdContainer: document.getElementById('nonMdPreviewContainer'),
            markdownEditor: document.getElementById('markdownEditorArea'),
            markdownPreview: document.getElementById('markdownPreviewArea'),
            livePreview: document.getElementById('livePreviewToggle'),
            saveButton: document.getElementById('saveFileButton'),
            clearButton: document.getElementById('clearEditorButton'),
            newFileButton: document.getElementById('newFileButton'),
            newFileActionBtn: document.getElementById('newFileActionBtn'),
            downloadBtn: document.getElementById('downloadFileActionBtn'),
            deleteBtn: document.getElementById('deleteFileActionBtn'),
            compressBtn: null, // Not present in original code
            searchBtn: null // Not present in original code
        };
    }

    setupEventListeners() {
        // Tab switching
        this.elements.editorTab?.addEventListener('click', () => this.switchTab('editor'));
        this.elements.previewTab?.addEventListener('click', () => this.switchTab('preview'));

        // Editor events
        this.elements.markdownEditor?.addEventListener('input', () => this.handleEditorInput());
        this.elements.livePreview?.addEventListener('change', () => this.handleLivePreviewToggle());

        // Control buttons
        this.elements.saveButton?.addEventListener('click', () => this.saveFile());
        this.elements.clearButton?.addEventListener('click', () => this.clearEditor());
        this.elements.newFileButton?.addEventListener('click', () => this.createNewFile());
        this.elements.newFileActionBtn?.addEventListener('click', () => this.createNewFile());
        this.elements.downloadBtn?.addEventListener('click', () => this.downloadFile());
        this.elements.deleteBtn?.addEventListener('click', () => this.deleteFile());

        // Global file selection handler
        window.selectFile = (element) => this.selectFile(element);
        window.toggleFolder = (element) => this.toggleFolder(element);
    }

    setupHTMX() {
        // HTMX event listeners for API responses
        document.addEventListener('htmx:afterRequest', (event) => {
            if (event.detail.failed) {
                this.showNotification('API request failed', 'error');
            }
        });

        document.addEventListener('htmx:responseError', (event) => {
            this.showNotification('Server error occurred', 'error');
        });
    }

    async selectFile(element) {
        // Remove previous selection
        document.querySelectorAll('.selected-file').forEach(el => 
            el.classList.remove('selected-file')
        );
        
        element.classList.add('selected-file');
        
        const filename = element.dataset.filename;
        const filetype = element.dataset.filetype;
        
        this.currentFile = { filename, filetype, element };
        
        try {
            const response = await fetch(`${this.apiBase}/files/${filename}`);
            const content = await response.text();
            
            this.updateContentViewer(content);
        } catch (error) {
            this.showNotification('Failed to load file content', 'error');
            console.error('Error loading file:', error);
        }
    }

    updateContentViewer(content) {
        if (!this.currentFile) return;

        const { filename, filetype } = this.currentFile;

        if (filetype === 'md') {
            this.elements.contentTitle.textContent = `Editor: ${filename}`;
            this.elements.editorControls.style.display = 'flex';
            this.elements.tabsContainer.style.display = 'flex';
            this.elements.nonMdContainer.classList.remove('active');
            this.elements.nonMdContainer.style.display = 'none';

            this.elements.markdownEditor.value = content;
            this.elements.markdownEditor.disabled = false;
            
            if (this.elements.livePreview.checked) {
                this.elements.markdownPreview.innerHTML = marked(content);
            }
            
            this.switchTab('editor');
        } else {
            this.elements.contentTitle.textContent = `Viewer: ${filename}`;
            this.elements.editorControls.style.display = 'none';
            this.elements.tabsContainer.style.display = 'none';
            
            this.elements.editorContent.classList.remove('active');
            this.elements.previewContent.classList.remove('active');
            this.elements.editorContent.style.display = 'none';
            this.elements.previewContent.style.display = 'none';

            this.elements.nonMdContainer.style.display = 'block';
            this.elements.nonMdContainer.classList.add('active');
            this.elements.nonMdContainer.innerHTML = `<pre>${content}</pre>`;
            
            this.elements.markdownEditor.disabled = true;
        }
    }

    switchTab(tabName) {
        if (tabName === 'editor') {
            this.elements.editorTab.classList.add('active');
            this.elements.previewTab.classList.remove('active');
            this.elements.editorContent.classList.add('active');
            this.elements.editorContent.style.display = 'block';
            this.elements.previewContent.classList.remove('active');
            this.elements.previewContent.style.display = 'none';
        } else if (tabName === 'preview') {
            this.elements.previewTab.classList.add('active');
            this.elements.editorTab.classList.remove('active');
            this.elements.previewContent.classList.add('active');
            this.elements.previewContent.style.display = 'block';
            this.elements.editorContent.classList.remove('active');
            this.elements.editorContent.style.display = 'none';
            
            if (this.currentFile?.filetype === 'md') {
                this.elements.markdownPreview.innerHTML = marked(this.elements.markdownEditor.value);
            }
        }
    }

    handleEditorInput() {
        if (this.elements.livePreview.checked && this.currentFile?.filetype === 'md') {
            this.elements.markdownPreview.innerHTML = marked(this.elements.markdownEditor.value);
        }
    }

    handleLivePreviewToggle() {
        if (this.elements.livePreview.checked && this.currentFile?.filetype === 'md') {
            this.elements.markdownPreview.innerHTML = marked(this.elements.markdownEditor.value);
        } else if (this.currentFile?.filetype === 'md') {
            this.elements.markdownPreview.innerHTML = '<p>Live preview is disabled.</p>';
        }
    }

    async saveFile() {
        if (!this.currentFile || this.currentFile.filetype !== 'md') {
            this.showNotification('No markdown file selected', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/files/${this.currentFile.filename}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: this.elements.markdownEditor.value
                })
            });

            if (response.ok) {
                this.showNotification('File saved successfully', 'success');
            } else {
                throw new Error('Save failed');
            }
        } catch (error) {
            this.showNotification('Failed to save file', 'error');
            console.error('Error saving file:', error);
        }
    }

    clearEditor() {
        if (this.currentFile?.filetype === 'md') {
            this.elements.markdownEditor.value = '';
            if (this.elements.livePreview.checked) {
                this.elements.markdownPreview.innerHTML = marked('');
            }
        }
    }

    async createNewFile() {
        const filename = prompt('Enter new Markdown file name (e.g., mydoc.md):');
        if (!filename) return;

        const safeFilename = filename.endsWith('.md') ? filename : `${filename}.md`;

        try {
            const response = await fetch(`${this.apiBase}/files`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filename: safeFilename,
                    content: `# ${safeFilename}\n\nStart writing your Markdown here.`
                })
            });

            if (response.ok) {
                this.showNotification('File created successfully', 'success');
                this.refreshFileList();
            } else {
                throw new Error('Creation failed');
            }
        } catch (error) {
            this.showNotification('Failed to create file', 'error');
            console.error('Error creating file:', error);
        }
    }

    async deleteFile() {
        if (!this.currentFile) {
            this.showNotification('No file selected', 'error');
            return;
        }

        if (!confirm(`Delete ${this.currentFile.filename}?`)) return;

        try {
            const response = await fetch(`${this.apiBase}/files/${this.currentFile.filename}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showNotification('File deleted successfully', 'success');
                this.refreshFileList();
                this.resetViewer();
            } else {
                throw new Error('Delete failed');
            }
        } catch (error) {
            this.showNotification('Failed to delete file', 'error');
            console.error('Error deleting file:', error);
        }
    }

    async downloadFile() {
        if (!this.currentFile) {
            this.showNotification('No file selected', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/files/${this.currentFile.filename}/download`);
            const blob = await response.blob();
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = this.currentFile.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showNotification('Download started', 'success');
        } catch (error) {
            this.showNotification('Failed to download file', 'error');
            console.error('Error downloading file:', error);
        }
    }

    async compressFile() {
        // Not implemented as compress button is not present in original code
    }

    async searchFiles() {
        // Not implemented as search button is not present in original code
    }

    toggleFolder(element) {
        const subList = element.nextElementSibling;
        if (subList && subList.tagName === 'UL') {
            subList.style.display = subList.style.display === 'none' ? 'block' : 'none';
            element.textContent = (subList.style.display === 'none' ? '📂 ' : '📁 ') + element.textContent.substring(2);
        }
    }

    refreshFileList() {
        // Trigger HTMX refresh of file list
        // htmx.trigger('#fileListContainer', 'refreshFiles'); // Not implemented as HTMX is not fully utilized
    }

    resetViewer() {
        this.currentFile = null;
        this.elements.contentTitle.textContent = 'Select a file';
        this.elements.editorControls.style.display = 'none';
        this.elements.tabsContainer.style.display = 'none';
        this.elements.nonMdContainer.innerHTML = '<p>Select a file to view its content.</p>';
        this.elements.nonMdContainer.classList.add('active');
        this.elements.nonMdContainer.style.display = 'block';
        this.elements.markdownEditor.value = '';
        this.elements.markdownEditor.disabled = true;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new FileManager();
});