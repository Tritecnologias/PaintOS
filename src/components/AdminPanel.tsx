import React, { useState } from 'react';
import { 
  Users, DollarSign, History, Flag, Database, 
  Plus, Edit2, Trash2, Save, X, Search, Check, 
  RotateCcw, Download, Upload, AlertCircle, 
  Star, Shield, Crosshair, ArrowLeft, Eye, Sparkles,
  CheckCircle2, Clock, UserX, Package
} from 'lucide-react';
import { 
  Player, FinancialConfig, MatchHistoryRecord, 
  ScenarioPreset, PlayerRole, PlayerPresence 
} from '../types';
import { tacticalAudio } from '../utils/audio';

interface AdminPanelProps {
  players: Player[];
  config: FinancialConfig;
  matchHistory: MatchHistoryRecord[];
  scenarios: ScenarioPreset[];
  onUpdatePlayers: (players: Player[]) => void;
  onUpdateConfig: (config: FinancialConfig) => void;
  onUpdateMatchHistory: (history: MatchHistoryRecord[]) => void;
  onUpdateScenarios: (scenarios: ScenarioPreset[]) => void;
  onResetFactoryData: () => void;
  onBackToApp: () => void;
  onGoToLanding: () => void;
}

type AdminTab = 'players' | 'finance' | 'matches' | 'scenarios' | 'backup';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  players,
  config,
  matchHistory,
  scenarios,
  onUpdatePlayers,
  onUpdateConfig,
  onUpdateMatchHistory,
  onUpdateScenarios,
  onResetFactoryData,
  onBackToApp,
  onGoToLanding,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('players');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filters for Players
  const [playerSearch, setPlayerSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Player CRUD state
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [playerFormData, setPlayerFormData] = useState<Partial<Player>>({
    callsign: '',
    name: '',
    role: 'Assault',
    skillLevel: 3,
    status: 'confirmed',
    hasOwnGear: true,
    extraAmmoPacks: 0,
    stats: { matches: 0, wins: 0, mvps: 0, eliminations: 0, deaths: 0 },
    badges: [],
  });

  // Financial Config CRUD state
  const [financeFormData, setFinanceFormData] = useState<FinancialConfig>({ ...config });

  // Match History CRUD state
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [matchFormData, setMatchFormData] = useState<Partial<MatchHistoryRecord>>({
    date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    scenario: 'deathmatch',
    scenarioName: 'Team Deathmatch / Mata-Mata',
    durationMinutes: 8,
    teamAlpha: { name: 'Alfa', score: 0, playerIds: [] },
    teamBravo: { name: 'Bravo', score: 0, playerIds: [] },
    winner: 'Alfa',
    mvpPlayerId: '',
    notes: '',
  });

  // Scenario CRUD state
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const [scenarioFormData, setScenarioFormData] = useState<Partial<ScenarioPreset>>({
    id: '',
    name: '',
    shortName: '',
    tagline: '',
    description: '',
    objective: '',
    defaultDurationMinutes: 8,
    iconName: 'Crosshair',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    tacticalAudio.playBeep();
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ----------------------------------------------------
  // 1. PLAYER CRUD OPERATIONS
  // ----------------------------------------------------
  const handleOpenNewPlayerModal = () => {
    setEditingPlayerId(null);
    setPlayerFormData({
      callsign: '',
      name: '',
      role: 'Assault',
      skillLevel: 3,
      status: 'confirmed',
      hasOwnGear: true,
      extraAmmoPacks: 0,
      stats: { matches: 0, wins: 0, mvps: 0, eliminations: 0, deaths: 0 },
      badges: [],
    });
    setIsPlayerModalOpen(true);
  };

  const handleOpenEditPlayerModal = (p: Player) => {
    setEditingPlayerId(p.id);
    setPlayerFormData({ ...p });
    setIsPlayerModalOpen(true);
  };

  const handleSavePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerFormData.callsign?.trim() || !playerFormData.name?.trim()) {
      showToast('⚠️ Preencha o codinome e o nome completo do operador!');
      return;
    }

    if (editingPlayerId) {
      // Update
      const updated = players.map((p) => {
        if (p.id === editingPlayerId) {
          return {
            ...p,
            ...playerFormData,
          } as Player;
        }
        return p;
      });
      onUpdatePlayers(updated);
      showToast(`✅ Operador "${playerFormData.callsign}" atualizado com sucesso!`);
    } else {
      // Create
      const newPlayer: Player = {
        id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        callsign: playerFormData.callsign.trim().toUpperCase(),
        name: playerFormData.name.trim(),
        role: playerFormData.role as PlayerRole,
        skillLevel: Number(playerFormData.skillLevel) || 3,
        status: playerFormData.status as PlayerPresence,
        hasOwnGear: Boolean(playerFormData.hasOwnGear),
        extraAmmoPacks: Number(playerFormData.extraAmmoPacks) || 0,
        stats: {
          matches: Number(playerFormData.stats?.matches) || 0,
          wins: Number(playerFormData.stats?.wins) || 0,
          mvps: Number(playerFormData.stats?.mvps) || 0,
          eliminations: Number(playerFormData.stats?.eliminations) || 0,
          deaths: Number(playerFormData.stats?.deaths) || 0,
        },
        badges: playerFormData.badges || [],
      };
      onUpdatePlayers([...players, newPlayer]);
      showToast(`🎯 Novo operador "${newPlayer.callsign}" registrado no pelotão!`);
    }

    setIsPlayerModalOpen(false);
  };

  const handleDeletePlayer = (id: string, callsign: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o operador "${callsign}"?`)) {
      const filtered = players.filter((p) => p.id !== id);
      onUpdatePlayers(filtered);
      showToast(`🗑️ Operador "${callsign}" removido.`);
    }
  };

  // ----------------------------------------------------
  // 2. FINANCIAL CONFIG CRUD OPERATIONS
  // ----------------------------------------------------
  const handleSaveFinance = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(financeFormData);
    showToast('💰 Configurações financeiras e chave PIX salvas com sucesso!');
  };

  // ----------------------------------------------------
  // 3. MATCH HISTORY CRUD OPERATIONS
  // ----------------------------------------------------
  const handleOpenNewMatchModal = () => {
    setEditingMatchId(null);
    setMatchFormData({
      date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      scenario: 'deathmatch',
      scenarioName: 'Team Deathmatch / Mata-Mata',
      durationMinutes: 8,
      teamAlpha: { name: 'Alfa', score: 0, playerIds: [] },
      teamBravo: { name: 'Bravo', score: 0, playerIds: [] },
      winner: 'Alfa',
      mvpPlayerId: players[0]?.id || '',
      notes: '',
    });
    setIsMatchModalOpen(true);
  };

  const handleOpenEditMatchModal = (m: MatchHistoryRecord) => {
    setEditingMatchId(m.id);
    setMatchFormData({ ...m });
    setIsMatchModalOpen(true);
  };

  const handleSaveMatch = (e: React.FormEvent) => {
    e.preventDefault();
    const scenarioName = scenarios.find((s) => s.id === matchFormData.scenario)?.name || 'Cenário Tático';

    if (editingMatchId) {
      const updated = matchHistory.map((m) => {
        if (m.id === editingMatchId) {
          return {
            ...m,
            ...matchFormData,
            scenarioName,
          } as MatchHistoryRecord;
        }
        return m;
      });
      onUpdateMatchHistory(updated);
      showToast('✅ Registro da partida atualizado!');
    } else {
      const newMatch: MatchHistoryRecord = {
        id: `match-${Date.now()}`,
        date: matchFormData.date || new Date().toLocaleDateString('pt-BR'),
        scenario: matchFormData.scenario || 'deathmatch',
        scenarioName,
        durationMinutes: Number(matchFormData.durationMinutes) || 8,
        teamAlpha: {
          name: 'Alfa',
          score: Number(matchFormData.teamAlpha?.score) || 0,
          playerIds: matchFormData.teamAlpha?.playerIds || [],
        },
        teamBravo: {
          name: 'Bravo',
          score: Number(matchFormData.teamBravo?.score) || 0,
          playerIds: matchFormData.teamBravo?.playerIds || [],
        },
        winner: matchFormData.winner || 'Alfa',
        mvpPlayerId: matchFormData.mvpPlayerId || undefined,
        notes: matchFormData.notes || '',
      };
      onUpdateMatchHistory([newMatch, ...matchHistory]);
      showToast('🏆 Nova partida registrada com sucesso no histórico!');
    }

    setIsMatchModalOpen(false);
  };

  const handleDeleteMatch = (id: string) => {
    if (window.confirm('Deseja excluir este registro de partida do histórico?')) {
      onUpdateMatchHistory(matchHistory.filter((m) => m.id !== id));
      showToast('🗑️ Partida excluída do histórico.');
    }
  };

  // ----------------------------------------------------
  // 4. SCENARIO CRUD OPERATIONS
  // ----------------------------------------------------
  const handleOpenNewScenarioModal = () => {
    setEditingScenarioId(null);
    setScenarioFormData({
      id: `sc-${Date.now().toString(36)}`,
      name: '',
      shortName: '',
      tagline: '',
      description: '',
      objective: '',
      defaultDurationMinutes: 10,
      iconName: 'Crosshair',
    });
    setIsScenarioModalOpen(true);
  };

  const handleOpenEditScenarioModal = (s: ScenarioPreset) => {
    setEditingScenarioId(s.id);
    setScenarioFormData({ ...s });
    setIsScenarioModalOpen(true);
  };

  const handleSaveScenario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenarioFormData.name?.trim() || !scenarioFormData.id?.trim()) {
      showToast('⚠️ Preencha o identificador e o nome do cenário!');
      return;
    }

    if (editingScenarioId) {
      const updated = scenarios.map((s) => {
        if (s.id === editingScenarioId) {
          return { ...s, ...scenarioFormData } as ScenarioPreset;
        }
        return s;
      });
      onUpdateScenarios(updated);
      showToast(`✅ Cenário "${scenarioFormData.name}" atualizado!`);
    } else {
      const newSc: ScenarioPreset = {
        id: scenarioFormData.id.trim().toLowerCase(),
        name: scenarioFormData.name.trim(),
        shortName: scenarioFormData.shortName?.trim() || scenarioFormData.name.trim(),
        tagline: scenarioFormData.tagline?.trim() || '',
        description: scenarioFormData.description?.trim() || '',
        objective: scenarioFormData.objective?.trim() || '',
        defaultDurationMinutes: Number(scenarioFormData.defaultDurationMinutes) || 8,
        iconName: scenarioFormData.iconName || 'Crosshair',
      };
      onUpdateScenarios([...scenarios, newSc]);
      showToast(`🎯 Novo modo de jogo "${newSc.name}" cadastrado!`);
    }

    setIsScenarioModalOpen(false);
  };

  const handleDeleteScenario = (id: string, name: string) => {
    if (scenarios.length <= 1) {
      showToast('⚠️ É necessário manter ao menos 1 cenário cadastrado!');
      return;
    }
    if (window.confirm(`Deseja excluir o cenário "${name}"?`)) {
      onUpdateScenarios(scenarios.filter((s) => s.id !== id));
      showToast(`🗑️ Cenário "${name}" excluído.`);
    }
  };

  // ----------------------------------------------------
  // 5. BACKUP & RESTORE JSON
  // ----------------------------------------------------
  const handleExportJSON = () => {
    const backupData = {
      version: '2.6',
      exportedAt: new Date().toISOString(),
      players,
      financialConfig: config,
      matchHistory,
      scenarios,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `paintops_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('💾 Backup completo do PaintOps baixado com sucesso!');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.players && Array.isArray(parsed.players)) {
            onUpdatePlayers(parsed.players);
          }
          if (parsed.financialConfig) {
            onUpdateConfig(parsed.financialConfig);
            setFinanceFormData(parsed.financialConfig);
          }
          if (parsed.matchHistory && Array.isArray(parsed.matchHistory)) {
            onUpdateMatchHistory(parsed.matchHistory);
          }
          if (parsed.scenarios && Array.isArray(parsed.scenarios)) {
            onUpdateScenarios(parsed.scenarios);
          }
          showToast('🎉 Backup restaurado com sucesso no sistema!');
        } catch (err) {
          alert('Erro ao processar arquivo JSON. Verifique o formato do arquivo.');
        }
      };
    }
  };

  // Filtered players list
  const filteredPlayers = players.filter((p) => {
    const matchesSearch = 
      p.callsign.toLowerCase().includes(playerSearch.toLowerCase()) ||
      p.name.toLowerCase().includes(playerSearch.toLowerCase());
    const matchesRole = roleFilter === 'all' || p.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Player statistics & metrics for counters
  const totalRegistered = players.length;
  const totalConfirmed = players.filter((p) => p.status === 'confirmed').length;
  const totalBench = players.filter((p) => p.status === 'bench').length;
  const totalAbsent = players.filter((p) => p.status === 'absent').length;
  const totalOwnGear = players.filter((p) => p.hasOwnGear).length;
  const totalRentalGear = players.filter((p) => !p.hasOwnGear).length;

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 font-sans pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl bg-orange-600 text-white font-tactical text-xs font-bold uppercase tracking-wider shadow-2xl shadow-orange-600/40 border border-orange-500 flex items-center gap-2 animate-in slide-in-from-top">
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Top Header */}
      <header className="sticky top-0 z-40 bg-[#0A0D14]/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToApp}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
              title="Voltar ao Centro de Operações"
            >
              <ArrowLeft className="w-5 h-5 text-orange-400" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-tactical font-black text-lg text-white uppercase tracking-wider">
                  PAINEL ADMINISTRATIVO
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  CRUD MASTER
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-code">
                CADASTRO, EDIÇÃO E EXCLUSÃO DE DADOS DO SISTEMA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onGoToLanding}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-tactical text-xs uppercase font-bold tracking-wider border border-slate-700 transition-colors hidden sm:block"
            >
              🌟 Ver Landing Page
            </button>
            <button
              onClick={onBackToApp}
              className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-tactical text-xs uppercase font-bold tracking-wider shadow-sm transition-all"
            >
              Voltar ao App
            </button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto gap-2 py-2 border-t border-slate-800/80">
          {[
            { id: 'players', label: 'Operadores & Pelotão', icon: Users, count: players.length },
            { id: 'finance', label: 'Parâmetros Financeiros', icon: DollarSign },
            { id: 'matches', label: 'Histórico de Partidas', icon: History, count: matchHistory.length },
            { id: 'scenarios', label: 'Cenários de Combate', icon: Flag, count: scenarios.length },
            { id: 'backup', label: 'Backup & Dados JSON', icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as AdminTab);
                  tacticalAudio.playClick();
                }}
                className={`px-3.5 py-2 rounded-lg font-tactical text-xs uppercase font-bold tracking-wider flex items-center gap-2 shrink-0 transition-all ${
                  isCurrent
                    ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-code ${isCurrent ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        
        {/* ==================================================== */}
        {/* TAB 1: OPERADORES & PELOTÃO (CRUD)                   */}
        {/* ==================================================== */}
        {activeTab === 'players' && (
          <div className="space-y-4">
            {/* TACTICAL METRICS: QUANTIDADE DE PESSOAS CADASTRADAS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {/* 1. TOTAL CADASTRADOS (DESTAQUE PRINCIPAL) */}
              <div className="bg-[#0D1117] border border-orange-500/50 rounded-xl p-3.5 relative overflow-hidden shadow-lg shadow-orange-950/20 group hover:border-orange-500 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-tactical uppercase tracking-wider text-orange-400 font-bold flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Total Cadastrados
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-code bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    BANCO GERAL
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black font-code text-white tracking-tight">
                    {totalRegistered}
                  </span>
                  <span className="text-xs text-slate-400 font-tactical">
                    operadores
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <span>Pessoas cadastradas no sistema</span>
                </p>
              </div>

              {/* 2. CONFIRMADOS */}
              <div className="bg-[#0D1117] border border-emerald-500/30 rounded-xl p-3.5 relative overflow-hidden hover:border-emerald-500 transition-all">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-tactical uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirmados
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-code bg-emerald-500/20 text-emerald-400">
                    {totalRegistered > 0 ? `${Math.round((totalConfirmed / totalRegistered) * 100)}%` : '0%'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black font-code text-emerald-400 tracking-tight">
                    {totalConfirmed}
                  </span>
                  <span className="text-xs text-slate-400 font-tactical">
                    prontos p/ campo
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {Math.floor(totalConfirmed / 2)} vs {Math.ceil(totalConfirmed / 2)} (Alfa vs Bravo)
                </p>
              </div>

              {/* 3. ESPERA / BANCO */}
              <div className="bg-[#0D1117] border border-amber-500/30 rounded-xl p-3.5 relative overflow-hidden hover:border-amber-500 transition-all">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-tactical uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Espera / Banco
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-code bg-amber-500/20 text-amber-400">
                    RESERVA
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black font-code text-amber-400 tracking-tight">
                    {totalBench}
                  </span>
                  <span className="text-xs text-slate-400 font-tactical">
                    em espera
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Substitutos automáticos
                </p>
              </div>

              {/* 4. AUSENTES */}
              <div className="bg-[#0D1117] border border-slate-800 rounded-xl p-3.5 relative overflow-hidden hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-tactical uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                    <UserX className="w-3.5 h-3.5" />
                    Ausentes
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-code bg-slate-800 text-slate-400">
                    BAIXAS
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black font-code text-slate-400 tracking-tight">
                    {totalAbsent}
                  </span>
                  <span className="text-xs text-slate-400 font-tactical">
                    desfalques
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Sem vaga nesta data
                </p>
              </div>

              {/* 5. EQUIPAMENTO */}
              <div className="col-span-2 sm:col-span-4 lg:col-span-1 bg-[#0D1117] border border-cyan-500/30 rounded-xl p-3.5 relative overflow-hidden hover:border-cyan-500 transition-all">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-tactical uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    Equipamentos
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-code bg-cyan-500/20 text-cyan-400">
                    LOGÍSTICA
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black font-code text-white tracking-tight">
                    {totalOwnGear} <span className="text-xs font-normal text-slate-400">próprios</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  <strong className="text-cyan-400 font-code">{totalRentalGear}</strong> alugados do campo
                </p>
              </div>
            </div>

            {/* Top Bar: Search, Filters, Live Counter & Add Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0D1117] p-4 rounded-xl border border-slate-800">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por codinome ou nome..."
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 font-tactical focus:outline-none focus:border-orange-500"
                >
                  <option value="all">Todas as Funções</option>
                  <option value="Assault">Assalto</option>
                  <option value="Sniper">Sniper</option>
                  <option value="Tank">Tanque</option>
                  <option value="Flanker">Flanqueador</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 font-tactical focus:outline-none focus:border-orange-500"
                >
                  <option value="all">Todos os Status</option>
                  <option value="confirmed">Confirmados</option>
                  <option value="bench">Espera / Reserva</option>
                  <option value="absent">Ausentes</option>
                </select>

                {/* Filter / Result Counter Tag */}
                <div className="px-2.5 py-1.5 bg-slate-950/80 rounded-lg border border-slate-800 text-[11px] font-tactical text-slate-400 flex items-center gap-1.5 shrink-0">
                  <span>Exibindo:</span>
                  <strong className="text-white font-code">{filteredPlayers.length}</strong>
                  <span>de</span>
                  <strong className="text-orange-400 font-code">{totalRegistered}</strong>
                  <span>cadastrados</span>
                  {(playerSearch || roleFilter !== 'all' || statusFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setPlayerSearch('');
                        setRoleFilter('all');
                        setStatusFilter('all');
                      }}
                      className="ml-1 text-[10px] text-orange-400 hover:text-orange-300 underline font-code"
                      title="Limpar todos os filtros"
                    >
                      (limpar)
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={handleOpenNewPlayerModal}
                className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-tactical text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shrink-0 transition-all shadow-md shadow-orange-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>+ Novo Operador</span>
              </button>
            </div>

            {/* Players Table / Grid */}
            <div className="bg-[#0D1117] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-tactical uppercase text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Codinome / Nome</th>
                      <th className="py-3 px-4">Função</th>
                      <th className="py-3 px-4">Mira (1-5)</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Equipamento</th>
                      <th className="py-3 px-4 text-center">Jogos / Vitórias / MVPs</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredPlayers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-500 font-tactical uppercase">
                          Nenhum operador encontrado com os filtros atuais.
                        </td>
                      </tr>
                    ) : (
                      filteredPlayers.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-tactical font-black text-sm text-white uppercase block">
                              "{p.callsign}"
                            </span>
                            <span className="text-[11px] text-slate-400">{p.name}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-tactical font-bold uppercase border bg-slate-900 border-slate-700 text-slate-300">
                              {p.role}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center text-amber-400">
                              {Array.from({ length: p.skillLevel }).map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-tactical font-bold uppercase ${
                                p.status === 'confirmed'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : p.status === 'bench'
                                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                  : 'bg-slate-900 text-slate-500 border border-slate-800'
                              }`}
                            >
                              {p.status === 'confirmed' ? 'Confirmado' : p.status === 'bench' ? 'Espera' : 'Ausente'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            {p.hasOwnGear ? 'Equip. Próprio' : 'Alugado do Campo'}
                          </td>
                          <td className="py-3 px-4 text-center font-code">
                            <span className="text-slate-300">{p.stats.matches}j</span> •{' '}
                            <span className="text-emerald-400">{p.stats.wins}v</span> •{' '}
                            <span className="text-amber-400">{p.stats.mvps}★</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditPlayerModal(p)}
                                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                title="Editar Operador"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeletePlayer(p.id, p.callsign)}
                                className="p-1.5 rounded bg-red-950/60 hover:bg-red-900 text-red-400 transition-colors"
                                title="Excluir Operador"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Summary Table Footer: Total Registered Counter */}
              <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-tactical">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-400" />
                  <span>
                    Contador do Pelotão: <strong className="text-white font-code">{totalRegistered} pessoas cadastradas</strong>
                  </span>
                  <span className="text-slate-600">|</span>
                  <span>
                    Listados agora: <strong className="text-orange-400 font-code">{filteredPlayers.length}</strong>
                  </span>
                </div>
                <div className="flex items-center flex-wrap gap-3 text-[11px] font-code">
                  <span className="text-emerald-400">● {totalConfirmed} confirmados</span>
                  <span className="text-amber-400">● {totalBench} espera</span>
                  <span className="text-slate-400">● {totalAbsent} ausentes</span>
                  <span className="text-cyan-400">● {totalOwnGear} equip. próprio</span>
                  <span className="text-slate-300">● {totalRentalGear} alugados</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: PARÂMETROS FINANCEIROS (CRUD)                 */}
        {/* ==================================================== */}
        {activeTab === 'finance' && (
          <div className="max-w-3xl bg-[#0D1117] border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-tactical font-black uppercase text-white">
                CONFIGURAÇÃO GERAL DE TARIFAS & CHAVE PIX
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Defina os valores padrão que serão utilizados no cálculo automático do rateio financeiro e na exportação do relatório PDF.
              </p>
            </div>

            <form onSubmit={handleSaveFinance} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-tactical uppercase text-slate-300 mb-1">
                    Locação do Campo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={financeFormData.venueCost}
                    onChange={(e) => setFinanceFormData({ ...financeFormData, venueCost: Number(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white font-code focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-tactical uppercase text-slate-300 mb-1">
                    Preço da Caixa de Bolinhas (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={financeFormData.boxPrice}
                    onChange={(e) => setFinanceFormData({ ...financeFormData, boxPrice: Number(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white font-code focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-tactical uppercase text-slate-300 mb-1">
                    Quantidade de Caixas Coletivas
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={financeFormData.communityBoxesCount}
                    onChange={(e) => setFinanceFormData({ ...financeFormData, communityBoxesCount: Number(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white font-code focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-tactical uppercase text-slate-300 mb-1">
                    Taxa Aluguel de Marcador/Equip. (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={financeFormData.gearRentalPrice}
                    onChange={(e) => setFinanceFormData({ ...financeFormData, gearRentalPrice: Number(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white font-code focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-tactical uppercase text-slate-300 mb-1">
                    Preço do Pacote Extra de Bolinhas (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={financeFormData.extraPackPrice}
                    onChange={(e) => setFinanceFormData({ ...financeFormData, extraPackPrice: Number(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white font-code focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-tactical uppercase text-slate-300 mb-1">
                    Nome do Organizador / Responsável
                  </label>
                  <input
                    type="text"
                    value={financeFormData.organizerName}
                    onChange={(e) => setFinanceFormData({ ...financeFormData, organizerName: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* PIX Keys */}
              <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-tactical uppercase text-slate-300 mb-1">
                    Chave PIX
                  </label>
                  <input
                    type="text"
                    value={financeFormData.pixKey}
                    onChange={(e) => setFinanceFormData({ ...financeFormData, pixKey: e.target.value })}
                    placeholder="Ex: seuemail@dominio.com ou CPF"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white font-code focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-tactical uppercase text-slate-300 mb-1">
                    Tipo de Chave PIX
                  </label>
                  <select
                    value={financeFormData.pixKeyType}
                    onChange={(e) => setFinanceFormData({ ...financeFormData, pixKeyType: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="CPF">CPF</option>
                    <option value="CNPJ">CNPJ</option>
                    <option value="E-mail">E-mail</option>
                    <option value="Telefone">Telefone</option>
                    <option value="Chave Aleatória">Chave Aleatória</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-tactical text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-orange-600/30 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Parâmetros Financeiros</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: HISTÓRICO DE PARTIDAS (CRUD)                  */}
        {/* ==================================================== */}
        {activeTab === 'matches' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-[#0D1117] p-4 rounded-xl border border-slate-800">
              <div>
                <h3 className="font-tactical font-black text-sm uppercase text-white">
                  HISTÓRICO DE PARTIDAS REGISTRADAS
                </h3>
                <p className="text-xs text-slate-400">
                  Cadastre novos combates manualmente ou gerencie as rodadas já finalizadas pelo cronômetro.
                </p>
              </div>

              <button
                onClick={handleOpenNewMatchModal}
                className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-tactical text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>+ Registrar Partida</span>
              </button>
            </div>

            <div className="bg-[#0D1117] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-tactical uppercase text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Data / Hora</th>
                    <th className="py-3 px-4">Cenário</th>
                    <th className="py-3 px-4">Placar (Alfa x Bravo)</th>
                    <th className="py-3 px-4">Vencedor</th>
                    <th className="py-3 px-4">MVP</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {matchHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500 font-tactical uppercase">
                        Nenhuma partida registrada no histórico.
                      </td>
                    </tr>
                  ) : (
                    matchHistory.map((m) => {
                      const mvp = players.find((p) => p.id === m.mvpPlayerId);
                      return (
                        <tr key={m.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-3 px-4 font-code text-slate-300">{m.date}</td>
                          <td className="py-3 px-4 font-tactical font-bold text-white">{m.scenarioName}</td>
                          <td className="py-3 px-4 font-code font-bold">
                            <span className="text-blue-400">{m.teamAlpha.score}</span> x{' '}
                            <span className="text-red-400">{m.teamBravo.score}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-tactical font-bold uppercase ${
                              m.winner === 'Alfa' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                              m.winner === 'Bravo' ? 'bg-red-950 text-red-400 border border-red-800' :
                              'bg-slate-900 text-slate-400'
                            }`}>
                              Time {m.winner}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-amber-400 font-tactical">
                            {mvp ? `"${mvp.callsign}"` : 'Nenhum'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditMatchModal(m)}
                                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                                title="Editar Partida"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMatch(m.id)}
                                className="p-1.5 rounded bg-red-950/60 hover:bg-red-900 text-red-400"
                                title="Excluir Partida"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: CENÁRIOS DE JOGO (CRUD)                       */}
        {/* ==================================================== */}
        {activeTab === 'scenarios' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-[#0D1117] p-4 rounded-xl border border-slate-800">
              <div>
                <h3 className="font-tactical font-black text-sm uppercase text-white">
                  CENÁRIOS & MODOS DE COMBATE
                </h3>
                <p className="text-xs text-slate-400">
                  Crie modos customizados de jogo para o seu campo ou edite as regras e durações dos cenários clássicos.
                </p>
              </div>

              <button
                onClick={handleOpenNewScenarioModal}
                className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-tactical text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>+ Novo Modo de Jogo</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scenarios.map((sc) => (
                <div key={sc.id} className="bg-[#0D1117] border border-slate-800 rounded-xl p-5 space-y-3 relative group">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-code text-orange-400 uppercase bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/30">
                        {sc.id} • {sc.defaultDurationMinutes} min
                      </span>
                      <h4 className="font-tactical font-black text-base uppercase text-white mt-1.5">
                        {sc.name}
                      </h4>
                      <p className="text-xs text-orange-400/90 font-tactical">"{sc.tagline}"</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditScenarioModal(sc)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                        title="Editar Modo"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteScenario(sc.id, sc.name)}
                        className="p-1.5 rounded bg-red-950/60 hover:bg-red-900 text-red-400"
                        title="Excluir Modo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {sc.description}
                  </p>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-emerald-400">
                    <strong>Objetivo:</strong> {sc.objective}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 5: BACKUP & RESTAURAÇÃO DE DADOS JSON            */}
        {/* ==================================================== */}
        {activeTab === 'backup' && (
          <div className="max-w-2xl bg-[#0D1117] border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-tactical font-black uppercase text-white">
                CENTRAL DE DADOS & BACKUP DO SISTEMA
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Faça o download do banco de dados completo do PaintOps em formato JSON para guardar ou migrar de dispositivo.
              </p>
            </div>

            <div className="space-y-4">
              {/* Export Button */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-tactical font-bold text-sm text-white uppercase">
                    Exportar Backup Completo (.JSON)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Inclui todos os {players.length} operadores, histórico de partidas, configurações financeiras e modos de jogo.
                  </p>
                </div>
                <button
                  onClick={handleExportJSON}
                  className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-tactical text-xs font-bold uppercase tracking-wider flex items-center gap-2 shrink-0 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar JSON</span>
                </button>
              </div>

              {/* Import Button */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-tactical font-bold text-sm text-white uppercase">
                    Restaurar Backup a partir de Arquivo (.JSON)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Carregue um arquivo JSON gerado anteriormente para restaurar todos os dados imediatamente.
                  </p>
                </div>
                <label className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-tactical text-xs font-bold uppercase tracking-wider flex items-center gap-2 shrink-0 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>Carregar JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Reset to Factory Defaults */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-tactical font-bold text-sm text-red-400 uppercase">
                    Restaurar Padrões de Fábrica (Mock Data)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Restaura os operadores militares originais e valores padrões de demonstração.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Tem certeza? Todos os operadores e partidas personalizadas serão redefinidos para os padrões militares de demonstração.')) {
                      onResetFactoryData();
                      showToast('🔄 Padrões de fábrica restaurados!');
                    }
                  }}
                  className="px-3.5 py-2 rounded-lg bg-red-950 hover:bg-red-900 text-red-300 font-tactical text-xs font-bold uppercase border border-red-800 transition-colors"
                >
                  Restaurar Padrões
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ==================================================== */}
      {/* MODAL 1: OPERADOR (CRIAR / EDITAR)                   */}
      {/* ==================================================== */}
      {isPlayerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#0D1117] border border-slate-800 rounded-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-tactical font-black text-lg uppercase text-white">
                {editingPlayerId ? 'Editar Operador' : 'Registrar Novo Operador'}
              </h3>
              <button
                onClick={() => setIsPlayerModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlayer} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-tactical uppercase text-slate-300 mb-1">
                    Codinome Tático *
                  </label>
                  <input
                    type="text"
                    placeholder='Ex: "GHOST"'
                    value={playerFormData.callsign || ''}
                    onChange={(e) => setPlayerFormData({ ...playerFormData, callsign: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white uppercase font-bold focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-tactical uppercase text-slate-300 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Carlos Silva"
                    value={playerFormData.name || ''}
                    onChange={(e) => setPlayerFormData({ ...playerFormData, name: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-tactical uppercase text-slate-300 mb-1">
                    Função Tática
                  </label>
                  <select
                    value={playerFormData.role || 'Assault'}
                    onChange={(e) => setPlayerFormData({ ...playerFormData, role: e.target.value as PlayerRole })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="Assault">Assalto</option>
                    <option value="Sniper">Sniper</option>
                    <option value="Tank">Tanque / Suporte</option>
                    <option value="Flanker">Flanqueador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-tactical uppercase text-slate-300 mb-1">
                    Nível de Mira / Skill (1 a 5)
                  </label>
                  <select
                    value={playerFormData.skillLevel || 3}
                    onChange={(e) => setPlayerFormData({ ...playerFormData, skillLevel: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value={1}>★ 1 - Recruta / Iniciante</option>
                    <option value={2}>★★ 2 - Operador Básico</option>
                    <option value={3}>★★★ 3 - Veterano Equilibrado</option>
                    <option value={4}>★★★★ 4 - Especialista Tático</option>
                    <option value={5}>★★★★★ 5 - Elite / Sniper Cirúrgico</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-tactical uppercase text-slate-300 mb-1">
                    Presença Inicial
                  </label>
                  <select
                    value={playerFormData.status || 'confirmed'}
                    onChange={(e) => setPlayerFormData({ ...playerFormData, status: e.target.value as PlayerPresence })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="confirmed">Confirmado (Em Campo)</option>
                    <option value="bench">Banco de Espera</option>
                    <option value="absent">Ausente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-tactical uppercase text-slate-300 mb-1">
                    Equipamento / Marcador
                  </label>
                  <select
                    value={playerFormData.hasOwnGear ? 'true' : 'false'}
                    onChange={(e) => setPlayerFormData({ ...playerFormData, hasOwnGear: e.target.value === 'true' })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="true">Possui Equipamento Próprio</option>
                    <option value="false">Aluga Marcador do Campo</option>
                  </select>
                </div>
              </div>

              {/* Stats Counters */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-[11px] font-tactical uppercase text-slate-400 mb-2">
                  Estatísticas Acumuladas
                </p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <label className="text-[10px] uppercase text-slate-500">Jogos</label>
                    <input
                      type="number"
                      min="0"
                      value={playerFormData.stats?.matches || 0}
                      onChange={(e) => setPlayerFormData({
                        ...playerFormData,
                        stats: { ...playerFormData.stats!, matches: Number(e.target.value) || 0 }
                      })}
                      className="w-full p-1 bg-slate-900 border border-slate-800 rounded text-center text-xs text-white font-code"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-slate-500">Vitórias</label>
                    <input
                      type="number"
                      min="0"
                      value={playerFormData.stats?.wins || 0}
                      onChange={(e) => setPlayerFormData({
                        ...playerFormData,
                        stats: { ...playerFormData.stats!, wins: Number(e.target.value) || 0 }
                      })}
                      className="w-full p-1 bg-slate-900 border border-slate-800 rounded text-center text-xs text-emerald-400 font-code"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-slate-500">MVPs</label>
                    <input
                      type="number"
                      min="0"
                      value={playerFormData.stats?.mvps || 0}
                      onChange={(e) => setPlayerFormData({
                        ...playerFormData,
                        stats: { ...playerFormData.stats!, mvps: Number(e.target.value) || 0 }
                      })}
                      className="w-full p-1 bg-slate-900 border border-slate-800 rounded text-center text-xs text-amber-400 font-code"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-slate-500">Kills</label>
                    <input
                      type="number"
                      min="0"
                      value={playerFormData.stats?.eliminations || 0}
                      onChange={(e) => setPlayerFormData({
                        ...playerFormData,
                        stats: { ...playerFormData.stats!, eliminations: Number(e.target.value) || 0 }
                      })}
                      className="w-full p-1 bg-slate-900 border border-slate-800 rounded text-center text-xs text-white font-code"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPlayerModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-tactical uppercase font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-tactical uppercase font-bold"
                >
                  Salvar Operador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: HISTÓRICO DE PARTIDA (CRIAR / EDITAR)        */}
      {/* ==================================================== */}
      {isMatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#0D1117] border border-slate-800 rounded-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-tactical font-black text-lg uppercase text-white">
                {editingMatchId ? 'Editar Partida' : 'Registrar Nova Partida'}
              </h3>
              <button
                onClick={() => setIsMatchModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMatch} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-tactical uppercase text-slate-300 mb-1">
                    Data e Hora
                  </label>
                  <input
                    type="text"
                    value={matchFormData.date || ''}
                    onChange={(e) => setMatchFormData({ ...matchFormData, date: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-code"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-tactical uppercase text-slate-300 mb-1">
                    Cenário de Combate
                  </label>
                  <select
                    value={matchFormData.scenario || 'deathmatch'}
                    onChange={(e) => setMatchFormData({ ...matchFormData, scenario: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  >
                    {scenarios.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-tactical uppercase text-slate-300 mb-1">
                    Pontos Time Alfa
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={matchFormData.teamAlpha?.score || 0}
                    onChange={(e) => setMatchFormData({
                      ...matchFormData,
                      teamAlpha: { name: 'Alfa', score: Number(e.target.value) || 0, playerIds: matchFormData.teamAlpha?.playerIds || [] }
                    })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-blue-400 font-code font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-tactical uppercase text-slate-300 mb-1">
                    Pontos Time Bravo
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={matchFormData.teamBravo?.score || 0}
                    onChange={(e) => setMatchFormData({
                      ...matchFormData,
                      teamBravo: { name: 'Bravo', score: Number(e.target.value) || 0, playerIds: matchFormData.teamBravo?.playerIds || [] }
                    })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-red-400 font-code font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-tactical uppercase text-slate-300 mb-1">
                    Vencedor do Combate
                  </label>
                  <select
                    value={matchFormData.winner || 'Alfa'}
                    onChange={(e) => setMatchFormData({ ...matchFormData, winner: e.target.value as 'Alfa' | 'Bravo' | 'Empate' })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  >
                    <option value="Alfa">Vitória Time Alfa</option>
                    <option value="Bravo">Vitória Time Bravo</option>
                    <option value="Empate">Empate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-tactical uppercase text-slate-300 mb-1">
                    MVP Eleito
                  </label>
                  <select
                    value={matchFormData.mvpPlayerId || ''}
                    onChange={(e) => setMatchFormData({ ...matchFormData, mvpPlayerId: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  >
                    <option value="">Nenhum MVP</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>"{p.callsign}" ({p.name})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMatchModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-tactical uppercase font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-tactical uppercase font-bold"
                >
                  Salvar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: CENÁRIO (CRIAR / EDITAR)                    */}
      {/* ==================================================== */}
      {isScenarioModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#0D1117] border border-slate-800 rounded-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-tactical font-black text-lg uppercase text-white">
                {editingScenarioId ? 'Editar Cenário' : 'Novo Cenário de Combate'}
              </h3>
              <button
                onClick={() => setIsScenarioModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveScenario} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-tactical uppercase text-slate-300 mb-1">
                    ID do Cenário *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: dom_point"
                    value={scenarioFormData.id || ''}
                    onChange={(e) => setScenarioFormData({ ...scenarioFormData, id: e.target.value })}
                    disabled={!!editingScenarioId}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-code disabled:opacity-60"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-tactical uppercase text-slate-300 mb-1">
                    Duração Padrão (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={scenarioFormData.defaultDurationMinutes || 8}
                    onChange={(e) => setScenarioFormData({ ...scenarioFormData, defaultDurationMinutes: Number(e.target.value) || 8 })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-code"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-tactical uppercase text-slate-300 mb-1">
                  Nome Completo da Missão *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Dominação de Ponto / Base Hostil"
                  value={scenarioFormData.name || ''}
                  onChange={(e) => setScenarioFormData({ ...scenarioFormData, name: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-tactical uppercase text-slate-300 mb-1">
                  Tagline / Frase Tática
                </label>
                <input
                  type="text"
                  placeholder="Ex: Mantenha o perímetro fortificado sob fogo cerrado"
                  value={scenarioFormData.tagline || ''}
                  onChange={(e) => setScenarioFormData({ ...scenarioFormData, tagline: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-tactical uppercase text-slate-300 mb-1">
                  Descrição das Regras
                </label>
                <textarea
                  rows={2}
                  value={scenarioFormData.description || ''}
                  onChange={(e) => setScenarioFormData({ ...scenarioFormData, description: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-tactical uppercase text-slate-300 mb-1">
                  Objetivo Principal
                </label>
                <input
                  type="text"
                  placeholder="Ex: Alfa captura bandeiras 1 e 2; Bravo defende a colina central."
                  value={scenarioFormData.objective || ''}
                  onChange={(e) => setScenarioFormData({ ...scenarioFormData, objective: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsScenarioModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-tactical uppercase font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-tactical uppercase font-bold"
                >
                  Salvar Cenário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
