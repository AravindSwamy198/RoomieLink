// Student Dashboard JavaScript with localStorage Password Authentication

// Authentication and User Management
const Auth = {
    currentUser: null,
    
    // Initialize user system
    initializeUserSystem() {
        const existingUsers = Utils.storage.get('users');
        if (!existingUsers) {
            Utils.storage.set('users', { students: {}, landlords: {} });
            console.log('User system initialized');
        } else {
            console.log('User system loaded -', Object.keys(existingUsers.students || {}).length, 'students,', Object.keys(existingUsers.landlords || {}).length, 'landlords');
        }
    },

    // Get all users
    getAllUsers() {
        return Utils.storage.get('users') || { students: {}, landlords: {} };
    },

    // Check if username exists
    usernameExists(username, userType) {
        const users = this.getAllUsers();
        // Ensure the userType object exists
        if (!users[userType]) {
            users[userType] = {};
            Utils.storage.set('users', users);
        }
        return !!users[userType][username];
    },

    // Check if email exists
    emailExists(email, userType) {
        const users = this.getAllUsers();
        // Ensure the userType object exists
        if (!users[userType]) {
            users[userType] = {};
            Utils.storage.set('users', users);
        }
        for (let user of Object.values(users[userType])) {
            if (user.email === email) return true;
        }
        return false;
    },

    // Create new student account
    createStudentAccount(username, password, email, name, university) {
        const users = this.getAllUsers();
        
        // Ensure students object exists
        if (!users.students) {
            users.students = {};
        }
        if (!users.landlords) {
            users.landlords = {};
        }
        
        // Check if username already exists
        if (this.usernameExists(username, 'students')) {
            throw new Error('Username already exists');
        }

        // Check if email already exists
        if (this.emailExists(email, 'students')) {
            throw new Error('Email already registered');
        }
        
        const universityNames = {
            'northeastern': 'Northeastern University',
            'harvard': 'Harvard University',
            'mit': 'MIT',
            'bu': 'Boston University',
            'emerson': 'Emerson College',
            'suffolk': 'Suffolk University',
            'nyu': 'NYU',
            'columbia': 'Columbia University',
            'stanford': 'Stanford University',
            'berkeley': 'UC Berkeley'
        };

        const newStudent = {
            username: username,
            password: password,
            email: email,
            name: name,
            university: university,
            universityName: universityNames[university] || university,
            userType: 'student',
            initials: name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().substring(0, 2),
            savedPosts: [],
            messages: [],
            preferences: {},
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };

        users.students[username] = newStudent;
        Utils.storage.set('users', users);
        
        console.log('New student account created:', username);
        return newStudent;
    },

    // Login student
    loginStudent(username, password) {
        const users = this.getAllUsers();
        // Ensure students object exists
        if (!users.students) {
            users.students = {};
            Utils.storage.set('users', users);
        }
        
        const student = users.students[username];
        
        if (!student) {
            throw new Error('Username not found');
        }
        
        if (student.password !== password) {
            throw new Error('Invalid password');
        }

        // Update last login
        student.lastLogin = new Date().toISOString();
        users.students[username] = student;
        Utils.storage.set('users', users);

        this.currentUser = student;
        Utils.storage.set('currentUser', student);
        
        console.log('Student logged in:', username);
        return student;
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
        console.log('User logged out:', this.currentUser?.username);
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
        users.students[userData.username] = userData;
        Utils.storage.set('users', users);
        
        this.currentUser = userData;
        Utils.storage.set('currentUser', userData);
    }
};

// Student-specific state management
const StudentApp = {
    currentTab: 'roommates',
    currentView: 'auth', // 'auth' or 'dashboard'
    filters: {
        // Roommate filters
        city: '',
        university: '',
        locality: '',
        price: '',
        roomType: '',
        gender: '',
        food: '',
        // Listing filters
        listingCity: '',
        listingLocality: ''
    },
    posts: [],
    listings: [],
    messages: [],
    isLoading: false
};

