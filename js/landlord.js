// Landlord Dashboard JavaScript with localStorage Password Authentication

// Authentication and User Management for Landlords
const LandlordAuth = {
    currentUser: null,
    
    // Initialize user system
    initializeUserSystem() {
        const existingUsers = Utils.storage.get('users');
        if (!existingUsers) {
            Utils.storage.set('users', { students: {}, landlords: {} });
            console.log('Landlord user system initialized');
        } else {
            console.log('Landlord user system loaded -', Object.keys(existingUsers.landlords || {}).length, 'landlords');
        }
    },

    // Get all users
    getAllUsers() {
        return Utils.storage.get('users') || { students: {}, landlords: {} };
    },

    // Check if username exists
    usernameExists(username) {
        const users = this.getAllUsers();
        // Ensure the landlords object exists
        if (!users.landlords) {
            users.landlords = {};
            Utils.storage.set('users', users);
        }
        return !!users.landlords[username];
    },

    // Check if email exists
    emailExists(email) {
        const users = this.getAllUsers();
        // Ensure the landlords object exists
        if (!users.landlords) {
            users.landlords = {};
            Utils.storage.set('users', users);
        }
        for (let user of Object.values(users.landlords)) {
            if (user.email === email) return true;
        }
        return false;
    },

    // Create new landlord account
    createLandlordAccount(username, password, email, name, company) {
        const users = this.getAllUsers();
        
        // Ensure landlords object exists
        if (!users.landlords) {
            users.landlords = {};
        }
        if (!users.students) {
            users.students = {};
        }
        
        // Check if username already exists
        if (this.usernameExists(username)) {
            throw new Error('Username already exists');
        }

        // Check if email already exists
        if (this.emailExists(email)) {
            throw new Error('Email already registered');
        }

        const newLandlord = {
            username: username,
            password: password,
            email: email,
            name: name,
            company: company,
            userType: 'landlord',
            initials: name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().substring(0, 2),
            listings: [],
            applications: [],
            messages: [],
            preferences: {},
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };

        users.landlords[username] = newLandlord;
        Utils.storage.set('users', users);
        
        console.log('New landlord account created:', username);
        return newLandlord;
    },

    // Login landlord
    loginLandlord(username, password) {
        const users = this.getAllUsers();
        // Ensure landlords object exists
        if (!users.landlords) {
            users.landlords = {};
            Utils.storage.set('users', users);
        }
        
        const landlord = users.landlords[username];
        
        if (!landlord) {
            throw new Error('Username not found');
        }
        
        if (landlord.password !== password) {
            throw new Error('Invalid password');
        }

        // Update last login
        landlord.lastLogin = new Date().toISOString();
        users.landlords[username] = landlord;
        Utils.storage.set('users', users);

        this.currentUser = landlord;
        Utils.storage.set('currentUser', landlord);
        
        console.log('Landlord logged in:', username);
        return landlord;
    },

    // Get current user
    getCurrentUser() {
        if (!this.currentUser) {
            this.currentUser = Utils.storage.get('currentUser');
        }
        return this.currentUser;
    },

    // Logout
    logout() {
        console.log('Landlord logged out:', this.currentUser?.username);
        this.currentUser = null;
        Utils.storage.remove('currentUser');
    },

    // Check if user is logged in
    isLoggedIn() {
        return !!this.getCurrentUser();
    },

    // Update user data
    updateUser(userData) {
        const users = this.getAllUsers();
        users.landlords[userData.username] = userData;
        Utils.storage.set('users', users);
        
        this.currentUser = userData;
        Utils.storage.set('currentUser', userData);
    }
};

// Landlord-specific state management
const LandlordApp = {
    currentTab: 'listings',
    currentView: 'auth', // 'auth' or 'dashboard'
    filters: {
        applicationStatus: 'all'
    },
    listings: [],
    applications: [],
    messages: [],
    stats: {
        activeListings: 0,
        totalApplications: 0,
        unreadMessages: 0
    },
    isLoading: false
};

