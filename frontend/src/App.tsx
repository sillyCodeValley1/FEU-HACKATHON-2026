import React, { useState } from 'react';
import { Bot, CircuitBoard, ShoppingCart, List, Zap, Cpu, Settings, MessageSquare, Send, Activity, Info } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Interfaces
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  bom?: any[];
  plan?: any[];
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am CircuitPal AI. What electronics project would you like to build today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'bom' | 'plan' | 'catalog'>('chat');

  // We'll keep track of the latest BOM and Plan for the dashboard tabs
  const latestBom = messages.slice().reverse().find(m => m.bom)?.bom || [];
  const latestPlan = messages.slice().reverse().find(m => m.plan)?.plan || [];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content })
      });
      const data = await res.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        bom: data.bom,
        plan: data.plan
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error fetching response:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Error: Could not reach the CircuitPal AI backend.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-bg-dark text-text-main font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-bg-sidebar border-r border-border-dark flex flex-col transition-all">
        <div className="p-4 flex items-center gap-2 border-b border-border-dark">
          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary">
            <CircuitBoard size={20} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">CircuitPal<span className="text-primary">.AI</span></h1>
        </div>
        
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <SidebarItem icon={<MessageSquare size={18} />} label="AI Chat" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
          <SidebarItem icon={<List size={18} />} label="Bill of Materials" active={activeTab === 'bom'} onClick={() => setActiveTab('bom')} badge={latestBom.length > 0 ? latestBom.length : undefined} />
          <SidebarItem icon={<Activity size={18} />} label="Project Plan" active={activeTab === 'plan'} onClick={() => setActiveTab('plan')} badge={latestPlan.length > 0 ? latestPlan.length : undefined} />
          <SidebarItem icon={<Cpu size={18} />} label="Component Catalog" active={activeTab === 'catalog'} onClick={() => setActiveTab('catalog')} />
        </nav>

        <div className="p-3 border-t border-border-dark">
          <SidebarItem icon={<Settings size={18} />} label="Settings" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative">
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col h-full">
            {/* Header */}
            <header className="h-14 border-b border-border-dark flex items-center px-6 bg-bg-dark/80 backdrop-blur-sm sticky top-0 z-10">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Bot className="text-primary" size={20} />
                Project Copilot
              </h2>
            </header>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
              {messages.map(msg => (
                <div key={msg.id} className={cn("flex gap-4 max-w-4xl mx-auto", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", msg.role === 'user' ? "bg-gray-700" : "bg-primary/20 text-primary")}>
                    {msg.role === 'user' ? <Zap size={16} /> : <Bot size={18} />}
                  </div>
                  <div className={cn("flex flex-col gap-2 max-w-[80%]", msg.role === 'user' ? "items-end" : "items-start")}>
                    <div className={cn("p-4 rounded-2xl", msg.role === 'user' ? "bg-bg-panel border border-border-dark rounded-tr-sm" : "bg-transparent")}>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                    
                    {msg.bom && msg.bom.length > 0 && (
                      <div className="bg-bg-panel border border-border-dark rounded-xl p-4 w-full mt-2 shadow-lg">
                        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-white">
                          <ShoppingCart size={16} className="text-primary" />
                          Suggested Components ({msg.bom.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {msg.bom.map((item, idx) => (
                            <span key={idx} className="px-3 py-1 bg-bg-dark border border-border-dark rounded-full text-xs flex items-center gap-2">
                              {item.name} <span className="text-primary">${item.price}</span>
                            </span>
                          ))}
                        </div>
                        <button onClick={() => setActiveTab('bom')} className="mt-4 text-xs text-primary hover:underline flex items-center gap-1">
                          View Full BOM <Zap size={12} />
                        </button>
                      </div>
                    )}

                    {msg.plan && msg.plan.length > 0 && (
                      <div className="bg-bg-panel border border-border-dark rounded-xl p-4 w-full mt-2 shadow-lg">
                        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-white">
                          <Activity size={16} className="text-primary" />
                          Project Roadmap
                        </div>
                        <div className="space-y-2">
                          {msg.plan.slice(0, 2).map((step, idx) => (
                            <div key={idx} className="flex gap-3 text-sm">
                              <span className="text-primary font-mono">{idx + 1}.</span>
                              <div>
                                <p className="font-medium text-gray-300">{step.phase}</p>
                                <p className="text-xs text-text-muted">{step.details}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <button onClick={() => setActiveTab('plan')} className="mt-4 text-xs text-primary hover:underline flex items-center gap-1">
                          View Full Plan <Zap size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4 max-w-4xl mx-auto">
                   <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                    <Bot size={18} />
                  </div>
                  <div className="p-4 flex gap-1 items-center">
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border-dark bg-bg-dark">
              <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-center">
                <input 
                  type="text" 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Describe the electronics project you want to build..." 
                  className="w-full bg-bg-panel border border-border-dark rounded-xl py-4 pl-4 pr-12 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm placeholder:text-text-muted shadow-sm"
                />
                <button 
                  type="submit" 
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 p-2 bg-primary hover:bg-primary-dark disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors flex items-center justify-center"
                >
                  <Send size={18} className={cn(input.trim() ? "translate-x-[-1px] translate-y-[1px]" : "")} />
                </button>
              </form>
              <div className="text-center mt-3 text-xs text-text-muted flex items-center justify-center gap-1">
                <Info size={12} /> CircuitPal AI can make mistakes. Verify component compatibility before purchasing.
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bom' && (
          <div className="flex-1 flex flex-col h-full overflow-y-auto p-8 max-w-5xl mx-auto w-full">
            <h2 className="text-2xl font-bold mb-2 text-white">Bill of Materials (BOM)</h2>
            <p className="text-text-muted mb-8">Auto-generated list of required components for your latest project.</p>
            
            {latestBom.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-border-dark rounded-xl bg-bg-panel/50">
                <ShoppingCart className="mx-auto text-text-muted mb-4" size={48} />
                <p className="text-lg">No BOM generated yet.</p>
                <p className="text-sm text-text-muted mt-2">Chat with the AI to generate a project and parts list.</p>
              </div>
            ) : (
              <div className="bg-bg-panel border border-border-dark rounded-xl overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-bg-dark border-b border-border-dark">
                      <th className="p-4 font-medium text-sm text-text-muted">Part Name</th>
                      <th className="p-4 font-medium text-sm text-text-muted">Category</th>
                      <th className="p-4 font-medium text-sm text-text-muted text-right">Price (Est.)</th>
                      <th className="p-4 font-medium text-sm text-text-muted text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestBom.map((item, idx) => (
                      <tr key={idx} className="border-b border-border-dark/50 hover:bg-white/5 transition-colors">
                        <td className="p-4 font-medium text-white flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-bg-dark flex items-center justify-center">
                            <Cpu size={16} className="text-primary" />
                          </div>
                          {item.name}
                        </td>
                        <td className="p-4 text-sm"><span className="px-2 py-1 bg-bg-dark rounded-md text-xs border border-border-dark">{item.category}</span></td>
                        <td className="p-4 text-right text-primary font-mono">${item.price.toFixed(2)}</td>
                        <td className="p-4 text-center">
                          <button className="text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors">Add to Cart</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-bg-dark">
                      <td colSpan={2} className="p-4 text-right font-semibold">Total Estimated Cost:</td>
                      <td className="p-4 text-right font-bold text-white text-lg font-mono">
                        ${latestBom.reduce((acc, item) => acc + item.price, 0).toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'plan' && (
          <div className="flex-1 flex flex-col h-full overflow-y-auto p-8 max-w-4xl mx-auto w-full">
            <h2 className="text-2xl font-bold mb-2 text-white">Project Planner</h2>
            <p className="text-text-muted mb-8">Step-by-step roadmap for building your hardware project.</p>
            
            {latestPlan.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-border-dark rounded-xl bg-bg-panel/50">
                <Activity className="mx-auto text-text-muted mb-4" size={48} />
                <p className="text-lg">No plan generated yet.</p>
              </div>
            ) : (
              <div className="relative border-l border-border-dark ml-4 space-y-8 pb-8">
                {latestPlan.map((step, idx) => (
                  <div key={idx} className="relative pl-8">
                    <div className="absolute -left-3 top-0.5 w-6 h-6 rounded-full bg-bg-dark border-2 border-primary flex items-center justify-center text-[10px] font-bold text-primary">
                      {idx + 1}
                    </div>
                    <div className="bg-bg-panel border border-border-dark rounded-xl p-5 shadow-sm hover:border-primary/50 transition-colors">
                      <h3 className="text-lg font-semibold text-white mb-2">{step.phase}</h3>
                      <p className="text-text-muted leading-relaxed">{step.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'catalog' && (
          <CatalogView />
        )}
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick, badge }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void, badge?: number }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
        active ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-white/5 hover:text-white"
      )}
    >
      <div className="flex items-center gap-3">
        {icon}
        {label}
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
          {badge}
        </span>
      )}
    </button>
  );
}

function CatalogView() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async (q = '') => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/catalog${q ? '?q=' + q : ''}`);
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

  return (
    <div className="flex-1 flex flex-col h-full p-8 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Component Catalog</h2>
          <p className="text-text-muted">Browse mock marketplace inventory</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input 
            type="text" 
            placeholder="Search components..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-bg-panel border border-border-dark rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary w-64"
          />
          <button type="submit" className="bg-bg-dark border border-border-dark px-4 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors">Search</button>
        </form>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-8">
          {items.map(item => (
            <div key={item.id} className="bg-bg-panel border border-border-dark rounded-xl p-5 flex flex-col hover:border-primary/50 transition-colors group">
              <div className="w-full h-32 bg-bg-dark rounded-lg mb-4 flex items-center justify-center text-border-dark group-hover:text-primary/20 transition-colors">
                <Cpu size={48} />
              </div>
              <div className="text-xs text-primary font-medium mb-1">{item.category}</div>
              <h3 className="font-semibold text-white mb-1 line-clamp-1">{item.name}</h3>
              <p className="text-xs text-text-muted mb-4 line-clamp-2 flex-1">{item.description}</p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-border-dark/50">
                <span className="font-mono text-lg text-white">${item.price.toFixed(2)}</span>
                <span className="text-xs text-text-muted">{item.stock} in stock</span>
              </div>
            </div>
          ))}
          {items.length === 0 && (
             <div className="col-span-full text-center py-12 text-text-muted">
               No components found matching "{search}".
             </div>
          )}
        </div>
      )}
    </div>
  );
}
