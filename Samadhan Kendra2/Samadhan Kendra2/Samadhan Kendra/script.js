// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', (e) => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
    
    // Handle smooth scrolling for anchor links
    const href = n.getAttribute('href');
    if (href && href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            const offsetTop = target.offsetTop - 100; // Account for fixed navbar
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    }
}));

// Profile Dropdown Toggle
function toggleProfileMenu() {
    const dropdown = document.getElementById('profileDropdown');
    dropdown.classList.toggle('active');
}

// Centralized Points Management System
function initializePointsDisplay() {
    const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
    const userPoints = localStorage.getItem('userPoints') || '0';
    
    // Get all points display elements
    const pointsElements = document.querySelectorAll('#navUserPoints, #userPoints, #availablePoints, #userCurrentPoints');
    
    pointsElements.forEach(element => {
        if (isLoggedIn) {
            // User is logged in - show actual points
            element.textContent = parseInt(userPoints).toLocaleString();
            element.style.display = 'inline'; // Ensure visibility
        } else {
            // User is not logged in - hide points
            element.style.display = 'none';
        }
    });
    
    // Update navigation dropdown based on login status
    updateNavigationForLoginStatus();
}

// Update navigation dropdown based on login status
function updateNavigationForLoginStatus() {
    const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
    const profileDropdown = document.getElementById('profileDropdown');
    
    if (profileDropdown) {
        if (isLoggedIn) {
            // Show logged-in user options
            profileDropdown.innerHTML = `
                <a href="profile.html"><i class="fas fa-user"></i> Profile</a>
                <a href="index.html#leaderboard"><i class="fas fa-trophy"></i> Leaderboard</a>
                <a href="rewards-program.html"><i class="fas fa-gift"></i> Rewards</a>
                <a href="#" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</a>
            `;
        } else {
            // Show guest user options - use handleProfileAccess for profile link
            profileDropdown.innerHTML = `
                <a href="#" onclick="handleProfileAccess()"><i class="fas fa-user"></i> Profile</a>
                <a href="rewards-program.html"><i class="fas fa-gift"></i> Rewards</a>
                <a href="login.html"><i class="fas fa-sign-in-alt"></i> Login</a>
                <a href="register.html"><i class="fas fa-user-plus"></i> Register</a>
            `;
        }
    }
}

// Update user points (for use when points change)
function updateUserPoints(newPoints) {
    localStorage.setItem('userPoints', newPoints.toString());
    
    // Update all points display elements
    const pointsElements = document.querySelectorAll('#navUserPoints, #userPoints, #availablePoints, #userCurrentPoints');
    pointsElements.forEach(element => {
        element.textContent = parseInt(newPoints).toLocaleString();
    });
}

// Add points to user (for rewards, upvotes, etc.)
function addUserPoints(pointsToAdd) {
    const currentPoints = parseInt(localStorage.getItem('userPoints') || '0');
    const newPoints = currentPoints + pointsToAdd;
    updateUserPoints(newPoints);
    return newPoints;
}

// Logout function
function logout() {
    // Clear any stored user data
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('userPoints');
    localStorage.removeItem('userLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userFirstName');
    localStorage.removeItem('userLastName');
    localStorage.removeItem('userCity');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('userIssues');
    localStorage.removeItem('userRank');
    
    // Show logout message
    showNotification('Successfully logged out!', 'success');
    
    // Update points display to hide them
    initializePointsDisplay();
    
    // Redirect to home page after a short delay
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

// Notification function
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('profileDropdown');
    const avatar = document.querySelector('.user-avatar');
    
    if (avatar && dropdown && !avatar.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.classList.remove('active');
    }
});

// Initialize points display when page loads
document.addEventListener('DOMContentLoaded', function() {
    try {
        initializePointsDisplay();
        initializeLocationFunctionality();
    } catch (error) {
        console.error('Error initializing page functionality:', error);
    }
});

