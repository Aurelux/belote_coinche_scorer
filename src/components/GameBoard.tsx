import React, { useState, useEffect,useRef} from 'react';
import { HelpCircle,ArrowLeft, BarChart2, RotateCcw, Trophy, Plus, History, RefreshCw, Skull, User, Settings, TurtleIcon} from 'lucide-react';
import {  useGame} from '../context/useGame';
import { ScoreEntry } from './ScoreEntry';
import { CapotCelebration } from './CapotCelebration';
import { CoincheSuccessAnimation } from './CoincheSuccessAnimation';
import { SurcoincheSuccessAnimation } from './SurcoincheSuccessAnimation';
import { PlayerConfirmationModal } from './PlayerConfirmationModal';
import { PenaltyModal } from './PenaltyModal';
import DealerSelector from "../components/DealerSelector";
import {availableFrames,Player } from '../types/game';
import { type EloMap } from '../components/EloPlayer';
import { supabase } from '../lib/supabase';


export function GameBoard() {
  const { gameState, setGameState,setCurrentScreen, getNextDealerIndex,startNewGame, resetGame, startRematch,navigateTo2, applyPenaltyToPlayer, navigateTo, goBack, nextDealer, setDealer} = useGame();
  const [editedHand, setEditedHand] = useState<Hand | null>(null);
  const [showScoreEntry, setShowScoreEntry] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationTeam, setCelebrationTeam] = useState<'A' | 'B' | 'C'>('A');
  const [showCoincheSuccess, setShowCoincheSuccess] = useState(false);
  const [showSurcoincheSuccess, setShowSurcoincheSuccess] = useState(false);
  const [celebrationPlayer, setCelebrationPlayer] = useState('');
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<'A' | 'B' | 'C'>('A');
  const [showExitGameModal, setShowExitGameModal] = useState(false);
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
const [playerOrder, setPlayerOrder] = useState(gameState.players.map(p => p.id));
const [maxScore, setMaxScore] = useState(gameState.settings.targetScore);
const [atoutMode, setAtoutMode] = useState(gameState.settings.withAnnouncements);
const [playerTeams, setPlayerTeams] = useState(() => {
  return gameState.players.map((p, i) => (i < 2 ? "A" : "B"));
});
const [keepTeams, setKeepTeams] = useState<boolean>(false);  // par défaut on garde les équipes
const [changeTeams, setChangeTeams] = useState<boolean>(false); // par défaut, changement d'équipe non sélectionné
const [playersWithElo, setPlayersWithElo] = useState<Player[]>([]);
const [histStreak, setHistStreak] = useState<
  { userId: string; streak: number }[]
>([]);

const [TotGames, setTotGames] = useState<
  { userId: string; games: number }[]
>([]);

const [loadingElo, setLoadingElo] = useState(true);
const [eloUpdated, setEloUpdated] = useState(false);
const [eloLoading, setEloLoading] = useState(false);
const [fakeDelta, setFakeDelta] = useState(0);
const [reelDelta, setReelDelta] = useState<
  { user_id: string; delta: number }[]
>([]);
useEffect(() => {
  async function loadElo() {
    if (!gameState.players.length) return;

    setLoadingElo(true);

    const userIds = gameState.players
      .map(p => p.userId)
      .filter(Boolean);

    if (userIds.length === 0) {
      setPlayersWithElo(gameState.players);
      setLoadingElo(false);
      return;
    }

    const modeKey =
      gameState.settings.mode +
      gameState.settings.playerCount +
      "P";

    const { data, error } = await supabase
      .from("users")
      .select("id, elo")
      .in("id", userIds);

    const { data: data_game, error_game} = await supabase
  .from("users")
  .select("id, stats")
  .in("id", userIds);
    const gamesByUser = data_game?.map((user) => {
  const stats = user.stats;

  const games =
    stats?.[modeKey]?.games ?? 0;

  return {
    userId: user.id,
    games
  };
});

setTotGames(gamesByUser)
    

    if (error) {
      console.error(error);
      setPlayersWithElo(gameState.players);
      setLoadingElo(false);
      return;
    }
    const { data: data_hist, error2 } = await supabase
  .from("match_history")
  .select(`
    created_at,
    winning_team,
    players
  `)
  .order("created_at", { ascending: false })
  .limit(200);
  if (error2) {
  console.error(error2);
  return;
}

// userIds = tableau des userId à analyser
// ex : ["1753617551516", "1752141690685"]
const histByUser = userIds.filter((userId): userId is string => !!userId).map((userId) => {
  const matches = data_hist
    ?.filter(match =>
      match.players?.some((p: any) => p.userId === userId)
    )
    .slice(0, 10);

  return {
    userId,
    matches: matches ?? []
  };
});
const streaks = histByUser.map(({ userId, matches }) => {
  if (!matches.length) {
    return {
      userId,
      streak: 0
    };
  }

  let streak = 0;

  for (const match of matches) {
    const player = match.players.find(
      (p: any) => p.userId === userId
    );

    if (!player) continue;
    const won = player.team === match.winning_team;
    if (streak === 0) {
      streak = won ? 1 : -1;
      continue;
    }

    if (won && streak > 0) {
      streak++;
    } else if (!won && streak < 0) {
      streak--;
    } else {
      break;
    }
  }

  return {
    userId,
    streak
  };
});
setHistStreak(streaks);

    const eloMap = new Map(
      (data ?? []).map(u => [
        u.id,
        u.elo?.[modeKey] ?? 1000,
      ])
    );

    const enriched = gameState.players.map(p => ({
      ...p,
      eloSnapshot: eloMap.get(p.userId) ?? 1000,
    }));

    const { data: datadelta, error: errordelta } = await supabase
  .rpc("get_latest_elo_history");

if (errordelta) {
  console.error(errordelta);
  return;
}

// ids des joueurs de la game
const playerIds = new Set(gameState.players.map(p => p.userId));

// on garde uniquement ceux de la game
const real_deltas = (datadelta ?? [])
  .filter(row => playerIds.has(row.user_id))
  .map(row => ({
    user_id: row.user_id,
    delta: row.delta,
  }));

setReelDelta(real_deltas);

    setPlayersWithElo(enriched);
    setLoadingElo(false);

  }

  loadElo();
}, [gameState.players, gameState.settings.mode, gameState.settings.playerCount, gameState.gameEnded,eloUpdated]);
console.log(eloUpdated)
console.log(reelDelta)
const WARNING_GAP = gameState.settings.playerCount === 3 ? 150 : 225;
console.log(TotGames)
const teamsScores = [
  gameState.teamAScore,
  gameState.teamBScore,
  gameState.teamCScore,
].filter((score): score is number => typeof score === "number");


