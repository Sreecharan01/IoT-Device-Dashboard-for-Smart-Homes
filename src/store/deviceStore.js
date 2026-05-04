import { create } from 'zustand';

export const useDeviceStore = create((set) => ({
  devices: [
    {
      id: 'd1',
      name: 'Living Room Light',
      type: 'light',
      location: 'Living Room',
      status: 'online',
      state: { isOn: false, brightness: 100 },
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
      state: { isOn: false, temp: 24 },
      connection: 'wifi',
      geofenceEnabled: false,
      satelliteSupport: false,
    }
  ],
  userLocation: { lat: 0, lng: 0 },
  homeLocation: { lat: 0, lng: 0 }, // Assuming home is at 0,0 for now
  distanceToHome: 5.0, // km
  
  toggleDevice: (id) => set((state) => ({
    devices: state.devices.map(device => {
      if (device.id === id) {
        if (device.type === 'light' || device.type === 'ac') {
          return { ...device, state: { ...device.state, isOn: !device.state.isOn } };
        }
        if (device.type === 'lock') {
          return { ...device, state: { ...device.state, isLocked: !device.state.isLocked } };
        }
      }
      return device;
    })
  })),

  updateDistance: (dist) => set((state) => {
    let newDevices = [...state.devices];
    
    // Auto-trigger geofence enabled devices if within 1.5km
    if (dist <= 1.5 && state.distanceToHome > 1.5) {
      newDevices = newDevices.map(d => {
        if (d.geofenceEnabled && d.status === 'online') {
          if (d.type === 'light' || d.type === 'ac') {
            return { ...d, state: { ...d.state, isOn: true } };
          }
          if (d.type === 'lock') {
            return { ...d, state: { ...d.state, isLocked: false } }; // Auto unlock
          }
        }
        return d;
      });
    }
    
    // Auto-turn off or lock if moving away > 1.5km
    if (dist > 1.5 && state.distanceToHome <= 1.5) {
      newDevices = newDevices.map(d => {
        if (d.geofenceEnabled && d.status === 'online') {
          if (d.type === 'light' || d.type === 'ac') {
            return { ...d, state: { ...d.state, isOn: false } };
          }
          if (d.type === 'lock') {
            return { ...d, state: { ...d.state, isLocked: true } }; // Auto lock
          }
        }
        return d;
      });
    }
    
    return { distanceToHome: dist, devices: newDevices };
  }),

  toggleGeofence: (id) => set((state) => ({
    devices: state.devices.map(d => d.id === id ? { ...d, geofenceEnabled: !d.geofenceEnabled } : d)
  }))
}));