// Sample data for demonstration
const sampleIssues = [
    {
        id: 'SK-001',
        type: 'road',
        priority: 'high',
        title: 'Large pothole on Andheri West Road',
        description: 'There is a significant pothole on Andheri West Road near the Metro station. It\'s causing damage to vehicles and is a safety hazard for motorists.',
        address: 'Andheri West Road',
        city: 'mumbai',
        landmark: 'Near Andheri Metro Station',
        status: 'investigating',
        reportedDate: '2024-01-15',
        contact: 'rajesh.kumar@email.com',
        upvotes: 12,
        media: ['pothole1.jpg'],
        gpsLocation: '19.1197,72.8464'
    },
    {
        id: 'SK-002',
        type: 'electricity',
        priority: 'medium',
        title: 'Street light not working in Bandra East',
        description: 'The street light at the corner of Bandra East near the railway station has been out for several days. This area is quite dark at night.',
        address: 'Bandra East, Near Railway Station',
        city: 'mumbai',
        landmark: 'Bandra Railway Station',
        status: 'in-progress',
        reportedDate: '2024-01-14',
        contact: 'priya.sharma@email.com',
        upvotes: 8,
        media: ['streetlight1.jpg'],
        gpsLocation: '19.0596,72.8295'
    },
    {
        id: 'SK-003',
        type: 'garbage',
        priority: 'low',
        title: 'Garbage accumulation in Juhu Beach area',
        description: 'There is a significant amount of garbage and debris accumulated in the Juhu Beach area. This needs regular maintenance.',
        address: 'Juhu Beach Area',
        city: 'mumbai',
        landmark: 'Juhu Beach',
        status: 'resolved',
        reportedDate: '2024-01-10',
        contact: 'anita.patel@email.com',
        upvotes: 15,
        media: ['garbage1.jpg'],
        gpsLocation: '19.0996,72.8344'
    },
    {
        id: 'SK-004',
        type: 'water',
        priority: 'urgent',
        title: 'Water pipeline burst in Dadar West',
        description: 'There is a major water pipeline burst in Dadar West causing flooding and water wastage. This is a critical issue requiring immediate attention.',
        address: 'Dadar West, Near Plaza Cinema',
        city: 'mumbai',
        landmark: 'Plaza Cinema',
        status: 'in-progress',
        reportedDate: '2024-01-16',
        contact: 'mike.johnson@email.com',
        upvotes: 25,
        media: ['water1.jpg', 'water2.jpg'],
        gpsLocation: '19.0170,72.8478'
    },
    {
        id: 'SK-005',
        type: 'transport',
        priority: 'high',
        title: 'Bus stop shelter damaged in Borivali',
        description: 'The bus stop shelter in Borivali West is severely damaged and poses a safety risk to commuters waiting for buses.',
        address: 'Borivali West, Near Station',
        city: 'mumbai',
        landmark: 'Borivali Railway Station',
        status: 'reported',
        reportedDate: '2024-01-16',
        contact: 'sarah.wilson@email.com',
        upvotes: 18,
        media: ['busstop1.jpg'],
        gpsLocation: '19.2324,72.8565'
    }
];

