import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Player, FinancialConfig, MatchHistoryRecord, LiveMatchState } from '../types';

export interface PDFReportOptions {
  players: Player[];
  config: FinancialConfig;
  matchHistory?: MatchHistoryRecord[];
  liveMatch?: LiveMatchState;
  paidStatus?: Record<string, boolean>;
}

export function generatePaintOpsPDFReport({
  players,
  config,
  matchHistory = [],
  liveMatch,
  paidStatus = {},
}: PDFReportOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const generationDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Confirmed players
  const confirmedPlayers = players.filter((p) => p.status === 'confirmed');
  const count = confirmedPlayers.length || 1;

  // Costs Calculation
  const totalCommunityBoxesCost = config.communityBoxesCount * config.boxPrice;
  const totalCommonCosts = config.venueCost + totalCommunityBoxesCost;
  const commonCostPerPerson = confirmedPlayers.length > 0 ? totalCommonCosts / count : 0;

  // Individual Totals
  let grandTotal = 0;
  const individualBreakdowns = confirmedPlayers.map((player) => {
    const base = commonCostPerPerson;
    const gearFee = player.hasOwnGear ? 0 : config.gearRentalPrice;
    const ammoExtra = (player.extraAmmoPacks || 0) * config.extraPackPrice;
    const total = base + gearFee + ammoExtra;
    grandTotal += total;
    const isPaid = paidStatus[player.id] || false;
    return {
      player,
      base,
      gearFee,
      ammoExtra,
      total,
      isPaid,
    };
  });

  // Total collected if paid
  const totalPaid = individualBreakdowns
    .filter((b) => b.isPaid)
    .reduce((acc, curr) => acc + curr.total, 0);

  // 1. TOP HEADER BANNER (Tactical Slate & Orange Accent)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Orange brand accent line
  doc.setFillColor(255, 94, 0); // tactical orange #FF5E00
  doc.rect(0, 27, pageWidth, 2, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('PAINTOPS // RELATÓRIO TÁTICO & FINANCEIRO', 14, 13);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`PRESTAÇÃO DE CONTAS, PONTUAÇÃO DOS TIMES E RANKING • GERADO EM ${generationDate}`, 14, 20);

  // 2. FINANCIAL SUMMARY BOX
  let currentY = 36;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, pageWidth - 28, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('RESUMO GERAL DOS GASTOS DA PARTIDA', 18, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const col1X = 18;
  const col2X = 80;
  const col3X = 142;

  doc.text(`Locação do Campo: R$ ${config.venueCost.toFixed(2)}`, col1X, currentY + 12);
  doc.text(`Bolinhas Coletivas: R$ ${totalCommunityBoxesCost.toFixed(2)} (${config.communityBoxesCount} cx)`, col1X, currentY + 18);
  doc.text(`Organizador: ${config.organizerName || 'Comando Geral'}`, col1X, currentY + 24);

  doc.text(`Operadores Confirmados: ${confirmedPlayers.length} atletas`, col2X, currentY + 12);
  doc.text(`Rateio Fixo / Pessoa: R$ ${commonCostPerPerson.toFixed(2)}`, col2X, currentY + 18);
  doc.text(`Chave PIX: ${config.pixKey || 'Não informada'} (${config.pixKeyType})`, col2X, currentY + 24);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 94, 0);
  doc.text(`TOTAL GERAL: R$ ${grandTotal.toFixed(2)}`, col3X, currentY + 12);
  doc.setTextColor(16, 185, 129); // green
  doc.text(`Arrecadado: R$ ${totalPaid.toFixed(2)}`, col3X, currentY + 18);
  doc.setTextColor(225, 29, 72); // red
  doc.text(`Pendente: R$ ${(grandTotal - totalPaid).toFixed(2)}`, col3X, currentY + 24);

  currentY += 34;

  // 3. TABLE 1: PRESTAÇÃO DE CONTAS INDIVIDUAL
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. PRESTAÇÃO DE CONTAS POR OPERADOR (RATEIO + EXTRAS)', 14, currentY);

  const financeRows = individualBreakdowns.map((b) => [
    b.player.callsign ? `"${b.player.callsign}" - ${b.player.name}` : b.player.name,
    b.player.hasOwnGear ? 'Equip. Próprio (R$ 0)' : `Aluguel (R$ ${config.gearRentalPrice.toFixed(2)})`,
    b.player.extraAmmoPacks > 0 ? `${b.player.extraAmmoPacks}x (R$ ${b.ammoExtra.toFixed(2)})` : 'Nenhum',
    `R$ ${b.base.toFixed(2)}`,
    `R$ ${b.total.toFixed(2)}`,
    b.isPaid ? 'PAGO [OK]' : 'PENDENTE',
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Operador', 'Marcador / Equip.', 'Bolinhas Extras', 'Rateio Base', 'Total a Pagar', 'Status']],
    body: financeRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 52 },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold', textColor: [234, 88, 12] },
      5: { halign: 'center', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.column.index === 5 && data.section === 'body') {
        const text = String(data.cell.raw);
        if (text.includes('PAGO')) {
          data.cell.styles.textColor = [16, 185, 129];
        } else {
          data.cell.styles.textColor = [225, 29, 72];
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  // Get Y position after table 1
  // @ts-expect-error autoTable adds lastAutoTable to doc
  currentY = (doc.lastAutoTable?.finalY || currentY + 50) + 9;

  // 4. SECTION 2: PONTUAÇÃO FINAL DOS TIMES (TIME ALFA vs TIME BRAVO)
  if (currentY > pageHeight - 75) {
    doc.addPage();
    currentY = 16;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. PONTUAÇÃO FINAL DOS TIMES (TIME ALFA vs TIME BRAVO)', 14, currentY);

  const teamScoresRows: string[][] = [];

  // If live match state exists
  if (liveMatch) {
    const alphaPlayers = liveMatch.teamAlpha.players
      .map((id) => players.find((p) => p.id === id)?.callsign || id)
      .join(', ');
    const bravoPlayers = liveMatch.teamBravo.players
      .map((id) => players.find((p) => p.id === id)?.callsign || id)
      .join(', ');

    let resultStatus = 'Em Andamento';
    if (liveMatch.isFinished) {
      if (liveMatch.teamAlpha.score > liveMatch.teamBravo.score) {
        resultStatus = 'Vitória TIME ALFA';
      } else if (liveMatch.teamBravo.score > liveMatch.teamAlpha.score) {
        resultStatus = 'Vitória TIME BRAVO';
      } else {
        resultStatus = 'Empate Técnico';
      }
    }

    teamScoresRows.push([
      'Partida Vigente',
      liveMatch.scenario,
      `${liveMatch.teamAlpha.score} pts (${liveMatch.teamAlpha.alivePlayerIds.length} vivos)`,
      `${liveMatch.teamBravo.score} pts (${liveMatch.teamBravo.alivePlayerIds.length} vivos)`,
      resultStatus,
      `Alfa: [${alphaPlayers.slice(0, 26)}...] | Bravo: [${bravoPlayers.slice(0, 26)}...]`,
    ]);
  }

  // Add historical match scores
  matchHistory.slice(0, 4).forEach((m) => {
    const winnerText = m.winner === 'Empate' ? 'Empate' : `Vitória ${m.winner}`;
    const mvpPlayer = players.find((p) => p.id === m.mvpPlayerId);
    const mvpCallsign = mvpPlayer ? `MVP: "${mvpPlayer.callsign}"` : '';

    teamScoresRows.push([
      m.date,
      m.scenarioName,
      `${m.teamAlpha.score} pts`,
      `${m.teamBravo.score} pts`,
      winnerText,
      mvpCallsign || `${m.durationMinutes} min de combate`,
    ]);
  });

  if (teamScoresRows.length > 0) {
    autoTable(doc, {
      startY: currentY + 3,
      head: [['Partida / Data', 'Cenário', 'Time Alfa', 'Time Bravo', 'Resultado Final', 'Detalhes / MVP']],
      body: teamScoresRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { halign: 'center', fontStyle: 'bold', cellWidth: 26 },
        1: { halign: 'center', cellWidth: 28 },
        2: { halign: 'center', fontStyle: 'bold', textColor: [37, 99, 235] },
        3: { halign: 'center', fontStyle: 'bold', textColor: [225, 29, 72] },
        4: { halign: 'center', fontStyle: 'bold' },
        5: { halign: 'left', fontSize: 7 },
      },
      margin: { left: 14, right: 14 },
    });
    // @ts-expect-error autoTable adds lastAutoTable to doc
    currentY = (doc.lastAutoTable?.finalY || currentY + 40) + 9;
  }

  // 5. SECTION 3: RANKING ATUALIZADO DOS JOGADORES
  if (currentY > pageHeight - 75) {
    doc.addPage();
    currentY = 16;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('3. RANKING ATUALIZADO DOS JOGADORES (DESEMPENHO TÁTICO)', 14, currentY);

  const sortedByStats = [...players].sort((a, b) => {
    const winRateA = a.stats.matches > 0 ? a.stats.wins / a.stats.matches : 0;
    const winRateB = b.stats.matches > 0 ? b.stats.wins / b.stats.matches : 0;
    if (b.stats.mvps !== a.stats.mvps) return b.stats.mvps - a.stats.mvps;
    if (winRateB !== winRateA) return winRateB - winRateA;
    return b.stats.wins - a.stats.wins;
  });

  const statsRows = sortedByStats.map((p, idx) => {
    const winRate = p.stats.matches > 0 ? Math.round((p.stats.wins / p.stats.matches) * 100) : 0;
    return [
      `#${idx + 1}`,
      `"${p.callsign}" (${p.name})`,
      p.role,
      `${p.skillLevel}/5`,
      String(p.stats.matches),
      String(p.stats.wins),
      `${winRate}%`,
      String(p.stats.mvps),
      String(p.stats.eliminations),
    ];
  });

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Pos', 'Operador', 'Função', 'Mira', 'Jogos', 'Vitórias', 'Winrate', 'MVPs', 'Eliminações']],
    body: statsRows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold', cellWidth: 10 },
      1: { halign: 'left', fontStyle: 'bold', cellWidth: 50 },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'center', textColor: [16, 185, 129], fontStyle: 'bold' },
      6: { halign: 'center' },
      7: { halign: 'center', textColor: [217, 119, 6], fontStyle: 'bold' },
      8: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] },
    },
    margin: { left: 14, right: 14 },
  });

  // 6. FOOTER ON ALL PAGES
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('PaintOps Tactical Operations System • Relatório Oficial Financeiro & Desempenho Tático', 14, pageHeight - 7);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - 30, pageHeight - 7);
  }

  // Generate Filename & Trigger Direct PDF Download
  const sanitizedDate = new Date().toISOString().slice(0, 10);
  const fileName = `PaintOps_Relatorio_Financeiro_Pontuacao_${sanitizedDate}.pdf`;
  doc.save(fileName);
}