// City-based data
const CityData = {
    boston: {
        universities: [
            { value: 'harvard', name: 'Harvard University' },
            { value: 'mit', name: 'MIT' },
            { value: 'bu', name: 'Boston University' },
            { value: 'northeastern', name: 'Northeastern University' },
            { value: 'emerson', name: 'Emerson College' },
            { value: 'suffolk', name: 'Suffolk University' }
        ],
        localities: [
            'Back Bay', 'North End', 'Cambridge', 'Somerville', 'Allston', 
            'Brighton', 'Fenway', 'South End', 'Beacon Hill', 'Mission Hill',
            'Jamaica Plain', 'Charlestown', 'East Boston'
        ]
    },
    newyork: {
        universities: [
            { value: 'nyu', name: 'New York University' },
            { value: 'columbia', name: 'Columbia University' },
            { value: 'fordham', name: 'Fordham University' },
            { value: 'pace', name: 'Pace University' },
            { value: 'newschool', name: 'The New School' }
        ],
        localities: [
            'Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'East Village', 
            'SoHo', 'Williamsburg', 'Greenwich Village', 'Upper East Side',
            'Upper West Side', 'Midtown', 'Lower East Side', 'Chelsea'
        ]
    },
    sanfrancisco: {
        universities: [
            { value: 'stanford', name: 'Stanford University' },
            { value: 'berkeley', name: 'UC Berkeley' },
            { value: 'ucsf', name: 'UCSF' },
            { value: 'sfsu', name: 'San Francisco State University' }
        ],
        localities: [
            'Mission', 'Castro', 'SOMA', 'Nob Hill', 'Pacific Heights',
            'Haight-Ashbury', 'Richmond', 'Sunset', 'Marina', 'Presidio',
            'Financial District', 'Chinatown'
        ]
    },
    losangeles: {
        universities: [
            { value: 'ucla', name: 'UCLA' },
            { value: 'usc', name: 'USC' },
            { value: 'caltech', name: 'Caltech' },
            { value: 'lmu', name: 'Loyola Marymount University' }
        ],
        localities: [
            'Westwood', 'Hollywood', 'Beverly Hills', 'Santa Monica',
            'Venice', 'Downtown LA', 'Koreatown', 'Silver Lake',
            'West Hollywood', 'Culver City', 'Pasadena'
        ]
    },
    chicago: {
        universities: [
            { value: 'uchicago', name: 'University of Chicago' },
            { value: 'northwestern', name: 'Northwestern University' },
            { value: 'depaul', name: 'DePaul University' },
            { value: 'uic', name: 'University of Illinois Chicago' }
        ],
        localities: [
            'Lincoln Park', 'Wicker Park', 'River North', 'Logan Square',
            'Lakeview', 'Hyde Park', 'Bucktown', 'Old Town',
            'West Loop', 'Gold Coast', 'Pilsen'
        ]
    },
    philadelphia: {
        universities: [
            { value: 'upenn', name: 'University of Pennsylvania' },
            { value: 'temple', name: 'Temple University' },
            { value: 'drexel', name: 'Drexel University' },
            { value: 'villanova', name: 'Villanova University' }
        ],
        localities: [
            'Center City', 'University City', 'Northern Liberties',
            'Fishtown', 'Society Hill', 'Queen Village', 'Rittenhouse Square',
            'Graduate Hospital', 'Old City', 'Fairmount'
        ]
    }
};

