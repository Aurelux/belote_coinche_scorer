import React, { createContext, useContext, useReducer, ReactNode, useEffect,useState } from 'react';
import { PlayerStatsForTimeframe,GameState, Player, GameSettings, Hand, AppScreen, MatchHistory, User, UserStats, GameModeStats, PlayerRanking, FriendRequest, Achievement, PROFILE_TITLES, PlayerConfirmation, DEALER_ROTATION_4P } from '../types/game';
import { supabase } from '../lib/supabase';


interface GameContextType {
  gameState: GameState;
  currentScreen: AppScreen;
  setCurrentScreen: (screen: AppScreen) => void;
  navigateTo: (screen: AppScreen) => void;
  goBack: () => void;
  setPlayers: (players: Player[]) => void;
  setGameSettings: (settings: GameSettings) => void;
  addHand: (hand: Omit<Hand, 'id' | 'handNumber' | 'timestamp'>) => void;
  resetGame: () => void;
  startNewGame: () => void;
  startRematch: () => void;
  registerUser: (user: Omit<User, 'id' | 'createdAt' | 'stats' | 'achievements'>) => Promise<User>;
  loginUser: (email: string, accessCode: string) => Promise<User | null>;
  logoutUser: () => void;
  searchUsers: (query: string) => Promise<User[]>;
  sendFriendRequest: (userId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  loadFriends: () => Promise<void>;
  loadFriendRequests: () => Promise<void>;
  confirmPlayer: (userId: string, accessCode: string) => Promise<boolean>;
  getUserRankings: (mode: 'belote' | 'coinche', playerCount: 2 | 3 | 4, group : 'friends' | 'world') => Promise<PlayerRanking[]>;
  updateUserStats: (userId: string, gameData: any) => Promise<void>;
  setSelectedUser: (user: User | null) => void;
  updateProfileTitle: (titleId: string) => Promise<void>;
  updateProfilePicture: (file: File) => Promise<void>;
  checkAchievements: (userId: string) => Promise<Achievement[]>;
  applyPenaltyToPlayer: (playerId: string, points: number, reason?: string) => void;
  autoLogin: () => Promise<boolean>;
  showPlayerConfirmationModal: () => void;
  hidePlayerConfirmationModal: () => void;
  saveGameToSupabase: () => Promise<void>;
  loadMatchHistory: () => Promise<void>;
  setDealer: (index: number) => void;
  nextDealer: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const createEmptyGameModeStats = (): GameModeStats => ({
  games: 0,
  wins: 0,
  losses: 0,
  winRate: 0,
  highestScore: 0,
  capots: 0,
  pointsScored: 0,
  pointsConceded: 0,
  penalties: 0,
  averagePoints: 0,
  coinches: 0,
  successfulCoinches: 0,
  contractsTaken: 0,
  successfulContracts: 0,
  rankingScore: 0
});

const createEmptyUserStats = (): UserStats => ({
  totalGames: 0,
  totalWins: 0,
  totalLosses: 0,
  winRate: 0,
  highestScore: 0,
  totalCapots: 0,
  totalPointsScored: 0,
  totalPointsConceded: 0,
  totalPenalties: 0,
  averagePointsPerGame: 0,
  totalCoinches: 0,
  successfulCoinches: 0,
  totalSurcoinches: 0,
  successfulSurcoinches: 0,
  totalContractsTaken: 0,
  successfulContracts: 0,
  beloteRebelotes: 0,
  belote2P: createEmptyGameModeStats(),
  belote3P: createEmptyGameModeStats(),
  belote4P: createEmptyGameModeStats(),
  coinche2P: createEmptyGameModeStats(),
  coinche3P: createEmptyGameModeStats(),
  coinche4P: createEmptyGameModeStats()
});

const initialGameState: GameState = {
  players: [],
  settings: {
    mode: 'belote',
    playerCount: 4,
    withAnnouncements: false,
    targetScore: 501,
    isOnline: true
  },
  hands: [],
  currentDealer: null,
  teamAScore: 0,
  teamBScore: 0,
  teamCScore: 0,
  gameEnded: false,
  matchHistory: [],
  users: [],
  friends: [],
  friendRequests: [],
  gameInvites: [],
  pendingConfirmations: [],
  showPlayerConfirmation: false
};

type GameAction = 
  | { type: 'SET_PLAYERS'; payload: Player[] }
  | { type: 'SET_GAME_SETTINGS'; payload: GameSettings }
  | { type: 'ADD_HAND'; payload: Hand }
  | { type: 'RESET_GAME' }
  | { type: 'START_NEW_GAME' }
  | { type: 'START_REMATCH' }
  | { type: 'SET_MATCH_HISTORY'; payload: MatchHistory[] }
  | { type: 'REGISTER_USER'; payload: User }
  | { type: 'LOGIN_USER'; payload: User }
  | { type: 'LOGOUT_USER' }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'SET_FRIENDS'; payload: User[] }
  | { type: 'SET_FRIEND_REQUESTS'; payload: FriendRequest[] }
  | { type: 'ADD_FRIEND_REQUEST'; payload: FriendRequest }
  | { type: 'REMOVE_FRIEND_REQUEST'; payload: string }
  | { type: 'ADD_FRIEND'; payload: User }
  | { type: 'CONFIRM_PLAYER'; payload: { userId: string; confirmed: boolean } }
  | { type: 'SET_SELECTED_USER'; payload: User | null }
  | { type: 'UPDATE_USER_STATS'; payload: { userId: string; stats: UserStats } }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'APPLY_PENALTY'; payload: { playerId: string; points: number; reason?: string } }
  | { type: 'SHOW_PLAYER_CONFIRMATION' }
  | { type: 'HIDE_PLAYER_CONFIRMATION' }
  | { type: 'SET_PENDING_CONFIRMATIONS'; payload: PlayerConfirmation[] }
  | { type: 'SET_CURRENT_DEALER'; payload: number }
  | { type: 'SET_GAME_STATE'; payload: Partial<GameState> };


// Calculate ranking score based on multiple factors



