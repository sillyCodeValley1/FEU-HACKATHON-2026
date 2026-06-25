import React, { useState, useEffect } from 'react';
import { Cpu } from 'lucide-react';
import { API_BASE_URL } from '../config';

export function CatalogView() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async (q = '') => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/catalog${q ? '?q=' + q : ''}`);
      const data = await res.json();
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCatalog(search);
  };

  const inStockItems = items.filter(item => item.stock > 0);
  const outOfStockItems = items.filter(item => item.stock <= 0);

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">CircuitRocks Components</h2>
          <p className="text-text-muted">Browse CircuitRocks's available marketplace inventory</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input 
            type="text" 
            placeholder="Search components..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-bg-panel border border-border-dark rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary w-64 text-white"
          />
          <button type="submit" className="bg-bg-dark border border-border-dark px-4 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors text-white">Search</button>
        </form>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-12">
      {/* Available Components */}
      {inStockItems.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Available Components ({inStockItems.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {inStockItems.map(item => (
              <div key={item.id} className="bg-bg-panel border border-border-dark rounded-xl p-5 flex flex-col hover:border-primary/50 transition-colors group">
                <div className="w-full h-32 bg-bg-dark rounded-lg mb-4 flex items-center justify-center text-border-dark group-hover:text-primary/20 transition-colors border border-border-dark/50">
                  <Cpu size={48} />
                </div>
                <div className="text-xs text-primary font-medium mb-1 flex items-center justify-between">
                  <span>{item.category}</span>
                  {item.sku && <span className="font-mono text-[10px] text-text-muted">SKU: {item.sku}</span>}
                </div>
                <h3 className="font-semibold text-white mb-1 line-clamp-1">{item.name}</h3>
                <p className="text-xs text-text-muted mb-4 line-clamp-2 flex-1">{item.description}</p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-border-dark/50">
                  <span className="font-mono text-lg text-white font-bold">₱{item.price.toFixed(2)}</span>
                  <span className="text-xs text-green-400 font-medium bg-green-500/10 px-2 py-1 rounded-md border border-green-500/20">{item.stock} in stock</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unavailable Components */}
      {outOfStockItems.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Unavailable Components ({outOfStockItems.length})
          </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {outOfStockItems.map(item => (
                  <div key={item.id} className="bg-bg-panel border border-border-dark rounded-xl p-5 flex flex-col hover:border-primary/50 transition-colors group opacity-60">
                    <div className="w-full h-32 bg-bg-dark rounded-lg mb-4 flex items-center justify-center text-border-dark group-hover:text-primary/20 transition-colors border border-border-dark/50">
                      <Cpu size={48} />
                    </div>
                    <div className="text-xs text-primary font-medium mb-1 flex items-center justify-between">
                      <span>{item.category}</span>
                      {item.sku && <span className="font-mono text-[10px] text-text-muted">SKU: {item.sku}</span>}
                    </div>
                    <h3 className="font-semibold text-white mb-1 line-clamp-1">{item.name}</h3>
                    <p className="text-xs text-text-muted mb-4 line-clamp-2 flex-1">{item.description}</p>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-border-dark/50">
                      <span className="font-mono text-lg text-white font-bold">₱{item.price.toFixed(2)}</span>
                      <span className="text-xs text-red-400 font-medium bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">Out of stock</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {items.length === 0 && (
             <div className="col-span-full text-center py-12 text-text-muted border border-dashed border-border-dark rounded-xl bg-bg-panel/50">
               No components found matching "{search}".
             </div>
          )}
        </div>
      )}
    </div>
  );
}
