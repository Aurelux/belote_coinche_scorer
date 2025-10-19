export interface Player {
  id: string;
  name: string;
  team: 'A' | 'B' | 'C';
  userId?: string;
  isGuest?: boolean;
  profilePicture?: string;
  profileTitle?: string;
}

export interface User {
  id: string;
  displayName: string;
  email?: string;
  profilePicture?: string;
  accessCode?: string;
  profileTitle?: string;
  friends?: string[];
  createdAt?: Date;
  stats?: UserStats;
  achievements?: Achievement[];
  lastLoginAt?: Date;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt: Date;
  profileTitle?: string;
}

export interface UserStats {
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  highestScore: number;
  totalCapots: number;
  totalPointsScored: number;
  totalPointsConceded: number;
  totalPenalties: number;
  averagePointsPerGame: number;
  totalCoinches: number;
  successfulCoinches: number;
  totalSurcoinches: number;
  successfulSurcoinches: number;
  totalContractsTaken: number;
  successfulContracts: number;
  beloteRebelotes: number;
  
  // Stats by game mode and player count
  belote2P: GameModeStats;
  belote3P: GameModeStats;
  belote4P: GameModeStats;
  coinche2P: GameModeStats;
  coinche3P: GameModeStats;
  coinche4P: GameModeStats;
}

export interface PlayerTree {
  id?: string;
  name: string;
  profile_picture?: string;
  team?: string;
}

export interface MatchNode {
  id: string;
  round: number;
  players: Player[];
  children: MatchNode[];
  score?: [number, number];
  status: "pending" | "finished";
  format?: string; // BO1, BO3...
  nextMatchId? : string;
  
}
export interface GameModeStats {
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  highestScore: number;
  capots: number;
  pointsScored: number;
  pointsConceded: number;
  penalties: number;
  averagePoints: number;
  coinches: number;
  successfulCoinches: number;
  contractsTaken: number;
  successfulContracts: number;
  rankingScore: number;
  risk : number;
}

export interface PlayerStatsForTimeframe {
  userId: string;
  name: string;
  profilePicture?: string;
  profileTitle?: string;
  games: number;
  wins: number;
  totalPoints: number;
  pointsConceded: number;
  coinches: number;
  penalties: number;
}
export interface PlayerRanking {
  userId: string;
  name: string;
  profilePicture?: string;
  profileTitle?: string;
  rankingScore: number;
  gamesPlayed: number;
  winRate: number;
  averagePoints: number;
  totalCoinches: number;
  pointsConceded: number;
  penalties: number;
  rank: number;
}

export interface GameSettings {
  mode: 'belote' | 'coinche';
  playerCount: 2 | 3 | 4;
  withAnnouncements: boolean;
  targetScore: number;
  isTournament: boolean;
  currentTournamentId: string;
  matchId : string;
  tournamentOptions : string;
  codeTournoi : string;
}

export interface Bid {
  value: number;
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'no-trump' | 'all-trump';
  player: string;
}

export interface Penalty {
  id: string;
  playerId: string;
  points: number;
  reason?: string;
  appliedBy: string;
  timestamp: Date;
}

export interface Hand {
  id: string;
  handNumber: number;
  dealer: string;
  taker?: string;
  bid?: Bid;
  coincher?: string;
  surcoincher?: string;
  winningTeam: 'A' | 'B' | 'C';
  points: number;
  announcements?: number;
  beloteRebelote?: boolean;
  beloteRebeloteTeam?: 'A' | 'B' | 'C';
  isCapot: boolean;
  contractFulfilled?: boolean;
  isCoincheSuccessful?: boolean;
  isSurcoincheSuccessful?: boolean;
  penalties?: Penalty[];
  timestamp: Date;
  teamAScore?: number;
  teamBScore?: number;
  teamCScore?: number;
}

export interface MatchHistory {
  id: string;
  players: Player[];
  settings: GameSettings;
  finalScores: {
    teamA: number;
    teamB: number;
    teamC?: number;
  };
  winningTeam: 'A' | 'B' | 'C';
  handsPlayed: number;
  duration: number;
  penalties: Penalty[];
  timestamp: Date;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}

export interface GameInvite {
  id: string;
  gameId: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}

export interface PlayerConfirmation {
  playerId: string;
  userId: string;
  confirmed: boolean;
  attempts: number;
}