const calculateRankingScore = (stats: GameModeStats): number => {
  if (stats.games === 0) return 0;

  // 1. Pondération de l'expérience : plus tu joues, plus ton score est fiable
  const experienceFactor = Math.min(1, Math.log10(stats.games + 1) / 1.9); 
  // (→ atteint 1 vers 100 parties, moins de poids avant)

  // 2. Performance brute (points marqués vs concédés)
  const ratio = stats.pointsConceded > 0 ? stats.pointsScored / stats.pointsConceded : 1.2;
  // ratio = 1.0 signifie neutre, >1 = positif
  const ratioScore = (Math.min(3, ratio)) * 50/3; // entre 0 et +50 max

  // 3. Coinches et contrats réussis
  const coincheSuccess = stats.coinches > 0 ? (stats.successfulCoinches / stats.coinches)*1.2 : 0;
  const contractSuccess = stats.contractsTaken > 0 ? (stats.successfulContracts / stats.contractsTaken) : 0;
  const activite = stats.games > 0 ? stats.contractsTaken/stats.games : 0;
  const actionScore = (coincheSuccess * 10); // max 20 pts

  // 4. Capots comme bonus qualitatif
  const capotScore = stats.games > 0 ? Math.max(1, 12*(stats.capots/stats.games)) : 0; 

  // 5. Bonus modéré pour le taux de victoire (ne doit plus dominer)
  const winScore = stats.winRate * 0.5; // max 40 pts au lieu de 100

  // 6. Pénalité
  const penaltyMalus = Math.max(-15, -(stats.penalties / Math.max(stats.games, 1)) * 3);

  // Score combiné brut
  const rawScore = winScore + ratioScore + actionScore + capotScore + penaltyMalus +activite*contractSuccess*5;

  // Appliquer l'expérience comme pondération finale
  const finalScore = (rawScore * 0.8 + Math.min(5,(stats.games * 0.1))) * experienceFactor + 10; 
  // Ajout d’un petit +10 pour éviter des scores trop bas pour les joueurs moyens

  return Math.round(finalScore);
};

// Get next dealer index with proper rotation
const getNextDealerIndex = (currentDealer: number, playerCount: number): number => {
  if (playerCount === 4) {
    // Use clockwise rotation: 1 -> 3 -> 2 -> 4 (indices: 0 -> 2 -> 1 -> 3)
    const currentRotationIndex = DEALER_ROTATION_4P.indexOf(currentDealer);
    const nextRotationIndex = (currentRotationIndex + 1) % DEALER_ROTATION_4P.length;
    return DEALER_ROTATION_4P[nextRotationIndex];
  } else {
    // For 2 and 3 players, use simple sequential rotation
    return (currentDealer + 1) % playerCount;
  }
};



function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_GAME_STATE':
      return { ...state, ...action.payload };

    case 'SET_PLAYERS':
      return { ...state, players: action.payload, gameStartTime: new Date() };
    
    case 'SET_GAME_SETTINGS':
      return { ...state, settings: action.payload };
    
    case 'ADD_HAND': {
      const newHand = action.payload;
      const newHands = [...state.hands, newHand];
      
      // Use calculated scores from the hand data
      const newTeamAScore = state.teamAScore + (newHand.teamAScore || 0);
      const newTeamBScore = state.teamBScore + (newHand.teamBScore || 0);
      const newTeamCScore = state.teamCScore + (newHand.teamCScore || 0);
      
      const gameEnded = newTeamAScore >= state.settings.targetScore || 
                       newTeamBScore >= state.settings.targetScore ||
                       (state.settings.playerCount === 3 && newTeamCScore >= state.settings.targetScore);
      
      let winningTeam: 'A' | 'B' | 'C' | undefined;
      if (gameEnded) {
        if (state.settings.playerCount === 3) {
          if (newTeamAScore >= Math.max(newTeamBScore, newTeamCScore)) {
            winningTeam = 'A';
          } else if (newTeamBScore >= Math.max(newTeamAScore, newTeamCScore)) {
            winningTeam = 'B';
          } else {
            winningTeam = 'C';
          }
        } else {
          winningTeam = newTeamAScore > newTeamBScore ? 'A' : 'B';
        }
      }
      
      return {
        ...state,
        hands: newHands,
        teamAScore: newTeamAScore,
        teamBScore: newTeamBScore,
        teamCScore: newTeamCScore,
        currentDealer: getNextDealerIndex(state.currentDealer, state.players.length),
        gameEnded,
        winningTeam
      };
    }
      case 'UPDATE_HAND': {
  const updatedHand = action.payload;

  // Trouver l'ancienne main
  const oldHand = state.hands.find(h => h.id === updatedHand.id);
  if (!oldHand) return state; // rien à faire si la main n'existe pas

  // Soustraire l'ancien score, ajouter le nouveau
  const newTeamAScore = state.teamAScore - (oldHand.teamAScore || 0) + (updatedHand.teamAScore || 0);
  const newTeamBScore = state.teamBScore - (oldHand.teamBScore || 0) + (updatedHand.teamBScore || 0);
  const newTeamCScore = state.teamCScore - (oldHand.teamCScore || 0) + (updatedHand.teamCScore || 0);

  // Remplacer la main dans la liste
  const updatedHands = state.hands.map(h => h.id === updatedHand.id ? updatedHand : h);

  // Vérifier si la partie est terminée
  const gameEnded = newTeamAScore >= state.settings.targetScore || 
                    newTeamBScore >= state.settings.targetScore ||
                    (state.settings.playerCount === 3 && newTeamCScore >= state.settings.targetScore);

  let winningTeam: 'A' | 'B' | 'C' | undefined;
  if (gameEnded) {
    if (state.settings.playerCount === 3) {
      if (newTeamAScore >= Math.max(newTeamBScore, newTeamCScore)) {
        winningTeam = 'A';
      } else if (newTeamBScore >= Math.max(newTeamAScore, newTeamCScore)) {
        winningTeam = 'B';
      } else {
        winningTeam = 'C';
      }
    } else {
      winningTeam = newTeamAScore > newTeamBScore ? 'A' : 'B';
    }
  }

  return {
    ...state,
    hands: updatedHands,
    teamAScore: newTeamAScore,
    teamBScore: newTeamBScore,
    teamCScore: newTeamCScore,
    currentDealer: getNextDealerIndex(state.currentDealer, state.players.length),
    gameEnded,
    winningTeam
  };
}


    case 'APPLY_PENALTY': {
      const { playerId, points } = action.payload;
      const player = state.players.find(p => p.id === playerId);
      if (player) {
        let newTeamAScore = state.teamAScore;
        let newTeamBScore = state.teamBScore;
        let newTeamCScore = state.teamCScore;

        if (player.team === 'A') {
          newTeamAScore -= points;
        } else if (player.team === 'B') {
          newTeamBScore -= points;
        } else if (player.team === 'C') {
          newTeamCScore -= points;
        }

        const updatedPenalties = [...(state.hand?.penalties ?? []), { playerId, points }];

    return {
      ...state,
      teamAScore:  newTeamAScore,
      teamBScore:  newTeamBScore,
      teamCScore: newTeamCScore,
      hand: {
        ...state.hand,
        penalties: updatedPenalties
      }
    };
      }
      return state;
    }

    
    
    case 'RESET_GAME':
      return { ...initialGameState, currentUser: state.currentUser, friends: state.friends };
    
    case 'START_NEW_GAME':
      return {
        ...state,
        hands: [],
        teamAScore: 0,
        teamBScore: 0,
        teamCScore: 0,
        currentDealer: null,
        gameEnded: false,
        winningTeam: undefined,
        gameStartTime: new Date()
      };

    case 'START_REMATCH':
      return {
        ...state,
        hands: [],
        teamAScore: 0,
        teamBScore: 0,
        teamCScore: 0,
        currentDealer: null,
        gameEnded: false,
        winningTeam: undefined,
        gameStartTime: new Date()
      };

    case 'SET_MATCH_HISTORY':
      return { ...state, matchHistory: action.payload };

    case 'REGISTER_USER':
      return {
        ...state,
        currentUser: action.payload
      };

    case 'LOGIN_USER':
      const loginUser = { ...action.payload, lastLoginAt: new Date() };
      return {
        ...state,
        currentUser: loginUser
      };

    case 'LOGOUT_USER':
      return {
        ...state,
        currentUser: undefined
      };

    case 'SET_USERS':
      return {
        ...state,
        users: action.payload
      };

    case 'SET_FRIENDS':
      return {
        ...state,
        friends: action.payload
      };

    case 'SET_FRIEND_REQUESTS':
      return {
        ...state,
        friendRequests: action.payload
      };

    case 'ADD_FRIEND_REQUEST':
      return {
        ...state,
        friendRequests: [...state.friendRequests, action.payload]
      };

    case 'REMOVE_FRIEND_REQUEST':
      return {
        ...state,
        friendRequests: state.friendRequests.filter(req => req.id !== action.payload)
      };

    case 'ADD_FRIEND':
      return {
        ...state,
        friends: [...state.friends, action.payload]
      };

    case 'CONFIRM_PLAYER':
      const updatedConfirmations = state.pendingConfirmations.map(conf => 
        conf.userId === action.payload.userId 
          ? { ...conf, confirmed: action.payload.confirmed }
          : conf
      );
      
      return {
        ...state,
        pendingConfirmations: updatedConfirmations
      };

    case 'SET_PENDING_CONFIRMATIONS':
      return {
        ...state,
        pendingConfirmations: action.payload
      };

    case 'SHOW_PLAYER_CONFIRMATION':
      return {
        ...state,
        showPlayerConfirmation: true
      };

    case 'HIDE_PLAYER_CONFIRMATION':
      return {
        ...state,
        showPlayerConfirmation: false,
        pendingConfirmations: []
      };

    case 'SET_SELECTED_USER':
      return {
        ...state,
        selectedUser: action.payload
      };

    case 'UPDATE_USER_STATS':
      return {
        ...state,
        currentUser: state.currentUser?.id === action.payload.userId 
          ? { ...state.currentUser, stats: action.payload.stats }
          : state.currentUser
      };

      case 'SET_CURRENT_DEALER':
  return {
    ...state,
    currentDealer: action.payload
  };

    case 'UPDATE_USER':
      return {
        ...state,
        currentUser: state.currentUser?.id === action.payload.id 
          ? action.payload
          : state.currentUser,
        friends: state.friends.map(friend => 
          friend.id === action.payload.id ? action.payload : friend
        )
      };
    
    default:
      return state;
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
  const [currentScreen, setCurrentScreen] = React.useState<AppScreen>('auth');
   const [screenHistory, setScreenHistory] = useState<AppScreen[]>([]);

  const navigateTo = (screen: AppScreen) => {
    const previousScreen = screenHistory[screenHistory.length - 1]
    console.log('➡️ Previous screen:', previousScreen);
  console.log('➡️ Current screen:', currentScreen);
  console.log('➡️ Screen:', screen);
    if (currentScreen === 'user-profile' && previousScreen === 'rankings'){
      setScreenHistory((prev) => [...prev, currentScreen]);
      setCurrentScreen(previousScreen);
    };
    if (!(currentScreen == 'user-profile' && previousScreen == 'rankings') && screen !== currentScreen) {
      setScreenHistory((prev) => [...prev, currentScreen]);
      setCurrentScreen(screen);
    }
  };
  const updateHand = (id: string, updatedData: Partial<Hand>) => {
  setGameState((prevState) => {
    const updatedHands = prevState.hands.map((hand) =>
      hand.id === id ? { ...hand, ...updatedData } : hand
    );

    return {
      ...prevState,
      hands: updatedHands,
    };
  });
};
const setDealer = (index: number) => {
  dispatch({ type: 'SET_CURRENT_DEALER', payload: index });
};

