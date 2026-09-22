import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { SquadTab } from './components/SquadTab';
import { TeamDraftTab } from './components/TeamDraftTab';
import { LiveMatchTab } from './components/LiveMatchTab';
import { FinanceTab } from './components/FinanceTab';
import { HallOfFameTab } from './components/HallOfFameTab';
import { NotificationToast } from './components/NotificationToast';
import { LandingPage } from './components/LandingPage';
import { AdminPanel } from './components/AdminPanel';
import { 
  Player, FinancialConfig, MatchHistoryRecord, LiveMatchState, GameScenario,
  AppViewMode, ScenarioPreset
} from './types';
import { 
  INITIAL_PLAYERS, INITIAL_FINANCIAL, INITIAL_MATCH_HISTORY, SCENARIO_PRESETS 
} from './utils/mockData';
import { tacticalAudio } from './utils/audio';

export default function App() {
  // Current view mode: 'landing' (landing page), 'app' (tactical operations), 'admin' (CRUD admin panel)
  const [viewMode, setViewMode] = useState<AppViewMode>(() => {
    try {
      const saved = localStorage.getItem('paintops_view_mode');
      if (saved === 'landing' || saved === 'app' || saved === 'admin') return saved;
    } catch {
      // fallback
    }
    return 'landing';
  });

  // Current active navigation tab in tactical app
  const [currentTab, setCurrentTab] = useState<TabType>('pelotao');

  // Players state with localStorage persistence
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const saved = localStorage.getItem('paintops_players_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_PLAYERS;
  });

  // Financial configuration state
  const [financialConfig, setFinancialConfig] = useState<FinancialConfig>(() => {
    try {
      const saved = localStorage.getItem('paintops_finance_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_FINANCIAL;
  });

  // Match History state
  const [matchHistory, setMatchHistory] = useState<MatchHistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem('paintops_history_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_MATCH_HISTORY;
  });

  // Scenarios presets state
  const [scenarios, setScenarios] = useState<ScenarioPreset[]>(() => {
    try {
      const saved = localStorage.getItem('paintops_scenarios_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return SCENARIO_PRESETS;
  });

  // Team roster IDs for Alfa and Bravo
  const [teamAlphaIds, setTeamAlphaIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('paintops_team_alpha');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    // Default partition
    const confirmed = INITIAL_PLAYERS.filter((p) => p.status === 'confirmed').map((p) => p.id);
    return confirmed.slice(0, Math.ceil(confirmed.length / 2));
  });

  const [teamBravoIds, setTeamBravoIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('paintops_team_bravo');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    const confirmed = INITIAL_PLAYERS.filter((p) => p.status === 'confirmed').map((p) => p.id);
    return confirmed.slice(Math.ceil(confirmed.length / 2));
  });

  // Live match referee state
  const [liveMatchState, setLiveMatchState] = useState<LiveMatchState>(() => {
    const defaultSecs = 8 * 60;
    return {
      id: `match-${Date.now()}`,
      scenario: 'deathmatch',
      durationSeconds: defaultSecs,
      timeRemaining: defaultSecs,
      isRunning: false,
      isPaused: false,
      isFinished: false,
      teamAlpha: {
        name: 'Alfa',
        score: 0,
        players: teamAlphaIds,
        alivePlayerIds: teamAlphaIds,
        penalties: 0,
      },
      teamBravo: {
        name: 'Bravo',
        score: 0,
        players: teamBravoIds,
        alivePlayerIds: teamBravoIds,
        penalties: 0,
      },
      events: [
        {
          id: `ev-init`,
          timestampSeconds: defaultSecs,
          realTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          type: 'system',
          text: 'CENTRO TÁTICO INICIALIZADO - Aguardando início do combate.',
        },
      ],
    };
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('paintops_view_mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('paintops_players_v2', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem('paintops_finance_v2', JSON.stringify(financialConfig));
  }, [financialConfig]);

  useEffect(() => {
    localStorage.setItem('paintops_history_v2', JSON.stringify(matchHistory));
  }, [matchHistory]);

  useEffect(() => {
    localStorage.setItem('paintops_scenarios_v2', JSON.stringify(scenarios));
  }, [scenarios]);

  useEffect(() => {
    localStorage.setItem('paintops_team_alpha', JSON.stringify(teamAlphaIds));
  }, [teamAlphaIds]);

  useEffect(() => {
    localStorage.setItem('paintops_team_bravo', JSON.stringify(teamBravoIds));
  }, [teamBravoIds]);

  // Synchronize teams into LiveMatchState if match is not running
  const handleUpdateTeams = (alpha: string[], bravo: string[]) => {
    setTeamAlphaIds(alpha);
    setTeamBravoIds(bravo);
    if (!liveMatchState.isRunning) {
      setLiveMatchState((prev) => ({
        ...prev,
        teamAlpha: {
          ...prev.teamAlpha,
          players: alpha,
          alivePlayerIds: alpha,
        },
        teamBravo: {
          ...prev.teamBravo,
          players: bravo,
          alivePlayerIds: bravo,
        },
      }));
    }
  };

  // Deploy to Field: set teams and switch tab to Live Referee
  const handleDeployToField = (alpha: string[], bravo: string[]) => {
    handleUpdateTeams(alpha, bravo);
    setLiveMatchState((prev) => ({
      ...prev,
      teamAlpha: {
        ...prev.teamAlpha,
        players: alpha,
        alivePlayerIds: alpha,
        score: 0,
      },
      teamBravo: {
        ...prev.teamBravo,
        players: bravo,
        alivePlayerIds: bravo,
        score: 0,
      },
      timeRemaining: prev.durationSeconds,
      isRunning: false,
      isPaused: false,
      isFinished: false,
    }));
    setCurrentTab('juiz');
  };

  // Add Player
  const handleAddPlayer = (newPlayerData: Omit<Player, 'id' | 'stats' | 'badges'>) => {
    const newPlayer: Player = {
      ...newPlayerData,
      id: `p-${Date.now()}`,
      stats: {
        matches: 0,
        wins: 0,
        mvps: 0,
        eliminations: 0,
        deaths: 0,
      },
      badges: [],
    };
    setPlayers((prev) => [newPlayer, ...prev]);

    // If confirmed, add to alpha or bravo
    if (newPlayer.status === 'confirmed') {
      if (teamAlphaIds.length <= teamBravoIds.length) {
        handleUpdateTeams([...teamAlphaIds, newPlayer.id], teamBravoIds);
      } else {
        handleUpdateTeams(teamAlphaIds, [...teamBravoIds, newPlayer.id]);
      }
    }
  };

  // Update Player
  const handleUpdatePlayer = (id: string, updates: Partial<Player>) => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, ...updates };

        // If status changed to absent, remove from teams
        if (updates.status === 'absent') {
          handleUpdateTeams(
            teamAlphaIds.filter((tid) => tid !== id),
            teamBravoIds.filter((tid) => tid !== id)
          );
        }
        return updated;
      })
    );
  };

  // Delete Player
  const handleDeletePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    handleUpdateTeams(
      teamAlphaIds.filter((tid) => tid !== id),
      teamBravoIds.filter((tid) => tid !== id)
    );
  };

  // Extra ammo update from finance tab
  const handleUpdatePlayerExtraAmmo = (playerId: string, packs: number) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, extraAmmoPacks: packs } : p))
    );
  };

  // Toggle gear from finance tab
  const handleTogglePlayerGear = (playerId: string, hasOwnGear: boolean) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, hasOwnGear: !hasOwnGear } : p))
    );
  };

  // Save Completed Match and update Player stats & Badges
  const handleSaveCompletedMatch = (
    record: MatchHistoryRecord,
    mvpId?: string,
    firstEliminatedId?: string,
    ghostIds?: string[]
  ) => {
    // 1. Add to history
    setMatchHistory((prev) => [record, ...prev]);

    // 2. Update players statistics and award badges
    setPlayers((prev) => {
      // Determine highest ammo spender for "Gatilho Nervoso" badge
      const sortedByAmmo = [...prev].sort((a, b) => (b.extraAmmoPacks || 0) - (a.extraAmmoPacks || 0));
      const highestAmmoPlayerId = sortedByAmmo[0]?.extraAmmoPacks > 0 ? sortedByAmmo[0].id : null;

      return prev.map((p) => {
        const participatedInAlpha = record.teamAlpha.playerIds.includes(p.id);
        const participatedInBravo = record.teamBravo.playerIds.includes(p.id);

        if (!participatedInAlpha && !participatedInBravo) {
          return p;
        }

        const isWinner =
          (record.winner === 'Alfa' && participatedInAlpha) ||
          (record.winner === 'Bravo' && participatedInBravo);

        const isMvp = p.id === mvpId;
        const isFirstCasualty = p.id === firstEliminatedId;
        const isGhost = ghostIds?.includes(p.id) || false;
        const isTopAmmo = p.id === highestAmmoPlayerId;

        const nextMatches = p.stats.matches + 1;
        const nextWins = isWinner ? p.stats.wins + 1 : p.stats.wins;
        const nextMvps = isMvp ? p.stats.mvps + 1 : p.stats.mvps;

        // Collect new badges
        const badgesSet = new Set(p.badges || []);

        if (isFirstCasualty) {
          badgesSet.add('cannon_fodder');
        }
        if (isGhost && isWinner) {
          badgesSet.add('ghost_operator');
        }
        if (isTopAmmo) {
          badgesSet.add('trigger_happy');
        }
        if (record.scenario === 'vip' && isWinner) {
          badgesSet.add('vip_protector');
        }
        if (nextMvps >= 3) {
          badgesSet.add('field_general');
        }
        if (nextMatches >= 5 && nextWins / nextMatches >= 0.65) {
          badgesSet.add('sharpshooter');
        }

        return {
          ...p,
          stats: {
            ...p.stats,
            matches: nextMatches,
            wins: nextWins,
            mvps: nextMvps,
          },
          badges: Array.from(badgesSet),
        };
      });
    });
  };

  // Reset to initial mock data
  const handleResetData = () => {
    if (confirm('Deseja restaurar todos os operadores, configurações e histórico para o padrão de demonstração?')) {
      tacticalAudio.playWhistle();
      localStorage.removeItem('paintops_players_v2');
      localStorage.removeItem('paintops_finance_v2');
      localStorage.removeItem('paintops_history_v2');
      localStorage.removeItem('paintops_scenarios_v2');
      localStorage.removeItem('paintops_team_alpha');
      localStorage.removeItem('paintops_team_bravo');
      setPlayers(INITIAL_PLAYERS);
      setFinancialConfig(INITIAL_FINANCIAL);
      setMatchHistory(INITIAL_MATCH_HISTORY);
      setScenarios(SCENARIO_PRESETS);

      const confirmed = INITIAL_PLAYERS.filter((p) => p.status === 'confirmed').map((p) => p.id);
      const a = confirmed.slice(0, Math.ceil(confirmed.length / 2));
      const b = confirmed.slice(Math.ceil(confirmed.length / 2));
      setTeamAlphaIds(a);
      setTeamBravoIds(b);
    }
  };

  const confirmedCount = players.filter((p) => p.status === 'confirmed').length;

  // View Mode: 1. Landing Page
  if (viewMode === 'landing') {
    return (
      <LandingPage
        onOpenApp={() => setViewMode('app')}
        onOpenAdmin={() => setViewMode('admin')}
        players={players}
        config={financialConfig}
        scenarios={scenarios}
        matchHistory={matchHistory}
      />
    );
  }

  // View Mode: 2. Admin Panel CRUD
  if (viewMode === 'admin') {
    return (
      <AdminPanel
        players={players}
        config={financialConfig}
        matchHistory={matchHistory}
        scenarios={scenarios}
        onUpdatePlayers={setPlayers}
        onUpdateConfig={setFinancialConfig}
        onUpdateMatchHistory={setMatchHistory}
        onUpdateScenarios={setScenarios}
        onResetFactoryData={handleResetData}
        onBackToApp={() => setViewMode('app')}
        onGoToLanding={() => setViewMode('landing')}
      />
    );
  }

  // View Mode: 3. Main Tactical Operational App
  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 flex flex-col bg-tactical-grid">
      {/* Tactical Top Bar */}
      <Header
        confirmedCount={confirmedCount}
        totalPlayers={players.length}
        isMatchLive={liveMatchState.isRunning && !liveMatchState.isPaused}
        onResetData={handleResetData}
        onNavigateLanding={() => setViewMode('landing')}
        onNavigateAdmin={() => setViewMode('admin')}
      />

      {/* Tactical Floating Notification Toasts */}
      <NotificationToast />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-3 sm:pt-5 pb-24 md:pb-8">
        {/* Responsive Navigation */}
        <Navigation
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isMatchActive={liveMatchState.isRunning && !liveMatchState.isPaused}
        />

        {/* Tab Views */}
        <div className="mt-3 sm:mt-5">
          {currentTab === 'pelotao' && (
            <SquadTab
              players={players}
              onAddPlayer={handleAddPlayer}
              onUpdatePlayer={handleUpdatePlayer}
              onDeletePlayer={handleDeletePlayer}
              onResetSquad={handleResetData}
            />
          )}

          {currentTab === 'sorteador' && (
            <TeamDraftTab
              players={players}
              teamAlphaIds={teamAlphaIds}
              teamBravoIds={teamBravoIds}
              onUpdateTeams={handleUpdateTeams}
              onDeployToField={handleDeployToField}
            />
          )}

          {currentTab === 'juiz' && (
            <LiveMatchTab
              players={players}
              matchState={liveMatchState}
              onUpdateMatchState={setLiveMatchState}
              onSaveCompletedMatch={handleSaveCompletedMatch}
            />
          )}

          {currentTab === 'financeiro' && (
            <FinanceTab
              players={players}
              config={financialConfig}
              matchHistory={matchHistory}
              liveMatch={liveMatchState}
              onUpdateConfig={setFinancialConfig}
              onUpdatePlayerExtraAmmo={handleUpdatePlayerExtraAmmo}
              onTogglePlayerGear={handleTogglePlayerGear}
            />
          )}

          {currentTab === 'classificacao' && (
            <HallOfFameTab
              players={players}
              matchHistory={matchHistory}
              config={financialConfig}
            />
          )}
        </div>
      </main>
    </div>
  );
}
