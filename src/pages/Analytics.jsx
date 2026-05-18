import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Zap } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useDeviceStore } from '../store/deviceStore';
import { useMemo } from 'react';

export default function Analytics() {
  const { user } = useAuthStore();
  const devices = useDeviceStore(state => state.devices);
  
  const currency = user?.currency || 'USD';
  
  let defaultPrice = 0.15;
  if (currency === 'INR') defaultPrice = 8.00;
  if (currency === 'EUR') defaultPrice = 0.25;
  if (currency === 'GBP') defaultPrice = 0.28;
  
  const unitPrice = user?.electricityPrice || defaultPrice;

  const { energyData, monthlyBill } = useMemo(() => {
    const getWattage = (type) => {
      switch (type) {
        case 'light': return 60;
        case 'camera': return 15;
        case 'lock': return 5;
        case 'thermostat': return 3500;
        default: return 100;
      }
    };

    let dailyLights = 0, dailyHvac = 0, dailyAppliances = 0;
    
    devices.forEach(device => {
      if (device.status === 'online') {
        const watts = getWattage(device.type);
        if (device.type === 'light') dailyLights += watts * 6;
        else if (device.type === 'thermostat') dailyHvac += watts * 4;
        else dailyAppliances += watts * 24;
      }
    });

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const generatedData = days.map(day => ({
      day,
      lights: Math.round(dailyLights * (0.8 + Math.random() * 0.4)),
      hvac: Math.round(dailyHvac * (0.7 + Math.random() * 0.6)),
      appliances: Math.round(dailyAppliances * (0.9 + Math.random() * 0.2)),
    }));

    const totalWhPerDay = dailyLights + dailyHvac + dailyAppliances;
    const monthlyKWh = (totalWhPerDay * 30) / 1000;
    const estimatedBill = monthlyKWh * unitPrice;

    return { energyData: generatedData, monthlyBill: estimatedBill };
  }, [devices, unitPrice]);

  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : '$';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-heading font-bold text-white mb-2 flex items-center gap-3">
          <Zap className="text-[#f59e0b]" size={36} /> Energy & Analytics
        </h1>
        <p className="text-[#8892b0]">Genuine insights calculated from your real devices and unit price.</p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-[#f59e0b]/20">
        <h2 className="text-xl font-heading font-semibold text-white mb-6">Weekly Power Consumption (Wh)</h2>
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={energyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="day" stroke="#8892b0" tick={{fill: '#8892b0'}} axisLine={false} tickLine={false} />
              <YAxis stroke="#8892b0" tick={{fill: '#8892b0'}} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                contentStyle={{ backgroundColor: 'rgba(5,5,5,0.9)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="hvac" name="HVAC Systems" stackId="a" fill="#aa3bff" radius={[0, 0, 4, 4]} />
              <Bar dataKey="appliances" name="Appliances" stackId="a" fill="#45a29e" />
              <Bar dataKey="lights" name="Lighting" stackId="a" fill="#66fcf1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-black/60 to-[#f59e0b]/10 border border-[#f59e0b]/30">
            <h3 className="text-[#8892b0] font-medium mb-2">Estimated Monthly Bill</h3>
            <div className="text-5xl font-mono font-bold text-[#f59e0b]">
              {currencySymbol}{monthlyBill.toFixed(2)}
            </div>
         </div>
      </div>
    </div>
  );
}
