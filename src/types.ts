export type PlayerRole = 'Assault' | 'Sniper' | 'Tank' | 'Flanker';

export type PlayerPresence = 'confirmed' | 'bench' | 'absent';

export type AppViewMode = 'landing' | 'app' | 'admin';

export interface PlayerStats {
  matches: number;
  wins: number;
  mvps: number;
  eliminations: number;
  deaths: number;
}

export interface Player {
  id: string;
  callsign: string;
  name: string;
  skillLevel: number; // 1 to 5 stars
  role: PlayerRole;
  status: PlayerPresence;
  hasOwnGear: boolean; // true = has own marker/mask (saves rental), false = rents from field
  extraAmmoPacks: number; // individual extra paintballs (packs or portions)
  stats: PlayerStats;
  badges: string[]; // Badge keys earned
}

export type GameScenario = 'deathmatch' | 'ctf' | 'vip' | 'koth' | string;

export interface ScenarioPreset {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  objective: string;
  defaultDurationMinutes: number;
  iconName: string;
}

export interface MatchTeam {
  name: 'Alfa' | 'Bravo';
  score: number;
  players: string[]; // Player IDs
  alivePlayerIds: string[]; // Active in the current round
  penalties: number;
}

export interface MatchEvent {
  id: string;
  timestampSeconds: number; // match time remaining when event happened
  realTime: string;
  type: 'kill' | 'elimination' | 'penalty' | 'point' | 'objective' | 'system' | 'vip_safe' | 'start' | 'pause';
  text: string;
  team?: 'Alfa' | 'Bravo';
  playerId?: string;
}

export interface LiveMatchState {
  id: string;
  scenario: GameScenario;
  durationSeconds: number;
  timeRemaining: number;
  isRunning: boolean;
  isFinished: boolean;
  isPaused: boolean;
  teamAlpha: MatchTeam;
  teamBravo: MatchTeam;
  vipPlayerId?: string; // Player ID escorted in VIP scenario
  firstEliminatedPlayerId?: string; // Earliest casualty for 'Bucha de Canhão'
  roundWinner?: 'Alfa' | 'Bravo' | 'Empate';
  mvpPlayerId?: string;
  events: MatchEvent[];
  startedAt?: string;
}

export interface MatchHistoryRecord {
  id: string;
  date: string;
  scenario: GameScenario;
  scenarioName: string;
  durationMinutes: number;
  teamAlpha: {
    name: 'Alfa';
    score: number;
    playerIds: string[];
  };
  teamBravo: {
    name: 'Bravo';
    score: number;
    playerIds: string[];
  };
  winner: 'Alfa' | 'Bravo' | 'Empate';
  mvpPlayerId?: string;
  firstEliminatedPlayerId?: string;
  ghostOperativeIds?: string[];
  notes?: string;
}

export interface FinancialConfig {
  venueCost: number; // e.g. R$ 400
  boxPrice: number; // e.g. R$ 180 (caixa com 2000 bolinhas)
  ballsPerBox: number; // 2000
  gearRentalPrice: number; // e.g. R$ 35 por pessoa sem equipamento
  communityBoxesCount: number; // Caixas divididas entre todos
  extraPackPrice: number; // R$ por pacote individual adicional (ex: 200 bolinhas = R$ 30)
  pixKey: string;
  pixKeyType: string;
  organizerName: string;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  humorTip: string;
  colorClass: string;
}