export interface GameState {
  players: Player[];
  settings: GameSettings;
  hands: Hand[];
  currentDealer: number | null;
  teamAScore: number;
  teamBScore: number;
  teamCScore: number;
  gameEnded: boolean;
  winningTeam?: 'A' | 'B' | 'C';
  gameStartTime?: Date;
  matchHistory: MatchHistory[];
  currentUser?: User;
  users: User[];
  friends: User[];
  friendRequests: FriendRequest[];
  gameInvites: GameInvite[];
  pendingConfirmations: PlayerConfirmation[];
  selectedUser?: User | null;
  onlineGameId?: string;
  showPlayerConfirmation?: boolean;
}

export type AppScreen = 'auth' | 'setup' | 'game-mode' | 'game' | 'analytics' | 'history' | 'profile' | 'user-profile' | 'rankings' | 'friends' | 'add-friends';

// Enhanced profile titles with colors and unlock conditions
export const PROFILE_TITLES = [
  // Default titles (always available)
  { id: 'rookie', title: 'Débutant', description: 'Nouveau joueur', color: 'text-gray-600' },
  { id: 'player', title: 'Joueur', description: 'Joueur régulier', color: 'text-blue-600' },
  { id: 'expert', title: 'Expert', description: 'Joueur expérimenté', color: 'text-green-600' },
  
  // Unlockable titles with colors and requirements
  { id: 'capot_apprentice', title: 'Apprenti Capot', description: '10 capots réalisés', color: 'text-orange-600', requirement: 'totalCapots', threshold: 10 },
  { id: 'capot_master', title: 'Maître Capot', description: '25 capots réalisés', color: 'text-red-600', requirement: 'totalCapots', threshold: 25 },
  { id: 'capot_king', title: 'Roi du Capot', description: '50 capots réalisés', color: 'text-yellow-600', requirement: 'totalCapots', threshold: 50 },
  { id: 'capot_legend', title: 'Légende du Capot', description: '100 capots réalisés', color: 'text-purple-600', requirement: 'totalCapots', threshold: 100 },
  
  { id: 'coinche_novice', title: 'Novice Coinche', description: '10 coinches réussies', color: 'text-indigo-600', requirement: 'successfulCoinches', threshold: 10 },
  { id: 'coinche_expert', title: 'Expert Coinche', description: '25 coinches réussies', color: 'text-pink-600', requirement: 'successfulCoinches', threshold: 25 },
  { id: 'coinche_ace', title: 'As de la Coinche', description: '50 coinches réussies', color: 'text-purple-600', requirement: 'successfulCoinches', threshold: 50 },
  { id: 'coinche_master', title: 'Maître de la Coinche', description: '100 coinches réussies', color: 'text-gradient-to-r from-purple-600 to-pink-600', requirement: 'successfulCoinches', threshold: 100 },
  
  { id: 'veteran', title: 'Vétéran', description: '50 parties jouées', color: 'text-emerald-600', requirement: 'totalGames', threshold: 50 },
  { id: 'champion', title: 'Champion', description: '100 victoires', color: 'text-amber-600', requirement: 'totalWins', threshold: 100 },
  { id: 'legend', title: 'Légende', description: '150 parties jouées', color: 'text-gradient-to-r from-yellow-500 to-red-500', requirement: 'totalGames', threshold: 150 },
  { id: 'immortal', title: 'Immortel', description: '300 parties jouées', color: 'text-gradient-to-r from-purple-500 to-pink-500', requirement: 'totalGames', threshold: 300 },
  
  { id: 'scorer', title: 'Marqueur', description: '10000 points marqués', color: 'text-teal-600', requirement: 'totalPointsScored', threshold: 10000 },
  { id: 'high_scorer', title: 'Grand Marqueur', description: '25000 points marqués', color: 'text-cyan-600', requirement: 'totalPointsScored', threshold: 25000 },
  { id: 'point_master', title: 'Maître des Points', description: '50000 points marqués', color: 'text-gradient-to-r from-blue-500 to-teal-500', requirement: 'totalPointsScored', threshold: 50000 },
  { id: 'point_god', title: 'Accro des points', description: '150000 points marqués', color: 'text-violet-500', requirement: 'totalPointsScored', threshold: 150000 },

  { id: 'belote_specialist', title: 'Spécialiste Belote', description: '50 Belote-Rebelote', color: 'text-rose-600', requirement: 'beloteRebelotes', threshold: 50 },
  { id: 'contract_master', title: 'Maître des Contrats', description: '100 contrats réussis', color: 'text-violet-600', requirement: 'successfulContracts', threshold: 100 },
  { id: 'contract_god', title: 'Dieu des Contrats', description: '300 contrats réussis', color: 'text-red-600', requirement: 'successfulContracts', threshold: 300 },
  { id: 'winrate_deb', title: 'Chaîne de Feu', description: '3 victoires de suites', color: 'text-bronze-600', requirement: 'winStreak', threshold: 3 },
  { id: 'winrate_spe', title: 'Séreal Winner', description: '5 victoires de suites', color: 'text-platinium-600', requirement: 'winStreak', threshold: 5 },
  { id: 'winrate_champ', title: 'Inarrêtable', description: '8 victoires de suites', color: 'text-silver-600', requirement: 'winStreak', threshold: 8 },
  { id: 'winrate_legend', title: 'Écrasante Domination', description: '10 victoires de suites', color: 'text-gold-600', requirement: 'winStreak', threshold: 20 },
  { id: 'winrate_divine', title: 'Légende Vivante', description: '15 victoires de suites', color: 'text-emerald-600', requirement: 'winStreak', threshold: 15 },

  { id: 'lossrate_oops', title: 'Poissard', description: '3 défaites de suites', color: 'text-gray-600', requirement: 'lossStreak', threshold: 3 },
  { id: 'lossrate_ghost', title: 'Fantôme du Jeu', description: '5 défaites de suites', color: 'text-bluegray-600', requirement: 'lossStreak', threshold: 5 },
  { id: 'lossrate_punchbag', title: 'Sac de Frappe', description: '8 défaites de suites', color: 'text-red-600', requirement: 'lossStreak', threshold:8 },
  { id: 'lossrate_clown', title: 'Pompe à vélo', description: '10 défaites de suites', color: 'text-amber-600', requirement: 'lossStreak', threshold: 10 },
  { id: 'lossrate_downfall', title: 'Descente aux Enfers', description: '15 défaites de suites', color: 'text-black-600', requirement: 'lossStreak', threshold: 15},
  // Win rate based titles

  { id: 'pastis', title: 'Tournée de Pastis', description: "Faire un score qu'avec des 5/1", color: 'text-yellow-600', requirement: 'isPastis', threshold: 1 },
  { id: 'biere', title: 'Tournée de Bière', description: "Faire un score qu'avec des 8/6", color: 'text-bluegray-600', requirement: 'isBiere', threshold: 1 },
  { id: 'tempete', title: 'Tempête sous la couette', description: "Faire un score qu'avec des 6/9", color: 'text-red-600', requirement: 'isTempete', threshold: 1 },

  { 
  id: 'duo_fidele', 
  title: 'Duo Fidèle', 
  description: "Jouer 10 parties avec le même coéquipier favori", 
  color: 'text-amber-600', 
  requirement: 'mostPlayedWith', 
  threshold: 10 
},

  { 
  id: 'ame_soeur', 
  title: 'Âme Sœur de Belote', 
  description: "Atteindre 30 parties avec ton coéquipier le plus joué", 
  color: 'text-rose-600', 
  requirement: 'mostPlayedWith', 
  threshold: 30 
},
  { 
  id: 'indeboulonnable_duo', 
  title: 'Indéboulonnable Duo', 
  description: "50 parties jouées avec le même joueur à tes côtés", 
  color: 'text-indigo-700', 
  requirement: 'mostPlayedWith', 
  threshold: 50 
},
  { 
  id: 'risk_bronze', 
  title: 'Plat du pied sécurité', 
  description: 'Une moyenne de pari supérieure à 90', 
  color: 'text-blue-600', 
  requirement: 'risk', 
  threshold: 90 
},
{ 
  id: 'risk_silver', 
  title: 'Bon parleur', 
  description: 'Une moyenne de pari supérieure à 105', 
  color: 'text-indigo-600', 
  requirement: 'risk', 
  threshold: 110 
},
{ 
  id: 'risk_gold', 
  title: 'Parieur fou furieux', 
  description: 'Une moyenne de pari supérieure à 120', 
  color: 'text-purple-600', 
  requirement: 'risk', 
  threshold: 120 
}
,
  
  { id: 'winner', title: 'Gagnant', description: '60% de victoires (min 50 parties)', color: 'text-green-700', requirement: 'winRate', threshold: 60, minGames: 50 },
  { id: 'dominator', title: 'Dominateur', description: '60% de victoires (min 100 parties)', color: 'text-gradient-to-r from-green-600 to-emerald-600', requirement: 'winRate', threshold: 60, minGames: 100 }

  
];

// Dealer rotation order for 4-player games (clockwise: 1 -> 3 -> 2 -> 4)
export const DEALER_ROTATION_4P = [0, 2, 1, 3]; // Player indices for 4-player clockwise rotation



