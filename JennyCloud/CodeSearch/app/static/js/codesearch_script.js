// Initialize syntax highlighting
document.addEventListener('DOMContentLoaded', function() {
    hljs.highlightAll();
    
    // Initialize theme
    initializeTheme();
    
    // Update search when filters change
    document.addEventListener('change', function(e) {
        if (e.target.matches('input[name="filetype"]')) {
            triggerSearch();
        }
    });
    
    // Handle repository selection
    document.addEventListener('click', function(e) {
        if (e.target.matches('.repo-item')) {
            e.preventDefault();
            
            // Update active state
            document.querySelectorAll('.repo-item').forEach(item => {
                item.classList.remove('active');
            });
            e.target.classList.add('active');
            
            // Trigger search with selected repo
            triggerSearch();
        }
    });
    
    // Handle theme toggle
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
});

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('.theme-icon');
    
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        themeIcon.textContent = '☀️';
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeIcon.textContent = '🌙';
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('.theme-icon');
    
    if (currentTheme === 'light') {
        document.documentElement.removeAttribute('data-theme');
        themeIcon.textContent = '🌙';
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        themeIcon.textContent = '☀️';
        localStorage.setItem('theme', 'light');
    }
    
    // Add a subtle animation to indicate the theme change
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
}

function triggerSearch() {
    const searchInput = document.getElementById('search-input');
    const query = searchInput.value.trim();
    
    if (query.length === 0) {
        document.getElementById('search-results').innerHTML = getWelcomeMessage();
        return;
    }
    
    // Get selected filters
    const fileTypes = Array.from(document.querySelectorAll('input[name="filetype"]:checked'))
        .map(cb => cb.value);
    
    const activeRepo = document.querySelector('.repo-item.active');
    const repoFilter = activeRepo ? activeRepo.dataset.repo : '';
    
    // Build query parameters
    const params = new URLSearchParams({
        q: query,
        filetypes: fileTypes.join(','),
        repo: repoFilter
    });
    
    // Trigger HTMX request
    htmx.ajax('GET', `/search?${params.toString()}`, {
        target: '#search-results',
        indicator: '#loading'
    });
}

function getWelcomeMessage() {
    return `
        <div class="welcome-message">
            <div class="welcome-icon">🚀</div>
            <h2>Welcome to CodeSearch</h2>
            <p>Start typing to search across your codebase. Find functions, classes, variables, and more with lightning-fast results.</p>
            <div class="search-tips">
                <h4>Search Tips:</h4>
                <ul>
                    <li>Use <code>function:name</code> to search for specific functions</li>
                    <li>Use <code>class:name</code> to find class definitions</li>
                    <li>Use <code>file:name</code> to search by filename</li>
                    <li>Use quotes for exact matches: <code>"exact phrase"</code></li>
                </ul>
            </div>
        </div>
    `;
}

// Re-highlight code after HTMX updates
document.addEventListener('htmx:afterSwap', function(e) {
    if (e.target.id === 'search-results') {
        // Highlight any new code blocks
        e.target.querySelectorAll('pre code').forEach(block => {
            hljs.highlightElement(block);
        });
        
        // Add smooth scroll animation to results
        e.target.style.opacity = '0';
        e.target.style.transform = 'translateY(10px)';
        
        requestAnimationFrame(() => {
            e.target.style.transition = 'all 0.3s ease';
            e.target.style.opacity = '1';
            e.target.style.transform = 'translateY(0)';
        });
    }
});

// Handle search input with debouncing
let searchTimeout;
document.addEventListener('input', function(e) {
    if (e.target.id === 'search-input') {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            triggerSearch();
        }, 300);
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Focus search with Ctrl/Cmd + K
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-input').focus();
    }
    
    // Clear search with Escape
    if (e.key === 'Escape' && document.activeElement.id === 'search-input') {
        document.getElementById('search-input').value = '';
        document.getElementById('search-results').innerHTML = getWelcomeMessage();
    }
});