// Sample Posts Data
const sampleRoommatesPosts = [
    {
        id: 1,
        user: { name: 'Michael Johnson', avatar: 'MJ', university: 'Northeastern University' },
        content: 'CS major looking for a roommate to share studio apartment near Northeastern. Love gaming and cooking. $850/month split.',
        tags: ['CS Student', 'Gaming', 'Near NEU', '$850/month'],
        timestamp: '2 days ago',
        city: 'boston', university: 'northeastern', locality: 'fenway',
        price: '800-1200', roomType: 'shared', gender: 'male', food: 'non-vegetarian'
    },
    {
        id: 2,
        user: { name: 'Jessica Wang', avatar: 'JW', university: 'Northeastern University' },
        content: 'Female engineering student seeking female roommate in Mission Hill. Clean, studious, and vegetarian. $750/month.',
        tags: ['Engineering', 'Female Only', 'Mission Hill', 'Clean'],
        timestamp: '1 day ago',
        city: 'boston', university: 'northeastern', locality: 'mission-hill',
        price: '700-800', roomType: 'private', gender: 'female', food: 'vegetarian'
    },
    {
        id: 3,
        user: { name: 'Carlos Rivera', avatar: 'CR', university: 'Northeastern University' },
        content: 'International business student looking for affordable shared room near campus. Budget $450. Open to any gender roommates.',
        tags: ['International', 'Business', 'Affordable', 'Near Campus'],
        timestamp: '3 hours ago',
        city: 'boston', university: 'northeastern', locality: 'fenway',
        price: 'under-500', roomType: 'shared', gender: 'mixed', food: 'non-vegetarian'
    },
    {
        id: 4,
        user: { name: 'Aisha Patel', avatar: 'AP', university: 'Northeastern University' },
        content: 'Graduate student in data science seeking quiet female roommate for 2BR in Back Bay. Vegetarian, non-smoker. $1400/month.',
        tags: ['Data Science', 'Graduate', 'Quiet', 'Back Bay'],
        timestamp: '5 hours ago',
        city: 'boston', university: 'northeastern', locality: 'back-bay',
        price: '1200-plus', roomType: 'private', gender: 'female', food: 'vegetarian'
    },
    {
        id: 5,
        user: { name: 'Tyler Brooks', avatar: 'TB', university: 'Northeastern University' },
        content: 'Male co-op student looking for temporary housing (6 months) in Allston. Private room preferred. $900/month.',
        tags: ['Co-op Student', 'Temporary', 'Allston', 'Private Room'],
        timestamp: '1 hour ago',
        city: 'boston', university: 'northeastern', locality: 'allston',
        price: '800-1200', roomType: 'private', gender: 'male', food: 'non-vegetarian'
    },
    {
        id: 6,
        user: { name: 'Sophia Kim', avatar: 'SK', university: 'Northeastern University' },
        content: 'Pharmacy student seeking roommates for 3BR house in Jamaica Plain. LGBTQ+ friendly, vegetarian household. $700/month.',
        tags: ['Pharmacy', 'LGBTQ+ Friendly', 'Jamaica Plain', 'Vegetarian'],
        timestamp: '6 hours ago',
        city: 'boston', university: 'northeastern', locality: 'jamaica-plain',
        price: '700-800', roomType: 'private', gender: 'mixed', food: 'vegetarian'
    },
    {
        id: 7,
        user: { name: 'Sarah Miller', avatar: 'SM', university: 'Harvard University' },
        content: 'Graduate student seeking female roommate for 2BR apartment near Harvard Square. Clean, quiet, non-smoker. $750/month.',
        tags: ['Graduate', 'Female Only', 'Harvard Square', 'Non-Smoker'],
        timestamp: '2 hours ago',
        city: 'boston', university: 'harvard', locality: 'cambridge',
        price: '700-800', roomType: 'private', gender: 'female', food: 'vegetarian'
    },
    {
        id: 8,
        user: { name: 'James Wilson', avatar: 'JW', university: 'Harvard University' },
        content: 'Law student looking for shared accommodation in Cambridge. Budget under $500. Open to male roommates.',
        tags: ['Law Student', 'Budget Friendly', 'Cambridge', 'Male'],
        timestamp: '4 hours ago',
        city: 'boston', university: 'harvard', locality: 'cambridge',
        price: 'under-500', roomType: 'shared', gender: 'male', food: 'non-vegetarian'
    },
    {
        id: 9,
        user: { name: 'Raj Kumar', avatar: 'RK', university: 'MIT' },
        content: 'International PhD student looking for vegetarian roommates in Cambridge. Budget $650. Quiet and studious.',
        tags: ['PhD', 'International', 'Vegetarian', 'Cambridge'],
        timestamp: '5 hours ago',
        city: 'boston', university: 'mit', locality: 'cambridge',
        price: '500-700', roomType: 'shared', gender: 'mixed', food: 'vegetarian'
    },
    {
        id: 10,
        user: { name: 'Elena Rodriguez', avatar: 'ER', university: 'MIT' },
        content: 'Computer science student seeking female roommate for luxury apartment in Back Bay. $1500/month, fully furnished.',
        tags: ['Computer Science', 'Luxury', 'Back Bay', 'Furnished'],
        timestamp: '8 hours ago',
        city: 'boston', university: 'mit', locality: 'back-bay',
        price: '1200-plus', roomType: 'private', gender: 'female', food: 'non-vegetarian'
    },
    {
        id: 11,
        user: { name: 'Anna Lee', avatar: 'AL', university: 'Boston University' },
        content: 'Need 2 roommates for 4BR house in Allston. Great location, 15 mins to campus. $650/month each. Pet-friendly!',
        tags: ['Pet Friendly', 'Allston', '4BR House', 'Multiple Roommates'],
        timestamp: '1 day ago',
        city: 'boston', university: 'bu', locality: 'allston',
        price: '500-700', roomType: 'private', gender: 'mixed', food: 'non-vegetarian'
    },
    {
        id: 12,
        user: { name: 'David Thompson', avatar: 'DT', university: 'Boston University' },
        content: 'Junior looking for male roommate in Brighton. Have a car, love sports. Private room available. $800/month.',
        tags: ['Junior', 'Brighton', 'Car Owner', 'Sports'],
        timestamp: '12 hours ago',
        city: 'boston', university: 'bu', locality: 'brighton',
        price: '700-800', roomType: 'private', gender: 'male', food: 'non-vegetarian'
    },
    {
        id: 13,
        user: { name: 'Emily Chen', avatar: 'EC', university: 'Emerson College' },
        content: 'Film student seeking creative female roommate in Back Bay. Artist-friendly space, vegetarian household. $1300/month.',
        tags: ['Film Student', 'Creative', 'Artist-Friendly', 'Back Bay'],
        timestamp: '3 days ago',
        city: 'boston', university: 'emerson', locality: 'back-bay',
        price: '1200-plus', roomType: 'private', gender: 'female', food: 'vegetarian'
    }
];