// Sample Data for Landlords
const sampleListings = [
    {
        id: 1,
        title: 'Modern 2BR Apartment',
        price: '$1,200/month',
        address: '123 Commonwealth Ave, Boston, MA',
        details: ['2 BR', '1 BA', '750 sq ft'],
        status: 'active',
        views: 45,
        applications: 8,
        messages: 3,
        tags: ['Near BU', 'Furnished', 'Utilities Included'],
        datePosted: '2024-01-15'
    },
    {
        id: 2,
        title: 'Cozy Studio Near Harvard',
        price: '$800/month',
        address: '45 Harvard St, Cambridge, MA',
        details: ['1 BR', '1 BA', '500 sq ft'],
        status: 'active',
        views: 32,
        applications: 5,
        messages: 2,
        tags: ['Near Harvard', 'Studio', 'Available Now'],
        datePosted: '2024-01-12'
    },
    {
        id: 3,
        title: 'Spacious Back Bay Apartment',
        price: '$950/month',
        address: '78 Beacon St, Boston, MA',
        details: ['2 BR', '1.5 BA', '850 sq ft'],
        status: 'pending',
        views: 28,
        applications: 12,
        messages: 5,
        tags: ['Back Bay', 'Laundry', 'Parking'],
        datePosted: '2024-01-10'
    },
    {
        id: 4,
        title: 'Student House Near MIT',
        price: '$1,100/month',
        address: '156 Mass Ave, Cambridge, MA',
        details: ['3 BR', '2 BA', '1000 sq ft'],
        status: 'inactive',
        views: 67,
        applications: 15,
        messages: 8,
        tags: ['Near MIT', 'Shared Kitchen', 'Students Welcome'],
        datePosted: '2024-01-08'
    },
    {
        id: 5,
        title: 'Luxury Downtown Loft',
        price: '$1,800/month',
        address: '89 Downtown Crossing, Boston, MA',
        details: ['2 BR', '2 BA', '1200 sq ft'],
        status: 'active',
        views: 89,
        applications: 22,
        messages: 12,
        tags: ['Downtown', 'Luxury', 'City View'],
        datePosted: '2024-01-05'
    }
];

const sampleApplications = [
    {
        id: 1,
        applicant: {
            name: 'Sarah Miller',
            avatar: 'SM',
            university: 'Harvard University',
            year: 'Graduate Student'
        },
        propertyTitle: 'Cozy Studio Near Harvard',
        propertyAddress: '45 Harvard St, Cambridge, MA',
        message: 'Hi! I\'m a graduate student at Harvard looking for a quiet place to study. I\'m very responsible and have excellent references from previous landlords.',
        status: 'pending',
        appliedDate: '2024-01-20',
        budget: '$800-900',
        moveInDate: '2024-02-01'
    },
    {
        id: 2,
        applicant: {
            name: 'Raj Kumar',
            avatar: 'RK',
            university: 'MIT',
            year: 'PhD Student'
        },
        propertyTitle: 'Student House Near MIT',
        propertyAddress: '156 Mass Ave, Cambridge, MA',
        message: 'I\'m an international PhD student at MIT. I\'m looking for a place close to campus. I\'m clean, quiet, and vegetarian. Happy to provide any documentation needed.',
        status: 'approved',
        appliedDate: '2024-01-18',
        budget: '$1000-1200',
        moveInDate: '2024-02-15'
    },
    {
        id: 3,
        applicant: {
            name: 'Anna Lee',
            avatar: 'AL',
            university: 'Boston University',
            year: 'Senior'
        },
        propertyTitle: 'Modern 2BR Apartment',
        propertyAddress: '123 Commonwealth Ave, Boston, MA',
        message: 'I\'m looking for a place to share with my roommate for our final year. We\'re both responsible students with part-time jobs.',
        status: 'pending',
        appliedDate: '2024-01-19',
        budget: '$1200-1400',
        moveInDate: '2024-02-01'
    },
    {
        id: 4,
        applicant: {
            name: 'Michael Chen',
            avatar: 'MC',
            university: 'Northeastern University',
            year: 'Junior'
        },
        propertyTitle: 'Spacious Back Bay Apartment',
        propertyAddress: '78 Beacon St, Boston, MA',
        message: 'I\'m a CS major at Northeastern. I work part-time at a tech company and can provide proof of income. Looking for a quiet place to code and study.',
        status: 'rejected',
        appliedDate: '2024-01-17',
        budget: '$900-1000',
        moveInDate: '2024-01-25'
    },
    {
        id: 5,
        applicant: {
            name: 'Emma Thompson',
            avatar: 'ET',
            university: 'Harvard Medical School',
            year: 'Medical Student'
        },
        propertyTitle: 'Luxury Downtown Loft',
        propertyAddress: '89 Downtown Crossing, Boston, MA',
        message: 'I\'m a medical student looking for a high-quality living space. I have a stipend and can provide guarantor information if needed.',
        status: 'pending',
        appliedDate: '2024-01-21',
        budget: '$1800-2000',
        moveInDate: '2024-02-10'
    }
];