// Leaderboard data
const leaderboardData = {
    monthly: [
        { name: 'Rajesh Kumar', city: 'Mumbai', points: 3120, issues: 52, rank: 1 },
        { name: 'Priya Sharma', city: 'Mumbai', points: 2450, issues: 45, rank: 2 },
        { name: 'Anita Patel', city: 'Bangalore', points: 2180, issues: 38, rank: 3 },
        { name: 'Amit Singh', city: 'Delhi', points: 1950, issues: 35, rank: 4 },
        { name: 'Neha Gupta', city: 'Pune', points: 1820, issues: 32, rank: 5 },
        { name: 'Rahul Verma', city: 'Chennai', points: 1680, issues: 28, rank: 6 },
        { name: 'Kavita Reddy', city: 'Hyderabad', points: 1540, issues: 25, rank: 7 },
        { name: 'Vikram Malhotra', city: 'Kolkata', points: 1420, issues: 22, rank: 8 }
    ],
    yearly: [
        { name: 'Rajesh Kumar', city: 'Mumbai', points: 28450, issues: 156, rank: 1 },
        { name: 'Priya Sharma', city: 'Mumbai', points: 22180, issues: 142, rank: 2 },
        { name: 'Anita Patel', city: 'Bangalore', points: 19870, issues: 128, rank: 3 },
        { name: 'Amit Singh', city: 'Delhi', points: 18760, issues: 115, rank: 4 },
        { name: 'Neha Gupta', city: 'Pune', points: 17240, issues: 98, rank: 5 }
    ],
    alltime: [
        { name: 'Rajesh Kumar', city: 'Mumbai', points: 125680, issues: 456, rank: 1 },
        { name: 'Priya Sharma', city: 'Mumbai', points: 98750, issues: 389, rank: 2 },
        { name: 'Anita Patel', city: 'Bangalore', points: 89420, issues: 342, rank: 3 },
        { name: 'Amit Singh', city: 'Delhi', points: 76540, issues: 298, rank: 4 },
        { name: 'Neha Gupta', city: 'Pune', points: 69870, issues: 267, rank: 5 }
    ]
};

// Media upload functionality
const mediaUploadArea = document.getElementById('mediaUploadArea');
const mediaUpload = document.getElementById('mediaUpload');
const uploadedMedia = document.getElementById('uploadedMedia');
let uploadedFiles = [];

mediaUploadArea.addEventListener('click', () => {
    mediaUpload.click();
});

mediaUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    mediaUploadArea.style.borderColor = '#dc2626';
    mediaUploadArea.style.background = '#fef2f2';
});

mediaUploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    mediaUploadArea.style.borderColor = '#d1d5db';
    mediaUploadArea.style.background = '#f9fafb';
});

mediaUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    mediaUploadArea.style.borderColor = '#d1d5db';
    mediaUploadArea.style.background = '#f9fafb';
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
});

mediaUpload.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
});

function handleFiles(files) {
    files.forEach(file => {
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
            uploadedFiles.push(file);
            displayUploadedMedia(file);
        }
    });
}

function displayUploadedMedia(file) {
    const mediaItem = document.createElement('div');
    mediaItem.className = 'uploaded-media-item';
    
    if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        mediaItem.appendChild(img);
    } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.controls = true;
        mediaItem.appendChild(video);
    }
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.innerHTML = '×';
    removeBtn.onclick = () => removeMedia(file);
    mediaItem.appendChild(removeBtn);
    
    uploadedMedia.appendChild(mediaItem);
}

function removeMedia(file) {
    const index = uploadedFiles.indexOf(file);
    if (index > -1) {
        uploadedFiles.splice(index, 1);
        updateUploadedMediaDisplay();
    }
}

function updateUploadedMediaDisplay() {
    uploadedMedia.innerHTML = '';
    uploadedFiles.forEach(file => displayUploadedMedia(file));
}

// GPS Location functionality
function initializeLocationFunctionality() {
    const getLocationBtn = document.getElementById('getLocationBtn');
    const gpsLocationInput = document.getElementById('gpsLocation');
    
    console.log('Location elements found:', { getLocationBtn, gpsLocationInput });
    
    if (getLocationBtn && gpsLocationInput) {
        // Ensure button is visible
        getLocationBtn.style.display = 'inline-block';
        getLocationBtn.style.visibility = 'visible';
        
        getLocationBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                getLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting Location...';
                getLocationBtn.disabled = true;
                
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        gpsLocationInput.value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                        getLocationBtn.innerHTML = '<i class="fas fa-check"></i> Location Captured';
                        getLocationBtn.style.background = '#10b981';
                        
                        setTimeout(() => {
                            getLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i> Get Current Location';
                            getLocationBtn.style.background = '';
                            getLocationBtn.disabled = false;
                        }, 2000);
                    },
                    (error) => {
                        console.error('Error getting location:', error);
                        getLocationBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Location Error';
                        getLocationBtn.style.background = '#ef4444';
                        
                        setTimeout(() => {
                            getLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i> Get Current Location';
                            getLocationBtn.style.background = '';
                            getLocationBtn.disabled = false;
                        }, 3000);
                    }
                );
            } else {
                alert('Geolocation is not supported by this browser.');
            }
        });
    }
}