const sampleListings = [
    {
        id: 1, price: '$1,200/month', address: '123 Commonwealth Ave, Boston, MA',
        features: ['2 BR', '1 BA', '750 sq ft'], tags: ['Near BU', 'Furnished', 'Utilities Included'],
        landlord: 'Boston Properties', city: 'boston', locality: 'back-bay', price_range: '1200-plus'
    },
    {
        id: 2, price: '$800/month', address: '45 Harvard St, Cambridge, MA',
        features: ['1 BR', '1 BA', '500 sq ft'], tags: ['Near Harvard', 'Studio', 'Available Now'],
        landlord: 'Cambridge Rentals', city: 'boston', locality: 'cambridge', price_range: '700-800'
    },
    {
        id: 3, price: '$950/month', address: '78 Beacon St, Boston, MA',
        features: ['2 BR', '1.5 BA', '850 sq ft'], tags: ['Back Bay', 'Laundry', 'Parking'],
        landlord: 'Back Bay Properties', city: 'boston', locality: 'back-bay', price_range: '800-1200'
    },
    {
        id: 4, price: '$1,100/month', address: '156 Mass Ave, Cambridge, MA',
        features: ['3 BR', '2 BA', '1000 sq ft'], tags: ['Near MIT', 'Shared Kitchen', 'Students Welcome'],
        landlord: 'MIT Area Rentals', city: 'boston', locality: 'cambridge', price_range: '800-1200'
    },
    {
        id: 5, price: '$450/month', address: '89 Mission Hill Ave, Boston, MA',
        features: ['Shared Room', '3 Bed House', 'Common Areas'], tags: ['Mission Hill', 'Affordable', 'Student House'],
        landlord: 'Student Housing Co', city: 'boston', locality: 'mission-hill', price_range: 'under-500'
    },
    {
        id: 6, price: '$750/month', address: '234 Huntington Ave, Boston, MA',
        features: ['1 BR', '1 BA', '600 sq ft'], tags: ['Near Northeastern', 'Fenway', 'Modern'],
        landlord: 'Fenway Student Housing', city: 'boston', locality: 'fenway', price_range: '700-800'
    },
    {
        id: 7, price: '$1,350/month', address: '567 Newbury St, Boston, MA',
        features: ['2 BR', '2 BA', '900 sq ft'], tags: ['Back Bay', 'Luxury', 'Shopping District'],
        landlord: 'Premium Boston Rentals', city: 'boston', locality: 'back-bay', price_range: '1200-plus'
    },
    {
        id: 8, price: '$650/month', address: '123 Brighton Ave, Boston, MA',
        features: ['Shared Room', '4 BR House', 'Garden'], tags: ['Brighton', 'Student House', 'Garden'],
        landlord: 'Brighton Student Properties', city: 'boston', locality: 'brighton', price_range: '500-700'
    }
];

const sampleMessages = [
    {
        id: 1, contact: 'Sarah Miller',
        lastMessage: 'Hi! I saw your message about the roommate situation. Are you still looking?',
        timestamp: '2:30 PM', type: 'roommate', unread: true
    },
    {
        id: 2, contact: 'Boston Properties',
        lastMessage: 'The apartment is still available. Would you like to schedule a viewing?',
        timestamp: '1:15 PM', type: 'listing', unread: false
    },
    {
        id: 3, contact: 'Raj Kumar',
        lastMessage: 'Thanks for reaching out! Let\'s discuss the roommate details.',
        timestamp: 'Yesterday', type: 'roommate', unread: false
    }
];

// Save/Unsave Management
const SaveManager = {
    savePost(postId) {
        const user = Auth.getCurrentUser();
        if (!user) {
            Notifications.error('Please login to save posts');
            return false;
        }

        if (!user.savedPosts.includes(postId)) {
            user.savedPosts.push(postId);
            Auth.updateUser(user);
            this.updateSavedCount();
            return true;
        }
        return false;
    },

    unsavePost(postId) {
        const user = Auth.getCurrentUser();
        if (!user) return false;

        user.savedPosts = user.savedPosts.filter(id => id !== postId);
        Auth.updateUser(user);
        this.updateSavedCount();
        return true;
    },

    isPostSaved(postId) {
        const user = Auth.getCurrentUser();
        if (!user) return false;
        return user.savedPosts.includes(postId);
    },

    getSavedPosts() {
        const user = Auth.getCurrentUser();
        if (!user) return [];
        return StudentApp.posts.filter(post => user.savedPosts.includes(post.id));
    },

    updateSavedCount() {
        const user = Auth.getCurrentUser();
        const count = user ? user.savedPosts.length : 0;
        const countElement = document.getElementById('savedCount');
        if (countElement) {
            countElement.textContent = count;
        }
    }
};