const sampleMessages = [
    {
        id: 1,
        sender: 'Sarah Miller',
        propertyTitle: 'Cozy Studio Near Harvard',
        lastMessage: 'Thank you for considering my application. I\'m available for a viewing anytime this week.',
        timestamp: '2:30 PM',
        unread: true,
        type: 'application'
    },
    {
        id: 2,
        sender: 'Raj Kumar',
        propertyTitle: 'Student House Near MIT',
        lastMessage: 'I can provide additional references if needed. When would be a good time to sign the lease?',
        timestamp: '1:15 PM',
        unread: true,
        type: 'approved'
    },
    {
        id: 3,
        sender: 'Emma Thompson',
        propertyTitle: 'Luxury Downtown Loft',
        lastMessage: 'I\'d like to schedule a viewing for this weekend. Are Saturday mornings available?',
        timestamp: 'Yesterday',
        unread: false,
        type: 'inquiry'
    },
    {
        id: 4,
        sender: 'Anna Lee',
        propertyTitle: 'Modern 2BR Apartment',
        lastMessage: 'My roommate and I are very interested. Can we provide any additional information?',
        timestamp: '2 days ago',
        unread: false,
        type: 'application'
    }
];

// Initialize Landlord Application
function initializeLandlordApp() {
    // Initialize user system
    LandlordAuth.initializeUserSystem();
    
    // Load sample data
    LandlordApp.listings = [...sampleListings];
    LandlordApp.applications = [...sampleApplications];
    LandlordApp.messages = [...sampleMessages];

    // Check if user is already logged in
    if (LandlordAuth.isLoggedIn()) {
        console.log('Landlord already logged in:', LandlordAuth.getCurrentUser().username);
        showDashboard();
    } else {
        console.log('No landlord logged in, showing auth form');
        showAuth();
    }
}

// Authentication Functions
function switchAuthTab(tabType) {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const subtitle = document.getElementById('authSubtitle');

    if (tabType === 'login') {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        subtitle.textContent = 'Landlord Login';
    } else {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
        subtitle.textContent = 'Create Landlord Account';
    }
}

function handleLandlordLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!username || !password) {
        Notifications.error('Please enter both username and password');
        return;
    }

    try {
        const user = LandlordAuth.loginLandlord(username, password);
        Notifications.success(`Welcome back, ${user.name}!`);
        showDashboard();
    } catch (error) {
        Notifications.error(error.message);
        
        // If user not found, suggest registration
        if (error.message === 'Username not found') {
            setTimeout(() => {
                switchAuthTab('register');
                document.getElementById('registerUsername').value = username;
            }, 2000);
        }
    }
}

function handleLandlordRegister() {
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const name = document.getElementById('registerName').value.trim();
    const company = document.getElementById('registerCompany').value.trim();

    if (!username || !password || !email || !name || !company) {
        Notifications.error('Please fill in all fields');
        return;
    }

    if (!Utils.isValidEmail(email)) {
        Notifications.error('Please enter a valid email address');
        return;
    }

    if (password.length < 6) {
        Notifications.error('Password must be at least 6 characters long');
        return;
    }

    try {
        const user = LandlordAuth.createLandlordAccount(username, password, email, name, company);
        LandlordAuth.currentUser = user;
        Utils.storage.set('currentUser', user);
        
        Notifications.success(`Account created! Welcome ${user.name}!`);
        showDashboard();
    } catch (error) {
        Notifications.error(error.message);
        
        if (error.message === 'Username already exists') {
            switchAuthTab('login');
            document.getElementById('loginUsername').value = username;
        }
    }
}

function goBackToLanding() {
    window.location.href = 'index.html';
}

