const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Offline request queue
let offlineRequestsQueue = [];

// Check if online
export const isOnline = () => navigator.onLine;

// Process offline requests when back online
const processOfflineQueue = async () => {
  const queue = JSON.parse(localStorage.getItem('offlineRequests') || '[]');
  if (queue.length === 0) return;

  for (const req of queue) {
    try {
      await fetch(`${API_URL}${req.endpoint}`, {
        method: req.options.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: req.options.body
      });
    } catch (error) {
      console.log('Failed to sync offline request:', error);
    }
  }
  
  localStorage.removeItem('offlineRequests');
};

// Listen for online event to process queue
window.addEventListener('online', processOfflineQueue);

// Enhanced API call with offline support
export const apiCall = async (endpoint, options = {}) => {
  if (!isOnline()) {
    // For emergency alerts, store them even when offline
    if (endpoint.includes('accident') || endpoint.includes('emergency')) {
      const offlineRequests = JSON.parse(localStorage.getItem('offlineRequests') || '[]');
      offlineRequests.push({
        endpoint,
        options,
        timestamp: new Date().toISOString(),
        priority: 'high'
      });
      localStorage.setItem('offlineRequests', JSON.stringify(offlineRequests));
      
      // Try to get cached response
      try {
        const cache = await caches.open('api-cache');
        const cachedResponse = await cache.match(`${API_URL}${endpoint}`);
        if (cachedResponse) {
          return { success: true, offline: true, data: await cachedResponse.json() };
        }
      } catch (error) {
        console.log('Cache access error:', error);
      }
      
      return { success: true, offline: true, message: 'Emergency alert saved offline' };
    }
    
    throw new Error('You are offline. Please check your connection.');
  }
  
  // Online - make actual API call
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options
    });
    
    // Cache successful GET responses
    if (options.method === 'GET' && response.ok) {
      const cache = await caches.open('api-cache');
      cache.put(`${API_URL}${endpoint}`, response.clone());
    }
    
    return response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

export default API_URL;