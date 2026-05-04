import { useState } from 'react';
import { ShieldAlert, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function AdminPanel() {
  const [requests, setRequests] = useState([
    { id: 'req1', name: 'Garage Camera', type: 'camera', user: 'admin@nexushome.io', status: 'pending' },
    { id: 'req2', name: 'Kids Room Light', type: 'light', user: 'guest@nexushome.io', status: 'pending' },
    { id: 'req3', name: 'Main Door Lock', type: 'lock', user: 'admin@nexushome.io', status: 'approved' },
  ]);

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('reqId', id);
  };

  const handleDrop = (e, newStatus) => {
    const id = e.dataTransfer.getData('reqId');
    setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  const columns = [
    { id: 'pending', title: 'Pending Validation', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { id: 'approved', title: 'Approved', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10' },
    { id: 'rejected', title: 'Rejected', icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
  ];

  return (
    <div className="space-y-8 h-[calc(100vh-8rem)] flex flex-col">
      <div>
        <h1 className="text-4xl font-heading font-bold text-white mb-2 flex items-center gap-3">
          <ShieldAlert className="text-[#aa3bff]" size={36} /> Admin Validation Panel
        </h1>
        <p className="text-[#8892b0]">Drag and drop device registration requests to approve or reject them.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
        {columns.map(col => {
          const Icon = col.icon;
          return (
            <div 
              key={col.id} 
              className="glass-panel rounded-2xl flex flex-col overflow-hidden border border-white/5"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className={`p-4 border-b border-white/5 flex items-center gap-2 ${col.bg}`}>
                <Icon className={col.color} size={20} />
                <h3 className="font-bold text-white">{col.title}</h3>
                <div className="ml-auto bg-black/40 px-2 py-0.5 rounded text-xs text-white font-mono">
                  {requests.filter(r => r.status === col.id).length}
                </div>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto space-y-3">
                {requests.filter(r => r.status === col.id).map(req => (
                  <div 
                    key={req.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, req.id)}
                    className="bg-black/40 border border-white/10 p-4 rounded-xl cursor-move hover:border-[#66fcf1]/50 hover:shadow-[0_0_15px_rgba(102,252,241,0.1)] transition-all"
                  >
                    <h4 className="font-bold text-white mb-1">{req.name}</h4>
                    <div className="flex justify-between items-center text-xs text-[#8892b0]">
                      <span className="capitalize px-2 py-1 bg-white/5 rounded">{req.type}</span>
                      <span>{req.user}</span>
                    </div>
                  </div>
                ))}
                {requests.filter(r => r.status === col.id).length === 0 && (
                  <div className="h-full flex items-center justify-center text-[#8892b0] text-sm border-2 border-dashed border-white/5 rounded-xl">
                    Drop cards here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
