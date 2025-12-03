// Admin Dashboard Functionality
class AdminDashboard {
  constructor() {
    this.currentAdmin = null;
    this.requests = this.loadFromStorage('requests') || [];
    this.collectors = this.loadFromStorage('collectors') || this.initializeCollectors();
    this.schedules = this.loadFromStorage('schedules') || [];
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
    // Admin login form
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
      adminLoginForm.addEventListener('submit', (e) => this.handleAdminLogin(e));
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
    const savedAdmin = this.loadFromStorage('currentAdmin');
    if (savedAdmin) {
      this.currentAdmin = savedAdmin;
      this.showDashboard();
    }
  }

  handleAdminLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value.trim();

    // Simple authentication (in real app, this would be server-side)
    if (username === 'admin' && password === 'admin123') {
      this.currentAdmin = { username: 'admin', name: 'Administrator' };
      this.saveToStorage('currentAdmin', this.currentAdmin);
      this.showDashboard();
      this.showMessage('Login successful!', 'success');
    } else {
      this.showMessage('Invalid username or password', 'error');
    }
  }

  showDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    
    this.updateAdminInfo();
    this.loadRecentRequests();
    this.loadCollectors();
    this.loadScheduleAdminView();
    this.updateStats();
  }

  updateAdminInfo() {
    const adminName = document.getElementById('adminName');
    if (adminName && this.currentAdmin) {
      adminName.textContent = `Welcome, ${this.currentAdmin.name}`;
    }
  }

  loadRecentRequests() {
    const tableBody = document.getElementById('recentRequestsTable');
    if (!tableBody) return;

    // Get the 10 most recent requests
    const recentRequests = this.requests
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    if (recentRequests.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7">No requests found</td></tr>';
      return;
    }

    tableBody.innerHTML = recentRequests.map(req => `
      <tr>
        <td>${req.id}</td>
        <td>${req.residentName}</td>
        <td>${req.wasteType}</td>
        <td><span class="priority-badge priority-${req.priority.toLowerCase()}">${req.priority}</span></td>
        <td><span class="status-badge status-${req.status.toLowerCase().replace(' ', '-')}">${req.status}</span></td>
        <td>${new Date(req.timestamp).toLocaleDateString()}</td>
        <td>
          <button onclick="viewRequestDetails('${req.id}')" class="btn-sm btn-primary">
            <i class="fas fa-eye"></i>
          </button>
          <button onclick="assignRequest('${req.id}')" class="btn-sm btn-secondary">
            <i class="fas fa-user-plus"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  loadCollectors() {
    const collectorsGrid = document.getElementById('collectorsGrid');
    if (!collectorsGrid) return;

    if (this.collectors.length === 0) {
      collectorsGrid.innerHTML = '<p>No collectors found</p>';
      return;
    }

    collectorsGrid.innerHTML = this.collectors.map(collector => `
      <div class="collector-card">
        <div class="collector-header">
          <h4>${collector.name}</h4>
          <span class="status-badge status-${collector.status.toLowerCase()}">${collector.status}</span>
        </div>
        <div class="collector-details">
          <p><strong>ID:</strong> ${collector.id}</p>
          <p><strong>Phone:</strong> ${collector.phone}</p>
          <p><strong>Area:</strong> ${collector.area}</p>
        </div>
        <div class="collector-actions">
          <button onclick="editCollector('${collector.id}')" class="btn-sm btn-primary">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button onclick="deleteCollector('${collector.id}')" class="btn-sm btn-secondary">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    `).join('');
  }

  updateStats() {
    const totalRequests = this.requests.length;
    const pendingRequests = this.requests.filter(req => req.status === 'Pending').length;
    const completedRequests = this.requests.filter(req => req.status === 'Completed').length;
    const activeCollectors = this.collectors.filter(c => c.status === 'Active').length;

    document.getElementById('totalRequests').textContent = totalRequests;
    document.getElementById('pendingRequests').textContent = pendingRequests;
    document.getElementById('completedRequests').textContent = completedRequests;
    document.getElementById('activeCollectors').textContent = activeCollectors;
  }

  loadScheduleAdminView() {
    const tableBody = document.getElementById('adminScheduleTable');
    if (!tableBody) return;

    if (!this.schedules || this.schedules.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7">No schedule entries yet. Use the form above to add one.</td></tr>';
      return;
    }

    tableBody.innerHTML = this.schedules.map((s, index) => `
      <tr>
        <td>${s.date}</td>
        <td>${s.dayName}</td>
        <td>${s.area}</td>
        <td>${s.type}</td>
        <td>${s.time}</td>
        <td>${s.collector || '-'}</td>
        <td>
          <button class="btn-sm btn-primary" onclick="editScheduleAdmin(${index})">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-sm btn-secondary" onclick="deleteScheduleAdmin(${index})">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  showMessage(text, type = 'success') {
    const messageDiv = document.getElementById('adminLoginMessage');
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
  localStorage.removeItem('currentAdmin');
  location.reload();
}

function assignRequests() {
  const unassignedRequests = window.adminDashboard.requests.filter(req => !req.assignedCollector);
  
  if (unassignedRequests.length === 0) {
    alert('No unassigned requests found.');
    return;
  }

  // Simple auto-assignment logic
  unassignedRequests.forEach(req => {
    const availableCollectors = window.adminDashboard.collectors.filter(c => c.status === 'Active');
    if (availableCollectors.length > 0) {
      const randomCollector = availableCollectors[Math.floor(Math.random() * availableCollectors.length)];
      req.assignedCollector = `${randomCollector.name} (${randomCollector.id})`;
    }
  });

  window.adminDashboard.saveToStorage('requests', window.adminDashboard.requests);
  window.adminDashboard.loadRecentRequests();
  window.adminDashboard.updateStats();
  
  alert(`Assigned ${unassignedRequests.length} requests to collectors.`);
}

function addCollector() {
  document.getElementById('addCollectorModal').style.display = 'block';
}

function closeAddCollectorModal() {
  document.getElementById('addCollectorModal').style.display = 'none';
  document.getElementById('addCollectorForm').reset();
}

function saveNewCollector() {
  const name = document.getElementById('newCollectorName').value.trim();
  const phone = document.getElementById('newCollectorPhone').value.trim();
  const area = document.getElementById('newCollectorArea').value;
  const status = document.getElementById('newCollectorStatus').value;

  if (!name || !phone || !area) {
    alert('Please fill in all required fields.');
    return;
  }

  // Generate next collector ID
  let nextId = 1;
  if (window.adminDashboard.collectors.length > 0) {
    const existingIds = window.adminDashboard.collectors.map(c => {
      const num = parseInt(c.id.replace('C', ''));
      return isNaN(num) ? 0 : num;
    });
    nextId = Math.max(...existingIds) + 1;
  }

  const newCollector = {
    id: 'C' + String(nextId).padStart(3, '0'),
    name: name,
    phone: phone,
    area: area,
    status: status
  };

  window.adminDashboard.collectors.push(newCollector);
  window.adminDashboard.saveToStorage('collectors', window.adminDashboard.collectors);
  window.adminDashboard.loadCollectors();
  window.adminDashboard.updateStats();
  
  closeAddCollectorModal();
  alert('Collector added successfully!');
}

function editCollector(collectorId) {
  const collector = window.adminDashboard.collectors.find(c => c.id === collectorId);
  if (!collector) return;

  const newName = prompt('Enter new name:', collector.name);
  if (newName && newName.trim()) {
    collector.name = newName.trim();
    window.adminDashboard.saveToStorage('collectors', window.adminDashboard.collectors);
    window.adminDashboard.loadCollectors();
  }
}

function deleteCollector(collectorId) {
  if (confirm('Are you sure you want to delete this collector?')) {
    window.adminDashboard.collectors = window.adminDashboard.collectors.filter(c => c.id !== collectorId);
    window.adminDashboard.saveToStorage('collectors', window.adminDashboard.collectors);
    window.adminDashboard.loadCollectors();
    window.adminDashboard.updateStats();
    alert('Collector deleted successfully!');
  }
}

function viewRequestDetails(requestId) {
  const request = window.adminDashboard.requests.find(req => req.id === requestId);
  if (!request) return;

  const details = `
Request ID: ${request.id}
Resident: ${request.residentName} (${request.residentId})
Waste Type: ${request.wasteType}
Priority: ${request.priority}
Address: ${request.address}
Phone: ${request.phone}
Description: ${request.description || 'No description'}
Status: ${request.status}
Submitted: ${new Date(request.timestamp).toLocaleString()}
${request.assignedCollector ? `Assigned Collector: ${request.assignedCollector}` : 'Not assigned'}
${request.collectionDate ? `Collection Date: ${new Date(request.collectionDate).toLocaleDateString()}` : ''}
${request.notes ? `Notes: ${request.notes}` : ''}
  `;

  alert(details);
}

function assignRequest(requestId) {
  const request = window.adminDashboard.requests.find(req => req.id === requestId);
  if (!request) return;

  const availableCollectors = window.adminDashboard.collectors.filter(c => c.status === 'Active');
  if (availableCollectors.length === 0) {
    alert('No active collectors available.');
    return;
  }

  const collectorNames = availableCollectors.map(c => `${c.name} (${c.id})`).join('\n');
  const selectedCollector = prompt(`Available collectors:\n${collectorNames}\n\nEnter collector name or ID:`);
  
  if (selectedCollector) {
    const collector = availableCollectors.find(c => 
      c.name.toLowerCase().includes(selectedCollector.toLowerCase()) || 
      c.id.toLowerCase().includes(selectedCollector.toLowerCase())
    );
    
    if (collector) {
      request.assignedCollector = `${collector.name} (${collector.id})`;
      window.adminDashboard.saveToStorage('requests', window.adminDashboard.requests);
      window.adminDashboard.loadRecentRequests();
      alert('Request assigned successfully!');
    } else {
      alert('Collector not found.');
    }
  }
}

function generateReport() {
  const report = `
=== GARBAGE COLLECTION REPORT ===
Generated: ${new Date().toLocaleString()}

Total Requests: ${window.adminDashboard.requests.length}
Pending: ${window.adminDashboard.requests.filter(req => req.status === 'Pending').length}
In Progress: ${window.adminDashboard.requests.filter(req => req.status === 'In Progress').length}
Completed: ${window.adminDashboard.requests.filter(req => req.status === 'Completed').length}

Active Collectors: ${window.adminDashboard.collectors.filter(c => c.status === 'Active').length}
Total Collectors: ${window.adminDashboard.collectors.length}

Waste Type Distribution:
${window.adminDashboard.requests.reduce((acc, req) => {
  acc[req.wasteType] = (acc[req.wasteType] || 0) + 1;
  return acc;
}, {})}

Priority Distribution:
${window.adminDashboard.requests.reduce((acc, req) => {
  acc[req.priority] = (acc[req.priority] || 0) + 1;
  return acc;
}, {})}
  `;

  alert(report);
}

function exportData() {
  const data = {
    requests: window.adminDashboard.requests,
    collectors: window.adminDashboard.collectors,
    schedules: window.adminDashboard.schedules,
    exportDate: new Date().toISOString()
  };

  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `garbage-collection-data-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
  alert('Data exported successfully!');
}

// Initialize the admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.adminDashboard = new AdminDashboard();
});

// Schedule management (admin)
function addScheduleAdmin() {
  const dateInput = document.getElementById('scheduleDate');
  const areaInput = document.getElementById('scheduleArea');
  const typeInput = document.getElementById('scheduleType');
  const timeInput = document.getElementById('scheduleTime');
  const collectorInput = document.getElementById('scheduleCollector');

  const date = dateInput.value;
  const area = areaInput.value;
  const type = typeInput.value;
  const time = timeInput.value;
  const collector = collectorInput.value.trim();

  if (!date || !area || !type || !time) {
    alert('Please fill in date, area, type and time.');
    return;
  }

  const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

  window.adminDashboard.schedules.push({
    date,
    dayName,
    area,
    type,
    time,
    collector
  });

  window.adminDashboard.saveToStorage('schedules', window.adminDashboard.schedules);
  window.adminDashboard.loadScheduleAdminView();
  alert('Schedule entry added.');

  document.getElementById('adminScheduleForm').reset();
}

function editScheduleAdmin(index) {
  const s = window.adminDashboard.schedules[index];
  if (!s) return;

  const newTime = prompt('Update time (HH:MM):', s.time) || s.time;
  const newCollector = prompt('Update collector (optional):', s.collector || '') || s.collector;

  s.time = newTime;
  s.collector = newCollector;

  window.adminDashboard.saveToStorage('schedules', window.adminDashboard.schedules);
  window.adminDashboard.loadScheduleAdminView();
  alert('Schedule entry updated.');
}

function deleteScheduleAdmin(index) {
  if (!confirm('Delete this schedule entry?')) return;

  window.adminDashboard.schedules.splice(index, 1);
  window.adminDashboard.saveToStorage('schedules', window.adminDashboard.schedules);
  window.adminDashboard.loadScheduleAdminView();
}




