// Landlord Dashboard JavaScript with localStorage Password Authentication and Property Listing

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

// Property Listing Management
const PropertyManager = {
    // Save property listing
    saveListing(listingData) {
        const user = LandlordAuth.getCurrentUser();
        if (!user) return null;

        // Generate unique ID
        const listingId = Date.now();
        
        const newListing = {
            id: listingId,
            landlordId: user.username,
            title: listingData.title,
            price: listingData.price,
            address: listingData.address,
            bedrooms: listingData.bedrooms,
            bathrooms: listingData.bathrooms,
            squareFeet: listingData.squareFeet,
            status: listingData.status || 'active',
            description: listingData.description,
            amenities: listingData.amenities || [],
            tags: listingData.tags || [],
            images: listingData.images || [],
            details: [`${listingData.bedrooms} BR`, `${listingData.bathrooms} BA`, `${listingData.squareFeet} sq ft`],
            views: 0,
            applications: 0,
            messages: 0,
            datePosted: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };

        // Initialize user listings array if it doesn't exist
        if (!user.listings) {
            user.listings = [];
        }

        // Update user's listings
        user.listings.push(newListing);
        LandlordAuth.updateUser(user);

        // Update the global listings array: user listings + sample listings
        const userListings = [...user.listings];
        LandlordApp.listings = [...userListings, ...sampleListings];

        console.log('New listing saved:', newListing);
        console.log('Total user listings:', user.listings.length);
        console.log('Total displayed listings:', LandlordApp.listings.length);
        return newListing;
    },

    // Delete listing
    deleteListing(listingId) {
        const user = LandlordAuth.getCurrentUser();
        if (!user) return false;

        // Check if this is a user listing or sample listing
        const isUserListing = user.listings && user.listings.some(l => l.id === listingId);
        
        if (isUserListing) {
            // Remove from user's listings
            user.listings = user.listings.filter(l => l.id !== listingId);
            LandlordAuth.updateUser(user);
        } else {
            // Remove from sample listings (this affects the session only)
            const sampleIndex = sampleListings.findIndex(l => l.id === listingId);
            if (sampleIndex !== -1) {
                sampleListings.splice(sampleIndex, 1);
            }
        }
        
        // Update the global listings array: user listings + remaining sample listings
        const userListings = user.listings || [];
        LandlordApp.listings = [...userListings, ...sampleListings];
        
        console.log('Listing deleted:', listingId);
        console.log('Remaining user listings:', userListings.length);
        console.log('Remaining sample listings:', sampleListings.length);
        return true;
    },

    // Get user's listings
    getUserListings() {
        const user = LandlordAuth.getCurrentUser();
        if (!user || !user.listings) {
            return [];
        }
        return [...user.listings];
    }
};