function handleLandlordLogout() {
    if (confirm('Are you sure you want to logout?')) {
        LandlordAuth.logout();
        Notifications.success('Logged out successfully');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// UI Management
function showAuth() {
    document.getElementById('authSection').style.display = 'flex';
    document.getElementById('dashboardSection').style.display = 'none';
    LandlordApp.currentView = 'auth';
}

function showDashboard() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    LandlordApp.currentView = 'dashboard';
    
    updateUserInterface();
    setupLandlordEventListeners();
    updateStats();
    loadListings();
}

function updateUserInterface() {
    const user = LandlordAuth.getCurrentUser();
    if (!user) return;

    // Update welcome text
    document.getElementById('welcomeText').textContent = `Welcome, ${user.name.split(' ')[0]}!`;
    
    // Update profile button
    document.getElementById('profileBtn').textContent = user.initials;
    
    // Update sidebar
    document.getElementById('sidebarAvatar').textContent = user.initials;
    document.getElementById('sidebarName').textContent = user.name;
    document.getElementById('sidebarRole').textContent = user.company;
}

// Update Statistics
function updateStats() {
    LandlordApp.stats.activeListings = LandlordApp.listings.filter(l => l.status === 'active').length;
    LandlordApp.stats.totalApplications = LandlordApp.applications.length;
    LandlordApp.stats.unreadMessages = LandlordApp.messages.filter(m => m.unread).length;

    // Update UI
    document.getElementById('activeListings').textContent = LandlordApp.stats.activeListings;
    document.getElementById('totalApplications').textContent = LandlordApp.stats.totalApplications;
    document.getElementById('unreadMessages').textContent = LandlordApp.stats.unreadMessages;
}

// Event Listeners Setup
function setupLandlordEventListeners() {
    // Application status filter
    document.querySelectorAll('.filter-badge').forEach(badge => {
        badge.addEventListener('click', handleApplicationFilter);
    });

    // Tab change listener
    document.addEventListener('tabChanged', handleLandlordTabChange);

    // Navigation tab listeners
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabName = e.target.getAttribute('data-tab');
            LandlordApp.currentTab = tabName;
        });
    });
}

// Filter Handlers
function handleApplicationFilter(event) {
    const badge = event.target;
    const status = badge.getAttribute('data-status');
    
    // Update active badge
    document.querySelectorAll('.filter-badge').forEach(b => b.classList.remove('active'));
    badge.classList.add('active');
    
    // Update filter
    LandlordApp.filters.applicationStatus = status;
    
    // Reload applications
    loadApplications();
    
    console.log('Application filter:', status);
}

// Tab Change Handler
function handleLandlordTabChange(event) {
    const tabName = event.detail;
    LandlordApp.currentTab = tabName;
    
    switch (tabName) {
        case 'listings':
            loadListings();
            break;
        case 'applications':
            loadApplications();
            break;
        case 'messages':
            loadLandlordMessages();
            break;
    }
}

// Load Functions
function loadListings() {
    const container = document.getElementById('landlordListings');
    if (!container) return;

    showTabLoading('landlordListings');

    setTimeout(() => {
        container.innerHTML = '';
        
        if (LandlordApp.listings.length === 0) {
            container.innerHTML = createEmptyState('No listings yet', 'Create your first property listing');
            return;
        }

        // Create grid container
        container.innerHTML = '<div class="listings-grid"></div>';
        const grid = container.querySelector('.listings-grid');

        LandlordApp.listings.forEach(listing => {
            const listingElement = createLandlordListingCard(listing);
            grid.appendChild(listingElement);
        });
    }, 500);
}

function loadApplications() {
    const container = document.getElementById('applicationsList');
    if (!container) return;

    showTabLoading('applicationsList');

    // Filter applications
    const filteredApplications = LandlordApp.applications.filter(app => {
        if (LandlordApp.filters.applicationStatus === 'all') return true;
        return app.status === LandlordApp.filters.applicationStatus;
    });

    setTimeout(() => {
        container.innerHTML = '';
        
        if (filteredApplications.length === 0) {
            const filterText = LandlordApp.filters.applicationStatus === 'all' ? 'applications' : `${LandlordApp.filters.applicationStatus} applications`;
            container.innerHTML = createEmptyState(`No ${filterText} found`, 'Applications will appear here as students apply');
            return;
        }

        // Create grid container
        container.innerHTML = '<div class="applications-grid"></div>';
        const grid = container.querySelector('.applications-grid');

        filteredApplications.forEach(application => {
            const applicationElement = createApplicationCard(application);
            grid.appendChild(applicationElement);
        });
    }, 500);
}

