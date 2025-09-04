// Samadhan Kendra - Shared Frontend Script (hardened)
// Notes:
// - All DOM access is defensive (checks for element existence).
// - Centralized points helpers are consistent across pages.
// - Avoids duplicate function names and global collisions by exposing only needed APIs on window.

(() => {
  // -------------------- Mobile Navigation Toggle --------------------
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');

  if (hamburger && navMenu) {
    const toggleMenu = () => {
      const active = hamburger.classList.toggle('active');
      navMenu.classList.toggle('active', active);
      try { hamburger.setAttribute('aria-expanded', active ? 'true' : 'false'); } catch {}
    };
    hamburger.addEventListener('click', toggleMenu);
    hamburger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleMenu();
      }
    });
  }

  // Close mobile menu when clicking on a nav-link and handle smooth anchor links
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      if (hamburger) hamburger.classList.remove('active');
      if (navMenu) navMenu.classList.remove('active');

      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          const offsetTop = (target.getBoundingClientRect().top + window.scrollY) - 100;
          window.scrollTo({ top: offsetTop, behavior: 'smooth' });
        }
      }
    });
  });

  // -------------------- Profile Dropdown Toggle --------------------
  function toggleProfileMenu() {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) dropdown.classList.toggle('active');
  }
  window.toggleProfileMenu = window.toggleProfileMenu || toggleProfileMenu;

  // Close dropdown when clicking outside
  document.addEventListener('click', function (event) {
    const dropdown = document.getElementById('profileDropdown');
    const avatar = document.querySelector('.user-avatar');
    if (avatar && dropdown && !avatar.contains(event.target) && !dropdown.contains(event.target)) {
      dropdown.classList.remove('active');
    }
  });

  // -------------------- Centralized Points Management --------------------
  function isLoggedIn() {
    return !!localStorage.getItem('accessToken') || localStorage.getItem('userLoggedIn') === 'true';
  }

  function updateNavigationForLoginStatus() {
    const profileDropdown = document.getElementById('profileDropdown');
    if (!profileDropdown) return;
    if (isLoggedIn()) {
      profileDropdown.innerHTML = `
        <a href="profile.html"><i class="fas fa-user"></i> Profile</a>
        <a href="index.html#leaderboard"><i class="fas fa-trophy"></i> Leaderboard</a>
        <a href="rewards-program.html"><i class="fas fa-gift"></i> Rewards</a>
        <a href="#" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</a>
      `;
    } else {
      profileDropdown.innerHTML = `
        <a href="#" onclick="handleProfileAccess()"><i class="fas fa-user"></i> Profile</a>
        <a href="rewards-program.html"><i class="fas fa-gift"></i> Rewards</a>
        <a href="login.html"><i class="fas fa-sign-in-alt"></i> Login</a>
        <a href="register.html"><i class="fas fa-user-plus"></i> Register</a>
      `;
    }
  }

  function initializePointsDisplay() {
    const loggedIn = isLoggedIn();
    const userPoints = parseInt(localStorage.getItem('userPoints') || '0', 10) || 0;
    const pointsElements = document.querySelectorAll('#navUserPoints, #userPoints, #availablePoints, #userCurrentPoints');

    pointsElements.forEach((el) => {
      if (!el) return;
      if (loggedIn) {
        el.textContent = userPoints.toLocaleString();
        el.style.display = 'inline';
      } else {
        el.style.display = 'none';
      }
    });

    updateNavigationForLoginStatus();
  }

  function updateUserPoints(newPoints) {
    const pts = Number(newPoints) || 0;
    localStorage.setItem('userPoints', String(pts));
    const pointsElements = document.querySelectorAll('#navUserPoints, #userPoints, #availablePoints, #userCurrentPoints');
    pointsElements.forEach((el) => {
      if (el) el.textContent = pts.toLocaleString();
    });
  }

  function addUserPoints(pointsToAdd) {
    const current = parseInt(localStorage.getItem('userPoints') || '0', 10) || 0;
    const next = current + Number(pointsToAdd || 0);
    updateUserPoints(next);
    return next;
  }

  window.initializePointsDisplay = window.initializePointsDisplay || initializePointsDisplay;
  window.updateUserPoints = updateUserPoints; // expose centralized version
  window.addUserPoints = addUserPoints;

  // -------------------- Logout --------------------
  async function fallbackLogout() {
    // Attempt to use centralized logout if provided elsewhere
    if (typeof window.logout === 'function' && window.logout !== fallbackLogout) {
      return window.logout();
    }

    // Clear stored user/admin/JWT data
    const keys = [
      'userToken', 'userData', 'userPoints', 'userLoggedIn', 'userEmail', 'userFirstName', 'userLastName',
      'userCity', 'userPhone', 'userIssues', 'userRank', 'accessToken', 'refreshToken', 'adminToken', 'adminUser'
    ];
    keys.forEach((k) => localStorage.removeItem(k));

    showNotification('Successfully logged out!', 'success');
    initializePointsDisplay();

    setTimeout(() => { window.location.href = 'index.html'; }, 1000);
  }
  window.logout = fallbackLogout;

  // -------------------- Notifications --------------------
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
      <button onclick="this.parentElement.remove()" class="notification-close">
        <i class="fas fa-times"></i>
      </button>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 50);
    setTimeout(() => {
      if (notification.parentElement) {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);
  }
  window.showNotification = window.showNotification || showNotification;

  // -------------------- Media upload (defensive init) --------------------
  function initMediaUpload() {
    const mediaUploadArea = document.getElementById('mediaUploadArea');
    const mediaUpload = document.getElementById('mediaUpload');
    const uploadedMedia = document.getElementById('uploadedMedia');
    if (!mediaUploadArea || !mediaUpload || !uploadedMedia) return;

    let uploadedFiles = [];

    const handleFiles = (files) => {
      files.forEach((file) => {
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
          uploadedFiles.push(file);
          displayUploadedMedia(file);
        }
      });
    };

    const displayUploadedMedia = (file) => {
      const mediaItem = document.createElement('div');
      mediaItem.className = 'uploaded-media-item';

      if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.loading = 'lazy';
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
    };

    const removeMedia = (file) => {
      const idx = uploadedFiles.indexOf(file);
      if (idx > -1) {
        uploadedFiles.splice(idx, 1);
        updateUploadedMediaDisplay();
      }
    };

    const updateUploadedMediaDisplay = () => {
      uploadedMedia.innerHTML = '';
      uploadedFiles.forEach((file) => displayUploadedMedia(file));
    };

    mediaUploadArea.addEventListener('click', () => mediaUpload.click());
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
      const files = Array.from(e.dataTransfer.files || []);
      handleFiles(files);
    });
    mediaUpload.addEventListener('change', (e) => {
      const files = Array.from(e.target.files || []);
      handleFiles(files);
    });
  }

  // -------------------- GPS Location functionality --------------------
  function initializeLocationFunctionality() {
    const getLocationBtn = document.getElementById('getLocationBtn');
    const gpsLocationInput = document.getElementById('gpsLocation');
    if (!getLocationBtn || !gpsLocationInput) return;

    getLocationBtn.style.display = 'inline-block';
    getLocationBtn.style.visibility = 'visible';

    getLocationBtn.addEventListener('click', () => {
      if (!navigator.geolocation) {
        showNotification('Geolocation is not supported by this browser.', 'error');
        return;
      }

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
        () => {
          getLocationBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Location Error';
          getLocationBtn.style.background = '#ef4444';
          setTimeout(() => {
            getLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i> Get Current Location';
            getLocationBtn.style.background = '';
            getLocationBtn.disabled = false;
          }, 3000);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }
  window.initializeLocationFunctionality = window.initializeLocationFunctionality || initializeLocationFunctionality;

  // -------------------- Issue Reporting (defensive) --------------------
  const sampleIssues = window.sampleIssues || [
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
    }
  ];

  function getIssueTypeLabel(type) {
    const typeLabels = {
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
    return typeLabels[type] || type;
  }

  function getCityLabel(city) {
    const cityLabels = {
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
    return cityLabels[city] || city;
  }

  function formatDate(dateString) {
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString || '';
      return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return dateString || ''; }
  }

  function getPriorityIcon(priority) {
    const icons = {
      low: 'fas fa-info-circle',
      medium: 'fas fa-exclamation-circle',
      high: 'fas fa-exclamation-triangle',
      urgent: 'fas fa-radiation'
    };
    return icons[priority] || 'fas fa-info-circle';
  }

  function getPriorityColor(priority) {
    const colors = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', urgent: '#dc2626' };
    return colors[priority] || '#6b7280';
  }

  function getTypeIcon(type) {
    const icons = {
      garbage: 'fas fa-trash',
      road: 'fas fa-road',
      water: 'fas fa-tint',
      electricity: 'fas fa-bolt',
      safety: 'fas fa-shield-alt',
      transport: 'fas fa-bus',
      parks: 'fas fa-tree',
      noise: 'fas fa-volume-up',
      air: 'fas fa-wind',
      other: 'fas fa-question-circle'
    };
    return icons[type] || 'fas fa-question-circle';
  }

  function displayIssues(issues) {
    const issuesList = document.getElementById('issuesList');
    if (!issuesList) return;
    if (!Array.isArray(issues) || issues.length === 0) {
      issuesList.innerHTML = '<div class="no-issues"><p>No issues found matching your criteria.</p></div>';
      return;
    }
    issuesList.innerHTML = issues.map((issue) => `
      <div class="issue-card">
        <div class="issue-header">
          <h3 class="issue-title">
            <i class="${getTypeIcon(issue.type)}" style="margin-right: 8px; color: #dc2626;"></i>
            ${issue.title}
          </h3>
          <span class="issue-status status-${(issue.status || '').toLowerCase()}">${(issue.status || '').replace('-', ' ')}</span>
        </div>
        <div class="issue-details">
          <div class="issue-detail">
            <i class="fas fa-tag"></i>
            <span>${getIssueTypeLabel(issue.type)}</span>
          </div>
          <div class="issue-detail">
            <i class="${getPriorityIcon(issue.priority)}" style="color: ${getPriorityColor(issue.priority)};"></i>
            <span>${(issue.priority || '').charAt(0).toUpperCase()}${(issue.priority || '').slice(1)} Priority</span>
          </div>
          <div class="issue-detail">
            <i class="fas fa-map-marker-alt"></i>
            <span>${issue.address || ''}, ${getCityLabel(issue.city || '')}</span>
          </div>
          <div class="issue-detail">
            <i class="fas fa-calendar"></i>
            <span>Reported: ${formatDate(issue.reportedDate)}</span>
          </div>
          <div class="issue-detail">
            <i class="fas fa-thumbs-up"></i>
            <span>${Number(issue.upvotes || 0)} upvotes</span>
          </div>
        </div>
        <p class="issue-description">${issue.description || ''}</p>
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
  window.displayIssues = window.displayIssues || displayIssues;

  // Filters (defensive)
  function filterIssues() {
    const statusEl = document.getElementById('statusFilter');
    const typeEl = document.getElementById('typeFilter');
    const cityEl = document.getElementById('cityFilter');
    const searchEl = document.getElementById('searchFilter');
    if (!statusEl || !typeEl || !cityEl || !searchEl) return;

    const statusFilter = statusEl.value;
    const typeFilter = typeEl.value;
    const cityFilter = cityEl.value;
    const searchFilter = (searchEl.value || '').toLowerCase();

    const filtered = sampleIssues.filter((issue) => {
      const statusMatch = statusFilter === 'all' || issue.status === statusFilter;
      const typeMatch = typeFilter === 'all' || issue.type === typeFilter;
      const cityMatch = cityFilter === 'all' || issue.city === cityFilter;
      const searchMatch =
        searchFilter === '' ||
        (issue.title || '').toLowerCase().includes(searchFilter) ||
        (issue.description || '').toLowerCase().includes(searchFilter) ||
        (issue.address || '').toLowerCase().includes(searchFilter) ||
        getCityLabel(issue.city || '').toLowerCase().includes(searchFilter);
      return statusMatch && typeMatch && cityMatch && searchMatch;
    });

    displayIssues(filtered);
  }
  window.filterIssues = window.filterIssues || filterIssues;

  // Attach filter listeners if present
  ['statusFilter', 'typeFilter', 'cityFilter'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', filterIssues);
  });
  const searchFilterEl = document.getElementById('searchFilter');
  if (searchFilterEl) searchFilterEl.addEventListener('input', filterIssues);

  // -------------------- Leaderboard (defensive) --------------------
  const leaderboardData = window.leaderboardData || {
    monthly: [],
    yearly: [],
    alltime: []
  };

  function displayLeaderboard(period = 'monthly') {
    const leaderboardList = document.getElementById('leaderboardList');
    if (!leaderboardList) return;
    const data = Array.isArray(leaderboardData[period]) ? leaderboardData[period] : [];
    updateTop3Positions(data);
    leaderboardList.innerHTML = data.slice(3).map((user) => `
      <div class="leaderboard-item">
        <div class="rank">${user.rank}</div>
        <div class="avatar"><i class="fas fa-user-circle"></i></div>
        <div class="info">
          <h4>${user.name}</h4>
          <p>${user.city}</p>
        </div>
        <div class="stats">
          <div class="points">${Number(user.points || 0).toLocaleString()} pts</div>
          <div class="issues">${Number(user.issues || 0)} issues</div>
        </div>
      </div>
    `).join('');
  }
  window.displayLeaderboard = window.displayLeaderboard || displayLeaderboard;

  function updateTop3Positions(data) {
    const top3 = (data || []).slice(0, 3);
    const firstPosition = document.querySelector('.leaderboard-item.first');
    if (firstPosition && top3[0]) {
      firstPosition.querySelector('.info h4').textContent = top3[0].name;
      firstPosition.querySelector('.info p').textContent = top3[0].city;
      firstPosition.querySelector('.stats .points').textContent = `${Number(top3[0].points || 0).toLocaleString()} pts`;
      firstPosition.querySelector('.stats .issues').textContent = `${Number(top3[0].issues || 0)} issues`;
    }
    const secondPosition = document.querySelector('.leaderboard-item.second');
    if (secondPosition && top3[1]) {
      secondPosition.querySelector('.info h4').textContent = top3[1].name;
      secondPosition.querySelector('.info p').textContent = top3[1].city;
      secondPosition.querySelector('.stats .points').textContent = `${Number(top3[1].points || 0).toLocaleString()} pts`;
      secondPosition.querySelector('.stats .issues').textContent = `${Number(top3[1].issues || 0)} issues`;
    }
    const thirdPosition = document.querySelector('.leaderboard-item.third');
    if (thirdPosition && top3[2]) {
      thirdPosition.querySelector('.info h4').textContent = top3[2].name;
      thirdPosition.querySelector('.info p').textContent = top3[2].city;
      thirdPosition.querySelector('.stats .points').textContent = `${Number(top3[2].points || 0).toLocaleString()} pts`;
      thirdPosition.querySelector('.stats .issues').textContent = `${Number(top3[2].issues || 0)} issues`;
    }
  }

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      if (btn.dataset && btn.dataset.tab) {
        displayLeaderboard(btn.dataset.tab);
      }
    });
  });

  // -------------------- Issue Form Handling (defensive) --------------------
  function setupIssueForm() {
    const issueForm = document.getElementById('issueForm');
    const successModal = document.getElementById('successModal');
    const aiModal = document.getElementById('aiModal');

    if (!issueForm) return;

    const generateIssueId = () => {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.random().toString(36).substr(2, 3).toUpperCase();
      return `SK-${timestamp}-${random}`;
    };

    function showAIModal() { if (aiModal) aiModal.style.display = 'block'; }
    function closeModal() {
      if (successModal) successModal.style.display = 'none';
      if (aiModal) aiModal.style.display = 'none';
    }
    window.closeModal = window.closeModal || closeModal;

    function submitIssue() {
      const issueData = {
        id: generateIssueId(),
        type: (document.getElementById('issueType') || {}).value,
        priority: (document.getElementById('priority') || {}).value,
        title: (document.getElementById('title') || {}).value,
        description: (document.getElementById('description') || {}).value,
        address: (document.getElementById('address') || {}).value,
        city: (document.getElementById('city') || {}).value,
        landmark: (document.getElementById('landmark') || {}).value,
        status: 'reported',
        reportedDate: new Date().toISOString().split('T')[0],
        contact: (document.getElementById('contact') || {}).value || 'Anonymous',
        name: (document.getElementById('name') || {}).value,
        phone: (document.getElementById('phone') || {}).value,
        upvotes: 0,
        media: [], // for demo, uploaded media filenames can be wired if required
        gpsLocation: (document.getElementById('gpsLocation') || {}).value || 'Not captured'
      };

      // Add to local array (demo)
      sampleIssues.unshift(issueData);

      // Show success modal
      const issueIdEl = document.getElementById('issueId');
      if (issueIdEl) issueIdEl.textContent = issueData.id;
      if (successModal) successModal.style.display = 'block';

      // Reset form
      issueForm.reset();
      // Refresh issues list and stats
      displayIssues(sampleIssues);
      updateStats();

      // Points award
      if (isLoggedIn()) {
        addUserPoints(25);
        const rewardInfo = document.querySelector('.reward-info span');
        if (rewardInfo) rewardInfo.innerHTML = 'You earned <strong>25 points</strong> for this report!';
      } else {
        const rewardInfo = document.querySelector('.reward-info span');
        if (rewardInfo) {
          rewardInfo.innerHTML = '<strong>Login to earn points!</strong> <a href="login.html" style="color: #3b82f6; text-decoration: underline;">Login now</a>';
        }
      }
    }

    function mergeWithExisting() {
      if (aiModal) aiModal.style.display = 'none';
      if (isLoggedIn()) {
        addUserPoints(10);
        showNotification('Issue merged with existing report. You earned 10 points for contributing!', 'success');
      } else {
        showNotification('Issue merged with existing report. Login to earn points for contributing!', 'info');
      }
    }
    window.mergeWithExisting = window.mergeWithExisting || mergeWithExisting;

    function reportAsNew() {
      if (aiModal) aiModal.style.display = 'none';
      submitIssue();
    }
    window.reportAsNew = window.reportAsNew || reportAsNew;

    // Submit handler
    issueForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // Simulate AI duplicate detection (30% chance)
      const hasSimilarIssue = Math.random() < 0.3;
      if (hasSimilarIssue) showAIModal();
      else submitIssue();
    });

    // Modal close handlers
    window.addEventListener('click', (e) => {
      if (e.target === successModal) closeModal();
      if (e.target === aiModal) closeModal();
    });
    document.querySelectorAll('.close').forEach((btn) => btn.addEventListener('click', closeModal));

    // Add loading state to form submission (visual only)
    issueForm.addEventListener('submit', function () {
      const submitBtn = this.querySelector('button[type="submit"]');
      if (!submitBtn) return;
      const originalHTML = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
      submitBtn.disabled = true;
      setTimeout(() => {
        submitBtn.innerHTML = originalHTML;
        submitBtn.disabled = false;
      }, 1800);
    });
  }

  // -------------------- Issue Actions --------------------
  function upvoteIssue(issueId) {
    const issue = sampleIssues.find((i) => i.id === issueId);
    if (issue) {
      issue.upvotes = Number(issue.upvotes || 0) + 1;
      displayIssues(sampleIssues);
      if (isLoggedIn()) addUserPoints(5);
      showNotification('Thanks for upvoting!', 'success');
    }
  }
  window.upvoteIssue = upvoteIssue;

  function trackIssue(issueId) {
    // Navigate to track page with query param
    window.location.href = `track-issue.html?id=${encodeURIComponent(issueId)}`;
  }
  window.trackIssue = trackIssue;

  // -------------------- Smooth scrolling for in-page anchors --------------------
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      const target = href ? document.querySelector(href) : null;
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // -------------------- Stats --------------------
  function updateStats() {
    const totalIssues = sampleIssues.length;
    const resolvedIssues = sampleIssues.filter((issue) => (issue.status || '').toLowerCase() === 'resolved').length;
    const activeUsers = Math.floor(Math.random() * 100) + 8000;
    const rewardsDistributed = Math.floor(Math.random() * 50000) + 200000;

    const statEls = [
      document.querySelector('.stat-item:nth-child(1) .stat-number'),
      document.querySelector('.stat-item:nth-child(2) .stat-number'),
      document.querySelector('.stat-item:nth-child(3) .stat-number'),
      document.querySelector('.stat-item:nth-child(4) .stat-number')
    ];
    if (statEls[0]) statEls[0].textContent = totalIssues.toLocaleString();
    if (statEls[1]) statEls[1].textContent = resolvedIssues.toLocaleString();
    if (statEls[2]) statEls[2].textContent = activeUsers.toLocaleString();
    if (statEls[3]) statEls[3].textContent = `₹${(rewardsDistributed / 1000).toFixed(1)}L`;
  }
  window.updateStats = window.updateStats || updateStats;

  function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach((stat) => {
      const hasRupee = (stat.textContent || '').includes('₹');
      const finalValue = parseInt((stat.textContent || '0').replace(/[^\d]/g, ''), 10) || 0;
      let currentValue = 0;
      const steps = 40;
      const increment = finalValue / steps;
      const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= finalValue) {
          currentValue = finalValue;
          clearInterval(timer);
        }
        stat.textContent = hasRupee
          ? `₹${(Math.floor(currentValue) / 1000).toFixed(1)}L`
          : Math.floor(currentValue).toLocaleString();
      }, 25);
    });
  }
  window.animateStats = window.animateStats || animateStats;

  // -------------------- Authentication Helpers --------------------
  function isUserLoggedIn() {
    const userToken = localStorage.getItem('userToken');
    const legacy = localStorage.getItem('userLoggedIn') === 'true';
    const jwt = !!localStorage.getItem('accessToken');
    return (userToken && legacy) || jwt;
  }
  function enforceAuthentication() { if (!isUserLoggedIn()) window.location.replace('login.html'); }
  function preventLoggedInAccess() { if (isUserLoggedIn()) window.location.replace('profile.html'); }
  function redirectBasedOnAuth() { window.location.replace(isUserLoggedIn() ? 'profile.html' : 'login.html'); }

  function handleProfileAccess() {
    if (isUserLoggedIn()) {
      window.location.href = 'profile.html';
    } else {
      showNotification('Please login to view your profile', 'info');
      setTimeout(() => {
        if (confirm('You need to be logged in to access your profile.\n\nGo to the login page now?')) {
          window.location.href = 'login.html';
        }
      }, 800);
    }
  }

  function clearProfileDataFromDOM() {
    document.querySelectorAll('[data-profile]').forEach((el) => { el.textContent = ''; });
    document.querySelectorAll('.profile-image, .user-avatar').forEach((img) => {
      try {
        if (img.src && !img.src.includes('default')) {
          img.src =
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0iI0U1RTdFQiIvPjxwYXRoIGQ9Ik0yMCAxMEMyMi43NjE0IDEwIDI1IDEyLjIzODYgMjUgMTVDMjUgMTcuNzYxNCAyMi43NjE0IDIwIDIwIDIwQzE3LjIzODYgMjAgMTUgMTcuNzYxNCAxNSAxNUMxNSAxMi4yMzg2IDE3LjIzODYgMTAgMjAgMTBaIiBmaWxsPSIjOUNBM0FGIi8+PHBhdGggZD0iTTI4IDMwQzI4IDI2LjY4NjMgMjQuNDE0MiAyNCAyMCAyNEMxNS41ODU4IDI0IDEyIDI2LjY4NjMgMTIgMzBIMjhaIiBmaWxsPSIjOUNBM0FGIi8+PC9zdmc+';
        }
      } catch {}
    });
  }

  function updateNavigationAfterLogout() {
    document.querySelectorAll('.user-menu, .profile-dropdown').forEach((el) => { el.style.display = 'none'; });
    document.querySelectorAll('.login-btn, .signup-btn').forEach((btn) => { btn.style.display = 'inline-block'; });
    document.querySelectorAll('.profile-link').forEach((link) => { link.style.display = 'none'; });
  }

  // Expose auth helpers
  window.isUserLoggedIn = window.isUserLoggedIn || isUserLoggedIn;
  window.enforceAuthentication = window.enforceAuthentication || enforceAuthentication;
  window.preventLoggedInAccess = window.preventLoggedInAccess || preventLoggedInAccess;
  window.redirectBasedOnAuth = window.redirectBasedOnAuth || redirectBasedOnAuth;
  window.handleProfileAccess = window.handleProfileAccess || handleProfileAccess;
  window.clearProfileDataFromDOM = window.clearProfileDataFromDOM || clearProfileDataFromDOM;
  window.updateNavigationAfterLogout = window.updateNavigationAfterLogout || updateNavigationAfterLogout;

  // -------------------- Page Initialization --------------------
  document.addEventListener('DOMContentLoaded', function () {
    try {
      initializePointsDisplay();
      initializeLocationFunctionality();
      initMediaUpload();

      // Index/home widgets (defensive)
      if (document.getElementById('issuesList')) {
        displayIssues(sampleIssues);
        updateStats();
        animateStats();
      }
      if (document.getElementById('leaderboardList')) {
        displayLeaderboard('monthly');
      }
    } catch (error) {
      console.error('Error initializing page functionality:', error);
    }
  });

  // -------------------- Small utility styles --------------------
  const style = document.createElement('style');
  style.textContent = `
    .btn-sm { padding: 8px 16px; font-size: 0.875rem; }
    .issue-actions { display: flex; gap: 1rem; margin-top: 1.5rem; }
    .no-issues { text-align: center; padding: 3rem; color: #64748b; font-size: 1.1rem; }
  `;
  document.head.appendChild(style);
})();