// Issue form handling
const issueForm = document.getElementById('issueForm');
const successModal = document.getElementById('successModal');
const aiModal = document.getElementById('aiModal');

issueForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Simulate AI duplicate detection
    const hasSimilarIssue = Math.random() < 0.3; // 30% chance of similar issue
    
    if (hasSimilarIssue) {
        showAIModal();
        return;
    }
    
    submitIssue();
});

function submitIssue() {
    // Get form data
    const issueData = {
        id: generateIssueId(),
        type: document.getElementById('issueType').value,
        priority: document.getElementById('priority').value,
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        landmark: document.getElementById('landmark').value,
        status: 'reported',
        reportedDate: new Date().toISOString().split('T')[0],
        contact: document.getElementById('contact').value || 'Anonymous',
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        upvotes: 0,
        media: uploadedFiles.map(file => file.name),
        gpsLocation: document.getElementById('gpsLocation').value || 'Not captured'
    };
    
    // Add to sample issues
    sampleIssues.unshift(issueData);
    
    // Show success modal
    document.getElementById('issueId').textContent = issueData.id;
    successModal.style.display = 'block';
    
    // Reset form
    issueForm.reset();
    uploadedFiles = [];
    updateUploadedMediaDisplay();
    
    // Refresh issues list
    displayIssues(sampleIssues);
    
    // Update stats
    updateStats();
    
    // Award points only if user is logged in
    const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
    if (isLoggedIn) {
        // Use centralized points system
        if (typeof addUserPoints === 'function') {
            addUserPoints(25);
        } else {
            // Fallback for pages without centralized system
            const currentPoints = parseInt(localStorage.getItem('userPoints') || '0');
            const newPoints = currentPoints + 25;
            localStorage.setItem('userPoints', newPoints.toString());
            
            // Update points display
            const pointsElements = document.querySelectorAll('#navUserPoints, #userPoints, #availablePoints, #userCurrentPoints');
            pointsElements.forEach(element => {
                if (element) {
                    element.textContent = newPoints.toLocaleString();
                }
            });
        }
        
        // Update reward info in modal
        const rewardInfo = document.querySelector('.reward-info span');
        if (rewardInfo) {
            rewardInfo.innerHTML = 'You earned <strong>25 points</strong> for this report!';
        }
    } else {
        // User not logged in - show login prompt in reward info
        const rewardInfo = document.querySelector('.reward-info span');
        if (rewardInfo) {
            rewardInfo.innerHTML = '<strong>Login to earn points!</strong> <a href="login.html" style="color: #3b82f6; text-decoration: underline;">Login now</a>';
        }
    }
}

function showAIModal() {
    aiModal.style.display = 'block';
}

function mergeWithExisting() {
    aiModal.style.display = 'none';
    // In real implementation, this would merge with existing issue
    
    // Award points only if user is logged in
    const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
    if (isLoggedIn) {
        // Use centralized points system
        if (typeof addUserPoints === 'function') {
            addUserPoints(10);
        } else {
            // Fallback for pages without centralized system
            const currentPoints = parseInt(localStorage.getItem('userPoints') || '0');
            const newPoints = currentPoints + 10;
            localStorage.setItem('userPoints', newPoints.toString());
            
            // Update points display
            const pointsElements = document.querySelectorAll('#navUserPoints, #userPoints, #availablePoints, #userCurrentPoints');
            pointsElements.forEach(element => {
                if (element) {
                    element.textContent = newPoints.toLocaleString();
                }
            });
        }
        
        alert('Issue merged with existing report. You earned 10 points for contributing!');
    } else {
        alert('Issue merged with existing report. Login to earn points for contributing!');
    }
}

