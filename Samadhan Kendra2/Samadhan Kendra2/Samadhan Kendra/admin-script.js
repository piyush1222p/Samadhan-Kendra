// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.currentUser = null;
        this.users = [];
        this.issues = [];
        this.categories = [];
        this.auditLogs = [];
        
        this.init();
    }

    init() {
        this.checkAuth();
        this.loadData();
        this.setupEventListeners();
        this.displayDashboard();
    }

    checkAuth() {
        const adminToken = localStorage.getItem('adminToken');
        const adminUser = localStorage.getItem('adminUser');
        const sessionTime = localStorage.getItem('adminSessionTime');
        
        if (!adminToken || !adminUser) {
            this.redirectToLogin();
            return;
        }

        // Check session timeout (8 hours)
        const sessionTimeout = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
        const currentTime = Date.now();
        const sessionStartTime = parseInt(sessionTime) || currentTime;
        
        if (currentTime - sessionStartTime > sessionTimeout) {
            this.showToast('Session expired. Please login again.', 'error');
            this.clearSession();
            this.redirectToLogin();
            return;
        }

        // Update session time
        localStorage.setItem('adminSessionTime', currentTime.toString());

        try {
            this.currentUser = JSON.parse(adminUser);
            document.getElementById('adminUserName').textContent = this.currentUser.name;
        } catch (error) {
            console.error('Error parsing admin user data:', error);
            this.redirectToLogin();
        }
    }

    redirectToLogin() {
        window.location.href = 'admin-login.html';
    }

    clearSession() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminSessionTime');
    }

    loadData() {
        this.users = [
            {
                id: 'user-001',
                name: 'Rajesh Kumar',
                email: 'rajesh.kumar@email.com',
                phone: '+91 98765 43210',
                city: 'mumbai',
                role: 'user',
                status: 'active',
                points: 3120,
                joined: '2024-01-01',
                issuesReported: 52
            },
            {
                id: 'user-002',
                name: 'Priya Sharma',
                email: 'priya.sharma@email.com',
                phone: '+91 98765 43211',
                city: 'mumbai',
                role: 'user',
                status: 'active',
                points: 2450,
                joined: '2024-01-05',
                issuesReported: 45
            }
        ];

        this.issues = window.sampleIssues || [
            {
                id: 'SK-001',
                type: 'road',
                priority: 'high',
                title: 'Large pothole on Andheri West Road',
                description: 'There is a significant pothole on Andheri West Road near the Metro station.',
                address: 'Andheri West Road',
                city: 'mumbai',
                status: 'investigating',
                reportedDate: '2024-01-15',
                contact: 'rajesh.kumar@email.com',
                upvotes: 12
            },
            {
                id: 'SK-002',
                type: 'garbage',
                priority: 'medium',
                title: 'Garbage not collected for 3 days',
                description: 'Garbage bins are overflowing and not being collected regularly.',
                address: 'Bandra East',
                city: 'mumbai',
                status: 'reported',
                reportedDate: '2024-01-16',
                contact: 'priya.sharma@email.com',
                upvotes: 8
            },
            {
                id: 'SK-003',
                type: 'water',
                priority: 'urgent',
                title: 'Water supply disruption',
                description: 'No water supply in the entire building for the past 24 hours.',
                address: 'Worli',
                city: 'mumbai',
                status: 'in-progress',
                reportedDate: '2024-01-14',
                contact: 'amit.patel@email.com',
                upvotes: 25
            },
            {
                id: 'SK-004',
                type: 'electricity',
                priority: 'high',
                title: 'Street lights not working',
                description: 'Street lights on the main road are not functioning properly.',
                address: 'Juhu',
                city: 'mumbai',
                status: 'resolved',
                reportedDate: '2024-01-10',
                contact: 'neha.gupta@email.com',
                upvotes: 15
            },
            {
                id: 'SK-005',
                type: 'road',
                priority: 'medium',
                title: 'Broken footpath tiles',
                description: 'Several tiles on the footpath are broken and pose a safety hazard.',
                address: 'Colaba',
                city: 'mumbai',
                status: 'reported',
                reportedDate: '2024-01-17',
                contact: 'vikram.singh@email.com',
                upvotes: 6
            }
        ];

        this.categories = [
            { id: 'garbage', name: 'Garbage & Waste', icon: '🗑️', description: 'Waste management and cleanliness issues', defaultPriority: 'medium' },
            { id: 'road', name: 'Road & Infrastructure', icon: '🚧', description: 'Roads, bridges, and infrastructure problems', defaultPriority: 'high' },
            { id: 'water', name: 'Water Supply', icon: '💧', description: 'Water supply and drainage issues', defaultPriority: 'high' },
            { id: 'electricity', name: 'Electricity', icon: '⚡', description: 'Power supply and electrical problems', defaultPriority: 'urgent' }
        ];

        this.auditLogs = [
            {
                timestamp: '2024-01-20 14:30:00',
                adminUser: 'Administrator',
                action: 'create',
                resource: 'User',
                details: 'Created new user: Priya Sharma',
                ipAddress: '192.168.1.100'
            }
        ];
    }

    setupEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(item.dataset.tab);
            });
        });

        // Session timeout warning (7.5 hours)
        this.setupSessionTimeoutWarning();
        
        // Activity monitoring to extend session
        this.setupActivityMonitoring();

        this.setupSearchAndFilters();
        this.setupSettingsListeners();
    }

    setupSessionTimeoutWarning() {
        const sessionTime = localStorage.getItem('adminSessionTime');
        if (sessionTime) {
            const sessionStartTime = parseInt(sessionTime);
            const warningTime = 7.5 * 60 * 60 * 1000; // 7.5 hours
            const timeUntilWarning = warningTime - (Date.now() - sessionStartTime);
            
            if (timeUntilWarning > 0) {
                setTimeout(() => {
                    this.showSessionWarning();
                }, timeUntilWarning);
            }
        }
    }

    setupActivityMonitoring() {
        // Extend session on user activity
        const activities = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        activities.forEach(activity => {
            document.addEventListener(activity, () => {
                this.extendSession();
            }, { passive: true });
        });
    }

    extendSession() {
        const currentTime = Date.now();
        localStorage.setItem('adminSessionTime', currentTime.toString());
    }

    showSessionWarning() {
        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 450px;">
                <div class="modal-header">
                    <h3><i class="fas fa-clock"></i> Session Timeout Warning</h3>
                </div>
                <div class="modal-body">
                    <p>Your admin session will expire in 30 minutes due to inactivity.</p>
                    <p style="color: #6b7280; font-size: 0.9rem;">Click "Extend Session" to continue working, or "Logout" to end your session now.</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="adminPanel.logoutNow()">Logout Now</button>
                    <button class="btn btn-primary" onclick="adminPanel.extendSessionAndClose()">Extend Session</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    extendSessionAndClose() {
        this.extendSession();
        this.setupSessionTimeoutWarning(); // Reset warning timer
        const modal = document.querySelector('.admin-modal');
        if (modal) modal.remove();
        this.showToast('Session extended successfully!', 'success');
    }

    logoutNow() {
        this.clearSession();
        this.showToast('Logged out due to session timeout', 'error');
        setTimeout(() => {
            window.location.href = 'admin-login.html';
        }, 1000);
    }

    setupSearchAndFilters() {
        const userSearch = document.getElementById('userSearch');
        if (userSearch) userSearch.addEventListener('input', () => this.filterUsers());

        const issueSearch = document.getElementById('issueSearch');
        if (issueSearch) issueSearch.addEventListener('input', () => this.filterIssues());
    }

    setupSettingsListeners() {
        // Auto-save settings when toggles are changed
        const settingToggles = [
            'adminEmailNotifications', 'adminSmsNotifications', 'adminIssueAlerts', 'adminUserReports',
            'adminAutoRefresh', 'adminDarkMode', 'adminCompactView', 'adminSessionWarning'
        ];

        settingToggles.forEach(settingId => {
            const element = document.getElementById(settingId);
            if (element) {
                element.addEventListener('change', () => {
                    this.saveAdminSettings();
                });
            }
        });
    }

    switchTab(tabName) {
        document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));

        document.getElementById(tabName).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        switch (tabName) {
            case 'dashboard':
                this.displayDashboard();
                break;
            case 'users':
                this.displayUsers();
                break;
            case 'issues':
                this.displayIssues();
                break;
            case 'categories':
                this.displayCategories();
                break;
            case 'audit':
                this.displayAuditLogs();
                break;
            case 'profile':
                this.displayProfile();
                break;
            case 'settings':
                this.displaySettings();
                break;
        }
    }

    displayDashboard() {
        this.updateDashboardStats();
        this.displayRecentActivity();
        this.createCategoryChart();
        this.createTrendChart();
    }

    updateDashboardStats() {
        const totalUsers = this.users.length;
        const totalIssues = this.issues.length;
        const resolvedIssues = this.issues.filter(issue => issue.status === 'resolved').length;
        const pendingIssues = totalIssues - resolvedIssues;

        document.getElementById('totalUsers').textContent = totalUsers.toLocaleString();
        document.getElementById('totalIssues').textContent = totalIssues.toLocaleString();
        document.getElementById('resolvedIssues').textContent = resolvedIssues.toLocaleString();
        document.getElementById('pendingIssues').textContent = pendingIssues.toLocaleString();
    }

    displayRecentActivity() {
        const activityList = document.getElementById('recentActivityList');
        if (!activityList) return;

        const recentActivities = this.auditLogs.slice(0, 5);
        
        activityList.innerHTML = recentActivities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-info"></i>
                </div>
                <div class="activity-content">
                    <h4>${activity.action.charAt(0).toUpperCase() + activity.action.slice(1)} ${activity.resource}</h4>
                    <p>${activity.details}</p>
                </div>
                <div class="activity-time">${this.formatTime(activity.timestamp)}</div>
            </div>
        `).join('');
    }

    displayUsers() {
        const usersTableBody = document.getElementById('usersTableBody');
        if (!usersTableBody) return;

        usersTableBody.innerHTML = this.users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${this.getCityLabel(user.city)}</td>
                <td><span class="role-badge role-${user.role}">${user.role}</span></td>
                <td><span class="status-badge status-${user.status}">${user.status}</span></td>
                <td>${user.points.toLocaleString()}</td>
                <td>${this.formatDate(user.joined)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="adminPanel.editUser('${user.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" onclick="adminPanel.deleteUser('${user.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    displayIssues() {
        const issuesTableBody = document.getElementById('issuesTableBody');
        if (!issuesTableBody) return;

        issuesTableBody.innerHTML = this.issues.map(issue => `
            <tr>
                <td>${issue.id}</td>
                <td>${issue.title}</td>
                <td>${this.getIssueTypeLabel(issue.type)}</td>
                <td><span class="priority-badge priority-${issue.priority}">${issue.priority}</span></td>
                <td><span class="status-badge status-${issue.status}">${issue.status}</span></td>
                <td>${issue.contact}</td>
                <td>${issue.address}, ${this.getCityLabel(issue.city)}</td>
                <td>${this.formatDate(issue.reportedDate)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="adminPanel.editIssue('${issue.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" onclick="adminPanel.deleteIssue('${issue.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    displayCategories() {
        const categoriesGrid = document.getElementById('categoriesGrid');
        if (!categoriesGrid) return;

        categoriesGrid.innerHTML = this.categories.map(category => `
            <div class="category-card">
                <div class="category-icon">${category.icon}</div>
                <div class="category-info">
                    <h4>${category.name}</h4>
                    <p>${category.description}</p>
                </div>
                <div class="category-actions">
                    <button class="btn-edit" onclick="adminPanel.editCategory('${category.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="adminPanel.deleteCategory('${category.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    displayAuditLogs() {
        const auditTableBody = document.getElementById('auditTableBody');
        if (!auditTableBody) return;

        auditTableBody.innerHTML = this.auditLogs.map(log => `
            <tr>
                <td>${this.formatTime(log.timestamp)}</td>
                <td>${log.adminUser}</td>
                <td>${log.action.charAt(0).toUpperCase() + log.action.slice(1)}</td>
                <td>${log.resource}</td>
                <td>${log.details}</td>
                <td>${log.ipAddress}</td>
            </tr>
        `).join('');
    }

    filterUsers() {
        const searchTerm = document.getElementById('userSearch').value.toLowerCase();
        const filteredUsers = this.users.filter(user => 
            user.name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm)
        );
        this.displayFilteredUsers(filteredUsers);
    }

    filterIssues() {
        const searchTerm = document.getElementById('issueSearch').value.toLowerCase();
        const filteredIssues = this.issues.filter(issue => 
            issue.title.toLowerCase().includes(searchTerm) ||
            issue.description.toLowerCase().includes(searchTerm)
        );
        this.displayFilteredIssues(filteredIssues);
    }

    displayFilteredUsers(users) {
        const usersTableBody = document.getElementById('usersTableBody');
        if (!usersTableBody) return;

        usersTableBody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${this.getCityLabel(user.city)}</td>
                <td><span class="role-badge role-${user.role}">${user.role}</span></td>
                <td><span class="status-badge status-${user.status}">${user.status}</span></td>
                <td>${user.points.toLocaleString()}</td>
                <td>${this.formatDate(user.joined)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="adminPanel.editUser('${user.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" onclick="adminPanel.deleteUser('${user.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    displayFilteredIssues(issues) {
        const issuesTableBody = document.getElementById('issuesTableBody');
        if (!issuesTableBody) return;

        issuesTableBody.innerHTML = issues.map(issue => `
            <tr>
                <td>${issue.id}</td>
                <td>${issue.title}</td>
                <td>${this.getIssueTypeLabel(issue.type)}</td>
                <td><span class="priority-badge priority-${issue.priority}">${issue.priority}</span></td>
                <td><span class="status-badge status-${issue.status}">${issue.status}</span></td>
                <td>${issue.contact}</td>
                <td>${issue.address}, ${this.getCityLabel(issue.city)}</td>
                <td>${this.formatDate(issue.reportedDate)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="adminPanel.editIssue('${issue.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" onclick="adminPanel.deleteIssue('${issue.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;
        this.showToast(`Editing user: ${user.name}`, 'info');
    }

    deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user?')) return;
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        this.users = this.users.filter(u => u.id !== userId);
        this.displayUsers();
        this.updateDashboardStats();
        this.showToast(`User ${user.name} has been deleted`, 'success');
    }

    editIssue(issueId) {
        const issue = this.issues.find(i => i.id === issueId);
        if (!issue) return;

        document.getElementById('editIssueTitle').value = issue.title;
        document.getElementById('editIssueStatus').value = issue.status;
        document.getElementById('editIssueCategory').value = issue.type;
        document.getElementById('editIssuePriority').value = issue.priority;
        document.getElementById('editIssueDescription').value = issue.description;

        document.getElementById('editIssueModal').style.display = 'block';
    }

    deleteIssue(issueId) {
        if (!confirm('Are you sure you want to delete this issue?')) return;
        const issue = this.issues.find(i => i.id === issueId);
        if (!issue) return;

        this.issues = this.issues.filter(i => i.id !== issueId);
        this.displayIssues();
        this.updateDashboardStats();
        this.showToast(`Issue "${issue.title}" has been deleted`, 'success');
    }

    editCategory(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        if (!category) return;
        this.showToast(`Editing category: ${category.name}`, 'info');
    }

    deleteCategory(categoryId) {
        if (!confirm('Are you sure you want to delete this category?')) return;
        const category = this.categories.find(c => c.id === categoryId);
        if (!category) return;

        const issuesUsingCategory = this.issues.filter(i => i.type === categoryId);
        if (issuesUsingCategory.length > 0) {
            this.showToast(`Cannot delete category: ${issuesUsingCategory.length} issues are using it`, 'error');
            return;
        }

        this.categories = this.categories.filter(c => c.id !== categoryId);
        this.displayCategories();
        this.showToast(`Category "${category.name}" has been deleted`, 'success');
    }

    saveSettings() {
        const emailNotifications = document.getElementById('emailNotifications').checked;
        const smsNotifications = document.getElementById('smsNotifications').checked;
        const autoAssignIssues = document.getElementById('autoAssignIssues').checked;
        const maintenanceMode = document.getElementById('maintenanceMode').checked;

        localStorage.setItem('adminSettings', JSON.stringify({
            emailNotifications,
            smsNotifications,
            autoAssignIssues,
            maintenanceMode
        }));

        this.showToast('Settings saved successfully', 'success');
    }

    showAddUserModal() {
        document.getElementById('addUserModal').style.display = 'block';
    }

    showAddCategoryModal() {
        document.getElementById('addCategoryModal').style.display = 'block';
    }

    closeAllModals() {
        document.querySelectorAll('.admin-modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    addNewUser() {
        const name = document.getElementById('newUserName').value;
        const email = document.getElementById('newUserEmail').value;
        const phone = document.getElementById('newUserPhone').value;
        const city = document.getElementById('newUserCity').value;
        const role = document.getElementById('newUserRole').value;
        const password = document.getElementById('newUserPassword').value;

        if (!name || !email || !phone || !city || !role || !password) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        const newUser = {
            id: `user-${Date.now()}`,
            name,
            email,
            phone,
            city,
            role,
            status: 'active',
            points: 0,
            joined: new Date().toISOString().split('T')[0],
            issuesReported: 0
        };

        this.users.push(newUser);
        this.closeAllModals();
        this.displayUsers();
        this.updateDashboardStats();
        this.showToast(`User ${name} has been created successfully`, 'success');
        document.getElementById('addUserForm').reset();
    }

    addNewCategory() {
        const name = document.getElementById('newCategoryName').value;
        const icon = document.getElementById('newCategoryIcon').value;
        const description = document.getElementById('newCategoryDescription').value;
        const defaultPriority = document.getElementById('newCategoryPriority').value;

        if (!name || !icon || !defaultPriority) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        const newCategory = {
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name,
            icon,
            description,
            defaultPriority
        };

        this.categories.push(newCategory);
        this.closeAllModals();
        this.displayCategories();
        this.showToast(`Category "${name}" has been created successfully`, 'success');
        document.getElementById('addCategoryForm').reset();
    }

    saveIssueChanges() {
        const title = document.getElementById('editIssueTitle').value;
        const status = document.getElementById('editIssueStatus').value;
        const category = document.getElementById('editIssueCategory').value;
        const priority = document.getElementById('editIssuePriority').value;
        const description = document.getElementById('editIssueDescription').value;

        if (!title || !status || !category || !priority || !description) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        this.closeAllModals();
        this.showToast('Issue updated successfully', 'success');
    }

    getCityLabel(city) {
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

    getIssueTypeLabel(type) {
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

    formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-IN', options);
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = toast.querySelector('.toast-message');
        const toastIcon = toast.querySelector('.toast-icon');

        toastMessage.textContent = message;
        
        if (type === 'error') {
            toast.classList.add('error');
            toastIcon.className = 'toast-icon fas fa-exclamation-circle';
        } else {
            toast.classList.remove('error');
            toastIcon.className = 'toast-icon fas fa-check-circle';
        }

        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    adminLogout() {
        // Show confirmation dialog
        const confirmed = confirm('Are you sure you want to logout from the admin panel?');
        
        if (confirmed) {
            this.clearSession();
            
            // Show logout message
            this.showToast('Successfully logged out!', 'success');
            
            // Redirect to main page after a short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }

    // Enhanced logout with better UX
    showLogoutConfirmation() {
        // Create a custom confirmation modal
        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h3><i class="fas fa-sign-out-alt"></i> Confirm Logout</h3>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to logout from the admin panel?</p>
                    <p style="color: #6b7280; font-size: 0.9rem;">You will need to login again to access the admin panel.</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-cancel" onclick="this.closest('.admin-modal').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="adminPanel.confirmLogout()">Logout</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    confirmLogout() {
        this.clearSession();
        
        // Show logout message
        this.showToast('Successfully logged out! Redirecting...', 'success');
        
        // Remove modal
        const modal = document.querySelector('.admin-modal');
        if (modal) modal.remove();
        
        // Redirect to main page after a short delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }

    // Chart Methods
    createCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        // Calculate category distribution
        const categoryCounts = {};
        this.issues.forEach(issue => {
            categoryCounts[issue.type] = (categoryCounts[issue.type] || 0) + 1;
        });

        const labels = Object.keys(categoryCounts).map(type => this.getIssueTypeLabel(type));
        const data = Object.values(categoryCounts);
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'];

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, data.length),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    createTrendChart() {
        const ctx = document.getElementById('trendChart');
        if (!ctx) return;

        // Generate monthly data for the last 6 months
        const months = [];
        const reportedData = [];
        const resolvedData = [];
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            months.push(date.toLocaleDateString('en-US', { month: 'short' }));
            
            // Simulate data
            reportedData.push(Math.floor(Math.random() * 50) + 20);
            resolvedData.push(Math.floor(Math.random() * 40) + 15);
        }

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Issues Reported',
                    data: reportedData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Issues Resolved',
                    data: resolvedData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Profile Management
    displayProfile() {
        // Profile is already populated in HTML
        this.loadAdminProfile();
    }

    loadAdminProfile() {
        const adminProfile = localStorage.getItem('adminProfile');
        if (adminProfile) {
            const profile = JSON.parse(adminProfile);
            document.getElementById('adminFullName').value = profile.name || 'Administrator';
            document.getElementById('adminEmail').value = profile.email || 'admin@samadhankendra.com';
            document.getElementById('adminPhone').value = profile.phone || '+91 98765 43210';
            document.getElementById('adminDepartment').value = profile.department || 'IT Administration';
            document.getElementById('adminBio').value = profile.bio || 'Experienced administrator with expertise in civic issue management and system administration.';
        }
    }

    updateProfile() {
        const profile = {
            name: document.getElementById('adminFullName').value,
            email: document.getElementById('adminEmail').value,
            phone: document.getElementById('adminPhone').value,
            department: document.getElementById('adminDepartment').value,
            bio: document.getElementById('adminBio').value
        };

        localStorage.setItem('adminProfile', JSON.stringify(profile));
        this.showToast('Profile updated successfully!', 'success');
    }

    changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showToast('Please fill in all password fields', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showToast('New passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 8) {
            this.showToast('Password must be at least 8 characters long', 'error');
            return;
        }

        // In a real application, you would validate current password and update
        this.showToast('Password changed successfully!', 'success');
        document.getElementById('adminPasswordForm').reset();
    }

    // Settings Management
    displaySettings() {
        this.loadAdminSettings();
    }

    loadAdminSettings() {
        const settings = localStorage.getItem('adminSettings');
        if (settings) {
            const adminSettings = JSON.parse(settings);
            document.getElementById('adminEmailNotifications').checked = adminSettings.emailNotifications || false;
            document.getElementById('adminSmsNotifications').checked = adminSettings.smsNotifications || false;
            document.getElementById('adminIssueAlerts').checked = adminSettings.issueAlerts || false;
            document.getElementById('adminUserReports').checked = adminSettings.userReports || false;
            document.getElementById('adminAutoRefresh').checked = adminSettings.autoRefresh || false;
            document.getElementById('adminDarkMode').checked = adminSettings.darkMode || false;
            document.getElementById('adminCompactView').checked = adminSettings.compactView || false;
            document.getElementById('adminSessionWarning').checked = adminSettings.sessionWarning || false;
        }
    }

    saveAdminSettings() {
        const settings = {
            emailNotifications: document.getElementById('adminEmailNotifications').checked,
            smsNotifications: document.getElementById('adminSmsNotifications').checked,
            issueAlerts: document.getElementById('adminIssueAlerts').checked,
            userReports: document.getElementById('adminUserReports').checked,
            autoRefresh: document.getElementById('adminAutoRefresh').checked,
            darkMode: document.getElementById('adminDarkMode').checked,
            compactView: document.getElementById('adminCompactView').checked,
            sessionWarning: document.getElementById('adminSessionWarning').checked
        };

        localStorage.setItem('adminSettings', JSON.stringify(settings));
        this.showToast('Settings saved successfully!', 'success');
    }

    exportData() {
        const data = {
            users: this.users,
            issues: this.issues,
            categories: this.categories,
            auditLogs: this.auditLogs,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `samadhan-kendra-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showToast('Data exported successfully!', 'success');
    }

    backupSystem() {
        this.showToast('System backup initiated. This may take a few minutes.', 'info');
        // Simulate backup process
        setTimeout(() => {
            this.showToast('System backup completed successfully!', 'success');
        }, 3000);
    }

    clearCache() {
        // Clear local storage except for admin session
        const adminToken = localStorage.getItem('adminToken');
        const adminUser = localStorage.getItem('adminUser');
        const adminSessionTime = localStorage.getItem('adminSessionTime');
        
        localStorage.clear();
        
        // Restore admin session
        if (adminToken) localStorage.setItem('adminToken', adminToken);
        if (adminUser) localStorage.setItem('adminUser', adminUser);
        if (adminSessionTime) localStorage.setItem('adminSessionTime', adminSessionTime);
        
        this.showToast('Cache cleared successfully!', 'success');
    }

    // Enhanced Issue Management
    updateStatusTimeline(status) {
        const steps = document.querySelectorAll('.status-step');
        const statusOrder = ['reported', 'investigating', 'in-progress', 'resolved'];
        const currentIndex = statusOrder.indexOf(status);

        steps.forEach((step, index) => {
            step.classList.remove('active', 'completed');
            if (index < currentIndex) {
                step.classList.add('completed');
            } else if (index === currentIndex) {
                step.classList.add('active');
            }
        });
    }

    editIssue(issueId) {
        const issue = this.issues.find(i => i.id === issueId);
        if (!issue) return;

        // Store the current editing issue ID
        this.currentEditingIssueId = issueId;

        // Populate category dropdown
        const categorySelect = document.getElementById('editIssueCategory');
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });

        document.getElementById('editIssueTitle').value = issue.title;
        document.getElementById('editIssueStatus').value = issue.status;
        document.getElementById('editIssueCategory').value = issue.type;
        document.getElementById('editIssuePriority').value = issue.priority;
        document.getElementById('editIssueDescription').value = issue.description;
        document.getElementById('editIssueNotes').value = issue.adminNotes || '';
        document.getElementById('editIssueAssignee').value = issue.assignee || '';

        // Update status timeline
        this.updateStatusTimeline(issue.status);

        document.getElementById('editIssueModal').style.display = 'block';
    }

    saveIssueChanges() {
        const title = document.getElementById('editIssueTitle').value;
        const status = document.getElementById('editIssueStatus').value;
        const category = document.getElementById('editIssueCategory').value;
        const priority = document.getElementById('editIssuePriority').value;
        const description = document.getElementById('editIssueDescription').value;
        const notes = document.getElementById('editIssueNotes').value;
        const assignee = document.getElementById('editIssueAssignee').value;

        if (!title || !status || !category || !priority || !description) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        // Update the issue in the data
        const issueId = this.currentEditingIssueId;
        const issue = this.issues.find(i => i.id === issueId);
        if (issue) {
            issue.title = title;
            issue.status = status;
            issue.type = category;
            issue.priority = priority;
            issue.description = description;
            issue.adminNotes = notes;
            issue.assignee = assignee;
            issue.lastUpdated = new Date().toISOString();
        }

        this.closeAllModals();
        this.displayIssues();
        this.updateDashboardStats();
        this.showToast('Issue updated successfully!', 'success');
    }

    // Log admin actions
    logAdminAction(action, resource, details) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            adminUser: this.currentUser?.name || 'Unknown',
            action: action,
            resource: resource,
            details: details,
            ipAddress: '127.0.0.1' // In production, get real IP
        };

        this.auditLogs.unshift(logEntry);
        
        // Keep only last 1000 entries
        if (this.auditLogs.length > 1000) {
            this.auditLogs = this.auditLogs.slice(0, 1000);
        }

        // Save to localStorage
        localStorage.setItem('adminAuditLogs', JSON.stringify(this.auditLogs));
    }

    // Enhanced user management functions
    resetUserPassword(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        if (confirm(`Reset password for ${user.name}? A temporary password will be generated.`)) {
            // Generate temporary password
            const tempPassword = 'Temp' + Math.random().toString(36).substring(2, 8) + '!';
            
            // Update user password in localStorage if it's a real user
            if (user.password) {
                const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
                const userIndex = storedUsers.findIndex(u => u.id === userId);
                if (userIndex !== -1) {
                    storedUsers[userIndex].password = tempPassword;
                    localStorage.setItem('users', JSON.stringify(storedUsers));
                }
            }

            // Update admin users array
            user.password = tempPassword;
            
            this.showToast(`Password reset for ${user.name}. Temporary password: ${tempPassword}`, 'success');
            this.displayUsers();
        }
    }

    changeUserRole(userId, newRole) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        if (confirm(`Change ${user.name}'s role from ${this.getRoleLabel(user.role)} to ${this.getRoleLabel(newRole)}?`)) {
            user.role = newRole;
            
            // Update in localStorage if this is a real user
            this.updateUserInStorage(user);
            
            this.displayUsers();
            this.showToast(`Role updated for ${user.name}`, 'success');
        }
    }

    bulkUserActions() {
        const selectedUsers = Array.from(document.querySelectorAll('input[name="userSelect"]:checked'))
            .map(checkbox => checkbox.value);
        
        if (selectedUsers.length === 0) {
            this.showToast('Please select users to perform bulk actions', 'warning');
            return;
        }

        const action = prompt('Choose action: suspend, activate, delete, or change-role');
        if (!action) return;

        switch (action) {
            case 'suspend':
                selectedUsers.forEach(id => this.suspendUser(id));
                break;
            case 'activate':
                selectedUsers.forEach(id => this.activateUser(id));
                break;
            case 'delete':
                selectedUsers.forEach(id => this.deleteUser(id));
                break;
            case 'change-role':
                const newRole = prompt('Enter new role (user, moderator, admin):');
                if (newRole && ['user', 'moderator', 'admin'].includes(newRole)) {
                    selectedUsers.forEach(id => this.changeUserRole(id, newRole));
                }
                break;
            default:
                this.showToast('Invalid action selected', 'error');
        }
    }

    exportUserData() {
        const userData = this.users.map(user => ({
            ID: user.id,
            Name: user.name,
            Email: user.email,
            Phone: user.phone,
            City: this.getCityLabel(user.city),
            Role: this.getRoleLabel(user.role),
            Status: this.getStatusLabel(user.status),
            Points: user.points,
            Issues_Reported: user.issuesReported,
            Joined: user.joined
        }));

        const csvContent = 'data:text/csv;charset=utf-8,' 
            + Object.keys(userData[0]).join(',') + '\n'
            + userData.map(row => Object.values(row).join(',')).join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'users_export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showToast('User data exported successfully', 'success');
    }

    // Enhanced search and filtering
    advancedUserSearch(query, filters = {}) {
        let results = [...this.users];

        // Text search
        if (query) {
            const searchTerm = query.toLowerCase();
            results = results.filter(user => 
                user.name.toLowerCase().includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm) ||
                this.getCityLabel(user.city).toLowerCase().includes(searchTerm) ||
                user.phone.includes(searchTerm)
            );
        }

        // Apply filters
        if (filters.status && filters.status !== 'all') {
            results = results.filter(user => user.status === filters.status);
        }

        if (filters.role && filters.role !== 'all') {
            results = results.filter(user => user.role === filters.role);
        }

        if (filters.city && filters.city !== 'all') {
            results = results.filter(user => user.city === filters.city);
        }

        if (filters.minPoints) {
            results = results.filter(user => user.points >= filters.minPoints);
        }

        if (filters.maxPoints) {
            results = results.filter(user => user.points <= filters.maxPoints);
        }

        if (filters.dateFrom) {
            results = results.filter(user => new Date(user.joined) >= new Date(filters.dateFrom));
        }

        if (filters.dateTo) {
            results = results.filter(user => new Date(user.joined) <= new Date(filters.dateTo));
        }

        return results;
    }

    // User analytics and insights
    getUserAnalytics() {
        const analytics = {
            totalUsers: this.users.length,
            activeUsers: this.users.filter(u => u.status === 'active').length,
            suspendedUsers: this.users.filter(u => u.status === 'suspended').length,
            newUsersThisMonth: this.users.filter(u => {
                const joinDate = new Date(u.joined);
                const currentDate = new Date();
                return joinDate.getMonth() === currentDate.getMonth() && 
                       joinDate.getFullYear() === currentDate.getFullYear();
            }).length,
            topContributors: this.users.filter(u => u.issuesReported >= 10).length,
            roleDistribution: {
                user: this.users.filter(u => u.role === 'user').length,
                moderator: this.users.filter(u => u.role === 'moderator').length,
                admin: this.users.filter(u => u.role === 'admin').length
            },
            cityDistribution: {},
            averagePoints: Math.round(this.users.reduce((sum, u) => sum + u.points, 0) / this.users.length)
        };

        // Calculate city distribution
        this.users.forEach(user => {
            const city = this.getCityLabel(user.city);
            analytics.cityDistribution[city] = (analytics.cityDistribution[city] || 0) + 1;
        });

        return analytics;
    }

    // Security and access control
    checkAdminAccess() {
        const adminToken = localStorage.getItem('adminToken');
        const adminUser = localStorage.getItem('adminUser');
        
        if (!adminToken || !adminUser) {
            this.showToast('Access denied. Admin authentication required.', 'error');
            setTimeout(() => {
                window.location.href = 'admin-login.html';
            }, 2000);
            return false;
        }
        return true;
    }

    // Enhanced modal management
    showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeAllModals() {
        document.querySelectorAll('.admin-modal').forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = 'auto';
    }
}

// Profile Dropdown Toggle
function toggleAdminProfileMenu() {
    const dropdown = document.getElementById('adminProfileDropdown');
    dropdown.classList.toggle('active');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('adminProfileDropdown');
    const avatar = document.querySelector('.admin-user-avatar');
    
    if (!avatar.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.classList.remove('active');
    }
});

// Global Functions for HTML onclick handlers
function showAddUserModal() {
    adminPanel.showAddUserModal();
}

function showAddCategoryModal() {
    adminPanel.showAddCategoryModal();
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function addNewUser() {
    adminPanel.addNewUser();
}

function addNewCategory() {
    adminPanel.addNewCategory();
}

function saveIssueChanges() {
    adminPanel.saveIssueChanges();
}

function saveSettings() {
    adminPanel.saveSettings();
}

function showAdminProfile() {
    adminPanel.switchTab('profile');
}

function showAdminSettings() {
    adminPanel.switchTab('settings');
}

// Global logout function for backward compatibility
function adminLogout() {
    if (adminPanel) {
        adminPanel.showLogoutConfirmation();
    } else {
        // Fallback logout
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            localStorage.removeItem('adminSessionTime');
            window.location.href = 'index.html';
        }
    }
}

// Initialize Admin Panel when DOM is loaded
let adminPanel;
document.addEventListener('DOMContentLoaded', function() {
    adminPanel = new AdminPanel();
});
