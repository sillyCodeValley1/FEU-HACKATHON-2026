import React from 'react';
import { cn } from '../utils/cn';

export function SidebarItem({ icon, label, active, onClick, badge, collapsed }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void, badge?: number, collapsed?: boolean }) {
  return (
    <button 
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        "w-full flex items-center rounded-lg transition-all duration-200 text-sm font-medium relative overflow-hidden",
        collapsed ? "justify-center py-3 px-0" : "justify-between px-3 py-2.5",
        active ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-white/5 hover:text-white"
      )}
    >
      <div className={cn("flex items-center transition-all duration-200", collapsed ? "justify-center" : "gap-3")}>
        <div className="shrink-0">{icon}</div>
        <span className={cn(
          "whitespace-nowrap transition-opacity duration-200",
          collapsed ? "opacity-0 absolute pointer-events-none" : "opacity-100"
        )}>
          {label}
        </span>
      </div>
      {!collapsed && badge !== undefined && badge > 0 && (
        <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shrink-0">
          {badge}
        </span>
      )}
    </button>
  );
}