// Initialize Application
function initializeStudentApp() {
    // Initialize user system
    Auth.initializeUserSystem();
    
    // Load sample data
    StudentApp.posts = [...sampleRoommatesPosts];
    StudentApp.listings = [...sampleListings];
    StudentApp.messages = [...sampleMessages];

    // Check if user is already logged in
    if (Auth.isLoggedIn()) {
        console.log('User already logged in:', Auth.getCurrentUser().username);
        showDashboard();
    } else {
        console.log('No user logged in, showing auth form');
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
        subtitle.textContent = 'Student Login';
    } else {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
        subtitle.textContent = 'Create Student Account';
    }
}

function handleLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!username || !password) {
        Notifications.error('Please enter both username and password');
        return;
    }

    try {
        const user = Auth.loginStudent(username, password);
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

function handleRegister() {
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const name = document.getElementById('registerName').value.trim();
    const university = document.getElementById('registerUniversity').value;

    if (!username || !password || !email || !name || !university) {
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
        const user = Auth.createStudentAccount(username, password, email, name, university);
        Auth.currentUser = user;
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

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        Auth.logout();
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
    StudentApp.currentView = 'auth';
}

function showDashboard() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    StudentApp.currentView = 'dashboard';
    
    updateUserInterface();
    setupStudentEventListeners();
    loadRoommatePosts();
    SaveManager.updateSavedCount();
}

function updateUserInterface() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    // Update welcome text
    document.getElementById('welcomeText').textContent = `Welcome, ${user.name.split(' ')[0]}!`;
    
    // Update profile button
    document.getElementById('profileBtn').textContent = user.initials;
    
    // Update sidebar
    document.getElementById('sidebarAvatar').textContent = user.initials;
    document.getElementById('sidebarName').textContent = user.name;
    document.getElementById('sidebarUniversity').textContent = user.universityName;
}

// Event Listeners Setup
function setupStudentEventListeners() {
    // Roommate filter event listeners
    document.getElementById('cityFilter')?.addEventListener('change', handleCityFilter);
    document.getElementById('universityFilter')?.addEventListener('change', handleUniversityFilter);
    document.getElementById('localityFilter')?.addEventListener('change', handleLocalityFilter);
    document.getElementById('priceFilter')?.addEventListener('change', handlePriceFilter);
    document.getElementById('roomTypeFilter')?.addEventListener('change', handleRoomTypeFilter);
    document.getElementById('genderFilter')?.addEventListener('change', handleGenderFilter);
    document.getElementById('foodFilter')?.addEventListener('change', handleFoodFilter);

    // Listing filter event listeners
    document.getElementById('listingCityFilter')?.addEventListener('change', handleListingCityFilter);
    document.getElementById('listingLocalityFilter')?.addEventListener('change', handleListingLocalityFilter);

    // Tab change listener
    document.addEventListener('tabChanged', handleTabChange);

    // Navigation tab listeners
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabName = e.target.getAttribute('data-tab');
            StudentApp.currentTab = tabName;
        });
    });
}

// Filter Handlers - Roommate Posts
function handleCityFilter(event) {
    const selectedCity = event.target.value;
    StudentApp.filters.city = selectedCity;
    
    StudentApp.filters.university = '';
    StudentApp.filters.locality = '';
    
    updateUniversityOptions(selectedCity);
    updateLocalityOptions(selectedCity);
    
    applyFilters();
}

function handleUniversityFilter(event) {
    StudentApp.filters.university = event.target.value;
    applyFilters();
}

function handleLocalityFilter(event) {
    StudentApp.filters.locality = event.target.value;
    applyFilters();
}

function handlePriceFilter(event) {
    StudentApp.filters.price = event.target.value;
    applyFilters();
}

function handleRoomTypeFilter(event) {
    StudentApp.filters.roomType = event.target.value;
    applyFilters();
}

function handleGenderFilter(event) {
    StudentApp.filters.gender = event.target.value;
    applyFilters();
}

function handleFoodFilter(event) {
    StudentApp.filters.food = event.target.value;
    applyFilters();
}

// Filter Handlers - Listings
function handleListingCityFilter(event) {
    const selectedCity = event.target.value;
    StudentApp.filters.listingCity = selectedCity;
    
    StudentApp.filters.listingLocality = '';
    
    updateListingLocalityOptions(selectedCity);
    applyFilters();
}