// Sample Data for Landlords
const sampleListings = [
    {
        id: 1001,
        landlordId: 'demo',
        title: 'Cozy Studio Near Harvard',
        price: '$800/month',
        address: '45 Harvard St, Cambridge, MA',
        bedrooms: 'Studio',
        bathrooms: '1',
        squareFeet: '500',
        status: 'active',
        description: 'Perfect studio apartment for graduate students. Close to Harvard campus with easy access to public transportation.',
        amenities: ['Near Harvard', 'Studio', 'Available Now'],
        tags: ['Near Harvard', 'Studio', 'Available Now'],
        details: ['Studio', '1 BA', '500 sq ft'],
        views: 32,
        applications: 1,
        messages: 1,
        datePosted: '2024-01-12',
        createdAt: '2024-01-12T10:00:00.000Z'
    },
    {
        id: 1002,
        landlordId: 'demo',
        title: 'Student House Near MIT',
        price: '$1,100/month',
        address: '156 Mass Ave, Cambridge, MA',
        bedrooms: '3',
        bathrooms: '2',
        squareFeet: '1000',
        status: 'active',
        description: 'Spacious house perfect for students. Shared kitchen and common areas. Very close to MIT campus.',
        amenities: ['Near MIT', 'Shared Kitchen', 'Students Welcome'],
        tags: ['Near MIT', 'Shared Kitchen', 'Students Welcome'],
        details: ['3 BR', '2 BA', '1000 sq ft'],
        views: 67,
        applications: 1,
        messages: 1,
        datePosted: '2024-01-08',
        createdAt: '2024-01-08T10:00:00.000Z'
    },
    {
        id: 1003,
        landlordId: 'demo',
        title: 'Modern 2BR Apartment',
        price: '$1,200/month',
        address: '123 Commonwealth Ave, Boston, MA',
        bedrooms: '2',
        bathrooms: '1',
        squareFeet: '750',
        status: 'active',
        description: 'Modern apartment near BU campus. Fully furnished with utilities included. Perfect for students.',
        amenities: ['Near BU', 'Furnished', 'Utilities Included'],
        tags: ['Near BU', 'Furnished', 'Utilities Included'],
        details: ['2 BR', '1 BA', '750 sq ft'],
        views: 45,
        applications: 1,
        messages: 1,
        datePosted: '2024-01-15',
        createdAt: '2024-01-15T10:00:00.000Z'
    },
    {
        id: 1004,
        landlordId: 'demo',
        title: 'Spacious Back Bay Apartment',
        price: '$950/month',
        address: '78 Beacon St, Boston, MA',
        bedrooms: '2',
        bathrooms: '1.5',
        squareFeet: '850',
        status: 'active',
        description: 'Beautiful Back Bay apartment with laundry facilities and parking available.',
        amenities: ['Back Bay', 'Laundry', 'Parking'],
        tags: ['Back Bay', 'Laundry', 'Parking'],
        details: ['2 BR', '1.5 BA', '850 sq ft'],
        views: 28,
        applications: 1,
        messages: 0,
        datePosted: '2024-01-10',
        createdAt: '2024-01-10T10:00:00.000Z'
    },
    {
        id: 1005,
        landlordId: 'demo',
        title: 'Luxury Downtown Loft',
        price: '$1,800/month',
        address: '89 Downtown Crossing, Boston, MA',
        bedrooms: '2',
        bathrooms: '2',
        squareFeet: '1200',
        status: 'active',
        description: 'High-end downtown loft with city views. Perfect for medical students or professionals.',
        amenities: ['Downtown', 'Luxury', 'City View'],
        tags: ['Downtown', 'Luxury', 'City View'],
        details: ['2 BR', '2 BA', '1200 sq ft'],
        views: 89,
        applications: 1,
        messages: 1,
        datePosted: '2024-01-05',
        createdAt: '2024-01-05T10:00:00.000Z'
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

// Initialize Landlord Application
function initializeLandlordApp() {
    // Initialize user system
    LandlordAuth.initializeUserSystem();
    
    // Load user's real listings
    const userListings = LandlordAuth.isLoggedIn() ? PropertyManager.getUserListings() : [];
    
    // Combine user listings with sample listings for demo
    LandlordApp.listings = [...userListings, ...sampleListings];
    
    console.log('Loaded listings - User:', userListings.length, 'Sample:', sampleListings.length, 'Total:', LandlordApp.listings.length);
    
    // Load sample applications but NO sample messages - start with empty messages
    LandlordApp.applications = [...sampleApplications];
    LandlordApp.messages = []; // Start with empty messages array

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
        // Load user's listings + sample listings for complete demo
        const userListings = PropertyManager.getUserListings();
        LandlordApp.listings = [...userListings, ...sampleListings];
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
        
        // Initialize listings with sample data for new user
        LandlordApp.listings = [...sampleListings];
        
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
    
    // Load user's listings + sample listings for demo
    const userListings = PropertyManager.getUserListings();
    LandlordApp.listings = [...userListings, ...sampleListings];
    
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
    
    // Add click event to profile button
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', toggleLandlordProfileDropdown);
    }
    
    // Update sidebar
    document.getElementById('sidebarAvatar').textContent = user.initials;
    document.getElementById('sidebarName').textContent = user.name;
    document.getElementById('sidebarRole').textContent = user.company;
}

// Profile dropdown functions for landlord
function toggleLandlordProfileDropdown() {
    // Remove any existing profile dropdown
    const existingDropdown = document.getElementById('landlordProfileDropdown');
    if (existingDropdown) {
        existingDropdown.remove();
        return;
    }
    
    const user = LandlordAuth.getCurrentUser();
    if (!user) return;
    
    // Count total visible properties (user + sample)
    const totalProperties = LandlordApp.listings.length;
    const unreadMessages = LandlordApp.messages.filter(m => m.unread).length;
    
    // Create profile dropdown
    const dropdownHTML = `
        <div id="landlordProfileDropdown" style="position: fixed; top: 70px; right: 40px; background: white; border-radius: 12px; box-shadow: 0 8px 25px rgba(0,0,0,0.15); border: 1px solid #e9ecef; z-index: 1000; min-width: 280px;">
            <div style="padding: 20px; border-bottom: 1px solid #e9ecef;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 45px; height: 45px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">${user.initials}</div>
                    <div>
                        <div style="font-weight: 600; color: #2c3e50; font-size: 16px;">${user.name}</div>
                        <div style="font-size: 13px; color: #7f8c8d;">${user.company}</div>
                        <div style="font-size: 12px; color: #7f8c8d;">${user.email}</div>
                    </div>
                </div>
            </div>
            <div style="padding: 10px 0;">
                <button onclick="viewLandlordFullProfile()" style="width: 100%; padding: 12px 20px; background: none; border: none; text-align: left; cursor: pointer; color: #2c3e50; font-size: 14px; display: flex; align-items: center; gap: 12px; transition: background 0.2s;" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='none'">
                    <span style="font-size: 16px;">👤</span>
                    View Profile
                </button>
                <button onclick="viewMyListings(); closeLandlordProfileDropdown();" style="width: 100%; padding: 12px 20px; background: none; border: none; text-align: left; cursor: pointer; color: #2c3e50; font-size: 14px; display: flex; align-items: center; gap: 12px; transition: background 0.2s;" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='none'">
                    <span style="font-size: 16px;">🏠</span>
                    My Properties (${totalProperties})
                </button>
                <button onclick="viewMyApplications(); closeLandlordProfileDropdown();" style="width: 100%; padding: 12px 20px; background: none; border: none; text-align: left; cursor: pointer; color: #2c3e50; font-size: 14px; display: flex; align-items: center; gap: 12px; transition: background 0.2s;" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='none'">
                    <span style="font-size: 16px;">📋</span>
                    Applications (${LandlordApp.applications.length})
                </button>
                <button onclick="viewMyMessages(); closeLandlordProfileDropdown();" style="width: 100%; padding: 12px 20px; background: none; border: none; text-align: left; cursor: pointer; color: #2c3e50; font-size: 14px; display: flex; align-items: center; gap: 12px; transition: background 0.2s;" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='none'">
                    <span style="font-size: 16px;">💬</span>
                    Messages (${unreadMessages})
                </button>
                <button onclick="showLandlordSettings(); closeLandlordProfileDropdown();" style="width: 100%; padding: 12px 20px; background: none; border: none; text-align: left; cursor: pointer; color: #2c3e50; font-size: 14px; display: flex; align-items: center; gap: 12px; transition: background 0.2s;" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='none'">
                    <span style="font-size: 16px;">⚙️</span>
                    Settings
                </button>
                <hr style="margin: 10px 0; border: none; border-top: 1px solid #e9ecef;">
                <button onclick="handleLandlordLogout(); closeLandlordProfileDropdown();" style="width: 100%; padding: 12px 20px; background: none; border: none; text-align: left; cursor: pointer; color: #e74c3c; font-size: 14px; display: flex; align-items: center; gap: 12px; transition: background 0.2s;" onmouseover="this.style.background='#fdf2f2'" onmouseout="this.style.background='none'">
                    <span style="font-size: 16px;">🚪</span>
                    Logout
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', dropdownHTML);
    
    // Close dropdown when clicking outside
    setTimeout(() => {
        document.addEventListener('click', handleClickOutsideLandlordProfile);
    }, 100);
}

function closeLandlordProfileDropdown() {
    const dropdown = document.getElementById('landlordProfileDropdown');
    if (dropdown) {
        dropdown.remove();
    }
    document.removeEventListener('click', handleClickOutsideLandlordProfile);
}

function handleClickOutsideLandlordProfile(event) {
    const dropdown = document.getElementById('landlordProfileDropdown');
    const profileBtn = document.getElementById('profileBtn');
    
    if (dropdown && !dropdown.contains(event.target) && event.target !== profileBtn) {
        closeLandlordProfileDropdown();
    }
}

function viewLandlordFullProfile() {
    const user = LandlordAuth.getCurrentUser();
    if (user) {
        const userStats = `Landlord Profile Information:

Username: ${user.username}
Name: ${user.name}
Email: ${user.email}
Company: ${user.company}
Account Created: ${new Date(user.createdAt).toLocaleDateString()}
Last Login: ${new Date(user.lastLogin).toLocaleDateString()}
My Properties: ${user.listings ? user.listings.length : 0}
Total Applications: ${LandlordApp.applications.length}
User Type: ${user.userType}`;
        alert(userStats);
    }
    closeLandlordProfileDropdown();
}

function viewMyListings() {
    switchTab('listings');
}

function viewMyApplications() {
    switchTab('applications');
}

function viewMyMessages() {
    switchTab('messages');
}

function showLandlordSettings() {
    Notifications.info('Landlord settings feature coming soon!');
}

// Update Statistics
function updateStats() {
    // Count all visible listings (user + sample) for display stats
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

// Property Listing Modal Functions
function createListing() {
    showPropertyModal();
}

function showPropertyModal() {
    const modal = document.getElementById('propertyModal');
    if (modal) {
        // Reset form
        document.getElementById('propertyForm').reset();
        
        // Show modal
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function hidePropertyModal() {
    const modal = document.getElementById('propertyModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

function handlePropertySubmit(event) {
    event.preventDefault();
    
    const formData = {
        title: document.getElementById('propertyTitle').value.trim(),
        price: `$${document.getElementById('monthlyRent').value}/month`,
        address: document.getElementById('propertyAddress').value.trim(),
        bedrooms: document.getElementById('bedrooms').value,
        bathrooms: document.getElementById('bathrooms').value,
        squareFeet: document.getElementById('squareFeet').value || '0',
        status: document.getElementById('propertyStatus').value,
        description: document.getElementById('propertyDescription').value.trim(),
        amenities: document.getElementById('amenities').value.split(',').map(a => a.trim()).filter(a => a)
    };

    if (!formData.title || !formData.address || !formData.bedrooms || !formData.bathrooms) {
        Notifications.error('Please fill in all required fields');
        return;
    }

    const newListing = PropertyManager.saveListing(formData);
    
    if (newListing) {
        hidePropertyModal();
        updateStats();
        loadListings();
        Notifications.success('Property listing created successfully!');
    } else {
        Notifications.error('Failed to create listing. Please try again.');
    }
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
        
        console.log('Loading listings - Total to display:', LandlordApp.listings.length);
        
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
            container.innerHTML = createEmptyState('No messages yet', 'Messages will appear here when you start conversations');
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
    
    // Check if this is a user's listing or sample listing
    const user = LandlordAuth.getCurrentUser();
    const isUserListing = user && user.listings && user.listings.some(l => l.id === listing.id);
    
    const sampleIndicator = !isUserListing ? 
        '<div class="sample-indicator" style="position: absolute; top: 16px; left: 16px; background: rgba(52, 152, 219, 0.9); color: white; padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: 600;">DEMO</div>' : '';
    
    card.innerHTML = `
        <div class="listing-card-header">
            <div class="listing-status ${statusClass}">${statusText}</div>
            ${sampleIndicator}
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
            ${listing.amenities && listing.amenities.length > 0 ? `
                <div class="post-tags">
                    ${listing.amenities.map(amenity => `<span class="tag">${amenity}</span>`).join('')}
                </div>
            ` : ''}
            ${listing.description ? `
                <div class="listing-description" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; font-size: 14px; color: #666; line-height: 1.5;">
                    ${listing.description}
                </div>
            ` : ''}
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
        // Delete using PropertyManager
        PropertyManager.deleteListing(listingId);
        
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

// Enhanced Message Functions
function messageApplicant(applicantName) {
    openLandlordConversationModal(applicantName, 'application');
}

function openLandlordConversationModal(contactName, type) {
    // Remove any existing conversation modal
    const existingModal = document.getElementById('landlordConversationModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Find existing conversation history
    const existingConversation = LandlordApp.messages.find(msg => msg.sender === contactName);
    const chatHistory = existingConversation ? (existingConversation.chatHistory || []) : [];
    
    // Create conversation modal HTML
    const modalHTML = `
        <div id="landlordConversationModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 10002;">
            <div style="background: white; border-radius: 20px; max-width: 500px; width: 90%; max-height: 80vh; display: flex; flex-direction: column; box-shadow: 0 25px 50px rgba(0,0,0,0.3);">
                <div style="padding: 20px 25px; border-bottom: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-radius: 20px 20px 0 0;">
                    <div>
                        <h3 style="margin: 0; font-size: 18px; font-weight: 600;">💬 ${contactName}</h3>
                        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">${type === 'application' ? 'Application Discussion' : 'General Inquiry'}</p>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <button onclick="deleteLandlordChatHistory('${contactName}')" style="background: rgba(231, 76, 60, 0.2); border: none; font-size: 16px; color: white; cursor: pointer; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;" title="Delete Chat">🗑️</button>
                        <button onclick="closeLandlordConversationModal()" style="background: none; border: none; font-size: 24px; color: rgba(255,255,255,0.8); cursor: pointer; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;">&times;</button>
                    </div>
                </div>
                
                <div id="landlordConversationMessages" style="flex: 1; padding: 20px; background: #f8f9fa; overflow-y: auto; min-height: 300px; max-height: 400px;">
                    ${chatHistory.length === 0 ? `
                        <div style="background: #e8f4fd; padding: 15px; border-radius: 12px; margin-bottom: 15px; border-left: 4px solid #3498db;">
                            <div style="font-weight: 600; color: #2c3e50; margin-bottom: 5px;">${contactName}</div>
                            <div style="color: #555;">Hi! I'm interested in your ${type === 'application' ? 'property listing' : 'services'}. Could we discuss the details?</div>
                            <div style="font-size: 12px; color: #7f8c8d; margin-top: 8px;">Just now</div>
                        </div>
                    ` : chatHistory.map(msg => `
                        <div style="background: ${msg.sender === 'You' ? 'white' : '#e8f4fd'}; padding: 15px; border-radius: 12px; margin-bottom: 15px; border-left: 4px solid ${msg.sender === 'You' ? '#667eea' : '#3498db'};">
                            <div style="font-weight: 600; color: #2c3e50; margin-bottom: 5px;">${msg.sender}</div>
                            <div style="color: #555;">${msg.message}</div>
                            <div style="font-size: 12px; color: #7f8c8d; margin-top: 8px;">${msg.timestamp}</div>
                        </div>
                    `).join('')}
                </div>
                
                <div style="padding: 20px; border-top: 1px solid #e9ecef; background: white; border-radius: 0 0 20px 20px;">
                    <div style="display: flex; gap: 10px; align-items: flex-end;">
                        <textarea id="landlordMessageInput" placeholder="Type your message..." style="flex: 1; padding: 12px 16px; border: 2px solid #e9ecef; border-radius: 12px; font-size: 14px; min-height: 60px; max-height: 120px; resize: vertical; font-family: inherit; box-sizing: border-box; transition: all 0.3s ease;"></textarea>
                        <button onclick="sendLandlordMessage('${contactName}', '${type}')" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 12px 20px; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all 0.3s ease;">Send</button>
                    </div>
                    <div style="text-align: center; margin-top: 15px;">
                        <button onclick="closeLandlordConversationModal()" style="background: #f8f9fa; color: #666; border: 2px solid #e9ecef; padding: 8px 16px; border-radius: 8px; font-size: 13px; cursor: pointer; transition: all 0.3s ease;">Close Conversation</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // DON'T create any messages in the messages list until user actually sends a message
    
    // Focus on message input
    setTimeout(() => {
        const messageInput = document.getElementById('landlordMessageInput');
        if (messageInput) messageInput.focus();
    }, 100);
}

function closeLandlordConversationModal() {
    const modal = document.getElementById('landlordConversationModal');
    if (modal) {
        modal.remove();
    }
}

function sendLandlordMessage(contactName, type) {
    const messageInput = document.getElementById('landlordMessageInput');
    const messagesContainer = document.getElementById('landlordConversationMessages');
    
    if (!messageInput || !messagesContainer) return;
    
    const messageText = messageInput.value.trim();
    if (!messageText) {
        Notifications.error('Please enter a message');
        return;
    }
    
    // Check if this is the first message sent - if so, create the conversation
    const existingConversation = LandlordApp.messages.find(msg => msg.sender === contactName);
    
    if (!existingConversation) {
        // Create new conversation ONLY when user sends first message
        const newConversation = {
            id: Utils.generateId(),
            sender: contactName,
            propertyTitle: type === 'application' ? 'Property Application' : 'General Inquiry',
            lastMessage: messageText,
            timestamp: Utils.getCurrentTime(),
            type: type || 'application',
            unread: false,
            chatHistory: [
                {
                    sender: contactName,
                    message: `Hi! I'm interested in your ${type === 'application' ? 'property listing' : 'services'}. Could we discuss the details?`,
                    timestamp: 'Just now'
                }
            ]
        };
        
        // Add to messages list at the top
        LandlordApp.messages.unshift(newConversation);
    }
    
    // Add new message to conversation display
    const newMessageHTML = `
        <div style="background: white; padding: 15px; border-radius: 12px; margin-bottom: 15px; border-left: 4px solid #667eea;">
            <div style="font-weight: 600; color: #2c3e50; margin-bottom: 5px;">You</div>
            <div style="color: #555;">${messageText}</div>
            <div style="font-size: 12px; color: #7f8c8d; margin-top: 8px;">Just now</div>
        </div>
    `;
    
    messagesContainer.insertAdjacentHTML('beforeend', newMessageHTML);
    
    // Clear input
    messageInput.value = '';
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Update message history in storage
    const existingMessageIndex = LandlordApp.messages.findIndex(msg => msg.sender === contactName);
    
    if (existingMessageIndex >= 0) {
        const conversation = LandlordApp.messages[existingMessageIndex];
        
        // Add new message to history
        conversation.chatHistory.push({
            sender: 'You',
            message: messageText,
            timestamp: 'Just now'
        });
        
        // Update last message and move to top of list
        conversation.lastMessage = messageText;
        conversation.timestamp = Utils.getCurrentTime();
        conversation.unread = false;
        
        // Move this conversation to the top of the messages list
        LandlordApp.messages.splice(existingMessageIndex, 1);
        LandlordApp.messages.unshift(conversation);
    }
    
    updateStats();
    Notifications.success('Message sent!');
    
    // Simulate response after 2 seconds
    setTimeout(() => {
        const responseHTML = `
            <div style="background: #e8f4fd; padding: 15px; border-radius: 12px; margin-bottom: 15px; border-left: 4px solid #3498db;">
                <div style="font-weight: 600; color: #2c3e50; margin-bottom: 5px;">${contactName}</div>
                <div style="color: #555;">Thank you for your message! I appreciate you reaching out. Looking forward to discussing this further.</div>
                <div style="font-size: 12px; color: #7f8c8d; margin-top: 8px;">Just now</div>
            </div>
        `;
        
        if (messagesContainer) {
            messagesContainer.insertAdjacentHTML('beforeend', responseHTML);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            // Add response to chat history and move conversation to top
            const conversationIndex = LandlordApp.messages.findIndex(msg => msg.sender === contactName);
            if (conversationIndex >= 0) {
                const conversation = LandlordApp.messages[conversationIndex];
                conversation.chatHistory.push({
                    sender: contactName,
                    message: 'Thank you for your message! I appreciate you reaching out. Looking forward to discussing this further.',
                    timestamp: 'Just now'
                });
                
                conversation.lastMessage = 'Thank you for your message! I appreciate you reaching out. Looking forward to discussing this further.';
                conversation.timestamp = Utils.getCurrentTime();
                conversation.unread = true; // Mark as unread since they replied
                
                // Move conversation to top of list (most recent first)
                LandlordApp.messages.splice(conversationIndex, 1);
                LandlordApp.messages.unshift(conversation);
            }
            
            updateStats(); // Update unread message count
            
            // Refresh messages list if currently viewing messages tab
            if (LandlordApp.currentTab === 'messages') {
                loadLandlordMessages();
            }
        }
    }, 2000);
}

