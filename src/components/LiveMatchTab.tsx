import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, Pause, RotateCcw, Volume2, Shield, Crosshair, 
  Flag, Crown, ShieldAlert, Award, AlertTriangle, 
  CheckCircle2, Skull, Zap, Plus, Minus, Flame, Timer,
  Bell, BellRing, BellOff
} from 'lucide-react';
import { 
  LiveMatchState, Player, GameScenario, MatchHistoryRecord 
} from '../types';
import { SCENARIO_PRESETS } from '../utils/mockData';
import { tacticalAudio } from '../utils/audio';
import { tacticalNotifications, NotificationPermissionStatus } from '../utils/notifications';

interface LiveMatchTabProps {
  players: Player[];
  matchState: LiveMatchState;
  onUpdateMatchState: (updater: (prev: LiveMatchState) => LiveMatchState) => void;
  onSaveCompletedMatch: (record: MatchHistoryRecord, mvpId?: string, firstEliminatedId?: string, ghostIds?: string[]) => void;
}

export const LiveMatchTab: React.FC<LiveMatchTabProps> = ({
  players,
  matchState,
  onUpdateMatchState,
  onSaveCompletedMatch,
}) => {
  const [selectedDurationMinutes, setSelectedDurationMinutes] = useState<number>(8);
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<'Alfa' | 'Bravo' | 'Empate'>('Alfa');
  const [selectedMvp, setSelectedMvp] = useState<string>('');
  const [vipEscortedSafe, setVipEscortedSafe] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermissionStatus>('default');

  // Audio & Notification timer trigger memory so we don't repeat alert on same second
  const lastAlertSecondRef = useRef<number | null>(null);

  // Active scenario preset
  const activeScenario = SCENARIO_PRESETS.find((s) => s.id === matchState.scenario) || SCENARIO_PRESETS[0];

  useEffect(() => {
    setNotifPermission(tacticalNotifications.getPermissionStatus());
  }, []);

  const handleRequestNotifPermission = async () => {
    tacticalAudio.playClick();
    const status = await tacticalNotifications.requestPermission();
    setNotifPermission(status);
  };

  // Timer Tick Hook
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (matchState.isRunning && !matchState.isPaused && matchState.timeRemaining > 0) {
      interval = setInterval(() => {
        onUpdateMatchState((prev) => {
          if (!prev.isRunning || prev.isPaused || prev.timeRemaining <= 0) {
            return prev;
          }

          const nextTime = prev.timeRemaining - 1;

          // Sound & Local Browser Notification Triggers
          if (nextTime === 60 && lastAlertSecondRef.current !== 60) {
            lastAlertSecondRef.current = 60;
            tacticalAudio.playWarning(880);
            tacticalNotifications.notify60Seconds(activeScenario.name);
          } else if (nextTime === 30 && lastAlertSecondRef.current !== 30) {
            lastAlertSecondRef.current = 30;
            tacticalAudio.playWarning(980);
            tacticalNotifications.notify30Seconds(activeScenario.name);
          } else if (nextTime <= 10 && nextTime > 0 && lastAlertSecondRef.current !== nextTime) {
            lastAlertSecondRef.current = nextTime;
            tacticalAudio.playCountdownTick(nextTime <= 3);
          } else if (nextTime === 0 && lastAlertSecondRef.current !== 0) {
            lastAlertSecondRef.current = 0;
            tacticalAudio.playRoundEndBuzzer();
            tacticalNotifications.notifyRoundEnd(activeScenario.name);
          }

          if (nextTime <= 0) {
            return {
              ...prev,
              timeRemaining: 0,
              isRunning: false,
              isFinished: true,
              events: [
                ...prev.events,
                {
                  id: `ev-${Date.now()}`,
                  timestampSeconds: 0,
                  realTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                  type: 'system',
                  text: 'FIM DE TEMPO! Apito final do árbitro.',
                },
              ],
            };
          }

          return {
            ...prev,
            timeRemaining: nextTime,
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [matchState.isRunning, matchState.isPaused, matchState.timeRemaining, onUpdateMatchState, activeScenario.name]);

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start / Resume Match
  const handleStartResume = () => {
    tacticalAudio.playWhistle();
    onUpdateMatchState((prev) => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      startedAt: prev.startedAt || new Date().toISOString(),
      events: [
        ...prev.events,
        {
          id: `ev-${Date.now()}`,
          timestampSeconds: prev.timeRemaining,
          realTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          type: 'start',
          text: prev.startedAt ? 'PARTIDA REINICIADA / DESPAUSADA' : 'INÍCIO DE ROUND! Fogo liberado.',
        },
      ],
    }));
  };

  // Pause Match
  const handlePause = () => {
    tacticalAudio.playClick();
    onUpdateMatchState((prev) => ({
      ...prev,
      isPaused: true,
      events: [
        ...prev.events,
        {
          id: `ev-${Date.now()}`,
          timestampSeconds: prev.timeRemaining,
          realTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          type: 'pause',
          text: 'PARTIDA EM PAUSA TÁTICA PELO ÁRBITRO',
        },
      ],
    }));
  };

  // Reset Match
  const handleReset = () => {
    if (confirm('Deseja reiniciar o cronômetro e zerar a contagem deste round?')) {
      tacticalAudio.playClick();
      lastAlertSecondRef.current = null;
      onUpdateMatchState((prev) => ({
        ...prev,
        timeRemaining: prev.durationSeconds,
        isRunning: false,
        isPaused: false,
        isFinished: false,
        firstEliminatedPlayerId: undefined,
        teamAlpha: {
          ...prev.teamAlpha,
          score: 0,
          alivePlayerIds: [...prev.teamAlpha.players],
          penalties: 0,
        },
        teamBravo: {
          ...prev.teamBravo,
          score: 0,
          alivePlayerIds: [...prev.teamBravo.players],
          penalties: 0,
        },
        events: [
          {
            id: `ev-${Date.now()}`,
            timestampSeconds: prev.durationSeconds,
            realTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            type: 'system',
            text: 'ROUND REINICIADO PELO ÁRBITRO',
          },
        ],
      }));
    }
  };

  // Change Scenario Preset
  const handleSelectScenario = (scen: GameScenario) => {
    tacticalAudio.playClick();
    const preset = SCENARIO_PRESETS.find((s) => s.id === scen) || SCENARIO_PRESETS[0];
    const totalSecs = preset.defaultDurationMinutes * 60;
    setSelectedDurationMinutes(preset.defaultDurationMinutes);

    onUpdateMatchState((prev) => ({
      ...prev,
      scenario: scen,
      durationSeconds: totalSecs,
      timeRemaining: totalSecs,
      isRunning: false,
      isPaused: false,
      isFinished: false,
      firstEliminatedPlayerId: undefined,
      teamAlpha: {
        ...prev.teamAlpha,
        score: 0,
        alivePlayerIds: [...prev.teamAlpha.players],
        penalties: 0,
      },
      teamBravo: {
        ...prev.teamBravo,
        score: 0,
        alivePlayerIds: [...prev.teamBravo.players],
        penalties: 0,
      },
      events: [
        {
          id: `ev-${Date.now()}`,
          timestampSeconds: totalSecs,
          realTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          type: 'system',
          text: `Cenário selecionado: ${preset.name}`,
        },
      ],
    }));
  };

  // Set Round Duration (5, 8, 10, 15 min or custom)
  const handleSetDuration = (minutes: number) => {
    if (minutes < 1 || minutes > 60) return;
    tacticalAudio.playClick();
    setSelectedDurationMinutes(minutes);
    const totalSecs = minutes * 60;
    lastAlertSecondRef.current = null;

    onUpdateMatchState((prev) => {
      // If match is not currently running or hasn't started or already finished, update timeRemaining directly
      const shouldResetRemaining = !prev.isRunning || prev.isFinished || prev.timeRemaining === prev.durationSeconds;
      return {
        ...prev,
        durationSeconds: totalSecs,
        timeRemaining: shouldResetRemaining ? totalSecs : prev.timeRemaining,
        isFinished: false,
        events: [
          ...prev.events,
          {
            id: `ev-${Date.now()}`,
            timestampSeconds: totalSecs,
            realTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            type: 'system',
            text: `Duração do round redefinida para ${minutes} minutos (${formatTime(totalSecs)})`,
          },
        ],
      };
    });
  };

  // Quick Score Modification
  const addScore = (team: 'Alfa' | 'Bravo', delta: number) => {
    tacticalAudio.playClick();
    onUpdateMatchState((prev) => {
      const isAlpha = team === 'Alfa';
      const targetTeam = isAlpha ? prev.teamAlpha : prev.teamBravo;
      const nextScore = Math.max(0, targetTeam.score + delta);

      return {
        ...prev,
        [isAlpha ? 'teamAlpha' : 'teamBravo']: {
          ...targetTeam,
          score: nextScore,
        },
        events: [
          ...prev.events,
          {
            id: `ev-${Date.now()}`,
            timestampSeconds: prev.timeRemaining,
            realTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            type: 'point',
            team,
            text: delta > 0 ? `+${delta} Ponto para Equipe ${team}` : `${delta} Ponto ajustado em ${team}`,
          },
        ],
      };
    });
  };

  // Add Penalty
  const addPenalty = (team: 'Alfa' | 'Bravo') => {
    tacticalAudio.playWarning(400);
    onUpdateMatchState((prev) => {
      const isAlpha = team === 'Alfa';
      const targetTeam = isAlpha ? prev.teamAlpha : prev.teamBravo;

      return {
        ...prev,
        [isAlpha ? 'teamAlpha' : 'teamBravo']: {
          ...targetTeam,
          penalties: targetTeam.penalties + 1,
        },
        events: [
          ...prev.events,
          {
            id: `ev-${Date.now()}`,
            timestampSeconds: prev.timeRemaining,
            realTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            type: 'penalty',
            team,
            text: `FALTA / ADVERTÊNCIA marcada contra Equipe ${team}!`,
          },
        ],
      };
    });
  };

  // Toggle Player Casualty / Elimination
  const handleTogglePlayerEliminated = (team: 'Alfa' | 'Bravo', playerId: string) => {
    tacticalAudio.playElimination();

    onUpdateMatchState((prev) => {
      const isAlpha = team === 'Alfa';
      const targetTeam = isAlpha ? prev.teamAlpha : prev.teamBravo;
      const otherTeam = isAlpha ? prev.teamBravo : prev.teamAlpha;
      const isAlive = targetTeam.alivePlayerIds.includes(playerId);

      let nextAlive: string[];
      let nextFirstEliminated = prev.firstEliminatedPlayerId;
      let newScore = otherTeam.score;

      const playerObj = players.find((p) => p.id === playerId);
      const callsign = playerObj ? playerObj.callsign : 'Operador';

      if (isAlive) {
        // Was eliminated!
        nextAlive = targetTeam.alivePlayerIds.filter((id) => id !== playerId);
        if (!nextFirstEliminated) {
          nextFirstEliminated = playerId; // First Casualty = "Bucha de Canhão"
        }
        // Give point to opposing team
        newScore += 1;
      } else {
        // Revive / Untoggle
        nextAlive = [...targetTeam.alivePlayerIds, playerId];
        if (nextFirstEliminated === playerId) {
          nextFirstEliminated = undefined;
        }
      }

      const eventText = isAlive
        ? `BAIXA: "${callsign}" (${team}) foi neutralizado! (+1 pt p/ ${isAlpha ? 'Bravo' : 'Alfa'})`
        : `REVIVIDO: "${callsign}" (${team}) retornou ao jogo`;

      return {
        ...prev,
        firstEliminatedPlayerId: nextFirstEliminated,
        [isAlpha ? 'teamAlpha' : 'teamBravo']: {
          ...targetTeam,
          alivePlayerIds: nextAlive,
        },
        [isAlpha ? 'teamBravo' : 'teamAlpha']: {
          ...otherTeam,
          score: newScore,
        },
        events: [
          ...prev.events,
          {
            id: `ev-${Date.now()}`,
            timestampSeconds: prev.timeRemaining,
            realTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            type: 'elimination',
            team,
            playerId,
            text: eventText,
          },
        ],
      };
    });
  };

  // Instant Wipe Out Victory (Eliminação Total)
  const handleInstantWipeout = (winningTeam: 'Alfa' | 'Bravo') => {
    tacticalAudio.playRoundEndBuzzer();
    const losingTeam = winningTeam === 'Alfa' ? 'Bravo' : 'Alfa';

    onUpdateMatchState((prev) => ({
      ...prev,
      isRunning: false,
      isFinished: true,
      timeRemaining: 0,
      roundWinner: winningTeam,
      events: [
        ...prev.events,
        {
          id: `ev-${Date.now()}`,
          timestampSeconds: prev.timeRemaining,
          realTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          type: 'system',
          team: winningTeam,
          text: `ELIMINAÇÃO TOTAL! Todos os operadores de ${losingTeam} foram neutralizados. Vitória de ${winningTeam}!`,
        },
      ],
    }));

    setSelectedWinner(winningTeam);
    setFinishModalOpen(true);
  };

  // Open Finish Round Modal
  const openFinishModal = () => {
    tacticalAudio.playClick();
    // Default winner to highest score
    if (matchState.teamAlpha.score > matchState.teamBravo.score) {
      setSelectedWinner('Alfa');
    } else if (matchState.teamBravo.score > matchState.teamAlpha.score) {
      setSelectedWinner('Bravo');
    } else {
      setSelectedWinner('Empate');
    }

    // Default MVP suggestion: player from winning team with highest skill or most alive
    const candidates = selectedWinner === 'Bravo' ? matchState.teamBravo.players : matchState.teamAlpha.players;
    if (candidates.length > 0) {
      setSelectedMvp(candidates[0]);
    }
    setFinishModalOpen(true);
  };

  // Save Round & Grant Achievements
  const handleConfirmFinishRound = () => {
    tacticalAudio.playVictory();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: selectedWinner === 'Alfa' ? ['#06b6d4', '#38bdf8', '#ffffff'] : ['#ef4444', '#f97316', '#ffffff'],
    });

    // Calculate Ghost Operatives: alive players from winning team
    const winningPlayerIds = selectedWinner === 'Alfa' 
      ? matchState.teamAlpha.players 
      : selectedWinner === 'Bravo' 
      ? matchState.teamBravo.players 
      : [];
    
    const winningAliveIds = selectedWinner === 'Alfa'
      ? matchState.teamAlpha.alivePlayerIds
      : selectedWinner === 'Bravo'
      ? matchState.teamBravo.alivePlayerIds
      : [];

    const ghostOperatives = winningPlayerIds.filter((id) => winningAliveIds.includes(id));

    const record: MatchHistoryRecord = {
      id: `match-${Date.now()}`,
      date: new Date().toISOString(),
      scenario: matchState.scenario,
      scenarioName: activeScenario.name,
      durationMinutes: Math.round(matchState.durationSeconds / 60),
      teamAlpha: {
        name: 'Alfa',
        score: matchState.teamAlpha.score,
        playerIds: [...matchState.teamAlpha.players],
      },
      teamBravo: {
        name: 'Bravo',
        score: matchState.teamBravo.score,
        playerIds: [...matchState.teamBravo.players],
      },
      winner: selectedWinner,
      mvpPlayerId: selectedMvp || undefined,
      firstEliminatedPlayerId: matchState.firstEliminatedPlayerId,
      ghostOperativeIds: ghostOperatives,
      notes: `Partida concluída. Vitória de ${selectedWinner}. MVP: ${
        players.find((p) => p.id === selectedMvp)?.callsign || 'N/A'
      }.`,
    };

    onSaveCompletedMatch(
      record,
      selectedMvp,
      matchState.firstEliminatedPlayerId,
      ghostOperatives
    );

    setFinishModalOpen(false);

    // Reset for next round
    onUpdateMatchState((prev) => ({
      ...prev,
      timeRemaining: prev.durationSeconds,
      isRunning: false,
      isPaused: false,
      isFinished: false,
      firstEliminatedPlayerId: undefined,
      teamAlpha: {
        ...prev.teamAlpha,
        score: 0,
        alivePlayerIds: [...prev.teamAlpha.players],
        penalties: 0,
      },
      teamBravo: {
        ...prev.teamBravo,
        score: 0,
        alivePlayerIds: [...prev.teamBravo.players],
        penalties: 0,
      },
      events: [
        {
          id: `ev-${Date.now()}`,
          timestampSeconds: prev.durationSeconds,
          realTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          type: 'system',
          text: 'NOVO ROUND INICIADO! Placar zerado para próxima rodada.',
        },
      ],
    }));
  };

  const ScenarioIcon = activeScenario.id === 'deathmatch'
    ? Crosshair
    : activeScenario.id === 'ctf'
    ? Flag
    : activeScenario.id === 'vip'
    ? ShieldAlert
    : Crown;

  return (
    <div className="space-y-4 pb-24 md:pb-8">
      {/* Scenario Presets Selector Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {SCENARIO_PRESETS.map((scen) => {
          const isSelected = matchState.scenario === scen.id;
          const Icon = scen.id === 'deathmatch'
            ? Crosshair
            : scen.id === 'ctf'
            ? Flag
            : scen.id === 'vip'
            ? ShieldAlert
            : Crown;

          return (
            <button
              key={scen.id}
              onClick={() => handleSelectScenario(scen.id)}
              className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-orange-500/15 border-orange-500 text-white shadow-tactical-orange'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-orange-400' : 'text-slate-500'}`} />
                <span className="font-mono text-[10px] text-slate-400">
                  {scen.defaultDurationMinutes}min
                </span>
              </div>
              <div>
                <p className="font-tactical font-black text-xs uppercase tracking-wide text-white truncate">
                  {scen.shortName}
                </p>
                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                  {scen.tagline}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* BIG OPERATIONAL REFEREE CONSOLE (TIMER & CONTROLS) */}
      <div className="bg-[#0b0f17] border-2 border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Urgent Alert Visual Glow */}
        {matchState.isRunning && matchState.timeRemaining <= 30 && (
          <div className="absolute inset-0 border-2 border-red-500/40 pointer-events-none animate-pulse rounded-2xl"></div>
        )}

        {/* Top Header: Scenario Title & Mode Details */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <ScenarioIcon className="w-5 h-5 text-orange-400" />
            <h2 className="font-tactical font-black text-sm sm:text-base uppercase tracking-wider text-white">
              {activeScenario.name}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400 hidden sm:inline">Objetivo:</span>
            <span className="text-amber-400 font-semibold truncate max-w-[200px] sm:max-w-none">
              {activeScenario.objective}
            </span>
          </div>
        </div>

        {/* ROUND DURATION SELECTOR (Glove-friendly referee presets: 5, 8, 10, 15 min or custom) */}
        {(() => {
          const currentMins = Math.round(matchState.durationSeconds / 60);
          const isLocked = matchState.isRunning && !matchState.isPaused;

          return (
            <div className="mt-3 pt-2.5 pb-2 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-orange-400" />
                <span className="font-tactical font-bold text-xs uppercase tracking-wider text-slate-300">
                  Duração da Rodada:
                </span>
                {isLocked && (
                  <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    (Bloqueado em combate)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {[5, 8, 10, 15].map((mins) => {
                  const isSelected = currentMins === mins;
                  return (
                    <button
                      key={mins}
                      disabled={isLocked}
                      onClick={() => handleSetDuration(mins)}
                      className={`px-3 py-1.5 rounded-lg font-tactical font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        isSelected
                          ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/40 border border-orange-400 scale-105'
                          : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      {mins} MIN
                    </button>
                  );
                })}

                {/* Custom Stepper */}
                <div className="flex items-center ml-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                  <button
                    disabled={isLocked || currentMins <= 1}
                    onClick={() => handleSetDuration(currentMins - 1)}
                    title="Diminuir 1 minuto"
                    className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 text-xs font-code font-bold text-white min-w-[3rem] text-center">
                    {currentMins}m
                  </span>
                  <button
                    disabled={isLocked || currentMins >= 60}
                    onClick={() => handleSetDuration(currentMins + 1)}
                    title="Aumentar 1 minuto"
                    className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* GIANT COUNTDOWN TIMER WITH CRITICAL 30S PULSE ANIMATION */}
        {(() => {
          const isCritical30s = matchState.isRunning && !matchState.isPaused && matchState.timeRemaining <= 30 && matchState.timeRemaining > 0;
          const isWarning60s = matchState.isRunning && !matchState.isPaused && matchState.timeRemaining <= 60 && matchState.timeRemaining > 30;
          const isEnded = matchState.timeRemaining === 0;

          return (
            <div className={`my-4 sm:my-6 text-center relative transition-all duration-500 ${
              isCritical30s
                ? 'p-4 sm:p-6 rounded-2xl bg-red-950/30 border-2 border-red-500/70 shadow-[0_0_50px_rgba(239,68,68,0.35)] animate-pulse'
                : isWarning60s
                ? 'p-3 rounded-2xl bg-amber-950/20 border border-amber-500/40'
                : ''
            }`}>
              {/* Expanding emergency radar aura on 30s critical */}
              {isCritical30s && (
                <div className="absolute inset-0 rounded-2xl bg-red-500/15 animate-ping opacity-30 pointer-events-none" />
              )}

              {/* Critical Alert Subheading */}
              {isCritical30s && (
                <div className="inline-flex items-center gap-2 px-3 py-1 mb-2 rounded-full bg-red-500/20 border border-red-500 text-red-300 text-xs font-tactical font-black uppercase tracking-widest animate-bounce">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>RETA FINAL • ÚLTIMOS 30 SEGUNDOS</span>
                </div>
              )}

              {/* Giant Digits */}
              <div
                className={`font-code font-black text-6xl sm:text-8xl md:text-9xl tracking-tight select-none transition-all duration-300 ${
                  isEnded
                    ? 'text-red-500 animate-bounce drop-shadow-[0_0_25px_rgba(239,68,68,0.8)]'
                    : isCritical30s
                    ? 'text-red-500 animate-pulse drop-shadow-[0_0_35px_rgba(239,68,68,0.85)] scale-105'
                    : isWarning60s
                    ? 'text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                    : 'text-white'
                }`}
              >
                {formatTime(matchState.timeRemaining)}
              </div>

              {/* Operational State Pill */}
              <div className="flex items-center justify-center gap-2 mt-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-tactical font-bold uppercase tracking-widest transition-all ${
                    isCritical30s
                      ? 'bg-red-500/30 text-red-200 border-2 border-red-500 shadow-md shadow-red-500/40 animate-pulse'
                      : matchState.isRunning && !matchState.isPaused
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : matchState.isPaused
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : matchState.isFinished
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    isCritical30s
                      ? 'bg-red-400 animate-ping'
                      : matchState.isRunning && !matchState.isPaused
                      ? 'bg-emerald-400 animate-ping'
                      : 'bg-slate-400'
                  }`} />
                  {isCritical30s
                    ? 'CRÍTICO: 30s FINAIS'
                    : matchState.isRunning && !matchState.isPaused
                    ? 'COMBATE EM ANDAMENTO'
                    : matchState.isPaused
                    ? 'PAUSA TÁTICA'
                    : matchState.isFinished
                    ? 'TEMPO ESGOTADO'
                    : 'AGUARDANDO APITO INICIAL'}
                </span>
              </div>
            </div>
          );
        })()}

        {/* LARGE GLOVE-FRIENDLY REFEREE CONTROLS */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 max-w-xl mx-auto">
          {/* Play / Pause Toggle */}
          {!matchState.isRunning || matchState.isPaused ? (
            <button
              onClick={handleStartResume}
              className="py-4 px-2 sm:px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-tactical font-black text-sm sm:text-base uppercase tracking-wider shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>{matchState.isPaused ? 'Retomar' : 'Iniciar'}</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="py-4 px-2 sm:px-6 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-tactical font-black text-sm sm:text-base uppercase tracking-wider shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Pause className="w-5 h-5" />
              <span>Pausar</span>
            </button>
          )}

          {/* Reset Timer */}
          <button
            onClick={handleReset}
            className="py-4 px-2 sm:px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-tactical font-bold text-sm sm:text-base uppercase tracking-wider border border-slate-700 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <RotateCcw className="w-5 h-5 text-orange-400" />
            <span>Zerar</span>
          </button>

          {/* Finish & Record Round */}
          <button
            onClick={openFinishModal}
            className="py-4 px-2 sm:px-6 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-tactical font-black text-sm sm:text-base uppercase tracking-wider shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Award className="w-5 h-5" />
            <span>Finalizar</span>
          </button>
        </div>

        {/* BROWSER NOTIFICATION STATUS & ACTION BAR FOR REFEREE */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`p-1.5 rounded-md ${
                notifPermission === 'granted'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : notifPermission === 'denied'
                  ? 'bg-slate-800 text-slate-500 border border-slate-700'
                  : 'bg-orange-500/20 text-orange-400 border border-orange-500/40 animate-pulse'
              }`}
            >
              {notifPermission === 'granted' ? (
                <BellRing className="w-4 h-4" />
              ) : notifPermission === 'denied' ? (
                <BellOff className="w-4 h-4" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
            </span>
            <div className="text-left">
              <span className="font-tactical font-bold text-slate-200 block uppercase tracking-wider text-[11px]">
                {notifPermission === 'granted'
                  ? 'Notificações Locais Ativas (60s, 30s e 0s)'
                  : notifPermission === 'denied'
                  ? 'Notificações do Navegador Bloqueadas'
                  : 'Notificações do Navegador Pendentes'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {notifPermission === 'granted'
                  ? 'Alertas visuais, som tático e vibração no smartphone ativados'
                  : notifPermission === 'denied'
                  ? 'Ative nas permissões do navegador se desejar receber alertas em segundo plano'
                  : 'Receba avisos automáticos nos 60s, 30s e no término de round'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-center">
            {notifPermission !== 'granted' && notifPermission !== 'denied' && (
              <button
                onClick={handleRequestNotifPermission}
                className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-tactical font-bold text-[11px] uppercase tracking-wider transition-all flex items-center gap-1 shadow-sm shadow-orange-600/30 active:scale-95"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Ativar Notificações</span>
              </button>
            )}

            {notifPermission === 'granted' && (
              <button
                onClick={() => {
                  tacticalAudio.playClick();
                  tacticalNotifications.sendNotification('🎯 PaintOps: Teste de Alerta Tático', {
                    body: 'Notificação local funcionando com sucesso para o árbitro!',
                  });
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-tactical text-[10px] uppercase font-bold tracking-wider border border-slate-700 transition-colors"
              >
                Testar Alerta
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LIVE SCOREBOARD & TACTICAL EVENT CONTROLS (ALFA VS BRAVO) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* TEAM ALFA (CYAN) LIVE PANEL */}
        <div className="bg-[#0b1320] border-2 border-cyan-500/50 rounded-2xl p-4 shadow-alpha">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400"></span>
              <h3 className="font-tactical font-black text-xl text-cyan-300 uppercase tracking-wider">
                Equipe Alfa
              </h3>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-cyan-400">
              <span>Vivos:</span>
              <span className="text-white font-bold text-sm px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40">
                {matchState.teamAlpha.alivePlayerIds.length} / {matchState.teamAlpha.players.length}
              </span>
            </div>
          </div>

          {/* Big Score Display & Big Adjustment Buttons */}
          <div className="flex items-center justify-between my-4 bg-slate-950/70 p-3 rounded-xl border border-cyan-500/30">
            <div className="flex items-center gap-2">
              <button
                onClick={() => addScore('Alfa', -1)}
                className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-xl font-black active:scale-95"
              >
                -1
              </button>
              <button
                onClick={() => addScore('Alfa', 1)}
                className="w-12 h-12 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center text-xl font-black active:scale-95 shadow-sm shadow-cyan-600/50"
              >
                +1
              </button>
            </div>

            <div className="text-center px-4">
              <span className="block text-[11px] font-tactical uppercase tracking-wider text-cyan-400">
                Placar / Baixas
              </span>
              <span className="font-code font-black text-5xl text-white">
                {matchState.teamAlpha.score}
              </span>
            </div>

            {/* Quick Action: Penalidade ou Wipeout */}
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => addPenalty('Alfa')}
                className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-tactical uppercase font-bold hover:bg-amber-500/20 active:scale-95"
              >
                Falta ({matchState.teamAlpha.penalties})
              </button>
              <button
                onClick={() => handleInstantWipeout('Alfa')}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs font-tactical uppercase font-bold hover:bg-cyan-500/25 active:scale-95"
              >
                Vitória Total
              </button>
            </div>
          </div>

          {/* Operatives Casualty Checklist (Click to eliminate) */}
          <div className="space-y-1.5">
            <p className="text-xs font-tactical uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
              <span>Operadores em Campo (Toque para registrar baixa)</span>
              <span className="text-[10px] text-cyan-400 font-mono">1-Toque Baixa</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {matchState.teamAlpha.players.map((id) => {
                const p = players.find((pl) => pl.id === id);
                if (!p) return null;
                const isAlive = matchState.teamAlpha.alivePlayerIds.includes(p.id);
                const isFirstCasualty = matchState.firstEliminatedPlayerId === p.id;

                return (
                  <button
                    key={p.id}
                    onClick={() => handleTogglePlayerEliminated('Alfa', p.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between gap-2 active:scale-95 ${
                      isAlive
                        ? 'bg-slate-900/90 border-cyan-500/40 text-white hover:border-cyan-400'
                        : 'bg-red-950/40 border-red-500/50 text-red-400 line-through opacity-75'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {isAlive ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Skull className="w-4 h-4 text-red-500 shrink-0 animate-pulse" />
                      )}
                      <span className="font-tactical font-bold text-xs uppercase truncate">
                        "{p.callsign}"
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isFirstCasualty && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold" title="Primeiro eliminado! Bucha de Canhão">
                          🪖 1ª Baixa
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono">
                        {isAlive ? 'ATIVO' : 'FORA'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* TEAM BRAVO (RED) LIVE PANEL */}
        <div className="bg-[#1a1012] border-2 border-red-500/50 rounded-2xl p-4 shadow-bravo">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-red-500/20">
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded-full bg-red-500 shadow-sm shadow-red-500"></span>
              <h3 className="font-tactical font-black text-xl text-red-300 uppercase tracking-wider">
                Equipe Bravo
              </h3>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-red-400">
              <span>Vivos:</span>
              <span className="text-white font-bold text-sm px-2 py-0.5 rounded bg-red-950 border border-red-500/40">
                {matchState.teamBravo.alivePlayerIds.length} / {matchState.teamBravo.players.length}
              </span>
            </div>
          </div>

          {/* Big Score Display & Big Adjustment Buttons */}
          <div className="flex items-center justify-between my-4 bg-slate-950/70 p-3 rounded-xl border border-red-500/30">
            <div className="flex items-center gap-2">
              <button
                onClick={() => addScore('Bravo', -1)}
                className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-xl font-black active:scale-95"
              >
                -1
              </button>
              <button
                onClick={() => addScore('Bravo', 1)}
                className="w-12 h-12 rounded-lg bg-red-600 hover:bg-red-500 text-white flex items-center justify-center text-xl font-black active:scale-95 shadow-sm shadow-red-600/50"
              >
                +1
              </button>
            </div>

            <div className="text-center px-4">
              <span className="block text-[11px] font-tactical uppercase tracking-wider text-red-400">
                Placar / Baixas
              </span>
              <span className="font-code font-black text-5xl text-white">
                {matchState.teamBravo.score}
              </span>
            </div>

            {/* Quick Action: Penalidade ou Wipeout */}
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => addPenalty('Bravo')}
                className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-tactical uppercase font-bold hover:bg-amber-500/20 active:scale-95"
              >
                Falta ({matchState.teamBravo.penalties})
              </button>
              <button
                onClick={() => handleInstantWipeout('Bravo')}
                className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-tactical uppercase font-bold hover:bg-red-500/25 active:scale-95"
              >
                Vitória Total
              </button>
            </div>
          </div>

          {/* Operatives Casualty Checklist (Click to eliminate) */}
          <div className="space-y-1.5">
            <p className="text-xs font-tactical uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
              <span>Operadores em Campo (Toque para registrar baixa)</span>
              <span className="text-[10px] text-red-400 font-mono">1-Toque Baixa</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {matchState.teamBravo.players.map((id) => {
                const p = players.find((pl) => pl.id === id);
                if (!p) return null;
                const isAlive = matchState.teamBravo.alivePlayerIds.includes(p.id);
                const isFirstCasualty = matchState.firstEliminatedPlayerId === p.id;

                return (
                  <button
                    key={p.id}
                    onClick={() => handleTogglePlayerEliminated('Bravo', p.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between gap-2 active:scale-95 ${
                      isAlive
                        ? 'bg-slate-900/90 border-red-500/40 text-white hover:border-red-400'
                        : 'bg-red-950/40 border-red-500/50 text-red-400 line-through opacity-75'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {isAlive ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Skull className="w-4 h-4 text-red-500 shrink-0 animate-pulse" />
                      )}
                      <span className="font-tactical font-bold text-xs uppercase truncate">
                        "{p.callsign}"
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isFirstCasualty && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold" title="Primeiro eliminado! Bucha de Canhão">
                          🪖 1ª Baixa
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono">
                        {isAlive ? 'ATIVO' : 'FORA'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* LIVE COMBAT EVENT FEED (LOG TÁTICO DO ÁRBITRO) */}
      <div className="bg-[#0b0e14] border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="font-tactical font-bold text-xs uppercase tracking-wider text-slate-300">
              Log de Combate em Tempo Real
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {matchState.events.length} registros
          </span>
        </div>

        <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
          {matchState.events.slice().reverse().map((ev) => (
            <div
              key={ev.id}
              className={`p-1.5 rounded flex items-center gap-2 ${
                ev.type === 'elimination'
                  ? 'bg-red-950/30 text-red-300 border-l-2 border-red-500'
                  : ev.type === 'penalty'
                  ? 'bg-amber-950/30 text-amber-300 border-l-2 border-amber-500'
                  : ev.type === 'start'
                  ? 'bg-emerald-950/30 text-emerald-300 border-l-2 border-emerald-500'
                  : 'bg-slate-900/60 text-slate-300 border-l-2 border-slate-700'
              }`}
            >
              <span className="text-[10px] text-slate-500 font-bold shrink-0">
                [{ev.realTime}]
              </span>
              <span className="truncate">{ev.text}</span>
            </div>
          ))}

          {matchState.events.length === 0 && (
            <p className="text-xs text-slate-600 text-center py-4">
              Nenhum evento registrado ainda. O log registrará baixas, pontos e alertas.
            </p>
          )}
        </div>
      </div>

      {/* FINISH ROUND & AWARD MVP MODAL */}
      {finishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0d121c] border border-orange-500/60 rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-5 py-3.5 text-white flex items-center justify-between">
              <h3 className="font-tactical font-black text-lg uppercase tracking-wider flex items-center gap-2">
                <Award className="w-5 h-5" />
                Relatório de Fim de Missão
              </h3>
              <button
                onClick={() => setFinishModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Placar Final Summary */}
              <div className="flex items-center justify-around bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <div>
                  <span className="text-cyan-400 font-tactical font-bold text-xs uppercase block">
                    Alfa
                  </span>
                  <span className="text-3xl font-code font-black text-white">
                    {matchState.teamAlpha.score}
                  </span>
                </div>
                <div className="text-slate-600 font-bold text-xl">VS</div>
                <div>
                  <span className="text-red-400 font-tactical font-bold text-xs uppercase block">
                    Bravo
                  </span>
                  <span className="text-3xl font-code font-black text-white">
                    {matchState.teamBravo.score}
                  </span>
                </div>
              </div>

              {/* Select Winner */}
              <div>
                <label className="block text-xs font-tactical uppercase tracking-wider text-slate-400 mb-1.5">
                  Esquadrão Vencedor do Round
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'Alfa', label: 'Vitória Alfa', color: 'cyan' },
                    { key: 'Bravo', label: 'Vitória Bravo', color: 'red' },
                    { key: 'Empate', label: 'Empate', color: 'slate' },
                  ].map((w) => (
                    <button
                      type="button"
                      key={w.key}
                      onClick={() => setSelectedWinner(w.key as 'Alfa' | 'Bravo' | 'Empate')}
                      className={`py-2.5 px-2 rounded-lg font-tactical text-xs uppercase font-bold tracking-wider border transition-all ${
                        selectedWinner === w.key
                          ? 'bg-orange-500/20 text-orange-400 border-orange-500 shadow-sm'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Select MVP */}
              <div>
                <label className="block text-xs font-tactical uppercase tracking-wider text-slate-400 mb-1.5">
                  Operador Destaque (MVP da Rodada)
                </label>
                <select
                  value={selectedMvp}
                  onChange={(e) => setSelectedMvp(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500 font-tactical font-bold"
                >
                  <option value="">Selecione o melhor jogador...</option>
                  {[...matchState.teamAlpha.players, ...matchState.teamBravo.players].map((id) => {
                    const p = players.find((pl) => pl.id === id);
                    if (!p) return null;
                    const team = matchState.teamAlpha.players.includes(id) ? 'Alfa' : 'Bravo';
                    return (
                      <option key={id} value={id}>
                        [{team}] "{p.callsign}" ({p.name}) - {p.role}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Automatic Badges Earned Preview */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-tactical uppercase tracking-wider text-slate-400 block">
                  Conquistas Táticas Detectadas:
                </span>
                <div className="space-y-1 text-xs">
                  {matchState.firstEliminatedPlayerId && (
                    <div className="flex items-center gap-2 text-amber-400 font-medium">
                      <span>🪖</span>
                      <span>
                        <strong>Bucha de Canhão:</strong> "{
                          players.find((p) => p.id === matchState.firstEliminatedPlayerId)?.callsign
                        }" levou o primeiro tiro!
                      </span>
                    </div>
                  )}

                  {selectedWinner !== 'Empate' && (
                    <div className="flex items-center gap-2 text-emerald-400 font-medium">
                      <span>🎯</span>
                      <span>
                        <strong>Operador Fantasma:</strong> Operadores sobreviventes da equipe {selectedWinner} recebem insígnia intacta!
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFinishModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-tactical uppercase font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmFinishRound}
                  className="px-5 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-tactical font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-600/30 flex items-center gap-2"
                >
                  <Award className="w-4 h-4" />
                  <span>Gravar Vitória & Conquistas</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
