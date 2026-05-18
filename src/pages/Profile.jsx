import { useState, useEffect } from 'react';
import { User, Zap, Home, DollarSign, Save } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Profile() {
  const { user, initAuth } = useAuthStore();
  const [formData, setFormData] = useState({
    electricityPrice: 0.15,
    homeSize: 1500,
    currency: 'USD'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        electricityPrice: user.electricityPrice || 0.15,
        homeSize: user.homeSize || 1500,
        currency: user.currency || 'USD'
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-update price to local average if currency changes
    if (name === 'currency') {
      let newPrice = formData.electricityPrice;
      if (value === 'INR') newPrice = 8.00;
      else if (value === 'EUR') newPrice = 0.25;
      else if (value === 'GBP') newPrice = 0.28;
      else if (value === 'USD') newPrice = 0.15;
      
      setFormData({ ...formData, currency: value, electricityPrice: newPrice });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo?.token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      // Update local storage and auth store
      const updatedInfo = { ...userInfo, ...data };
      localStorage.setItem('userInfo', JSON.stringify(updatedInfo));
      initAuth(); // Reload user state
      
      setMessage('Profile settings saved successfully!');
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
    setIsSaving(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-heading font-bold text-white mb-2 flex items-center gap-3">
          <User className="text-[#66fcf1]" size={36} /> Profile & Settings
        </h1>
        <p className="text-[#8892b0]">Configure your household details for accurate energy analytics.</p>
      </div>

      <div className="glass-panel p-8 rounded-2xl border border-white/5">
        <form onSubmit={handleSave} className="space-y-6">
          {message && (
            <div className={`p-4 rounded-lg text-sm font-medium ${message.includes('Error') ? 'bg-red-500/20 text-red-200 border border-red-500/50' : 'bg-green-500/20 text-green-200 border border-green-500/50'}`}>
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 relative">
              <label className="text-sm font-medium text-[#8892b0]">Electricity Unit Price</label>
              <div className="relative group glow-border rounded-lg transition-all duration-300">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Zap size={18} className="text-[#8892b0] group-focus-within:text-[#66fcf1] transition-colors" />
                </div>
                <input 
                  type="number"
                  step="0.01" 
                  name="electricityPrice"
                  value={formData.electricityPrice}
                  onChange={handleChange}
                  className="w-full bg-black/40 border border-[#66fcf1]/20 rounded-lg py-3 pl-11 pr-4 text-white focus:outline-none focus:border-[#66fcf1]/50 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2 relative">
              <label className="text-sm font-medium text-[#8892b0]">Currency</label>
              <div className="relative group glow-border rounded-lg transition-all duration-300">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <DollarSign size={18} className="text-[#8892b0] group-focus-within:text-[#66fcf1] transition-colors" />
                </div>
                <select 
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full bg-black/40 border border-[#66fcf1]/20 rounded-lg py-3 pl-11 pr-4 text-white focus:outline-none focus:border-[#66fcf1]/50 transition-colors appearance-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 relative">
              <label className="text-sm font-medium text-[#8892b0]">Home Size (sq ft)</label>
              <div className="relative group glow-border rounded-lg transition-all duration-300">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Home size={18} className="text-[#8892b0] group-focus-within:text-[#66fcf1] transition-colors" />
                </div>
                <input 
                  type="number" 
                  name="homeSize"
                  value={formData.homeSize}
                  onChange={handleChange}
                  className="w-full bg-black/40 border border-[#66fcf1]/20 rounded-lg py-3 pl-11 pr-4 text-white focus:outline-none focus:border-[#66fcf1]/50 transition-colors"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSaving}
            className="w-full md:w-auto flex items-center justify-center gap-2 mt-8 bg-gradient-to-r from-[#66fcf1] to-[#45a29e] hover:from-[#aa3bff] hover:to-[#8a2be2] text-black font-bold py-3 px-8 rounded-lg transition-all duration-500 shadow-[0_0_20px_rgba(102,252,241,0.4)] disabled:opacity-50"
          >
            <Save size={20} />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