function deleteLandlordChatHistory(contactName) {
    if (confirm(`Are you sure you want to delete your conversation with ${contactName}?`)) {
        // Remove from messages list
        LandlordApp.messages = LandlordApp.messages.filter(msg => msg.sender !== contactName);
        
        // Close modal
        closeLandlordConversationModal();
        
        // Reload messages if we're on messages tab
        if (LandlordApp.currentTab === 'messages') {
            loadLandlordMessages();
        }
        
        // Update stats
        updateStats();
        
        Notifications.success('Chat deleted successfully');
    }
}

function viewApplicantProfile(applicantName) {
    Notifications.info(`${applicantName}'s profile - Feature coming soon!`);
    console.log('Viewing profile:', applicantName);
}

// Message Functions
function openLandlordConversation(messageData) {
    // Open the conversation modal instead of just marking as read
    openLandlordConversationModal(messageData.sender, messageData.type || 'application');
}

// Navigation Functions
function navigateToSection(section) {
    switch(section) {
        case 'properties':
            switchTab('listings');
            break;
        case 'analytics':
            Notifications.info('Advanced analytics coming soon!');
            break;
        case 'payments':
            showPaymentsModal();
            break;
        case 'settings':
            Notifications.info('Settings feature coming soon!');
            break;
        default:
            Notifications.info(`${section.replace('-', ' ')} section coming soon!`);
    }
    closeSidebar();
}

