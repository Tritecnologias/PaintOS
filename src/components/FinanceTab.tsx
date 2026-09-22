import React, { useState } from 'react';
import { 
  DollarSign, Copy, Check, Shield, Package, 
  Share2, AlertCircle, HelpCircle, CheckCircle, 
  XCircle, Edit2, Save, FileText, Download, Loader2
} from 'lucide-react';
import { FinancialConfig, Player, MatchHistoryRecord, LiveMatchState } from '../types';
import { tacticalAudio } from '../utils/audio';
import { generatePaintOpsPDFReport } from '../utils/pdfReport';

interface FinanceTabProps {
  players: Player[];
  config: FinancialConfig;
  matchHistory?: MatchHistoryRecord[];
  liveMatch?: LiveMatchState;
  onUpdateConfig: (newConfig: FinancialConfig) => void;
  onUpdatePlayerExtraAmmo: (playerId: string, packs: number) => void;
  onTogglePlayerGear: (playerId: string, hasOwnGear: boolean) => void;
}

export const FinanceTab: React.FC<FinanceTabProps> = ({
  players,
  config,
  matchHistory = [],
  liveMatch,
  onUpdateConfig,
  onUpdatePlayerExtraAmmo,
  onTogglePlayerGear,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [paidPlayers, setPaidPlayers] = useState<Record<string, boolean>>({});
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Form edit state
  const [tempVenueCost, setTempVenueCost] = useState(config.venueCost);
  const [tempBoxPrice, setTempBoxPrice] = useState(config.boxPrice);
  const [tempGearPrice, setTempGearPrice] = useState(config.gearRentalPrice);
  const [tempCommunityBoxes, setTempCommunityBoxes] = useState(config.communityBoxesCount);
  const [tempExtraPackPrice, setTempExtraPackPrice] = useState(config.extraPackPrice);
  const [tempPixKey, setTempPixKey] = useState(config.pixKey);
  const [tempPixType, setTempPixType] = useState(config.pixKeyType);
  const [tempOrganizer, setTempOrganizer] = useState(config.organizerName);

  // Confirmed players who participate in cost split
  const confirmedPlayers = players.filter((p) => p.status === 'confirmed');
  const totalCount = confirmedPlayers.length || 1;

  // Fixed Base Split: Venue Rent + Community Paintball Boxes
  const totalCommunityBoxesCost = config.communityBoxesCount * config.boxPrice;
  const totalCommonCosts = config.venueCost + totalCommunityBoxesCost;
  const commonCostPerPerson = confirmedPlayers.length > 0 ? totalCommonCosts / confirmedPlayers.length : 0;

  // Individual calculation helper
  const calculatePlayerCost = (player: Player) => {
    const base = commonCostPerPerson;
    const gearFee = player.hasOwnGear ? 0 : config.gearRentalPrice;
    const ammoExtra = (player.extraAmmoPacks || 0) * config.extraPackPrice;
    return {
      base,
      gearFee,
      ammoExtra,
      total: base + gearFee + ammoExtra,
    };
  };

  // Grand Total of the event
  const grandTotalCost = confirmedPlayers.reduce((acc, p) => {
    return acc + calculatePlayerCost(p).total;
  }, 0);

  // Total collected from paid players
  const totalPaid = confirmedPlayers.reduce((acc, p) => {
    return paidPlayers[p.id] ? acc + calculatePlayerCost(p).total : acc;
  }, 0);

  const togglePaid = (id: string) => {
    tacticalAudio.playClick();
    setPaidPlayers((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    tacticalAudio.playVictory();
    onUpdateConfig({
      venueCost: Number(tempVenueCost),
      boxPrice: Number(tempBoxPrice),
      ballsPerBox: config.ballsPerBox,
      gearRentalPrice: Number(tempGearPrice),
      communityBoxesCount: Number(tempCommunityBoxes),
      extraPackPrice: Number(tempExtraPackPrice),
      pixKey: tempPixKey,
      pixKeyType: tempPixType,
      organizerName: tempOrganizer,
    });
    setIsEditingConfig(false);
  };

  // Generate WhatsApp Message
  const generateWhatsAppMessage = () => {
    let msg = `*🎯 PAINTOPS - RATEIO DA PARTIDA DE PAINTBALL*\n`;
    msg += `Organizador: ${config.organizerName}\n`;
    msg += `Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
    msg += `------------------------------------\n`;
    msg += `*📊 Custos Gerais do Campo:*\n`;
    msg += `• Locação do Campo: R$ ${config.venueCost.toFixed(2)}\n`;
    msg += `• Bolinhas Coletivas (${config.communityBoxesCount} caixas): R$ ${totalCommunityBoxesCost.toFixed(2)}\n`;
    msg += `• Base por Operador (${confirmedPlayers.length} confirmados): *R$ ${commonCostPerPerson.toFixed(2)}*\n`;
    msg += `------------------------------------\n`;
    msg += `*📋 VALORES INDIVIDUAIS POR COMBATENTE:*\n`;

    confirmedPlayers.forEach((p) => {
      const calc = calculatePlayerCost(p);
      const gearNote = p.hasOwnGear ? 'Equip. Próprio' : `Aluguel (+R$${config.gearRentalPrice})`;
      const ammoNote = p.extraAmmoPacks > 0 ? ` + ${p.extraAmmoPacks} pct extra` : '';
      msg += `\n• *"${p.callsign}"* (${p.name}): *R$ ${calc.total.toFixed(2)}*`;
      msg += `\n   [${gearNote}${ammoNote}]`;
    });

    msg += `\n\n------------------------------------`;
    msg += `\n*🔑 DADOS PARA PAGAMENTO PIX:*\n`;
    msg += `Chave (${config.pixKeyType}): *${config.pixKey}*\n`;
    msg += `Favorecido: ${config.organizerName}\n`;
    msg += `_Favor enviar o comprovante no grupo após transferência._\n`;

    return msg;
  };

  const handleCopyWhatsApp = () => {
    tacticalAudio.playClick();
    const text = generateWhatsAppMessage();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleGeneratePDF = () => {
    tacticalAudio.playVictory();
    setIsGeneratingPDF(true);
    try {
      generatePaintOpsPDFReport({
        players,
        config,
        matchHistory,
        liveMatch,
        paidStatus: paidPlayers,
      });
    } catch (err) {
      console.error('Falha ao gerar relatório PDF:', err);
    } finally {
      setTimeout(() => setIsGeneratingPDF(false), 1200);
    }
  };

  return (
    <div className="space-y-4 pb-24 md:pb-8">
      {/* Top Banner: Financial Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
          <p className="text-[11px] font-tactical uppercase tracking-wider text-slate-400">
            Custo Total do Evento
          </p>
          <p className="text-2xl font-bold font-code text-white mt-0.5">
            R$ {grandTotalCost.toFixed(2)}
          </p>
          <span className="text-[10px] text-slate-500 font-mono">
            Campo + Tintas + Aluguéis
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
          <p className="text-[11px] font-tactical uppercase tracking-wider text-slate-400">
            Base Fixa / Pessoa
          </p>
          <p className="text-2xl font-bold font-code text-orange-400 mt-0.5">
            R$ {commonCostPerPerson.toFixed(2)}
          </p>
          <span className="text-[10px] text-slate-500 font-mono">
            {confirmedPlayers.length} operadores dividindo
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
          <p className="text-[11px] font-tactical uppercase tracking-wider text-slate-400">
            Total Arrecadado (PIX)
          </p>
          <p className="text-2xl font-bold font-code text-emerald-400 mt-0.5">
            R$ {totalPaid.toFixed(2)}
          </p>
          <span className="text-[10px] text-slate-500 font-mono">
            {confirmedPlayers.filter((p) => paidPlayers[p.id]).length} de {confirmedPlayers.length} pagos
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
          <p className="text-[11px] font-tactical uppercase tracking-wider text-slate-400">
            Saldo Pendente
          </p>
          <p className="text-2xl font-bold font-code text-amber-400 mt-0.5">
            R$ {(grandTotalCost - totalPaid).toFixed(2)}
          </p>
          <span className="text-[10px] text-slate-500 font-mono">
            A receber em campo
          </span>
        </div>
      </div>

      {/* Action Bar: Copy WhatsApp & Edit Rates */}
      <div className="bg-[#0c1017] border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-tactical font-black text-sm uppercase tracking-wider text-white">
              Rateio Tático Transparente
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Chave PIX: <strong className="text-slate-200">{config.pixKey}</strong> ({config.organizerName})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsEditingConfig(!isEditingConfig)}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-tactical text-xs uppercase font-bold tracking-wider border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{isEditingConfig ? 'Fechar Tarifas' : 'Ajustar Tarifas'}</span>
          </button>

          <button
            onClick={handleCopyWhatsApp}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-tactical text-xs uppercase font-bold tracking-wider shadow-sm shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5 active:scale-95"
            title="Copiar texto formatado para colar no WhatsApp"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiado WhatsApp!' : 'Copiar p/ WhatsApp'}</span>
          </button>

          <button
            onClick={handleGeneratePDF}
            disabled={isGeneratingPDF}
            className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:bg-orange-800 text-white font-tactical text-xs uppercase font-bold tracking-wider shadow-sm shadow-orange-600/40 border border-orange-500/50 transition-all flex items-center justify-center gap-2 active:scale-95"
            title="Exportar Relatório PDF com Prestação de Contas, Pontuação dos Times e Ranking"
          >
            {isGeneratingPDF ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span>{isGeneratingPDF ? 'Gerando PDF...' : 'Exportar Relatório PDF'}</span>
          </button>
        </div>
      </div>

      {/* Rate Editing Drawer/Form */}
      {isEditingConfig && (
        <form
          onSubmit={handleSaveConfig}
          className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-tactical font-bold text-xs uppercase tracking-wider text-orange-400">
              Configurações de Valores do Campo & Munição
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-tactical uppercase text-slate-400 mb-1">
                Locação do Campo (R$)
              </label>
              <input
                type="number"
                step="5"
                value={tempVenueCost}
                onChange={(e) => setTempVenueCost(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-tactical uppercase text-slate-400 mb-1">
                Preço da Caixa de Bolinhas (R$)
              </label>
              <input
                type="number"
                step="5"
                value={tempBoxPrice}
                onChange={(e) => setTempBoxPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-tactical uppercase text-slate-400 mb-1">
                Caixas Comunitárias Compradas
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={tempCommunityBoxes}
                onChange={(e) => setTempCommunityBoxes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-tactical uppercase text-slate-400 mb-1">
                Aluguel Equip. do Campo (R$)
              </label>
              <input
                type="number"
                step="5"
                value={tempGearPrice}
                onChange={(e) => setTempGearPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-tactical uppercase text-slate-400 mb-1">
                Pacote Extra Individual (R$)
              </label>
              <input
                type="number"
                step="5"
                value={tempExtraPackPrice}
                onChange={(e) => setTempExtraPackPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-tactical uppercase text-slate-400 mb-1">
                Chave PIX
              </label>
              <input
                type="text"
                value={tempPixKey}
                onChange={(e) => setTempPixKey(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-tactical uppercase text-slate-400 mb-1">
                Tipo da Chave
              </label>
              <select
                value={tempPixType}
                onChange={(e) => setTempPixType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white font-mono"
              >
                <option value="Telefone">Telefone</option>
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
                <option value="E-mail">E-mail</option>
                <option value="Aleatória">Chave Aleatória</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-tactical uppercase text-slate-400 mb-1">
                Nome do Organizador (Favorecido)
              </label>
              <input
                type="text"
                value={tempOrganizer}
                onChange={(e) => setTempOrganizer(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditingConfig(false)}
              className="px-4 py-2 rounded-lg text-xs font-tactical uppercase text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-tactical font-bold text-xs uppercase flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Tarifas</span>
            </button>
          </div>
        </form>
      )}

      {/* INDIVIDUAL SQUAD BREAKDOWN TABLE */}
      <div className="bg-[#0b0f17] border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="font-tactical font-black text-sm uppercase tracking-wider text-white">
              Detalhamento por Operador Confirmado ({confirmedPlayers.length})
            </h4>
          </div>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            Clique em "Pago" para dar baixa no acerto
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-tactical uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Operador</th>
                <th className="py-3 px-3">Rateio Base</th>
                <th className="py-3 px-3">Equipamento</th>
                <th className="py-3 px-3">Bolinhas Extras</th>
                <th className="py-3 px-3">Total a Pagar</th>
                <th className="py-3 px-3 text-center">Status PIX</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {confirmedPlayers.map((player) => {
                const calc = calculatePlayerCost(player);
                const isPaid = !!paidPlayers[player.id];

                return (
                  <tr
                    key={player.id}
                    className={`hover:bg-slate-900/40 transition-colors ${
                      isPaid ? 'bg-emerald-950/10' : ''
                    }`}
                  >
                    {/* Player Info */}
                    <td className="py-3 px-3">
                      <div>
                        <span className="font-tactical font-bold text-sm text-white uppercase block">
                          "{player.callsign}"
                        </span>
                        <span className="text-[11px] text-slate-400 font-sans">
                          {player.name}
                        </span>
                      </div>
                    </td>

                    {/* Base Cost */}
                    <td className="py-3 px-3 text-slate-300">
                      R$ {calc.base.toFixed(2)}
                    </td>

                    {/* Gear Status */}
                    <td className="py-3 px-3">
                      <button
                        onClick={() => onTogglePlayerGear(player.id, player.hasOwnGear)}
                        title="Clique para alternar: Marcador Próprio vs Aluguel"
                        className={`px-2 py-1 rounded text-[10px] font-tactical uppercase font-bold tracking-wider border transition-colors ${
                          player.hasOwnGear
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {player.hasOwnGear ? 'Próprio (R$ 0)' : `Alugado (+R$${config.gearRentalPrice})`}
                      </button>
                    </td>

                    {/* Extra Ammo */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onUpdatePlayerExtraAmmo(player.id, Math.max(0, (player.extraAmmoPacks || 0) - 1))}
                          className="w-6 h-6 rounded bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="font-bold text-white px-1">
                          {player.extraAmmoPacks || 0}
                        </span>
                        <button
                          onClick={() => onUpdatePlayerExtraAmmo(player.id, (player.extraAmmoPacks || 0) + 1)}
                          className="w-6 h-6 rounded bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                        {calc.ammoExtra > 0 && (
                          <span className="text-[10px] text-orange-400 ml-1">
                            (+R${calc.ammoExtra.toFixed(0)})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Total To Pay */}
                    <td className="py-3 px-3 font-bold text-sm text-white">
                      R$ {calc.total.toFixed(2)}
                    </td>

                    {/* Status PIX Toggle */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => togglePaid(player.id)}
                        className={`px-3 py-1 rounded-full text-[11px] font-tactical font-bold uppercase tracking-wider transition-all flex items-center gap-1 mx-auto ${
                          isPaid
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                        }`}
                      >
                        {isPaid ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Pago</span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                            <span>Pendente</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {confirmedPlayers.length === 0 && (
          <div className="p-8 text-center text-slate-500 font-tactical uppercase">
            Nenhum operador com status "Confirmado" no pelotão.
          </div>
        )}
      </div>
    </div>
  );
};
