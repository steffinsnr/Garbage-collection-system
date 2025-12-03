// Collector Dashboard Functionality
class CollectorDashboard {
  constructor() {
    this.currentCollector = null;
    this.requests = this.loadFromStorage('requests') || [];
    this.collectors = this.loadFromStorage('collectors') || this.initializeCollectors();
    this.init();
  }

  initializeCollectors() {
    const defaultCollectors = [
      { id: 'C001', name: 'John Smith', phone: '+1-555-0101', area: 'North Zone', status: 'Active' },
      { id: 'C002', name: 'Sarah Johnson', phone: '+1-555-0102', area: 'South Zone', status: 'Active' },
      { id: 'C003', name: 'Mike Wilson', phone: '+1-555-0103', area: 'East Zone', status: 'Active' },
      { id: 'C004', name: 'Lisa Brown', phone: '+1-555-0104', area: 'West Zone', status: 'Active' },
      { id: 'C005', name: 'David Davis', phone: '+1-555-0105', area: 'North Zone', status: 'Active' }
    ];
    this.saveToStorage('collectors', defaultCollectors);
    return defaultCollectors;
  }

  init() {
    this.setupEventListeners();
    this.checkExistingLogin();
  }

  setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    // Mobile navigation
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
      });
    }
  }

  checkExistingLogin() {
    const savedCollector = this.loadFromStorage('currentCollector');
    if (savedCollector) {
      this.currentCollector = savedCollector;
      this.showDashboard();
    }
  }

  handleLogin(e) {
    e.preventDefault();
    
    const collectorId = document.getElementById('collectorId').value.trim();
    const password = document.getElementById('password').value.trim();

    // Simple authentication (in real app, this would be server-side)
    const collector = this.collectors.find(c => c.id === collectorId);
    
    if (collector && password === 'password123') {
      this.currentCollector = collector;
      this.saveToStorage('currentCollector', collector);
      this.showDashboard();
      this.showMessage('Login successful!', 'success');
    } else {
      this.showMessage('Invalid Collector ID or Password', 'error');
    }
  }

  showDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    
    this.updateCollectorInfo();
    this.loadAssignedRequests();
    this.loadTodaySchedule();
    this.updateStats();
  }

  updateCollectorInfo() {
    const collectorName = document.getElementById('collectorName');
    if (collectorName && this.currentCollector) {
      collectorName.textContent = `Welcome, ${this.currentCollector.name}`;
    }
  }

  loadAssignedRequests() {
    const requestsGrid = document.getElementById('assignedRequestsGrid');
    if (!requestsGrid || !this.currentCollector) return;

    // Filter requests assigned to this collector
    const assignedRequests = this.requests.filter(req => 
      req.assignedCollector && req.assignedCollector.includes(this.currentCollector.id)
    );

    if (assignedRequests.length === 0) {
      requestsGrid.innerHTML = '<p>No requests assigned to you yet.</p>';
      return;
    }

    requestsGrid.innerHTML = assignedRequests.map(req => `
      <div class="request-card" onclick="openRequestModal('${req.id}')">
        <div class="request-header">
          <h4>Request #${req.id}</h4>
          <span class="status-badge status-${req.status.toLowerCase().replace(' ', '-')}">${req.status}</span>
        </div>
        <div class="request-details">
          <p><strong>Resident:</strong> ${req.residentName}</p>
          <p><strong>Type:</strong> ${req.wasteType}</p>
          <p><strong>Priority:</strong> ${req.priority}</p>
          <p><strong>Address:</strong> ${req.address}</p>
          <p><strong>Phone:</strong> ${req.phone}</p>
        </div>
        <div class="request-actions">
          <button onclick="event.stopPropagation(); updateRequestStatusDirect('${req.id}', 'In Progress')" class="btn-primary btn-sm">
            <i class="fas fa-play"></i> Start
          </button>
          <button onclick="event.stopPropagation(); updateRequestStatusDirect('${req.id}', 'Completed')" class="btn-secondary btn-sm">
            <i class="fas fa-check"></i> Complete
          </button>
        </div>
      </div>
    `).join('');
  }

  loadTodaySchedule() {
    const scheduleGrid = document.getElementById('todaySchedule');
    if (!scheduleGrid) return;

    const today = new Date().toISOString().split('T')[0];
    const todaySchedules = this.loadFromStorage('schedules') || [];
    
    const todaySchedule = todaySchedules.filter(schedule => 
      schedule.date === today && 
      schedule.collector && 
      schedule.collector.includes(this.currentCollector.id)
    );

    if (todaySchedule.length === 0) {
      scheduleGrid.innerHTML = '<p>No schedule for today.</p>';
      return;
    }

    scheduleGrid.innerHTML = todaySchedule.map(schedule => `
      <div class="schedule-card">
        <h4>${schedule.type} Collection</h4>
        <p><strong>Area:</strong> ${schedule.area}</p>
        <p><strong>Time:</strong> ${schedule.time}</p>
        <p><strong>Status:</strong> <span class="status-badge status-pending">Scheduled</span></p>
      </div>
    `).join('');
  }

  updateStats() {
    if (!this.currentCollector) return;

    const assignedRequests = this.requests.filter(req => 
      req.assignedCollector && req.assignedCollector.includes(this.currentCollector.id)
    );

    const pendingTasks = assignedRequests.filter(req => req.status === 'Pending' || req.status === 'In Progress');
    const today = new Date().toISOString().split('T')[0];
    const completedToday = assignedRequests.filter(req => 
      req.status === 'Completed' && req.collectionDate === today
    );

    document.getElementById('totalAssigned').textContent = assignedRequests.length;
    document.getElementById('pendingTasks').textContent = pendingTasks.length;
    document.getElementById('completedToday').textContent = completedToday.length;
  }

  showMessage(text, type = 'success') {
    const messageDiv = document.getElementById('loginMessage');
    if (messageDiv) {
      messageDiv.textContent = text;
      messageDiv.className = `message ${type}`;
      
      setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = 'message';
      }, 3000);
    }
  }

  saveToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  loadFromStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return null;
    }
  }
}

