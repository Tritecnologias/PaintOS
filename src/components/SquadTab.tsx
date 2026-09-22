import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserPlus, Search, Star, Shield, Crosshair, Zap, 
  Trash2, Edit3, CheckCircle2, Clock, XCircle, Package,
  SlidersHorizontal, Check, RefreshCw, Users
} from 'lucide-react';
import { Player, PlayerPresence, PlayerRole } from '../types';
import { tacticalAudio } from '../utils/audio';

interface SquadTabProps {
  players: Player[];
  onAddPlayer: (player: Omit<Player, 'id' | 'stats' | 'badges'>) => void;
  onUpdatePlayer: (id: string, updates: Partial<Player>) => void;
  onDeletePlayer: (id: string) => void;
  onResetSquad: () => void;
}

const ROLE_INFO: Record<PlayerRole, { label: string; icon: React.FC<{ className?: string }>; color: string }> = {
  Assault: { label: 'Assalto', icon: Crosshair, color: 'text-red-400 bg-red-500/10 border-red-500/30' },
  Sniper: { label: 'Atirador', icon: Zap, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  Tank: { label: 'Tanque / Sup', icon: Shield, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  Flanker: { label: 'Flanqueador', icon: SlidersHorizontal, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
};

export const SquadTab: React.FC<SquadTabProps> = ({
  players,
  onAddPlayer,
  onUpdatePlayer,
  onDeletePlayer,
  onResetSquad,
}) => {
  const [filterPresence, setFilterPresence] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);

  // Form State
  const [formCallsign, setFormCallsign] = useState('');
  const [formName, setFormName] = useState('');
  const [formSkill, setFormSkill] = useState<number>(3);
  const [formRole, setFormRole] = useState<PlayerRole>('Assault');
  const [formStatus, setFormStatus] = useState<PlayerPresence>('confirmed');
  const [formHasOwnGear, setFormHasOwnGear] = useState<boolean>(true);
  const [formExtraAmmo, setFormExtraAmmo] = useState<number>(0);

  const openNewPlayerModal = () => {
    tacticalAudio.playClick();
    setEditingPlayerId(null);
    setFormCallsign('');
    setFormName('');
    setFormSkill(3);
    setFormRole('Assault');
    setFormStatus('confirmed');
    setFormHasOwnGear(false);
    setFormExtraAmmo(0);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Player) => {
    tacticalAudio.playClick();
    setEditingPlayerId(p.id);
    setFormCallsign(p.callsign);
    setFormName(p.name);
    setFormSkill(p.skillLevel);
    setFormRole(p.role);
    setFormStatus(p.status);
    setFormHasOwnGear(p.hasOwnGear);
    setFormExtraAmmo(p.extraAmmoPacks || 0);
    setIsModalOpen(true);
  };

  const handleSavePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCallsign.trim()) return;

    if (editingPlayerId) {
      onUpdatePlayer(editingPlayerId, {
        callsign: formCallsign.trim(),
        name: formName.trim() || formCallsign.trim(),
        skillLevel: formSkill,
        role: formRole,
        status: formStatus,
        hasOwnGear: formHasOwnGear,
        extraAmmoPacks: formExtraAmmo,
      });
    } else {
      onAddPlayer({
        callsign: formCallsign.trim(),
        name: formName.trim() || formCallsign.trim(),
        skillLevel: formSkill,
        role: formRole,
        status: formStatus,
        hasOwnGear: formHasOwnGear,
        extraAmmoPacks: formExtraAmmo,
      });
    }

    tacticalAudio.playVictory();
    setIsModalOpen(false);
  };

  // Quick cycle status
  const cycleStatus = (id: string, current: PlayerPresence) => {
    tacticalAudio.playClick();
    const map: Record<PlayerPresence, PlayerPresence> = {
      confirmed: 'bench',
      bench: 'absent',
      absent: 'confirmed',
    };
    onUpdatePlayer(id, { status: map[current] });
  };

  // Direct status change
  const setPlayerStatus = (id: string, newStatus: PlayerPresence) => {
    tacticalAudio.playClick();
    onUpdatePlayer(id, { status: newStatus });
  };

  // Quick toggle own gear
  const toggleGear = (id: string, current: boolean) => {
    tacticalAudio.playClick();
    onUpdatePlayer(id, { hasOwnGear: !current });
  };

  // Filtered players
  const filteredPlayers = players.filter((p) => {
    const matchesPresence = filterPresence === 'all' || p.status === filterPresence;
    const matchesSearch =
      p.callsign.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPresence && matchesSearch;
  });

  const confirmedCount = players.filter((p) => p.status === 'confirmed').length;
  const benchCount = players.filter((p) => p.status === 'bench').length;
  const absentCount = players.filter((p) => p.status === 'absent').length;
  const avgSkill = players.length
    ? (players.reduce((acc, p) => acc + p.skillLevel, 0) / players.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Top Banner & Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        <div className="bg-slate-900/90 border border-orange-500/40 rounded-lg p-3 relative overflow-hidden group hover:border-orange-500 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-tactical uppercase tracking-wider text-orange-400 font-bold flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Total Cadastrados
            </p>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-code bg-orange-500/20 text-orange-400">
              BANCO
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-bold font-code text-white">
              {players.length}
            </span>
            <span className="text-xs text-slate-400 font-tactical">pessoas</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
          <p className="text-[11px] font-tactical uppercase tracking-wider text-slate-400">
            Prontos p/ Campo
          </p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-bold font-code text-emerald-400">
              {confirmedCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ({Math.floor(confirmedCount / 2)} vs {Math.ceil(confirmedCount / 2)})
            </span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
          <p className="text-[11px] font-tactical uppercase tracking-wider text-slate-400">
            Banco / Espera
          </p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-bold font-code text-amber-400">
              {benchCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">reservas</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
          <p className="text-[11px] font-tactical uppercase tracking-wider text-slate-400">
            Ausentes
          </p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-bold font-code text-slate-500">
              {absentCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">baixas</span>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-slate-900/90 border border-slate-800 rounded-lg p-3">
          <p className="text-[11px] font-tactical uppercase tracking-wider text-slate-400">
            Nível Médio
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-2xl font-bold font-code text-orange-400">
              {avgSkill}
            </span>
            <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Action Controls & Search */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por apelido (callsign) ou nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        {/* Add Operator & Reset Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={openNewPlayerModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-tactical font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm shadow-orange-600/30 transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Operador</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs by Presence */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'Todos', count: players.length },
          { key: 'confirmed', label: 'Confirmados', count: confirmedCount },
          { key: 'bench', label: 'Espera / Banco', count: benchCount },
          { key: 'absent', label: 'Ausentes', count: absentCount },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => {
              tacticalAudio.playClick();
              setFilterPresence(item.key);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-tactical font-semibold uppercase tracking-wider whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              filterPresence === item.key
                ? 'bg-slate-800 text-orange-400 border border-orange-500/40'
                : 'bg-slate-900/60 text-slate-400 border border-slate-800/80 hover:text-slate-200'
            }`}
          >
            <span>{item.label}</span>
            <span className="font-code text-[11px] px-1.5 py-0.2 rounded bg-slate-950 text-slate-300">
              {item.count}
            </span>
          </button>
        ))}
      </div>

      {/* Roster Grid with Smooth Slide-In/Out Transitions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <AnimatePresence mode="popLayout">
          {filteredPlayers.map((player) => {
            const roleData = ROLE_INFO[player.role] || ROLE_INFO.Assault;
            const RoleIcon = roleData.icon;

            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ 
                  opacity: 0, 
                  x: -32, 
                  scale: 0.92, 
                  transition: { duration: 0.22, ease: 'easeInOut' } 
                }}
                transition={{
                  layout: { type: 'spring', stiffness: 350, damping: 28 },
                  duration: 0.25,
                  ease: 'easeOut',
                }}
                key={player.id}
                className={`relative rounded-xl border p-3.5 transition-all duration-300 ease-in-out hover:border-slate-700 ${
                  player.status === 'confirmed'
                    ? 'bg-gradient-to-br from-[#0c1a16] to-[#0d121c] border-emerald-500/50 shadow-md shadow-emerald-500/10 border-l-4 border-l-emerald-500'
                    : player.status === 'bench'
                    ? 'bg-gradient-to-br from-[#1a160d] to-[#0d121c] border-amber-500/40 shadow-sm shadow-amber-500/5 border-l-4 border-l-amber-500'
                    : 'bg-[#0b0e14]/75 border-slate-800 opacity-60 hover:opacity-85 border-l-4 border-l-slate-700'
                }`}
              >
                {/* Header: Callsign, Name & Role Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-tactical font-black text-base text-white tracking-wide uppercase truncate">
                        "{player.callsign}"
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {player.name}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-tactical font-black uppercase tracking-wider border shrink-0 whitespace-nowrap ${roleData.color}`}
                  >
                    <RoleIcon className="w-3.5 h-3.5" />
                    <span>{roleData.label}</span>
                  </span>
                </div>

                {/* Dedicated Status Control (Full-width 3-columns grid - completely prevents text clipping or overflow) */}
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950/90 rounded-lg border border-slate-800/80 my-3">
                  {(['confirmed', 'bench', 'absent'] as const).map((st) => {
                    const isCurrent = player.status === st;
                    const isConf = st === 'confirmed';
                    const isBench = st === 'bench';
                    return (
                      <button
                        key={st}
                        onClick={() => setPlayerStatus(player.id, st)}
                        title={
                          isConf
                            ? 'Marcar Confirmado (Em Campo)'
                            : isBench
                            ? 'Marcar Espera (Banco de Reservas)'
                            : 'Marcar Ausente'
                        }
                        className={`w-full py-1.5 px-1 rounded-md text-[10px] sm:text-[11px] font-tactical font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-200 whitespace-nowrap overflow-hidden ${
                          isCurrent
                            ? isConf
                              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30 font-black'
                              : isBench
                              ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30 font-black'
                              : 'bg-slate-700 text-slate-200 shadow-sm font-black'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                        }`}
                      >
                        {isConf && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                        {isBench && <Clock className="w-3.5 h-3.5 shrink-0" />}
                        {st === 'absent' && <XCircle className="w-3.5 h-3.5 shrink-0" />}
                        <span className="truncate">{isConf ? 'Campo' : isBench ? 'Espera' : 'Ausente'}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Skill Stars & Tactical Badges */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/80">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-400 mr-1 font-tactical uppercase">
                      Mira:
                    </span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 transition-colors ${
                          star <= player.skillLevel
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-slate-800 text-slate-700'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Gear Status Pill */}
                  <button
                    onClick={() => toggleGear(player.id, player.hasOwnGear)}
                    title="Clique para alternar: Marcador Próprio vs Aluguel"
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium border flex items-center gap-1 transition-all duration-200 ${
                      player.hasOwnGear
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    <Package className="w-3 h-3" />
                    <span>{player.hasOwnGear ? 'Equip. Próprio' : 'Aluga Campo'}</span>
                  </button>
                </div>

                {/* Stats & Actions Row */}
                <div className="flex items-center justify-between mt-2.5 text-xs text-slate-400">
                  <div className="flex items-center gap-2.5 font-code text-[11px]">
                    <span>
                      <strong className="text-white">{player.stats.matches}</strong> jogos
                    </span>
                    <span>
                      <strong className="text-emerald-400">{player.stats.wins}</strong>V
                    </span>
                    <span>
                      <strong className="text-amber-400">{player.stats.mvps}</strong> MVP
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(player)}
                      title="Editar Operador"
                      className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        tacticalAudio.playClick();
                        if (confirm(`Remover "${player.callsign}" do pelotão?`)) {
                          onDeletePlayer(player.id);
                        }
                      }}
                      title="Remover Operador"
                      className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredPlayers.length === 0 && (
        <div className="bg-slate-900/60 border border-slate-800 border-dashed rounded-xl p-8 text-center text-slate-400">
          <p className="font-tactical text-base uppercase">Nenhum operador encontrado</p>
          <p className="text-xs text-slate-500 mt-1">
            Ajuste a busca ou adicione novos recrutas ao pelotão.
          </p>
        </div>
      )}

      {/* Modal: Add / Edit Operator */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-[#0d121c] border border-slate-700 rounded-xl shadow-2xl my-auto max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-tactical font-black text-base uppercase tracking-wider text-white flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-orange-400" />
                {editingPlayerId ? 'Editar Operador' : 'Alistar Novo Operador'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePlayer} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-tactical uppercase tracking-wider text-slate-400 mb-1">
                    Callsign (Apelido) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Ghost, Caveira"
                    value={formCallsign}
                    onChange={(e) => setFormCallsign(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-tactical uppercase tracking-wider text-slate-400 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Lucas Silva"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Skill Star Rating Selector */}
              <div>
                <label className="block text-xs font-tactical uppercase tracking-wider text-slate-400 mb-1">
                  Nível de Habilidade (Mira / Agilidade)
                </label>
                <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setFormSkill(star)}
                      className="p-1 rounded hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= formSkill
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-slate-800 text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-auto font-tactical font-bold text-xs uppercase text-amber-400">
                    {formSkill === 5
                      ? '5 Estrelas (Elite)'
                      : formSkill === 4
                      ? '4 Estrelas (Veterano)'
                      : formSkill === 3
                      ? '3 Estrelas (Intermediário)'
                      : formSkill === 2
                      ? '2 Estrelas (Iniciante)'
                      : '1 Estrela (Recruta)'}
                  </span>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-tactical uppercase tracking-wider text-slate-400 mb-1">
                  Função / Papel Preferido
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Assault', 'Sniper', 'Tank', 'Flanker'] as PlayerRole[]).map((r) => {
                    const info = ROLE_INFO[r];
                    const isSelected = formRole === r;
                    const Icon = info.icon;
                    return (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setFormRole(r)}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-tactical uppercase font-bold tracking-wider transition-all ${
                          isSelected
                            ? 'bg-orange-500/20 text-orange-400 border-orange-500 shadow-sm'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{info.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Presence Status */}
              <div>
                <label className="block text-xs font-tactical uppercase tracking-wider text-slate-400 mb-1">
                  Status de Presença Hoje
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'confirmed', label: 'Confirmado', color: 'emerald' },
                    { key: 'bench', label: 'Espera / Reserva', color: 'amber' },
                    { key: 'absent', label: 'Ausente', color: 'slate' },
                  ].map((s) => (
                    <button
                      type="button"
                      key={s.key}
                      onClick={() => setFormStatus(s.key as PlayerPresence)}
                      className={`p-2 rounded-lg border text-xs font-tactical uppercase font-bold tracking-wider text-center transition-all ${
                        formStatus === s.key
                          ? 'bg-slate-800 text-white border-orange-500 shadow-sm'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gear and Extra Ammo */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-tactical uppercase tracking-wider text-slate-400 mb-1">
                    Equipamento
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormHasOwnGear(!formHasOwnGear)}
                    className={`w-full p-2.5 rounded-lg border text-xs font-tactical uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                      formHasOwnGear
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>{formHasOwnGear ? 'Possui Próprio' : 'Aluga do Campo'}</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-tactical uppercase tracking-wider text-slate-400 mb-1">
                    Bolinhas Extras (Pcts)
                  </label>
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setFormExtraAmmo(Math.max(0, formExtraAmmo - 1))}
                      className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-code font-bold text-white text-sm">
                      {formExtraAmmo}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormExtraAmmo(formExtraAmmo + 1)}
                      className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-tactical uppercase font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-tactical font-bold text-xs uppercase tracking-wider transition-colors shadow-sm shadow-orange-600/30 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingPlayerId ? 'Salvar Alterações' : 'Alistar Operador'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
