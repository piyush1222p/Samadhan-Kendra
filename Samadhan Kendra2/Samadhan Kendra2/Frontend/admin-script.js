// Admin Panel JavaScript (hardened + completed helpers)
// - Defensive DOM access to avoid runtime errors on missing elements
// - Added missing helpers (getRoleLabel, getStatusLabel, suspendUser, activateUser, updateUserInStorage)
// - De-duplicated methods (editIssue/saveIssueChanges/closeAllModals only once)
// - LocalStorage persistence for users/issues/categories/audit logs
// - Chart.js guards + instance cleanup between renders
// - Session handling + activity keep-alive + timeout warning
// - Safe global bindings for HTML onclick compatibility

class AdminPanel {
  constructor() {
    this.currentUser = null;
    this.users = [];
    this.issues = [];
    this.categories = [];
    this.auditLogs = [];

    // Chart instances to avoid overlay when re-rendering
    this._categoryChart = null;
    this._trendChart = null;

    // Track current editing issue ID
    this.currentEditingIssueId = null;

    this.init();
  }

  init() {
    if (!this.checkAuth()) return;
    this.loadData();
    this.setupEventListeners();
    this.displayDashboard();
  }

  // -------------------- Auth --------------------
  checkAuth() {
    const adminToken = localStorage.getItem('adminToken');
    const adminUser = localStorage.getItem('adminUser');
    const sessionTime = localStorage.getItem('adminSessionTime');

    if (!adminToken || !adminUser) {
      this.redirectToLogin();
      return false;
    }

    // Check session timeout (8 hours)
    const sessionTimeout = 8 * 60 * 60 * 1000;
    const currentTime = Date.now();
    const sessionStartTime = parseInt(sessionTime || `${currentTime}`, 10);

    if (currentTime - sessionStartTime > sessionTimeout) {
      this.showToast('Session expired. Please login again.', 'error');
      this.clearSession();
      this.redirectToLogin();
      return false;
    }

    // Extend session
    localStorage.setItem('adminSessionTime', `${currentTime}`);

    try {
      this.currentUser = JSON.parse(adminUser);
      const nameEl = document.getElementById('adminUserName');
      if (nameEl) nameEl.textContent = this.currentUser?.name || 'Administrator';
    } catch (error) {
      console.error('Error parsing admin user data:', error);
      this.redirectToLogin();
      return false;
    }
    return true;
  }

  redirectToLogin() {
    window.location.href = 'admin-login.html';
  }

