// Landing Page JavaScript

// Landing page state
const LandingPage = {
    selectedUserType: null,
    isNavigating: false
};

// Navigation Functions
function navigateToStudent() {
    if (LandingPage.isNavigating) return;
    
    LandingPage.selectedUserType = 'student';
    LandingPage.isNavigating = true;
    
    // Add visual feedback
    const studentCard = document.querySelector('.user-type-card:first-child');
    if (studentCard) {
        studentCard.style.transform = 'scale(0.95)';
        studentCard.style.opacity = '0.8';
    }
    
    // Show loading
    Loading.show();
    
    // Store user preference
    Utils.storage.set('userType', 'student');
    
    // Navigate after animation
    setTimeout(() => {
        window.location.href = 'student.html';
    }, 300);
    
    console.log('Navigating to student login');
}

function navigateToLandlord() {
    if (LandingPage.isNavigating) return;
    
    LandingPage.selectedUserType = 'landlord';
    LandingPage.isNavigating = true;
    
    // Add visual feedback
    const landlordCard = document.querySelector('.user-type-card:last-child');
    if (landlordCard) {
        landlordCard.style.transform = 'scale(0.95)';
        landlordCard.style.opacity = '0.8';
    }
    
    // Show loading
    Loading.show();
    
    // Store user preference
    Utils.storage.set('userType', 'landlord');
    
    // Navigate after animation
    setTimeout(() => {
        window.location.href = 'landlord.html';
    }, 300);
    
    console.log('Navigating to landlord dashboard');
}

// Enhanced card interactions
function setupCardInteractions() {
    const cards = document.querySelectorAll('.user-type-card');
    
    cards.forEach(card => {
        // Add hover animations
        card.addEventListener('mouseenter', () => {
            if (!LandingPage.isNavigating) {
                card.style.transform = 'translateY(-12px) scale(1.02)';
            }
        });
        
        card.addEventListener('mouseleave', () => {
            if (!LandingPage.isNavigating) {
                card.style.transform = 'translateY(0) scale(1)';
            }
        });
        
        // Add click animation
        card.addEventListener('mousedown', () => {
            if (!LandingPage.isNavigating) {
                card.style.transform = 'translateY(-6px) scale(0.98)';
            }
        });
        
        card.addEventListener('mouseup', () => {
            if (!LandingPage.isNavigating) {
                card.style.transform = 'translateY(-12px) scale(1.02)';
            }
        });
    });
}

// Keyboard navigation
function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        if (LandingPage.isNavigating) return;
        
        switch(e.key) {
            case '1':
                navigateToStudent();
                break;
            case '2':
                navigateToLandlord();
                break;
            case 'ArrowUp':
            case 'ArrowDown':
                e.preventDefault();
                toggleCardFocus();
                break;
            case 'Enter':
                e.preventDefault();
                const focusedCard = document.querySelector('.user-type-card:focus');
                if (focusedCard) {
                    focusedCard.click();
                }
                break;
        }
    });
}

function toggleCardFocus() {
    const cards = document.querySelectorAll('.user-type-card');
    const focusedIndex = Array.from(cards).findIndex(card => card === document.activeElement);
    
    if (focusedIndex === -1) {
        cards[0].focus();
    } else {
        const nextIndex = (focusedIndex + 1) % cards.length;
        cards[nextIndex].focus();
    }
}