function reportAsNew() {
    aiModal.style.display = 'none';
    submitIssue();
}

// Generate unique issue ID
function generateIssueId() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 3).toUpperCase();
    return `SK-${timestamp}-${random}`;
}

// Close modals
function closeModal() {
    successModal.style.display = 'none';
    aiModal.style.display = 'none';
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === successModal) {
        successModal.style.display = 'none';
    }
    if (e.target === aiModal) {
        aiModal.style.display = 'none';
    }
});

// Close modal with X button
document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', closeModal);
});

// Display issues with enhanced features
function displayIssues(issues) {
    const issuesList = document.getElementById('issuesList');
    
    if (issues.length === 0) {
        issuesList.innerHTML = '<div class="no-issues"><p>No issues found matching your criteria.</p></div>';
        return;
    }
    
    issuesList.innerHTML = issues.map(issue => `
        <div class="issue-card">
            <div class="issue-header">
                <h3 class="issue-title">
                    <i class="${getTypeIcon(issue.type)}" style="margin-right: 8px; color: #dc2626;"></i>
                    ${issue.title}
                </h3>
                <span class="issue-status status-${issue.status}">${issue.status.replace('-', ' ')}</span>
            </div>
            <div class="issue-details">
                <div class="issue-detail">
                    <i class="fas fa-tag"></i>
                    <span>${getIssueTypeLabel(issue.type)}</span>
                </div>
                <div class="issue-detail">
                    <i class="${getPriorityIcon(issue.priority)}" style="color: ${getPriorityColor(issue.priority)};"></i>
                    <span>${issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)} Priority</span>
                </div>
                <div class="issue-detail">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${issue.address}, ${getCityLabel(issue.city)}</span>
                </div>
                <div class="issue-detail">
                    <i class="fas fa-calendar"></i>
                    <span>Reported: ${formatDate(issue.reportedDate)}</span>
                </div>
                <div class="issue-detail">
                    <i class="fas fa-thumbs-up"></i>
                    <span>${issue.upvotes} upvotes</span>
                </div>
            </div>
            <p class="issue-description">${issue.description}</p>
            ${issue.landmark ? `<p><strong>Landmark:</strong> ${issue.landmark}</p>` : ''}
            ${issue.gpsLocation && issue.gpsLocation !== 'Not captured' ? `<p><strong>GPS:</strong> ${issue.gpsLocation}</p>` : ''}
            <div class="issue-actions">
                <button class="btn btn-upvote btn-sm" onclick="upvoteIssue('${issue.id}')">
                    <i class="fas fa-thumbs-up"></i> Upvote
                </button>
                <button class="btn btn-primary btn-sm" onclick="trackIssue('${issue.id}')">
                    <i class="fas fa-eye"></i> Track
                </button>
            </div>
        </div>
    `).join('');
}

// Get issue type label
function getIssueTypeLabel(type) {
    const typeLabels = {
        'garbage': '🗑️ Garbage & Waste',
        'road': '🚧 Road & Infrastructure',
        'water': '💧 Water Supply',
        'electricity': '⚡ Electricity',
        'safety': '🛡️ Safety & Security',
        'transport': '🚌 Public Transport',
        'parks': '🌳 Parks & Recreation',
        'noise': '🔊 Noise Pollution',
        'air': '🌬️ Air Quality',
        'other': '❓ Other'
    };
    return typeLabels[type] || type;
}

