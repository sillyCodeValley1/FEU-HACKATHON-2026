import React, { useState, useMemo } from 'react';
import { Bot, CircuitBoard, ShoppingCart, List, Zap, Cpu, Settings, MessageSquare, Send, Activity, Info, Folder, Archive, Plus, ArrowLeft, Trash2, Box, PanelLeftClose, PanelLeft, ExternalLink } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { API_BASE_URL } from './config';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Interfaces
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  bom?: any[];
  missing_components?: any[];
  plan?: any[];
}

interface Project {
  id: string;
  name: string;
  description: string;
  messages: Message[];
  bom: any[];
  missing_components: any[];
  plan: any[];
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
}

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [globalView, setGlobalView] = useState<'projects' | 'inventory' | 'catalog'>('projects');
  
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [projectTab, setProjectTab] = useState<'chat' | 'plan'>('chat');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');

  const currentProject = projects.find(p => p.id === activeProjectId);
  
  // Recent projects derived from projects list (could sort by a timestamp in a real app)
  const recentProjects = useMemo(() => {
    return [...projects].reverse().slice(0, 5);
  }, [projects]);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    
    const newProj: Project = {
      id: Date.now().toString(),
      name: newProjName,
      description: 'A new electronics project.',
      messages: [
        {
          id: '1',
          role: 'assistant',
          content: `Project "${newProjName}" initialized! What would you like to build? Describe your idea and I will generate the components and a step-by-step plan.`
        }
      ],
      bom: [],
      missing_components: [],
      plan: []
    };
    
    setProjects(prev => [...prev, newProj]);
    setShowCreateModal(false);
    setNewProjName('');
    setActiveProjectId(newProj.id);
    setProjectTab('chat');
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) setActiveProjectId(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeProjectId) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    
    // Optimistic update
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return { ...p, messages: [...p.messages, userMessage] };
      }
      return p;
    }));
    
    const sentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: sentInput })
      });
      const data = await res.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        bom: data.matched_components,
        missing_components: data.missing_components,
        plan: data.plan
      };
      
      setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            messages: [...p.messages, assistantMessage],
            // Update BOM and Plan if the AI returned new ones
            bom: data.matched_components && data.matched_components.length > 0 ? data.matched_components : p.bom,
            missing_components: data.missing_components && data.missing_components.length > 0 ? data.missing_components : p.missing_components,
            plan: data.plan && data.plan.length > 0 ? data.plan : p.plan
          };
        }
        return p;
      }));
    } catch (error) {
      console.error('Error fetching response:', error);
      setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            messages: [...p.messages, { id: Date.now().toString(), role: 'assistant', content: 'Error: Could not reach the CircuitPal AI backend.' }]
          };
        }
        return p;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-bg-dark text-text-main font-sans overflow-hidden">
      {/* Sidebar Overlay for Mobile (Optional, but good for ChatGPT style) */}
      {!sidebarOpen && (
        <div 
          className="fixed top-3 left-3 z-50 group"
          onMouseEnter={() => setSidebarOpen(true)}
        >
           <button 
             onClick={() => setSidebarOpen(true)}
             className="p-2 text-text-muted hover:text-white transition-colors rounded-lg hover:bg-white/10"
           >
             <PanelLeft size={20} />
           </button>
        </div>
      )}

      {/* Sidebar */}
      <aside className={cn(
        "bg-bg-sidebar border-r border-border-dark flex flex-col transition-all duration-300 ease-in-out shrink-0 h-full",
        sidebarOpen ? "w-[260px] translate-x-0" : "w-0 -translate-x-full opacity-0"
      )}
      onMouseLeave={() => setSidebarOpen(false)}
      >
        <div className="p-4 flex items-center justify-between whitespace-nowrap h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary shrink-0">
              <CircuitBoard size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">CircuitPal<span className="text-primary">.AI</span></h1>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="text-text-muted hover:text-white p-1.5 rounded-lg transition-colors hover:bg-white/10"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>
        
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden w-[260px]">
          <div className="text-xs font-semibold text-text-muted mb-2 px-3 mt-2 uppercase tracking-wider">Workspace</div>
          <SidebarItem 
            icon={<Folder size={18} />} 
            label="My Projects" 
            active={!activeProjectId && globalView === 'projects'} 
            onClick={() => { setActiveProjectId(null); setGlobalView('projects'); }} 
          />
          <SidebarItem 
            icon={<Archive size={18} />} 
            label="My Inventory" 
            active={!activeProjectId && globalView === 'inventory'} 
            onClick={() => { setActiveProjectId(null); setGlobalView('inventory'); }} 
          />
          <SidebarItem 
            icon={<Cpu size={18} />} 
            label="Component Catalog" 
            active={!activeProjectId && globalView === 'catalog'} 
            onClick={() => { setActiveProjectId(null); setGlobalView('catalog'); }} 
          />
          
          {recentProjects.length > 0 && (
            <div className="mt-6 mb-1">
              <div className="text-xs font-semibold text-text-muted mb-2 px-3 uppercase tracking-wider flex items-center gap-1">
                Recent Projects
              </div>
              <div className="space-y-0.5">
                {recentProjects.map(rp => (
                  <SidebarItem 
                    key={rp.id}
                    icon={<div className="w-2 h-2 rounded-full bg-primary/50" />} 
                    label={rp.name} 
                    active={activeProjectId === rp.id} 
                    onClick={() => { setActiveProjectId(rp.id); setProjectTab('chat'); }} 
                  />
                ))}
              </div>
            </div>
          )}
          
          {activeProjectId && currentProject && (
            <>
              <div className="text-xs font-semibold text-text-muted mb-2 px-3 mt-6 uppercase tracking-wider line-clamp-1">
                Active Project
              </div>
              <SidebarItem 
                icon={<MessageSquare size={18} />} 
                label="Copilot & BOM" 
                active={projectTab === 'chat'} 
                onClick={() => setProjectTab('chat')} 
              />
              <SidebarItem 
                icon={<Activity size={18} />} 
                label="Project Plan" 
                active={projectTab === 'plan'} 
                onClick={() => setProjectTab('plan')} 
              />
            </>
          )}
        </nav>

        <div className="p-3 border-t border-border-dark w-[260px]">
          <SidebarItem icon={<Settings size={18} />} label="Settings" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative">
        {activeProjectId && currentProject ? (
          // PROJECT DETAIL VIEW
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Project Header */}
            <header className="h-14 border-b border-border-dark flex items-center justify-between px-6 bg-bg-dark/80 backdrop-blur-sm z-10 shrink-0">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveProjectId(null)} className="text-text-muted hover:text-white transition-colors p-1 rounded-md hover:bg-white/5">
                  <ArrowLeft size={18} />
                </button>
                <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                  {currentProject.name}
                </h2>
              </div>
              <div className="flex bg-bg-panel p-1 rounded-lg">
                <button onClick={() => setProjectTab('chat')} className={cn("px-4 py-1.5 text-xs font-medium rounded-md transition-colors", projectTab === 'chat' ? "bg-bg-dark text-white shadow-sm" : "text-text-muted hover:text-white")}>
                  Copilot
                </button>
                <button onClick={() => setProjectTab('plan')} className={cn("px-4 py-1.5 text-xs font-medium rounded-md transition-colors", projectTab === 'plan' ? "bg-bg-dark text-white shadow-sm" : "text-text-muted hover:text-white")}>
                  Plan
                </button>
              </div>
            </header>

            {/* Project Tabs */}
            {projectTab === 'chat' && (
              <div className="flex-1 flex overflow-hidden">
                {/* Chat Area */}
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                    {currentProject.messages.map(msg => (
                      <div key={msg.id} className={cn("flex gap-4 max-w-3xl mx-auto w-full", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", msg.role === 'user' ? "bg-gray-700" : "bg-primary/20 text-primary")}>
                          {msg.role === 'user' ? <Zap size={16} /> : <Bot size={18} />}
                        </div>
                        <div className={cn("flex flex-col gap-2 max-w-[85%]", msg.role === 'user' ? "items-end" : "items-start")}>
                          <div className={cn("p-4 rounded-2xl", msg.role === 'user' ? "bg-bg-panel border border-border-dark rounded-tr-sm text-white" : "bg-transparent")}>
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          </div>
                          
                          {/* Inline BOM directly in chat */}
                          {msg.bom && msg.bom.length > 0 && (
                            <div className="bg-bg-panel border border-border-dark rounded-xl p-4 w-full mt-2 shadow-lg">
                              <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-white">
                                <ShoppingCart size={16} className="text-primary" />
                                Suggested Components ({msg.bom.length})
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {msg.bom.map((item, idx) => {
                                  const inInventory = inventory.find(i => i.name.toLowerCase() === item.name.toLowerCase());
                                  return (
                                    <span key={idx} className={cn("px-3 py-1 bg-bg-dark border rounded-full text-xs flex items-center gap-2", inInventory ? "border-green-500/50" : "border-border-dark")}>
                                      {item.name} 
                                      <span className="text-primary font-mono">₱{item.price}</span>
                                      {inInventory && <span className="w-1.5 h-1.5 rounded-full bg-green-500 ml-1" title="In Inventory"></span>}
                                    </span>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Inline Missing Components in chat */}
                          {msg.missing_components && msg.missing_components.length > 0 && (
                            <div className="bg-bg-panel border border-orange-500/30 rounded-xl p-4 w-full mt-2 shadow-lg">
                              <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-orange-400">
                                <Info size={16} />
                                External Components ({msg.missing_components.length})
                              </div>
                              <p className="text-xs text-text-muted mb-3">These items are not in the catalog, but you can buy them externally.</p>
                              <div className="flex flex-col gap-2">
                                {msg.missing_components.map((item, idx) => (
                                  <div key={idx} className="bg-bg-dark border border-orange-500/20 rounded-lg p-3 text-xs flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-white">{item.name}</span>
                                      {item.purchase_link && (
                                        <a 
                                          href={item.purchase_link} 
                                          target="_blank" 
                                          rel="noreferrer" 
                                          className="text-orange-400 hover:text-orange-300 flex items-center gap-1 font-medium transition-colors"
                                        >
                                          Buy <ExternalLink size={12} />
                                        </a>
                                      )}
                                    </div>
                                    <span className="text-text-muted opacity-80">{item.reason}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Inline Plan directly in chat */}
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
                              <button onClick={() => setProjectTab('plan')} className="mt-4 text-xs text-primary hover:underline flex items-center gap-1">
                                View Full Plan <ArrowLeft size={12} className="rotate-180" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-4 max-w-3xl mx-auto w-full">
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
                  
                  {/* Chat Input */}
                  <div className="p-4 border-t border-border-dark bg-bg-dark">
                    <form onSubmit={handleSend} className="max-w-3xl mx-auto relative flex items-center">
                      <input 
                        type="text" 
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Ask the copilot to add features or adjust components..." 
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
                  </div>
                </div>

                {/* BOM Side Panel */}
                <div className="w-80 bg-bg-sidebar border-l border-border-dark flex flex-col shrink-0">
                  <div className="p-4 border-b border-border-dark flex items-center gap-2 bg-bg-dark/50">
                    <List size={18} className="text-primary"/>
                    <h3 className="font-semibold text-white">Bill of Materials</h3>
                    <div className="ml-auto bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full font-bold">
                      {currentProject.bom.length + (currentProject.missing_components?.length || 0)} items
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {currentProject.bom.length === 0 && (!currentProject.missing_components || currentProject.missing_components.length === 0) ? (
                      <div className="text-center mt-10">
                        <Box className="mx-auto text-text-muted mb-3 opacity-50" size={32} />
                        <p className="text-sm text-text-muted">BOM is empty.</p>
                        <p className="text-xs text-text-muted mt-1 opacity-70">Describe your project to generate parts.</p>
                      </div>
                    ) : (
                      <>
                        {currentProject.bom.map((item, idx) => {
                          const inInventory = inventory.find(i => i.name.toLowerCase() === item.name.toLowerCase());
                          return (
                            <div key={idx} className="bg-bg-panel border border-border-dark rounded-lg p-3 shadow-sm relative overflow-hidden">
                              {inInventory && (
                                <div className="absolute top-0 right-0 bg-green-500/20 text-green-400 text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">
                                  In Inventory
                                </div>
                              )}
                              <div className="text-xs text-primary mb-1 font-medium">{item.category}</div>
                              <div className="font-semibold text-sm text-white leading-tight">{item.name}</div>
                              <div className="mt-3 flex items-center justify-between">
                                <div className="text-xs text-text-muted line-clamp-1 flex-1 mr-2">{item.description}</div>
                                <div className="font-mono text-sm text-primary font-bold">₱{item.price.toFixed(2)}</div>
                              </div>
                            </div>
                          )
                        })}

                        {currentProject.missing_components && currentProject.missing_components.length > 0 && (
                          <div className="pt-4 mt-4 border-t border-border-dark/50">
                            <h4 className="text-xs font-semibold text-orange-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                              <Info size={14} /> External Components
                            </h4>
                            <div className="space-y-3">
                              {currentProject.missing_components.map((item, idx) => (
                                <div key={idx} className="bg-bg-dark border border-orange-500/30 rounded-lg p-3 shadow-sm relative overflow-hidden">
                                  <div className="text-xs text-orange-400 mb-1 font-medium flex items-center justify-between">
                                    <span>Not in catalog</span>
                                    {item.purchase_link && (
                                      <a href={item.purchase_link} target="_blank" rel="noreferrer" className="text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors">
                                        Buy <ExternalLink size={10} />
                                      </a>
                                    )}
                                  </div>
                                  <div className="font-semibold text-sm text-white leading-tight">{item.name}</div>
                                  <div className="mt-2 text-xs text-text-muted opacity-80">{item.reason}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {currentProject.bom.length > 0 && (
                    <div className="p-4 border-t border-border-dark bg-bg-panel shrink-0">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-text-muted font-medium">Total Est. Cost</span>
                        <span className="font-mono text-white font-bold text-lg">
                          ₱{currentProject.bom.reduce((acc, i) => acc + i.price, 0).toFixed(2)}
                        </span>
                      </div>
                      <button className="w-full bg-primary hover:bg-primary-dark text-white rounded-lg py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                        <ShoppingCart size={16} /> Buy Now
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {projectTab === 'plan' && (
              <div className="flex-1 flex flex-col h-full overflow-y-auto p-8 max-w-4xl mx-auto w-full">
                <h2 className="text-2xl font-bold mb-2 text-white">Project Planner</h2>
                <p className="text-text-muted mb-8">Step-by-step roadmap for building "{currentProject.name}".</p>
                
                {currentProject.plan.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-border-dark rounded-xl bg-bg-panel/50">
                    <Activity className="mx-auto text-text-muted mb-4" size={48} />
                    <p className="text-lg">No plan generated yet.</p>
                    <p className="text-sm text-text-muted mt-2">Chat with the copilot to generate a roadmap.</p>
                  </div>
                ) : (
                  <div className="relative border-l border-border-dark ml-4 space-y-8 pb-8">
                    {currentProject.plan.map((step, idx) => (
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
          </div>
        ) : (
          // GLOBAL VIEWS
          <div className="flex-1 flex flex-col h-full overflow-y-auto">
            {globalView === 'projects' && (
              <div className="p-8 max-w-6xl mx-auto w-full">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">My Projects</h2>
                    <p className="text-text-muted">Manage your hardware builds and ideas.</p>
                  </div>
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
                  >
                    <Plus size={18} /> New Project
                  </button>
                </div>

                {projects.length === 0 ? (
                  <div className="min-h-full">
                    {/* Hero Section */}
                    <div className="relative overflow-hidden py-20 px-6">
                      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
                      <div className="max-w-6xl mx-auto relative z-10">
                        <div className="text-center mb-12">
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
                            <CircuitBoard size={16} />
                            <span>FEU Hackathon 2026 Project</span>
                          </div>
                          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                            Build Hardware <br />
                            <span className="text-primary">Smarter</span>
                          </h1>
                          <p className="text-xl text-text-muted max-w-2xl mx-auto mb-10">
                            CircuitPal.AI helps you design, plan, and manage your electronics projects with AI-powered assistance, automatic BOM generation, and step-by-step planning.
                          </p>
                          <div className="flex flex-wrap gap-4 justify-center">
                            <button 
                              onClick={() => setShowCreateModal(true)}
                              className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all shadow-lg shadow-primary/30 hover:shadow-primary/40 flex items-center gap-2"
                            >
                              <Plus size={20} />
                              Create Your First Project
                            </button>
                            <button 
                              onClick={() => setGlobalView('catalog')}
                              className="bg-bg-panel hover:bg-bg-dark border border-border-dark hover:border-primary/50 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all flex items-center gap-2"
                            >
                              <Cpu size={20} />
                              Browse Components
                            </button>
                          </div>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
                          <div className="bg-bg-panel border border-border-dark rounded-2xl p-8 hover:border-primary/50 hover:shadow-xl transition-all group">
                            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary/20 transition-colors">
                              <Bot size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">AI Copilot</h3>
                            <p className="text-text-muted leading-relaxed">
                              Describe your project idea and get instant AI-powered suggestions, component recommendations, and design guidance.
                            </p>
                          </div>

                          <div className="bg-bg-panel border border-border-dark rounded-2xl p-8 hover:border-primary/50 hover:shadow-xl transition-all group">
                            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary/20 transition-colors">
                              <ShoppingCart size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Auto BOM Generation</h3>
                            <p className="text-text-muted leading-relaxed">
                              Automatic bill of materials generation with pricing, inventory checking, and external purchase links.
                            </p>
                          </div>

                          <div className="bg-bg-panel border border-border-dark rounded-2xl p-8 hover:border-primary/50 hover:shadow-xl transition-all group">
                            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary/20 transition-colors">
                              <Activity size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Project Planning</h3>
                            <p className="text-text-muted leading-relaxed">
                              Step-by-step roadmaps and project plans generated automatically to guide your build process.
                            </p>
                          </div>
                        </div>

                        {/* Additional Features */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                          <div className="bg-bg-panel border border-border-dark rounded-2xl p-6 hover:border-primary/30 transition-all flex items-center gap-6">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                              <Archive size={24} />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-white mb-1">Inventory Management</h4>
                              <p className="text-text-muted text-sm">Track components you own and save money by reusing parts.</p>
                            </div>
                          </div>

                          <div className="bg-bg-panel border border-border-dark rounded-2xl p-6 hover:border-primary/30 transition-all flex items-center gap-6">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                              <List size={24} />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-white mb-1">Component Catalog</h4>
                              <p className="text-text-muted text-sm">Browse our extensive catalog of electronic components and parts.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {projects.map(p => (
                      <div 
                        key={p.id} 
                        onClick={() => { setActiveProjectId(p.id); setProjectTab('chat'); }}
                        className="bg-bg-panel border border-border-dark rounded-xl p-5 cursor-pointer hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all group flex flex-col h-48"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="w-10 h-10 rounded-lg bg-bg-dark flex items-center justify-center text-primary border border-border-dark group-hover:bg-primary/10 transition-colors">
                            <Cpu size={20} />
                          </div>
                          <button 
                            onClick={(e) => handleDeleteProject(p.id, e)}
                            className="text-text-muted hover:text-red-400 p-1.5 rounded-md hover:bg-bg-dark transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <h3 className="font-bold text-lg text-white mb-1 line-clamp-1">{p.name}</h3>
                        <p className="text-sm text-text-muted line-clamp-2 mb-4 flex-1">{p.description}</p>
                        <div className="flex items-center gap-3 text-xs font-medium text-text-muted pt-4 border-t border-border-dark/50">
                          <div className="flex items-center gap-1.5"><List size={14}/> {p.bom.length} Parts</div>
                          <div className="flex items-center gap-1.5"><Activity size={14}/> {p.plan.length} Steps</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {globalView === 'inventory' && (
              <InventoryView inventory={inventory} setInventory={setInventory} />
            )}

            {globalView === 'catalog' && (
              <CatalogView />
            )}
          </div>
        )}

        {/* Create Project Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-bg-panel border border-border-dark rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-border-dark">
                <h3 className="text-xl font-bold text-white">Create New Project</h3>
                <p className="text-sm text-text-muted mt-1">Give your hardware project a name to get started.</p>
              </div>
              <form onSubmit={handleCreateProject} className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-text-muted mb-2">Project Name</label>
                  <input 
                    type="text" 
                    value={newProjName}
                    onChange={e => setNewProjName(e.target.value)}
                    placeholder="e.g. Smart Plant Monitor, Robot Arm..."
                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={!newProjName.trim()}
                    className="bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary/20"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
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

function InventoryView({ inventory, setInventory }: { inventory: InventoryItem[], setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>> }) {
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

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Component Catalog</h2>
          <p className="text-text-muted">Browse mock marketplace inventory</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-bg-panel border border-border-dark rounded-xl p-5 flex flex-col hover:border-primary/50 transition-colors group">
              <div className="w-full h-32 bg-bg-dark rounded-lg mb-4 flex items-center justify-center text-border-dark group-hover:text-primary/20 transition-colors border border-border-dark/50">
                <Cpu size={48} />
              </div>
              <div className="text-xs text-primary font-medium mb-1">{item.category}</div>
              <h3 className="font-semibold text-white mb-1 line-clamp-1">{item.name}</h3>
              <p className="text-xs text-text-muted mb-4 line-clamp-2 flex-1">{item.description}</p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-border-dark/50">
                <span className="font-mono text-lg text-white font-bold">₱{item.price.toFixed(2)}</span>
                <span className="text-xs text-text-muted font-medium bg-bg-dark px-2 py-1 rounded-md border border-border-dark">{item.stock} in stock</span>
              </div>
            </div>
          ))}
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
