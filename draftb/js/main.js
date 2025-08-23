// Main Application Module
const app = {
    init() {
        // Check for Firebase configuration
        if (firebaseConfig.apiKey === "YOUR_API_KEY") {
            this.showFirebaseSetupMessage();
            return;
        }
        
        // Initialize modules
        authModule.init();
        draftModule.init();
        
        // Setup dark mode
        this.setupDarkMode();
        
        // Setup sound preferences
        this.setupSoundPreferences();
        
        // Initialize UI
        this.setupUI();
        
        console.log('Fantasy Draft Engine initialized successfully!');
    },
    
    showFirebaseSetupMessage() {
        document.body.innerHTML = `
            <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <div class="max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                    <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-6">Firebase Setup Required</h1>
                    
                    <div class="space-y-4 text-gray-600 dark:text-gray-300">
                        <p>To use this Fantasy Draft Engine, you need to set up Firebase:</p>
                        
                        <ol class="list-decimal list-inside space-y-2 ml-4">
                            <li>Go to <a href="https://console.firebase.google.com" target="_blank" class="text-indigo-600 hover:underline">Firebase Console</a></li>
                            <li>Create a new project or select an existing one</li>
                            <li>Enable Authentication (Email/Password and Google Sign-In)</li>
                            <li>Enable Realtime Database</li>
                            <li>Go to Project Settings → General → Your apps → Web app</li>
                            <li>Copy your Firebase configuration</li>
                            <li>Replace the placeholder values in <code class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">js/config.js</code></li>
                        </ol>
                        
                        <div class="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <p class="font-semibold mb-2">Firebase Realtime Database Rules:</p>
                            <pre class="text-sm overflow-x-auto"><code>{
  "rules": {
    "drafts": {
      ".read": "auth != null",
      "$draftId": {
        ".write": "auth != null"
      }
    },
    "users": {
      "$userId": {
        ".read": "$userId === auth.uid",
        ".write": "$userId === auth.uid"
      }
    }
  }
}</code></pre>
                        </div>
                        
                        <div class="mt-6">
                            <p class="text-sm text-gray-500">After setting up Firebase, refresh this page to start using the Draft Engine!</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    setupDarkMode() {
        const darkModeToggle = document.getElementById('darkModeToggle');
        
        // Check for saved preference or default to light mode
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            darkModeToggle.innerHTML = '<i class="fas fa-sun text-gray-600 dark:text-gray-300"></i>';
        }
        
        darkModeToggle.addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('darkMode', isDark);
            
            if (isDark) {
                darkModeToggle.innerHTML = '<i class="fas fa-sun text-gray-600 dark:text-gray-300"></i>';
            } else {
                darkModeToggle.innerHTML = '<i class="fas fa-moon text-gray-600 dark:text-gray-300"></i>';
            }
        });
    },
    
    setupSoundPreferences() {
        // Initialize sound preference
        if (localStorage.getItem('soundEnabled') === null) {
            localStorage.setItem('soundEnabled', 'true');
        }
        
        // Create sound toggle button
        const soundToggle = document.createElement('button');
        soundToggle.className = 'sound-toggle px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition';
        soundToggle.innerHTML = localStorage.getItem('soundEnabled') === 'true' 
            ? '<i class="fas fa-volume-up text-gray-600 dark:text-gray-300"></i>'
            : '<i class="fas fa-volume-mute text-gray-400"></i>';
        
        soundToggle.addEventListener('click', () => {
            const isEnabled = localStorage.getItem('soundEnabled') === 'true';
            localStorage.setItem('soundEnabled', !isEnabled);
            
            soundToggle.innerHTML = !isEnabled
                ? '<i class="fas fa-volume-up text-gray-600 dark:text-gray-300"></i>'
                : '<i class="fas fa-volume-mute text-gray-400"></i>';
            
            utils.showToast(`Sound ${!isEnabled ? 'enabled' : 'disabled'}`, 'info');
        });
        
        document.body.appendChild(soundToggle);
    },
    
    setupUI() {
        // Add smooth scrolling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
        
        // Add input validation
        this.setupInputValidation();
        
        // Add keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Add responsive menu for mobile
        this.setupMobileMenu();
    },
    
    setupInputValidation() {
        // Email validation
        document.querySelectorAll('input[type="email"]').forEach(input => {
            input.addEventListener('blur', () => {
                const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
                if (input.value && !isValid) {
                    input.classList.add('border-red-500');
                    utils.showToast('Please enter a valid email address', 'error');
                } else {
                    input.classList.remove('border-red-500');
                }
            });
        });
        
        // Number input validation
        document.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('input', () => {
                const min = parseInt(input.getAttribute('min'));
                const max = parseInt(input.getAttribute('max'));
                const value = parseInt(input.value);
                
                if (value < min) input.value = min;
                if (value > max) input.value = max;
            });
        });
    },
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('playerSearch');
                if (searchInput && !searchInput.classList.contains('hidden')) {
                    searchInput.focus();
                }
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                // Close any open modals
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.classList.add('hidden');
                });
            }
            
            // D for dark mode toggle
            if (e.key === 'd' && e.altKey) {
                e.preventDefault();
                document.getElementById('darkModeToggle').click();
            }
        });
    },
    
    setupMobileMenu() {
        // Add mobile menu toggle if needed
        const isMobile = window.innerWidth < 768;
        
        if (isMobile) {
            // Adjust layout for mobile
            document.querySelectorAll('.grid').forEach(grid => {
                grid.classList.add('grid-cols-1');
            });
        }
        
        // Handle resize events
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResponsiveLayout();
            }, 250);
        });
    },
    
    handleResponsiveLayout() {
        const isMobile = window.innerWidth < 768;
        const isTablet = window.innerWidth < 1024;
        
        // Adjust layouts based on screen size
        if (isMobile) {
            // Mobile adjustments
            document.querySelectorAll('.lg\\:col-span-2').forEach(el => {
                el.classList.remove('lg:col-span-2');
                el.classList.add('col-span-1');
            });
        } else if (isTablet) {
            // Tablet adjustments
            document.querySelectorAll('.lg\\:col-span-2').forEach(el => {
                el.classList.add('md:col-span-2');
            });
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Handle page visibility changes (for timer management)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, pause any non-critical operations
        if (draftModule.timerInterval && !draftModule.isMyTurn) {
            clearInterval(draftModule.timerInterval);
        }
    } else {
        // Page is visible again, resume operations
        if (draftModule.currentDraft && draftModule.currentDraft.status === 'active') {
            draftModule.startPickTimer();
        }
    }
});

// Handle beforeunload event
window.addEventListener('beforeunload', (e) => {
    if (draftModule.currentDraft && draftModule.isMyTurn) {
        e.preventDefault();
        e.returnValue = 'You have an active pick. Are you sure you want to leave?';
    }
});

// Service Worker registration (for PWA support)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment to enable service worker
        // navigator.serviceWorker.register('/sw.js');
    });
}

// Error handling
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    utils.showToast('An unexpected error occurred', 'error');
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    utils.showToast('An unexpected error occurred', 'error');
});