const isNearGameEnd = teamsScores.some(
  (score) =>
    gameState.settings.targetScore - score <= WARNING_GAP &&
    score < gameState.settings.targetScore
);
const saveSettings = () => {
  setGameState({
    ...gameState,

    players: gameState.players
  .map((p, i) => ({
    ...p,
    team: playerTeams[i] as 'A' | 'B', // équipe A ou B
  }))
  .sort((a, b) => {
    if (a.team === "A" && b.team === "B") return -1; // A avant B
    if (a.team === "B" && b.team === "A") return 1;  // B après A
    return 0; // sinon garde l'ordre
  }),

    settings: {
      ...gameState.settings,
      targetScore: maxScore,
      withAnnouncements: atoutMode,
    },
  });
};


const updatePlayerTeam = (playerIndex, newTeam) => {
  const updatedTeams = [...playerTeams];
  updatedTeams[playerIndex] = newTeam;

  // On sépare les joueurs A puis B
  const teamA = [];
  const teamB = [];

  gameState.players.forEach((p, i) => {
    if (updatedTeams[i] === "A") teamA.push(p);
    else teamB.push(p);
  });

  // Réorganisation : A1 - B1 - A2 - B2
  const reordered = [];
  for (let i = 0; i < 2; i++) {
    if (teamA[i]) reordered.push(teamA[i]);
    if (teamB[i]) reordered.push(teamB[i]);
  }

  // Mise à jour finale
  setPlayerTeams(updatedTeams);
 // << ta fonction pour mettre à jour gameState.players
};








  if (!gameState.players.length) {
    return null;
  }

  const currentDealer = gameState.currentDealer !== null ? gameState.players[gameState.currentDealer] 
  : null;
 
  const teamAPlayers = playersWithElo.filter(p => p.team === 'A');
  const teamBPlayers = playersWithElo.filter(p => p.team === 'B');
  const teamCPlayers = playersWithElo.filter(p => p.team === 'C');

  

  // si aucun dealer choisi encore → affiche la popup
  if (currentDealer === null) {
    return (
      <DealerSelector
  players={gameState.players.map(p => p.name)}
  onSelect={setDealer}
/>
    );
  }
 const currentStart = gameState.currentDealer !== null 
  ? gameState.players[getNextDealerIndex(gameState.currentDealer,gameState.players.length)] 
  : null;
  const handleEditHand = (hand: Hand) => {
  setEditedHand(hand);
  setShowScoreEntry(true);
};

  const handleScoreSubmit = (data: any) => {
    console.log('Score submitted:', data);
    
    if (data.isCapot) {
      setCelebrationTeam(data.winningTeam);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    } else if (data.isCoincheSuccessful && data.coincher) {
      const coincher = gameState.players.find(p => p.id === data.coincher);
      setCelebrationPlayer(coincher?.name || '');
      setShowCoincheSuccess(true);
    } else if (data.isSurcoincheSuccessful && data.surcoincher) {
      const surcoincher = gameState.players.find(p => p.id === data.surcoincher);
      setCelebrationPlayer(surcoincher?.name || '');
      setShowSurcoincheSuccess(true);
    }
    setShowScoreEntry(false);
  };

  const handlePenaltyClick = (team: 'A' | 'B' | 'C') => {
    setSelectedTeam(team);
    setShowPenaltyModal(true);
  };

  const handlePenaltySubmit = (playerId: string, points: number, reason?: string) => {
    applyPenaltyToPlayer(playerId, points, reason);
    setShowPenaltyModal(false);
  };

  const progressA = (gameState.teamAScore / gameState.settings.targetScore) * 100;
  const progressB = (gameState.teamBScore / gameState.settings.targetScore) * 100;
  const progressC = (gameState.teamCScore / gameState.settings.targetScore) * 100;
  console.log(gameState.settings.matchId)
 const getSuitDisplay = (suit: string) => {
  const suits: Record<string, string> = {
    hearts: '♥️',
    diamonds: '♦️',
    clubs: '♣️',
    spades: '♠️',
  };

  // Si l'annonce est triée, on ajoute TA/SA
  if (gameState.settings.withAnnouncements) {
    suits['no-trump'] = 'SA';
    suits['all-trump'] = 'TA';
  }

  return suits[suit as keyof typeof suits] || suit;
};


  const getTeamColor = (team: 'A' | 'B' | 'C') => {
    const colors = {
      A: 'blue',
      B: 'red',
      C: 'green'
    };
    return colors[team];
  };

  const renderTeamCard = (team: 'A' | 'B' | 'C', players: any[], score: number, progress: number) => {
    const teamColor = getTeamColor(team);
    const isTeam = gameState.settings.playerCount === 4;
  type EloEstimate = Record<
  string,
  {
    winDelta: number;
    loseDelta: number;
    finalDelta?: number;
    Kfactor : number;
    Multiplier : number;
    Expected : number;
    Perfomance : number
  }
>;

function getReliableElo(
  elo: number | {},
  games: number,
  avg : number
) {
  const confidence =
    Math.min(games / 48, 1);

  return (
    avg +
    (elo - avg) * confidence
  );
}
function estimateEloDeltas(
  players: Player[],
  winningTeam: 'A' | 'B' | 'C' | undefined,
  teamAScore: number,
  teamBScore: number,
  hands: any[],
): EloEstimate {
  
  const result: EloEstimate = {};
  

  const registered = playersWithElo
  console.log('regist',registered)
  if (registered.length < 2) return result;

  const teamA = registered.filter(p => p.team === 'A');
  const teamB = registered.filter(p => p.team === 'B');

  if (!teamA.length || !teamB.length) return result;

  

  // ───────────────────────────────────────
  // BASE ELO
  // ───────────────────────────────────────
const validPlayers = registered.filter(p => p.userId);

const avg =
  validPlayers.length > 0
    ? (validPlayers.reduce((sum, p) => sum + (p.eloSnapshot), 0) /
      validPlayers.length)- 100
    : 1000;
const avgA =
  teamA.reduce((s, p) => {

    const games =
      TotGames.find(g => g.userId === p.userId)
        ?.games ?? 0;

    const reliableElo =
      getReliableElo(
        p.eloSnapshot ?? 1000,
        games,
        avg
      );

    return s + reliableElo;

  }, 0) / teamA.length;
  console.log('avgA:',avgA)

  const avgB =
  teamB.reduce((s, p) => {

    const games =
      TotGames.find(g => g.userId === p.userId)
        ?.games ?? 0;

    const reliableElo =
      getReliableElo(
        p.eloSnapshot ?? 1000,
        games,
        avg
      );
      


    return s + reliableElo;

  }, 0) / teamB.length;
  console.log('avgB:',avgB)


  // ───────────────────────────────────────
  // TRACKING PAR JOUEUR
  // ───────────────────────────────────────
  const perf: Record<string, any> = {};

  for (const p of registered) {
    perf[p.id] = {
      impact: 0,
      risk: 0,
      conceded: 0,
      clutch: 0,
      failedContracts: 0,
      successfulContracts: 0,
      coinches: 0,
      successfulCoinches: 0,
      surcoinches: 0,
      capots: 0,
      announcements: 0,
      totalPointsWon: 0,
      totalPointsLost: 0,
    };
  }

  // ───────────────────────────────────────
  // ANALYSE DES MAINS
  // ───────────────────────────────────────
  for (const hand of hands) {

    const takerId = hand.taker;
    const bidhand = hand.bid.value;

    const taker = players.find(p => p.id === takerId);
    

    const takerTeam = taker.team;
    const defenders = registered.filter(
  p =>
    p.team !== takerTeam
);

// partage des points entre défenseurs

    if (!taker) continue;
    const takerWon = hand.contractFulfilled;

    const handWinnerTeam =
      hand.teamAScore > hand.teamBScore
        ? 'A'
        : 'B';

    const handLoserTeam =
      handWinnerTeam === 'A'
        ? 'B'
        : 'A';

    const winningPoints =
      Math.max(hand.teamAScore, hand.teamBScore);

    const losingPoints =
      Math.min(hand.teamAScore, hand.teamBScore);
    console.log(hand)

      

    const pointGap =
      winningPoints - losingPoints;

    // ─────────────────────────────
    // PRENEUR
    // ─────────────────────────────
    if (perf[takerId] &&  hand.surcoincher == undefined && hand.coincher == undefined) {

      perf[takerId].risk += (hand.bid?.value ?? 80) / 110;

      if (takerWon) {

        perf[takerId].impact += 1.2;
        perf[takerId].successfulContracts += 1;

        perf[takerId].totalPointsWon += winningPoints;

        // gros contrat réussi
        perf[takerId].clutch +=
          Math.max((hand.bid?.value ?? 80) - 120, 0) / 70;
        const sharedLoss =
  losingPoints / defenders.length;
         defenders.forEach(def => {

      if (!perf[def.id]) return;

      perf[def.id].totalPointsWon += sharedLoss;

  });

      } else {

        perf[takerId].impact -= 1.1;
        perf[takerId].failedContracts += 1;

        perf[takerId].conceded += winningPoints;

        perf[takerId].totalPointsLost += winningPoints;

        // grosse annonce ratée
        perf[takerId].clutch -=
          Math.max((hand.bid?.value ?? 80) - 120, 0) / 80;
        const sharedLoss =
  winningPoints / defenders.length;
         defenders.forEach(def => {

      if (!perf[def.id]) return;

      perf[def.id].totalPointsWon += sharedLoss;

  });
      }
    }

    // ─────────────────────────────
    // COINCHE
    // ─────────────────────────────
    if (hand.coincher && perf[hand.coincher] && hand.surcoincher == undefined) {

      perf[hand.coincher].coinches += 1;

      const coincher = players.find(
        p => p.id === hand.coincher
      );

      const successful =
        hand.isCoincheSuccessful;

      if (successful) {

        perf[hand.coincher].successfulCoinches += 1;
        
        perf[hand.coincher].impact += 1.6;

        perf[hand.coincher].clutch +=
          Math.max(-(hand.bid?.value ?? 80) +120, 0) / 60;

        perf[hand.coincher].totalPointsWon +=
          winningPoints;

        perf[takerId].impact -= 1.9;
        perf[takerId].failedContracts += 1;

        perf[takerId].conceded += winningPoints;

        perf[takerId].totalPointsLost += winningPoints;


      } else {

        perf[hand.coincher].impact -= 1.4;
        perf[hand.coincher].failedContracts += 1;
        perf[hand.coincher].conceded +=
          winningPoints ;

        perf[takerId].impact += 1.8;
        perf[takerId].successfulContracts += 1;

        perf[takerId].totalPointsWon += winningPoints;

        // gros contrat réussi
        perf[takerId].clutch +=
          Math.max((hand.bid?.value ?? 80) - 120, 0) / 60;
      }
    }

    // ─────────────────────────────
    // SURCOINCHE
    // ─────────────────────────────
    if (hand.surcoincher && perf[hand.surcoincher]) {

      perf[hand.surcoincher].surcoinches += 1;

      if (hand.isSurcoincheSuccessful) {

        perf[hand.surcoincher].impact += 2.2;
        perf[hand.surcoincher].successfulContracts += 1;
        perf[hand.surcoincher].clutch += 0.8;

        perf[hand.surcoincher].totalPointsWon +=
          winningPoints;

        perf[hand.coincher].impact -= 2.0;
        perf[hand.coincher].failedContracts += 1;

        perf[hand.coincher].conceded += winningPoints;

        perf[hand.coincher].totalPointsLost += winningPoints;
        if (!takerId==hand.surcoincher){
          perf[takerId].impact += 1.3;
        perf[takerId].successfulContracts += 1;
        perf[takerId].clutch += 0.5;
        }


      } else {

        perf[hand.surcoincher].impact -= 1.9;
        perf[hand.surcoincher].conceded += winningPoints;
        perf[hand.surcoincher].totalPointsLost +=
          winningPoints;
          perf[hand.surcoincher].failedContracts += 1;

        perf[hand.coincher].impact += 2.0;
        perf[hand.coincher].successfulContracts += 1;

        perf[hand.coincher].clutch += 0.8;

        perf[hand.coincher].totalPointsWon += winningPoints;
      }
    }

    // ─────────────────────────────
    // CAPOT
    // ─────────────────────────────
    if (hand.isCapot) {

      registered
        .filter(p => p.team === handWinnerTeam)
        .forEach(p => {
          perf[p.id].capots += 1;
          perf[p.id].impact += 0.5;
          perf[p.id].totalPointsWon += 75;
        });

      registered
        .filter(p => p.team === handLoserTeam)
        .forEach(p => {
          perf[p.id].conceded += 75;
        });
    }

    // ─────────────────────────────
    // ANNONCES
    // ─────────────────────────────
    

    // ─────────────────────────────
    // DOMINATION DE MAIN
    // ─────────────────────────────
  
  }
  console.log(perf)

  // ───────────────────────────────────────
  // CALCUL FINAL
  // ───────────────────────────────────────
  for (const player of registered) {
    const elo = player.eloSnapshot ?? 1000;
    const isTeamA = player.team === 'A';
    const streakData = histStreak.find(s => s.userId === player.userId);

    const streak = streakData?.streak ?? 0;
    let streakFactorplus = 1;
    let streakFactorminus = 1;

if (streak > 0) {
  streakFactorplus += Math.min(streak * 0.05, 0.35);
  streakFactorminus -= Math.min(streak * 0.05, 0.35);
}

if (streak < 0) {
  streakFactorplus -= Math.min(Math.abs(streak) * 0.05, 0.35);
  streakFactorminus += Math.min(Math.abs(streak) * 0.05, 0.35);

}

const expected =
  isTeamA
    ? 1 / (1 + Math.pow(10, (-elo + avgB) / 1100))
    : 1 / (1 + Math.pow(10, (-elo + avgA) / 1100))
    const isWinner =
      winningTeam
        ? player.team === winningTeam
        : undefined;

    

    // ─────────────────────────────
    // K FACTOR
    // ─────────────────────────────
    const games =
      TotGames.find(g => g.userId === player.userId)
        ?.games ?? 0;
    const ratio_game = 2- Math.min(games/10,1)
    let k = 28;

    if (elo < 1200) k = 0.75*38*ratio_game;
    else if (elo < 1500) k = 0.83*30*ratio_game;
    else if (elo < 1900) k = 0.88*24*ratio_game;
    else if (elo < 2300) k = 0.98*18*ratio_game;
    else k = 14;

    const p = perf[player.id];
    // ─────────────────────────────
    // IMPACT SCORE
    // ─────────────────────────────
    let impactMultiplier = 1;

    impactMultiplier += p.impact * 0.06;

    impactMultiplier += p.clutch * 0.09;

    impactMultiplier += p.successfulContracts * 0.06;

    impactMultiplier += p.successfulCoinches * 0.08;

    impactMultiplier += p.capots * 0.12;

    // risque récompensé
    impactMultiplier += p.risk * 0.03;

    // énormes points gagnés
    impactMultiplier +=
      Math.min(p.totalPointsWon / 2000, 0.6);

    // énormes points concédés
    impactMultiplier -=
      Math.min(p.conceded / 1000, 0.8);

    // gros fail
    impactMultiplier -=
      p.failedContracts * 0.09;

    // clamp
    const inMin = 0.25;
const inMax = 2.7;

const outMin = 0.5;
const outMax = 2.1;

const clamped = Math.max(inMin, Math.min(impactMultiplier, inMax));

impactMultiplier =
  outMin +
  (outMax - outMin) *
    ((clamped - inMin) / (inMax - inMin));
    // ─────────────────────────────
    // BONUS UPSET
    // ─────────────────────────────
    if (isWinner && expected < 0.35) {
      impactMultiplier += 0.15;
    }

    if (isWinner === false && expected > 0.7) {
      impactMultiplier += 0.13;
    }

    // ─────────────────────────────
    // DELTA FINAL
    // ─────────────────────────────

    const performanceScore =
  p.impact * 0.08 +
  p.clutch * 0.12 +
  p.successfulContracts * 0.1 +
  p.successfulCoinches * 0.08 +
  p.capots * 0.2 -
  p.failedContracts * 0.25 +
  Math.min(p.totalPointsWon / 2000, 1)-
  Math.min(p.conceded / 1000, 1);

// compression [-1..1]
const normalizedPerf = Math.tanh(performanceScore);

// facteur asymétrique
const perfFactor =
  0.7 + (normalizedPerf + 1) * 0.3;
console.log(perfFactor)
// séparation gain / perte NON symétrique
const winDeltaRaw =Math.max(Math.min(
  k *
  (1.5 - expected) *
  impactMultiplier *
  perfFactor *
  streakFactorplus,2*k),5);

// perte moins punitive si bonne perf
const test = 1 + (1.2-impactMultiplier)/2.6
const loseDeltaRaw =Math.min(Math.max(
  k *
  (-0.5 - expected) *
  test *
  (2 - perfFactor)*streakFactorminus,-2*k),-5); // 👈 clé du système

if (isWinner === undefined) {

  result[player.userId ?? player.id] = {
    winDelta: Math.round(0.7*winDeltaRaw),
    loseDelta: Math.round(0.7*loseDeltaRaw),
    Kfactor : k,
    Multiplier : impactMultiplier,
    Expected : expected, 
    Perfomance : perfFactor
  };

} else {

  const actual = isWinner ? 1 : 0;
  
  const finalDelta = actual == 0 ? Math.round(0.7*loseDeltaRaw) : Math.round(0.7*winDeltaRaw)
    
  

  result[player.userId ?? player.id] = {
    winDelta: Math.round(0.7*winDeltaRaw),
    loseDelta: Math.round(0.7*loseDeltaRaw),
    finalDelta,
    Kfactor : k,
    Multiplier : impactMultiplier,
    Expected : expected, 
    Perfomance : perfFactor

  };
}
  }
  
  return result;
}


const eloDeltas = estimateEloDeltas(
  gameState.players,
  gameState.gameEnded ? gameState.winningTeam : undefined,
  gameState.teamAScore, gameState.teamBScore,
  gameState.hands,
);
console.log(eloDeltas)
async function calculateAndUpdateElo(
  supabase: any,
  eloDeltas : EloEstimate
): Promise<string> {

  // ─────────────────────────────────────
  // 1. Calcul des deltas
  // ─────────────────────────────────────
  const deltas = eloDeltas;
  const modeKey = gameState.settings.mode + gameState.settings.playerCount + 'P'
  const ELO_DEFAULT = 1000
  const ELO_FLOOR = 0
  // ─────────────────────────────────────
  // 2. Update DB
  // ─────────────────────────────────────
  for (const [userId, delta] of Object.entries(deltas)) {

    try {

      // ─────────────────────────────
      // USER DATA
      // ─────────────────────────────
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("elo")
        .eq("id", userId)
        .single();

      if (userError) {
        console.error("[ELO] User fetch error:", userError);
        continue;
      }
      
      // ─────────────────────────────
      // CURRENT ELO MAP
      // ─────────────────────────────
      const currentEloMap: EloMap =
        userData?.elo ?? {
          coinche4P: ELO_DEFAULT,
          coinche3P: ELO_DEFAULT,
          coinche2P: ELO_DEFAULT,
          belote4P: ELO_DEFAULT,
          belote3P: ELO_DEFAULT,
          belote2P: ELO_DEFAULT,
        };

      // ─────────────────────────────
      // BEFORE / AFTER
      // ─────────────────────────────
      const eloBefore =
        currentEloMap[modeKey] ?? ELO_DEFAULT;

      const eloAfter = Math.max(
        ELO_FLOOR,
        eloBefore + delta.finalDelta
      );

      const realDelta =
        eloAfter - eloBefore;

      // ─────────────────────────────
      // UPDATED MAP
      // ─────────────────────────────
      

      // ─────────────────────────────
      // ELO HISTORY INSERT
      // ─────────────────────────────
      
      const { error: historyError } = await supabase
  .from("elo_history")
  .upsert({
    user_id: userId,
    match_id:
      gameState.settings.matchId,

    game_mode: modeKey,

    elo_before: eloBefore,
    elo_after: eloAfter,
    delta: realDelta,

    won: delta.finalDelta > 0,

    k_factor: delta.Kfactor ?? null,
    multiplier: delta.Multiplier ?? 1,

    events: [],

    created_at: new Date().toISOString(),
  });
      if (historyError) {
  console.error("[ELO] History insert error:", historyError);
  break; // ⛔ IMPORTANT: stop pour CE joueur
}
const updatedEloMap: EloMap = {
        ...currentEloMap,
        [modeKey]: eloAfter,
      };

      // ─────────────────────────────
      // UPDATE USER ELO
      // ─────────────────────────────
  if (!historyError){
      const { error: updateError } = await supabase
        .from("users")
        .update({
          elo: updatedEloMap,
        })
        .eq("id", userId);

      if (updateError) {
        console.error("[ELO] Update error:", updateError);
        continue;
      }
  }

    } catch (err) {

      console.error(
        `[ELO] Fatal update error for ${userId}:`,
        err
      );
    }
  
  }

  return 'Intégration Delta terminee';
}
const termine = gameState.gameEnded
if (termine && !eloUpdated &&!eloLoading) {
  setEloLoading(true)
  calculateAndUpdateElo(supabase,eloDeltas)
  
  
  setTimeout(() => {
  setEloLoading(false);
  setEloUpdated(true) 
}, 2000)}





    
    return (
      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h2 className={`text-lg sm:text-xl font-bold text-${teamColor}-600`}>
              {isTeam ? `Équipe ${team}` : `Joueur ${team}`}
            </h2>
            <button
              onClick={() => handlePenaltyClick(team)}
              className={`p-2 rounded-lg bg-${teamColor}-100 hover:bg-${teamColor}-200 transition-colors`}
              title="Appliquer une pénalité"
            >
              <Skull className={`w-5 h-5 text-${teamColor}-600`} />
            </button>
          </div>
          <div className={`text-2xl sm:text-3xl font-bold text-${teamColor}-600`}>{score}</div>
        </div>
        
        <div className="space-y-2 mb-4">
  {players.map(player => {
    const delta = eloDeltas[player.userId];
    const hasElo = !player.isGuest && player.eloSnapshot !== undefined;
    const isWinner =
      gameState.gameEnded && gameState.winningTeam === player.team;
    const isLoser =
      gameState.gameEnded &&
      gameState.winningTeam &&
      gameState.winningTeam !== player.team;

    return (
      <div key={player.id} className="flex items-center space-x-2">
        <div
          className={`w-2 h-2 bg-${teamColor}-500 rounded-full flex-shrink-0`}
        ></div>

        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {/* Avatar */}
          <div className="relative w-6 h-6">
            {player.profilePicture ? (
              <img
                src={player.profilePicture}
                alt={player.name}
                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}

            {player.frames && (
              <img
                src={availableFrames[Number(player.frames) - 1]?.image}
                alt="Cadre décoratif"
                className="absolute -inset-0 w-auto h-auto pointer-events-none"
                style={{
                  transform: `scale(${
                    availableFrames[Number(player.frames) - 1]?.scale || 1
                  })`,
                }}
              />
            )}
          </div>

          {/* Nom */}
          <span className="text-gray-700 text-sm sm:text-base truncate">
            {player.name.slice(0,10)}
          </span>

          {/* Badges */}
          {currentDealer && player.id === currentDealer.id && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full whitespace-nowrap">
              D
            </span>
          )}

          {currentStart && player.id === currentStart.id && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full whitespace-nowrap">
              C
            </span>
          )}
        </div>

        {/* ÉLO */}
        {/* ÉLO */}
{hasElo && delta !== undefined && (() => {

  const streak =
    histStreak.find(s => s.userId === player.userId)
      ?.streak ?? 0;

  const gamesPlayed =
    TotGames.find(g => g.userId === player.userId)
      ?.games ?? 0;

  const placementGames = gamesPlayed < 4;
 
  
  return (
    <div
      className="flex items-center justify-between flex-shrink-0 gap-4 px-3 py-2 rounded-xl border"
style={{
  background: "rgba(15, 17, 23, 0.06)",   // un peu plus teinté (gris/bleuté léger)
  borderColor: "rgba(15, 17, 23, 0.18)",  // bordure plus visible
  borderWidth: "1px",
  minWidth: 165,
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
}}
    >
      {/* ───── LEFT : ELO ───── */}
      <div className="flex flex-col leading-none gap-1">
        <span className="text-[9px] text-gray-400 uppercase tracking-[0.15em]">
          Elo
        </span>

       <div className="flex items-center gap-2">
  <span
    className="text-sm font-bold tabular-nums transition-all"
    style={{
      color:
        gameState.gameEnded && delta
          ? (delta.finalDelta ?? 0) >= 0
            ? "#166534" // vert foncé
            : "#991b1b" // rouge foncé
          : "#0649cf",

      filter: placementGames
  ? "blur(3px)"
  : eloLoading
  ? "blur(1.8px) invert(0.85) brightness(0.65) saturate(1.3) contrast(1.1)"
  : "none",
      transition: eloLoading ? "filter 1.5s ease" : "none",

      opacity: placementGames
        ? 0.7
        : 1,
    }}
  >
    {gameState.gameEnded && delta 
      ?  (player.eloSnapshot ?? 1000) 
      : player.eloSnapshot ?? 1000}
  </span>

          {/* ───── STREAK ───── */}
          {Math.abs(streak) > 1 && (
            <span
              className="text-[10px] px-1.5 py-[2px] rounded-md font-semibold tabular-nums"
              style={{
                background:
                  streak > 0
                    ? "rgba(34,197,94,0.10)"
                    : "rgba(239,68,68,0.10)",
                color:
                  streak > 0
                    ? "#22c55e"
                    : "#ef4444",
                border:
                  streak > 0
                    ? "1px solid rgba(34,197,94,0.18)"
                    : "1px solid rgba(239,68,68,0.18)",
              }}
            >
              {streak > 0 ? "X" : "X"}
              {Math.abs(streak)}
            </span>
          )}
        </div>
      </div>

      {/* ───── RIGHT : DELTAS ───── */}
      {placementGames ? (
        <div className="flex flex-col items-end leading-none">
          <span className="text-[9px] text-gray-400 uppercase tracking-[0.15em]">
            Placement
          </span>

          <span
            className="text-sm font-semibold tabular-nums"
            style={{ color: "#d1d5db" }}
          >
            {gamesPlayed}/4
          </span>
        </div>
      ) : gameState.gameEnded ? (
        <div className="flex flex-col items-end leading-none">
          <span className="text-[9px] text-gray-400 uppercase tracking-[0.15em]">
            Delta
          </span>

          <span
            className="text-sm font-bold tabular-nums"
            style={{
              color:
                (delta.finalDelta ?? 0) >= 0
                  ? "#22c55e"
                  : "#ef4444",
            }}
          >
            {(delta.finalDelta ?? 0) >= 0 ? "+" : ""}
            {reelDelta.find(d => d.user_id === player.userId)?.delta}
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-end leading-none">
          <span className="text-[9px] text-gray-400 uppercase tracking-[0.15em]">
            Win / Lose
          </span>

          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-green-500 tabular-nums">
              +{delta.winDelta}
            </span>

            <span className="text-[11px] text-red-400 tabular-nums">
              {delta.loseDelta}
            </span>
          </div>
        </div>
      )}
    </div>
  );
})()}
      </div>
    );
  })}
</div>

        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 bg-${teamColor}-600`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="min-h-screen pt-safe pb-safe flex items-center justify-center p-4"

     style={{

       backgroundColor: '#042204', // vert très foncé

       backgroundImage: `
          radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px),
          radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)
        `,

       backgroundPosition: '0 0, 10px 10px',

       backgroundSize: '20px 20px'

     }}

>

        <div className="w-full mx-auto px-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] relative" style={{ top: 'calc(1.5rem + env(safe-area-inset-top))' }}>
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">

              <div className="flex items-center space-x-4">
                <button
      onClick={() => setShowExitGameModal(true)} // ouvre directement le modal
      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
    >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                {showExitGameModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl shadow-xl p-6 w-11/12 max-w-md text-center">
      <h2 className="text-lg font-semibold mb-4">Quitter la partie ?</h2>

      {gameState?.settings?.isTournament ? (
        <p className="mb-6 text-gray-700">
          ⚠️ Attention, vous êtes en match de tournoi.<br />
          Si vous quittez maintenant, vous <strong>ne pourrez pas relancer cette partie</strong>.<br />
          Ce sera à <strong>l’organisateur</strong> de rentrer vos scores sur son application.
        </p>
      ) : (
        <p className="mb-6 text-gray-700">
          Si vous quittez maintenant, la partie en cours sera perdue.
        </p>
      )}

      <div className="flex justify-center gap-4">
        <button
          className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300"
          onClick={() => setShowExitGameModal(false)} // Annuler
        >
          Annuler
        </button>
        <button
          className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600"
          onClick={() => {
            setShowExitGameModal(false);
            if (gameState?.settings?.isTournament) {
              navigateTo("home"); // 🔹 Redirige vers l’accueil si tournoi
            } else {
              navigateTo("setup"); // 🔹 Sinon, retour normal
            } // Confirme et navigue
          }}
        >
          Quitter
        </button>
      </div>
    </div>
  </div>
)}

    
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {gameState.settings.mode === 'belote' ? 'Belote' : 'Coinche'}
                    
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    {gameState.settings.playerCount} joueurs • Objectif: {gameState.settings.targetScore} points
                  </p>
                  
                </div>
                
              </div>
              
              
             <div className="flex flex-wrap justify-between items-center gap-4">
  {/* Groupe gauche */}
  <div className="flex flex-wrap gap-2">
    <button
      onClick={() => navigateTo('history')}
      className="flex items-center space-x-2 px-4 py-3 text-base sm:px-3 sm:py-2 sm:text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
    >
      <History className="w-5 h-5 sm:w-4 sm:h-4" />
      <span className="hidden sm:inline">Historique</span>
    </button>
    <button
      onClick={() => navigateTo('analytics')}
      className="flex items-center space-x-2 px-4 py-3 text-base sm:px-3 sm:py-2 sm:text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
    >
      <BarChart2 className="w-5 h-5 sm:w-4 sm:h-4" />
      <span className="hidden sm:inline">Stats</span>
    </button>
  </div>

  {/* Bouton à droite */}
  <div className="flex items-center space-x-4">
  <button
    onClick={() =>
      navigateTo(
        `help${gameState.settings.mode.charAt(0).toUpperCase()}${gameState.settings.mode.slice(1)}${gameState.settings.playerCount}j`
      )
    }
    className="flex items-center justify-center px-4 py-3 text-base sm:px-3 sm:py-2 sm:text-sm 
               bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
  >
    <HelpCircle className="w-6 h-6" />
  </button>
                {showNewGameModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="relative bg-white rounded-2xl shadow-xl p-6 w-11/12 max-w-md text-center">

      {/* Flèche retour */}
      <button
        onClick={() => setShowNewGameModal(false)}
        className="absolute top-4 left-4 p-2 rounded-full hover:bg-gray-100 transition"
        aria-label="Retour"
      >
        <ArrowLeft className="w-5 h-5 text-gray-600" />
      </button>

      <h2 className="text-lg font-semibold mb-4">
        Recommencez la partie ?
      </h2>

      <p className="mb-6 text-gray-700">
        Si vous recommencez maintenant, la partie en cours sera perdue et les scores seront réinitialisés.
      </p>
      {/* Choix équipes */}
{gameState.settings.playerCount === 4 && (
  <div className="flex justify-center gap-4 mb-4">
    <button
      className={`px-4 py-2 rounded-lg font-semibold ${
        keepTeams ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
      }`}
      onClick={() => {
        setKeepTeams(false);
        setChangeTeams(false);
        saveSettings();
        setShowNewGameModal(false);
        setEloUpdated(false)
        startNewGame();
      }}
    >
      Garder les équipes
    </button>
    <button
      className={`px-4 py-2 rounded-lg font-semibold ${
        changeTeams ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
      }`}
      onClick={() => {
        setChangeTeams(true);
        setKeepTeams(false);
      }}
    >
      Changer les équipes
    </button>
  </div>
)}

{gameState.settings.playerCount != 4 && (
  <div className="flex justify-center gap-4 mb-4">
    <button
      className={`px-4 py-2 rounded-lg font-semibold ${
        keepTeams ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
      }`}
      onClick={() => {
        
        setShowNewGameModal(false);
        setEloUpdated(false)

        startNewGame();
      }}
    >
      Recommencez la partie
    </button>
    
  </div>
)}


      {/* Bouton supplémentaire si changement d’équipes */}
{changeTeams && (
  <div className="mb-6">
    <p className="font-medium text-gray-700 mb-2">Équipes :</p>

    <div className="flex flex-col gap-3">
      {gameState.players.map((player, index) => (
        <div
          key={player.id}
          className="flex items-center justify-between p-3 border rounded-xl shadow-sm bg-gray-50"
        >
          <span className="font-medium">{player.name}</span>

          {/* Toggle équipe A / B */}
          <div className="flex gap-2">
            <button
              onClick={() => updatePlayerTeam(index, "A")}
              className={`px-4 py-2 rounded-full text-base font-semibold ${
                playerTeams[index] === "A"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              A
            </button>

            <button
              onClick={() => updatePlayerTeam(index, "B")}
              className={`px-4 py-2 rounded-full text-base font-semibold ${
                playerTeams[index] === "B"
                  ? "bg-red-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              B
            </button>
          </div>
        </div>
      ))}
    </div>

    {/* Message d'avertissement si équipe invalide */}
    {(() => {
      const countA = Object.values(playerTeams).filter(t => t === "A").length;
      const countB = Object.values(playerTeams).filter(t => t === "B").length;
      if (countA !== 2 || countB !== 2) {
        return (
          <p className="mt-2 text-sm text-red-600 font-medium">
            Chaque équipe doit avoir exactement 2 joueurs !
          </p>
        );
      }
      return null;
    })()}
  </div>
)}


      {/* Boutons Annuler / Nouvelle partie */}
    {changeTeams && (
      <div className="flex justify-center gap-4">
        
        
          <button
            className="px-4 py-2 rounded-lg bg-green-800 border-2 border-green-900 text-white font-semibold hover:bg-green-900"
            onClick={() => {
              setChangeTeams(false);
              saveSettings();
              setShowNewGameModal(false);
              setEloUpdated(false)

              startNewGame(); // nouvelle partie avec les mêmes équipes
            }}
          >
            Nouvelle partie
          </button>
        
      </div>
    )}
    </div>
  </div>
)}

    <button
  onClick={() => setShowSettingsModal(true)}
  className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
>
  <Settings className="w-6 h-6" />
</button>


{/* --- MODAL PARAMÈTRES (MOBILE FRIENDLY) --- */}
{showSettingsModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[85vh] overflow-y-auto p-5">

      <h2 className="text-xl font-semibold text-center mb-4">
        Paramètres de la partie
      </h2>

      
      {/* 🔥 SCORE MAX EN 3 GROS BOUTONS */}
      <div className="mb-6">
        <p className="font-medium text-gray-700 mb-2">Score à atteindre :</p>

        <div className="grid grid-cols-3 gap-2">
          {(
            gameState.settings.mode === "belote"
              ? [501, 701, 1001]
              : gameState.settings.playerCount % 2 === 0 ? [1001, 1501, 2001]: [501, 701, 1001]
          ).map((v) => (
            <button
              key={v}
              onClick={() => setMaxScore(v)}
              className={`py-3 rounded-xl font-bold text-center ${
                maxScore === v
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* 🔥 Toggle TA/SA */}
      {gameState.settings.mode === 'coinche' && (
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-700">
            Jouer avec Tout Atout / Sans Atout
          </span>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={atoutMode !== false}
              onChange={(e) =>
                setAtoutMode(e.target.checked ? true : false)
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
          </label>
        </div>
      </div>)}

      {/* 🔄 RECOMMENCER */}
      <button
  className="w-full py-3 mt-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 flex items-center justify-center gap-2"
  onClick={() => {
    setShowSettingsModal(false);
    setShowNewGameModal(true);
  }}
>
  <RotateCcw className="w-6 h-6" />
  <span>Recommencer la partie</span>
</button>


      {/* FOOTER */}
      <div className="flex justify-between mt-4 ">
        <button
          className="px-4 py-2 rounded-lg bg-gray-700 border-2 border-gray-800 text-white font-semibold hover:bg-gray-800"
          onClick={() => setShowSettingsModal(false)}
        >
          Fermer
        </button>

        <button
          className="px-4 py-2 rounded-lg bg-green-800 border-2 border-green-900 text-white font-semibold hover:bg-green-900"
          onClick={() => {
            saveSettings();
            setShowSettingsModal(false);
          }}
        >
          Enregistrer
        </button>
      </div>

    </div>
  </div>
)}



                </div>

  
</div>
              {gameState.settings.isTournament && (() => {
  const matchId = "T-" + gameState.settings.matchId || "";
  console.log(matchId)
  const codeTournoi = gameState.settings.codeTournoi || "";

  // 🔍 Extraction du round et du match à partir du matchId
  const matchIdRegex = /-R(\d+)-M(\d+)-/;
  const matchParts = matchId.match(matchIdRegex);
  console.log(matchParts)
  const roundNumber = matchParts ? parseInt(matchParts[1]) : null;
  const matchNumber = matchParts ? parseInt(matchParts[2]) + 1 : null;

  return (
    <div className="mt-2 border border-green-300 bg-green-50 text-green-900 text-sm sm:text-base rounded-xl px-3 py-2 shadow-sm">
      <p className="font-medium">
        🏆Match de Tournoi: Round {roundNumber ?? "?"}, Match {matchNumber ?? "?"}
      </p>
      <p className="text-xs sm:text-sm text-green-800">
        Code tournoi : <span className="font-semibold">{codeTournoi}</span>
      </p>
    </div>
  );
})()}

            </div>
          </div>

          {/* Scores */}
          <div className={`grid gap-4 sm:gap-6 mb-4 sm:mb-6 ${
            gameState.settings.playerCount === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'
          }`}>
            {renderTeamCard('A', teamAPlayers, gameState.teamAScore, progressA)}
            {renderTeamCard('B', teamBPlayers, gameState.teamBScore, progressB)}
            {gameState.settings.playerCount === 3 && renderTeamCard('C', teamCPlayers, gameState.teamCScore, progressC)}
          </div>

          {/* Game Status */}
          {gameState.gameEnded ? (
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 text-center mb-4 sm:mb-6">
              <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Victoire {gameState.settings.playerCount === 4 ? "de l'Équipe" : "du Joueur"} {gameState.winningTeam}!
              </h2>
              <p className="text-gray-600 mb-6">
                Score final: {gameState.teamAScore} - {gameState.teamBScore}
                {gameState.settings.playerCount === 3 && ` - ${gameState.teamCScore}`}
              </p>
              {!gameState.settings.isTournament  && (
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                <button
                  onClick={() => {
                    setEloUpdated(false)

                    startNewGame()}}
                  className="flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Revanche</span>
                </button>
                <button
                  onClick={() => setShowNewGameModal(true)}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
                >
                  Nouvelle Partie
                </button>
                <button
                  onClick={() => navigateTo('analytics')}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
                >
                  Statistiques
                </button>
                </div>
              )}
                {gameState.settings.isTournament  && (
                  <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
        <button
          onClick={() => navigateTo2('tournamentview', { code: gameState.settings.codeTournoi })}
          className="px-4 sm:px-6 py-2 sm:py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm sm:text-base"
        >
          Voir l'arbre du tournoi
        </button>
      
              </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                <div className="text-center sm:text-left">
                  <h3 className="text-lg font-semibold text-gray-900">Prochaine main</h3>
                  <div className="flex items-center gap-2">
  <p className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full whitespace-nowrap">
    Donneur: <span className="font-medium">{currentDealer?.name.slice(0,5) || '—'}</span>
  </p>

  <p className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full whitespace-nowrap">
    Commence: <span className="font-medium">{currentStart?.name.slice(0,5) || '—'}</span>
  </p>
</div>
                  <button
   onClick={nextDealer}
  className="mt-4 bg-gray-300 rounded-xl px-4 py-2 hover:bg-gray-400 transition"
>
  Main blanche
</button>

                </div>
                <div className="flex flex-col items-center gap-2 text-center">

  {isNearGameEnd && !gameState.gameEnded && (
  <div className="border border-orange-300 bg-orange-50 text-orange-800 text-xs sm:text-sm font-semibold px-4 py-3 rounded-lg max-w-md text-center">
    ⚠️ Attention : la fin de la partie approche.<br />
    Vous ne pourrez plus modifier les mains une fois la partie terminée.
  </div>
)}

  <button
    onClick={() => setShowScoreEntry(true)}
    disabled={gameState.gameEnded}
    className={`flex items-center space-x-2 px-4 sm:px-6 py-3 rounded-lg transition-all duration-200 shadow-lg text-sm sm:text-base
      ${
        gameState.gameEnded
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-gradient-to-r from-green-600 to-green-800 text-white hover:from-green-700 hover:to-green-900"
      }
    `}
  >
    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
    <span>Ajouter une main</span>
  </button>
</div>
              </div>
            </div>
          )}

          {/* Recent Hands */}
          {gameState.hands.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Historique des mains</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {gameState.hands.slice().reverse().map(hand => {
                  const taker = hand.taker ? gameState.players.find(p => p.id === hand.taker) : null;
                  const coincher = hand.coincher ? gameState.players.find(p => p.id === hand.coincher) : null;
                  const surcoincher = hand.surcoincher ? gameState.players.find(p => p.id === hand.surcoincher) : null;
                  
                  return (
                    <div key={hand.id} className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-2 sm:space-y-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-gray-600">Main #{hand.handNumber}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            hand.winningTeam === 'A' ? 'bg-blue-100 text-blue-700' : 
                            hand.winningTeam === 'B' ? 'bg-red-100 text-red-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {gameState.settings.playerCount === 4 ? 'Équipe' : 'Joueur'} {hand.winningTeam}
                          </span>
                          {hand.isCapot && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                              CAPOT!
                            </span>
                          )}
                          {hand.contractFulfilled !== undefined && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              hand.contractFulfilled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              Contrat {hand.contractFulfilled ? 'Réussi' : 'Échoué'}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {hand.points} {hand.announcements ? `+ ${hand.announcements}` : ''} 
                          {hand.beloteRebelote ? ' + 20 (BR)' : ''} pts
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        {taker && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">Preneur:</span> 
                            <span>{taker.name}</span>
                            {hand.bid && (
                              <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                                {hand.bid.value} {getSuitDisplay(hand.bid.suit)}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {coincher && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">Coinche:</span>
                            <span>{coincher.name}</span>
                            {hand.isCoincheSuccessful !== undefined && (
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                hand.isCoincheSuccessful 
                                  ? 'bg-yellow-100 text-yellow-700' 
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {hand.isCoincheSuccessful ? 'Réussie' : 'Échouée'}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {surcoincher && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">Surcoinche:</span>
                            <span>{surcoincher.name}</span>
                            {hand.isSurcoincheSuccessful !== undefined && (
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                hand.isSurcoincheSuccessful 
                                  ? 'bg-purple-100 text-purple-700' 
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {hand.isSurcoincheSuccessful ? 'Réussie' : 'Échouée'}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Score breakdown */}
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            <span className="font-medium">Scores:</span>
                            <span className="text-blue-600">A: {hand.teamAScore > 0 ? '+' : ''}{hand.teamAScore}</span>
                            <span className="text-red-600">B: {hand.teamBScore > 0 ? '+' : ''}{hand.teamBScore}</span>
                            {gameState.settings.playerCount === 3 && (
                              <span className="text-green-600">C: {hand.teamCScore > 0 ? '+' : ''}{hand.teamCScore}</span>
                            )}

                            <div className="mt-4 flex justify-end">
  <button
  onClick={() => handleEditHand(hand)}
  disabled={gameState.gameEnded}
  className={`px-4 py-2 rounded-lg text-xs font-semibold shadow transition
    ${
      gameState.gameEnded
        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
        : "bg-green-600 text-white hover:bg-green-700"
    }
  `}
>
  ✏️ Modifier
</button>
</div>
                          </div>
                          
                        </div>
                        

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showScoreEntry && (
  <ScoreEntry 
    onClose={() => {
      setShowScoreEntry(false);
      setEditedHand(null); // reset après fermeture
    }}
    onSubmit={(data) => {
  
  handleScoreSubmit(data);
  setEditedHand(null);
  setShowScoreEntry(false);
}}
    editedHand={editedHand} // 👈 passe-la ici
  />
)}

      {showPenaltyModal && (
        <PenaltyModal
          team={selectedTeam}
          onClose={() => setShowPenaltyModal(false)}
          onSubmit={handlePenaltySubmit}
        />
      )}

      {gameState.showPlayerConfirmation && (
        <PlayerConfirmationModal />
      )}

      {showCelebration && (
        <CapotCelebration team={celebrationTeam} />
      )}

      {showCoincheSuccess && (
        <CoincheSuccessAnimation 
          playerName={celebrationPlayer}
          onComplete={() => setShowCoincheSuccess(false)}
        />
      )}

      {showSurcoincheSuccess && (
        <SurcoincheSuccessAnimation 
          playerName={celebrationPlayer}
          onComplete={() => setShowSurcoincheSuccess(false)}
        />
      )}
    </>
  );
}