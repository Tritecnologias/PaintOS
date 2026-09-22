import React from 'react';
import { Users, Shuffle, Timer, DollarSign, Trophy } from 'lucide-react';
import { tacticalAudio } from '../utils/audio';

export type TabType = 'pelotao' | 'sorteador' | 'juiz' | 'financeiro' | 'classificacao';

interface NavigationProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  isMatchActive: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  isMatchActive,
}) => {
  const tabs = [
    {
      id: 'pelotao' as TabType,
      label: 'Pelotão',
      icon: Users,
      badge: null,
    },
    {
      id: 'sorteador' as TabType,
      label: 'Sorteador',
      icon: Shuffle,
      badge: null,
    },
    {
      id: 'juiz' as TabType,
      label: 'Ao Vivo',
      icon: Timer,
      badge: isMatchActive ? 'LIVE' : null,
      highlight: isMatchActive,
    },
    {
      id: 'financeiro' as TabType,
      label: 'Custos',
      icon: DollarSign,
      badge: null,
    },
    {
      id: 'classificacao' as TabType,
      label: 'Ranking',
      icon: Trophy,
      badge: null,
    },
  ];

  const handleTabClick = (tab: TabType) => {
    tacticalAudio.playClick();
    onSelectTab(tab);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d1117]/95 backdrop-blur-md border-t border-slate-800 md:static md:bg-transparent md:border-none md:backdrop-blur-none">
      <div className="max-w-7xl mx-auto px-2 sm:px-6">
        {/* Mobile & Desktop Tab Bar */}
        <div className="grid grid-cols-5 gap-1 py-1.5 md:flex md:items-center md:gap-2 md:py-3 md:border-b md:border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`relative flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2.5 py-2 px-1 sm:px-3 md:px-5 rounded-lg md:rounded-md transition-all font-tactical tracking-wide uppercase text-xs ${
                  isActive
                    ? 'bg-orange-500/15 text-orange-400 border border-orange-500/40 shadow-sm shadow-orange-500/10 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                } ${tab.highlight ? 'ring-1 ring-red-500/50' : ''}`}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-transform ${
                      isActive ? 'scale-110 text-orange-400' : 'text-slate-400'
                    }`}
                  />
                  {tab.badge && (
                    <span className="absolute -top-1.5 -right-2 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                </div>

                <span className="text-[10px] md:text-xs font-semibold tracking-wider">
                  {tab.label}
                </span>

                {/* Desktop Live Tag */}
                {tab.badge && (
                  <span className="hidden md:inline-block ml-1 px-1.5 py-0.2 rounded text-[9px] bg-red-500/20 text-red-400 border border-red-500/40 font-mono font-bold animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
