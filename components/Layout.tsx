
import React from 'react';
import { AppTab } from '../types';
import { LayoutDashboard, Camera, History, Image as ImageIcon, Settings, PlusCircle } from 'lucide-react';

interface LayoutProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ activeTab, setActiveTab, children }) => {
  const tabs = [
    { id: AppTab.DASHBOARD, label: 'Stats', icon: LayoutDashboard },
    { id: AppTab.LOGS, label: 'History', icon: History },
    { id: AppTab.CAMERA, label: 'Camera', icon: Camera, center: true },
    { id: AppTab.GALLERY, label: 'Morph', icon: ImageIcon },
    { id: AppTab.SETTINGS, label: 'Setup', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-black text-white overflow-hidden shadow-2xl relative">
      <header className="px-6 py-4 flex justify-between items-center bg-zinc-900/50 backdrop-blur-md border-b border-white/5 shrink-0 z-50">
        <h1 className="flex items-baseline font-outfit font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          <span className="text-xl uppercase">MORPHSCALE</span>
          <span className="ml-1.5 text-[10px] font-medium opacity-80 lowercase tracking-normal text-zinc-400">by ralthology</span>
        </h1>
        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 scroll-smooth">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-zinc-900/90 backdrop-blur-xl border-t border-white/10 px-6 py-3 pb-8 flex justify-between items-center z-50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          if (tab.center) {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center -mt-10 bg-gradient-to-br from-emerald-500 to-cyan-500 p-4 rounded-full shadow-lg shadow-emerald-500/20 transform transition-transform active:scale-95 ${isActive ? 'scale-110' : ''}`}
              >
                <Icon size={28} className="text-white" />
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                isActive ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium uppercase tracking-widest">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
