import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircuitBoard, Zap, Cpu, ShoppingCart, List, ArrowRight, Activity, ShieldCheck, CheckCircle2, Bot, Archive, Sparkles, Sun, Moon } from 'lucide-react';

export default function Landing() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

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

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    const targetId = e.currentTarget.getAttribute('href')?.substring(1);
    if (targetId) {
      const elem = document.getElementById(targetId);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Intersection Observer for scroll animations
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in', 'fade-in', 'slide-in-from-bottom-8', 'duration-700', 'fill-mode-forwards');
          entry.target.classList.remove('opacity-0', 'translate-y-8');
          observerRef.current?.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);
  return (
    <div className="min-h-screen bg-bg-dark text-text-main font-sans flex flex-col overflow-x-hidden">
      {/* Navbar */}
      <nav className="px-8 py-6 flex items-center justify-between border-b border-border-dark/50 bg-bg-dark/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary">
            <CircuitBoard size={20} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            CircuitPal<span className="text-primary">.AI</span>
          </h1>
        </div>
        <div className="flex gap-4 items-center">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="text-text-muted hover:text-white p-2 rounded-lg transition-colors hover:bg-white/5"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <a href="#features" onClick={handleScroll} className="text-sm font-medium text-text-muted hover:text-white transition-colors hidden md:block">Features</a>
          <a href="#circuitrocks" onClick={handleScroll} className="text-sm font-medium text-text-muted hover:text-white transition-colors hidden md:block">Integration</a>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="text-text-muted hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <Link
            to="/app"
            className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary/20"
          >
            Launch App
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 px-6 overflow-hidden">
          {/* Grid Background */}
          {/* Grid */}
<div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

{/* Glow */}
<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08),transparent_70%)] pointer-events-none" />
          
          <div className="relative z-10 max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20 shadow-sm shadow-primary/5">
              <Cpu size={16} className="text-primary" />
              <span>Powered by CircuitRocks</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight tracking-tight">
              Build Electronics <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Without the Guesswork.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-text-muted max-w-3xl mx-auto mb-12 leading-relaxed">
              CircuitPal.AI is your intelligent hardware companion. Describe what you want to build, and our AI will generate a precise Bill of Materials from the CircuitRocks catalog, check your existing inventory, and provide an interactive step-by-step assembly roadmap.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/app"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 gap-2"
              >
                Start Building Now
                <ArrowRight size={20} />
              </Link>
              <a 
                href="#features"
                onClick={handleScroll}
                className="w-full sm:w-auto inline-flex items-center justify-center bg-bg-panel hover:bg-white/5 border border-border-dark text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all gap-2"
              >
                See How It Works
              </a>
            </div>
            
            <div className="mt-16 flex items-center justify-center gap-8 text-sm text-text-muted font-medium opacity-80">
              <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> AI-Generated BOM</div>
              <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Smart Inventory</div>
              <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> CircuitRocks Integrated</div>
            </div>
          </div>
        </section>

        {/* Integration Highlight Section */}
        <section id="circuitrocks" className="py-24 bg-bg-panel/30 border-y border-border-dark/50 relative overflow-hidden">
           <div className="absolute -left-40 top-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
           <div className="max-w-6xl mx-auto px-6 relative z-10">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
               <div className="reveal-on-scroll opacity-0 translate-y-8">
                 <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                   Seamless Sourcing with <span className="text-primary">CircuitRocks</span>
                 </h2>
                 <p className="text-text-muted text-lg leading-relaxed mb-6">
                   Finding the right components is often the most frustrating part of hardware development. We've solved this by building CircuitPal.AI directly on top of the <strong>CircuitRocks</strong> catalog—the Philippines' premier electronics shop.
                 </p>
                 <ul className="space-y-4 mb-8">
                   <li className="flex items-start gap-3">
                     <div className="mt-1 p-1 bg-green-500/20 rounded text-green-400"><ShieldCheck size={16} /></div>
                     <div>
                       <strong className="text-white block">Verified Components</strong>
                       <span className="text-text-muted text-sm">No more guessing if parts will work together. Every suggested component maps directly to genuine stock from the CircuitRocks store.</span>
                     </div>
                   </li>
                   <li className="flex items-start gap-3">
                     <div className="mt-1 p-1 bg-blue-500/20 rounded text-blue-400"><ShoppingCart size={16} /></div>
                     <div>
                       <strong className="text-white block">Accurate BOM Generation</strong>
                       <span className="text-text-muted text-sm">The AI builds your Bill of Materials specifically using available CircuitRocks inventory, giving you accurate prices and availability.</span>
                     </div>
                   </li>
                 </ul>
               </div>
               <div className="relative reveal-on-scroll opacity-0 translate-y-8" style={{ transitionDelay: '200ms' }}>
                 <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-2xl blur-xl"></div>
                 <div className="bg-bg-dark border border-border-dark rounded-2xl p-6 shadow-2xl relative">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border-dark">
                      <Cpu className="text-primary" size={24} />
                      <span className="text-lg font-bold text-white">CircuitRocks Live Catalog</span>
                    </div>
                    <div className="space-y-4">
                      {[
                        { name: "ESP32 Development Board", category: "Microcontroller", price: "₱580.00", stock: 120, sku: "CR-ESP32" },
                        { name: "Ultrasonic Sensor HC-SR04", category: "Sensor", price: "₱230.00", stock: 300, sku: "CR-US04" },
                        { name: "L298N Motor Driver", category: "Module", price: "₱320.00", stock: 85, sku: "CR-L298N" }
                      ].map((item, i) => (
                        <div key={i} className="bg-bg-panel border border-border-dark rounded-xl p-4 flex flex-col hover:border-primary/50 transition-colors group">
                          <div className="text-xs text-primary font-medium mb-1 flex items-center justify-between">
                            <span>{item.category}</span>
                            <span className="font-mono text-[10px] text-text-muted">SKU: {item.sku}</span>
                          </div>
                          <h3 className="font-semibold text-white mb-3 line-clamp-1">{item.name}</h3>
                          
                          <div className="flex items-center justify-between mt-auto pt-3 border-t border-border-dark/50">
                            <span className="font-mono text-lg text-white font-bold">{item.price}</span>
                            <span className="text-xs text-green-400 font-medium bg-green-500/10 px-2 py-1 rounded-md border border-green-500/20">{item.stock} in stock</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
               </div>
             </div>
           </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20 reveal-on-scroll opacity-0 translate-y-8">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Everything you need to engineer faster</h2>
              <p className="text-xl text-text-muted max-w-2xl mx-auto">From idea to functional prototype, CircuitPal handles the planning so you can focus on building.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-bg-panel border border-border-dark rounded-2xl p-8 hover:border-primary/50 hover:-translate-y-1 transition-all group reveal-on-scroll opacity-0 translate-y-8" style={{ transitionDelay: '100ms' }}>
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <Bot size={28} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Engineering AI Copilot</h3>
                <p className="text-text-muted leading-relaxed">
                  Chat with a specialized electronics AI. Describe your goal ("I want to water my plants automatically"), and it will engineer the solution, identifying the exact microcontrollers, sensors, and actuators needed.
                </p>
              </div>

              <div className="bg-bg-panel border border-border-dark rounded-2xl p-8 hover:border-primary/50 hover:-translate-y-1 transition-all group reveal-on-scroll opacity-0 translate-y-8" style={{ transitionDelay: '200ms' }}>
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <Activity size={28} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Interactive Project Roadmaps</h3>
                <p className="text-text-muted leading-relaxed">
                  Never get lost during assembly. The AI generates a phased project plan with interactive checkboxes covering hardware acquisition, circuit wiring, programming, and testing tailored specifically to your build.
                </p>
              </div>

              <div className="bg-bg-panel border border-border-dark rounded-2xl p-8 hover:border-primary/50 hover:-translate-y-1 transition-all group reveal-on-scroll opacity-0 translate-y-8" style={{ transitionDelay: '300ms' }}>
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <Archive size={28} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Smart Inventory Context</h3>
                <p className="text-text-muted leading-relaxed">
                  Add the components you already own to your virtual inventory. The AI is completely context-aware—it will prioritize using your existing parts to save you money before suggesting new purchases.
                </p>
              </div>
              
              <div className="bg-bg-panel border border-border-dark rounded-2xl p-8 hover:border-primary/50 hover:-translate-y-1 transition-all group reveal-on-scroll opacity-0 translate-y-8" style={{ transitionDelay: '400ms' }}>
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <Sparkles size={28} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">AI Project Recommendations</h3>
                <p className="text-text-muted leading-relaxed">
                  Have a box of random sensors and microcontrollers? CircuitPal analyzes your inventory and recommends creative projects you can build right now with what you already have.
                </p>
              </div>
              
              <div className="bg-bg-panel border border-border-dark rounded-2xl p-8 hover:border-primary/50 hover:-translate-y-1 transition-all group md:col-span-2 lg:col-span-2 relative overflow-hidden reveal-on-scroll opacity-0 translate-y-8" style={{ transitionDelay: '500ms' }}>
                <div className="absolute right-0 bottom-0 opacity-10 text-primary pointer-events-none translate-x-1/4 translate-y-1/4">
                  <CircuitBoard size={200} />
                </div>
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                    <List size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Dynamic Bill of Materials (BOM)</h3>
                  <p className="text-text-muted leading-relaxed max-w-xl">
                    Every project automatically generates a detailed BOM. It intelligently separates parts you already own from purchasable parts sourced directly from the CircuitRocks catalog, alongside helpful links for any external components.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6 border-t border-border-dark">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-b from-bg-panel to-bg-dark border border-border-dark rounded-3xl p-12 relative overflow-hidden reveal-on-scroll opacity-0 translate-y-8">
            <div className="absolute inset-0 bg-primary/5"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to stop planning and start building?</h2>
              <p className="text-lg text-text-muted mb-10 max-w-2xl mx-auto">Join makers, students, and engineers who use CircuitPal to turn hardware concepts into working prototypes without the sourcing headache.</p>
              <Link
                to="/app"
                className="inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-white px-10 py-4 rounded-xl text-lg font-bold transition-all shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-1 gap-2"
              >
                Launch CircuitPal.AI
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="py-8 border-t border-border-dark text-center text-sm text-text-muted">
        <p className="mb-2">© 2026 CircuitPal.AI. Built for hardware enthusiasts.</p>
        <p className="flex items-center justify-center gap-2">
          <span>Powered by</span>
          <a href="https://circuit.rocks/" target="_blank" rel="noreferrer" className="text-primary hover:text-primary-light transition-colors font-medium">
            CircuitRocks
          </a>
        </p>
      </footer>
    </div>
  );
}
