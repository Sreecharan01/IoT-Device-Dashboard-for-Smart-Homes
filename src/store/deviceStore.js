import { create } from 'zustand';

const defaultDevices = [
  {
    id: 'd1',
    name: 'Living Room Light',
    type: 'light',
    location: 'Living Room',
    status: 'online',
    state: { isOn: false, brightness: 80 },
    connection: 'wifi',
    geofenceEnabled: true,
    satelliteSupport: false,
  },
  {
    id: 'd2',
    name: 'Smart Thermostat',
    type: 'thermostat',
    location: 'Hallway',
    status: 'online',
    state: { temp: 22, mode: 'cool' },
    connection: 'wifi',
    geofenceEnabled: true,
    satelliteSupport: false,
  },
  {
    id: 'd3',
    name: 'Main Gate Lock',
    type: 'lock',
    location: 'Exterior',
    status: 'online',
    state: { isLocked: true },
    connection: 'satellite',
    geofenceEnabled: true,
    satelliteSupport: true,
  },
  {
    id: 'd4',
    name: 'Bedroom AC',
    type: 'ac',
    location: 'Bedroom',
    status: 'offline',
    state: { isOn: false, temp: 24, mode: 'cool' },
    connection: 'wifi',
    geofenceEnabled: false,
    satelliteSupport: false,
  },
  {
    id: 'd5',
    name: 'Kitchen Smart Fridge',
    type: 'fridge',
    location: 'Kitchen',
    status: 'online',
    state: { isOn: true, temp: 4 },
    connection: 'wifi',
    geofenceEnabled: false,
    satelliteSupport: false,
  },
  {
    id: 'd6',
    name: 'Living Room TV',
    type: 'tv',
    location: 'Living Room',
    status: 'online',
    state: { isOn: false, brightness: 35 },
    connection: 'wifi',
    geofenceEnabled: false,
    satelliteSupport: false,
  },
  {
    id: 'd7',
    name: 'Patio Security Camera',
    type: 'camera',
    location: 'Exterior',
    status: 'online',
    state: { isOn: true },
    connection: 'wifi',
    geofenceEnabled: false,
    satelliteSupport: true,
  },
  {
    id: 'd8',
    name: 'Robotic Vacuum',
    type: 'vacuum',
    location: 'Living Room',
    status: 'online',
    state: { isOn: false },
    connection: 'wifi',
    geofenceEnabled: false,
    satelliteSupport: false,
  },
  {
    id: 'd9',
    name: 'Backyard Sprinkler',
    type: 'sprinkler',
    location: 'Backyard',
    status: 'offline',
    state: { isOn: false },
    connection: 'wifi',
    geofenceEnabled: false,
    satelliteSupport: false,
  },
  {
    id: 'd10',
    name: 'Study Smart Speaker',
    type: 'audio',
    location: 'Study',
    status: 'online',
    state: { isOn: false, brightness: 50 },
    connection: 'wifi',
    geofenceEnabled: false,
    satelliteSupport: false,
  },
  {
    id: 'd11',
    name: 'Hallway Motion Sensor',
    type: 'sensor',
    location: 'Hallway',
    status: 'online',
    state: { isOn: true },
    connection: 'zigbee',
    geofenceEnabled: false,
    satelliteSupport: false,
  },
  {
    id: 'd12',
    name: 'Master Bedroom Plug',
    type: 'plug',
    location: 'Bedroom',
    status: 'online',
    state: { isOn: false },
    connection: 'zigbee',
    geofenceEnabled: false,
    satelliteSupport: false,
  }
];

