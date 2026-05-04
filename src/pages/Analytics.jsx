import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Zap } from 'lucide-react';

const energyData = [
  { day: 'Mon', lights: 4000, hvac: 2400, appliances: 2400 },
  { day: 'Tue', lights: 3000, hvac: 1398, appliances: 2210 },
  { day: 'Wed', lights: 2000, hvac: 9800, appliances: 2290 },
  { day: 'Thu', lights: 2780, hvac: 3908, appliances: 2000 },
  { day: 'Fri', lights: 1890, hvac: 4800, appliances: 2181 },
  { day: 'Sat', lights: 2390, hvac: 3800, appliances: 2500 },
  { day: 'Sun', lights: 3490, hvac: 4300, appliances: 2100 },
];

export default function Analytics() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-heading font-bold text-white mb-2 flex items-center gap-3">
          <Zap className="text-[#f59e0b]" size={36} /> Energy & Analytics
        </h1>
        <p className="text-[#8892b0]">Comprehensive insights into your smart home energy consumption.</p>
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
            <div className="text-5xl font-mono font-bold text-[#f59e0b]">$142.50</div>
         </div>
      </div>
    </div>
  );
}
