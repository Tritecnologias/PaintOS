import React, { useState, useEffect } from 'react';
import { Crosshair, Volume2, VolumeX, RotateCcw, Shield, Users, Bell, BellRing, BellOff, Home, Settings } from 'lucide-react';
import { tacticalAudio } from '../utils/audio';
import { tacticalNotifications, NotificationPermissionStatus } from '../utils/notifications';

interface HeaderProps {
  confirmedCount: number;
  totalPlayers: number;
  isMatchLive: boolean;
  onResetData: () => void;
  onNavigateLanding?: () => void;
  onNavigateAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  confirmedCount,
  totalPlayers,
  isMatchLive,
  onResetData,
  onNavigateLanding,
  onNavigateAdmin,
}) => {
  const [isMuted, setIsMuted] = useState(tacticalAudio.getMuted());
  const [notifPermission, setNotifPermission] = useState<NotificationPermissionStatus>('default');

  useEffect(() => {
    setNotifPermission(tacticalNotifications.getPermissionStatus());
  }, []);

  const handleToggleMute = () => {
    const next = tacticalAudio.toggleMute();
    setIsMuted(next);
    if (!next) {
      tacticalAudio.playClick();
    }
  };

  const handleToggleNotification = async () => {
    tacticalAudio.playClick();
    if (notifPermission === 'default') {
      const res = await tacticalNotifications.requestPermission();
      setNotifPermission(res);
    } else if (notifPermission === 'granted') {
      // Send a quick test alert
      tacticalNotifications.sendNotification('🔔 PaintOps: Alertas Táticos Ativos', {
        body: 'Notificações prontas para 60s, 30s e término de round.',
      });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0d1117]/95 backdrop-blur-md border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Logo and Tactical Tag */}
        <div className="flex items-center gap-2.5">
          <div 
            onClick={onNavigateLanding}
            className="cursor-pointer relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-tactical-orange font-tactical font-black text-xl tracking-wider hover:opacity-90 transition-opacity"
            title="Ir para a Landing Page"
          >
            <Crosshair className="w-6 h-6 animate-pulse" />
            <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 
                onClick={onNavigateLanding}
                className="cursor-pointer text-xl sm:text-2xl font-black font-tactical tracking-wider text-white uppercase flex items-center gap-1 hover:text-orange-400 transition-colors"
                title="Ir para a Landing Page"
              >
                PAINT<span className="text-orange-500">OPS</span>
              </h1>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                PRO v2.6
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-tight truncate max-w-[190px] sm:max-w-none">
              Centro Tático • Juiz & Gerenciador
            </p>
          </div>
        </div>

        {/* Live Status indicator & Action controls */}
        <div className="flex items-center gap-2">
          {/* Quick Landing Page link */}
          {onNavigateLanding && (
            <button
              onClick={() => {
                tacticalAudio.playClick();
                onNavigateLanding();
              }}
              title="Acessar Landing Page"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-tactical text-xs uppercase tracking-wider transition-colors"
            >
              <Home className="w-3.5 h-3.5 text-orange-400" />
              <span>Landing</span>
            </button>
          )}

          {/* Quick Admin Panel link */}
          {onNavigateAdmin && (
            <button
              onClick={() => {
                tacticalAudio.playClick();
                onNavigateAdmin();
              }}
              title="Acessar Painel Administrador (CRUD)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-tactical text-xs uppercase tracking-wider transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">Admin CRUD</span>
            </button>
          )}

          {/* Confirmed Roster pill */}
          <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs font-medium">
            <Users className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-slate-400">Prontos:</span>
            <span className="font-code font-bold text-white">
              {confirmedCount}/{totalPlayers}
            </span>
          </div>

          {/* Match Live Badge */}
          {isMatchLive && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-950/80 border border-red-500/50 text-red-400 text-xs font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="uppercase tracking-wider font-tactical">Ao Vivo</span>
            </div>
          )}

          {/* Browser Notification Permission Toggle Button */}
          <button
            onClick={handleToggleNotification}
            title={
              notifPermission === 'granted'
                ? 'Notificações do Navegador Ativas (Clique para testar)'
                : notifPermission === 'denied'
                ? 'Notificações bloqueadas nas configurações do navegador'
                : 'Ativar Notificações no Navegador (Alertas aos 60s, 30s e Fim de Round)'
            }
            className={`p-2 rounded-lg border transition-all flex items-center justify-center ${
              notifPermission === 'granted'
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400 shadow-sm shadow-emerald-500/20'
                : notifPermission === 'denied'
                ? 'bg-slate-900 border-slate-800 text-slate-600'
                : 'bg-orange-950/50 border-orange-500/40 text-orange-400 animate-pulse'
            }`}
          >
            {notifPermission === 'granted' ? (
              <BellRing className="w-5 h-5 text-emerald-400" />
            ) : notifPermission === 'denied' ? (
              <BellOff className="w-5 h-5" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
          </button>

          {/* Sound Toggle Button (Tactical glove-friendly) */}
          <button
            onClick={handleToggleMute}
            title={isMuted ? 'Ativar Efeitos Sonoros' : 'Mutar Efeitos Sonoros'}
            className={`p-2 rounded-lg border transition-all flex items-center justify-center ${
              isMuted
                ? 'bg-slate-900 border-slate-700 text-slate-500 hover:text-slate-300'
                : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400 shadow-sm shadow-emerald-500/20'
            }`}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* Reset Mock Data modal trigger */}
          <button
            onClick={onResetData}
            title="Restaurar dados de demonstração"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-orange-400 hover:border-slate-700 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