// Get city label
function getCityLabel(city) {
    const cityLabels = {
        'mumbai': 'Mumbai, Maharashtra',
        'delhi': 'Delhi, NCR',
        'bangalore': 'Bangalore, Karnataka',
        'hyderabad': 'Hyderabad, Telangana',
        'chennai': 'Chennai, Tamil Nadu',
        'kolkata': 'Kolkata, West Bengal',
        'pune': 'Pune, Maharashtra',
        'ahmedabad': 'Ahmedabad, Gujarat',
        'jaipur': 'Jaipur, Rajasthan',
        'lucknow': 'Lucknow, Uttar Pradesh'
    };
    return cityLabels[city] || city;
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
}

// Filter issues
function filterIssues() {
    const statusFilter = document.getElementById('statusFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    const cityFilter = document.getElementById('cityFilter').value;
    const searchFilter = document.getElementById('searchFilter').value.toLowerCase();
    
    let filteredIssues = sampleIssues.filter(issue => {
        const statusMatch = statusFilter === 'all' || issue.status === statusFilter;
        const typeMatch = typeFilter === 'all' || issue.type === typeFilter;
        const cityMatch = cityFilter === 'all' || issue.city === cityFilter;
        const searchMatch = searchFilter === '' || 
            issue.title.toLowerCase().includes(searchFilter) ||
            issue.description.toLowerCase().includes(searchFilter) ||
            issue.address.toLowerCase().includes(searchFilter) ||
            getCityLabel(issue.city).toLowerCase().includes(searchFilter);
        
        return statusMatch && typeMatch && cityMatch && searchMatch;
    });
    
    displayIssues(filteredIssues);
}

// Add event listeners to filters
document.getElementById('statusFilter').addEventListener('change', filterIssues);
document.getElementById('typeFilter').addEventListener('change', filterIssues);
document.getElementById('cityFilter').addEventListener('change', filterIssues);
document.getElementById('searchFilter').addEventListener('input', filterIssues);

// Update statistics
function updateStats() {
    const totalIssues = sampleIssues.length;
    const resolvedIssues = sampleIssues.filter(issue => issue.status === 'resolved').length;
    const activeUsers = Math.floor(Math.random() * 100) + 8000; // Simulate user count
    const rewardsDistributed = Math.floor(Math.random() * 50000) + 200000; // Simulate rewards
    
    // Update hero stats
    document.querySelector('.stat-item:nth-child(1) .stat-number').textContent = totalIssues.toLocaleString();
    document.querySelector('.stat-item:nth-child(2) .stat-number').textContent = resolvedIssues.toLocaleString();
    document.querySelector('.stat-item:nth-child(3) .stat-number').textContent = activeUsers.toLocaleString();
    document.querySelector('.stat-item:nth-child(4) .stat-number').textContent = `₹${(rewardsDistributed/1000).toFixed(1)}L`;
}

// Update user points
function updateUserPoints(points) {
    const userPointsElement = document.getElementById('userPoints');
    const currentPoints = parseInt(userPointsElement.textContent.replace(/,/g, ''));
    const newPoints = currentPoints + points;
    userPointsElement.textContent = newPoints.toLocaleString();
}

// Leaderboard functionality
function displayLeaderboard(period = 'monthly') {
    const leaderboardList = document.getElementById('leaderboardList');
    const data = leaderboardData[period];
    
    // Update top 3 positions dynamically
    updateTop3Positions(data);
    
    // Display remaining positions (4th onwards)
    leaderboardList.innerHTML = data.slice(3).map((user, index) => `
        <div class="leaderboard-item">
            <div class="rank">${user.rank}</div>
            <div class="avatar">
                <i class="fas fa-user-circle"></i>
            </div>
            <div class="info">
                <h4>${user.name}</h4>
                <p>${user.city}</p>
            </div>
            <div class="stats">
                <div class="points">${user.points.toLocaleString()} pts</div>
                <div class="issues">${user.issues} issues</div>
            </div>
        </div>
    `).join('');
}

// Function to update top 3 positions dynamically
function updateTop3Positions(data) {
    const top3 = data.slice(0, 3);
    
    // Update first position
    const firstPosition = document.querySelector('.leaderboard-item.first');
    if (firstPosition && top3[0]) {
        firstPosition.querySelector('.info h4').textContent = top3[0].name;
        firstPosition.querySelector('.info p').textContent = top3[0].city;
        firstPosition.querySelector('.stats .points').textContent = `${top3[0].points.toLocaleString()} pts`;
        firstPosition.querySelector('.stats .issues').textContent = `${top3[0].issues} issues`;
    }
    
    // Update second position
    const secondPosition = document.querySelector('.leaderboard-item.second');
    if (secondPosition && top3[1]) {
        secondPosition.querySelector('.info h4').textContent = top3[1].name;
        secondPosition.querySelector('.info p').textContent = top3[1].city;
        secondPosition.querySelector('.stats .points').textContent = `${top3[1].points.toLocaleString()} pts`;
        secondPosition.querySelector('.stats .issues').textContent = `${top3[1].issues} issues`;
    }
    
    // Update third position
    const thirdPosition = document.querySelector('.leaderboard-item.third');
    if (thirdPosition && top3[2]) {
        thirdPosition.querySelector('.info h4').textContent = top3[2].name;
        thirdPosition.querySelector('.info p').textContent = top3[2].city;
        thirdPosition.querySelector('.stats .points').textContent = `${top3[2].points.toLocaleString()} pts`;
        thirdPosition.querySelector('.stats .issues').textContent = `${top3[2].issues} issues`;
    }
}

// Leaderboard tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all tabs
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        // Add active class to clicked tab
        btn.classList.add('active');
        // Display corresponding leaderboard
        displayLeaderboard(btn.dataset.tab);
    });
});

