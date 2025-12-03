// Garbage Collection Management System
class GarbageCollectionSystem {
  constructor() {
    this.requests = this.loadFromStorage('requests') || [];
    this.collectors = this.loadFromStorage('collectors') || this.initializeCollectors();
    this.schedules = this.loadFromStorage('schedules') || this.initializeSchedules();
    this.stats = this.loadFromStorage('stats') || this.initializeStats();
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateStats();
    this.generateSchedule();
    this.setupNavigation();
  }

  setupEventListeners() {
// Form submission
    const form = document.getElementById('requestForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    // Tracking functionality
    const trackButton = document.querySelector('button[onclick="trackRequest()"]');
    if (trackButton) {
      trackButton.addEventListener('click', () => this.trackRequest());
    }

    // Schedule filters
    const areaFilter = document.getElementById('areaFilter');
    const typeFilter = document.getElementById('typeFilter');
    
    if (areaFilter) {
      areaFilter.addEventListener('change', () => this.filterSchedule());
    }
    if (typeFilter) {
      typeFilter.addEventListener('change', () => this.filterSchedule());
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

  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        
        // Allow external links (to other HTML files) to work normally
        if (href && (href.includes('.html') || href.startsWith('http'))) {
          return; // Let the browser handle the navigation
        }
        
        // Only prevent default for anchor links on the same page
        e.preventDefault();
        const targetId = href.substring(1);
        this.scrollToSection(targetId);
        
        // Update active link
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      });
    });
  }

  scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }

  handleFormSubmit(e) {
  e.preventDefault();

    const formData = {
      id: this.generateId(),
      residentId: document.getElementById('residentId').value,
      residentName: document.getElementById('residentName').value,
      wasteType: document.getElementById('wasteType').value,
      priority: document.getElementById('priority').value,
      address: document.getElementById('address').value,
      phone: document.getElementById('phone').value,
      description: document.getElementById('description').value,
      preferredDate: document.getElementById('preferredDate').value,
      status: 'Pending',
      timestamp: new Date().toISOString(),
      assignedCollector: null,
      collectionDate: null,
      notes: ''
    };

    this.requests.push(formData);
    this.saveToStorage('requests', this.requests);
    
    this.showMessage('Request submitted successfully! Your request ID is: ' + formData.id, 'success');
    document.getElementById('requestForm').reset();
    
    this.updateStats();
    this.generateSchedule();
  }

  trackRequest() {
    const trackingId = document.getElementById('trackingId').value.trim();
    if (!trackingId) {
      this.showMessage('Please enter a Request ID or Resident ID', 'error');
      return;
    }

    const results = this.requests.filter(req => 
      req.id === trackingId || req.residentId === trackingId
    );

    const resultsContainer = document.getElementById('trackingResults');
    
    if (results.length === 0) {
      resultsContainer.innerHTML = '<p>No requests found for the given ID.</p>';
      return;
    }

    resultsContainer.innerHTML = results.map(req => `
      <div class="request-card">
        <h3>Request #${req.id}</h3>
        <p><strong>Resident:</strong> ${req.residentName} (${req.residentId})</p>
        <p><strong>Waste Type:</strong> ${req.wasteType}</p>
        <p><strong>Priority:</strong> ${req.priority}</p>
        <p><strong>Address:</strong> ${req.address}</p>
        <p><strong>Status:</strong> <span class="status-badge status-${req.status.toLowerCase().replace(' ', '-')}">${req.status}</span></p>
        <p><strong>Submitted:</strong> ${new Date(req.timestamp).toLocaleDateString()}</p>
        ${req.assignedCollector ? `<p><strong>Assigned Collector:</strong> ${req.assignedCollector}</p>` : ''}
        ${req.collectionDate ? `<p><strong>Collection Date:</strong> ${new Date(req.collectionDate).toLocaleDateString()}</p>` : ''}
        ${req.notes ? `<p><strong>Notes:</strong> ${req.notes}</p>` : ''}
      </div>
    `).join('');
  }

  generateSchedule() {
    const scheduleGrid = document.getElementById('scheduleGrid');
    if (!scheduleGrid) return;

    // If admin has already created a schedule in localStorage, just use it
    if (!this.schedules || this.schedules.length === 0) {
      const today = new Date();
      const scheduleData = [];

      // Simple default schedule (admin can edit later)
      const areas = ['North Zone', 'South Zone', 'East Zone', 'West Zone'];
      const wasteTypes = ['Biodegradable', 'Recyclable', 'Hazardous'];

      for (let i = 0; i < 5; i++) {
        const date = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

        areas.forEach((area, index) => {
          const type = wasteTypes[index % wasteTypes.length];
          scheduleData.push({
            date: date.toISOString().split('T')[0],
            dayName,
            area,
            type,
            time: this.getRandomTime(),
            collector: this.getRandomCollector()
          });
});
      }

      this.schedules = scheduleData;
      this.saveToStorage('schedules', this.schedules);
    }

    this.filterSchedule();
  }

  filterSchedule() {
    const scheduleGrid = document.getElementById('scheduleGrid');
    if (!scheduleGrid) return;

    const areaFilter = document.getElementById('areaFilter')?.value || '';
    const typeFilter = document.getElementById('typeFilter')?.value || '';

    let filteredSchedules = this.schedules;

    if (areaFilter) {
      filteredSchedules = filteredSchedules.filter(s => s.area.includes(areaFilter));
    }

    if (typeFilter) {
      filteredSchedules = filteredSchedules.filter(s => s.type === typeFilter);
    }

    scheduleGrid.innerHTML = filteredSchedules.map(schedule => `
      <div class="schedule-card">
        <h3>${schedule.type} Collection</h3>
        <div class="date">${schedule.dayName}, ${new Date(schedule.date).toLocaleDateString()}</div>
        <div class="area">${schedule.area}</div>
        <p><strong>Time:</strong> ${schedule.time}</p>
        <p><strong>Collector:</strong> ${schedule.collector}</p>
      </div>
    `).join('');
  }

  updateStats() {
    const totalResidents = document.getElementById('totalResidents');
    const activeCollectors = document.getElementById('activeCollectors');
    const completedToday = document.getElementById('completedToday');

    if (totalResidents) {
      const uniqueResidents = new Set(this.requests.map(req => req.residentId)).size;
      totalResidents.textContent = uniqueResidents.toLocaleString();
    }

    if (activeCollectors) {
      activeCollectors.textContent = this.collectors.length;
    }

    if (completedToday) {
      const today = new Date().toISOString().split('T')[0];
      const completedTodayCount = this.requests.filter(req => 
        req.status === 'Completed' && req.collectionDate === today
      ).length;
      completedToday.textContent = completedTodayCount;
    }
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

  initializeSchedules() {
    return [];
  }

  initializeStats() {
    return {
      totalRequests: 0,
      completedRequests: 0,
      pendingRequests: 0
    };
  }

  getRandomTime() {
    const hours = Math.floor(Math.random() * 8) + 6; // 6 AM to 2 PM
    const minutes = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  getRandomCollector() {
    const collector = this.collectors[Math.floor(Math.random() * this.collectors.length)];
    return `${collector.name} (${collector.id})`;
  }

  generateId() {
    return 'REQ' + Date.now().toString(36).toUpperCase();
  }

  showMessage(text, type = 'success') {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
      messageDiv.textContent = text;
      messageDiv.className = `message ${type}`;
      
      setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = 'message';
      }, 5000);
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
function trackRequest() {
  if (window.garbageSystem) {
    window.garbageSystem.trackRequest();
  }
}

// Initialize the system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.garbageSystem = new GarbageCollectionSystem();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GarbageCollectionSystem;
}
