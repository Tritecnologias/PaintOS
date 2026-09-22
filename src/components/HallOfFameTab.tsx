import React, { useState } from 'react';
import { 
  Trophy, Medal, Award, Flame, Star, 
  History, Calendar, Users, Shield, Crosshair,
  FileText, Loader2
} from 'lucide-react';
import { Player, MatchHistoryRecord, FinancialConfig } from '../types';
import { BADGE_DEFINITIONS, INITIAL_FINANCIAL } from '../utils/mockData';
import { tacticalAudio } from '../utils/audio';
import { generatePaintOpsPDFReport } from '../utils/pdfReport';

interface HallOfFameTabProps {
  players: Player[];
  matchHistory: MatchHistoryRecord[];
  config?: FinancialConfig;
}

type SortField = 'winRate' | 'mvps' | 'wins' | 'matches';

export const HallOfFameTab: React.FC<HallOfFameTabProps> = ({
  players,
  matchHistory,
  config = INITIAL_FINANCIAL,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'leaderboard' | 'badges' | 'history'>('leaderboard');
  const [sortField, setSortField] = useState<SortField>('winRate');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleExportPDF = () => {
    tacticalAudio.playVictory();
    setIsGeneratingPDF(true);
    try {
      generatePaintOpsPDFReport({
        players,
        config,
        matchHistory,
      });
    } catch (err) {
      console.error('Falha ao exportar PDF:', err);
    } finally {
      setTimeout(() => setIsGeneratingPDF(false), 1200);
    }
  };

  // Compute player rankings
  const rankedPlayers = [...players].map((p) => {
    const winRate = p.stats.matches > 0 ? (p.stats.wins / p.stats.matches) * 100 : 0;
    return {
      ...p,
      winRate: Math.round(winRate),
    };
  });

  rankedPlayers.sort((a, b) => {
    if (sortField === 'winRate') {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.stats.matches - a.stats.matches;
    }
    if (sortField === 'mvps') {
      if (b.stats.mvps !== a.stats.mvps) return b.stats.mvps - a.stats.mvps;
      return b.winRate - a.winRate;
    }
    if (sortField === 'wins') {
      return b.stats.wins - a.stats.wins;
    }
    return b.stats.matches - a.stats.matches;
  });

  // Top 3 Podium
  const top1 = rankedPlayers[0];
  const top2 = rankedPlayers[1];
  const top3 = rankedPlayers[2];

  return (
    <div className="space-y-4 pb-24 md:pb-8">
      {/* Sub Tabs Navigation & PDF Report Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex-1 flex items-center gap-1 sm:gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => {
              tacticalAudio.playClick();
              setActiveSubTab('leaderboard');
            }}
            className={`flex-1 py-2 px-3 rounded-lg font-tactical text-xs uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'leaderboard'
                ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Ranking Temporada</span>
          </button>

          <button
            onClick={() => {
              tacticalAudio.playClick();
              setActiveSubTab('badges');
            }}
            className={`flex-1 py-2 px-3 rounded-lg font-tactical text-xs uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'badges'
                ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Medal className="w-4 h-4" />
            <span>Medalhas</span>
          </button>

          <button
            onClick={() => {
              tacticalAudio.playClick();
              setActiveSubTab('history');
            }}
            className={`flex-1 py-2 px-3 rounded-lg font-tactical text-xs uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'history'
                ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Histórico ({matchHistory.length})</span>
          </button>
        </div>

        {/* Action Button: Export PDF */}
        <button
          onClick={handleExportPDF}
          disabled={isGeneratingPDF}
          className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:bg-orange-800 text-white font-tactical text-xs uppercase font-bold tracking-wider shadow-sm shadow-orange-600/30 border border-orange-500/40 transition-all flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap"
          title="Exportar Relatório PDF com Gastos da Partida e Pontuação dos Jogadores"
        >
          {isGeneratingPDF ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
          <span>{isGeneratingPDF ? 'Gerando...' : 'Exportar Relatório PDF'}</span>
        </button>
      </div>

      {/* SUBTAB 1: LEADERBOARD */}
      {activeSubTab === 'leaderboard' && (
        <div className="space-y-4">
          {/* Tactical Podium Top 3 */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-4 pb-2">
            {/* Top 2 (Silver) */}
            {top2 && (
              <div className="bg-[#0e1420] border border-slate-700/60 rounded-xl p-3 text-center flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-200 font-tactical font-black text-sm flex items-center justify-center border border-slate-500 mb-2">
                  2
                </div>
                <span className="font-tactical font-bold text-sm text-white uppercase truncate max-w-full">
                  "{top2.callsign}"
                </span>
                <span className="font-code text-xs text-emerald-400 font-bold mt-0.5">
                  {top2.winRate}% Win
                </span>
                <span className="text-[10px] text-amber-400 font-mono mt-0.5">
                  {top2.stats.mvps} MVPs
                </span>
              </div>
            )}

            {/* Top 1 (Gold) */}
            {top1 && (
              <div className="bg-[#19150d] border-2 border-amber-500/60 rounded-xl p-4 text-center flex flex-col items-center shadow-lg shadow-amber-500/10 -mt-2">
                <div className="relative mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white font-tactical font-black text-base flex items-center justify-center shadow-md">
                    1
                  </div>
                  <Trophy className="w-4 h-4 text-amber-300 absolute -top-2 -right-1 animate-bounce" />
                </div>
                <span className="font-tactical font-black text-base text-white uppercase truncate max-w-full">
                  "{top1.callsign}"
                </span>
                <span className="font-code text-sm text-emerald-400 font-black mt-0.5">
                  {top1.winRate}% Win
                </span>
                <span className="text-xs text-amber-400 font-mono font-bold mt-0.5">
                  🏆 {top1.stats.mvps} MVPs • {top1.stats.wins}V
                </span>
              </div>
            )}

            {/* Top 3 (Bronze) */}
            {top3 && (
              <div className="bg-[#17120e] border border-orange-800/60 rounded-xl p-3 text-center flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-orange-900 text-orange-200 font-tactical font-black text-sm flex items-center justify-center border border-orange-700 mb-2">
                  3
                </div>
                <span className="font-tactical font-bold text-sm text-white uppercase truncate max-w-full">
                  "{top3.callsign}"
                </span>
                <span className="font-code text-xs text-emerald-400 font-bold mt-0.5">
                  {top3.winRate}% Win
                </span>
                <span className="text-[10px] text-amber-400 font-mono mt-0.5">
                  {top3.stats.mvps} MVPs
                </span>
              </div>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-xs font-tactical uppercase tracking-wider text-slate-400">
              Ordenar Tabela Por:
            </span>
            <div className="flex items-center gap-1">
              {[
                { key: 'winRate', label: '% Vitórias' },
                { key: 'mvps', label: 'MVPs' },
                { key: 'wins', label: 'Vitórias' },
                { key: 'matches', label: 'Partidas' },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => {
                    tacticalAudio.playClick();
                    setSortField(s.key as SortField);
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-tactical font-bold uppercase transition-colors ${
                    sortField === s.key
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Full Table */}
          <div className="bg-[#0b0f17] border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 font-tactical uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">Pos</th>
                    <th className="py-3 px-3">Operador</th>
                    <th className="py-3 px-3">Função</th>
                    <th className="py-3 px-3 text-center">Jogos</th>
                    <th className="py-3 px-3 text-center">Vitórias</th>
                    <th className="py-3 px-3 text-center">Taxa Win</th>
                    <th className="py-3 px-3 text-center">MVPs</th>
                    <th className="py-3 px-3 text-right">Insígnias</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {rankedPlayers.map((player, idx) => {
                    const isPodium = idx < 3;
                    return (
                      <tr
                        key={player.id}
                        className={`hover:bg-slate-900/40 transition-colors ${
                          idx === 0
                            ? 'bg-amber-500/5'
                            : idx === 1
                            ? 'bg-slate-500/5'
                            : idx === 2
                            ? 'bg-orange-500/5'
                            : ''
                        }`}
                      >
                        {/* Position */}
                        <td className="py-3 px-3 text-center font-tactical font-black text-sm">
                          {idx === 0 ? (
                            <span className="text-amber-400">1º</span>
                          ) : idx === 1 ? (
                            <span className="text-slate-300">2º</span>
                          ) : idx === 2 ? (
                            <span className="text-orange-400">3º</span>
                          ) : (
                            <span className="text-slate-500">{idx + 1}º</span>
                          )}
                        </td>

                        {/* Player Callsign & Name */}
                        <td className="py-3 px-3 font-sans">
                          <span className="font-tactical font-bold text-sm text-white uppercase block">
                            "{player.callsign}"
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {player.name}
                          </span>
                        </td>

                        {/* Role */}
                        <td className="py-3 px-3 font-tactical uppercase text-slate-400 text-[11px]">
                          {player.role}
                        </td>

                        {/* Matches */}
                        <td className="py-3 px-3 text-center font-bold text-slate-200">
                          {player.stats.matches}
                        </td>

                        {/* Wins */}
                        <td className="py-3 px-3 text-center font-bold text-emerald-400">
                          {player.stats.wins}
                        </td>

                        {/* Win Rate */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                              player.winRate >= 70
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : player.winRate >= 50
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {player.winRate}%
                          </span>
                        </td>

                        {/* MVPs */}
                        <td className="py-3 px-3 text-center font-bold text-amber-400">
                          {player.stats.mvps > 0 ? `⭐ ${player.stats.mvps}` : '-'}
                        </td>

                        {/* Badges preview */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {player.badges?.slice(0, 3).map((badgeKey) => {
                              const b = BADGE_DEFINITIONS[badgeKey];
                              return (
                                <span
                                  key={badgeKey}
                                  title={b ? `${b.name}: ${b.description}` : badgeKey}
                                  className="text-base cursor-help"
                                >
                                  {b ? b.icon : '🎖️'}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: BADGES & ACHIEVEMENTS */}
      {activeSubTab === 'badges' && (
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <h3 className="font-tactical font-black text-sm uppercase tracking-wider text-orange-400 mb-1">
              Quadro de Insígnias e Conquistas de Combate
            </h3>
            <p className="text-xs text-slate-400">
              Conquistas táticas e divertidas concedidas pelo sistema durante as rodadas e ao final de cada missão.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.values(BADGE_DEFINITIONS).map((badge) => {
              // Find all players holding this badge
              const holders = players.filter((p) => p.badges?.includes(badge.id));

              return (
                <div
                  key={badge.id}
                  className={`bg-[#0d121c] border rounded-xl p-4 space-y-2.5 ${badge.colorClass}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl p-2 rounded-lg bg-black/40 border border-white/10 shrink-0">
                      {badge.icon}
                    </span>
                    <div>
                      <h4 className="font-tactical font-black text-base uppercase text-white tracking-wide">
                        {badge.name}
                      </h4>
                      <p className="text-xs text-slate-300 font-medium">
                        {badge.description}
                      </p>
                      <p className="text-[11px] text-slate-400 italic mt-0.5">
                        "{badge.humorTip}"
                      </p>
                    </div>
                  </div>

                  {/* Holders list */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-tactical uppercase tracking-wider text-slate-400">
                      Detentores ({holders.length}):
                    </span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {holders.map((h) => (
                        <span
                          key={h.id}
                          className="px-2 py-0.5 rounded bg-black/50 border border-white/20 font-tactical font-bold text-[10px] text-white uppercase"
                        >
                          "{h.callsign}"
                        </span>
                      ))}
                      {holders.length === 0 && (
                        <span className="text-[10px] text-slate-500 italic">
                          Ninguém conquistou ainda
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 3: MATCH HISTORY */}
      {activeSubTab === 'history' && (
        <div className="space-y-3">
          {matchHistory.map((item) => {
            const mvpPlayer = players.find((p) => p.id === item.mvpPlayerId);
            const firstCasualty = players.find((p) => p.id === item.firstEliminatedPlayerId);

            return (
              <div
                key={item.id}
                className="bg-[#0b0f17] border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-400" />
                    <span className="font-tactical font-bold text-xs uppercase text-white tracking-wider">
                      {item.scenarioName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      • {new Date(item.date).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded text-[11px] font-tactical font-bold uppercase tracking-wider ${
                      item.winner === 'Alfa'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : item.winner === 'Bravo'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Vitória: {item.winner}
                  </span>
                </div>

                {/* Match Score Display */}
                <div className="grid grid-cols-3 gap-2 my-3 items-center text-center">
                  <div className="bg-cyan-950/20 border border-cyan-500/30 p-2 rounded-lg">
                    <span className="font-tactical font-bold text-xs text-cyan-400 block uppercase">
                      Alfa
                    </span>
                    <span className="font-code font-black text-2xl text-white">
                      {item.teamAlpha.score}
                    </span>
                  </div>

                  <div className="font-tactical font-bold text-xs text-slate-500 uppercase">
                    {item.durationMinutes} min de combate
                  </div>

                  <div className="bg-red-950/20 border border-red-500/30 p-2 rounded-lg">
                    <span className="font-tactical font-bold text-xs text-red-400 block uppercase">
                      Bravo
                    </span>
                    <span className="font-code font-black text-2xl text-white">
                      {item.teamBravo.score}
                    </span>
                  </div>
                </div>

                {/* Footer Awards */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  {mvpPlayer && (
                    <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>
                        MVP:{' '}
                        <strong className="text-white font-tactical uppercase">
                          "{mvpPlayer.callsign}"
                        </strong>
                      </span>
                    </div>
                  )}

                  {firstCasualty && (
                    <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                      <span>🪖 1ª Baixa: "{firstCasualty.callsign}"</span>
                    </div>
                  )}

                  {item.notes && (
                    <p className="text-[11px] text-slate-500 italic w-full">
                      "{item.notes}"
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {matchHistory.length === 0 && (
            <div className="bg-slate-900/40 border border-slate-800 border-dashed rounded-xl p-8 text-center text-slate-500 font-tactical uppercase">
              Nenhuma partida salva no histórico ainda. Finalize um combate no Painel do Juiz para registrar.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