// Issue actions
function upvoteIssue(issueId) {
    const issue = sampleIssues.find(i => i.id === issueId);
    if (issue) {
        issue.upvotes++;
        displayIssues(sampleIssues);
        updateUserPoints(5); // Earn 5 points for upvoting
    }
}

function trackIssue(issueId) {
    alert(`Tracking issue ${issueId}. You'll receive updates on status changes.`);
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Display initial issues
    displayIssues(sampleIssues);
    
    // Update initial stats
    updateStats();
    
    // Display initial leaderboard
    displayLeaderboard('monthly');
    
    // Add some animation to stats
    animateStats();
});

// Animate statistics on page load
function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    statNumbers.forEach(stat => {
        const finalValue = parseInt(stat.textContent.replace(/[^\d]/g, ''));
        let currentValue = 0;
        const increment = finalValue / 50;
        
        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= finalValue) {
                currentValue = finalValue;
                clearInterval(timer);
            }
            stat.textContent = stat.textContent.includes('₹') ? 
                `₹${Math.floor(currentValue/1000).toFixed(1)}L` : 
                Math.floor(currentValue).toLocaleString();
        }, 30);
    });
}

// Add loading state to form submission
issueForm.addEventListener('submit', function() {
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;
    
    // Simulate form processing
    setTimeout(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 2000);
});

// Add keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Add issue priority indicators
function getPriorityIcon(priority) {
    const icons = {
        'low': 'fas fa-info-circle',
        'medium': 'fas fa-exclamation-circle',
        'high': 'fas fa-exclamation-triangle',
        'urgent': 'fas fa-radiation'
    };
    return icons[priority] || 'fas fa-info-circle';
}

// Add issue type icons
function getTypeIcon(type) {
    const icons = {
        'garbage': 'fas fa-trash',
        'road': 'fas fa-road',
        'water': 'fas fa-tint',
        'electricity': 'fas fa-bolt',
        'safety': 'fas fa-shield-alt',
        'transport': 'fas fa-bus',
        'parks': 'fas fa-tree',
        'noise': 'fas fa-volume-up',
        'air': 'fas fa-wind',
        'other': 'fas fa-question-circle'
    };
    return icons[type] || 'fas fa-question-circle';
}

// Get priority color
function getPriorityColor(priority) {
    const colors = {
        'low': '#10b981',
        'medium': '#f59e0b',
        'high': '#ef4444',
        'urgent': '#dc2626'
    };
    return colors[priority] || '#6b7280';
}

