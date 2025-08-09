// Student Dashboard JavaScript with localStorage Password Authentication

// Authentication and User Management
const Auth = {
    currentUser: null,
    
    initializeUserSystem() {
        const existingUsers = Utils.storage.get('users');
        if (!existingUsers) {
            Utils.storage.set('users', { students: {}, landlords: {} });
            console.log('User system initialized');
        } else {
            console.log('User system loaded');
        }
    },

    getAllUsers() {
        return Utils.storage.get('users') || { students: {}, landlords: {} };
    },

    usernameExists(username, userType) {
        const users = this.getAllUsers();
        if (!users[userType]) {
            users[userType] = {};
            Utils.storage.set('users', users);
        }
        return !!users[userType][username];
    },

    emailExists(email, userType) {
        const users = this.getAllUsers();
        if (!users[userType]) {
            users[userType] = {};
            Utils.storage.set('users', users);
        }
        for (let user of Object.values(users[userType])) {
            if (user.email === email) return true;
        }
        return false;
    },

    createStudentAccount(username, password, email, name, university) {
        const users = this.getAllUsers();
        
        if (!users.students) users.students = {};
        if (!users.landlords) users.landlords = {};
        
        if (this.usernameExists(username, 'students')) {
            throw new Error('Username already exists');
        }
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
            myPosts: [],
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

    loginStudent(username, password) {
        const users = this.getAllUsers();
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

        student.lastLogin = new Date().toISOString();
        users.students[username] = student;
        Utils.storage.set('users', users);

        this.currentUser = student;
        Utils.storage.set('currentUser', student);
        
        console.log('Student logged in:', username);
        return student;
    },

    getCurrentUser() {
        if (!this.currentUser) {
            this.currentUser = Utils.storage.get('currentUser');
        }
        return this.currentUser;
    },

    logout() {
        console.log('User logged out:', this.currentUser?.username);
        this.currentUser = null;
        Utils.storage.remove('currentUser');
    },

    isLoggedIn() {
        return !!this.getCurrentUser();
    },

    updateUser(userData) {
        const users = this.getAllUsers();
        users.students[userData.username] = userData;
        Utils.storage.set('users', users);
        
        this.currentUser = userData;
        Utils.storage.set('currentUser', userData);
    }
}

// Profile dropdown functions
function toggleProfileDropdown() {
    // Remove any existing profile dropdown
    const existingDropdown = document.getElementById('profileDropdown');
    if (existingDropdown) {
        existingDropdown.remove();
        return;
    }
    
    const user = Auth.getCurrentUser();
    if (!user) return;
    
    // Create profile dropdown
    const dropdownHTML = `
        <div id="profileDropdown" style="position: fixed; top: 70px; right: 40px; background: white; border-radius: 12px; box-shadow: 0 8px 25px rgba(0,0,0,0.15); border: 1px solid #e9ecef; z-index: 1000; min-width: 250px;">
            <div style="padding: 20px; border-bottom: 1px solid #e9ecef;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 45px; height: 45px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">${user.initials}</div>
                    <div>
                        <div style="font-weight: 600; color: #2c3e50; font-size: 16px;">${user.name}</div>
                        <div style="font-size: 13px; color: #7f8c8d;">${user.universityName}</div>
                        <div style="font-size: 12px; color: #7f8c8d;">${user.email}</div>
                    </div>
                </div>
            </div>
            <div style="padding: 10px 0;">
                <button onclick="viewFullProfile()" style="width: 100%; padding: 12px 20px; background: none; border: none; text-align: left; cursor: pointer; color: #2c3e50; font-size: 14px; display: flex; align-items: center; gap: 12px; transition: background 0.2s;" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='none'">
                    <span style="font-size: 16px;">👤</span>
                    View Profile
                </button>
                <button onclick="showMyPosts(); closeProfileDropdown();" style="width: 100%; padding: 12px 20px; background: none; border: none; text-align: left; cursor: pointer; color: #2c3e50; font-size: 14px; display: flex; align-items: center; gap: 12px; transition: background 0.2s;" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='none'">
                    <span style="font-size: 16px;">📋</span>
                    My Posts (${user.myPosts ? user.myPosts.length : 0})
                </button>
                <button onclick="showSavedPosts(); closeProfileDropdown();" style="width: 100%; padding: 12px 20px; background: none; border: none; text-align: left; cursor: pointer; color: #2c3e50; font-size: 14px; display: flex; align-items: center; gap: 12px; transition: background 0.2s;" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='none'">
                    <span style="font-size: 16px;">⭐</span>
                    Saved Posts (${user.savedPosts.length})
                </button>
                <button onclick="showSettings(); closeProfileDropdown();" style="width: 100%; padding: 12px 20px; background: none; border: none; text-align: left; cursor: pointer; color: #2c3e50; font-size: 14px; display: flex; align-items: center; gap: 12px; transition: background 0.2s;" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='none'">
                    <span style="font-size: 16px;">⚙️</span>
                    Settings
                </button>
                <hr style="margin: 10px 0; border: none; border-top: 1px solid #e9ecef;">
                <button onclick="handleLogout(); closeProfileDropdown();" style="width: 100%; padding: 12px 20px; background: none; border: none; text-align: left; cursor: pointer; color: #e74c3c; font-size: 14px; display: flex; align-items: center; gap: 12px; transition: background 0.2s;" onmouseover="this.style.background='#fdf2f2'" onmouseout="this.style.background='none'">
                    <span style="font-size: 16px;">🚪</span>
                    Logout
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', dropdownHTML);
    
    // Close dropdown when clicking outside
    setTimeout(() => {
        document.addEventListener('click', handleClickOutsideProfile);
    }, 100);
}

function closeProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) {
        dropdown.remove();
    }
    document.removeEventListener('click', handleClickOutsideProfile);
}

function handleClickOutsideProfile(event) {
    const dropdown = document.getElementById('profileDropdown');
    const profileBtn = document.getElementById('profileBtn');
    
    if (dropdown && !dropdown.contains(event.target) && event.target !== profileBtn) {
        closeProfileDropdown();
    }
}

function viewFullProfile() {
    const user = Auth.getCurrentUser();
    if (user) {
        const userStats = `Profile Information:

Username: ${user.username}
Name: ${user.name}
Email: ${user.email}
University: ${user.universityName}
Account Created: ${new Date(user.createdAt).toLocaleDateString()}
Last Login: ${new Date(user.lastLogin).toLocaleDateString()}
Saved Posts: ${user.savedPosts.length}
My Posts: ${user.myPosts ? user.myPosts.length : 0}
User Type: ${user.userType}`;
        alert(userStats);
    }
    closeProfileDropdown();
};

// Student app state
const StudentApp = {
    currentTab: 'roommates',
    currentView: 'auth',
    filters: {
        city: '', university: '', locality: '', price: '', roomType: '',
        gender: '', food: '', term: '', graduation: '',
        listingCity: '', listingLocality: ''
    },
    posts: [],
    listings: [],
    messages: [],
    myPosts: [],
    isLoading: false
};

// City data
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
        localities: ['Back Bay', 'North End', 'Cambridge', 'Somerville', 'Allston', 'Brighton', 'Fenway', 'South End', 'Beacon Hill', 'Mission Hill', 'Jamaica Plain', 'Charlestown', 'East Boston']
    },
    newyork: {
        universities: [
            { value: 'nyu', name: 'New York University' },
            { value: 'columbia', name: 'Columbia University' },
            { value: 'fordham', name: 'Fordham University' }
        ],
        localities: ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'East Village', 'SoHo', 'Williamsburg', 'Greenwich Village', 'Upper East Side', 'Upper West Side', 'Midtown', 'Lower East Side', 'Chelsea']
    },
    sanfrancisco: {
        universities: [
            { value: 'stanford', name: 'Stanford University' },
            { value: 'berkeley', name: 'UC Berkeley' }
        ],
        localities: ['Mission', 'Castro', 'SOMA', 'Nob Hill', 'Pacific Heights', 'Haight-Ashbury', 'Richmond', 'Sunset', 'Marina']
    },
    losangeles: {
        universities: [
            { value: 'ucla', name: 'UCLA' },
            { value: 'usc', name: 'USC' }
        ],
        localities: ['Westwood', 'Hollywood', 'Beverly Hills', 'Santa Monica', 'Venice', 'Downtown LA', 'Koreatown']
    },
    chicago: {
        universities: [
            { value: 'uchicago', name: 'University of Chicago' },
            { value: 'northwestern', name: 'Northwestern University' }
        ],
        localities: ['Lincoln Park', 'Wicker Park', 'River North', 'Logan Square', 'Lakeview', 'Hyde Park']
    },
    philadelphia: {
        universities: [
            { value: 'upenn', name: 'University of Pennsylvania' },
            { value: 'temple', name: 'Temple University' }
        ],
        localities: ['Center City', 'University City', 'Northern Liberties', 'Fishtown', 'Society Hill']
    }
};

// Enhanced Sample Posts Data with new filters
const sampleRoommatesPosts = [
    {
        id: 1,
        user: { name: 'Michael Johnson', avatar: 'MJ', university: 'Northeastern University' },
        content: 'CS major looking for a roommate to share studio apartment near Northeastern. Love gaming and cooking. $850/month split.',
        tags: ['CS Student', 'Gaming', 'Near NEU', '$850/month', 'Fall 2024', 'Class of 2025'],
        timestamp: '2 days ago',
        city: 'boston', university: 'northeastern', locality: 'fenway',
        price: '800-1200', roomType: 'shared', gender: 'male', food: 'non-vegetarian',
        term: 'fall-2024', graduation: '2025'
    },
    {
        id: 2,
        user: { name: 'Jessica Wang', avatar: 'JW', university: 'Northeastern University' },
        content: 'Female engineering student seeking female roommate in Mission Hill. Clean, studious, and vegetarian. $750/month.',
        tags: ['Engineering', 'Female Only', 'Mission Hill', 'Clean', 'Spring 2025', 'Class of 2026'],
        timestamp: '1 day ago',
        city: 'boston', university: 'northeastern', locality: 'mission-hill',
        price: '700-800', roomType: 'private', gender: 'female', food: 'vegetarian',
        term: 'spring-2025', graduation: '2026'
    },
    {
        id: 3,
        user: { name: 'Carlos Rivera', avatar: 'CR', university: 'Northeastern University' },
        content: 'International business student looking for affordable shared room near campus. Budget $450. Open to any gender roommates.',
        tags: ['International', 'Business', 'Affordable', 'Near Campus', 'Fall 2024', 'Class of 2027'],
        timestamp: '3 hours ago',
        city: 'boston', university: 'northeastern', locality: 'fenway',
        price: 'under-500', roomType: 'shared', gender: 'mixed', food: 'non-vegetarian',
        term: 'fall-2024', graduation: '2027'
    },
    {
        id: 4,
        user: { name: 'Aisha Patel', avatar: 'AP', university: 'Northeastern University' },
        content: 'Graduate student in data science seeking quiet female roommate for 2BR in Back Bay. Vegetarian, non-smoker. $1400/month.',
        tags: ['Data Science', 'Graduate', 'Quiet', 'Back Bay', 'Spring 2025', 'Graduate Student'],
        timestamp: '5 hours ago',
        city: 'boston', university: 'northeastern', locality: 'back-bay',
        price: '1200-plus', roomType: 'private', gender: 'female', food: 'vegetarian',
        term: 'spring-2025', graduation: 'grad'
    },
    {
        id: 5,
        user: { name: 'Tyler Brooks', avatar: 'TB', university: 'Northeastern University' },
        content: 'Male co-op student looking for temporary housing (6 months) in Allston. Private room preferred. $900/month.',
        tags: ['Co-op Student', 'Temporary', 'Allston', 'Private Room', 'Summer 2024', 'Class of 2025'],
        timestamp: '1 hour ago',
        city: 'boston', university: 'northeastern', locality: 'allston',
        price: '800-1200', roomType: 'private', gender: 'male', food: 'non-vegetarian',
        term: 'summer-2024', graduation: '2025'
    },
    {
        id: 6,
        user: { name: 'Sophia Kim', avatar: 'SK', university: 'Northeastern University' },
        content: 'Pharmacy student seeking roommates for 3BR house in Jamaica Plain. LGBTQ+ friendly, vegetarian household. $700/month.',
        tags: ['Pharmacy', 'LGBTQ+ Friendly', 'Jamaica Plain', 'Vegetarian', 'Fall 2025', 'Class of 2028'],
        timestamp: '6 hours ago',
        city: 'boston', university: 'northeastern', locality: 'jamaica-plain',
        price: '700-800', roomType: 'private', gender: 'mixed', food: 'vegetarian',
        term: 'fall-2025', graduation: '2028'
    },
    {
        id: 7,
        user: { name: 'Sarah Miller', avatar: 'SM', university: 'Harvard University' },
        content: 'Graduate student seeking female roommate for 2BR apartment near Harvard Square. Clean, quiet, non-smoker. $750/month.',
        tags: ['Graduate', 'Female Only', 'Harvard Square', 'Non-Smoker', 'Spring 2025', 'Graduate Student'],
        timestamp: '2 hours ago',
        city: 'boston', university: 'harvard', locality: 'cambridge',
        price: '700-800', roomType: 'private', gender: 'female', food: 'vegetarian',
        term: 'spring-2025', graduation: 'grad'
    },
    {
        id: 8,
        user: { name: 'James Wilson', avatar: 'JW', university: 'Harvard University' },
        content: 'Law student looking for shared accommodation in Cambridge. Budget under $500. Open to male roommates.',
        tags: ['Law Student', 'Budget Friendly', 'Cambridge', 'Male', 'Fall 2024', 'Class of 2026'],
        timestamp: '4 hours ago',
        city: 'boston', university: 'harvard', locality: 'cambridge',
        price: 'under-500', roomType: 'shared', gender: 'male', food: 'non-vegetarian',
        term: 'fall-2024', graduation: '2026'
    },
    {
        id: 9,
        user: { name: 'Raj Kumar', avatar: 'RK', university: 'MIT' },
        content: 'International PhD student looking for vegetarian roommates in Cambridge. Budget $650. Quiet and studious.',
        tags: ['PhD', 'International', 'Vegetarian', 'Cambridge', 'Spring 2024', 'Graduate Student'],
        timestamp: '5 hours ago',
        city: 'boston', university: 'mit', locality: 'cambridge',
        price: '500-700', roomType: 'shared', gender: 'mixed', food: 'vegetarian',
        term: 'spring-2024', graduation: 'grad'
    },
    {
        id: 10,
        user: { name: 'Elena Rodriguez', avatar: 'ER', university: 'MIT' },
        content: 'Computer science student seeking female roommate for luxury apartment in Back Bay. $1500/month, fully furnished.',
        tags: ['Computer Science', 'Luxury', 'Back Bay', 'Furnished', 'Fall 2025', 'Class of 2027'],
        timestamp: '8 hours ago',
        city: 'boston', university: 'mit', locality: 'back-bay',
        price: '1200-plus', roomType: 'private', gender: 'female', food: 'non-vegetarian',
        term: 'fall-2025', graduation: '2027'
    },
    {
        id: 11,
        user: { name: 'Anna Lee', avatar: 'AL', university: 'Boston University' },
        content: 'Need 2 roommates for 4BR house in Allston. Great location, 15 mins to campus. $650/month each. Pet-friendly!',
        tags: ['Pet Friendly', 'Allston', '4BR House', 'Multiple Roommates', 'Spring 2025', 'Class of 2025'],
        timestamp: '1 day ago',
        city: 'boston', university: 'bu', locality: 'allston',
        price: '500-700', roomType: 'private', gender: 'mixed', food: 'non-vegetarian',
        term: 'spring-2025', graduation: '2025'
    },
    {
        id: 12,
        user: { name: 'David Thompson', avatar: 'DT', university: 'Boston University' },
        content: 'Junior looking for male roommate in Brighton. Have a car, love sports. Private room available. $800/month.',
        tags: ['Junior', 'Brighton', 'Car Owner', 'Sports', 'Fall 2024', 'Class of 2025'],
        timestamp: '12 hours ago',
        city: 'boston', university: 'bu', locality: 'brighton',
        price: '700-800', roomType: 'private', gender: 'male', food: 'non-vegetarian',
        term: 'fall-2024', graduation: '2025'
    },
    {
        id: 13,
        user: { name: 'Emily Chen', avatar: 'EC', university: 'Emerson College' },
        content: 'Film student seeking creative female roommate in Back Bay. Artist-friendly space, vegetarian household. $1300/month.',
        tags: ['Film Student', 'Creative', 'Artist-Friendly', 'Back Bay', 'Spring 2025', 'Class of 2024'],
        timestamp: '3 days ago',
        city: 'boston', university: 'emerson', locality: 'back-bay',
        price: '1200-plus', roomType: 'private', gender: 'female', food: 'vegetarian',
        term: 'spring-2025', graduation: '2024'
    },
    // 5 NEW POSTS - PEOPLE WITH HOUSING LOOKING FOR ROOMMATES
    {
        id: 14,
        user: { name: 'Marcus Chen', avatar: 'MC', university: 'NYU' },
        content: 'Have a 2BR apartment in Manhattan! Looking for responsible roommate to share. Great location near campus. $1400/month split.',
        tags: ['Have Housing', 'Manhattan', '2BR Apartment', 'Near Campus', 'Responsible', 'Fall 2024', 'Class of 2026'],
        timestamp: '30 minutes ago',
        city: 'newyork', university: 'nyu', locality: 'manhattan',
        price: '1200-plus', roomType: 'private', gender: 'mixed', food: 'non-vegetarian',
        term: 'fall-2024', graduation: '2026'
    },
    {
        id: 15,
        user: { name: 'Lisa Park', avatar: 'LP', university: 'Stanford University' },
        content: 'I have a beautiful house near Stanford campus! Seeking 2 female roommates. Fully furnished, great for grad students. $1100/month each.',
        tags: ['Have Housing', 'Near Stanford', 'Fully Furnished', 'Female Only', 'Grad Students', 'Spring 2025', 'Graduate Student'],
        timestamp: '2 hours ago',
        city: 'sanfrancisco', university: 'stanford', locality: 'palo-alto',
        price: '800-1200', roomType: 'private', gender: 'female', food: 'vegetarian',
        term: 'spring-2025', graduation: 'grad'
    },
    {
        id: 16,
        user: { name: 'Alex Rodriguez', avatar: 'AR', university: 'UCLA' },
        content: 'Got a sweet 3BR place in Westwood! Need 2 chill roommates who love movies and good food. Walking distance to UCLA. $950/month.',
        tags: ['Have Housing', 'Westwood', '3BR House', 'Movie Lovers', 'Walking Distance', 'Summer 2024', 'Class of 2025'],
        timestamp: '4 hours ago',
        city: 'losangeles', university: 'ucla', locality: 'westwood',
        price: '800-1200', roomType: 'private', gender: 'mixed', food: 'non-vegetarian',
        term: 'summer-2024', graduation: '2025'
    },
    {
        id: 17,
        user: { name: 'Priya Singh', avatar: 'PS', university: 'University of Chicago' },
        content: 'Have a cozy 2BR apartment in Hyde Park! Looking for a studious female roommate. Quiet building, perfect for academics. $825/month.',
        tags: ['Have Housing', 'Hyde Park', 'Studious', 'Female Only', 'Quiet Building', 'Academic', 'Fall 2024', 'Class of 2027'],
        timestamp: '1 hour ago',
        city: 'chicago', university: 'uchicago', locality: 'hyde-park',
        price: '800-1200', roomType: 'private', gender: 'female', food: 'vegetarian',
        term: 'fall-2024', graduation: '2027'
    },
    {
        id: 18,
        user: { name: 'Jake Martinez', avatar: 'JM', university: 'Temple University' },
        content: 'I have a spacious loft in Center City! Seeking roommate who appreciates urban living. Great for networking students. $775/month.',
        tags: ['Have Housing', 'Center City', 'Spacious Loft', 'Urban Living', 'Networking', 'Spring 2025', 'Class of 2025'],
        timestamp: '3 hours ago',
        city: 'philadelphia', university: 'temple', locality: 'center-city',
        price: '700-800', roomType: 'private', gender: 'mixed', food: 'non-vegetarian',
        term: 'spring-2025', graduation: '2025'
    },
    // 5 NEW POSTS - PEOPLE LOOKING FOR ROOMMATES (NEED HOUSING)
    {
        id: 19,
        user: { name: 'Maya Patel', avatar: 'MP', university: 'Columbia University' },
        content: 'Medical student seeking roommate for shared housing in Upper West Side. Need quiet study environment. Budget $1300/month.',
        tags: ['Medical Student', 'Upper West Side', 'Shared Housing', 'Quiet Study', 'Need Housing', 'Fall 2024', 'Graduate Student'],
        timestamp: '45 minutes ago',
        city: 'newyork', university: 'columbia', locality: 'upper-west-side',
        price: '1200-plus', roomType: 'shared', gender: 'female', food: 'vegetarian',
        term: 'fall-2024', graduation: 'grad'
    },
    {
        id: 20,
        user: { name: 'Kevin Wong', avatar: 'KW', university: 'UC Berkeley' },
        content: 'Computer science junior looking for roommate to find housing together in Berkeley. Tech enthusiast, budget $1000/month.',
        tags: ['Computer Science', 'Junior', 'Tech Enthusiast', 'Berkeley', 'Need Housing', 'Spring 2025', 'Class of 2026'],
        timestamp: '1.5 hours ago',
        city: 'sanfrancisco', university: 'berkeley', locality: 'berkeley',
        price: '800-1200', roomType: 'shared', gender: 'male', food: 'non-vegetarian',
        term: 'spring-2025', graduation: '2026'
    },
    {
        id: 21,
        user: { name: 'Zoe Adams', avatar: 'ZA', university: 'USC' },
        content: 'Film major seeking creative roommate to find housing near USC. Love indie films and coffee. Budget $1200/month.',
        tags: ['Film Major', 'Creative', 'Near USC', 'Indie Films', 'Coffee Lover', 'Need Housing', 'Fall 2025', 'Class of 2027'],
        timestamp: '2.5 hours ago',
        city: 'losangeles', university: 'usc', locality: 'downtown-la',
        price: '1200-plus', roomType: 'private', gender: 'female', food: 'vegetarian',
        term: 'fall-2025', graduation: '2027'
    },
    {
        id: 22,
        user: { name: 'Ryan Foster', avatar: 'RF', university: 'Northwestern University' },
        content: 'Business student looking for roommate to apartment hunt together in Lincoln Park. Social, outgoing, budget $900/month.',
        tags: ['Business Student', 'Lincoln Park', 'Social', 'Outgoing', 'Apartment Hunt', 'Need Housing', 'Spring 2024', 'Class of 2025'],
        timestamp: '6 hours ago',
        city: 'chicago', university: 'northwestern', locality: 'lincoln-park',
        price: '800-1200', roomType: 'shared', gender: 'male', food: 'non-vegetarian',
        term: 'spring-2024', graduation: '2025'
    },
    {
        id: 23,
        user: { name: 'Isabella Torres', avatar: 'IT', university: 'Drexel University' },
        content: 'Architecture student seeking roommate to find housing in University City. Love design and sustainability. Budget $650/month.',
        tags: ['Architecture', 'University City', 'Design', 'Sustainability', 'Need Housing', 'Summer 2025', 'Class of 2026'],
        timestamp: '8 hours ago',
        city: 'philadelphia', university: 'drexel', locality: 'university-city',
        price: '500-700', roomType: 'shared', gender: 'female', food: 'vegetarian',
        term: 'summer-2025', graduation: '2026'
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

// Popup functions
function showBackToSchoolAd() {
    const popup = document.getElementById('backToSchoolAd');
    if (popup) {
        popup.classList.add('show');
        setTimeout(() => {
            if (popup.classList.contains('show')) {
                closePopupAd();
            }
        }, 12000);
    }
}

function closePopupAd() {
    const popup = document.getElementById('backToSchoolAd');
    if (popup) {
        popup.classList.add('closing');
        setTimeout(() => {
            popup.classList.remove('show', 'closing');
        }, 400);
    }
}

function upgradeAccount() {
    closePopupAd();
    Notifications.success('Upgrade feature coming soon!');
}

// Initialize
function initializeStudentApp() {
    Auth.initializeUserSystem();
    
    StudentApp.posts = [...sampleRoommatesPosts];
    StudentApp.listings = [...sampleListings];
    StudentApp.messages = [...sampleMessages];
    
    if (Auth.isLoggedIn()) {
        const user = Auth.getCurrentUser();
        StudentApp.myPosts = user.myPosts || [];
        showDashboard();
    } else {
        showAuth();
    }
}

// Auth functions
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
    
    setTimeout(() => {
        showBackToSchoolAd();
    }, 2000);
}

function updateUserInterface() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    document.getElementById('welcomeText').textContent = `Welcome, ${user.name.split(' ')[0]}!`;
    document.getElementById('profileBtn').textContent = user.initials;
    document.getElementById('sidebarAvatar').textContent = user.initials;
    document.getElementById('sidebarName').textContent = user.name;
    document.getElementById('sidebarUniversity').textContent = user.universityName;
    
    // Add click event to profile button
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', toggleProfileDropdown);
    }
}

// Event listeners
function setupStudentEventListeners() {
    document.getElementById('cityFilter')?.addEventListener('change', handleCityFilter);
    document.getElementById('universityFilter')?.addEventListener('change', handleUniversityFilter);
    document.getElementById('localityFilter')?.addEventListener('change', handleLocalityFilter);
    document.getElementById('priceFilter')?.addEventListener('change', handlePriceFilter);
    document.getElementById('roomTypeFilter')?.addEventListener('change', handleRoomTypeFilter);
    document.getElementById('genderFilter')?.addEventListener('change', handleGenderFilter);
    document.getElementById('foodFilter')?.addEventListener('change', handleFoodFilter);
    document.getElementById('termFilter')?.addEventListener('change', handleTermFilter);
    document.getElementById('graduationFilter')?.addEventListener('change', handleGraduationFilter);

    document.getElementById('listingCityFilter')?.addEventListener('change', handleListingCityFilter);
    document.getElementById('listingLocalityFilter')?.addEventListener('change', handleListingLocalityFilter);

    document.addEventListener('tabChanged', handleTabChange);

    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabName = e.target.getAttribute('data-tab');
            StudentApp.currentTab = tabName;
        });
    });
}

// Filter handlers
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

// NEW FILTER HANDLERS
function handleTermFilter(event) {
    StudentApp.filters.term = event.target.value;
    applyFilters();
}

function handleGraduationFilter(event) {
    StudentApp.filters.graduation = event.target.value;
    applyFilters();
}

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

// Update dropdowns
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

// Clear filters
function clearAllFilters() {
    StudentApp.filters.city = '';
    StudentApp.filters.university = '';
    StudentApp.filters.locality = '';
    StudentApp.filters.price = '';
    StudentApp.filters.roomType = '';
    StudentApp.filters.gender = '';
    StudentApp.filters.food = '';
    StudentApp.filters.term = '';
    StudentApp.filters.graduation = '';
    
    document.getElementById('cityFilter').value = '';
    document.getElementById('universityFilter').innerHTML = '<option value="">Select University</option>';
    document.getElementById('localityFilter').innerHTML = '<option value="">Select Locality</option>';
    document.getElementById('priceFilter').value = '';
    document.getElementById('roomTypeFilter').value = '';
    document.getElementById('genderFilter').value = '';
    document.getElementById('foodFilter').value = '';
    document.getElementById('termFilter').value = '';
    document.getElementById('graduationFilter').value = '';
    
    applyFilters();
    Notifications.success('All filters cleared');
}

function clearListingFilters() {
    StudentApp.filters.listingCity = '';
    StudentApp.filters.listingLocality = '';
    
    document.getElementById('listingCityFilter').value = '';
    document.getElementById('listingLocalityFilter').innerHTML = '<option value="">Select Locality</option>';
    
    applyFilters();
    Notifications.success('Listing filters cleared');
}

function applyFilters() {
    if (StudentApp.currentTab === 'roommates') {
        loadRoommatePosts();
    } else if (StudentApp.currentTab === 'listings') {
        loadListings();
    } else if (StudentApp.currentTab === 'saved') {
        loadSavedPosts();
    } else if (StudentApp.currentTab === 'myposts') {
        loadMyPosts();
    }
}

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
        case 'myposts':
            loadMyPosts();
            break;
        case 'saved':
            loadSavedPosts();
            break;
    }
}

// Tab switching
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    const clickedTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (clickedTab) {
        clickedTab.classList.add('active');
    }
    
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
        case 'myposts':
            loadMyPosts();
            break;
        case 'saved':
            loadSavedPosts();
            break;
    }
}

// Load functions
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
        if (StudentApp.filters.term && post.term !== StudentApp.filters.term) return false;
        if (StudentApp.filters.graduation && post.graduation !== StudentApp.filters.graduation) return false;
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

function loadMyPosts() {
    const container = document.getElementById('myPostsList');
    if (!container) return;

    showTabLoading('myPostsList');

    const user = Auth.getCurrentUser();
    const myPosts = user ? (user.myPosts || []) : [];

    setTimeout(() => {
        container.innerHTML = '';
        
        if (myPosts.length === 0) {
            container.innerHTML = createEmptyState('No posts created yet', 'Click the + button to create your first post');
            return;
        }

        container.innerHTML = `
            <div class="search-results-header">
                You have <span class="results-count">${myPosts.length}</span> posts
            </div>
            <div class="posts-grid"></div>
        `;

        const grid = container.querySelector('.posts-grid');
        myPosts.forEach(post => {
            const postElement = createMyPostCard(post);
            grid.appendChild(postElement);
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
    
    // Format graduation display
    const graduationDisplay = post.graduation === 'grad' ? 'Graduate Student' : `Class of ${post.graduation}`;
    
    // Format term display
    const termDisplay = post.term ? post.term.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';
    
    card.innerHTML = `
        <div class="post-header">
            <div class="post-avatar">${post.user.avatar}</div>
            <div class="post-info">
                <h4>${post.user.name}</h4>
                <p>${post.user.university} • ${graduationDisplay}<br>${termDisplay} • ${post.timestamp}</p>
            </div>
        </div>
        <div class="post-content">${post.content}</div>
        <div class="post-tags">
            ${post.tags.map(tag => {
                let tagClass = 'tag';
                if (tag.includes('$') || tag.includes('Affordable')) tagClass += ' price';
                if (tag.includes('Male') || tag.includes('Female')) tagClass += ' gender';
                if (tag.includes('Vegetarian') || tag.includes('Non-Vegetarian')) tagClass += ' food';
                if (tag.includes('Class of') || tag.includes('Graduate')) tagClass += ' graduation';
                if (tag.includes('2024') || tag.includes('2025') || tag.includes('Spring') || tag.includes('Fall') || tag.includes('Summer')) tagClass += ' term';
                return `<span class="${tagClass}">${tag}</span>`;
            }).join('')}
        </div>
        <div class="post-actions">
            <div class="post-actions-left">
                <button class="btn-message" onclick="openConversationModal('${post.user.name}', 'roommate')">
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

function createMyPostCard(post) {
    const card = document.createElement('div');
    card.className = 'post-card my-post-card';
    card.setAttribute('data-post-id', post.id);
    
    const graduationDisplay = post.graduation === 'grad' ? 'Graduate Student' : `Class of ${post.graduation}`;
    const termDisplay = post.term ? post.term.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';
    
    card.innerHTML = `
        <div class="my-post-actions">
            <button class="btn-edit-post" onclick="editPost(${post.id})">✏️</button>
            <button class="btn-delete-post" onclick="deletePost(${post.id})">🗑️</button>
        </div>
        <div class="post-header">
            <div class="post-avatar">${post.user.avatar}</div>
            <div class="post-info">
                <h4>${post.user.name}</h4>
                <p>${post.user.university} • ${graduationDisplay}<br>${termDisplay} • ${post.timestamp}</p>
            </div>
        </div>
        <div class="post-content">${post.content}</div>
        <div class="post-tags">
            ${post.tags.map(tag => {
                let tagClass = 'tag';
                if (tag.includes('$') || tag.includes('Affordable')) tagClass += ' price';
                if (tag.includes('Male') || tag.includes('Female')) tagClass += ' gender';
                if (tag.includes('Vegetarian') || tag.includes('Non-Vegetarian')) tagClass += ' food';
                if (tag.includes('Class of') || tag.includes('Graduate')) tagClass += ' graduation';
                if (tag.includes('2024') || tag.includes('2025') || tag.includes('Spring') || tag.includes('Fall') || tag.includes('Summer')) tagClass += ' term';
                return `<span class="${tagClass}">${tag}</span>`;
            }).join('')}
        </div>
        <div class="post-actions">
            <div class="post-actions-left">
                <span class="post-status">Views: ${post.views || 0} | Messages: ${post.messageCount || 0}</span>
            </div>
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
                <button class="btn-message" onclick="openConversationModal('${listing.landlord}', 'listing')">
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
    
    item.addEventListener('click', () => openConversationModal(message.contact, message.type || 'roommate'));
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

// Post creation functions
function createPost() {
    // Remove any existing modal
    const existingModal = document.getElementById('createPostModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create modal HTML
    const modalHTML = `
        <div id="createPostModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 10001;">
            <div style="background: white; border-radius: 20px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                <div style="padding: 25px 30px 20px; border-bottom: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-radius: 20px 20px 0 0;">
                    <h3 style="margin: 0; font-size: 22px; font-weight: 600;">Create New Post</h3>
                    <button onclick="closeCreatePostModal()" style="background: none; border: none; font-size: 28px; color: rgba(255,255,255,0.8); cursor: pointer; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center;">&times;</button>
                </div>
                <div style="padding: 30px;">
                    <form id="createPostForm">
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">Post Content *</label>
                            <textarea id="postContent" placeholder="Describe what you're looking for, your preferences, budget, etc." required style="width: 100%; padding: 16px 20px; border: 2px solid #e9ecef; border-radius: 12px; font-size: 16px; min-height: 120px; resize: vertical; font-family: inherit; box-sizing: border-box;"></textarea>
                        </div>
                        
                        <div style="display: flex; gap: 20px;">
                            <div style="flex: 1; margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">City *</label>
                                <select id="postCity" required style="width: 100%; padding: 16px 20px; border: 2px solid #e9ecef; border-radius: 12px; font-size: 16px; background: white; box-sizing: border-box;">
                                    <option value="">Select City</option>
                                    <option value="boston">Boston</option>
                                    <option value="newyork">New York</option>
                                    <option value="sanfrancisco">San Francisco</option>
                                    <option value="losangeles">Los Angeles</option>
                                    <option value="chicago">Chicago</option>
                                    <option value="philadelphia">Philadelphia</option>
                                </select>
                            </div>
                            <div style="flex: 1; margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">Locality *</label>
                                <select id="postLocality" required style="width: 100%; padding: 16px 20px; border: 2px solid #e9ecef; border-radius: 12px; font-size: 16px; background: white; box-sizing: border-box;">
                                    <option value="">Select Locality</option>
                                </select>
                            </div>
                        </div>

                        <div style="display: flex; gap: 20px;">
                            <div style="flex: 1; margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">Price Range *</label>
                                <select id="postPrice" required style="width: 100%; padding: 16px 20px; border: 2px solid #e9ecef; border-radius: 12px; font-size: 16px; background: white; box-sizing: border-box;">
                                    <option value="">Select Price Range</option>
                                    <option value="under-500">Under $500</option>
                                    <option value="500-700">$500 - $700</option>
                                    <option value="700-800">$700 - $800</option>
                                    <option value="800-1200">$800 - $1200</option>
                                    <option value="1200-plus">$1200+</option>
                                </select>
                            </div>
                            <div style="flex: 1; margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">Room Type *</label>
                                <select id="postRoomType" required style="width: 100%; padding: 16px 20px; border: 2px solid #e9ecef; border-radius: 12px; font-size: 16px; background: white; box-sizing: border-box;">
                                    <option value="">Select Room Type</option>
                                    <option value="private">Private Room</option>
                                    <option value="shared">Shared Room</option>
                                </select>
                            </div>
                        </div>

                        <div style="display: flex; gap: 20px;">
                            <div style="flex: 1; margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">Gender Preference *</label>
                                <select id="postGender" required style="width: 100%; padding: 16px 20px; border: 2px solid #e9ecef; border-radius: 12px; font-size: 16px; background: white; box-sizing: border-box;">
                                    <option value="">Select Gender Preference</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="mixed">Mixed</option>
                                </select>
                            </div>
                            <div style="flex: 1; margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">Food Preference *</label>
                                <select id="postFood" required style="width: 100%; padding: 16px 20px; border: 2px solid #e9ecef; border-radius: 12px; font-size: 16px; background: white; box-sizing: border-box;">
                                    <option value="">Select Food Preference</option>
                                    <option value="vegetarian">Vegetarian</option>
                                    <option value="non-vegetarian">Non-Vegetarian</option>
                                </select>
                            </div>
                        </div>

                        <div style="display: flex; gap: 20px;">
                            <div style="flex: 1; margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">Academic Term *</label>
                                <select id="postTerm" required style="width: 100%; padding: 16px 20px; border: 2px solid #e9ecef; border-radius: 12px; font-size: 16px; background: white; box-sizing: border-box;">
                                    <option value="">Select Academic Term</option>
                                    <option value="spring-2024">Spring 2024</option>
                                    <option value="summer-2024">Summer 2024</option>
                                    <option value="fall-2024">Fall 2024</option>
                                    <option value="spring-2025">Spring 2025</option>
                                    <option value="summer-2025">Summer 2025</option>
                                    <option value="fall-2025">Fall 2025</option>
                                    <option value="spring-2026">Spring 2026</option>
                                </select>
                            </div>
                            <div style="flex: 1; margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">Graduation Year *</label>
                                <select id="postGraduation" required style="width: 100%; padding: 16px 20px; border: 2px solid #e9ecef; border-radius: 12px; font-size: 16px; background: white; box-sizing: border-box;">
                                    <option value="">Select Graduation Year</option>
                                    <option value="2024">Class of 2024</option>
                                    <option value="2025">Class of 2025</option>
                                    <option value="2026">Class of 2026</option>
                                    <option value="2027">Class of 2027</option>
                                    <option value="2028">Class of 2028</option>
                                    <option value="grad">Graduate Student</option>
                                </select>
                            </div>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">Additional Tags (optional)</label>
                            <input type="text" id="postTags" placeholder="e.g. Pet Friendly, Quiet, Near Campus (separate with commas)" style="width: 100%; padding: 16px 20px; border: 2px solid #e9ecef; border-radius: 12px; font-size: 16px; background: white; box-sizing: border-box;">
                        </div>
                    </form>
                </div>
                <div style="padding: 20px 30px; border-top: 1px solid #e9ecef; display: flex; gap: 15px; justify-content: flex-end; background: #f8f9fa; border-radius: 0 0 20px 20px;">
                    <button onclick="closeCreatePostModal()" style="background: #f8f9fa; color: #666; border: 2px solid #e9ecef; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 500; cursor: pointer;">Cancel</button>
                    <button onclick="submitCreatePost()" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer;">Create Post</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Setup city change listener
    const citySelect = document.getElementById('postCity');
    if (citySelect) {
        citySelect.addEventListener('change', handlePostCityChange);
    }
}

function closeCreatePostModal() {
    const modal = document.getElementById('createPostModal');
    if (modal) {
        modal.remove();
    }
}

function handlePostCityChange(event) {
    updatePostLocalityOptions(event.target.value);
}

function updatePostLocalityOptions(cityValue) {
    const localitySelect = document.getElementById('postLocality');
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

function submitCreatePost() {
    const user = Auth.getCurrentUser();
    
    if (!user) {
        Notifications.error('Please login to create posts');
        return;
    }
    
    const content = document.getElementById('postContent').value.trim();
    const city = document.getElementById('postCity').value;
    const locality = document.getElementById('postLocality').value;
    const price = document.getElementById('postPrice').value;
    const roomType = document.getElementById('postRoomType').value;
    const gender = document.getElementById('postGender').value;
    const food = document.getElementById('postFood').value;
    const term = document.getElementById('postTerm').value;
    const graduation = document.getElementById('postGraduation').value;
    const additionalTags = document.getElementById('postTags').value.trim();
    
    if (!content || !city || !locality || !price || !roomType || !gender || !food || !term || !graduation) {
        Notifications.error('Please fill in all required fields');
        return;
    }
    
    const tags = [];
    
    const priceLabels = {
        'under-500': 'Under $500',
        '500-700': '$500-$700',
        '700-800': '$700-$800', 
        '800-1200': '$800-$1200',
        '1200-plus': '$1200+'
    };
    tags.push(priceLabels[price]);
    
    if (roomType === 'private') tags.push('Private Room');
    if (roomType === 'shared') tags.push('Shared Room');
    if (gender === 'male') tags.push('Male Only');
    if (gender === 'female') tags.push('Female Only');
    if (gender === 'mixed') tags.push('Mixed Gender');
    if (food === 'vegetarian') tags.push('Vegetarian');
    if (food === 'non-vegetarian') tags.push('Non-Vegetarian');
    
    const termDisplay = term.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    tags.push(termDisplay);
    
    const graduationDisplay = graduation === 'grad' ? 'Graduate Student' : `Class of ${graduation}`;
    tags.push(graduationDisplay);
    
    const localityDisplay = locality.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    tags.push(localityDisplay);
    
    if (additionalTags) {
        const extraTags = additionalTags.split(',').map(tag => tag.trim()).filter(tag => tag);
        tags.push(...extraTags);
    }
    
    const newPost = {
        id: Utils.generateId(),
        user: {
            name: user.name,
            avatar: user.initials,
            university: user.universityName
        },
        content: content,
        tags: tags,
        timestamp: 'just now',
        city: city,
        university: user.university,
        locality: locality,
        price: price,
        roomType: roomType,
        gender: gender,
        food: food,
        term: term,
        graduation: graduation,
        views: 0,
        messageCount: 0,
        createdBy: user.username
    };
    
    if (!user.myPosts) {
        user.myPosts = [];
    }
    user.myPosts.unshift(newPost);
    
    StudentApp.posts.unshift(newPost);
    StudentApp.myPosts = user.myPosts;
    
    Auth.updateUser(user);
    
    closeCreatePostModal();
    Notifications.success('Post created successfully!');
    
    switchTab('myposts');
}

function editPost(postId) {
    Notifications.info('Edit post feature coming soon!');
}

function deletePost(postId) {
    if (confirm('Are you sure you want to delete this post?')) {
        const user = Auth.getCurrentUser();
        
        user.myPosts = user.myPosts.filter(post => post.id !== postId);
        StudentApp.posts = StudentApp.posts.filter(post => post.id !== postId);
        StudentApp.myPosts = user.myPosts;
        
        Auth.updateUser(user);
        loadMyPosts();
        
        Notifications.success('Post deleted successfully');
    }
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
    switchTab('myposts');
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
        const userStats = `Profile Information:

Username: ${user.username}
Name: ${user.name}
Email: ${user.email}
University: ${user.universityName}
Account Created: ${new Date(user.createdAt).toLocaleDateString()}
Last Login: ${new Date(user.lastLogin).toLocaleDateString()}
Saved Posts: ${user.savedPosts.length}
My Posts: ${user.myPosts ? user.myPosts.length : 0}
User Type: ${user.userType}`;
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
    openConversationModal(contactName, type);
}

function openConversation(messageData) {
    openConversationModal(messageData.contact, messageData.type || 'roommate');
}

function openConversationModal(contactName, type) {
    // Remove any existing conversation modal
    const existingModal = document.getElementById('conversationModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Find existing conversation history
    const existingConversation = StudentApp.messages.find(msg => msg.contact === contactName);
    const chatHistory = existingConversation ? (existingConversation.chatHistory || []) : [];
    
    // Create conversation modal HTML
    const modalHTML = `
        <div id="conversationModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 10002;">
            <div style="background: white; border-radius: 20px; max-width: 500px; width: 90%; max-height: 80vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                <div style="padding: 20px 25px; border-bottom: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-radius: 20px 20px 0 0;">
                    <div>
                        <h3 style="margin: 0; font-size: 18px; font-weight: 600;">💬 ${contactName}</h3>
                        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">${type === 'roommate' ? 'Roommate Discussion' : 'Property Inquiry'}</p>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <button onclick="deleteChatHistory('${contactName}')" style="background: rgba(231, 76, 60, 0.2); border: none; font-size: 16px; color: white; cursor: pointer; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;" title="Delete Chat">🗑️</button>
                        <button onclick="closeConversationModal()" style="background: none; border: none; font-size: 24px; color: rgba(255,255,255,0.8); cursor: pointer; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">&times;</button>
                    </div>
                </div>
                
                <div id="conversationMessages" style="flex: 1; padding: 20px; background: #f8f9fa; overflow-y: auto; min-height: 300px; max-height: 400px;">
                    ${chatHistory.length === 0 ? `
                        <div style="background: white; padding: 15px; border-radius: 12px; margin-bottom: 15px; border-left: 4px solid #667eea;">
                            <div style="font-weight: 600; color: #2c3e50; margin-bottom: 5px;">You</div>
                            <div style="color: #555;">Hi! I'm interested in your ${type === 'roommate' ? 'roommate post' : 'property listing'}. Could we discuss the details?</div>
                            <div style="font-size: 12px; color: #7f8c8d; margin-top: 8px;">Just now</div>
                        </div>
                        
                        <div style="background: #e8f4fd; padding: 15px; border-radius: 12px; margin-bottom: 15px; border-left: 4px solid #3498db;">
                            <div style="font-weight: 600; color: #2c3e50; margin-bottom: 5px;">${contactName}</div>
                            <div style="color: #555;">Hello! Thanks for reaching out. I'd be happy to discuss the ${type === 'roommate' ? 'roommate arrangement' : 'property details'}. What would you like to know?</div>
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
                        <textarea id="messageInput" placeholder="Type your message..." style="flex: 1; padding: 12px 16px; border: 2px solid #e9ecef; border-radius: 12px; font-size: 14px; min-height: 60px; max-height: 120px; resize: vertical; font-family: inherit; box-sizing: border-box;"></textarea>
                        <button onclick="sendMessage('${contactName}')" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 12px 20px; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap;">Send</button>
                    </div>
                    <div style="text-align: center; margin-top: 15px;">
                        <button onclick="closeConversationModal()" style="background: #f8f9fa; color: #666; border: 2px solid #e9ecef; padding: 8px 16px; border-radius: 8px; font-size: 13px; cursor: pointer;">Close Conversation</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // If no existing conversation, create initial message
    if (chatHistory.length === 0) {
        const initialMessage = {
            id: Utils.generateId(),
            contact: contactName,
            lastMessage: `Hi! I'm interested in your ${type === 'roommate' ? 'roommate post' : 'property listing'}.`,
            timestamp: Utils.getCurrentTime(),
            type: type,
            unread: false,
            chatHistory: [
                {
                    sender: 'You',
                    message: `Hi! I'm interested in your ${type === 'roommate' ? 'roommate post' : 'property listing'}. Could we discuss the details?`,
                    timestamp: 'Just now'
                },
                {
                    sender: contactName,
                    message: `Hello! Thanks for reaching out. I'd be happy to discuss the ${type === 'roommate' ? 'roommate arrangement' : 'property details'}. What would you like to know?`,
                    timestamp: 'Just now'
                }
            ]
        };
        
        const existingIndex = StudentApp.messages.findIndex(msg => msg.contact === contactName);
        
        if (existingIndex >= 0) {
            StudentApp.messages[existingIndex] = initialMessage;
        } else {
            StudentApp.messages.unshift(initialMessage);
        }
    }
    
    // Focus on message input and scroll to bottom
    setTimeout(() => {
        const messageInput = document.getElementById('messageInput');
        const messagesContainer = document.getElementById('conversationMessages');
        if (messageInput) messageInput.focus();
        if (messagesContainer) messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
}

function closeConversationModal() {
    const modal = document.getElementById('conversationModal');
    if (modal) {
        modal.remove();
    }
}

function sendMessage(contactName) {
    const messageInput = document.getElementById('messageInput');
    const messagesContainer = document.getElementById('conversationMessages');
    
    if (!messageInput || !messagesContainer) return;
    
    const messageText = messageInput.value.trim();
    if (!messageText) {
        Notifications.error('Please enter a message');
        return;
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
    const existingMessageIndex = StudentApp.messages.findIndex(msg => msg.contact === contactName);
    
    if (existingMessageIndex >= 0) {
        const conversation = StudentApp.messages[existingMessageIndex];
        if (!conversation.chatHistory) {
            conversation.chatHistory = [
                {
                    sender: 'You',
                    message: `Hi! I'm interested in your ${conversation.type === 'roommate' ? 'roommate post' : 'property listing'}. Could we discuss the details?`,
                    timestamp: 'Just now'
                },
                {
                    sender: contactName,
                    message: `Hello! Thanks for reaching out. I'd be happy to discuss the ${conversation.type === 'roommate' ? 'roommate arrangement' : 'property details'}. What would you like to know?`,
                    timestamp: 'Just now'
                }
            ];
        }
        
        // Add new message to history
        conversation.chatHistory.push({
            sender: 'You',
            message: messageText,
            timestamp: 'Just now'
        });
        
        // Update last message
        conversation.lastMessage = messageText;
        conversation.timestamp = Utils.getCurrentTime();
    }
    
    Notifications.success('Message sent!');
    
    // Simulate response after 2 seconds
    setTimeout(() => {
        const responseHTML = `
            <div style="background: #e8f4fd; padding: 15px; border-radius: 12px; margin-bottom: 15px; border-left: 4px solid #3498db;">
                <div style="font-weight: 600; color: #2c3e50; margin-bottom: 5px;">${contactName}</div>
                <div style="color: #555;">Thanks for your message! Let me get back to you with more details soon.</div>
                <div style="font-size: 12px; color: #7f8c8d; margin-top: 8px;">Just now</div>
            </div>
        `;
        
        if (messagesContainer) {
            messagesContainer.insertAdjacentHTML('beforeend', responseHTML);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            // Add response to chat history
            if (existingMessageIndex >= 0) {
                const conversation = StudentApp.messages[existingMessageIndex];
                conversation.chatHistory.push({
                    sender: contactName,
                    message: 'Thanks for your message! Let me get back to you with more details soon.',
                    timestamp: 'Just now'
                });
                
                conversation.lastMessage = 'Thanks for your message! Let me get back to you with more details soon.';
                conversation.timestamp = Utils.getCurrentTime();
            }
        }
    }, 2000);
}

function deleteChatHistory(contactName) {
    if (confirm(`Are you sure you want to delete your conversation with ${contactName}?`)) {
        // Remove from messages list
        StudentApp.messages = StudentApp.messages.filter(msg => msg.contact !== contactName);
        
        // Close modal
        closeConversationModal();
        
        // Reload messages if we're on messages tab
        if (StudentApp.currentTab === 'messages') {
            loadMessages();
        }
        
        Notifications.success('Chat deleted successfully');
    }
}

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

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.container')) {
        initializeStudentApp();
    }
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StudentApp, Auth, SaveManager };
}