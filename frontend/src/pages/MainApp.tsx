import React, { useState, useMemo, useEffect } from 'react';
import { Bot, CircuitBoard, ShoppingCart, List, Zap, Cpu, Settings, MessageSquare, Send, Activity, Info, Folder, Archive, Plus, ArrowLeft, Trash2, Box, PanelLeftClose, PanelLeft, ExternalLink, Sparkles, RefreshCw, Sun, Moon } from 'lucide-react';
import { cn } from '../utils/cn';
import { API_BASE_URL } from '../config';
import type { Message, Project, InventoryItem, ProjectRecommendation } from '../types';
import { SidebarItem } from '../components/SidebarItem';
import { InventoryView } from '../components/InventoryView';
import { CatalogView } from '../components/CatalogView';

export default function MainApp() {
  // Load from localStorage on mount
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('circuitpal-projects');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    const saved = localStorage.getItem('circuitpal-active-project');
    return saved || null;
  });
  const [globalView, setGlobalView] = useState<'projects' | 'inventory' | 'catalog'>('projects');
  
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('circuitpal-inventory');
    return saved ? JSON.parse(saved) : [];
  });
  const [recommendations, setRecommendations] = useState<ProjectRecommendation[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const [projectTab, setProjectTab] = useState<'chat' | 'plan'>('chat');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Selected BOM items state
  const [selectedBomItems, setSelectedBomItems] = useState<Record<string, Set<number>>>(() => {
    const saved = localStorage.getItem('circuitpal-selected-boms');
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    const result: Record<string, Set<number>> = {};
    Object.keys(parsed).forEach(key => {
      result[key] = new Set(parsed[key]);
    });
    return result;
  });
  // Track completed plan steps for each project
  const [completedSteps, setCompletedSteps] = useState<Record<string, Set<number>>>(() => {
    const saved = localStorage.getItem('circuitpal-completed-steps');
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    const result: Record<string, Set<number>> = {};
    Object.keys(parsed).forEach(key => {
      result[key] = new Set(parsed[key]);
    });
    return result;
  });
  // Track which messages' BOMs are folded
  const [foldedBoms, setFoldedBoms] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('circuitpal-folded-boms');
    return saved ? JSON.parse(saved) : {};
  });

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  // Save to localStorage whenever relevant state changes
  useEffect(() => {
    localStorage.setItem('circuitpal-projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem('circuitpal-active-project', activeProjectId);
    } else {
      localStorage.removeItem('circuitpal-active-project');
    }
  }, [activeProjectId]);

  useEffect(() => {
    localStorage.setItem('circuitpal-inventory', JSON.stringify(inventory));
  }, [inventory]);

  // Save selected BOMs to localStorage
  useEffect(() => {
    const toSave: Record<string, number[]> = {};
    Object.keys(selectedBomItems).forEach(key => {
      toSave[key] = Array.from(selectedBomItems[key]);
    });
    localStorage.setItem('circuitpal-selected-boms', JSON.stringify(toSave));
  }, [selectedBomItems]);

  // Save completed steps to localStorage
  useEffect(() => {
    const toSave: Record<string, number[]> = {};
    Object.keys(completedSteps).forEach(key => {
      toSave[key] = Array.from(completedSteps[key]);
    });
    localStorage.setItem('circuitpal-completed-steps', JSON.stringify(toSave));
  }, [completedSteps]);

  // Save folded BOMs to localStorage
  useEffect(() => {
    localStorage.setItem('circuitpal-folded-boms', JSON.stringify(foldedBoms));
  }, [foldedBoms]);

  // Apply theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');

  const currentProject = projects.find(p => p.id === activeProjectId);
  
  // Recent projects derived from projects list (could sort by a timestamp in a real app)
  const recentProjects = useMemo(() => {
    return [...projects].reverse().slice(0, 5);
  }, [projects]);

  const generateRecommendations = async () => {
    if (inventory.length === 0) return;
    setLoadingRecs(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventory })
      });
      const data = await res.json();
      setRecommendations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleCreateFromRecommendation = async (rec: ProjectRecommendation) => {
    const newProjId = Date.now().toString();
    const initMessage = `Project "${rec.name}" initialized! Based on your inventory, you can build this, but you might need ${rec.missing_count > 0 ? `${rec.missing_count} more parts (${rec.missing_parts.join(', ')})` : 'no additional parts'}. Generating your Bill of Materials and step-by-step plan...`;
    
    const newProj: Project = {
      id: newProjId,
      name: rec.name,
      description: rec.description,
      messages: [
        {
          id: '1',
          role: 'assistant',
          content: initMessage
        }
      ],
      bom: [],
      missing_components: [],
      plan: []
    };
    
    setProjects(prev => [newProj, ...prev]);
    setActiveProjectId(newProj.id);
    setProjectTab('chat');
    
    // Remove the selected recommendation from the list
    setRecommendations(prev => prev.filter(r => r.name !== rec.name));

    // Auto-trigger generation for BOM and Plan
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `I want to build a ${rec.name}. ${rec.description}`, inventory })
      });
      const data = await res.json();
      
      setProjects(prev => prev.map(p => {
        if (p.id === newProjId) {
          const hasNewBom = data.matched_components && data.matched_components.length > 0;
          const hasNewPlan = data.plan && data.plan.length > 0;
          
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.reply,
            bom: data.matched_components,
            missing_components: data.missing_components,
            plan: data.plan,
            hasProposedChanges: hasNewBom || hasNewPlan,
            isApplied: true, // Auto-apply for recommended projects
            isRejected: false
          };

          if (hasNewBom) {
            setSelectedBomItems(prevSelected => {
              const projectSelections = new Set(prevSelected[newProjId] || []);
              data.matched_components.forEach((item: any, idx: number) => {
                const inInv = findInInventory(item.name);
                if (!inInv) {
                  projectSelections.add(idx);
                }
              });
              return { ...prevSelected, [newProjId]: projectSelections };
            });
          }

          return {
            ...p,
            messages: [...p.messages, assistantMessage],
            bom: hasNewBom ? data.matched_components : p.bom,
            missing_components: data.missing_components && data.missing_components.length > 0 ? data.missing_components : p.missing_components,
            plan: hasNewPlan ? data.plan : p.plan
          };
        }
        return p;
      }));
    } catch (error) {
      console.error('Error fetching auto-response:', error);
      setProjects(prev => prev.map(p => {
        if (p.id === newProjId) {
          return {
            ...p,
            messages: [...p.messages, { id: Date.now().toString(), role: 'assistant', content: 'Error: Could not automatically generate the BOM and Plan.' }]
          };
        }
        return p;
      }));
    } finally {
      setIsLoading(false);
    }
  };

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

  // Helper to check if an item is in inventory
  const findInInventory = (itemName: string) => {
    if (!itemName) return undefined;
    const normalizedItem = itemName.toLowerCase();
    return inventory.find(i => {
      const invName = i.name.toLowerCase();
      if (normalizedItem.includes(invName) || invName.includes(normalizedItem)) return true;
      
      const invWords = invName.split(/\s+/).filter(w => w.length > 2);
      if (invWords.length > 0 && invWords.every(w => normalizedItem.includes(w))) return true;
      
      return false;
    });
  };

  const handleApplyChanges = (messageId: string) => {
    if (!activeProjectId) return;
    
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        const msg = p.messages.find(m => m.id === messageId);
        if (!msg) return p;

        const newBom = msg.bom && msg.bom.length > 0 ? msg.bom : p.bom;
        
        // Auto-select for newly applied BOM
        if (newBom !== p.bom && newBom.length > 0) {
          setSelectedBomItems(prevSelected => {
            const projectSelections = new Set(prevSelected[activeProjectId] || []);
            newBom.forEach((item: any, idx: number) => {
              const inInv = findInInventory(item.name);
              if (!inInv) {
                projectSelections.add(idx);
              }
            });
            return { ...prevSelected, [activeProjectId]: projectSelections };
          });
        }

        return {
          ...p,
          messages: p.messages.map(m => m.id === messageId ? { ...m, isApplied: true, isRejected: false } : m),
          bom: newBom,
          missing_components: msg.missing_components && msg.missing_components.length > 0 ? msg.missing_components : p.missing_components,
          plan: msg.plan && msg.plan.length > 0 ? msg.plan : p.plan
        };
      }
      return p;
    }));
  };

  const handleRejectChanges = (messageId: string) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          messages: p.messages.map(m => m.id === messageId ? { ...m, isRejected: true, isApplied: false } : m)
        };
      }
      return p;
    }));
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
        body: JSON.stringify({ message: sentInput, inventory })
      });
      const data = await res.json();
      
      setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
          const hasNewBom = data.matched_components && data.matched_components.length > 0;
          const hasNewPlan = data.plan && data.plan.length > 0;
          const isInitial = p.bom.length === 0 && p.plan.length === 0;
          
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.reply,
            bom: data.matched_components,
            missing_components: data.missing_components,
            plan: data.plan,
            hasProposedChanges: hasNewBom || hasNewPlan,
            isApplied: isInitial,
            isRejected: false
          };

          // If it's the first time generating BOM/Plan, auto-apply it.
          // Otherwise, don't update BOM/Plan yet.
          if (isInitial && hasNewBom) {
            setSelectedBomItems(prevSelected => {
              const projectSelections = new Set(prevSelected[activeProjectId] || []);
              data.matched_components.forEach((item: any, idx: number) => {
                const inInv = findInInventory(item.name);
                if (!inInv) {
                  projectSelections.add(idx);
                }
              });
              return { ...prevSelected, [activeProjectId]: projectSelections };
            });
          }

          return {
            ...p,
            messages: [...p.messages, assistantMessage],
            bom: isInitial && hasNewBom ? data.matched_components : p.bom,
            missing_components: isInitial && (data.missing_components && data.missing_components.length > 0) ? data.missing_components : p.missing_components,
            plan: isInitial && hasNewPlan ? data.plan : p.plan
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
      {/* Sidebar */}
      <aside className={cn(
        "bg-bg-sidebar border-r border-border-dark flex flex-col transition-all duration-300 ease-in-out shrink-0 h-full",
        sidebarOpen ? "w-[260px]" : "w-[68px]"
      )}
      >
        <div className={cn("p-4 flex items-center h-14 relative gap-2", sidebarOpen ? "justify-between" : "justify-center")}>
          <a href="/" className={cn("flex items-center gap-2 overflow-hidden transition-opacity duration-200 hover:opacity-80 cursor-pointer", sidebarOpen ? "opacity-100" : "opacity-0 absolute pointer-events-none")}>
            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary shrink-0">
              <CircuitBoard size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white whitespace-nowrap">CircuitPal<span className="text-primary">.AI</span></h1>
          </a>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={cn("text-text-muted hover:text-white p-1.5 rounded-lg transition-colors hover:bg-white/10 shrink-0", !sidebarOpen && "absolute right-4")}
            >
              {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={20} />}
            </button>
          </div>
        </div>
        
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden w-full">
          <div className={cn("text-xs font-semibold text-text-muted mb-2 mt-2 uppercase tracking-wider transition-all duration-200 whitespace-nowrap", sidebarOpen ? "px-3 opacity-100" : "opacity-0 h-0 overflow-hidden mt-0 mb-0")}>
            Workspace
          </div>
          <SidebarItem 
            icon={<Folder size={18} />} 
            label="My Projects" 
            active={!activeProjectId && globalView === 'projects'} 
            onClick={() => { setActiveProjectId(null); setGlobalView('projects'); }} 
            collapsed={!sidebarOpen}
          />
          <SidebarItem 
            icon={<Archive size={18} />} 
            label="My Inventory" 
            active={!activeProjectId && globalView === 'inventory'} 
            onClick={() => { setActiveProjectId(null); setGlobalView('inventory'); }} 
            collapsed={!sidebarOpen}
          />
          <SidebarItem 
            icon={<Cpu size={18} />} 
            label="CircuitRocks Components" 
            active={!activeProjectId && globalView === 'catalog'} 
            onClick={() => { setActiveProjectId(null); setGlobalView('catalog'); }} 
            collapsed={!sidebarOpen}
          />
          <a 
            href="https://circuit.rocks/" 
            target="_blank" 
            rel="noreferrer"
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-white hover:bg-white/10 transition-colors mt-1 group",
              !sidebarOpen && "justify-center"
            )}
            title="Visit CircuitRocks Store"
          >
            <ExternalLink size={18} className="group-hover:text-primary transition-colors" />
            {sidebarOpen && (
              <span className="flex-1 flex items-center justify-between">
                CircuitRocks Store
              </span>
            )}
          </a>
          
          {recentProjects.length > 0 && (
            <div className="mt-6 mb-1">
              <div className={cn("text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider flex items-center gap-1 transition-all duration-200 whitespace-nowrap", sidebarOpen ? "px-3 opacity-100" : "opacity-0 h-0 overflow-hidden mb-0")}>
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
                    collapsed={!sidebarOpen}
                  />
                ))}
              </div>
            </div>
          )}
          
          {activeProjectId && currentProject && (
            <>
              <div className={cn("text-xs font-semibold text-text-muted mt-6 uppercase tracking-wider line-clamp-1 transition-all duration-200 whitespace-nowrap", sidebarOpen ? "mb-2 px-3 opacity-100" : "opacity-0 h-0 overflow-hidden mt-0 mb-0")}>
                Active Project
              </div>
              <SidebarItem 
                icon={<MessageSquare size={18} />} 
                label="Copilot & BOM" 
                active={projectTab === 'chat'} 
                onClick={() => setProjectTab('chat')} 
                collapsed={!sidebarOpen}
              />
              <SidebarItem 
                icon={<Activity size={18} />} 
                label="Project Plan" 
                active={projectTab === 'plan'} 
                onClick={() => setProjectTab('plan')} 
                collapsed={!sidebarOpen}
              />
            </>
          )}
        </nav>

        <div className="p-3 border-t border-border-dark w-full space-y-1">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-white hover:bg-white/10 transition-colors",
              !sidebarOpen && "justify-center"
            )}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            {sidebarOpen && (
              <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
            )}
          </button>
          <SidebarItem icon={<Settings size={18} />} label="Settings" collapsed={!sidebarOpen} />
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
              <div className="flex items-center gap-4">
                <div className="flex bg-bg-panel p-1 rounded-lg">
                  <button onClick={() => setProjectTab('chat')} className={cn("px-4 py-1.5 text-xs font-medium rounded-md transition-colors", projectTab === 'chat' ? "bg-bg-dark text-white shadow-sm" : "text-text-muted hover:text-white")}>
                    Copilot
                  </button>
                  <button onClick={() => setProjectTab('plan')} className={cn("px-4 py-1.5 text-xs font-medium rounded-md transition-colors", projectTab === 'plan' ? "bg-bg-dark text-white shadow-sm" : "text-text-muted hover:text-white")}>
                    Plan
                  </button>
                </div>
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
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                                  <ShoppingCart size={16} className="text-primary" />
                                  Suggested Components ({msg.bom.length})
                                </div>
                                {msg.bom.length > 3 && (
                                  <button
                                    onClick={() => setFoldedBoms(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                                    className="text-text-muted hover:text-white text-xs flex items-center gap-1 transition-colors"
                                  >
                                    {foldedBoms[msg.id] ? 'Show less' : `Show all (${msg.bom.length - 3} more)`}
                                  </button>
                                )}
                              </div>
                              <div className="relative">
                                <div 
                                  className={cn(
                                    "flex flex-col gap-2 overflow-hidden transition-all duration-300 ease-in-out",
                                    !foldedBoms[msg.id] && msg.bom.length > 3 ? "max-h-[110px]" : "max-h-[1000px]"
                                  )}
                                >
                                  {msg.bom.slice().sort((a, b) => {
                                    const aOwned = findInInventory(a.name) ? 1 : 0;
                                    const bOwned = findInInventory(b.name) ? 1 : 0;
                                    return bOwned - aOwned; // Sort owned items first
                                  }).map((item, idx) => {
                                    const inInventory = findInInventory(item.name);
                                    return (
                                      <div key={idx} className={cn("px-3 py-2 bg-bg-dark border rounded-lg text-xs flex items-center justify-between w-full gap-2", inInventory ? "border-green-500/50" : "border-border-dark")}>
                                        <div className="flex items-center gap-2 overflow-hidden">
                                          <span className="font-medium text-white truncate">{item.name}</span>
                                          {item.sku && <span className="font-mono text-text-muted text-[10px] shrink-0">[{item.sku}]</span>}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          {item.stock !== undefined && (
                                            <span className={cn(
                                              "text-[10px] px-1.5 py-0.5 rounded-sm",
                                              item.stock > 0 ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"
                                            )}>
                                              {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
                                            </span>
                                          )}
                                          {inInventory && <span className="text-[10px] text-green-400 flex items-center gap-1 bg-green-500/10 px-1.5 py-0.5 rounded-sm" title="In Inventory">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                            own {inInventory.quantity}
                                          </span>}
                                          <span className="text-primary font-mono font-semibold ml-2">₱{item.price}</span>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                                {!foldedBoms[msg.id] && msg.bom.length > 3 && (
                                  <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-bg-panel to-transparent pointer-events-none" />
                                )}
                              </div>
                            </div>
                          )}

                          {/* Inline Missing Components in chat */}
                          {msg.missing_components && msg.missing_components.filter(item => !findInInventory(item.name)).length > 0 && (
                            <div className="bg-bg-panel border border-orange-500/30 rounded-xl p-4 w-full mt-2 shadow-lg">
                              <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-orange-400">
                                <Info size={16} />
                                External Components ({msg.missing_components.filter(item => !findInInventory(item.name)).length})
                              </div>
                              <p className="text-xs text-text-muted mb-3">These items are not in CircuitRocks, but you can buy them externally.</p>
                              <div className="flex flex-col gap-2">
                                {msg.missing_components.filter(item => !findInInventory(item.name)).map((item, idx) => (
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

                          {/* Accept/Reject Buttons */}
                          {msg.hasProposedChanges && !msg.isApplied && !msg.isRejected && (
                            <div className="flex items-center gap-3 mt-3">
                              <button 
                                onClick={() => handleApplyChanges(msg.id)}
                                className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary/20"
                              >
                                Accept Updates
                              </button>
                              <button 
                                onClick={() => handleRejectChanges(msg.id)}
                                className="bg-bg-panel hover:bg-bg-dark border border-border-dark text-text-muted hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                          
                          {msg.isApplied && msg.hasProposedChanges && (
                            <div className="mt-2 text-xs font-medium text-green-400 flex items-center gap-1.5 bg-green-500/10 px-3 py-1.5 rounded-md border border-green-500/20">
                              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                              Updates Applied to Project
                            </div>
                          )}

                          {msg.isRejected && msg.hasProposedChanges && (
                            <div className="mt-2 text-xs font-medium text-text-muted flex items-center gap-1.5 bg-bg-panel px-3 py-1.5 rounded-md border border-border-dark">
                              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                              Updates Declined
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
                        {/* 1. Already Owned Components */}
                        {currentProject.bom.some((item) => findInInventory(item.name)) && (
                          <div className="mb-6">
                            <h4 className="text-xs font-semibold text-green-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                              <Archive size={14} /> Already Owned
                            </h4>
                            <div className="space-y-3">
                              {currentProject.bom.map((item, idx) => {
                                const inInventory = findInInventory(item.name);
                                if (!inInventory) return null;
                                
                                return (
                                  <div key={`owned-${idx}`} className="bg-bg-panel border border-green-500/30 rounded-lg p-3 shadow-sm relative overflow-hidden transition-all opacity-80">
                                    <div className="absolute top-0 right-0 bg-green-500/20 text-green-400 text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">
                                      You own {inInventory.quantity}
                                    </div>
                                    <div className="text-xs text-primary mb-1 font-medium flex items-center justify-between pr-16">
                                      <span>{item.category}</span>
                                      {item.sku && <span className="font-mono text-[10px] text-text-muted">SKU: {item.sku}</span>}
                                    </div>
                                    <div className="font-semibold text-sm text-white leading-tight pr-16">{item.name}</div>
                                    <div className="mt-1 text-xs text-text-muted flex items-center gap-2">
                                      <span className="text-primary/80 font-medium">CircuitRocks</span>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between">
                                      <div className="text-xs text-text-muted line-clamp-1 flex-1 mr-2">{item.description}</div>
                                      <div className="font-mono text-sm text-text-muted line-through">₱{item.price.toFixed(2)}</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 2. BOM (To Purchase from CircuitRocks) */}
                        {currentProject.bom.some((item) => !findInInventory(item.name)) && (
                          <div className="mb-6">
                            <h4 className="text-xs font-semibold text-primary mb-3 uppercase tracking-wider flex items-center gap-1.5">
                              <ShoppingCart size={14} /> To Purchase
                            </h4>
                            <div className="space-y-3">
                              {currentProject.bom.map((item, idx) => {
                                const inInventory = findInInventory(item.name);
                                if (inInventory) return null;

                                const isSelected = selectedBomItems[currentProject.id]?.has(idx) ?? true; // True by default since it's not in inventory

                                const toggleSelection = () => {
                                  setSelectedBomItems(prev => {
                                    const defaultSelections = new Set(
                                      currentProject.bom
                                        .map((bItem: any, i: number) => ({ bItem, i }))
                                        .filter(({ bItem }: any) => !findInInventory(bItem.name))
                                        .map(({ i }: any) => i)
                                    );
                                    const projectSelections = new Set(prev[currentProject.id] || defaultSelections);
                                    
                                    if (projectSelections.has(idx)) {
                                      projectSelections.delete(idx);
                                    } else {
                                      projectSelections.add(idx);
                                    }
                                    return { ...prev, [currentProject.id]: projectSelections };
                                  });
                                };

                                return (
                                  <div 
                                    key={`purchase-${idx}`} 
                                    className={cn(
                                      "bg-bg-panel border rounded-lg p-3 shadow-sm relative overflow-hidden transition-all",
                                      isSelected ? "border-primary/50" : "border-border-dark opacity-60"
                                    )}
                                  >
                                    <div className="absolute top-3 right-3 z-10">
                                      <button 
                                        onClick={toggleSelection}
                                        className={cn(
                                          "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                          isSelected 
                                            ? "bg-primary border-primary text-white" 
                                            : "bg-bg-dark border-border-dark text-transparent hover:border-primary/50"
                                        )}
                                      >
                                        <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                          <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                      </button>
                                    </div>
                                    <div className="text-xs text-primary mb-1 font-medium flex items-center justify-between pr-8">
                                      <span>{item.category}</span>
                                      {item.sku && <span className="font-mono text-[10px] text-text-muted">SKU: {item.sku}</span>}
                                    </div>
                                    <div className="font-semibold text-sm text-white leading-tight pr-8">{item.name}</div>
                                    <div className="mt-1 text-xs text-text-muted flex items-center gap-2">
                                      <span className="text-primary/80 font-medium">CircuitRocks</span>
                                      {item.stock !== undefined && (
                                        <span className={cn(
                                          "px-1.5 py-0.5 rounded border text-[10px] font-medium",
                                          item.stock > 0 
                                            ? "bg-green-500/10 text-green-400 border-green-500/20" 
                                            : "bg-red-500/10 text-red-400 border-red-500/20"
                                        )}>
                                          {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
                                        </span>
                                      )}
                                    </div>
                                    <div className="mt-3 flex items-center justify-between">
                                      <div className="text-xs text-text-muted line-clamp-1 flex-1 mr-2">{item.description}</div>
                                      <div className="font-mono text-sm text-primary font-bold">₱{item.price.toFixed(2)}</div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* 3. External Components */}
                        {currentProject.missing_components && currentProject.missing_components.filter(item => !findInInventory(item.name)).length > 0 && (
                          <div className="pt-4 mt-4 border-t border-border-dark/50">
                            <h4 className="text-xs font-semibold text-orange-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                              <Info size={14} /> External Components
                            </h4>
                            <div className="space-y-3">
                              {currentProject.missing_components.filter(item => !findInInventory(item.name)).map((item, idx) => (
                                <div key={idx} className="bg-bg-dark border border-orange-500/30 rounded-lg p-3 shadow-sm relative overflow-hidden">
                                  <div className="text-xs text-orange-400 mb-1 font-medium flex items-center justify-between">
                                    <span>Not in CircuitRocks</span>
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
                        <span className="text-sm text-text-muted font-medium">
                          Total Est. Cost
                          {(() => {
                            const selectedCount = selectedBomItems[currentProject.id] 
                              ? selectedBomItems[currentProject.id].size 
                              : currentProject.bom.filter((item: any) => !findInInventory(item.name)).length;
                            return selectedCount !== currentProject.bom.length ? (
                              <span className="ml-1 text-xs">({selectedCount} items)</span>
                            ) : null;
                          })()}
                        </span>
                        <span className="font-mono text-white font-bold text-lg">
                          ₱{currentProject.bom.reduce((acc, item, idx) => {
                            const inInventory = findInInventory(item.name);
                            const isSelected = selectedBomItems[currentProject.id]?.has(idx) ?? !inInventory;
                            return isSelected ? acc + item.price : acc;
                          }, 0).toFixed(2)}
                        </span>
                      </div>
                      <button 
                        disabled={
                          (selectedBomItems[currentProject.id] 
                            ? selectedBomItems[currentProject.id].size === 0 
                            : currentProject.bom.filter((item: any) => !findInInventory(item.name)).length === 0) 
                          && currentProject.bom.length > 0
                        }
                        className="w-full bg-primary hover:bg-primary-dark disabled:bg-gray-700 disabled:text-gray-400 text-white rounded-lg py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                      >
                        <ShoppingCart size={16} /> Buy Selected
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {projectTab === 'plan' && (
              <div className="flex-1 flex flex-col h-full overflow-y-auto p-8 max-w-4xl mx-auto w-full">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold mb-2 text-white">Project Planner</h2>
                    <p className="text-text-muted">Step-by-step roadmap for building "{currentProject.name}".</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-primary">
                      {currentProject.plan.length > 0 
                        ? `${Math.round(((completedSteps[activeProjectId!]?.size || 0) / currentProject.plan.length) * 100)}% Complete` 
                        : '0% Complete'}
                    </div>
                    <div className="text-xs text-text-muted">
                      {completedSteps[activeProjectId!]?.size || 0} of {currentProject.plan.length} steps done
                    </div>
                  </div>
                </div>
                
                {currentProject.plan.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-border-dark rounded-xl bg-bg-panel/50">
                    <Activity className="mx-auto text-text-muted mb-4" size={48} />
                    <p className="text-lg">No plan generated yet.</p>
                    <p className="text-sm text-text-muted mt-2">Chat with the copilot to generate a roadmap.</p>
                  </div>
                ) : (
                  <div className="relative border-l border-border-dark ml-5 space-y-8 pb-8">
                    {currentProject.plan.map((step, idx) => {
                      const isCompleted = completedSteps[activeProjectId!]?.has(idx) || false;
                      
                      const toggleStep = () => {
                        setCompletedSteps(prev => {
                          const projectSteps = new Set(prev[activeProjectId!] || []);
                          if (projectSteps.has(idx)) {
                            projectSteps.delete(idx);
                          } else {
                            projectSteps.add(idx);
                          }
                          return { ...prev, [activeProjectId!]: projectSteps };
                        });
                      };
                      
                      return (
                        <div key={idx} className="relative pl-9">
                          <button
                            onClick={toggleStep}
                            className={cn(
                              "absolute -left-[20px] top-3 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md z-10",
                              isCompleted 
                                ? "bg-green-500 border-2 border-green-500" 
                                : "bg-bg-dark border-2 border-primary hover:bg-primary/20"
                            )}
                          >
                            {isCompleted ? (
                              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            ) : (
                              <span className="text-[12px] font-bold text-primary">{idx + 1}</span>
                            )}
                          </button>
                          
                          <div className={cn(
                            "bg-bg-panel border rounded-xl p-5 shadow-sm transition-all",
                            isCompleted 
                              ? "border-green-500/30 opacity-75" 
                              : "border-border-dark hover:border-primary/50"
                          )}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className={cn(
                                  "text-lg font-semibold mb-2",
                                  isCompleted ? "text-green-500 line-through" : "text-white"
                                )}>
                                  {step.phase}
                                </h3>
                                <p className={cn(
                                  "leading-relaxed",
                                  isCompleted ? "text-text-muted line-through" : "text-text-muted"
                                )}>
                                  {step.details}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
                    <h2 className="text-2xl font-bold text-white mb-1">Projects</h2>
                    <p className="text-text-muted">Manage your hardware builds and ideas.</p>
                  </div>
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
                  >
                    <Plus size={18} /> New Project
                  </button>
                </div>

                {/* Recommended Projects Section */}
                <div className="mb-12">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Sparkles className="text-primary" size={20} /> 
                      Recommended Projects
                    </h3>
                    {inventory.length > 0 && recommendations.length > 0 && (
                      <button onClick={generateRecommendations} disabled={loadingRecs} className="text-xs text-primary hover:text-primary-light flex items-center gap-1.5 transition-colors">
                        <RefreshCw size={14} className={cn(loadingRecs && "animate-spin")} /> Refresh Ideas
                      </button>
                    )}
                  </div>

                  {inventory.length === 0 ? (
                    <div className="bg-bg-panel border border-border-dark rounded-xl p-6 text-center shadow-sm">
                      <Archive className="mx-auto text-text-muted mb-3 opacity-50" size={24} />
                      <p className="text-sm text-text-muted">Add components to your inventory to get AI-powered project recommendations.</p>
                      <button onClick={() => setGlobalView('inventory')} className="mt-3 text-sm text-primary hover:underline font-medium">Go to Inventory</button>
                    </div>
                  ) : recommendations.length === 0 ? (
                    <div className="bg-bg-panel border border-border-dark rounded-xl p-8 text-center shadow-sm flex flex-col items-center justify-center">
                      <Bot className="text-primary mb-3 opacity-80" size={32} />
                      <p className="text-sm text-text-muted mb-4 max-w-md">You have {inventory.length} items in your inventory. Let AI suggest projects you can build right now.</p>
                      <button 
                        onClick={generateRecommendations} 
                        disabled={loadingRecs}
                        className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        {loadingRecs ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        {loadingRecs ? 'Generating Ideas...' : 'Generate Ideas'}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {recommendations.slice(0, 3).map((rec, idx) => {
                        const readinessPercentage = rec.required_parts?.length 
                          ? Math.round(((rec.owned_parts?.length || 0) / rec.required_parts.length) * 100) 
                          : 0;

                        return (
                        <div key={idx} className="relative bg-bg-panel border border-border-dark rounded-2xl p-6 hover:border-primary/50 transition-all flex flex-col h-full group shadow-sm hover:shadow-lg overflow-hidden">
                          {/* Cohesive Blur Glow */}
                          <div className="absolute -inset-4 bg-primary/5 opacity-0 group-hover:opacity-100 blur-3xl transition-opacity duration-500 pointer-events-none" />
                          
                          <div className="relative z-10 flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                              <Zap size={24} />
                            </div>
                            {readinessPercentage === 100 ? (
                              <span className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1">
                                <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                Ready to Build
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center gap-1">
                                {readinessPercentage}% Complete
                              </span>
                            )}
                          </div>
                          <h4 className="relative z-10 font-bold text-xl text-white mb-2 tracking-tight line-clamp-1" title={rec.name}>{rec.name}</h4>
                          <p className="relative z-10 text-sm text-text-muted mb-4 flex-1 line-clamp-2">{rec.description}</p>
                          
                          {/* Progress Bar */}
                          <div className="relative z-10 mb-4">
                            <div className="h-1.5 w-full bg-bg-dark rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-500"
                                style={{ width: `${readinessPercentage}%` }}
                              />
                            </div>
                          </div>

                          {/* Parts List */}
                          <div className="relative z-10 mb-5 space-y-3">
                            {/* Owned Parts */}
                            {rec.owned_parts && rec.owned_parts.length > 0 && (
                              <div>
                                <div className="text-[10px] font-semibold text-green-400 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                                  <Archive size={12} /> You Own
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {rec.owned_parts.slice(0, 4).map((part, i) => (
                                    <span key={i} className="text-[10px] px-2 py-1 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
                                      {part}
                                    </span>
                                  ))}
                                  {rec.owned_parts.length > 4 && (
                                    <span className="text-[10px] px-2 py-1 rounded-lg bg-green-500/10 text-green-400/70 border border-green-500/20">
                                      +{rec.owned_parts.length - 4} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Missing Parts */}
                            {rec.missing_parts && rec.missing_parts.length > 0 && (
                              <div>
                                <div className="text-[10px] font-semibold text-orange-400 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                                  <ShoppingCart size={12} /> Need to Buy
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {rec.missing_parts.slice(0, 4).map((part, i) => (
                                    <span key={i} className="text-[10px] px-2 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                      {part}
                                    </span>
                                  ))}
                                  {rec.missing_parts.length > 4 && (
                                    <span className="text-[10px] px-2 py-1 rounded-lg bg-orange-500/10 text-orange-400/70 border border-orange-500/20">
                                      +{rec.missing_parts.length - 4} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <button 
                            onClick={() => handleCreateFromRecommendation(rec)}
                            className="relative z-10 w-full py-3 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 mt-auto flex items-center justify-center gap-2"
                          >
                            <Plus size={16} />
                            Start Project
                          </button>
                        </div>
                      )})}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-1">My Projects</h3>
                </div>

                {projects.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-center mt-12 relative z-10">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
                    
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                      <CircuitBoard size={40} />
                    </div>
                    
                    <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Start Building Hardware Smarter</h2>
                    
                    <p className="text-text-muted max-w-md mx-auto mb-8 text-base leading-relaxed">
                      Create your first project and let AI help you design, plan, and manage your electronics build from start to finish.
                    </p>
                    
                    <button 
                      onClick={() => setShowCreateModal(true)}
                      className="bg-primary hover:bg-primary-dark text-white px-8 py-3.5 rounded-xl text-base font-semibold transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 flex items-center justify-center gap-2"
                    >
                      <Plus size={20} />
                      Create Your First Project
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {projects.map(p => {
                      const purchasablePartsCount = p.bom.filter(item => !findInInventory(item.name)).length + p.missing_components.length;
                      const completedCount = completedSteps[p.id]?.size || 0;
                      const totalSteps = p.plan.length;
                      const progressPercentage = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;
                      
                      return (
                      <div 
                        key={p.id} 
                        onClick={() => { setActiveProjectId(p.id); setProjectTab('chat'); }}
                        className="bg-bg-panel border border-border-dark rounded-xl p-5 cursor-pointer hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all group flex flex-col h-48"
                      >
                        <div className="flex items-center mb-3 gap-3">
                          <div className="w-10 h-10 rounded-lg bg-bg-dark flex items-center justify-center text-primary border border-border-dark group-hover:bg-primary/10 transition-colors shrink-0">
                            <Cpu size={20} />
                          </div>
                          
                          {totalSteps > 0 && (
                            <div className="flex items-center flex-1 gap-3 px-2">
                              <div className="h-1.5 flex-1 bg-bg-dark rounded-full overflow-hidden">
                                <div 
                                  className={cn(
                                    "h-full transition-all duration-500",
                                    progressPercentage === 100 ? "bg-green-500" : "bg-primary"
                                  )}
                                  style={{ width: `${progressPercentage}%` }}
                                />
                              </div>
                              <span className={cn("text-xs font-bold", progressPercentage === 100 ? "text-green-400" : "text-primary")}>
                                {progressPercentage}%
                              </span>
                            </div>
                          )}
                          
                          <button 
                            onClick={(e) => handleDeleteProject(p.id, e)}
                            className={cn(
                              "text-text-muted hover:text-red-400 p-1.5 rounded-md hover:bg-bg-dark transition-colors opacity-0 group-hover:opacity-100 shrink-0",
                              totalSteps === 0 && "ml-auto"
                            )}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <h3 className="font-bold text-lg text-white mb-1 line-clamp-1">{p.name}</h3>
                        <p className="text-sm text-text-muted line-clamp-2 mb-4 flex-1">{p.description}</p>
                        <div className="flex items-center justify-between text-xs font-medium text-text-muted pt-4 border-t border-border-dark/50 mt-auto">
                          <div className="flex items-center gap-1.5"><ShoppingCart size={14}/> {purchasablePartsCount} Purchasable Parts</div>
                          <div className="flex items-center gap-1.5"><Activity size={14}/> {completedCount}/{totalSteps} Steps</div>
                        </div>
                      </div>
                    )})}
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