// Add CSS for small buttons
const style = document.createElement('style');
style.textContent = `
    .btn-sm {
        padding: 8px 16px;
        font-size: 0.875rem;
    }
    
    .issue-actions {
        display: flex;
        gap: 1rem;
        margin-top: 1.5rem;
    }
    
    .no-issues {
        text-align: center;
        padding: 3rem;
        color: #64748b;
        font-size: 1.1rem;
    }
`;
document.head.appendChild(style);

// Authentication Helper Functions
function isUserLoggedIn() {
    const userToken = localStorage.getItem('userToken');
    const userLoggedIn = localStorage.getItem('userLoggedIn');
    return userToken && userLoggedIn === 'true';
}

function enforceAuthentication() {
    if (!isUserLoggedIn()) {
        window.location.replace('login.html');
    }
}

function preventLoggedInAccess() {
    if (isUserLoggedIn()) {
        window.location.replace('profile.html');
    }
}

function redirectBasedOnAuth() {
    if (isUserLoggedIn()) {
        window.location.replace('profile.html');
    } else {
        window.location.replace('login.html');
    }
}

// New function to handle profile access with friendly message
function handleProfileAccess() {
    if (isUserLoggedIn()) {
        // User is logged in, redirect to profile
        window.location.href = 'profile.html';
    } else {
        // User is not logged in, show friendly message then redirect
        showNotification('Please login to view your profile', 'info');
        
        // Show a more detailed message in a modal or alert
        setTimeout(() => {
            if (confirm('You need to be logged in to access your profile.\n\nWould you like to go to the login page now?')) {
                window.location.href = 'login.html';
            }
        }, 1000);
    }
}

function clearProfileDataFromDOM() {
    // Clear any profile-related data from the DOM
    const profileElements = document.querySelectorAll('[data-profile]');
    profileElements.forEach(element => {
        element.textContent = '';
    });
    
    // Clear any cached profile images or data
    const profileImages = document.querySelectorAll('.profile-image, .user-avatar');
    profileImages.forEach(img => {
        if (img.src && !img.src.includes('default')) {
            img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNFNUU3RUIiLz4KPHBhdGggZD0iTTIwIDEwQzIyLjc2MTQgMTAgMjUgMTIuMjM4NiAyNSAxNUMyNSAxNy43NjE0IDIyLjc2MTQgMjAgMjAgMjBDMTcuMjM4NiAyMCAxNSAxNy43NjE0IDE1IDE1QzE1IDEyLjIzODYgMTcuMjM4NiAxMCAyMCAxMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTI4IDMwQzI4IDI2LjY4NjMgMjQuNDE0MiAyNCAyMCAyNEMxNS41ODU4IDI0IDEyIDI2LjY4NjMgMTIgMzBIMjhaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
        }
    });
}

function updateNavigationAfterLogout() {
    // Update navigation elements to show logged-out state
    const userMenuElements = document.querySelectorAll('.user-menu, .profile-dropdown');
    userMenuElements.forEach(element => {
        element.style.display = 'none';
    });
    
    const loginButtons = document.querySelectorAll('.login-btn, .signup-btn');
    loginButtons.forEach(btn => {
        btn.style.display = 'inline-block';
    });
    
    const profileLinks = document.querySelectorAll('.profile-link');
    profileLinks.forEach(link => {
        link.style.display = 'none';
    });
}

// Make functions globally available
window.isUserLoggedIn = isUserLoggedIn;
window.enforceAuthentication = enforceAuthentication;
window.preventLoggedInAccess = preventLoggedInAccess;
window.redirectBasedOnAuth = redirectBasedOnAuth;
window.handleProfileAccess = handleProfileAccess;
window.clearProfileDataFromDOM = clearProfileDataFromDOM;
window.updateNavigationAfterLogout = updateNavigationAfterLogout;
