import { Link } from 'react-router-dom';
import { CircuitBoard, Zap } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg-dark text-text-main font-sans flex flex-col">
      {/* Navbar */}
      <nav className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary">
            <CircuitBoard size={20} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            CircuitPal<span className="text-primary">.AI</span>
          </h1>
        </div>
        <div className="flex gap-4">
          <Link
            to="/app"
            className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary/20"
          >
            Launch App
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20">
            <Zap size={16} />
            <span>AI-Powered Electronics Assistant</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
            Design Hardware <br />
            <span className="text-primary">Faster & Smarter</span>
          </h1>
          
          <p className="text-xl text-text-muted max-w-2xl mx-auto mb-12">
            Your intelligent copilot for hardware builds. Generate bill of materials, plan steps, and manage inventory seamlessly.
          </p>
          
          <Link
            to="/app"
            className="inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all shadow-lg shadow-primary/30 hover:shadow-primary/40 gap-2"
          >
            Get Started
            <CircuitBoard size={20} />
          </Link>
        </div>
      </main>
    </div>
  );
}