function handleListingLocalityFilter(event) {
    StudentApp.filters.listingLocality = event.target.value;
    applyFilters();
}

// Update dropdown options
function updateUniversityOptions(cityValue) {
    const universitySelect = document.getElementById('universityFilter');
    if (!universitySelect) return;
    
    universitySelect.innerHTML = '<option value="">Select University</option>';
    
    if (cityValue && CityData[cityValue]) {
        CityData[cityValue].universities.forEach(university => {
            const option = document.createElement('option');
            option.value = university.value;
            option.textContent = university.name;
            universitySelect.appendChild(option);
        });
    }
}

function updateLocalityOptions(cityValue) {
    const localitySelect = document.getElementById('localityFilter');
    if (!localitySelect) return;
    
    localitySelect.innerHTML = '<option value="">Select Locality</option>';
    
    if (cityValue && CityData[cityValue]) {
        CityData[cityValue].localities.forEach(locality => {
            const option = document.createElement('option');
            option.value = locality.toLowerCase().replace(/\s+/g, '-');
            option.textContent = locality;
            localitySelect.appendChild(option);
        });
    }
}

function updateListingLocalityOptions(cityValue) {
    const localitySelect = document.getElementById('listingLocalityFilter');
    if (!localitySelect) return;
    
    localitySelect.innerHTML = '<option value="">Select Locality</option>';
    
    if (cityValue && CityData[cityValue]) {
        CityData[cityValue].localities.forEach(locality => {
            const option = document.createElement('option');
            option.value = locality.toLowerCase().replace(/\s+/g, '-');
            option.textContent = locality;
            localitySelect.appendChild(option);
        });
    }
}

// Clear all roommate filters
function clearAllFilters() {
    StudentApp.filters.city = '';
    StudentApp.filters.university = '';
    StudentApp.filters.locality = '';
    StudentApp.filters.price = '';
    StudentApp.filters.roomType = '';
    StudentApp.filters.gender = '';
    StudentApp.filters.food = '';
    
    document.getElementById('cityFilter').value = '';
    document.getElementById('universityFilter').innerHTML = '<option value="">Select University</option>';
    document.getElementById('localityFilter').innerHTML = '<option value="">Select Locality</option>';
    document.getElementById('priceFilter').value = '';
    document.getElementById('roomTypeFilter').value = '';
    document.getElementById('genderFilter').value = '';
    document.getElementById('foodFilter').value = '';
    
    applyFilters();
    Notifications.success('All filters cleared');
}

// Clear listing filters
function clearListingFilters() {
    StudentApp.filters.listingCity = '';
    StudentApp.filters.listingLocality = '';
    
    document.getElementById('listingCityFilter').value = '';
    document.getElementById('listingLocalityFilter').innerHTML = '<option value="">Select Locality</option>';
    
    applyFilters();
    Notifications.success('Listing filters cleared');
}

// Apply Filters
function applyFilters() {
    if (StudentApp.currentTab === 'roommates') {
        loadRoommatePosts();
    } else if (StudentApp.currentTab === 'listings') {
        loadListings();
    } else if (StudentApp.currentTab === 'saved') {
        loadSavedPosts();
    }
}

// Tab Change Handler
function handleTabChange(event) {
    const tabName = event.detail;
    StudentApp.currentTab = tabName;
    
    switch (tabName) {
        case 'roommates':
            loadRoommatePosts();
            break;
        case 'listings':
            loadListings();
            break;
        case 'messages':
            loadMessages();
            break;
        case 'saved':
            loadSavedPosts();
            break;
    }
}

// Load Functions
function loadRoommatePosts() {
    const container = document.getElementById('roommatesList');
    if (!container) return;

    showTabLoading('roommatesList');

    const filteredPosts = StudentApp.posts.filter(post => {
        if (StudentApp.filters.city && post.city !== StudentApp.filters.city) return false;
        if (StudentApp.filters.university && post.university !== StudentApp.filters.university) return false;
        if (StudentApp.filters.locality && post.locality.toLowerCase().replace(/\s+/g, '-') !== StudentApp.filters.locality) return false;
        if (StudentApp.filters.price && post.price !== StudentApp.filters.price) return false;
        if (StudentApp.filters.roomType && post.roomType !== StudentApp.filters.roomType) return false;
        if (StudentApp.filters.gender && post.gender !== StudentApp.filters.gender) return false;
        if (StudentApp.filters.food && post.food !== StudentApp.filters.food) return false;
        return true;
    });

    setTimeout(() => {
        container.innerHTML = '';
        
        if (filteredPosts.length === 0) {
            container.innerHTML = createEmptyState('No roommate posts found', 'Try adjusting your filters');
            return;
        }

        container.innerHTML = `
            <div class="search-results-header">
                Found <span class="results-count">${filteredPosts.length}</span> roommate posts
            </div>
            <div class="posts-grid"></div>
        `;

        const grid = container.querySelector('.posts-grid');
        filteredPosts.forEach(post => {
            const postElement = createRoommatePostCard(post);
            grid.appendChild(postElement);
        });
    }, 500);
}