// Haversine formula — returns distance in km between two lat/lng points
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const savedHome = (() => {
  try { return JSON.parse(localStorage.getItem('syncra_home_location')); } catch { return null; }
})();

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const useDeviceStore = create((set, get) => ({
  devices: [],
  userLocation: null,           // { lat, lng } — live GPS
  homeLocation: savedHome,      // { lat, lng } — saved home position
  distanceToHome: 5.0,          // km
  isTrackingGPS: false,

  setHomeLocation: (lat, lng) => {
    const loc = { lat, lng };
    localStorage.setItem('syncra_home_location', JSON.stringify(loc));
    set({ homeLocation: loc });
    // Immediately recalculate distance if we already have user location
    const { userLocation } = get();
    if (userLocation) {
      const dist = haversineDistance(userLocation.lat, userLocation.lng, lat, lng);
      get().updateDistance(dist);
    }
  },

  updateUserLocation: (lat, lng) => {
    set({ userLocation: { lat, lng }, isTrackingGPS: true });
    const { homeLocation } = get();
    if (homeLocation) {
      const dist = haversineDistance(lat, lng, homeLocation.lat, homeLocation.lng);
      get().updateDistance(dist);
    }
  },

  setTrackingGPS: (val) => set({ isTrackingGPS: val }),
  
  fetchDevices: async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token;
      if (!token) return;

      const res = await fetch(`${API_URL}/devices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.length === 0) {
        // Seed db
        for (const dev of defaultDevices) {
          await fetch(`${API_URL}/devices`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(dev)
          });
        }
        set({ devices: defaultDevices });
      } else {
        set({ devices: data });
      }
    } catch (error) {
      console.error('Error fetching devices', error);
      // Fallback to defaults
      set({ devices: defaultDevices });
    }
  },

  updateDeviceApi: async (id, updates) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token;
      if (!token) return;

      await fetch(`${API_URL}/devices/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
    } catch (error) {
      console.error('Error updating device', error);
    }
  },

  addDevice: async (newDevice) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token;
      if (!token) return;

      const res = await fetch(`${API_URL}/devices`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newDevice)
      });
      const data = await res.json();
      set((state) => ({ devices: [...state.devices, data] }));
    } catch (error) {
      console.error('Error adding device', error);
    }
  },

  removeDevice: async (id) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token;
      if (!token) return;

      await fetch(`${API_URL}/devices/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      set((state) => ({ devices: state.devices.filter(d => (d._id || d.id) !== id) }));
    } catch (error) {
      console.error('Error removing device', error);
    }
  },

  updateDeviceState: (id, newStateUpdate) => {
    set((state) => {
      const devices = state.devices.map(device => {
        if ((device._id || device.id) === id) {
          const updatedDevice = { ...device, state: { ...device.state, ...newStateUpdate } };
          get().updateDeviceApi(device.id, updatedDevice);
          return updatedDevice;
        }
        return device;
      });
      return { devices };
    });
  },

  toggleDevice: (id) => {
    set((state) => {
      const devices = state.devices.map(device => {
        if (device.id === id || device._id === id) {
          let updatedState = { ...device.state };
          if (['light', 'ac', 'tv', 'audio', 'thermostat', 'fridge', 'vacuum', 'sprinkler', 'plug', 'sensor'].includes(device.type)) {
            updatedState.isOn = !device.state.isOn;
          }
          if (device.type === 'lock') {
            updatedState.isLocked = !device.state.isLocked;
          }
          const updatedDevice = { ...device, state: updatedState };
          get().updateDeviceApi(id, updatedDevice);
          return updatedDevice;
        }
        return device;
      });
      return { devices };
    });
  },

  updateDistance: (dist) => {
    set((state) => {
      let changedDevices = [];
      let newDevices = state.devices.map(d => {
        let updated = false;
        let newState = { ...d.state };
        
        // Auto-trigger geofence enabled devices if within 1.5km
        if (dist <= 1.5 && state.distanceToHome > 1.5) {
          if (d.geofenceEnabled && d.status === 'online') {
            if (d.type === 'light' || d.type === 'ac') { newState.isOn = true; updated = true; }
            if (d.type === 'lock') { newState.isLocked = false; updated = true; }
          }
        }
        
        // Auto-turn off or lock if moving away > 1.5km
        if (dist > 1.5 && state.distanceToHome <= 1.5) {
          if (d.geofenceEnabled && d.status === 'online') {
            if (d.type === 'light' || d.type === 'ac') { newState.isOn = false; updated = true; }
            if (d.type === 'lock') { newState.isLocked = true; updated = true; }
          }
        }
        
        if (updated) {
          const updatedDevice = { ...d, state: newState };
          changedDevices.push(updatedDevice);
          return updatedDevice;
        }
        return d;
      });

      // Update API
      changedDevices.forEach(d => get().updateDeviceApi(d.id, d));
      
      return { distanceToHome: dist, devices: newDevices };
    });
  },

  toggleGeofence: (id) => {
    set((state) => {
      const devices = state.devices.map(d => {
        if (d.id === id) {
          const updatedDevice = { ...d, geofenceEnabled: !d.geofenceEnabled };
          get().updateDeviceApi(id, updatedDevice);
          return updatedDevice;
        }
        return d;
      });
      return { devices };
    });
  }
}));
