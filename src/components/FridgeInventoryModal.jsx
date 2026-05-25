import { useState } from 'react';
import { X, Plus, Minus, Trash2, Refrigerator, Thermometer, AlertTriangle, Apple, Milk, Beef, GlassWater, ShoppingBag } from 'lucide-react';
import { useDeviceStore } from '../store/deviceStore';

const DEFAULT_FRIDGE_ITEMS = [
  { name: "Organic Milk", qty: 1, unit: "Gallon", daysLeft: 4, category: "dairy" },
  { name: "Fresh Eggs", qty: 12, unit: "pcs", daysLeft: 9, category: "dairy" },
  { name: "Cheddar Cheese", qty: 1, unit: "Block", daysLeft: 15, category: "dairy" },
  { name: "Greek Yogurt", qty: 4, unit: "Cups", daysLeft: 6, category: "dairy" },
  { name: "Orange Juice", qty: 1, unit: "Bottle", daysLeft: 3, category: "beverage" },
  { name: "Gala Apples", qty: 6, unit: "pcs", daysLeft: 8, category: "produce" },
  { name: "Tomatoes", qty: 4, unit: "pcs", daysLeft: 5, category: "produce" },
  { name: "Chicken Breast", qty: 2, unit: "lbs", daysLeft: 2, category: "meat" }
];

const getCategoryIcon = (category) => {
  switch (category) {
    case 'dairy': return Milk;
    case 'produce': return Apple;
    case 'meat': return Beef;
    case 'beverage': return GlassWater;
    default: return ShoppingBag;
  }
};