function loadListings() {
    const container = document.getElementById('listingsList');
    if (!container) return;

    showTabLoading('listingsList');

    const filteredListings = StudentApp.listings.filter(listing => {
        if (StudentApp.filters.listingCity && listing.city !== StudentApp.filters.listingCity) return false;
        if (StudentApp.filters.listingLocality && listing.locality.toLowerCase().replace(/\s+/g, '-') !== StudentApp.filters.listingLocality) return false;
        return true;
    });

    setTimeout(() => {
        container.innerHTML = '';
        
        if (filteredListings.length === 0) {
            container.innerHTML = createEmptyState('No listings found', 'Try adjusting your filters');
            return;
        }

        container.innerHTML = `
            <div class="search-results-header">
                Found <span class="results-count">${filteredListings.length}</span> property listings
            </div>
            <div class="listings-grid"></div>
        `;

        const grid = container.querySelector('.listings-grid');
        filteredListings.forEach(listing => {
            const listingElement = createListingCard(listing);
            grid.appendChild(listingElement);
        });
    }, 500);
}

function loadMessages() {
    const container = document.getElementById('messagesList');
    if (!container) return;

    showTabLoading('messagesList');

    setTimeout(() => {
        container.innerHTML = '';
        
        if (StudentApp.messages.length === 0) {
            container.innerHTML = createEmptyState('No messages yet', 'Start conversations by messaging posts');
            return;
        }

        StudentApp.messages.forEach(message => {
            const messageElement = createMessageItem(message);
            container.appendChild(messageElement);
        });
    }, 300);
}

function loadSavedPosts() {
    const container = document.getElementById('savedPostsList');
    if (!container) return;

    showTabLoading('savedPostsList');

    const savedPosts = SaveManager.getSavedPosts();

    setTimeout(() => {
        container.innerHTML = '';
        
        if (savedPosts.length === 0) {
            container.innerHTML = createEmptyState('No saved posts yet', 'Save posts by clicking the bookmark icon');
            return;
        }

        container.innerHTML = `
            <div class="search-results-header">
                You have <span class="results-count">${savedPosts.length}</span> saved posts
            </div>
            <div class="posts-grid"></div>
        `;

        const grid = container.querySelector('.posts-grid');
        savedPosts.forEach(post => {
            const postElement = createRoommatePostCard(post, true);
            grid.appendChild(postElement);
        });
    }, 300);
}

// Create UI Elements
function createRoommatePostCard(post, isSavedView = false) {
    const card = document.createElement('div');
    card.className = `post-card ${SaveManager.isPostSaved(post.id) ? 'saved' : ''}`;
    card.setAttribute('data-post-id', post.id);
    
    const saveButtonText = SaveManager.isPostSaved(post.id) ? '💙 Saved' : '🤍 Save';
    const saveAction = SaveManager.isPostSaved(post.id) ? `unsavePost(${post.id})` : `savePost(${post.id})`;
    
    card.innerHTML = `
        <div class="post-header">
            <div class="post-avatar">${post.user.avatar}</div>
            <div class="post-info">
                <h4>${post.user.name}</h4>
                <p>${post.user.university} • ${post.timestamp}</p>
            </div>
        </div>
        <div class="post-content">${post.content}</div>
        <div class="post-tags">
            ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        <div class="post-actions">
            <div class="post-actions-left">
                <button class="btn-message" onclick="startMessage('${post.user.name}', 'roommate')">
                    💬 Message
                </button>
            </div>
            <button class="btn-save ${SaveManager.isPostSaved(post.id) ? 'saved' : ''}" onclick="${saveAction}">
                ${saveButtonText}
            </button>
        </div>
    `;
    
    return card;
}

function createListingCard(listing) {
    const card = document.createElement('div');
    card.className = 'listing-card';
    card.setAttribute('data-listing-id', listing.id);
    
    card.innerHTML = `
        <div class="listing-image">🏠 Property Photo</div>
        <div class="listing-content">
            <div class="listing-price">${listing.price}</div>
            <div class="listing-address">${listing.address}</div>
            <div class="listing-features">
                ${listing.features.map(feature => `<span>${feature}</span>`).join('')}
            </div>
            <div class="post-tags">
                ${listing.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            <div class="post-actions">
                <button class="btn-message" onclick="startMessage('${listing.landlord}', 'listing')">
                    📞 Contact Landlord
                </button>
            </div>
        </div>
    `;
    
    return card;
}