function loadLandlordMessages() {
    const container = document.getElementById('messagesList');
    if (!container) return;

    showTabLoading('messagesList');

    setTimeout(() => {
        container.innerHTML = '';
        
        if (LandlordApp.messages.length === 0) {
            container.innerHTML = createEmptyState('No messages yet', 'Messages from students will appear here');
            return;
        }

        LandlordApp.messages.forEach(message => {
            const messageElement = createLandlordMessageItem(message);
            container.appendChild(messageElement);
        });
    }, 300);
}

// Create UI Elements
function createLandlordListingCard(listing) {
    const card = document.createElement('div');
    card.className = 'landlord-listing-card';
    card.setAttribute('data-listing-id', listing.id);
    
    const statusClass = `status-${listing.status}`;
    const statusText = listing.status.charAt(0).toUpperCase() + listing.status.slice(1);
    
    card.innerHTML = `
        <div class="listing-card-header">
            <div class="listing-status ${statusClass}">${statusText}</div>
            🏠 Property Photo
        </div>
        <div class="listing-card-body">
            <div class="listing-title">${listing.title}</div>
            <div class="listing-price">${listing.price}</div>
            <div class="listing-address">📍 ${listing.address}</div>
            <div class="listing-details">
                ${listing.details.map(detail => `<span>${detail}</span>`).join('')}
            </div>
            <div class="listing-stats">
                <div class="stat-item">
                    <span class="stat-value">${listing.views}</span>
                    <span class="stat-label">Views</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${listing.applications}</span>
                    <span class="stat-label">Applications</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${listing.messages}</span>
                    <span class="stat-label">Messages</span>
                </div>
            </div>
            <div class="post-tags">
                ${listing.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            <div class="listing-actions">
                <button class="btn-secondary btn-edit" onclick="editListing(${listing.id})">✏️ Edit</button>
                <button class="btn-secondary" onclick="viewApplications(${listing.id})">👥 Applications</button>
                <button class="btn-secondary btn-delete" onclick="deleteListing(${listing.id})">🗑️ Delete</button>
            </div>
        </div>
    `;
    
    return card;
}

function createApplicationCard(application) {
    const card = document.createElement('div');
    card.className = `application-card status-${application.status}`;
    card.setAttribute('data-application-id', application.id);
    
    const statusClass = `status-${application.status}`;
    const statusText = application.status.charAt(0).toUpperCase() + application.status.slice(1);
    
    card.innerHTML = `
        <div class="application-header">
            <div class="applicant-info">
                <div class="applicant-avatar">${application.applicant.avatar}</div>
                <div class="applicant-details">
                    <h4>${application.applicant.name}</h4>
                    <p>${application.applicant.university} • ${application.applicant.year}</p>
                </div>
            </div>
            <div class="application-status ${statusClass}">${statusText}</div>
        </div>
        <div class="application-property">
            <strong>${application.propertyTitle}</strong><br>
            ${application.propertyAddress}
        </div>
        <div class="application-message">${application.message}</div>
        <div class="application-details">
            <div style="display: flex; gap: 20px; font-size: 12px; color: #666; margin-bottom: 15px;">
                <span><strong>Budget:</strong> ${application.budget}</span>
                <span><strong>Move-in:</strong> ${application.moveInDate}</span>
                <span><strong>Applied:</strong> ${application.appliedDate}</span>
            </div>
        </div>
        <div class="application-actions">
            ${application.status === 'pending' ? `
                <button class="btn-approve" onclick="approveApplication(${application.id})">✅ Approve</button>
                <button class="btn-reject" onclick="rejectApplication(${application.id})">❌ Reject</button>
                <button class="btn-secondary" onclick="messageApplicant('${application.applicant.name}')">💬 Message</button>
            ` : `
                <button class="btn-secondary" onclick="messageApplicant('${application.applicant.name}')">💬 Message</button>
                <button class="btn-secondary" onclick="viewApplicantProfile('${application.applicant.name}')">👤 Profile</button>
            `}
        </div>
    `;
    
    return card;
}

function createLandlordMessageItem(message) {
    const item = document.createElement('div');
    item.className = `landlord-message-item ${message.unread ? 'message-unread' : ''}`;
    item.setAttribute('data-message-id', message.id);
    
    item.innerHTML = `
        <div class="message-header">
            <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                <div class="message-sender">${message.sender}</div>
                <div class="message-property">${message.propertyTitle}</div>
            </div>
            <div class="message-time">${message.timestamp}</div>
        </div>
        <div class="message-preview">${message.lastMessage}</div>
    `;
    
    item.addEventListener('click', () => openLandlordConversation(message));
    
    return item;
}