// Global functions for HTML onclick handlers
function logout() {
  localStorage.removeItem('currentCollector');
  location.reload();
}

function openRequestModal(requestId) {
  const request = window.collectorDashboard.requests.find(req => req.id === requestId);
  if (!request) return;

  const modal = document.getElementById('requestModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');

  modalTitle.textContent = `Request #${request.id}`;
  modalBody.innerHTML = `
    <div class="request-details-full">
      <div class="detail-row">
        <strong>Resident:</strong> ${request.residentName} (${request.residentId})
      </div>
      <div class="detail-row">
        <strong>Waste Type:</strong> ${request.wasteType}
      </div>
      <div class="detail-row">
        <strong>Priority:</strong> ${request.priority}
      </div>
      <div class="detail-row">
        <strong>Address:</strong> ${request.address}
      </div>
      <div class="detail-row">
        <strong>Phone:</strong> ${request.phone}
      </div>
      <div class="detail-row">
        <strong>Description:</strong> ${request.description || 'No description provided'}
      </div>
      <div class="detail-row">
        <strong>Preferred Date:</strong> ${request.preferredDate ? new Date(request.preferredDate).toLocaleDateString() : 'Not specified'}
      </div>
      <div class="detail-row">
        <strong>Status:</strong> <span class="status-badge status-${request.status.toLowerCase().replace(' ', '-')}">${request.status}</span>
      </div>
      <div class="detail-row">
        <strong>Submitted:</strong> ${new Date(request.timestamp).toLocaleDateString()}
      </div>
    </div>
  `;

  modal.style.display = 'block';
  modal.dataset.requestId = requestId;
}

function closeModal() {
  document.getElementById('requestModal').style.display = 'none';
}

function updateRequestStatusDirect(requestId, status) {
  const request = window.collectorDashboard.requests.find(req => req.id === requestId);
  if (!request) return;

  request.status = status;
  if (status === 'Completed') {
    request.collectionDate = new Date().toISOString().split('T')[0];
  }

  window.collectorDashboard.saveToStorage('requests', window.collectorDashboard.requests);
  window.collectorDashboard.loadAssignedRequests();
  window.collectorDashboard.updateStats();
  
  window.collectorDashboard.showMessage(`Request ${status.toLowerCase()} successfully!`, 'success');
}

function updateRequestStatus(status) {
  const modal = document.getElementById('requestModal');
  const requestId = modal.dataset.requestId;
  
  if (!requestId) return;

  updateRequestStatusDirect(requestId, status);
  closeModal();
}

function startRoute() {
  alert('Route started! GPS tracking enabled.');
}

function reportIssue() {
  const issue = prompt('Please describe the issue:');
  if (issue) {
    alert('Issue reported successfully!');
  }
}

function updateLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        alert(`Location updated: ${position.coords.latitude}, ${position.coords.longitude}`);
      },
      (error) => {
        alert('Unable to get location. Please check your browser permissions.');
      }
    );
  } else {
    alert('Geolocation is not supported by this browser.');
  }
}

// Initialize the collector dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.collectorDashboard = new CollectorDashboard();
});