// Payments Modal Function
function showPaymentsModal() {
    // Remove any existing payments modal
    const existingModal = document.getElementById('paymentsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Sample payment transactions
    const paymentTransactions = [
        {
            id: 1,
            date: 'July 2024',
            amount: '$29.99',
            description: 'Premium Listing Package',
            status: 'Completed',
            method: 'Credit Card',
            transactionId: 'TXN-2024-07-001'
        },
        {
            id: 2,
            date: 'June 2024',
            amount: '$29.99',
            description: 'Premium Listing Package',
            status: 'Completed',
            method: 'Credit Card',
            transactionId: 'TXN-2024-06-001'
        },
        {
            id: 3,
            date: 'May 2024',
            amount: '$19.99',
            description: 'Featured Listing Boost',
            status: 'Completed',
            method: 'PayPal',
            transactionId: 'TXN-2024-05-001'
        },
        {
            id: 4,
            date: 'April 2024',
            amount: '$29.99',
            description: 'Premium Listing Package',
            status: 'Completed',
            method: 'Credit Card',
            transactionId: 'TXN-2024-04-001'
        },
        {
            id: 5,
            date: 'March 2024',
            amount: '$9.99',
            description: 'Application Boost',
            status: 'Completed',
            method: 'Credit Card',
            transactionId: 'TXN-2024-03-001'
        }
    ];
    
    // Create payments modal HTML
    const modalHTML = `
        <div id="paymentsModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 10001;">
            <div style="background: white; border-radius: 20px; max-width: 700px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px rgba(0,0,0,0.3);">
                <div style="padding: 25px 30px; border-bottom: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-radius: 20px 20px 0 0;">
                    <div>
                        <h3 style="margin: 0; font-size: 22px; font-weight: 600;">💰 Payment Transactions</h3>
                        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Your payment history and billing details</p>
                    </div>
                    <button onclick="closePaymentsModal()" style="background: none; border: none; font-size: 28px; color: rgba(255,255,255,0.8); cursor: pointer; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;">&times;</button>
                </div>
                
                <div style="padding: 30px;">
                    <div style="margin-bottom: 25px;">
                        <h4 style="color: #2c3e50; margin-bottom: 15px; font-size: 18px;">Recent Transactions</h4>
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-weight: 600; color: #2c3e50;">Current Plan: Premium</div>
                                    <div style="font-size: 14px; color: #7f8c8d;">Next billing: August 15, 2024</div>
                                </div>
                                <div style="background: #27ae60; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">ACTIVE</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="space-y: 12px;">
                        ${paymentTransactions.map(transaction => `
                            <div style="border: 1px solid #e9ecef; border-radius: 12px; padding: 20px; margin-bottom: 12px; transition: all 0.3s ease; background: white;" onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.boxShadow='none'; this.style.transform='translateY(0)'">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                                    <div>
                                        <div style="font-weight: 600; color: #2c3e50; font-size: 16px; margin-bottom: 4px;">${transaction.description}</div>
                                        <div style="font-size: 14px; color: #7f8c8d;">${transaction.date}</div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-size: 18px; font-weight: bold; color: #667eea; margin-bottom: 4px;">${transaction.amount}</div>
                                        <div style="background: #d4edda; color: #155724; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase;">${transaction.status}</div>
                                    </div>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #666;">
                                    <span><strong>Method:</strong> ${transaction.method}</span>
                                    <span><strong>ID:</strong> ${transaction.transactionId}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div style="margin-top: 25px; text-align: center; padding-top: 20px; border-top: 1px solid #e9ecef;">
                        <button onclick="upgradeAccount()" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 14px 28px; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; margin-right: 15px;">Upgrade Plan</button>
                        <button onclick="downloadInvoice()" style="background: #f8f9fa; color: #666; border: 2px solid #e9ecef; padding: 14px 28px; border-radius: 10px; font-size: 16px; font-weight: 500; cursor: pointer; transition: all 0.3s ease;">Download Invoices</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closePaymentsModal() {
    const modal = document.getElementById('paymentsModal');
    if (modal) {
        modal.remove();
    }
}

function upgradeAccount() {
    closePaymentsModal();
    Notifications.info('Account upgrade feature coming soon!');
}

function downloadInvoice() {
    Notifications.success('Invoice download feature coming soon!');
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
    module.exports = { LandlordApp, LandlordAuth, PropertyManager };
}