function createEmptyState(title, subtitle) {
    return `
        <div class="empty-state">
            <div class="empty-state-icon">📋</div>
            <h3>${title}</h3>
            <p>${subtitle}</p>
        </div>
    `;
}

// Listing Management Functions
function createListing() {
    Notifications.info('Property listing creation coming soon!');
    console.log('Creating new listing');
}

function editListing(listingId) {
    const listing = LandlordApp.listings.find(l => l.id === listingId);
    if (listing) {
        Notifications.info(`Editing "${listing.title}" - Form coming soon!`);
        console.log('Editing listing:', listing);
    }
}

function deleteListing(listingId) {
    const listing = LandlordApp.listings.find(l => l.id === listingId);
    if (listing && confirm(`Are you sure you want to delete "${listing.title}"?`)) {
        // Remove from array
        LandlordApp.listings = LandlordApp.listings.filter(l => l.id !== listingId);
        
        // Update stats
        updateStats();
        
        // Reload listings
        loadListings();
        
        Notifications.success('Listing deleted successfully');
        console.log('Deleted listing:', listingId);
    }
}

function viewApplications(listingId) {
    const listing = LandlordApp.listings.find(l => l.id === listingId);
    if (listing) {
        // Switch to applications tab and filter by property
        switchTab('applications');
        Notifications.info(`Showing applications for "${listing.title}"`);
        console.log('Viewing applications for:', listing);
    }
}

// Application Management Functions
function approveApplication(applicationId) {
    const application = LandlordApp.applications.find(a => a.id === applicationId);
    if (application && confirm(`Approve application from ${application.applicant.name}?`)) {
        application.status = 'approved';
        updateStats();
        loadApplications();
        Notifications.success(`Application from ${application.applicant.name} approved!`);
        console.log('Approved application:', applicationId);
    }
}

function rejectApplication(applicationId) {
    const application = LandlordApp.applications.find(a => a.id === applicationId);
    if (application && confirm(`Reject application from ${application.applicant.name}?`)) {
        application.status = 'rejected';
        updateStats();
        loadApplications();
        Notifications.success(`Application from ${application.applicant.name} rejected`);
        console.log('Rejected application:', applicationId);
    }
}

function messageApplicant(applicantName) {
    // Add new message or open existing conversation
    const existingMessage = LandlordApp.messages.find(m => m.sender === applicantName);
    
    if (!existingMessage) {
        const newMessage = {
            id: Utils.generateId(),
            sender: applicantName,
            propertyTitle: 'General Inquiry',
            lastMessage: 'Conversation started',
            timestamp: Utils.getCurrentTime(),
            unread: false,
            type: 'landlord_initiated'
        };
        LandlordApp.messages.unshift(newMessage);
        updateStats();
    }
    
    // Switch to messages tab
    switchTab('messages');
    
    Notifications.success(`Opening conversation with ${applicantName}`);
    console.log('Messaging applicant:', applicantName);
}

function viewApplicantProfile(applicantName) {
    Notifications.info(`${applicantName}'s profile - Feature coming soon!`);
    console.log('Viewing profile:', applicantName);
}

// Message Functions
function openLandlordConversation(messageData) {
    // Mark as read
    messageData.unread = false;
    updateStats();
    
    Notifications.info(`Opening conversation with ${messageData.sender}`);
    console.log('Opening conversation:', messageData);
}

// Navigation Functions
function navigateToSection(section) {
    switch(section) {
        case 'dashboard':
            Notifications.info('Dashboard analytics coming soon!');
            break;
        case 'properties':
            switchTab('listings');
            break;
        case 'tenants':
            Notifications.info('Tenant management coming soon!');
            break;
        case 'analytics':
            Notifications.info('Advanced analytics coming soon!');
            break;
        case 'payments':
            Notifications.info('Payment management coming soon!');
            break;
        default:
            Notifications.info(`${section.replace('-', ' ')} section coming soon!`);
    }
    closeSidebar();
}

// Utility Functions
function showTabLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="loading-spinner show">
                    <div class="spinner"></div>
                </div>
                <p>Loading...</p>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the landlord page
    if (document.querySelector('.container')) {
        initializeLandlordApp();
    }
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LandlordApp, LandlordAuth };
}