// Add accessibility features
function setupAccessibility() {
    const cards = document.querySelectorAll('.user-type-card');
    
    cards.forEach((card, index) => {
        // Add tabindex for keyboard navigation
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Select ${index === 0 ? 'Student' : 'Landlord'} account type`);
        
        // Add keyboard event listeners
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });
        
        // Add focus indicators
        card.addEventListener('focus', () => {
            card.style.outline = '3px solid #667eea';
            card.style.outlineOffset = '4px';
        });
        
        card.addEventListener('blur', () => {
            card.style.outline = 'none';
        });
    });
}

// Analytics and tracking
function trackUserTypeSelection(userType) {
    console.log(`User selected: ${userType}`);
    
    // Store selection timestamp
    Utils.storage.set('selectionTimestamp', new Date().toISOString());
    
    // Track in browser's performance timeline
    if (performance.mark) {
        performance.mark(`user-type-selected-${userType}`);
    }
}

// Error handling for navigation
function handleNavigationError(error, userType) {
    console.error(`Navigation error for ${userType}:`, error);
    
    // Reset navigation state
    LandingPage.isNavigating = false;
    Loading.hide();
    
    // Show error message
    Notifications.error(`Failed to load ${userType} page. Please try again.`);
    
    // Reset card visual state
    const cards = document.querySelectorAll('.user-type-card');
    cards.forEach(card => {
        card.style.transform = '';
        card.style.opacity = '';
    });
}

// Preload next pages for better performance
function preloadPages() {
    const studentLink = document.createElement('link');
    studentLink.rel = 'prefetch';
    studentLink.href = 'student.html';
    document.head.appendChild(studentLink);
    
    const landlordLink = document.createElement('link');
    landlordLink.rel = 'prefetch';
    landlordLink.href = 'landlord.html';
    document.head.appendChild(landlordLink);
    
    console.log('Pages preloaded for faster navigation');
}

// Check for returning users
function checkReturningUser() {
    const previousUserType = Utils.storage.get('userType');
    const lastVisit = Utils.storage.get('lastVisit');
    
    if (previousUserType && lastVisit) {
        const daysSinceLastVisit = Math.floor((Date.now() - new Date(lastVisit)) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastVisit < 7) {
            // Show returning user message
            setTimeout(() => {
                Notifications.info(`Welcome back! Continue as ${previousUserType}?`);
            }, 1000);
            
            // Highlight previous choice
            const cardIndex = previousUserType === 'student' ? 0 : 1;
            const cards = document.querySelectorAll('.user-type-card');
            if (cards[cardIndex]) {
                cards[cardIndex].style.borderColor = '#667eea';
                cards[cardIndex].style.backgroundColor = '#f8f9ff';
            }
        }
    }
    
    // Update last visit
    Utils.storage.set('lastVisit', new Date().toISOString());
}

// Add animation delays for better UX
function addStaggeredAnimations() {
    const cards = document.querySelectorAll('.user-type-card');
    
    cards.forEach((card, index) => {
        card.style.animationDelay = `${0.2 + (index * 0.2)}s`;
        card.classList.add('fade-in');
    });
}

// Create floating particles background
function createParticles() {
    const particleContainer = document.createElement('div');
    particleContainer.className = 'particles';
    document.body.appendChild(particleContainer);
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
        particleContainer.appendChild(particle);
    }
}

// Navigation hint management
function setupNavigationHint() {
    const hint = document.getElementById('navigationHint');
    if (!hint) return;
    
    let hintShown = false;
    
    // Show hint when user starts using keyboard
    document.addEventListener('keydown', () => {
        if (!hintShown) {
            hint.classList.add('show');
            hintShown = true;
            
            // Hide after 4 seconds
            setTimeout(() => {
                hint.classList.remove('show');
            }, 4000);
        }
    });
    
    // Hide hint when user clicks
    document.addEventListener('click', () => {
        if (hintShown) {
            hint.classList.remove('show');
        }
    });
}

// Initialize landing page
function initializeLandingPage() {
    // Setup interactions
    setupCardInteractions();
    setupKeyboardNavigation();
    setupAccessibility();
    setupNavigationHint();
    
    // Performance optimizations
    preloadPages();
    
    // User experience enhancements
    checkReturningUser();
    addStaggeredAnimations();
    createParticles();
    
    console.log('Landing page initialized');
}

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && LandingPage.isNavigating) {
        // Reset navigation state if user comes back to tab
        setTimeout(() => {
            if (LandingPage.isNavigating) {
                LandingPage.isNavigating = false;
                Loading.hide();
                Notifications.warning('Navigation was interrupted. Please try again.');
            }
        }, 5000);
    }
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the landing page
    if (document.querySelector('.user-type-selection')) {
        initializeLandingPage();
    }
});

// Handle browser back button
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        // Page was loaded from cache, reset state
        LandingPage.isNavigating = false;
        Loading.hide();
    }
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        LandingPage,
        navigateToStudent,
        navigateToLandlord,
        initializeLandingPage
    };
}