  clearSession() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminSessionTime');
  }

  // -------------------- Data --------------------
  loadData() {
    // Load persisted data first
    try {
      const storedUsers = JSON.parse(localStorage.getItem('adminUsers') || '[]');
      const storedIssues = JSON.parse(localStorage.getItem('adminIssues') || '[]');
      const storedCategories = JSON.parse(localStorage.getItem('adminCategories') || '[]');
      const storedAuditLogs = JSON.parse(localStorage.getItem('adminAuditLogs') || '[]');

      this.users = storedUsers.length ? storedUsers : [
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

      this.issues = storedIssues.length
        ? storedIssues
        : (window.sampleIssues || [
            {
              id: 'SK-001',
              type: 'road',
              priority: 'high',
              title: 'Large pothole on Andheri West Road',
              description:
                'There is a significant pothole on Andheri West Road near the Metro station.',
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
              description:
                'Garbage bins are overflowing and not being collected regularly.',
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
              description:
                'No water supply in the entire building for the past 24 hours.',
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
              description:
                'Street lights on the main road are not functioning properly.',
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
              description:
                'Several tiles on the footpath are broken and pose a safety hazard.',
              address: 'Colaba',
              city: 'mumbai',
              status: 'reported',
              reportedDate: '2024-01-17',
              contact: 'vikram.singh@email.com',
              upvotes: 6
            }
          ]);

      this.categories = storedCategories.length
        ? storedCategories
        : [
            {
              id: 'garbage',
              name: 'Garbage & Waste',
              icon: '🗑️',
              description: 'Waste management and cleanliness issues',
              defaultPriority: 'medium'
            },
            {
              id: 'road',
              name: 'Road & Infrastructure',
              icon: '🚧',
              description: 'Roads, bridges, and infrastructure problems',
              defaultPriority: 'high'
            },
            {
              id: 'water',
              name: 'Water Supply',
              icon: '💧',
              description: 'Water supply and drainage issues',
              defaultPriority: 'high'
            },
            {
              id: 'electricity',
              name: 'Electricity',
              icon: '⚡',
              description: 'Power supply and electrical problems',
              defaultPriority: 'urgent'
            }
          ];

      this.auditLogs = storedAuditLogs.length
        ? storedAuditLogs
        : [
            {
              timestamp: '2024-01-20T14:30:00.000Z',
              adminUser: 'Administrator',
              action: 'create',
              resource: 'User',
              details: 'Created new user: Priya Sharma',
              ipAddress: '192.168.1.100'
            }
          ];
    } catch (e) {
      console.warn('Failed parsing stored admin data. Using defaults.', e);
    }

    // Persist initial state (ensures keys exist)
    this._persistAll();
  }

  _persistAll() {
    localStorage.setItem('adminUsers', JSON.stringify(this.users));
    localStorage.setItem('adminIssues', JSON.stringify(this.issues));
    localStorage.setItem('adminCategories', JSON.stringify(this.categories));
    localStorage.setItem('adminAuditLogs', JSON.stringify(this.auditLogs));
  }

  _persistUsers() {
    localStorage.setItem('adminUsers', JSON.stringify(this.users));
  }

  _persistIssues() {
    localStorage.setItem('adminIssues', JSON.stringify(this.issues));
  }

  _persistCategories() {
    localStorage.setItem('adminCategories', JSON.stringify(this.categories));
  }

  // -------------------- Events --------------------
  setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.sidebar-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = item.dataset.tab;
        if (tab) this.switchTab(tab);
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
    if (!sessionTime) return;
    const sessionStartTime = parseInt(sessionTime, 10);
    const warningTime = 7.5 * 60 * 60 * 1000; // 7.5 hours
    const elapsed = Date.now() - sessionStartTime;
    const timeUntilWarning = warningTime - elapsed;

    if (timeUntilWarning > 0) {
      setTimeout(() => this.showSessionWarning(), timeUntilWarning);
    } else {
      // Already past warning; show immediately
      this.showSessionWarning();
    }
  }

  setupActivityMonitoring() {
    const activities = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    const handler = () => this.extendSession();
    activities.forEach((a) =>
      document.addEventListener(a, handler, { passive: true })
    );
  }

  extendSession() {
    const currentTime = Date.now();
    localStorage.setItem('adminSessionTime', `${currentTime}`);
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
    setTimeout(() => (window.location.href = 'admin-login.html'), 1000);
  }

  setupSearchAndFilters() {
    const userSearch = document.getElementById('userSearch');
    if (userSearch) userSearch.addEventListener('input', () => this.filterUsers());

    const issueSearch = document.getElementById('issueSearch');
    if (issueSearch) issueSearch.addEventListener('input', () => this.filterIssues());
  }

  setupSettingsListeners() {
    const settingToggles = [
      'adminEmailNotifications',
      'adminSmsNotifications',
      'adminIssueAlerts',
      'adminUserReports',
      'adminAutoRefresh',
      'adminDarkMode',
      'adminCompactView',
      'adminSessionWarning'
    ];
    settingToggles.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', () => this.saveAdminSettings());
    });
  }

  // -------------------- Tabs and Dashboard --------------------
  switchTab(tabName) {
    document.querySelectorAll('.admin-tab').forEach((tab) => tab.classList.remove('active'));
    document.querySelectorAll('.sidebar-item').forEach((item) => item.classList.remove('active'));

    const tabEl = document.getElementById(tabName);
    const itemEl = document.querySelector(`[data-tab="${tabName}"]`);
    if (tabEl) tabEl.classList.add('active');
    if (itemEl) itemEl.classList.add('active');

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
      default:
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
    const resolvedIssues = this.issues.filter((i) => i.status === 'resolved').length;
    const pendingIssues = totalIssues - resolvedIssues;

    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val.toLocaleString();
    };

    setText('totalUsers', totalUsers);
    setText('totalIssues', totalIssues);
    setText('resolvedIssues', resolvedIssues);
    setText('pendingIssues', pendingIssues);
  }

  displayRecentActivity() {
    const activityList = document.getElementById('recentActivityList');
    if (!activityList) return;

    const recentActivities = this.auditLogs.slice(0, 5);

    activityList.innerHTML = recentActivities
      .map(
        (activity) => `
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
    `
      )
      .join('');
  }

  // -------------------- Users --------------------
  displayUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    tbody.innerHTML = this.users
      .map(
        (user) => `
      <tr>
        <td>${user.id}</td>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${this.getCityLabel(user.city)}</td>
        <td><span class="role-badge role-${user.role}">${this.getRoleLabel(user.role)}</span></td>
        <td><span class="status-badge status-${user.status}">${this.getStatusLabel(user.status)}</span></td>
        <td>${Number(user.points || 0).toLocaleString()}</td>
        <td>${this.formatDate(user.joined)}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-edit" title="Edit" onclick="adminPanel.editUser('${user.id}')"><i class="fas fa-edit"></i></button>
            <button class="btn-delete" title="Delete" onclick="adminPanel.deleteUser('${user.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `
      )
      .join('');
  }

  filterUsers() {
    const input = document.getElementById('userSearch');
    const searchTerm = (input?.value || '').toLowerCase();
    const filtered = this.users.filter(
      (u) => u.name.toLowerCase().includes(searchTerm) || u.email.toLowerCase().includes(searchTerm)
    );
    this.displayFilteredUsers(filtered);
  }

  displayFilteredUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    tbody.innerHTML = users
      .map(
        (user) => `
      <tr>
        <td>${user.id}</td>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${this.getCityLabel(user.city)}</td>
        <td><span class="role-badge role-${user.role}">${this.getRoleLabel(user.role)}</span></td>
        <td><span class="status-badge status-${user.status}">${this.getStatusLabel(user.status)}</span></td>
        <td>${Number(user.points || 0).toLocaleString()}</td>
        <td>${this.formatDate(user.joined)}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-edit" title="Edit" onclick="adminPanel.editUser('${user.id}')"><i class="fas fa-edit"></i></button>
            <button class="btn-delete" title="Delete" onclick="adminPanel.deleteUser('${user.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `
      )
      .join('');
  }

  editUser(userId) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return;
    this.showToast(`Editing user: ${user.name}`, 'info');
    this.logAdminAction('edit', 'User', `Editing user ${user.name} (${user.id})`);
  }

  deleteUser(userId) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return;
    if (!confirm(`Delete user ${user.name}?`)) return;

    this.users = this.users.filter((u) => u.id !== userId);
    this._persistUsers();
    this.displayUsers();
    this.updateDashboardStats();
    this.showToast(`User ${user.name} has been deleted`, 'success');
    this.logAdminAction('delete', 'User', `Deleted user ${user.name} (${user.id})`);
  }

  // Enhanced user helpers
  getRoleLabel(role) {
    const map = { user: 'User', moderator: 'Moderator', admin: 'Admin' };
    return map[role] || role || 'User';
  }

  getStatusLabel(status) {
    const map = { active: 'Active', suspended: 'Suspended', pending: 'Pending' };
    return map[status] || status || 'Active';
  }

  updateUserInStorage(user) {
    try {
      const arr = JSON.parse(localStorage.getItem('adminUsers') || '[]');
      const idx = arr.findIndex((u) => u.id === user.id);
      if (idx !== -1) {
        arr[idx] = user;
        localStorage.setItem('adminUsers', JSON.stringify(arr));
      }
    } catch {}
  }

  suspendUser(userId) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return;
    user.status = 'suspended';
    this._persistUsers();
    this.displayUsers();
    this.updateDashboardStats();
    this.showToast(`User ${user.name} suspended`, 'success');
    this.logAdminAction('update', 'User', `Suspended user ${user.name} (${user.id})`);
  }

  activateUser(userId) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return;
    user.status = 'active';
    this._persistUsers();
    this.displayUsers();
    this.updateDashboardStats();
    this.showToast(`User ${user.name} activated`, 'success');
    this.logAdminAction('update', 'User', `Activated user ${user.name} (${user.id})`);
  }

  changeUserRole(userId, newRole) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return;
    if (!confirm(`Change ${user.name}'s role from ${this.getRoleLabel(user.role)} to ${this.getRoleLabel(newRole)}?`))
      return;

    user.role = newRole;
    this.updateUserInStorage(user);
    this._persistUsers();
    this.displayUsers();
    this.showToast(`Role updated for ${user.name}`, 'success');
    this.logAdminAction('update', 'User', `Changed role for ${user.name} (${user.id}) to ${newRole}`);
  }

  bulkUserActions() {
    const selectedUsers = Array.from(
      document.querySelectorAll('input[name="userSelect"]:checked')
    ).map((cb) => cb.value);

    if (selectedUsers.length === 0) {
      this.showToast('Please select users to perform bulk actions', 'warning');
      return;
    }

    const action = prompt('Choose action: suspend, activate, delete, or change-role');
    if (!action) return;

    switch (action) {
      case 'suspend':
        selectedUsers.forEach((id) => this.suspendUser(id));
        break;
      case 'activate':
        selectedUsers.forEach((id) => this.activateUser(id));
        break;
      case 'delete':
        selectedUsers.forEach((id) => this.deleteUser(id));
        break;
      case 'change-role': {
        const newRole = prompt('Enter new role (user, moderator, admin):');
        if (newRole && ['user', 'moderator', 'admin'].includes(newRole)) {
          selectedUsers.forEach((id) => this.changeUserRole(id, newRole));
        } else {
          this.showToast('Invalid role', 'error');
        }
        break;
      }
      default:
        this.showToast('Invalid action selected', 'error');
    }
  }

  exportUserData() {
    if (!this.users.length) {
      this.showToast('No users to export', 'warning');
      return;
    }
    const userData = this.users.map((user) => ({
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

    // Simple CSV generation (note: no quote-escaping for commas)
    const header = Object.keys(userData[0]).join(',');
    const rows = userData.map((row) => Object.values(row).join(',')).join('\n');
    const csvContent = `data:text/csv;charset=utf-8,${header}\n${rows}`;

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'users_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showToast('User data exported successfully', 'success');
  }

  // -------------------- Issues --------------------
  displayIssues() {
    const tbody = document.getElementById('issuesTableBody');
    if (!tbody) return;

    tbody.innerHTML = this.issues
      .map(
        (issue) => `
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
            <button class="btn-edit" title="Edit" onclick="adminPanel.editIssue('${issue.id}')"><i class="fas fa-edit"></i></button>
            <button class="btn-delete" title="Delete" onclick="adminPanel.deleteIssue('${issue.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `
      )
      .join('');
  }

  filterIssues() {
    const input = document.getElementById('issueSearch');
    const searchTerm = (input?.value || '').toLowerCase();
    const filtered = this.issues.filter(
      (i) => i.title.toLowerCase().includes(searchTerm) || i.description.toLowerCase().includes(searchTerm)
    );
    this.displayFilteredIssues(filtered);
  }

  displayFilteredIssues(issues) {
    const tbody = document.getElementById('issuesTableBody');
    if (!tbody) return;

    tbody.innerHTML = issues
      .map(
        (issue) => `
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
            <button class="btn-edit" title="Edit" onclick="adminPanel.editIssue('${issue.id}')"><i class="fas fa-edit"></i></button>
            <button class="btn-delete" title="Delete" onclick="adminPanel.deleteIssue('${issue.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `
      )
      .join('');
  }

  // Enhanced Issue Editor (with timeline and assignee/notes)
  editIssue(issueId) {
    const issue = this.issues.find((i) => i.id === issueId);
    if (!issue) return;

    this.currentEditingIssueId = issueId;

    // Populate category dropdown
    const categorySelect = document.getElementById('editIssueCategory');
    if (categorySelect) {
      categorySelect.innerHTML = '<option value="">Select Category</option>';
      this.categories.forEach((category) => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
      });
    }

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val ?? '';
    };

    setVal('editIssueTitle', issue.title);
    setVal('editIssueStatus', issue.status);
    setVal('editIssueCategory', issue.type);
    setVal('editIssuePriority', issue.priority);
    setVal('editIssueDescription', issue.description);
    setVal('editIssueNotes', issue.adminNotes || '');
    setVal('editIssueAssignee', issue.assignee || '');

    // Update status timeline
    this.updateStatusTimeline(issue.status);

    const modal = document.getElementById('editIssueModal');
    if (modal) modal.style.display = 'block';
  }

  deleteIssue(issueId) {
    const issue = this.issues.find((i) => i.id === issueId);
    if (!issue) return;
    if (!confirm(`Delete issue "${issue.title}"?`)) return;

    this.issues = this.issues.filter((i) => i.id !== issueId);
    this._persistIssues();
    this.displayIssues();
    this.updateDashboardStats();
    this.showToast(`Issue "${issue.title}" has been deleted`, 'success');
    this.logAdminAction('delete', 'Issue', `Deleted issue ${issue.title} (${issue.id})`);
  }

  updateStatusTimeline(status) {
    const steps = document.querySelectorAll('.status-step');
    const statusOrder = ['reported', 'investigating', 'in-progress', 'resolved'];
    const currentIndex = statusOrder.indexOf(status);

    steps.forEach((step, index) => {
      step.classList.remove('active', 'completed');
      if (index < currentIndex) step.classList.add('completed');
      else if (index === currentIndex) step.classList.add('active');
    });
  }

  saveIssueChanges() {
    const title = document.getElementById('editIssueTitle')?.value;
    const status = document.getElementById('editIssueStatus')?.value;
    const category = document.getElementById('editIssueCategory')?.value;
    const priority = document.getElementById('editIssuePriority')?.value;
    const description = document.getElementById('editIssueDescription')?.value;
    const notes = document.getElementById('editIssueNotes')?.value;
    const assignee = document.getElementById('editIssueAssignee')?.value;

    if (!title || !status || !category || !priority || !description) {
      this.showToast('Please fill in all required fields', 'error');
      return;
    }

    const issueId = this.currentEditingIssueId;
    const issue = this.issues.find((i) => i.id === issueId);
    if (issue) {
      issue.title = title;
      issue.status = status;
      issue.type = category;
      issue.priority = priority;
      issue.description = description;
      issue.adminNotes = notes;
      issue.assignee = assignee;
      issue.lastUpdated = new Date().toISOString();

      this._persistIssues();
      this.logAdminAction('update', 'Issue', `Updated issue ${issue.title} (${issue.id})`);
    }

    this.closeAllModals();
    this.displayIssues();
    this.updateDashboardStats();
    this.showToast('Issue updated successfully!', 'success');
  }

  // -------------------- Categories --------------------
  displayCategories() {
    const grid = document.getElementById('categoriesGrid');
    if (!grid) return;

    grid.innerHTML = this.categories
      .map(
        (category) => `
      <div class="category-card">
        <div class="category-icon">${category.icon}</div>
        <div class="category-info">
          <h4>${category.name}</h4>
          <p>${category.description || ''}</p>
        </div>
        <div class="category-actions">
          <button class="btn-edit" title="Edit" onclick="adminPanel.editCategory('${category.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn-delete" title="Delete" onclick="adminPanel.deleteCategory('${category.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `
      )
      .join('');
  }

  editCategory(categoryId) {
    const category = this.categories.find((c) => c.id === categoryId);
    if (!category) return;
    this.showToast(`Editing category: ${category.name}`, 'info');
    this.logAdminAction('edit', 'Category', `Editing category ${category.name} (${category.id})`);
  }

  deleteCategory(categoryId) {
    const category = this.categories.find((c) => c.id === categoryId);
    if (!category) return;

    const issuesUsingCategory = this.issues.filter((i) => i.type === categoryId);
    if (issuesUsingCategory.length > 0) {
      this.showToast(`Cannot delete category: ${issuesUsingCategory.length} issues are using it`, 'error');
      return;
    }

    if (!confirm(`Delete category "${category.name}"?`)) return;

    this.categories = this.categories.filter((c) => c.id !== categoryId);
    this._persistCategories();
    this.displayCategories();
    this.showToast(`Category "${category.name}" has been deleted`, 'success');
    this.logAdminAction('delete', 'Category', `Deleted category ${category.name} (${category.id})`);
  }

  showAddUserModal() {
    const modal = document.getElementById('addUserModal');
    if (modal) modal.style.display = 'block';
  }

  showAddCategoryModal() {
    const modal = document.getElementById('addCategoryModal');
    if (modal) modal.style.display = 'block';
  }

  closeAllModals() {
    document.querySelectorAll('.admin-modal').forEach((m) => (m.style.display = 'none'));
    document.body.style.overflow = 'auto';
  }

  addNewUser() {
    const name = document.getElementById('newUserName')?.value?.trim();
    const email = document.getElementById('newUserEmail')?.value?.trim();
    const phone = document.getElementById('newUserPhone')?.value?.trim();
    const city = document.getElementById('newUserCity')?.value;
    const role = document.getElementById('newUserRole')?.value;
    const password = document.getElementById('newUserPassword')?.value;

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
    this._persistUsers();
    this.closeAllModals();
    this.displayUsers();
    this.updateDashboardStats();
    this.showToast(`User ${name} has been created successfully`, 'success');
    const form = document.getElementById('addUserForm');
    if (form) form.reset();

    this.logAdminAction('create', 'User', `Created user ${name} (${newUser.id})`);
  }

  addNewCategory() {
    const name = document.getElementById('newCategoryName')?.value?.trim();
    const icon = document.getElementById('newCategoryIcon')?.value?.trim() || '🏷️';
    const description = document.getElementById('newCategoryDescription')?.value?.trim();
    const defaultPriority = document.getElementById('newCategoryPriority')?.value;

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
    this._persistCategories();
    this.closeAllModals();
    this.displayCategories();
    this.showToast(`Category "${name}" has been created successfully`, 'success');
    const form = document.getElementById('addCategoryForm');
    if (form) form.reset();

    this.logAdminAction('create', 'Category', `Created category ${name} (${newCategory.id})`);
  }

  // -------------------- Settings --------------------
  saveSettings() {
    const emailNotifications = !!document.getElementById('emailNotifications')?.checked;
    const smsNotifications = !!document.getElementById('smsNotifications')?.checked;
    const autoAssignIssues = !!document.getElementById('autoAssignIssues')?.checked;
    const maintenanceMode = !!document.getElementById('maintenanceMode')?.checked;

    localStorage.setItem(
      'adminSettings',
      JSON.stringify({
        emailNotifications,
        smsNotifications,
        autoAssignIssues,
        maintenanceMode
      })
    );

    this.showToast('Settings saved successfully', 'success');
  }

  displaySettings() {
    this.loadAdminSettings();
  }

  loadAdminSettings() {
    const settings = localStorage.getItem('adminSettings');
    if (!settings) return;
    try {
      const s = JSON.parse(settings);
      const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.checked = !!val;
      };
      set('adminEmailNotifications', s.emailNotifications);
      set('adminSmsNotifications', s.smsNotifications);
      set('adminIssueAlerts', s.issueAlerts);
      set('adminUserReports', s.userReports);
      set('adminAutoRefresh', s.autoRefresh);
      set('adminDarkMode', s.darkMode);
      set('adminCompactView', s.compactView);
      set('adminSessionWarning', s.sessionWarning);
    } catch {}
  }

  saveAdminSettings() {
    const s = {
      emailNotifications: !!document.getElementById('adminEmailNotifications')?.checked,
      smsNotifications: !!document.getElementById('adminSmsNotifications')?.checked,
      issueAlerts: !!document.getElementById('adminIssueAlerts')?.checked,
      userReports: !!document.getElementById('adminUserReports')?.checked,
      autoRefresh: !!document.getElementById('adminAutoRefresh')?.checked,
      darkMode: !!document.getElementById('adminDarkMode')?.checked,
      compactView: !!document.getElementById('adminCompactView')?.checked,
      sessionWarning: !!document.getElementById('adminSessionWarning')?.checked
    };
    localStorage.setItem('adminSettings', JSON.stringify(s));
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
    setTimeout(() => {
      this.showToast('System backup completed successfully!', 'success');
    }, 3000);
  }

  clearCache() {
    const adminToken = localStorage.getItem('adminToken');
    const adminUser = localStorage.getItem('adminUser');
    const adminSessionTime = localStorage.getItem('adminSessionTime');

    localStorage.clear();

    if (adminToken) localStorage.setItem('adminToken', adminToken);
    if (adminUser) localStorage.setItem('adminUser', adminUser);
    if (adminSessionTime) localStorage.setItem('adminSessionTime', adminSessionTime);

    this.showToast('Cache cleared successfully!', 'success');
  }

  // -------------------- Charts --------------------
  createCategoryChart() {
    const canvas = document.getElementById('categoryChart');
    if (!canvas || typeof Chart === 'undefined') return;

    // Cleanup
    if (this._categoryChart) {
      try {
        this._categoryChart.destroy();
      } catch {}
      this._categoryChart = null;
    }

    const categoryCounts = {};
    this.issues.forEach((issue) => {
      categoryCounts[issue.type] = (categoryCounts[issue.type] || 0) + 1;
    });

    const labels = Object.keys(categoryCounts).map((type) => this.getIssueTypeLabel(type));
    const data = Object.values(categoryCounts);
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'];

    this._categoryChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors.slice(0, data.length),
            borderWidth: 2,
            borderColor: '#ffffff'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 20, usePointStyle: true, font: { size: 12 } }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total ? ((context.parsed / total) * 100).toFixed(1) : '0.0';
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  createTrendChart() {
    const canvas = document.getElementById('trendChart');
    if (!canvas || typeof Chart === 'undefined') return;

    if (this._trendChart) {
      try {
        this._trendChart.destroy();
      } catch {}
      this._trendChart = null;
    }

    const months = [];
    const reportedData = [];
    const resolvedData = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(date.toLocaleDateString('en-US', { month: 'short' }));
      reportedData.push(Math.floor(Math.random() * 50) + 20);
      resolvedData.push(Math.floor(Math.random() * 40) + 15);
    }

    this._trendChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Issues Reported',
            data: reportedData,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          },
          {
            label: 'Issues Resolved',
            data: resolvedData,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { usePointStyle: true, font: { size: 12 } } }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.1)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // -------------------- Audit Logs --------------------
  displayAuditLogs() {
    const tbody = document.getElementById('auditTableBody');
    if (!tbody) return;

    tbody.innerHTML = this.auditLogs
      .map(
        (log) => `
      <tr>
        <td>${this.formatTime(log.timestamp)}</td>
        <td>${log.adminUser}</td>
        <td>${log.action.charAt(0).toUpperCase() + log.action.slice(1)}</td>
        <td>${log.resource}</td>
        <td>${log.details}</td>
        <td>${log.ipAddress}</td>
      </tr>
    `
      )
      .join('');
  }

  logAdminAction(action, resource, details) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      adminUser: this.currentUser?.name || 'Unknown',
      action,
      resource,
      details,
      ipAddress: '127.0.0.1'
    };
    this.auditLogs.unshift(logEntry);
    if (this.auditLogs.length > 1000) this.auditLogs = this.auditLogs.slice(0, 1000);
    localStorage.setItem('adminAuditLogs', JSON.stringify(this.auditLogs));
  }

  // -------------------- Profile --------------------
  displayProfile() {
    this.loadAdminProfile();
  }

  loadAdminProfile() {
    const adminProfile = localStorage.getItem('adminProfile');
    if (!adminProfile) return;
    try {
      const p = JSON.parse(adminProfile);
      const setVal = (id, val, fallback = '') => {
        const el = document.getElementById(id);
        if (el) el.value = val ?? fallback;
      };
      setVal('adminFullName', p.name, 'Administrator');
      setVal('adminEmail', p.email, 'admin@samadhankendra.com');
      setVal('adminPhone', p.phone, '+91 98765 43210');
      setVal('adminDepartment', p.department, 'IT Administration');
      setVal('adminBio', p.bio, 'Experienced administrator with expertise in civic issue management and system administration.');
    } catch {}
  }

  updateProfile() {
    const profile = {
      name: document.getElementById('adminFullName')?.value,
      email: document.getElementById('adminEmail')?.value,
      phone: document.getElementById('adminPhone')?.value,
      department: document.getElementById('adminDepartment')?.value,
      bio: document.getElementById('adminBio')?.value
    };
    localStorage.setItem('adminProfile', JSON.stringify(profile));
    this.showToast('Profile updated successfully!', 'success');
  }

  changePassword() {
    const currentPassword = document.getElementById('currentPassword')?.value;
    const newPassword = document.getElementById('newPassword')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;

    if (!currentPassword || !newPassword || !confirmPassword) {
      this.showToast('Please fill in all password fields', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      this.showToast('New passwords do not match', 'error');
      return;
    }
    if ((newPassword || '').length < 8) {
      this.showToast('Password must be at least 8 characters long', 'error');
      return;
    }

    // In production, validate with backend
    this.showToast('Password changed successfully!', 'success');
    const form = document.getElementById('adminPasswordForm');
    if (form) form.reset();
  }

  // -------------------- Misc --------------------
  getCityLabel(city) {
    const map = {
      mumbai: 'Mumbai, Maharashtra',
      delhi: 'Delhi, NCR',
      bangalore: 'Bangalore, Karnataka',
      hyderabad: 'Hyderabad, Telangana',
      chennai: 'Chennai, Tamil Nadu',
      kolkata: 'Kolkata, West Bengal',
      pune: 'Pune, Maharashtra',
      ahmedabad: 'Ahmedabad, Gujarat',
      jaipur: 'Jaipur, Rajasthan',
      lucknow: 'Lucknow, Uttar Pradesh'
    };
    return map[city] || city || '';
  }

  getIssueTypeLabel(type) {
    const map = {
      garbage: '🗑️ Garbage & Waste',
      road: '🚧 Road & Infrastructure',
      water: '💧 Water Supply',
      electricity: '⚡ Electricity',
      safety: '🛡️ Safety & Security',
      transport: '🚌 Public Transport',
      parks: '🌳 Parks & Recreation',
      noise: '🔊 Noise Pollution',
      air: '🌬️ Air Quality',
      other: '❓ Other'
    };
    return map[type] || type || '';
  }

  formatDate(dateString) {
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString || '';
      return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString || '';
    }
  }

  formatTime(timestamp) {
    try {
      const d = new Date(timestamp);
      if (isNaN(d.getTime())) return timestamp || '';
      return d.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timestamp || '';
    }
  }

  showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) {
      // Fallback simple alert if toast element is not present
      console[type === 'error' ? 'error' : 'log'](message);
      return;
    }
    const toastMessage = toast.querySelector('.toast-message') || toast;
    const toastIcon = toast.querySelector('.toast-icon');

    toastMessage.textContent = message;

    if (type === 'error') {
      toast.classList.add('error');
      if (toastIcon) toastIcon.className = 'toast-icon fas fa-exclamation-circle';
    } else if (type === 'warning') {
      toast.classList.remove('error');
      if (toastIcon) toastIcon.className = 'toast-icon fas fa-exclamation-triangle';
    } else if (type === 'info') {
      toast.classList.remove('error');
      if (toastIcon) toastIcon.className = 'toast-icon fas fa-info-circle';
    } else {
      toast.classList.remove('error');
      if (toastIcon) toastIcon.className = 'toast-icon fas fa-check-circle';
    }

    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  // Admin logout UX
  adminLogout() {
    const confirmed = confirm('Are you sure you want to logout from the admin panel?');
    if (confirmed) {
      this.clearSession();
      this.showToast('Successfully logged out!', 'success');
      setTimeout(() => (window.location.href = 'index.html'), 1000);
    }
  }

  showLogoutConfirmation() {
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
    this.showToast('Successfully logged out! Redirecting...', 'success');
    const modal = document.querySelector('.admin-modal');
    if (modal) modal.remove();
    setTimeout(() => (window.location.href = 'index.html'), 1500);
  }

  // Analytics
  getUserAnalytics() {
    const analytics = {
      totalUsers: this.users.length,
      activeUsers: this.users.filter((u) => u.status === 'active').length,
      suspendedUsers: this.users.filter((u) => u.status === 'suspended').length,
      newUsersThisMonth: this.users.filter((u) => {
        const joinDate = new Date(u.joined);
        const now = new Date();
        return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
      }).length,
      topContributors: this.users.filter((u) => (u.issuesReported || 0) >= 10).length,
      roleDistribution: {
        user: this.users.filter((u) => u.role === 'user').length,
        moderator: this.users.filter((u) => u.role === 'moderator').length,
        admin: this.users.filter((u) => u.role === 'admin').length
      },
      cityDistribution: {},
      averagePoints: this.users.length
        ? Math.round(this.users.reduce((sum, u) => sum + (u.points || 0), 0) / this.users.length)
        : 0
    };

    this.users.forEach((user) => {
      const city = this.getCityLabel(user.city);
      analytics.cityDistribution[city] = (analytics.cityDistribution[city] || 0) + 1;
    });

    return analytics;
  }

  // Access control check
  checkAdminAccess() {
    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUser');
    if (!token || !user) {
      this.showToast('Access denied. Admin authentication required.', 'error');
      setTimeout(() => (window.location.href = 'admin-login.html'), 2000);
      return false;
    }
    return true;
  }

  // Modal helpers
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }
  }
}

