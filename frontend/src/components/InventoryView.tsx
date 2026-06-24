import React, { useState } from 'react';
import { Plus, Archive, Box, Trash2 } from 'lucide-react';
import type { InventoryItem } from '../types';

export function InventoryView({ inventory, setInventory }: { inventory: InventoryItem[], setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>> }) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    // Check if item already exists to merge quantities
    const existingIdx = inventory.findIndex(i => i.name.toLowerCase() === name.trim().toLowerCase());
    if (existingIdx >= 0) {
      const newInv = [...inventory];
      newInv[existingIdx].quantity += Number(quantity);
      setInventory(newInv);
    } else {
      setInventory([...inventory, { id: Date.now().toString(), name: name.trim(), quantity: Number(quantity) }]);
    }
    
    setName('');
    setQuantity(1);
  };

  const handleRemove = (id: string) => {
    setInventory(inventory.filter(i => i.id !== id));
  };

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">My Inventory</h2>
        <p className="text-text-muted">Keep track of the components you already own. The AI will prioritize these when making recommendations.</p>
      </div>

      <div className="bg-bg-panel border border-border-dark rounded-xl p-6 mb-8 shadow-sm">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Plus size={16} className="text-primary"/> Add Component to Inventory
        </h3>
        <form onSubmit={handleAdd} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-text-muted mb-1.5">Component Name</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Arduino Uno, 10k Resistor..." 
              className="w-full bg-bg-dark border border-border-dark rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors text-white"
            />
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-text-muted mb-1.5">Quantity</label>
            <input 
              type="number" 
              min="1"
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              className="w-full bg-bg-dark border border-border-dark rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors text-white"
            />
          </div>
          <button 
            type="submit" 
            disabled={!name.trim()}
            className="bg-bg-dark border border-border-dark hover:border-primary hover:text-primary disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors h-[42px]"
          >
            Add Item
          </button>
        </form>
      </div>

      <div className="bg-bg-panel border border-border-dark rounded-xl overflow-hidden shadow-sm">
        {inventory.length === 0 ? (
          <div className="text-center py-12">
            <Archive className="mx-auto text-border-dark mb-3" size={32} />
            <p className="text-sm text-text-muted">Your inventory is empty.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-dark border-b border-border-dark">
                <th className="p-4 font-medium text-xs text-text-muted uppercase tracking-wider">Component Name</th>
                <th className="p-4 font-medium text-xs text-text-muted uppercase tracking-wider w-32 text-center">Quantity</th>
                <th className="p-4 font-medium text-xs text-text-muted uppercase tracking-wider w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.id} className="border-b border-border-dark/50 hover:bg-white/5 transition-colors group">
                  <td className="p-4 font-medium text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-bg-dark flex items-center justify-center border border-border-dark">
                      <Box size={14} className="text-primary" />
                    </div>
                    {item.name}
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center justify-center bg-bg-dark border border-border-dark rounded-md px-3 py-1 text-sm font-mono text-white">
                      {item.quantity}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleRemove(item.id)}
                      className="text-text-muted hover:text-red-400 p-2 rounded-md hover:bg-bg-dark transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove from inventory"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
