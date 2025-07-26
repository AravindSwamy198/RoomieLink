// Common JavaScript utilities and functions

// Global Configuration
const CONFIG = {
    API_BASE_URL: '/api',
    STORAGE_PREFIX: 'roomielink_',
    DEBUG: true
};

// Utility Functions
const Utils = {
    // Local Storage wrapper
    storage: {
        set(key, value) {
            try {
                localStorage.setItem(CONFIG.STORAGE_PREFIX + key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Storage set error:', error);
                return false;
            }
        },

        get(key) {
            try {
                const item = localStorage.getItem(CONFIG.STORAGE_PREFIX + key);
                return item ? JSON.parse(item) : null;
            } catch (error) {
                console.error('Storage get error:', error);
                return null;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(CONFIG.STORAGE_PREFIX + key);
                return true;
            } catch (error) {
                console.error('Storage remove error:', error);
                return false;
            }
        },

        clear() {
            try {
                Object.keys(localStorage)
                    .filter(key => key.startsWith(CONFIG.STORAGE_PREFIX))
                    .forEach(key => localStorage.removeItem(key));
                return true;
            } catch (error) {
                console.error('Storage clear error:', error);
                return false;
            }
        }
    },

    // Date/Time utilities
    formatTimestamp(date) {
        const now = new Date();
        const messageDate = new Date(date);
        const diffTime = Math.abs(now - messageDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            return 'Today';
        } else if (diffDays === 2) {
            return 'Yesterday';
        } else if (diffDays <= 7) {
            return `${diffDays} days ago`;
        } else {
            return messageDate.toLocaleDateString();
        }
    },

    getCurrentTime() {
        return new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // String utilities
    sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // URL utilities
    getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    },

    // Validation utilities
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    isValidPhone(phone) {
        const re = /^\(\d{3}\)\s?\d{3}-\d{4}$/;
        return re.test(phone);
    }
};

// Notification System
const Notifications = {
    show(message, type = 'info', duration = 3000) {
        // Remove existing notifications
        const existing = document.querySelectorAll('.notification');
        existing.forEach(notif => notif.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // Add to DOM
        document.body.appendChild(notification);

        // Auto remove
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideUp 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, duration);

        // Log if debug mode
        if (CONFIG.DEBUG) {
            console.log(`Notification (${type}):`, message);
        }
    },

    success(message, duration) {
        this.show(message, 'success', duration);
    },

    error(message, duration) {
        this.show(message, 'error', duration);
    },

    warning(message, duration) {
        this.show(message, 'warning', duration);
    },

    info(message, duration) {
        this.show(message, 'info', duration);
    }
};

// Loading Spinner Control
const Loading = {
    show() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.classList.add('show');
        }
    },

    hide() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.classList.remove('show');
        }
    }
};

// Navigation Functions
function navigateToPage(page) {
    Loading.show();
    
    // Add small delay for smooth transition
    setTimeout(() => {
        window.location.href = page;
    }, 300);
}

function navigateToSection(section) {
    Notifications.info(`${section.replace('-', ' ')} section coming soon!`);
    closeSidebar();
}

// Sidebar Functions
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    if (sidebar && overlay) {
        sidebar.classList.add('open');
        overlay.classList.add('show');
        
        // Prevent body scroll when sidebar is open
        document.body.style.overflow = 'hidden';
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    if (sidebar && overlay) {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
        
        // Re-enable body scroll
        document.body.style.overflow = '';
    }
}

// Tab Management
function switchTab(tabName) {
    // Remove active class from all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab content
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to clicked nav tab
    const clickedTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (clickedTab) {
        clickedTab.classList.add('active');
    }
    
    // Trigger tab-specific loading
    const event = new CustomEvent('tabChanged', { detail: tabName });
    document.dispatchEvent(event);
    
    if (CONFIG.DEBUG) {
        console.log(`Switched to ${tabName} tab`);
    }
}

// User Management
const User = {
    current: null,

    set(userData) {
        this.current = userData;
        Utils.storage.set('currentUser', userData);
        this.updateUI();
    },

    get() {
        if (!this.current) {
            this.current = Utils.storage.get('currentUser');
        }
        return this.current;
    },

    clear() {
        this.current = null;
        Utils.storage.remove('currentUser');
    },

    updateUI() {
        if (this.current) {
            // Update profile buttons
            document.querySelectorAll('.profile-btn').forEach(btn => {
                btn.textContent = this.current.initials || this.current.name?.charAt(0) || 'U';
            });
            
            // Update sidebar profile
            const sidebarAvatar = document.querySelector('.sidebar-avatar');
            const sidebarName = document.querySelector('.sidebar-name');
            const sidebarRole = document.querySelector('.sidebar-university, .sidebar-role');
            
            if (sidebarAvatar) {
                sidebarAvatar.textContent = this.current.initials || this.current.name?.charAt(0) || 'U';
            }
            
            if (sidebarName) {
                sidebarName.textContent = this.current.name || 'User';
            }
            
            if (sidebarRole) {
                sidebarRole.textContent = this.current.university || this.current.role || '';
            }
        }
    }
};

// Logout Function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear user data
        User.clear();
        
        // Clear any app-specific data
        Utils.storage.clear();
        
        // Show notification
        Notifications.success('Logged out successfully');
        
        // Navigate to landing page
        setTimeout(() => {
            navigateToPage('index.html');
        }, 1000);
    }
}

// Event Listeners Setup
function setupCommonEventListeners() {
    // Escape key to close sidebar
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeSidebar();
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });
    
    // Handle tab clicks
    document.addEventListener('click', function(e) {
        if (e.target.matches('.nav-tab')) {
            const tabName = e.target.getAttribute('data-tab');
            if (tabName) {
                switchTab(tabName);
            }
        }
    });
    
    // Handle overlay clicks
    document.addEventListener('click', function(e) {
        if (e.target.matches('.overlay')) {
            closeSidebar();
        }
    });
}

// Error Handling
window.addEventListener('error', function(e) {
    console.error('Application error:', e.error);
    
    if (CONFIG.DEBUG) {
        Notifications.error('An error occurred. Check console for details.');
    } else {
        Notifications.error('Something went wrong. Please refresh the page.');
    }
});

// Unhandled Promise Rejection
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    
    if (CONFIG.DEBUG) {
        Notifications.error('Promise rejection: ' + e.reason);
    }
});

// Initialize common functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupCommonEventListeners();
    
    // Load user data if exists
    const userData = User.get();
    if (userData) {
        User.updateUI();
    }
    
    if (CONFIG.DEBUG) {
        console.log('Common JS initialized');
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Utils,
        Notifications,
        Loading,
        User,
        CONFIG
    };
}