// -------------------- Admin Profile Dropdown --------------------
function toggleAdminProfileMenu() {
  const dropdown = document.getElementById('adminProfileDropdown');
  if (dropdown) dropdown.classList.toggle('active');
}
window.toggleAdminProfileMenu = window.toggleAdminProfileMenu || toggleAdminProfileMenu;

document.addEventListener('click', function (event) {
  const dropdown = document.getElementById('adminProfileDropdown');
  const avatar = document.querySelector('.admin-user-avatar');
  if (dropdown && avatar && !avatar.contains(event.target) && !dropdown.contains(event.target)) {
    dropdown.classList.remove('active');
  }
});

// -------------------- Global Functions for HTML handlers --------------------
function showAddUserModal() {
  if (window.adminPanel) adminPanel.showAddUserModal();
}
function showAddCategoryModal() {
  if (window.adminPanel) adminPanel.showAddCategoryModal();
}
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = 'none';
}
function addNewUser() {
  if (window.adminPanel) adminPanel.addNewUser();
}
function addNewCategory() {
  if (window.adminPanel) adminPanel.addNewCategory();
}
function saveIssueChanges() {
  if (window.adminPanel) adminPanel.saveIssueChanges();
}
function saveSettings() {
  if (window.adminPanel) adminPanel.saveSettings();
}
function showAdminProfile() {
  if (window.adminPanel) adminPanel.switchTab('profile');
}
function showAdminSettings() {
  if (window.adminPanel) adminPanel.switchTab('settings');
}
function adminLogout() {
  if (window.adminPanel) adminPanel.showLogoutConfirmation();
  else {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      localStorage.removeItem('adminSessionTime');
      window.location.href = 'index.html';
    }
  }
}

// -------------------- Initialize --------------------
let adminPanel;
document.addEventListener('DOMContentLoaded', function () {
  window.adminPanel = adminPanel = new AdminPanel();
});