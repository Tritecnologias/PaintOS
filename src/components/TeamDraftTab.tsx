import React, { useState, useEffect } from 'react';
import { 
  Shuffle, Users, ArrowRightLeft, Star, Crown, 
  Play, RefreshCw, AlertCircle, Shield, Crosshair, 
  Zap, SlidersHorizontal, Check, Award
} from 'lucide-react';
import { Player, PlayerRole } from '../types';
import { tacticalAudio } from '../utils/audio';

interface TeamDraftTabProps {
  players: Player[];
  teamAlphaIds: string[];
  teamBravoIds: string[];
  onUpdateTeams: (alpha: string[], bravo: string[]) => void;
  onDeployToField: (alphaIds: string[], bravoIds: string[]) => void;
}

type DraftMode = 'auto' | 'captains';

export const TeamDraftTab: React.FC<TeamDraftTabProps> = ({
  players,
  teamAlphaIds,
  teamBravoIds,
  onUpdateTeams,
  onDeployToField,
}) => {
  const [draftMode, setDraftMode] = useState<DraftMode>('auto');
  const [isShuffling, setIsShuffling] = useState(false);

  // Captains Draft State
  const [captainAlphaId, setCaptainAlphaId] = useState<string | null>(null);
  const [captainBravoId, setCaptainBravoId] = useState<string | null>(null);
  const [draftPickIndex, setDraftPickIndex] = useState<number>(0);
  const [isDraftActive, setIsDraftActive] = useState<boolean>(false);
  const [availableDraftIds, setAvailableDraftIds] = useState<string[]>([]);

  // Selected player for manual swap
  const [selectedAlphaPlayer, setSelectedAlphaPlayer] = useState<string | null>(null);
  const [selectedBravoPlayer, setSelectedBravoPlayer] = useState<string | null>(null);

  // Filter confirmed players
  const confirmedPlayers = players.filter((p) => p.status === 'confirmed');

  // Initialize or re-balance if empty
  useEffect(() => {
    if (confirmedPlayers.length >= 2 && teamAlphaIds.length === 0 && teamBravoIds.length === 0) {
      handleAutoBalance(false);
    }
  }, [confirmedPlayers.length]);

  /**
   * Automatic Balancing Algorithm:
   * Greedy heuristic partitioning with role preservation to minimize star difference.
   */
  const handleAutoBalance = (playSound: boolean = true) => {
    if (confirmedPlayers.length < 2) return;

    if (playSound) {
      tacticalAudio.playWhistle();
      setIsShuffling(true);
      setTimeout(() => setIsShuffling(false), 500);
    }

    // Sort players descending by skillLevel, then random tie-break for variety
    const pool = [...confirmedPlayers].sort((a, b) => {
      if (b.skillLevel !== a.skillLevel) {
        return b.skillLevel - a.skillLevel;
      }
      return Math.random() - 0.5;
    });

    const alpha: string[] = [];
    const bravo: string[] = [];
    let alphaScore = 0;
    let bravoScore = 0;

    pool.forEach((player) => {
      // Prioritize smaller team size, then smaller score
      if (alpha.length < bravo.length) {
        alpha.push(player.id);
        alphaScore += player.skillLevel;
      } else if (bravo.length < alpha.length) {
        bravo.push(player.id);
        bravoScore += player.skillLevel;
      } else {
        // Equal size, put in the team with fewer stars
        if (alphaScore <= bravoScore) {
          alpha.push(player.id);
          alphaScore += player.skillLevel;
        } else {
          bravo.push(player.id);
          bravoScore += player.skillLevel;
        }
      }
    });

    onUpdateTeams(alpha, bravo);
  };

  /**
   * Captains Draft Setup & Logic (1-2-2-1 Snake Draft)
   */
  const startCaptainsDraft = () => {
    if (confirmedPlayers.length < 4) {
      alert('São necessários pelo menos 4 operadores confirmados para o modo Draft de Capitães.');
      return;
    }
    tacticalAudio.playWhistle();

    // Pick top 2 skilled operators as default captains, or random
    const sorted = [...confirmedPlayers].sort((a, b) => b.skillLevel - a.skillLevel);
    const capA = sorted[0].id;
    const capB = sorted[1].id;

    setCaptainAlphaId(capA);
    setCaptainBravoId(capB);
    setIsDraftActive(true);
    setDraftPickIndex(0);

    const pool = confirmedPlayers
      .map((p) => p.id)
      .filter((id) => id !== capA && id !== capB);
    setAvailableDraftIds(pool);

    onUpdateTeams([capA], [capB]);
  };

  // Turn pattern: 0 -> Bravo, 1 -> Bravo, 2 -> Alfa, 3 -> Alfa (Snake 1-2-2-1)
  const getCurrentPickingTeam = (): 'Alfa' | 'Bravo' => {
    // Round 0: Alfa started with captain, so Bravo picks 1st
    // Classic snake draft order: Bravo, Alfa, Alfa, Bravo, Bravo, Alfa...
    const pattern = ['Bravo', 'Alfa', 'Alfa', 'Bravo'];
    return pattern[draftPickIndex % 4] as 'Alfa' | 'Bravo';
  };

  const handlePickPlayer = (playerId: string) => {
    if (!isDraftActive) return;
    tacticalAudio.playClick();

    const team = getCurrentPickingTeam();
    if (team === 'Alfa') {
      onUpdateTeams([...teamAlphaIds, playerId], teamBravoIds);
    } else {
      onUpdateTeams(teamAlphaIds, [...teamBravoIds, playerId]);
    }

    const remaining = availableDraftIds.filter((id) => id !== playerId);
    setAvailableDraftIds(remaining);
    setDraftPickIndex(draftPickIndex + 1);

    if (remaining.length === 0) {
      setIsDraftActive(false);
      tacticalAudio.playVictory();
    }
  };

  /**
   * Manual swap between teams
   */
  const handleSwap = () => {
    if (!selectedAlphaPlayer || !selectedBravoPlayer) return;
    tacticalAudio.playClick();

    const newAlpha = teamAlphaIds.map((id) =>
      id === selectedAlphaPlayer ? selectedBravoPlayer : id
    );
    const newBravo = teamBravoIds.map((id) =>
      id === selectedBravoPlayer ? selectedAlphaPlayer : id
    );

    onUpdateTeams(newAlpha, newBravo);
    setSelectedAlphaPlayer(null);
    setSelectedBravoPlayer(null);
  };

  // Move single player from Alpha to Bravo
  const movePlayerToBravo = (playerId: string) => {
    tacticalAudio.playClick();
    onUpdateTeams(
      teamAlphaIds.filter((id) => id !== playerId),
      [...teamBravoIds, playerId]
    );
  };

  // Move single player from Bravo to Alpha
  const movePlayerToAlpha = (playerId: string) => {
    tacticalAudio.playClick();
    onUpdateTeams(
      [...teamAlphaIds, playerId],
      teamBravoIds.filter((id) => id !== playerId)
    );
  };

  // Calculations for stats
  const alphaPlayers = players.filter((p) => teamAlphaIds.includes(p.id));
  const bravoPlayers = players.filter((p) => teamBravoIds.includes(p.id));

  const alphaStars = alphaPlayers.reduce((sum, p) => sum + p.skillLevel, 0);
  const bravoStars = bravoPlayers.reduce((sum, p) => sum + p.skillLevel, 0);

  const alphaAvg = alphaPlayers.length ? (alphaStars / alphaPlayers.length).toFixed(1) : '0';
  const bravoAvg = bravoPlayers.length ? (bravoStars / bravoPlayers.length).toFixed(1) : '0';

  const starDifference = Math.abs(alphaStars - bravoStars);

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Draft Mode Selection Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="grid grid-cols-2 sm:flex items-center gap-2">
          <button
            onClick={() => {
              tacticalAudio.playClick();
              setDraftMode('auto');
              setIsDraftActive(false);
            }}
            className={`px-3 sm:px-4 py-2 rounded-lg font-tactical text-[11px] sm:text-xs uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
              draftMode === 'auto'
                ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Shuffle className="w-4 h-4 shrink-0" />
            <span className="truncate">Auto ELO</span>
          </button>

          <button
            onClick={() => {
              tacticalAudio.playClick();
              setDraftMode('captains');
            }}
            className={`px-3 sm:px-4 py-2 rounded-lg font-tactical text-[11px] sm:text-xs uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
              draftMode === 'captains'
                ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Crown className="w-4 h-4 shrink-0" />
            <span className="truncate">Draft Capitães</span>
          </button>
        </div>

        {/* Action button: Auto-Balance or Draft Start */}
        {draftMode === 'auto' ? (
          <button
            onClick={() => handleAutoBalance(true)}
            disabled={confirmedPlayers.length < 2}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-tactical text-xs uppercase font-bold tracking-wider border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-orange-400 ${isShuffling ? 'animate-spin' : ''}`} />
            <span>Reembaralhar Equipes</span>
          </button>
        ) : (
          <button
            onClick={startCaptainsDraft}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-tactical text-xs uppercase font-bold tracking-wider shadow-sm transition-all active:scale-95"
          >
            <Crown className="w-4 h-4" />
            <span>{isDraftActive ? 'Reiniciar Draft' : 'Sortear Capitães & Iniciar'}</span>
          </button>
        )}
      </div>

      {/* Comparison Tactical Metric Bar */}
      <div className="bg-[#0c1017] border border-slate-800 rounded-xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Team Alpha Total */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400"></span>
            <span className="font-tactical font-black text-lg text-cyan-400 uppercase tracking-wide">
              Equipe Alfa
            </span>
          </div>
          <div className="flex items-center gap-3 font-code text-sm">
            <span className="text-slate-300">
              <strong className="text-white text-base">{alphaPlayers.length}</strong> ops
            </span>
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              {alphaStars} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </span>
            <span className="text-xs text-slate-400">({alphaAvg} méd.)</span>
          </div>
        </div>

        {/* Balance Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-tactical uppercase">
          {starDifference === 0 ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Equilíbrio Perfeito (0★ dif.)
            </span>
          ) : starDifference === 1 ? (
            <span className="text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Quase Idêntico (1★ dif.)
            </span>
          ) : (
            <span className="text-amber-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Diferença de {starDifference}★
            </span>
          )}
        </div>

        {/* Team Bravo Total */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-3 font-code text-sm order-2 md:order-1">
            <span className="text-xs text-slate-400">({bravoAvg} méd.)</span>
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              {bravoStars} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </span>
            <span className="text-slate-300">
              <strong className="text-white text-base">{bravoPlayers.length}</strong> ops
            </span>
          </div>
          <div className="flex items-center gap-2 order-1 md:order-2">
            <span className="font-tactical font-black text-lg text-red-400 uppercase tracking-wide">
              Equipe Bravo
            </span>
            <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500"></span>
          </div>
        </div>
      </div>

      {/* Captains Draft Pick Banner (if active) */}
      {draftMode === 'captains' && isDraftActive && (
        <div className="bg-gradient-to-r from-cyan-950/70 via-slate-900 to-red-950/70 border border-amber-500/40 rounded-xl p-4 animate-in fade-in">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400 animate-bounce" />
              <span className="font-tactical font-black text-base uppercase tracking-wider text-white">
                Vez de Escolha:{' '}
                <span
                  className={
                    getCurrentPickingTeam() === 'Alfa'
                      ? 'text-cyan-400 underline'
                      : 'text-red-400 underline'
                  }
                >
                  {getCurrentPickingTeam() === 'Alfa' ? 'Capitão Alfa' : 'Capitão Bravo'}
                </span>
              </span>
            </div>
            <span className="font-code text-xs px-2 py-0.5 rounded bg-slate-950 text-slate-300">
              Disponíveis: {availableDraftIds.length}
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-2">
            Clique em qualquer operador livre abaixo para recrutar para o seu esquadrão:
          </p>

          {/* Available Operators Pool */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {availableDraftIds.map((id) => {
              const p = players.find((pl) => pl.id === id);
              if (!p) return null;
              return (
                <button
                  key={p.id}
                  onClick={() => handlePickPlayer(p.id)}
                  className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700 hover:border-amber-400 hover:bg-slate-800 text-left transition-all active:scale-95 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-tactical font-bold text-sm text-white group-hover:text-amber-400 uppercase">
                      "{p.callsign}"
                    </span>
                    <span className="font-code text-xs text-amber-400 font-bold flex items-center">
                      {p.skillLevel}★
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                    {p.role} • {p.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual Swap Control Bar (if 2 players selected) */}
      {selectedAlphaPlayer && selectedBravoPlayer && (
        <div className="bg-orange-950/80 border border-orange-500 rounded-xl p-3 flex items-center justify-between gap-3 animate-in zoom-in-95">
          <div className="flex items-center gap-2 text-xs font-tactical uppercase">
            <ArrowRightLeft className="w-4 h-4 text-orange-400 animate-spin" />
            <span className="text-white">
              Trocar operador Alfa por Bravo selecionado?
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedAlphaPlayer(null);
                setSelectedBravoPlayer(null);
              }}
              className="px-3 py-1 rounded text-xs text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              onClick={handleSwap}
              className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-tactical font-bold text-xs uppercase"
            >
              Confirmar Troca
            </button>
          </div>
        </div>
      )}

      {/* Two Teams Squad Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* TEAM ALFA (CYAN) */}
        <div className="bg-[#0b1320] border-2 border-cyan-500/40 rounded-xl p-4 shadow-alpha">
          <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center font-tactical font-black text-cyan-400">
                A
              </div>
              <div>
                <h3 className="font-tactical font-black text-base text-cyan-300 uppercase tracking-wider">
                  Equipe Alfa
                </h3>
                <span className="text-[11px] text-cyan-400/80 font-mono">
                  {alphaPlayers.length} Operadores • {alphaStars}★
                </span>
              </div>
            </div>

            {selectedAlphaPlayer && (
              <span className="text-[10px] uppercase font-tactical px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Selecionado p/ Troca
              </span>
            )}
          </div>

          {/* Players in Alpha */}
          <div className="mt-3 space-y-2">
            {alphaPlayers.map((p) => {
              const isSelected = selectedAlphaPlayer === p.id;
              return (
                <div
                  key={p.id}
                  className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-400 shadow-sm'
                      : 'bg-slate-900/80 border-slate-800 hover:border-cyan-500/40'
                  }`}
                >
                  <div
                    onClick={() => {
                      tacticalAudio.playClick();
                      setSelectedAlphaPlayer(isSelected ? null : p.id);
                    }}
                    className="flex-1 cursor-pointer flex items-center gap-2.5"
                  >
                    <span className="font-tactical font-bold text-white text-sm uppercase">
                      "{p.callsign}"
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-medium">
                      {p.role}
                    </span>
                    <span className="text-xs text-amber-400 font-bold ml-auto mr-1 flex items-center">
                      {p.skillLevel}★
                    </span>
                  </div>

                  {/* Transfer to Bravo button */}
                  <button
                    onClick={() => movePlayerToBravo(p.id)}
                    title="Mover para Equipe Bravo"
                    className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    →
                  </button>
                </div>
              );
            })}

            {alphaPlayers.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-6 font-tactical uppercase">
                Nenhum operador alocado em Alfa
              </p>
            )}
          </div>
        </div>

        {/* TEAM BRAVO (RED) */}
        <div className="bg-[#1a1012] border-2 border-red-500/40 rounded-xl p-4 shadow-bravo">
          <div className="flex items-center justify-between pb-3 border-b border-red-500/20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center font-tactical font-black text-red-400">
                B
              </div>
              <div>
                <h3 className="font-tactical font-black text-base text-red-300 uppercase tracking-wider">
                  Equipe Bravo
                </h3>
                <span className="text-[11px] text-red-400/80 font-mono">
                  {bravoPlayers.length} Operadores • {bravoStars}★
                </span>
              </div>
            </div>

            {selectedBravoPlayer && (
              <span className="text-[10px] uppercase font-tactical px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40">
                Selecionado p/ Troca
              </span>
            )}
          </div>

          {/* Players in Bravo */}
          <div className="mt-3 space-y-2">
            {bravoPlayers.map((p) => {
              const isSelected = selectedBravoPlayer === p.id;
              return (
                <div
                  key={p.id}
                  className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-red-950/80 border-red-400 shadow-sm'
                      : 'bg-slate-900/80 border-slate-800 hover:border-red-500/40'
                  }`}
                >
                  {/* Transfer to Alpha button */}
                  <button
                    onClick={() => movePlayerToAlpha(p.id)}
                    title="Mover para Equipe Alfa"
                    className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                  >
                    ←
                  </button>

                  <div
                    onClick={() => {
                      tacticalAudio.playClick();
                      setSelectedBravoPlayer(isSelected ? null : p.id);
                    }}
                    className="flex-1 cursor-pointer flex items-center gap-2.5 justify-end"
                  >
                    <span className="text-xs text-amber-400 font-bold ml-1 mr-auto flex items-center">
                      {p.skillLevel}★
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 font-medium">
                      {p.role}
                    </span>
                    <span className="font-tactical font-bold text-white text-sm uppercase">
                      "{p.callsign}"
                    </span>
                  </div>
                </div>
              );
            })}

            {bravoPlayers.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-6 font-tactical uppercase">
                Nenhum operador alocado em Bravo
              </p>
            )}
          </div>
        </div>
      </div>

      {/* BIG CALL TO ACTION: DEPLOY TO REFEREE TIMER */}
      <div className="pt-2">
        <button
          onClick={() => {
            tacticalAudio.playWhistle();
            onDeployToField(teamAlphaIds, teamBravoIds);
          }}
          disabled={alphaPlayers.length === 0 || bravoPlayers.length === 0}
          className="w-full py-3.5 sm:py-4 px-4 sm:px-6 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 hover:from-orange-500 hover:to-amber-500 text-white font-tactical font-black text-sm sm:text-lg uppercase tracking-wider sm:tracking-widest shadow-xl shadow-orange-600/30 transition-all flex items-center justify-center gap-2 sm:gap-3 active:scale-[0.99] disabled:opacity-40"
        >
          <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white shrink-0" />
          <span className="sm:hidden">Iniciar Missão (Ir p/ Juiz)</span>
          <span className="hidden sm:inline">Iniciar Missão com esta Escalação (Ir p/ Painel do Juiz)</span>
        </button>
      </div>
    </div>
  );
};