const getExpiryStyles = (daysLeft) => {
  if (daysLeft <= 0) return { bg: 'bg-red-500/20 border-red-500/30 text-red-400', label: 'Expired' };
  if (daysLeft <= 2) return { bg: 'bg-red-400/10 border-red-400/20 text-red-400', label: `Expiring soon (${daysLeft}d)` };
  if (daysLeft <= 5) return { bg: 'bg-yellow-400/10 border-yellow-400/20 text-yellow-400', label: `${daysLeft} days left` };
  return { bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', label: `${daysLeft} days left` };
};

export default function FridgeInventoryModal({ device, onClose }) {
  const updateDeviceState = useDeviceStore(state => state.updateDeviceState);
  
  const id = device._id || device.id;
  const temp = device.state?.temp || 4;
  const items = device.state?.items || DEFAULT_FRIDGE_ITEMS;
  const isOn = device.state?.isOn ?? true;
  
  const [filter, setFilter] = useState('all');
  const [newItem, setNewItem] = useState({ name: '', qty: 1, unit: 'pcs', daysLeft: 7, category: 'dairy' });

  // Handle saving the full state back to store
  const saveItems = (updatedItems) => {
    updateDeviceState(id, { items: updatedItems });
  };

  // Adjust temperature
  const adjustTemp = (amount) => {
    const nextTemp = Math.max(1, Math.min(8, temp + amount));
    updateDeviceState(id, { temp: nextTemp });
  };

  // Quantity updates
  const updateQty = (index, delta) => {
    const updated = items.map((item, idx) => {
      if (idx === index) {
        return { ...item, qty: Math.max(1, item.qty + delta) };
      }
      return item;
    });
    saveItems(updated);
  };

  // Delete item
  const deleteItem = (index) => {
    const updated = items.filter((_, idx) => idx !== index);
    saveItems(updated);
  };

  // Add item
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;
    const updated = [...items, { ...newItem, qty: parseInt(newItem.qty) || 1, daysLeft: parseInt(newItem.daysLeft) || 7 }];
    saveItems(updated);
    setNewItem({ name: '', qty: 1, unit: 'pcs', daysLeft: 7, category: 'dairy' });
  };

  // Filtering
  const filteredItems = items.filter(item => filter === 'all' || item.category === filter);
  
  // Expiry alerts count
  const expiringCount = items.filter(item => item.daysLeft <= 2).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="glass-panel p-6 rounded-2xl w-full max-w-3xl border border-[#66fcf1]/30 relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#66fcf1]/10 border border-[#66fcf1]/20 text-[#66fcf1]">
              <Refrigerator size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{device.name}</h3>
              <p className="text-xs text-[#8892b0]">{device.location} · Smart Fridge Manager</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Dashboard: Temp & Expiration Alerts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl">
            <div className="flex items-center gap-2">
              <Thermometer className="text-[#66fcf1]" size={20} />
              <div>
                <span className="text-xs text-[#8892b0] block uppercase font-mono">Compartment Temp</span>
                <span className="text-xl font-mono text-white font-bold">{temp}°C</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => adjustTemp(-1)}
                disabled={!isOn}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus size={14} />
              </button>
              <button 
                onClick={() => adjustTemp(1)}
                disabled={!isOn}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-black/40 border border-white/5 rounded-xl">
            <div className={`p-2.5 rounded-lg flex items-center justify-center ${expiringCount > 0 ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <span className="text-xs text-[#8892b0] block uppercase font-mono">Expiration Status</span>
              <span className="text-sm font-semibold text-white">
                {expiringCount > 0 
                  ? `${expiringCount} item${expiringCount > 1 ? 's' : ''} expiring/expired!` 
                  : 'All items are fresh!'}
              </span>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-none">
          {['all', 'dairy', 'produce', 'meat', 'beverage', 'other'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border capitalize ${
                filter === cat
                  ? 'bg-[#66fcf1]/20 border-[#66fcf1]/50 text-[#66fcf1]'
                  : 'bg-black/30 border-white/5 text-[#8892b0] hover:border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Scrollable Inventory List */}
        <div className="flex-1 overflow-y-auto min-h-[220px] max-h-[350px] pr-1 space-y-2">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-[#8892b0] text-sm font-mono border border-dashed border-white/10 rounded-xl bg-black/20">
              No items found in this category.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const itemIndex = items.findIndex(i => i.name === item.name); // Find actual index in the store list
              const CatIcon = getCategoryIcon(item.category);
              const expiry = getExpiryStyles(item.daysLeft);

              return (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-3.5 bg-black/40 border border-white/5 rounded-xl hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-white">
                      <CatIcon size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">{item.name}</h4>
                      <p className="text-[11px] text-[#8892b0]">
                        Qty: {item.qty} {item.unit}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-md uppercase tracking-wide ${expiry.bg}`}>
                      {expiry.label}
                    </span>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg p-0.5">
                      <button 
                        onClick={() => updateQty(itemIndex, -1)}
                        className="w-6 h-6 rounded-md hover:bg-white/10 text-white flex items-center justify-center transition-colors"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="text-xs font-mono text-white font-semibold px-1 min-w-[16px] text-center">
                        {item.qty}
                      </span>
                      <button 
                        onClick={() => updateQty(itemIndex, 1)}
                        className="w-6 h-6 rounded-md hover:bg-white/10 text-white flex items-center justify-center transition-colors"
                      >
                        <Plus size={10} />
                      </button>
                    </div>

                    {/* Delete button */}
                    <button 
                      onClick={() => deleteItem(itemIndex)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add New Grocery Drawer */}
        <form onSubmit={handleAddItem} className="mt-4 pt-4 border-t border-white/10 space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Add Grocery Item</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
            <input 
              type="text" 
              placeholder="Item name..."
              value={newItem.name}
              onChange={e => setNewItem({ ...newItem, name: e.target.value })}
              className="col-span-2 md:col-span-2 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#66fcf1]/50"
            />
            <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-lg px-1 py-0.5">
              <input 
                type="number" 
                min="1"
                value={newItem.qty}
                onChange={e => setNewItem({ ...newItem, qty: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full bg-transparent border-none text-center text-xs text-white focus:outline-none"
              />
              <input 
                type="text" 
                placeholder="unit"
                value={newItem.unit}
                onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                className="w-8 bg-transparent border-none text-xs text-[#8892b0] focus:outline-none font-mono"
              />
            </div>
            <select
              value={newItem.category}
              onChange={e => setNewItem({ ...newItem, category: e.target.value })}
              className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="dairy" className="bg-[#100d1f]">Dairy</option>
              <option value="produce" className="bg-[#100d1f]">Produce</option>
              <option value="meat" className="bg-[#100d1f]">Meat</option>
              <option value="beverage" className="bg-[#100d1f]">Beverage</option>
              <option value="other" className="bg-[#100d1f]">Other</option>
            </select>
            <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5">
              <span className="text-[10px] text-[#8892b0] font-mono">Exp(d):</span>
              <input 
                type="number" 
                min="0"
                value={newItem.daysLeft}
                onChange={e => setNewItem({ ...newItem, daysLeft: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full bg-transparent border-none text-xs text-white focus:outline-none font-mono"
              />
            </div>
          </div>
          <button 
            type="submit"
            className="w-full py-2 bg-[#66fcf1]/10 hover:bg-[#66fcf1]/20 border border-[#66fcf1]/30 hover:border-[#66fcf1]/50 text-[#66fcf1] rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} /> Add to Fridge State
          </button>
        </form>

      </div>
    </div>
  );
}