const nextDealer = () => {
  dispatch({
    type: 'SET_CURRENT_DEALER',
    payload: getNextDealerIndex(gameState.currentDealer ?? 0, gameState.settings.playerCount)
  });
};


  const goBack = () => {
      
  setScreenHistory((prevHistory) => {
    const history = [...prevHistory];
    history.pop(); // remove current screen

    console.log('🔙 Full history before goBack:', prevHistory);
    console.log('📜 History after pop:', history);
    console.log(currentScreen.length);
    if (currentScreen.length>10){
      const previous = prevHistory[history.length] || 'setup';
      console.log('directionnn', previous);
      if (previous === 'help') {
        setCurrentScreen(previous)
        
    }
      else{setCurrentScreen('game')
        
      }
      return []
    }
    
    
    if (currentScreen === 'history') {
      const previous = prevHistory[history.length] || 'setup';
      setCurrentScreen(previous)
      return prevHistory
    }
    if (currentScreen === 'profile') {
      const lastPlayableScreen = [...prevHistory].reverse().find(
        (screen) => screen === 'game' || screen === 'setup'
      );

      console.log('🎯 Last playable screen (game/setup):', lastPlayableScreen);

      if (lastPlayableScreen) {
        const newHistory = history.slice(0, history.lastIndexOf(lastPlayableScreen) + 1);
        console.log('🧵 New trimmed history:', newHistory);
        setCurrentScreen(lastPlayableScreen);
        return newHistory;
      }

      console.log('⚠️ No playable screen found, fallback to setup');
      setCurrentScreen('setup');
      return [];
    }

    const previous = history[history.length-1] || 'setup';
    console.log('↩️ Going back to:', previous);
    setCurrentScreen(previous);
    return history;
  });
};
  
  // Add ref to track current screen for context functions
  const currentScreenRef = React.useRef<AppScreen>('auth');
  
  React.useEffect(() => {
    currentScreenRef.current = currentScreen;
  }, [currentScreen]);

  // Auto-login on app start
  useEffect(() => {
    const tryAutoLogin = async () => {
      const success = await autoLogin();
      if (success) {
        navigateTo('setup');
      }
    };
    tryAutoLogin();
  }, []);

  const setPlayers = (players: Player[]) => {
    console.log('setPlayers called with:', players);
    dispatch({ type: 'SET_PLAYERS', payload: players });
    
    // Check if any registered users (other than current user) need confirmation
    const registeredUsersInGame = players.filter(p => p.userId && p.userId !== gameState.currentUser?.id);
    
    console.log('Players set:', players);
    console.log('Registered users in game that need confirmation:', registeredUsersInGame);
    
    if (registeredUsersInGame.length > 0) {
      // Create confirmation entries for each registered user
      const confirmations: PlayerConfirmation[] = registeredUsersInGame.map(p => ({
        playerId: p.id,
        userId: p.userId!,
        confirmed: false,
        attempts: 0
      }));
      
      console.log('Setting up confirmations:', confirmations);
      dispatch({ type: 'SET_PENDING_CONFIRMATIONS', payload: confirmations });
      
      // Show the confirmation modal
      console.log('Showing confirmation modal');
      dispatch({ type: 'SHOW_PLAYER_CONFIRMATION' });
    } else {
      console.log('No registered users need confirmation, proceeding to game mode');
      // No registered users to confirm, proceed directly to game mode selection
      navigateTo('game-mode');
    }
  };

  const setGameSettings = (settings: GameSettings) => {
    dispatch({ type: 'SET_GAME_SETTINGS', payload: settings });
  };

 const addHand = async (handData: Omit<Hand, 'id' | 'handNumber' | 'timestamp'> & { id?: string }) => {
  const isEdit = gameState.hands.some(h => h.id === handData.id);

  const hand: Hand = {
    ...handData,
    id: handData.id || Date.now().toString(),
    handNumber: isEdit
      ? gameState.hands.find(h => h.id === handData.id)?.handNumber || gameState.hands.length + 1
      : gameState.hands.length + 1,
    timestamp: new Date()
  };

  dispatch({
    type: isEdit ? 'UPDATE_HAND' : 'ADD_HAND',
    payload: hand
  });

  // Update score
  const newTeamAScore = gameState.teamAScore + (hand.teamAScore || 0);
  const newTeamBScore = gameState.teamBScore + (hand.teamBScore || 0);
  const newTeamCScore = gameState.teamCScore + (hand.teamCScore || 0);

  const gameEnded =
    newTeamAScore >= gameState.settings.targetScore ||
    newTeamBScore >= gameState.settings.targetScore ||
    (gameState.settings.playerCount === 3 && newTeamCScore >= gameState.settings.targetScore);

  if (gameEnded) {
    await updateStatsAfterHand(hand);
  }

  await saveGameToSupabase();
};
  
  const updateStatsAfterHand = async (hand: Hand) => {
    // Check if game duration is at least 10 minutes
    if (gameState.gameStartTime) {
      const gameDuration = (new Date().getTime() - gameState.gameStartTime.getTime()) / (1000 * 60);
      if (gameDuration < 1) {
        console.log('Game too short (<10 min), not updating stats');
        return; // Don't update stats for games shorter than 10 minutes
      }
    }
    
    const newTeamAScore = gameState.teamAScore + (hand.teamAScore || 0);
    const newTeamBScore = gameState.teamBScore + (hand.teamBScore || 0);
    const newTeamCScore = gameState.teamCScore + (hand.teamCScore || 0);
    
    // Determine winning team
    let winningTeam: 'A' | 'B' | 'C';
    if (gameState.settings.playerCount === 3) {
      if (newTeamAScore >= Math.max(newTeamBScore, newTeamCScore)) {
        winningTeam = 'A';
      } else if (newTeamBScore >= Math.max(newTeamAScore, newTeamCScore)) {
        winningTeam = 'B';
      } else {
        winningTeam = 'C';
      }
    } else {
      winningTeam = newTeamAScore > newTeamBScore ? 'A' : 'B';
    }

    console.log('Updating stats for game completion. Winning team:', winningTeam);

    // Update stats for all registered players
    for (const player of gameState.players) {
      if (player.userId) {
        console.log('Updating stats for player:', player.name, 'userId:', player.userId);
        await updatePlayerStatsInSupabase(player, winningTeam, [...gameState.hands, hand]);
      }
    }
    const playersForHistory = gameState.players.map(p => ({
  id: p.id,
  name: p.name,
  team: p.team,
  userId: p.userId || null,
  profilePicture: '', // image vide pour ne pas sauvegarder l’originale
  profileTitle: p.profileTitle || ''
        }));

    // Save match to history
    if (gameState.gameStartTime) {
      const duration = Math.round((new Date().getTime() - gameState.gameStartTime.getTime()) / (1000 * 60));
      
      // Only save match history if game lasted at least 10 minutes
      if (duration >= 10) {
        const matchHistory: MatchHistory = {
          id: Date.now().toString(),
          players: playersForHistory,
          settings: gameState.settings,
          finalScores: {
            teamA: newTeamAScore,
            teamB: newTeamBScore,
            teamC: gameState.settings.playerCount === 3 ? newTeamCScore : undefined
          },
          winningTeam,
          handsPlayed: gameState.hands.length + 1,
          duration,
          penalties: [...gameState.hands, hand].flatMap(h => h.penalties || []),
          timestamp: new Date()
        };

        console.log('Saving match history:', matchHistory);
        await saveMatchHistoryToSupabase(matchHistory);
      }
    }
  };

  const updatePlayerStatsInSupabase = async (player: Player, winningTeam: 'A' | 'B' | 'C', allHands: Hand[]) => {
    try {
      // Get current user stats
      const { data: userData, error } = await supabase
        .from('users')
        .select('stats')
        .eq('id', player.userId)
        .single();

      if (error) throw error;

      const currentStats = userData.stats || createEmptyUserStats();
      const isWinner = player.team === winningTeam;
      
      // Calculate comprehensive stats for this player
      let pointsScored = 0;
      let pointsConceded = 0;
      let penaltiesReceived = 0;
      let capots = 0;
      let coinches = 0;
      let successfulCoinches = 0;
      let contractsTaken = 0;
      let successfulContracts = 0;
      let beloteRebelotes = 0;
      let totalBidValue = 0;
      
    
      
                
      const is3Players = gameState.settings.playerCount === 3;
const is2Players = gameState.settings.playerCount === 2;

// Récupérer les scores d'équipe
const getTeamScore = (hand: Hand, team: 'A' | 'B' | 'C') => {
  return team === 'A' ? hand.teamAScore || 0 :
         team === 'B' ? hand.teamBScore || 0 :
                        hand.teamCScore || 0;
};

allHands.forEach(hand => {
  const takerTeam = gameState.players.find(p => p.id === hand.taker)?.team;
  const coincherTeam = gameState.players.find(p => p.id === hand.coincher)?.team;
  const surcoincherTeam = gameState.players.find(p => p.id === hand.surcoincher)?.team;

  const playerScore = getTeamScore(hand, player.team);

  // 🔹 CONTRATS RÉUSSIS (non coinchés / surcoinchés)
  if (hand.contractFulfilled && !hand.coincher && !hand.surcoincher) {
    if (player.team === takerTeam && player.id === hand.taker) {
      pointsScored += playerScore;
    } if (player.team === takerTeam && !(player.id === hand.taker)){
      pointsScored +=0
    }
    if (!player.team === takerTeam){
      pointsScored += is3Players ? playerScore : is2Players ? playerScore : playerScore / 2;
    }
  }

  // 🔹 CONTRATS PERDUS (non coinchés / surcoinchés)
  if (hand.taker && !hand.contractFulfilled && !hand.coincher && !hand.surcoincher) {
    if (player.team === takerTeam && player.id === hand.taker) {
      if (is3Players) {
        pointsConceded += 240; // score total concédé
      } else {
        const opponentTeam = takerTeam === 'A' ? 'B' : 'A';
        const oppScore = getTeamScore(hand, opponentTeam);
        pointsConceded += oppScore;
      }
    } else {
      if (!player.team === takerTeam ) {
        
      pointsScored += is3Players ? playerScore :is2Players ? playerScore : playerScore / 2;
      }
    }
  }

  // 🔹 COINCHE RÉUSSIE
  if (hand.coincher && hand.isCoincheSuccessful && !hand.surcoincher) {
    if (player.id === hand.coincher) {
      pointsScored += getTeamScore(hand, coincherTeam);
    } else if (player.team === takerTeam && player.id === hand.taker) {
      pointsConceded += getTeamScore(hand, coincherTeam);
    }
  }

  // 🔹 SURCOINCHE RÉUSSIE
  if (hand.surcoincher && hand.isSurcoincheSuccessful) {
    if (player.id === hand.surcoincher) {
      pointsScored += getTeamScore(hand, surcoincherTeam);
    } else if (player.team === coincherTeam && player.id === hand.coincher) {
      pointsConceded += getTeamScore(hand, surcoincherTeam);
    }
  }

  // 🔹 COINCHE PERDUE
  if (hand.coincher && !hand.isCoincheSuccessful && !hand.surcoincher) {
    if (player.id === hand.coincher) {
      const takerScore = getTeamScore(hand, takerTeam);
      
      pointsConceded += takerScore;
    }
    else {
      if (player.id === hand.taker){
        pointsScored += getTeamScore(hand, takerTeam)
      }
    }
  }

  // 🔹 SURCOINCHE PERDUE
  if (hand.surcoincher && !hand.isSurcoincheSuccessful) {
    if (player.id === hand.surcoincher) {
      const coincherScore = getTeamScore(hand, coincherTeam);
      
      pointsConceded += coincherScore;
    }
    else {
      if (player.id === hand.coincher){
        pointsScored += getTeamScore(hand, coincherTeam)
      }
    }
  }
  console.log(player.name, pointsConceded, pointsScored)

        // Points scored when taking and succeeding contracts
        

        
        // Coinche stats
        if (hand.coincher === player.id) {
          coinches++;
          if (hand.isCoincheSuccessful) {
            successfulCoinches++;
          }
        }
        
        // Contract stats
        if (hand.taker === player.id) {
          contractsTaken++;
          if (hand.bid) {
            totalBidValue += hand.bid.value;
          }
          if (hand.contractFulfilled) {
            successfulContracts++;
          }
        }
        
        // Capots
        if (hand.isCapot && hand.winningTeam === player.team) {
          capots++;
        }
        
        // Belote-Rebelote
        if (hand.beloteRebelote && hand.beloteRebeloteTeam === player.team) {
          beloteRebelotes++;
        }
        
        // Penalties for this player
        if (hand.penalties) {
          hand.penalties.forEach(penalty => {
            if (penalty.playerId === player.id) {
              penaltiesReceived += penalty.points;
            }
          });
        }
      });

      const playerScore = player.team === 'A' ? gameState.teamAScore : 
                         player.team === 'B' ? gameState.teamBScore : gameState.teamCScore;

      const newStats = { ...currentStats };
      newStats.totalGames++;
      if (isWinner) {
        newStats.totalWins++;
      } else {
        newStats.totalLosses++;
      }
      newStats.winRate = (newStats.totalWins / newStats.totalGames) * 100;
      newStats.highestScore = Math.max(newStats.highestScore, playerScore);
      newStats.totalCapots += capots;
      newStats.totalPointsScored += pointsScored;
      newStats.totalPointsConceded += pointsConceded;
      newStats.totalPenalties += penaltiesReceived;
      newStats.totalCoinches += coinches;
      newStats.successfulCoinches += successfulCoinches;
      newStats.totalContractsTaken += contractsTaken;
      newStats.successfulContracts += successfulContracts;
      newStats.beloteRebelotes += beloteRebelotes;
      newStats.averagePointsPerGame = newStats.totalPointsScored / newStats.totalGames;
      newStats.totalBidValue = newStats.totalBidValue ? newStats.totalBidValue + totalBidValue : totalBidValue;
      newStats.diffgame = newStats.diffgame ? newStats.diffgame + contractsTaken : contractsTaken;
      newStats.risk = newStats.totalBidValue > 0 ? newStats.totalBidValue / newStats.diffgame : 0;

      // Update specific game mode stats
      const modeKey = `${gameState.settings.mode}${gameState.settings.playerCount}P` as keyof UserStats;
      const modeStats = newStats[modeKey] as GameModeStats;
      modeStats.games++;
      if (isWinner) {
        modeStats.wins++;
      } else {
        modeStats.losses++;
      }
      modeStats.winRate = (modeStats.wins / modeStats.games) * 100;
      modeStats.highestScore = Math.max(modeStats.highestScore, playerScore);
      modeStats.capots += capots;
      modeStats.pointsScored += pointsScored;
      modeStats.pointsConceded += pointsConceded;
      modeStats.penalties += penaltiesReceived;
      modeStats.coinches += coinches;
      modeStats.successfulCoinches += successfulCoinches;
      modeStats.contractsTaken += contractsTaken;
      modeStats.successfulContracts += successfulContracts;
      modeStats.averagePoints = modeStats.pointsScored / modeStats.games;
      modeStats.rankingScore = calculateRankingScore(modeStats);
      modeStats.totalBidValue = modeStats.totalBidValue ? modeStats.totalBidValue + totalBidValue : totalBidValue;
      modeStats.diffgame = modeStats.diffgame ? modeStats.diffgame + contractsTaken : contractsTaken;
      modeStats.risk = modeStats.totalBidValue > 0 ? modeStats.totalBidValue / modeStats.diffgame : 0;

      // Update stats in Supabase
      const { error: updateError } = await supabase
        .from('users')
        .update({ stats: newStats })
        .eq('id', player.userId);
      
      console.log(player.name, pointsScored, pointsConceded)

      if (updateError) throw updateError;

      // Update the local user state if this is the current user
      if (player.userId === gameState.currentUser?.id) {
        dispatch({ type: 'UPDATE_USER_STATS', payload: { userId: player.userId, stats: newStats } });
      }

    } catch (error) {
      console.error('Error updating player stats:', error);
    }
  };

  const saveMatchHistoryToSupabase = async (matchHistory: MatchHistory) => {
    try {
      const { error } = await supabase
        .from('match_history')
        .insert([{
          players: matchHistory.players,
          settings: matchHistory.settings,
          final_scores: matchHistory.finalScores,
          winning_team: matchHistory.winningTeam,
          hands_played: matchHistory.handsPlayed,
          duration: matchHistory.duration,
          penalties: matchHistory.penalties
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving match history:', error);
    }
  };

  const saveGameToSupabase = async () => {
    if (!gameState.currentUser || !gameState.onlineGameId) return;

    try {
      const { error } = await supabase
        .from('games')
        .update({
          players: gameState.players,
          settings: gameState.settings,
          current_scores: {
            teamA: gameState.teamAScore,
            teamB: gameState.teamBScore,
            teamC: gameState.teamCScore
          },
          hands: gameState.hands,
          status: gameState.gameEnded ? 'completed' : 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', gameState.onlineGameId);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving game:', error);
    }
  };

  const loadMatchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('match_history')
        .select('*')
        .order('created_at', { ascending: false });
        

      if (error) throw error;

      const matchHistory: MatchHistory[] = (data || []).map(match => ({
        id: match.id,
        players: match.players,
        settings: match.settings,
        finalScores: match.final_scores,
        winningTeam: match.winning_team,
        handsPlayed: match.hands_played,
        duration: match.duration,
        penalties: match.penalties,
        timestamp: new Date(match.created_at)
      }));
     // Sécurité : s'assurer que currentUser.id est défini
const userId = gameState.currentUser?.id;

const matchHistoryFiltered = userId
  ? matchHistory.filter(game =>
      game.players.some(player => player.userId === userId)
    ).reverse() // 👈 tri décroissant
  : [];

// Dispatch de l’historique filtré
dispatch({ type: 'SET_MATCH_HISTORY', payload: matchHistoryFiltered });
    } catch (error) {
      console.error('Error loading match history:', error);
    }
  };

  const resetGame = () => {
    dispatch({ type: 'RESET_GAME' });
    navigateTo('auth');
  };

  const startNewGame = () => {
    dispatch({ type: 'START_NEW_GAME' });
  };

  const startRematch = () => {
    dispatch({ type: 'START_REMATCH' });
  };

  const registerUser = async (
    userData: Omit<User, 'id' | 'createdAt' | 'stats' | 'achievements'>
  ): Promise<User> => {
    try {
      const newUser: User = {
        ...userData,
        id: Date.now().toString(),
        createdAt: new Date(),
        lastLoginAt: new Date(),
        stats: createEmptyUserStats(),
        achievements: [],
      };

      const supabaseUser = {
        id: newUser.id,
        email: newUser.email,
        display_name: newUser.displayName,
        profile_picture: newUser.profilePicture ?? null,
        access_code: newUser.accessCode,
        profile_title: newUser.profileTitle ?? 'player',
        stats: newUser.stats,
        created_at: newUser.createdAt.toISOString(),
      };

      const { error } = await supabase.from('users').insert([supabaseUser]);

      if (error) {
        console.error('Supabase insert error:', error.message);
        throw new Error('Failed to insert user in database');
      }

      dispatch({ type: 'REGISTER_USER', payload: newUser });
      return newUser;
    } catch (error) {
      console.error('Error registering user:', error);
      throw new Error('Failed to create account');
    }
  };

  const loginUser = async (email: string, accessCode: string): Promise<User | null> => {
    try {
      const { data: allUsers, error } = await supabase
        .from('users')
        .select('*');

      if (error) throw error;

      const user = allUsers.find(u => u.email === email && u.access_code === accessCode);

      if (user) {
        const formattedUser: User = {
          id: user.id,
          displayName: user.display_name,
          email: user.email,
          profilePicture: user.profile_picture,
          accessCode: user.access_code,
          profileTitle: user.profile_title,
          friends: [],
          createdAt: new Date(user.created_at),
          stats: user.stats || createEmptyUserStats(),
          achievements: [],
          lastLoginAt: new Date()
        };

        dispatch({ type: 'SET_USERS', payload: allUsers.map(u => ({
          id: u.id,
          displayName: u.display_name,
          email: u.email,
          profilePicture: u.profile_picture,
          accessCode: u.access_code,
          profileTitle: u.profile_title,
          friends: [],
          createdAt: new Date(u.created_at),
          stats: u.stats || createEmptyUserStats(),
          achievements: [],
          lastLoginAt: new Date()
        })) });
        
        dispatch({ type: 'LOGIN_USER', payload: formattedUser });
        await loadFriends();
        await loadFriendRequests();
        await loadMatchHistory();
        
        // Store credentials for auto-login
        localStorage.setItem('belote_user_email', email);
        localStorage.setItem('belote_user_access_code', accessCode);
        
        return formattedUser;
      }
      return null;
    } catch (error) {
      console.error('Error logging in:', error);
      return null;
    }
  };

  const autoLogin = async (): Promise<boolean> => {
    try {
      // Check if we have stored user credentials
      const storedEmail = localStorage.getItem('belote_user_email');
      const storedAccessCode = localStorage.getItem('belote_user_access_code');
      
      if (storedEmail && storedAccessCode) {
        const user = await loginUser(storedEmail, storedAccessCode);
        if (user) {
          return true;
        } else {
          // Clear invalid credentials
          localStorage.removeItem('belote_user_email');
          localStorage.removeItem('belote_user_access_code');
        }
      }
      
      return false;
    } catch (error) {
      console.error('Auto-login failed:', error);
      return false;
    }
  };

  const logoutUser = () => {
    // Clear stored credentials
    localStorage.removeItem('belote_user_email');
    localStorage.removeItem('belote_user_access_code');
    
    dispatch({ type: 'LOGOUT_USER' });
    navigateTo('auth');
  };
  // Début de semaine (lundi)
// Début de la semaine (ramène au lundi)
const startOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = dimanche, 1 = lundi...
  const diff = (day === 0 ? -6 : 1) - day; // ramener à lundi
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Début du mois
const startOfMonth = (date: Date): Date => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Comparaison : est-ce que dateA est après dateB ?
const isAfter = (dateA: Date, dateB: Date): boolean => {
  return dateA.getTime() > dateB.getTime();
};


  const searchUsers = async (query: string): Promise<User[]> => {
  if (!query.trim()) return [];

  try {
    const { data: results, error } = await supabase
        .from('users')
        .select('*')
        .or(`noaccent_name.ilike.%${query}%`);
    console.log(results)

    if (error) throw error;

    return (results || []).map(u => ({
      id: u.id,
      displayName: u.display_name,
      email: u.email,
      profilePicture: u.profile_picture,
      accessCode: u.access_code,
      profileTitle: u.profile_title,
      friends: [],
      createdAt: new Date(u.created_at),
      stats: u.stats || createEmptyUserStats(),
      achievements: [],
      lastLoginAt: new Date()
    }));
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};


  const sendFriendRequest = async (userId: string): Promise<void> => {
    if (!gameState.currentUser) throw new Error('Must be logged in');

    try {
      const { error } = await supabase
        .from('friendships')
        .insert([{
          user_id: gameState.currentUser.id,
          friend_id: userId,
          status: 'pending'
        }]);

      if (error) throw error;

      await loadFriendRequests();
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw new Error('Failed to send friend request');
    }
  };

  const acceptFriendRequest = async (requestId: string): Promise<void> => {
    try {
      const request = gameState.friendRequests.find(r => r.id === requestId);
      if (!request) throw new Error('Request not found');

      // Update the request to accepted
      const { error: updateError } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // Create the inverse relationship
      const { data: inverse, error: inverseError } = await supabase
        .from('friendships')
        .select('id')
        .eq('user_id', request.toUserId)
        .eq('friend_id', request.fromUserId)
        .maybeSingle();

      if (inverseError) throw inverseError;

      if (!inverse) {
        const { error: insertError } = await supabase
          .from('friendships')
          .insert([{
            user_id: request.toUserId,
            friend_id: request.fromUserId,
            status: 'accepted',
          }]);

        if (insertError) throw insertError;
      }

      // Reload friends and remove from requests
      await loadFriends();
      dispatch({ type: 'REMOVE_FRIEND_REQUEST', payload: requestId });

    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw new Error('Failed to accept friend request');
    }
  };

  const declineFriendRequest = async (requestId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      dispatch({ type: 'REMOVE_FRIEND_REQUEST', payload: requestId });
    } catch (error) {
      console.error('Error declining friend request:', error);
      throw new Error('Failed to decline friend request');
    }
  };

  const loadFriends = async (): Promise<void> => {
    if (!gameState.currentUser) return;

    try {
      const userId = gameState.currentUser.id;

      const { data: friendships, error } = await supabase
        .from('friendships')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at
        `)
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted');

      if (error) throw error;

      // Get all friend IDs
      const friendIds = friendships.map((f: any) => {
        return f.user_id === userId ? f.friend_id : f.user_id;
      });

      if (friendIds.length === 0) {
        dispatch({ type: 'SET_FRIENDS', payload: [] });
        return;
      }

      // Get friend details
      const { data: friendsData, error: friendsError } = await supabase
        .from('users')
        .select('*')
        .in('id', friendIds);

      if (friendsError) throw friendsError;

      const friends: User[] = (friendsData || []).map(u => ({
        id: u.id,
        displayName: u.display_name,
        email: u.email,
        profilePicture: u.profile_picture,
        accessCode: u.access_code,
        profileTitle: u.profile_title,
        friends: [],
        createdAt: new Date(u.created_at),
        stats: u.stats || createEmptyUserStats(),
        achievements: [],
        lastLoginAt: new Date()
      }));

      dispatch({ type: 'SET_FRIENDS', payload: friends });
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadFriendRequests = async (): Promise<void> => {
    if (!gameState.currentUser) return;

    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('id, user_id, created_at, status')
        .eq('friend_id', gameState.currentUser.id)
        .eq('status', 'pending');

      if (error) throw error;

      const pendingRequests: FriendRequest[] = (data || []).map((req: any) => ({
        id: req.id,
        fromUserId: req.user_id,
        toUserId: gameState.currentUser!.id,
        status: req.status,
        createdAt: new Date(req.created_at),
      }));

      dispatch({ type: 'SET_FRIEND_REQUESTS', payload: pendingRequests });
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const confirmPlayer = async (userId: string, accessCode: string): Promise<boolean> => {
    console.log('Confirming player:', userId, 'with code:', accessCode);
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('User lookup result:', { user, error });

    if (error || !user || user.access_code !== accessCode) {
      console.log('Confirmation failed - wrong code or user not found');
      const updatedConfirmations = gameState.pendingConfirmations.map(conf => 
        conf.userId === userId 
          ? { ...conf, attempts: conf.attempts + 1 }
          : conf
      );
      dispatch({ type: 'SET_PENDING_CONFIRMATIONS', payload: updatedConfirmations });
      return false;
    }

    console.log('Player confirmed successfully');
    dispatch({ type: 'CONFIRM_PLAYER', payload: { userId, confirmed: true } });
    return true;
  };


const getTimeFrameUserRankings = async (
  mode: 'belote' | 'coinche',
  playerCount: 2 | 3 | 4,
  timeframe: 'month' | 'week',
  group: 'all' | 'friends'
): Promise<PlayerRanking[]> => {
  
  try {
    // 1. Charger les users
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, display_name, profile_picture, profile_title');

    if (userError) throw userError;
    let filteredUsers = users || [];

    // 2. Si groupe = "friends", filtrer
    if (group === 'friends') {
      const { data: friendships, error: friendsError } = await supabase
        .from('friendships')
        .select('user_id, friend_id')
        .or(
          `user_id.eq.${gameState.currentUser.id},friend_id.eq.${gameState.currentUser.id}`
        )
        .eq('status', 'accepted');

      if (friendsError) throw friendsError;

      const friendIds = (friendships || []).map(f =>
        f.user_id === gameState.currentUser.id ? f.friend_id : f.user_id
      );
      friendIds.push(gameState.currentUser.id); // inclure soi-même

      filteredUsers = filteredUsers.filter(u => friendIds.includes(u.id));
    }
  
    const { data: matches, error } = await supabase
      .from('match_history')
      .select('id, players, final_scores, winning_team, created_at, settings');

    if (error) throw error;
    if (!matches) return [];

    let startDate: Date;
    const now = new Date();
    if (timeframe === 'week') startDate = startOfWeek(now);
    else if (timeframe === 'month') startDate = startOfMonth(now);
    else startDate = new Date(0);

    const recentMatches = matches.filter(match =>
      isAfter(new Date(match.created_at), startDate)
    );

    const playerMap: Record<string, PlayerStatsForTimeframe> = {};

    recentMatches.forEach(match => {
      match.players.forEach((player: any) => {
        

        if (!playerMap[player.userId]) {
          playerMap[player.userId] = {
            userId: player.userId,
            name: player.name,
            profilePicture: player.profilePicture,
            profileTitle: player.profileTitle,
            games: 0,
            wins: 0,
            totalPoints: 0,
            pointsConceded: 0,
            coinches: 0,
            penalties: 0
          };
        }

        const stats = playerMap[player.userId];
        stats.games += 1;

        if (player.team === match.winning_team) stats.wins += 1;

        const teamKey = player.team === 'A' ? 'teamA' : 'teamB';
const opponentKey = player.team === 'A' ? 'teamB' : 'teamA';

const teamPoints = match.final_scores?.[teamKey] || 0;
const otherTeamPoints = match.final_scores?.[opponentKey] || 0;

        stats.totalPoints += teamPoints;
        stats.pointsConceded += otherTeamPoints;

        // coinches / penalties si tu les as dans ton modèle
        
      });
    });

    const rankings: PlayerRanking[] = Object.entries(playerMap)
      .map(([userId, stats]) => {
        const userInfo = filteredUsers.find(u => u.id === userId);

        const winRate = stats.games > 0 ? (stats.wins / stats.games) * 100 : 0;
        const averagePoints = stats.games > 0 ? stats.totalPoints / stats.games : 0;
        const  ratiopoint = stats.pointsConceded >0 ? stats.totalPoints / stats.pointsConceded : 1
        const gamesWeight = Math.min(0.7 + stats.games/ 60, 1);

        const rankingScore =
          Math.round(gamesWeight*(
          winRate * 2/10 +
          ratiopoint *10 +
          averagePoints/100));
          

        return {
          userId,
          name: stats.name,
          profilePicture: userInfo?.profile_picture || '',
          profileTitle: stats.profileTitle,
          rankingScore,
          gamesPlayed: stats.games,
          winRate,
          averagePoints,
          totalCoinches: stats.coinches,
          pointsConceded: stats.pointsConceded,
          penalties: stats.penalties,
          rank: 0
        };
      })
      .filter(r => r.gamesPlayed >= 2)
      .sort((a, b) => b.rankingScore - a.rankingScore)
      .map((ranking, index) => ({ ...ranking, rank: index + 1 }));

    console.log(`Final ${timeframe} rankings:`, rankings);
    return rankings;
  } catch (error) {
    console.error('Error getting timeframe rankings:', error);
    return [];
  }
};


  const getUserRankings = async (mode: 'belote' | 'coinche', playerCount: 2 | 3 | 4,group: 'world' | 'friends'): Promise<PlayerRanking[]> => {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, display_name, profile_picture, profile_title, stats');

      if (error) throw error;
      let filteredUsers = users || [];

    // 2. Si groupe = "friends", récupérer la liste d'amis
    if (group === 'friends') {
      const { data: friendships, error: friendsError } = await supabase
        .from('friendships')
        .select('user_id, friend_id')
        .or(`user_id.eq.${gameState.currentUser.id},friend_id.eq.${gameState.currentUser.id}`)
        .eq('status', 'accepted');


      if (friendsError) throw friendsError;

      const friendIds = (friendships || []).map(f => f.friend_id);
      // Inclure aussi l'utilisateur lui-même
      friendIds.push(gameState.currentUser.id);

      filteredUsers = filteredUsers.filter(user => friendIds.includes(user.id));
    }


      const modeKey = `${mode}${playerCount}P` as keyof UserStats;
      
      const rankings: PlayerRanking[] = filteredUsers
      .map(user => {
        const stats = user.stats || createEmptyUserStats();
        const modeStats = stats[modeKey] as GameModeStats;
          
          // Debug log to see what stats we're getting
          console.log(`User ${user.display_name} stats for ${modeKey}:`, modeStats);
          
          return {
            userId: user.id,
            name: user.display_name,
            profilePicture: user.profile_picture,
            profileTitle: user.profile_title,
            rankingScore: modeStats.rankingScore,
            gamesPlayed: modeStats.games,
            winRate: modeStats.winRate,
            averagePoints: modeStats.averagePoints,
            totalCoinches: modeStats.coinches,
            pointsConceded: modeStats.pointsConceded,
            penalties: modeStats.penalties,
            rank: 0
          };
        })
        .filter(ranking => ranking.gamesPlayed >= 2) 
        .sort((a, b) => b.rankingScore - a.rankingScore)
        .map((ranking, index) => ({ ...ranking, rank: index + 1 }));

      console.log('Final rankings:', rankings);
      return rankings;
    } catch (error) {
      console.error('Error getting rankings:', error);
      return [];
    }
  };

   const getUserSoftRankings = async (mode: 'belote' | 'coinche', playerCount: 2 | 3 | 4): Promise<PlayerRanking[]> => {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, stats');

      if (error) throw error;

      const modeKey = `${mode}${playerCount}P` as keyof UserStats;
      
      const rankings: PlayerRanking[] = (users || [])
        .map(user => {
          const stats = user.stats || createEmptyUserStats();
          const modeStats = stats[modeKey] as GameModeStats;
          
          // Debug log to see what stats we're getting
          console.log(`User ${user.display_name} stats for ${modeKey}:`, modeStats);
          
          return {
            userId: user.id,
            
            rankingScore: modeStats.rankingScore,
            gamesPlayed: modeStats.games,
            
            rank: 0
          };
        })
        .filter(ranking => ranking.gamesPlayed >= 2) // Minimum 5 games to be ranked
        .sort((a, b) => b.rankingScore - a.rankingScore)
        .map((ranking, index) => ({ ...ranking, rank: index + 1 }));

      console.log('Final rankings:', rankings);
      return rankings;
    } catch (error) {
      console.error('Error getting rankings:', error);
      return [];
    }
  };

  const updateUserStats = async (userId: string, gameData: any): Promise<void> => {
    // This will be handled by updateStatsAfterHand
  };

  const setSelectedUser = (user: User | null) => {
    dispatch({ type: 'SET_SELECTED_USER', payload: user });
  };

  const updateProfileTitle = async (titleId: string): Promise<void> => {
    if (!gameState.currentUser) throw new Error('Must be logged in');

    try {
      const { error } = await supabase
        .from('users')
        .update({ profile_title: titleId })
        .eq('id', gameState.currentUser.id);

      if (error) throw error;

      const updatedUser = { ...gameState.currentUser, profileTitle: titleId };
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    } catch (error) {
      console.error('Error updating profile title:', error);
      throw new Error('Failed to update profile title');
    }
  };

  const updateProfilePicture = async (file: File): Promise<void> => {
  if (!gameState.currentUser) throw new Error('Must be logged in');

  try {
    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${gameState.currentUser.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(fileName);

    // Ajouter automatiquement les paramètres d'optimisation
    const optimizedUrl = `${publicUrl}?width=50&height=50&quality=5&format=webp`;

    console.log('Updating user with id', gameState.currentUser.id);

    // Update user profile
    const { error: updateError } = await supabase
      .from('users')
      .update({ profile_picture: optimizedUrl })
      .eq('id', gameState.currentUser.id);

    if (updateError) throw updateError;

    // Mettre à jour le state local
    const updatedUser = { ...gameState.currentUser, profilePicture: optimizedUrl };
    dispatch({ type: 'UPDATE_USER', payload: updatedUser });
  } catch (error) {
    console.error('Error updating profile picture:', error);
    throw new Error('Failed to update profile picture');
  }
};


  const checkAchievements = async (userId: string): Promise<Achievement[]> => {
    // Implementation for checking achievements
    return [];
  };

  const applyPenaltyToPlayer = (playerId: string, points: number, reason?: string) => {
    dispatch({ type: 'APPLY_PENALTY', payload: { playerId, points, reason } });
  };

  const showPlayerConfirmationModal = () => {
    dispatch({ type: 'SHOW_PLAYER_CONFIRMATION' });
  };

  const hidePlayerConfirmationModal = () => {
    dispatch({ type: 'HIDE_PLAYER_CONFIRMATION' });
  };

  return (
    <GameContext.Provider value={{
      gameState,
      currentScreen,
      setCurrentScreen,
      screenHistory,
      setScreenHistory,
      goBack,
      navigateTo,
      updateHand,
      setPlayers,
      setGameSettings,
      addHand,
      resetGame,
      startNewGame,
      startRematch,
      registerUser,
      loginUser,
      logoutUser,
      searchUsers,
      sendFriendRequest,
      acceptFriendRequest,
      declineFriendRequest,
      loadFriends,
      loadFriendRequests,
      confirmPlayer,
      getUserRankings,
      getUserSoftRankings,
      getTimeFrameUserRankings,
      updateUserStats,
      setSelectedUser,
      updateProfileTitle,
      updateProfilePicture,
      checkAchievements,
      applyPenaltyToPlayer,
      autoLogin,
      showPlayerConfirmationModal,
      hidePlayerConfirmationModal,
      saveGameToSupabase,
      loadMatchHistory,
      setDealer,
      nextDealer
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}