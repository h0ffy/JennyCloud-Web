import { marked } from 'marked';

document.addEventListener('DOMContentLoaded', () => {
    const codeEditor = document.getElementById('code-editor');
    const helperPromptInput = document.getElementById('helper-prompt');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.querySelector('.theme-icon');

    // Theme toggle functionality
    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    // Handle AI helper response to append to code editor
    document.body.addEventListener('htmx:afterRequest', (evt) => {
        if (evt.detail.pathInfo.requestPath === '/api/helper' && evt.detail.successful) {
            const response = evt.detail.xhr.responseText;
            codeEditor.value += response;
            helperPromptInput.value = ''; // Clear input on success
        }
    });

    // Re-execute scripts in visual output after HTMX swaps
    document.body.addEventListener('htmx:afterSwap', (evt) => {
        const outputDisplay = document.getElementById('output-display');
        if (outputDisplay) {
            const scripts = outputDisplay.getElementsByTagName('script');
            for (let i = 0; i < scripts.length; i++) {
                const script = document.createElement('script');
                script.text = scripts[i].innerText;
                scripts[i].parentNode.replaceChild(script, scripts[i]);
            }
        }
    });

    // Keyboard shortcut for submitting the runner form (Ctrl+Enter or Cmd+Enter)
    codeEditor.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            htmx.trigger('#code-runner-form', 'submit');
        }
    });
});