function createMessageItem(message) {
    const item = document.createElement('div');
    item.className = `message-item ${message.unread ? 'message-unread' : ''}`;
    item.setAttribute('data-message-id', message.id);
    
    item.innerHTML = `
        <div class="message-header">
            <div class="message-name">${message.contact}</div>
            <div class="message-time">${message.timestamp}</div>
        </div>
        <div class="message-preview">${message.lastMessage}</div>
    `;
    
    item.addEventListener('click', () => openConversation(message));
    
    return item;
}

function createEmptyState(title, subtitle) {
    return `
        <div class="empty-state">
            <div class="empty-state-icon">🔍</div>
            <h3>${title}</h3>
            <p>${subtitle}</p>
        </div>
    `;
}

// Save/Unsave Functions
function savePost(postId) {
    if (SaveManager.savePost(postId)) {
        Notifications.success('Post saved!');
        
        // Update the button in the UI
        const postCard = document.querySelector(`[data-post-id="${postId}"]`);
        if (postCard) {
            const saveBtn = postCard.querySelector('.btn-save');
            saveBtn.textContent = '💙 Saved';
            saveBtn.classList.add('saved');
            saveBtn.setAttribute('onclick', `unsavePost(${postId})`);
            postCard.classList.add('saved');
        }
    }
}

function unsavePost(postId) {
    if (SaveManager.unsavePost(postId)) {
        Notifications.success('Post removed from saved');
        
        // Update the button in the UI
        const postCard = document.querySelector(`[data-post-id="${postId}"]`);
        if (postCard) {
            const saveBtn = postCard.querySelector('.btn-save');
            saveBtn.textContent = '🤍 Save';
            saveBtn.classList.remove('saved');
            saveBtn.setAttribute('onclick', `savePost(${postId})`);
            postCard.classList.remove('saved');
        }
        
        // If we're in saved view, reload the saved posts
        if (StudentApp.currentTab === 'saved') {
            loadSavedPosts();
        }
    }
}

// Sidebar Functions
function showMyPosts() {
    Notifications.info('My Posts feature coming soon!');
    closeSidebar();
}

function showSavedPosts() {
    switchTab('saved');
    closeSidebar();
}

function showNotifications() {
    Notifications.info('Notifications feature coming soon!');
    closeSidebar();
}

function showProfile() {
    const user = Auth.getCurrentUser();
    if (user) {
        const userStats = `
Profile Information:

Username: ${user.username}
Name: ${user.name}
Email: ${user.email}
University: ${user.universityName}
Account Created: ${new Date(user.createdAt).toLocaleDateString()}
Last Login: ${new Date(user.lastLogin).toLocaleDateString()}
Saved Posts: ${user.savedPosts.length}
User Type: ${user.userType}
        `;
        alert(userStats);
    }
    closeSidebar();
}

function showSettings() {
    Notifications.info('Settings feature coming soon!');
    closeSidebar();
}

function showHelp() {
    Notifications.info('Help & Support feature coming soon!');
    closeSidebar();
}

// Message Functions
function startMessage(contactName, type) {
    const newMessage = {
        id: Utils.generateId(),
        contact: contactName,
        lastMessage: `Hi! I'm interested in your ${type === 'roommate' ? 'roommate post' : 'property listing'}.`,
        timestamp: Utils.getCurrentTime(),
        type: type,
        unread: false
    };
    
    const existingIndex = StudentApp.messages.findIndex(msg => msg.contact === contactName);
    
    if (existingIndex >= 0) {
        StudentApp.messages[existingIndex] = newMessage;
    } else {
        StudentApp.messages.unshift(newMessage);
    }
    
    switchTab('messages');
    Notifications.success(`Message sent to ${contactName}!`);
}

function openConversation(messageData) {
    messageData.unread = false;
    Notifications.info(`Opening conversation with ${messageData.contact}`);
}

// Post Creation
function createPost() {
    const options = [
        'Looking for roommate',
        'Looking for housing',
        'Offering room share'
    ];
    
    const choice = prompt(`What type of post would you like to create?\n\n${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\nEnter 1, 2, or 3:`);
    
    if (choice && choice >= 1 && choice <= 3) {
        const postType = options[choice - 1];
        Notifications.info(`${postType} post creation coming soon!`);
    } else if (choice) {
        Notifications.error('Invalid option selected');
    }
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
    if (document.querySelector('.container')) {
        initializeStudentApp();
    }
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StudentApp, Auth, SaveManager };
}