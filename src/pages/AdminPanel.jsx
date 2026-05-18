import { useState, useEffect } from 'react';
import { ShieldAlert, User, Laptop, Key } from 'lucide-react';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token;
      
      const [usersRes, devicesRes] = await Promise.all([
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/devices', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (!usersRes.ok || !devicesRes.ok) throw new Error('Failed to fetch admin data');
      
      const usersData = await usersRes.json();
      const devicesData = await devicesRes.json();
      
      setUsers(usersData);
      setDevices(devicesData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const updateSubscription = async (userId, subscription) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token;
      
      const res = await fetch(`/api/admin/users/${userId}/subscription`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ subscription })
      });
      
      if (res.ok) {
        setUsers(users.map(u => u._id === userId ? { ...u, subscription } : u));
      }
    } catch (error) {
      console.error('Failed to update subscription', error);
    }
  };

  if (loading) return <div className="text-[#8892b0] flex items-center justify-center h-64">Loading Admin Data...</div>;
  if (error) return <div className="text-red-400 bg-red-400/10 p-4 rounded-xl border border-red-400/20">{error}</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-heading font-bold text-white mb-2 flex items-center gap-3">
          <ShieldAlert className="text-[#aa3bff]" size={36} /> Admin Dashboard
        </h1>
        <p className="text-[#8892b0]">Manage users, their subscriptions, and monitor registered devices.</p>
      </div>

      <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-white/5">
          <User className="text-[#66fcf1]" size={24} />
          <h2 className="text-xl font-bold text-white">Registered Users & Subscriptions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-[#8892b0] text-sm">
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Subscription Plan</th>
                <th className="p-4 font-medium">Total Devices</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map(user => {
                const userDevices = devices.filter(d => d.userId?._id === user._id || d.userId === user._id);
                return (
                  <tr key={user._id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-white font-medium">{user.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs uppercase tracking-wider font-bold ${user.role === 'admin' ? 'bg-[#aa3bff]/20 text-[#aa3bff]' : 'bg-white/10 text-[#8892b0]'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <select 
                        value={user.subscription || 'free'}
                        onChange={(e) => updateSubscription(user._id, e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#66fcf1]/50 cursor-pointer"
                      >
                        <option value="free">Free Tier</option>
                        <option value="premium">Premium</option>
                        <option value="pro">Pro Plan</option>
                      </select>
                    </td>
                    <td className="p-4 text-[#8892b0]">
                      {userDevices.length}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-white/5">
          <Laptop className="text-[#66fcf1]" size={24} />
          <h2 className="text-xl font-bold text-white">All Devices in Network</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-[#8892b0] text-sm">
                <th className="p-4 font-medium">Device Name</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Location</th>
                <th className="p-4 font-medium">Owner (User)</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {devices.map(device => (
                <tr key={device._id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-white font-bold">{device.name}</td>
                  <td className="p-4">
                    <span className="bg-white/10 text-white px-2 py-1 rounded text-xs capitalize">{device.type}</span>
                  </td>
                  <td className="p-4 text-[#8892b0]">{device.location}</td>
                  <td className="p-4 text-[#66fcf1] text-sm">{device.userId?.email || 'Unknown'}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-red-500'}`}></div>
                      <span className="text-sm text-[#8892b0] capitalize">{device.status}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {devices.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-[#8892b0]">No devices registered in the network.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
