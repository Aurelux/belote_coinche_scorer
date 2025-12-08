import React, { useEffect, useState , useRef} from "react";
import { ArrowLeft, Trophy, Users, Clock,User, Network, Play, BarChart, RefreshCw, Flag, Settings, Goal, Shield, Layers3} from "lucide-react";
import { useGame } from "../context/GameContext";
import { supabase } from "../lib/supabase";

import { PlayerTree, MatchNode,GameSettings, Player, Hand } from "./types";
import {availableFrames } from '../types/game';


type SwissReturn = { team: TeamStats[]; test: MatchNode[] };

interface TeamStats {
  name: string;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
}

interface SwissTeam {
  name: string;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
}

interface Tournament {
  id: string;
  name: string;
  mode: string;
  total_players: number;
  random_teams: boolean;
  options: boolean;
  match_format: string;
  join_code: string;
  status: string;
  players: { name: string; team?: string }[];
  organizer_id : string;
  maxMatches : number;
  targetPoints : number;
}

interface Match {
  id: string;
  round: number;
  team_a: string;
  team_b: string;
  score_a: number;
  score_b: number;
  status: string;
  format: string;
  next_match_id?: string;
  tournament_id: string;
  joueurs_a: PlayerTree;
  joueurs_b: PlayerTree;
}




export default function TournamentView({ code }: { code: string }) {
  const { gameState,navigateTo,startNewGame,setGameSettings, setPlayers, navigateTo2, reportMatchResult, markTournamentAsFinished,setGameState} = useGame();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);;
  
  const [treeMatches, setTreeMatches] = useState<MatchNode[]>([]);
  const [teamSwiss, setTeamSwiss] = useState<SwissTeam[]>([]);
  const [matchSwiss, setMatchSwiss] = useState<MatchNode[]>([]);
  const [existingMatches, setExistingMatches] = useState<MatchNode[]>([]);
  const [existingMatchesSM, setExistingMatchesSM] = useState<MatchNode[]>([]);
    const [showConfirm, setShowConfirm] = useState(false);
  const [loadingFinish, setLoadingFinish] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showForfeitPopup, setShowForfeitPopup] = useState(false);
const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
const [forfeitTeam, setForfeitTeam] = useState<"A" | "B" | null>(null);
const [showPopup, setShowPopup] = useState(false);
  const [detPlayers, setDetPlayers] = useState<PlayerTree[]>([]);
  const [showScorePopup, setShowScorePopup] = useState(false);
const [scoreA, setScoreA] = useState(0);
const [scoreB, setScoreB] = useState(0);



const [matchesByRound, setMatchesByRound] = useState<Map<number, MatchNode[]>>(new Map());
const hasFetched = useRef(false);
const round = useRef(1);

 useEffect(() => {
  
if (hasFetched.current) return;



  const run = async () => {
    setLoading(true);

    // --- Étape 1 : Récupération du tournoi ---
    const { data: tData } = await supabase
      .from("tournaments")
      .select("*")
      .eq("join_code", code)
      .single();

    if (!tData) {
      
      setLoading(false);
      return;
    }
    if (!gameState.currentUser) {
      const filtered = tData.players.filter(p => p.id.startsWith("det"));
      setDetPlayers(filtered);
      if (filtered.length > 0) {
        setShowPopup(true);
      }
    }

    setTournament(tData);

    const players: PlayerTree[] = normalizePlayers(tData.players);
    const option: "single" | "double" | "swiss" =
      tData.options === "double" ? "double" :
      tData.options === "swiss" ? "swiss" :
      "single";

    // --- Étape 2 : Vérifier si les matchs existent ---
    const { data: existingMatches, error: selectErr } = await supabase
      .from("tournament_matches")
      .select("id")
      .eq("tournament_id", tData.id);

    if (selectErr) {
      console.error("❌ Erreur de sélection des matchs existants :", selectErr);
      setLoading(false);
      return;
    }

    // --- Étape 3 : Génération ou récupération des matchs ---
    if (!existingMatches || existingMatches.length === 0) {
      console.log("📦 Aucune donnée de match — génération…");

      if (option === "swiss") {
        const swissStage = generateTournamentTree(tData, players, option);
        setTeamSwiss(swissStage.team);
        setMatchSwiss(swissStage.test);

        await supabase.from("tournament_matches").insert(
          swissStage.test.map((m) => ({
            id: m.id,
            tournament_id: m.tournament_id,
            round: m.round,
            joueurs_a: m.joueurs_a,
            joueurs_b: m.joueurs_b,
            format: m.format || 'BO1',
            bracket: m.bracket,
            status: m.status,
            match_number: 0,
            next_match_id: m.next_match_id || null,
            score_a: 0,
            score_b: 0,
            options: m.options,
          }))
        );
      } else {
        const tree = generateTournamentTree(tData, players, option);
        setTreeMatches(tree);

        await supabase.from("tournament_matches").insert(
          tree.map((m) => ({
            id: m.id,
            tournament_id: m.tournament_id,
            round: m.round,
            joueurs_a: m.joueurs_a,
            joueurs_b: m.joueurs_b,
            format: m.format || 'BO1',
            bracket: m.bracket,
            status: m.status,
            match_number: 0,
            next_match_id: m.next_match_id || null,
            score_a: 0,
            score_b: 0,
            options: m.options,
          }))
        );
      }
    } else {
      console.log("⚠️ Les matchs existent déjà pour ce tournoi.");
    }

    // --- Étape 4 : Une fois le tournoi prêt → fetchMatches ---
    const maxMatches = tData.maxMatches ?? 0;
    console.log("📊 Lancement du fetch des matchs après tournoi");
    await fetchMatches(tData.id,maxMatches);

    setLoading(false);
  };

  const fetchMatches = async (tournamentId: string, maxMatches : number) => {
    const { data: existing = [], error: selectErr } = await supabase
      .from("tournament_matches")
      .select("*")
      .eq("tournament_id", tournamentId);

    if (selectErr) {
      console.error("❌ Erreur de sélection des matchs existants :", selectErr);
      return;
    }

    const mapByRound = new Map<number, MatchNode[]>();
    existing.forEach((m) => {
      const arr = mapByRound.get(m.round) || [];
      arr.push(m);
      mapByRound.set(m.round, arr);
    });

    setExistingMatches(existing);
    setMatchesByRound(mapByRound);
let filteredMatches = [existing[0]]
    if (existing[0].options === "swiss" && maxMatches>0) {
  filteredMatches = existing.filter((m) => 
    m.round === 1 || m.changed === true
  
  );
  const seen = new Set<string>();
  filteredMatches = filteredMatches.filter((m) => {
    const key1 = JSON.stringify([m.joueurs_a.sort(), m.joueurs_b.sort()]);
    const key2 = JSON.stringify([m.joueurs_b.sort(), m.joueurs_a.sort()]); // inverse
    if (seen.has(key1) || seen.has(key2)) return false;
    seen.add(key1);
    return true;
  });
  console.log(filteredMatches)

  setExistingMatchesSM(filteredMatches);
}

    // Calcul des teams
    const teamSet = new Set<string>();
    existing.forEach((m: any) => {
      (m.joueurs_a || []).forEach((p: any) => p.team && teamSet.add(p.team));
      (m.joueurs_b || []).forEach((p: any) => p.team && teamSet.add(p.team));
    });

    const teams = Array.from(teamSet);
    const teamStats: Record<string, any> = {};
    teams.forEach(t => {
      const teamPlayers = existing
        .flatMap((m: any) => [...(m.joueurs_a || []), ...(m.joueurs_b || [])])
        .filter((p: any) => p.team === t)
        .slice(0, 2);

      const name = teamPlayers.map((p: any) => p.name?.slice(0, 5) || "?").join(" & ");

      teamStats[t] = {
        name,
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      };
    });

    existing.forEach((m: any) => {
      if (m.status !== "finished") return;

      const scoreA = m.score_a ?? 0;
      const scoreB = m.score_b ?? 0;

      const teamAName = m.joueurs_a[0]?.team;
      const teamBName = m.joueurs_b[0]?.team;
      if (!teamAName || !teamBName) return;

      teamStats[teamAName].pointsFor += scoreA;
      teamStats[teamAName].pointsAgainst += scoreB;

      teamStats[teamBName].pointsFor += scoreB;
      teamStats[teamBName].pointsAgainst += scoreA;

      if (scoreA > scoreB) {
        teamStats[teamAName].wins += 1;
        teamStats[teamBName].losses += 1;
      } else if (scoreB > scoreA) {
        teamStats[teamBName].wins += 1;
        teamStats[teamAName].losses += 1;
      }
    });

    setTeamSwiss(Object.values(teamStats));
    const teamSwissSet = Object.entries(teamStats).map(([team, stats]) => ({
  name: team,
  wins: stats.wins,
  games: stats.games,
}));

// ✅ Nombre de matchs maximum pour le tournoi

    const matchnumber = teamSwissSet.length*maxMatches
    console.log(existing)
    console.log(existing[0])
    console.log(filteredMatches.length)
    console.log(matchnumber)
    const allFinished =
    
    existing.length > 0 &&
    existing.every((m) => m.status === "finished");
    const allFinishedSM = filteredMatches.every((m) => m.status === "finished");

  if (allFinished || (filteredMatches.length === matchnumber && allFinishedSM)) {
  // Vérifier si le tournoi est déjà dans l'historique
  const { data: existingHistory, error: historyError } = await supabase
    .from("tournament_history")
    .select("id")
    .eq("tournament_id", tournamentId)
    .limit(1)
    .single();

  if (historyError && historyError.code !== "PGRST116") {
    console.error("Erreur vérification historique :", historyError);
  } else if (!existingHistory) {
    console.log('histo')
    // S'il n'existe pas, on marque le tournoi comme terminé dans l'historique
    await markTournamentAsFinished(tournamentId);
  }

  hasFetched.current = true;
}

    
  };
  

  run();
}, [code, refreshKey]);



console.log(existingMatches)
  const normalizePlayers = (players: any[]) => {
  return (players || []).map((p: any, idx) => ({
    id: p?.id || `det-${idx}`, // id temporaire si non défini
    name: p?.name ? p.name.slice(0, 5) : "À det", // max 5 lettres
    profile_picture: p?.profile_picture  || null,
    team : p?.team || null,
    frames : p?.frames || null // null pour afficher rond
  }));
};
const handleSelectPlayer = (player: Player) => {
    
    setGameState({
      ...gameState,
      currentUser: { id: player.id, displayName: player.name },
    });
   
    setShowPopup(false);
  };
const finishMatchAsForfeit = async (m: Match, forfeitingTeam: "A" | "B", targetPoints : number) => {
  const winner = forfeitingTeam === "A" ? "B" : "A";

  const updates = {
    status: "finished",
    score_a: forfeitingTeam === "A" ? 0 : targetPoints,
    score_b: forfeitingTeam === "B" ? 0 : targetPoints,
    
    
  };
  const joueursA: Player[] = Array.isArray(m.joueurs_a) ? m.joueurs_a : JSON.parse(m.joueurs_a || '[]');
  const joueursB: Player[] = Array.isArray(m.joueurs_b) ? m.joueurs_b : JSON.parse(m.joueurs_b || '[]');

  const losingTeamPlayers =
    forfeitingTeam === 'A' ? joueursA :
    forfeitingTeam === 'B' ? joueursB :
    forfeitingTeam === 'C' ? joueursA : [];

  const winningTeamPlayers =
    winner === 'A' ? joueursA :
    winner === 'B' ? joueursB :
    winner === 'C' ? joueursA : [];

  // On traite chaque joueur gagnant
  for (const player of winningTeamPlayers) {
    // Vérifie si le joueur a déjà des stats
    const { data: existingStats } = await supabase
      .from("tournament_stats")
      .select("*")
      .eq("tournament_id", m.tournament_id)
      .eq("user_id", player.id)
      .single();

    if (existingStats) {
      // Update existant
      await supabase
        .from("tournament_stats")
        .update({
          wins: (existingStats.wins ?? 0) + 1,
          losses: existingStats.losses ?? 0,
          total_games: (existingStats.total_games ?? 0) + 1,
          points_scored: (existingStats.points_scored ?? 0) + Math.floor(targetPoints/2),
        })
        .eq("tournament_id", m.tournament_id)
        .eq("user_id", player.id);
    } else {
      // Création d'une nouvelle ligne
      await supabase.from("tournament_stats").insert({
        tournament_id: m.tournament_id,
        user_id: player.id,
        wins: 1,
        losses: 0,
        total_games: 1,
        points_scored: Math.floor(targetPoints/2),
        points_conceded: 0,
      });
    }
  }

  // On traite chaque joueur perdant
  for (const player of losingTeamPlayers) {
    const { data: existingStats } = await supabase
      .from("tournament_stats")
      .select("*")
      .eq("tournament_id", m.tournament_id)
      .eq("user_id", player.id)
      .single();

    if (existingStats) {
      await supabase
        .from("tournament_stats")
        .update({
          total_games: (existingStats.total_games ?? 0) + 1,
          losses: (existingStats.losses ?? 0) + 1,
          points_conceded: (existingStats.points_conceded ?? 0) + Math.floor(targetPoints/2),
        })
        .eq("tournament_id", m.tournament_id)
        .eq("user_id", player.id);
    } else {
      await supabase.from("tournament_stats").insert({
        tournament_id: m.tournament_id,
        user_id: player.id,
        wins: 0,
        losses: 1,
        total_games: 1,
        points_scored: 0,
        points_conceded: Math.floor(targetPoints/2),
      });
    }
  }
  
  const { error } = await supabase
    .from("tournament_matches")
    .update(updates)
    .eq("id", m.id);

  if (error) {
    console.error("Erreur forfait :", error);
    
  } else {
    if(tournament.options !== 'swiss'){

    
  await reportMatchResult(
    m.id,
    winningTeamPlayers,
    losingTeamPlayers,
    {
      a: forfeitingTeam === "A" ? 0 : targetPoints,
      b: forfeitingTeam === "B" ? 0 : targetPoints,
    }
  );
  }
    console.log('coucou')
    setRefreshKey((prev) => prev + 1);
  }
};

const modifMatch = async (m : Match, scoreA : number, scoreB: number)=> {
  // Détermine quelle équipe gagne ou perd
  const winningTeam = scoreA > scoreB ? "A" : scoreB > scoreA ? "B" : null;
  

  // Récupère les bons joueurs selon la team gagnante/perdante
  const winningTeamPlayers =
    winningTeam === "A" ? m.joueurs_a : m.joueurs_b;
  const losingTeamPlayers =
    winningTeam === "A" ? m.joueurs_b : m.joueurs_b;

  

  // Appel de ta fonction principale
  await reportMatchResult(
    m.id,
    winningTeamPlayers,
    losingTeamPlayers,
    {
      a:  scoreA,
      b:  scoreB,
    }
  );
  setRefreshKey(prev => prev + 1);

  console.log(`✅ Match ${m.id} mis à jour : ${scoreA}-${scoreB}`);
}


const handleFinishTournament = async () => {
    setLoadingFinish(true);
    try {
      // ✅ Mettre tous les matchs du tournoi à "finished"
      const { error } = await supabase
        .from("tournament_matches")
        .update({ status: "finished" })
        .eq("tournament_id", tournament.id);

      if (error) throw error;
      
      setShowConfirm(false);
      setRefreshKey(prev => prev + 1);
    } catch (e) {
      console.error("Erreur lors de la fin du tournoi :", e);
      
    } finally {
      markTournamentAsFinished(tournament.id)
      setLoadingFinish(false);
    }
  };
const handleStartMatch = async (m: MatchNode) => {
  if (!m || !m.joueurs_a || m.joueurs_b.length === 0) {
    console.warn("Match invalide : aucun joueur assigné");
    return;
  }
  const { data: matchData, error: fetchError } = await supabase
  .from("tournament_matches")
  .select("status")
  .eq("id", m.id)
  .eq("tournament_id", m.tournament_id)
  .single();

if (fetchError) {
  setError("Erreur lors de la vérification du match.");
  console.error(fetchError);
  return;
}

// Si le match est déjà en cours, on bloque
if (matchData?.status === "ongoing") {
  setError("Match déjà lancé !");
  return;
}

// Sinon, on le passe à "ongoing"
const { error: updateError } = await supabase
  .from("tournament_matches")
  .update({ status: "ongoing" })
  .eq("id", m.id)
  .eq("tournament_id", m.tournament_id);

if (updateError) {
  setError("Erreur lors de la mise à jour du match.");
  console.error(updateError);
  return;
}

// Succès éventuel
console.log("Match mis à jour en 'ongoing'");

  const allPlayers = [...(m.joueurs_a || []), ...(m.joueurs_b || [])]
  .filter(p => p && p.name && !p.name.toLowerCase().includes("winner") && !p.name.toLowerCase().includes("loser"));// 1️⃣ Nettoyage et adaptation des joueurs du match

  const matchPlayers: Player[] = [...(m.joueurs_a || []), ...(m.joueurs_b || [])]
    .filter(p => p && p.name && !p.name.toLowerCase().includes("winner") && !p.name.toLowerCase().includes("loser"))
    .map((p, index) => {
      // on récupère les infos s’il s’agit d’un utilisateur enregistré
      const registeredUser = gameState.users?.find(
        u => u.displayName.toLowerCase() === p.name.toLowerCase()
      );

      return {
        id: `player-${index}`,
        name: p.name,
        team:
          allPlayers.length === 2
            ? (index === 0 ? "A" : "B")
            : allPlayers.length === 3
            ? (index === 0 ? "A" : index === 1 ? "B" : "C")
            : index < 2
            ? "A"
            : "B",
        userId: p.id,
        profilePicture: p?.profile_picture && typeof p.profile_picture === "string" && p.profile_picture.length > 0 ? p.profile_picture : null,
        profileTitle: registeredUser?.profileTitle,
        frames : p?.frames ?? null,
        isGuest: !registeredUser,
      } as Player;
    });

  if (matchPlayers.length === 0) {
    console.warn("Aucun joueur valide pour ce match");
    return;
  }

  // 2️⃣ Définir les paramètres de la partie
  const settings: GameSettings = {
    mode: tournament.mode, // 'belote' ou 'coinche'
    playerCount: matchPlayers.length as 2 | 3 | 4,
    withAnnouncements : true,
    targetScore : tournament.targetPoints,
    isTournament: true,
    currentTournamentId: tournament.id,
    matchId: m.id,
    tournamentOptions : tournament.options,
    codeTournoi : tournament.join_code// tu peux le forcer à false ici ou le rendre dynamique
  };
  
  


  // 3️⃣ Mise à jour du contexte / store
  setPlayers(matchPlayers);
  setGameSettings(settings);

  // 4️⃣ Réinitialiser les scores et commencer la partie
  startNewGame();

  // 5️⃣ Naviguer vers la page de jeu
  navigateTo("game");

  console.log("✅ Match lancé avec :", { settings, players: matchPlayers });
};

console.log(round.current)
const generateTournamentTree = (tournament: Tournament,
  players: PlayerTree[],
  option: "single" | "double" | "swiss"
): MatchNode[] | SwissReturn => {
  const matches: MatchNode[] = [];
  
  const createMatchNode = (
  id: string,
  round: number,
  bracket: "upper" | "lower",
  players: PlayerTree[],
  nextMatchId: string | null
): MatchNode => ({
  id,
  round,
  bracket,
  players,
  children: [],
  status: "pending",
  nextMatchId,
});


  // ==== SINGLE ELIMINATION ====
// ==== SINGLE ELIMINATION ====
if (option === "single") {
  

  // On travaille par équipes (players contient déjà les infos de team)
  // Chaque équipe affronte une autre — on suppose un nombre pair
  let currentRoundPlayers = players.map((p) => p); // copie de base
  let round = 1;
  

  while (currentRoundPlayers.length > 1) {
    const roundMatches: MatchNode[] = [];
    let matchCount = 0;

    // Crée les matchs de ce round
    for (let i = 0; i < currentRoundPlayers.length; i += 4) {
      const teamA = currentRoundPlayers.slice(i, i + 2);
      const teamB = currentRoundPlayers.slice(i + 2, i + 4);

      if (teamA.length < 2 || teamB.length < 2) continue; // sécurité

      const matchId = `R${round}-M${matchCount}-${tournament.join_code}`;
      const match = createMatchNode(matchId, round, "upper", [...teamA, ...teamB],`R${round+1}-M${Math.floor(matchCount/2)}-${tournament.join_code}`);
      roundMatches.push(match);
      matchCount++;
    }

    matches.push(...roundMatches);

    // Préparer les gagnants pour le round suivant
    const nextRound = roundMatches.map((m, idx) => [
      { name: `Winner` },
      { name: `Winner` },
    ]);

    // Aplatir et ne garder qu’autant de “joueurs” que nécessaire
    currentRoundPlayers = nextRound.flat().slice(0, roundMatches.length * 2);

    round++;
  }
  
  const test =  matches.map((m) => ({
      id: m.id,
      tournament_id: tournament.id,
      round: m.round,
      joueurs_a : m.players.slice(0, 2),
      joueurs_b :m.players.slice(2, 4),
      format: tournament.match_format || 'BO1',
      bracket: m.bracket,
      status: m.status,
      match_number : 0,
      score_a: 0,
      score_b :0,
      options : option,
      
      next_match_id: m.nextMatchId || null,
    }));

  return test;
}


  // ==== DOUBLE ELIMINATION ====
  if (option === "double") {
  const teamMap: { [team: string]: Player[] } = {};
  players.forEach(p => {
    if (!teamMap[p.team!]) teamMap[p.team!] = [];
    teamMap[p.team!].push(p);
  });
  const teams = Object.values(teamMap); // tableau des équipes

  const nTeams = teams.length;
  let matchId = 0;

  // === ROUND 1 Upper ===
  for (let i = 0; i < nTeams; i += 2) {
    const teamA = teams[i];
    const teamB = teams[i + 1] || []; // cas impair -> Bye
    matches.push(
      createMatchNode(
        `R1-M${matchId}-${tournament.join_code}`,
        1,
        "upper",
        [...teamA, ...teamB.length ? teamB : [{ name: "Bye" }]],
        `R2-M${Math.floor(matchId/2)}-${tournament.join_code}---LB-R2-M${Math.floor(matchId/2)}-${tournament.join_code}`
      )
    );
    matchId++;
  }


  const nPlayers = players.length;
    if (nPlayers === 24){
    matches.push(
        createMatchNode(
          `R2-M0-${tournament.join_code}`,
          2,
          "upper",
          [
            { name: `Winner` },
            { name: `Winner` },
            { name: `Winner` },
            { name: `Winner` },
          ],
          `R4-M0-${tournament.join_code}---LB-R3-M0-${tournament.join_code}`
        )
      );
      matches.push(
        createMatchNode(
          `R2-M1-${tournament.join_code}`,
          2,
          "upper",
          [
            { name: `Winner` },
            { name: `Winner` },
            { name: `Winner` },
            { name: `Winner` },
          ],
          `R4-M0-${tournament.join_code}---LB-R3-M1-${tournament.join_code}`
        )
      );
       matches.push(
        createMatchNode(
          `R2-M3-${tournament.join_code}`,
          2,
          "upper",
          [
            { name: `Winner` },
            { name: `Winner` },
            { name: `Winner` },
            { name: `Winner` },
          ],
          `R4-M1-${tournament.join_code}---LB-R3-M2-${tournament.join_code}`
        )
      );
      matches.push(
        createMatchNode(
          `LB-R2-M0-${tournament.join_code}`,
          2,
          "lower",
          [
            { name: `Loser` },
            { name: `Loser` },
            { name: `Loser` },
            { name: `Loser` },
          ],
          `LB-R3-M0-${tournament.join_code}---`
        )
      );
      matches.push(
        createMatchNode(
          `LB-R2-M1-${tournament.join_code}`,
          2,
          "lower",
          [
            { name: `Loser` },
            { name: `Loser` },
            { name: `Loser` },
            { name: `Loser` },
          ],
          `LB-R3-M1-${tournament.join_code}---`
        )
      );
      matches.push(
        createMatchNode(
          `LB-R2-M2-${tournament.join_code}`,
          2,
          "lower",
          [
            { name: `Loser` },
            { name: `Loser` },
            { name: `Loser` },
            { name: `Loser` },
          ],
          `LB-R3-M2-${tournament.join_code}---`
        )
      );
      matches.push(
        createMatchNode(
          `LB-R3-M0-${tournament.join_code}`,
          3,
          "lower",
          [
            { name: `Loser` },
            { name: `Loser` },
            { name: `Loser` },
            { name: `Loser` },
          ],
          `R4-M1-${tournament.join_code}---`
        )
      );
      matches.push(
        createMatchNode(
          `LB-R3-M1-${tournament.join_code}`,
          3,
          "lower",
          [
            { name: `Loser` },
            { name: `Loser` },
            { name: `Loser` },
            { name: `Loser` },
          ],
          `LB-R4-M0-${tournament.join_code}---`
        )
      );
      matches.push(
        createMatchNode(
          `LB-R3-M2-${tournament.join_code}`,
          3,
          "lower",
          [
            { name: `Loser` },
            { name: `Loser` },
            { name: `Loser` },
            { name: `Loser` },
          ],
          `LB-R4-M0-${tournament.join_code}---`
        )
      );
      matches.push(
        createMatchNode(
          `R4-M0-${tournament.join_code}`,
          4,
          "upper",
          [
            { name: `Winner` },
            { name: `Winner` },
            { name: `Winner` },
            { name: `Winner` },
          ],
          `R6-M0-${tournament.join_code}---LB-R6-M0-${tournament.join_code}`
        )
      );
      matches.push(
        createMatchNode(
          `R4-M1-${tournament.join_code}`,
          4,
          "upper",
          [
            { name: `Winner` },
            { name: `Winner` },
            { name: `Winner` },
            { name: `Winner` },
          ],
          `R6-M0-${tournament.join_code}---LB-R5-M0-${tournament.join_code}`
        )
      );
      matches.push(
        createMatchNode(
          `LB-R4-M0-${tournament.join_code}`,
          4,
          "lower",
          [
            { name: `Loser` },
            { name: `Loser` },
            { name: `Loser` },
            { name: `Loser` },
          ],
          `LB-R5-M0-${tournament.join_code}---`
        )
      );
      matches.push(
        createMatchNode(
          `LB-R5-M0-${tournament.join_code}`,
          5,
          "lower",
          [
            { name: `Loser` },
            { name: `Loser` },
            { name: `Loser` },
            { name: `Loser` },
          ],
          `LB-R6-M0-${tournament.join_code}---`
        )
      );
      matches.push(
        createMatchNode(
          `LB-R6-M0-${tournament.join_code}`,
          6,
          "lower",
          [
            { name: `Loser ` },
            { name: `Loser ` },
            { name: `Loser` },
            { name: `Loser` },
          ],
          `LB-R7-M0-${tournament.join_code}---`
        )
      );

      matches.push(
        createMatchNode(
          `LB-R7-M0-${tournament.join_code}`,
          7,
          "lower",
          [
            { name: `Loser ` },
            { name: `Loser ` },
            { name: `Loser` },
            { name: `Loser` },
          ],
          `R8-M0-${tournament.join_code}---`
        )
      );
      matches.push(
        createMatchNode(
          `R6-M0-${tournament.join_code}`,
          6,
          "upper",
          [
            { name: `Winner` },
            { name: `Winner` },
            { name: `Winner` },
            { name: `Winner` },
          ],
          `R8-M0-${tournament.join_code}---`
        )
      );
      matches.push(
        createMatchNode(
          `R8-M0-${tournament.join_code}`,
          8,
          "upper",
          [
            { name: `Finalist` },
            { name: `Finalist` },
            { name: `Finalist` },
            { name: `Finalist` },
          ],
          null
        )
      );


  }
  if (nPlayers === 16){
    matches.push(
        createMatchNode(
          `R2-M0-${tournament.join_code}`,
          2,
          "upper",
          [
            { name: `Winner` },
            { name: `Winner` },
            { name: `Winner` },
            { name: `Winner` },
          ],
          `R3-M0-${tournament.join_code}---LB-R3-M0-${tournament.join_code}`
        )
      );
      matches.push(
        createMatchNode(
          `R2-M1-${tournament.join_code}`,
          2,
          "upper",
          [
            { name: `Winner` },
            { name: `Winner` },
            { name: `Winner` },
            { name: `Winner` },
          ],
          `R3-M0-${tournament.join_code}---LB-R3-M0-${tournament.join_code}`
        )
      );
      matches.push(
        createMatchNode(
          `LB-R2-M0-${tournament.join_code}`,
          2,
          "lower",
          [
            { name: `Loser` },
            { name: `Loser` },
            { name: `Loser` },
            { name: `Loser` },
          ],
          `LB-R3-M1-${tournament.join_code}---`
        )
      );
      matches.push(
        createMatchNode(
          `LB-R2-M1-${tournament.join_code}`,
          2,
          "lower",
          [
            { name: `Loser` },
            { name: `Loser` },
            { name: `Loser` },
            { name: `Loser` },
          ],
          `LB-R3-M1-${tournament.join_code}---`
        )
      );
      matches.push(
        createMatchNode(
          `R3-M0-${tournament.join_code}`,
          3,
          "upper",
          [
            { name: `Winner` },
            { name: `Winner` },
            { name: `Winner` },
            { name: `Winner` },
          ],
          `R6-M0-${tournament.join_code}---LB-R5-M0-${tournament.join_code}`
        )
      );
      matches.push(
        createMatchNode(
          `LB-R3-M0-${tournament.join_code}`,
          3,
          "lower",
          [
            { name: `Loser` },
            { name: `Loser` },
            { name: `Loser` },
            { name: `Loser` },
          ],
          `LB-R4-M0-${tournament.join_code}---`
        )
      );
      matches.push(
        createMatchNode(
          `LB-R3-M1-${tournament.join_code}`,
          3,
          "lower",
          [
            { name: `Loser` },
            { name: `Loser` },
            { name: `Loser` },
            { name: `Loser` },
          ],
          `LB-R4-M0-${tournament.join_code}---`
        )
      );
      matches.push(
        createMatchNode(
          `LB-R4-M0-${tournament.join_code}`,
          4,
          "lower",
          [
            { name: `Loser ` },
            { name: `Loser ` },
            { name: `Loser` },
            { name: `Loser` },
          ],
          `LB-R5-M0-${tournament.join_code}---`
        )
      );

      matches.push(
        createMatchNode(
          `LB-R5-M0-${tournament.join_code}`,
          5,
          "lower",
          [
            { name: `Loser ` },
            { name: `Loser ` },
            { name: `Loser` },
            { name: `Loser` },
          ],
          `R6-M0-${tournament.join_code}---`
        )
      );
      matches.push(
        createMatchNode(
          `R6-M0-${tournament.join_code}`,
          6,
          "upper",
          [
            { name: `Finalist` },
            { name: `Finalist` },
            { name: `Finalist` },
            { name: `Finalist` },
          ],
          null
        )
      );


  }

  // Regroupe les joueurs par équipe
  if (nPlayers === 8){
  // === ROUNDS UPPER/LOWER ===
  let upperMatches = Math.ceil(nTeams / 2);
  let round = 2;
  let lowerId = 0;

  // Génère les Upper rounds (simplifié)
  while (upperMatches > 1) {
    const nextUpperMatches = Math.floor(upperMatches / 2);
    for (let i = 0; i < nextUpperMatches; i++) {
      matches.push(
        createMatchNode(
          `R${round}-M${i}-${tournament.join_code}`,
          round,
          "upper",
          [
            { name: `Winner` },
            { name: `Winner` },
            { name: `Winner` },
            { name: `Winner` },
          ],
          `R${round+1}-M${Math.floor(i/2)}-${tournament.join_code}---LB-R${round+1}-M${Math.floor(i/2)}-${tournament.join_code}`
        )
      );
    }

    // Génère les Lower rounds correspondants
    for (let i = 0; i < nextUpperMatches; i++) {

      
      matches.push(
        createMatchNode(
          `LB-R${round}-M${lowerId}-${tournament.join_code}`,
          round,
          "lower",
          [
            { name: `Loser` },
            { name: `Loser` },
            { name: `Loser` },
            { name: `Loser` },
          ],
          `---LB-R${round+1}-M${Math.floor(lowerId/2)}-${tournament.join_code}`
        )
      );
      lowerId++;
      
    }

    upperMatches = nextUpperMatches;
    round++;
  }

  // === Derniers Lower rounds ===
  matches.push(
    createMatchNode(
      `LB-R${round}-M0-${tournament.join_code}`,
      round,
      "lower",
      [
        { name: `Winner` },
        { name: `Winner` },
        { name: `Loser` },
        { name: `Loser` },
      ],
      `R${round + 1}-M0-${tournament.join_code}---`
    )
  );

  // === Finale Upper ===
  matches.push(
    createMatchNode(
      `R${round + 1}-M0-${tournament.join_code}`,
      round + 1,
      "upper",
      [
        { name: `Winner` },
        { name: `Winner` },
        { name: `Winner` },
        { name: `Winner` },
      ],
      null
    )
  );
}
  const test =  matches.map((m) => ({
      id: m.id,
      tournament_id: tournament.id,
      round: m.round,
      joueurs_a : m.players.slice(0, 2),
      joueurs_b :m.players.slice(2, 4),
      format: tournament?.match_format || 'BO1',
      bracket: m.bracket,
      status: m.status,
      match_number : 0,
      score_a: 0,
      score_b :0,
      options : option,
      next_match_id: m.nextMatchId || null,
    }));
  

  return test;
};


  // ==== SWISS ====
  if (option === "swiss") {
  const teams = [...new Set(players.map(p => p.team))];
  let n = teams.length;
  const rounds: MatchNode[][] = [];

  // Si nombre d’équipes impair → on ajoute une équipe "fantôme"
  const hasBye = n % 2 !== 0;
  if (hasBye) {
    teams.push("__BYE__");
    n++;
  }

  const half = n / 2;
  let roundNumber = 1;

  // Round Robin Scheduling (méthode du cercle)
  for (let r = 0; r < n - 1; r++) {
    const round: MatchNode[] = [];
    let matchIndex = 0;
    for (let i = 0; i < half; i++) {
      const teamA = teams[i];
      const teamB = teams[n - 1 - i];

      if (teamA === "__BYE__" || teamB === "__BYE__") continue;

      const playersA = players.filter(p => p.team === teamA).slice(0, 2);
      const playersB = players.filter(p => p.team === teamB).slice(0, 2);

      round.push({
        id: `SWISS-R${roundNumber}-M${matchIndex}-${tournament.join_code}`,
        round: roundNumber,
        bracket: "upper",
        players: [...playersA, ...playersB],
        children: [],
        status: "pending",
        nextMatchId: `SWISS-R${roundNumber + 1}-M${matchIndex}-${tournament.join_code}`,
      });
      matchIndex++;
    }

    rounds.push(round);
    roundNumber++;

    // rotation des équipes (sauf la première)
    const fixed = teams[0];
    const rotating = teams.slice(1);
    rotating.unshift(rotating.pop()!);
    teams.splice(0, teams.length, fixed, ...rotating);
  }

  // Création des objets teams (pour stats)
  const teamsObj: TeamStats[] = teams.map(t => {
  const teamPlayers = players.filter(p => p.team === t).slice(0, 2);
  const name = teamPlayers.map(p => p.name?.slice(0, 5) || "?").join(" & ");
  return {
    name,
    wins: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
  };
});

  // Flatten tous les matchs pour setMatchSwiss
  const matches = rounds.flat();
  
  const test =  matches.map((m) => ({
      id: m.id,
      tournament_id: tournament.id,
      round: m.round,
      joueurs_a : m.players.slice(0, 2),
      joueurs_b :m.players.slice(2, 4),
      format: tournament?.match_format || 'BO1',
      bracket: m.bracket,
      status: m.status,
      match_number : 0,
      score_a: 0,
      score_b :0,
      options : option,
      next_match_id: m.nextMatchId || null,
    }));
  
  
  console.log(teamsObj)
  return { team: teamsObj, test };
};



  return [];
};

const rearrange_match_swiss = async(
  players: Player[],
  allMatches: MatchNode[],
  nombre_match_max: number | null,
  tournament: Tournament
) => {
  const teams = [...new Set(players.map(p => p.team))];
  
  const finishedMatches = allMatches.filter(m => m.status === "finished");
  const roundNumber = Math.max(...finishedMatches.map(m => m.round)) + 1;
  // 1️⃣ Calculer les victoires et le nombre de matchs déjà joués
  const teamStats: Record<string, { wins: number; games: number }> = Object.fromEntries(
  teams.map(t => [t, { wins: 0, games: 0 }])
);
const lastRoundNumber = finishedMatches.length ? Math.max(...finishedMatches.map(m => m.round)) : 0;
const lastRoundMatches = finishedMatches.filter(m => m.round === lastRoundNumber);

const teamsPlayedLastRound = new Set<string>();
for (const m of lastRoundMatches) {
  if (m.joueurs_a?.[0]?.team) teamsPlayedLastRound.add(m.joueurs_a[0].team);
  if (m.joueurs_b?.[0]?.team) teamsPlayedLastRound.add(m.joueurs_b[0].team);
}

// Toutes les équipes actives


// Trouver l’équipe impaire qui n’a pas joué

console.log(teamStats)

for (const match of allMatches) {
  if (match.status !== "finished") continue;

  const teamA = match.joueurs_a?.[0]?.team;
  const teamB = match.joueurs_b?.[0]?.team;
  const scoreA = match.score_a ?? 0;
  const scoreB = match.score_b ?? 0;

  // Vérifie qu'on a bien les deux équipes
  if (!teamA || !teamB || !teamStats[teamA] || !teamStats[teamB]) continue;

  // Match joué = +1 pour chaque équipe
  teamStats[teamA].games += 1;
  teamStats[teamB].games += 1;

  // Victoire / défaite
  if (scoreA > scoreB) {
    teamStats[teamA].wins += 1;
  } else if (scoreB > scoreA) {
    teamStats[teamB].wins += 1;
  }
}

  // 2️⃣ On garde seulement les équipes n’ayant pas atteint leur quota
  console.log(teamStats)
  const activeTeams = teams.filter(
    t => nombre_match_max === null || teamStats[t].games < nombre_match_max
  );
  const unpairedTeam = activeTeams.find(t => !teamsPlayedLastRound.has(t));

  if (activeTeams.length < 2) {
    console.log('tournoi fini')
    return handleFinishTournament(); // plus assez d’équipes pour un match
  }
  // 3️⃣ On trie les équipes par nombre de victoires (classement suisse)
  const sortedTeams = [...activeTeams].sort(
    (a, b) => teamStats[b].wins - teamStats[a].wins
  );

  const sortedteamrev = sortedTeams.reverse()

  if (unpairedTeam) {
  // On la met en première priorité dans sortedTeams
  sortedteamrev.sort((a, b) => (a === unpairedTeam ? -1 : b === unpairedTeam ? 1 : 0));
}
  // 4️⃣ Historique des paires déjà jouées
  const alreadyPlayed = new Set<string>();
  for (const m of allMatches) {
    if (m.status !== "finished") continue;
    const teamA = m.joueurs_a[0].team;
    const teamB = m.joueurs_b[0].team;
    if (teamA && teamB) {
      alreadyPlayed.add([teamA, teamB].sort().join("_"));
    }
  }

  // 5️⃣ Création du nouveau round (matchs entre équipes proches)
  const newRound: MatchNode[] = [];
  const usedTeams = new Set<string>();

  for (let i = 0; i < sortedTeams.length - 1; i++) {
    const teamA = sortedteamrev[i];
    if (usedTeams.has(teamA)) continue;

    // Cherche une équipe proche en score qui n’a pas encore été jouée
    const opponent = sortedteamrev.slice(i + 1).find(teamB => {
      return (
        !usedTeams.has(teamB) &&
        !alreadyPlayed.has([teamA, teamB].sort().join("_"))
      );
    });

    if (!opponent) continue;

    const playersA = players.filter(p => p.team === teamA).slice(0, 2);
    const playersB = players.filter(p => p.team === opponent).slice(0, 2);

    newRound.push({
      id: `SWISS-R${roundNumber}-M${newRound.length}-${tournament.join_code}`,
      round: roundNumber,
      bracket: "upper",
      joueurs_a: playersA, // ✅ équipe A
      joueurs_b: playersB,
      children: [],
      status: "pending",
      nextMatchId: `SWISS-R${roundNumber + 1}-M${newRound.length}-${tournament.join_code}`,
      score_a : 0,
      score_b : 0,
      format : tournament.match_format,
      tournament_id : tournament.id,
      options: 'swiss',
      changed : true,
    });

    usedTeams.add(teamA);
    usedTeams.add(opponent);
  }
  console.log('omg regarde : ',newRound)
  console.log('eteeeeee : ', [...finishedMatches, ...newRound] )

  if (newRound.length > 0) {
  for (const match of newRound) {
  const { error } = await supabase
    .from("tournament_matches")
    .update({
      round: match.round,
      bracket: match.bracket,
      joueurs_a: match.joueurs_a,
      joueurs_b: match.joueurs_b,
      match_number: 0,
      status: match.status,
      next_match_id: match.nextMatchId,
      score_a: match.score_a,
      score_b: match.score_b,
      format: match.format,
      tournament_id: match.tournament_id,
      options: match.options,
      changed: match.changed,
    })
    .eq("id", match.id)
    .eq("tournament_id",match.tournament_id);

  if (error) console.error(`❌ Erreur update match ${match.id}:`, error);
}
console.log("✅ Tous les matchs mis à jour !");
  
}

  setRefreshKey(prev => prev + 1);
}


console.log(teamSwiss)
console.log(matchSwiss)
  if (loading)
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center bg-green-950 text-white"
      style={{
        backgroundImage: `
          radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px),
          radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)
        `,
        backgroundPosition: "0 0, 10px 10px",
        backgroundSize: "20px 20px",
      }}
    >
      {/* Spinner animé */}
      <div className="relative mb-6">
        <div className="w-14 h-14 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-green-200 font-bold text-lg">🂡</span>
        </div>
      </div>

      {/* Texte animé */}
      <p className="text-lg font-medium text-green-100 animate-pulse">
        Chargement du tournoi...
      </p>

      {/* Petit texte d’ambiance */}
      <p className="mt-3 text-sm text-green-400 opacity-80 italic">
        Préparation des cartes et des équipes ♣️♦️♥️♠️
      </p>
    </div>
  );

  if (!tournament) {
  // ✅ Détection d'une confusion entre O et 0
  const containsConfusion = /[O0]/.test(code);
  const suggestedCode = containsConfusion
    ? code
        .split("")
        .map((c) => (c === "O" ? "0" : c === "0" ? "O" : c))
        .join("")
    : null;

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center bg-green-950 text-white"
      style={{
        backgroundImage: `
          radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px),
          radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)
        `,
        backgroundPosition: "0 0, 10px 10px",
        backgroundSize: "20px 20px",
      }}
    >
      {/* Icône principale */}
      <div className="relative mb-6">
        <div className="w-14 h-14 border-4 border-red-400 border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-red-200 font-bold text-lg">🂱</span>
        </div>
      </div>

      {/* Message principal */}
      <p className="text-lg font-semibold text-red-300 mb-2">
        Tournoi introuvable
      </p>

      <p className="text-lg font-semibold text-red-300 mb-2">
        Le code est potentiellement incorrect ! 
      </p>
      <p className="text-sm text-red-400 text-center max-w-sm px-4">
          Vous avez essayé le code : <span className="font-mono">{code}</span>
      </p>

      {/* Suggestion si confusion possible */}
      {suggestedCode && (
        <p className="text-sm text-red-400 text-center max-w-sm px-4">
         
          Essayez peut-être avec ce code :{" "}
          <span className="font-mono font-semibold text-white">{suggestedCode}</span>
        </p>
      )}

      {/* Bouton retour */}
      <div className="mt-6">
        <button
          onClick={() => navigateTo("jointournoi")}
          className="flex flex-col items-center justify-center w-[60px] h-[60px] rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md active:scale-95 active:shadow-sm transition-all"
        >
          <ArrowLeft className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Retour</span>
        </button>
      </div>
    </div>
  );
}

const roundsMap: { [round: number]: MatchNode[] } = {};








if (tournament.options === 'single' || tournament.options === 'double') {
  existingMatches.forEach((m) => {
    if (!roundsMap[m.round]) roundsMap[m.round] = [];

    // 🔹 Vérifie si le match est déjà présent
    const alreadyExists = roundsMap[m.round].some(existing => existing.id === m.id);
    if (!alreadyExists) {
      roundsMap[m.round].push(m);
    }
  });

  
}

console.log(roundsMap)






const rounds = Object.keys(roundsMap)
  .map(Number)
  .sort((a, b) => a - b);


const MatchCard = ({ match }: { match: MatchNode }) => {
  const borderColor =
    match.bracket === "upper" ? "border-green-500" : "border-red-500";
  const textColor =
    match.bracket === "upper" ? "text-green-700" : "text-red-700";
  const color = 
  match.bracket === "upper" ? "bg-green-200" : "bg-red-200";

  return (
    <div
      className={`
        bg-white shadow-md rounded-2xl p-3 mb-3 w-full max-w-[260px]
        border-t-4 ${match.bracket === "upper" ? "border-t-green-500" : "border-t-red-500"}
        transition-all duration-200 hover:scale-[1.02]
      `}
    >
      <div className="flex justify-between items-center">
        {/* === TEAM A === */}
        <div className="flex flex-col gap-2 w-2/5">
          {match.joueurs_a.slice(0, 2).map((p, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className = "relative w-9 h-9">
              {p?.profile_picture ? (
                <img
                  src={p.profile_picture}
                  alt={p.name}
                  className={`w-9 h-9 rounded-full border-2 ${borderColor} object-cover`}
                />
              ) : (
                <div
                  className={`w-9 h-9 flex items-center justify-center rounded-full border-2 ${borderColor} ${color} text-gray-700`}
                >
                  {p?.name && p.name !== "À déterminer" ? p.name[0] : <User size={16} />}
                </div>
              )}
              {p?.frames && (
                  <img
                    src={availableFrames[Number(p?.frames) - 1]?.image}
                    alt="Cadre décoratif"
                    className="absolute -inset-0 w-auto h-auto pointer-events-none"
                    style={{
                                              transform: `scale(${availableFrames[Number(p?.frames) - 1]?.scale || 1})`, // par défaut scale 1 si non défini
                                            }}
                  />
                )}
              </div>
              <span className="font-semibold text-sm text-gray-800 truncate max-w-[60px]">
                {p?.name
                  ? p.name === "À déterminer"
                    ? "À det"
                    : p.name.slice(0, 8)
                  : "À det"}
              </span>
            </div>
          ))}
        </div>

        {/* === SCORE === */}
        <div className="flex flex-col items-center justify-center w-[60px]">
          <div
            className={`
              text-sm font-bold ${textColor} px-2 py-1 rounded-md bg-gray-50 border border-gray-200
            `}
          >
            {match.status === "finished"
              ? `${match.score_a} - ${match.score_b}`
              : "⏳"}
          </div>
          <span className="text-[10px] text-gray-400 mt-1 uppercase">
            {match.bracket === "upper" ? "Upper" : "Lower"}
          </span>
        </div>

        {/* === TEAM B === */}
        <div className="flex flex-col gap-2 w-2/5 items-end">
          {match.joueurs_b.slice(0, 2).map((p, idx) => (
            <div key={idx} className="flex items-center gap-2 flex-row-reverse">
              <div className = ' relative w-9 h-9'>
              {p?.profile_picture ? (
                <img
                  src={p.profile_picture}
                  alt={p.name}
                  className={`w-9 h-9 rounded-full border-2 ${borderColor} object-cover`}
                />
              ) : (
                <div
                  className={`w-9 h-9 flex items-center justify-center rounded-full border-2 ${borderColor} ${color} text-gray-700`}
                >
                  {p?.name && p.name !== "À déterminer" ? p.name[0] : <User size={16} />}
                </div>
              )}
              {p?.frames && (
                  <img
                    src={availableFrames[Number(p.frames) - 1]?.image}
                    alt="Cadre décoratif"
                    className="absolute -inset-0 w-auto h-auto pointer-events-none"
                    style={{
                                              transform: `scale(${availableFrames[Number(p.frames) - 1]?.scale || 1})`, // par défaut scale 1 si non défini
                                            }}
                  />
                )}
              </div>
              <span className="font-semibold text-sm text-gray-800 truncate max-w-[60px] text-right">
                {p?.name
                  ? p.name === "À déterminer"
                    ? "À det"
                    : p.name.slice(0, 8)
                  : "À det"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 🔹 Suppose que tu as round.current et roundMax définis

if (tournament.options === 'swiss' && tournament.maxMatches) {
  const currentRound = round.current;
  const currentRoundMatches = existingMatchesSM.filter(m => m.round === currentRound);
  const allFinished = currentRoundMatches.length > 0 && currentRoundMatches.every(m => m.status === "finished");

  if (allFinished ) {
    round.current = currentRound + 1;
    // Génère les prochains matchs avec ta fonction
    rearrange_match_swiss(tournament.players, existingMatches, tournament.maxMatches,  tournament);

    // Mets à jour existingMatches avec les anciens (fini) + les nouveaux
    

    // Passe au round suivant
    
    

    
  }
  
}
console.log(existingMatchesSM)
console.log(existingMatches)

  return (
    
    
    <div
      className="min-h-screen w-full flex items-center justify-center px-4 py-safe bg-green-950"
      style={{
        backgroundImage: `
          radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px),
          radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)
        `,
        backgroundPosition: "0 0, 10px 10px",
        backgroundSize: "20px 20px",
      }}
    >
      {showPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-80 text-center">
            <h2 className="text-lg font-semibold mb-4">Qui êtes-vous ?</h2>
            <div className="flex flex-col gap-3">
              {detPlayers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPlayer(p)}
                  className="py-2 px-4 rounded-lg border border-green-300 hover:bg-green-600 hover:text-green transition"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl w-full bg-white/90 text-green-900 rounded-xl p-6 space-y-6 mt-10 mb-2" style={{ top: 'calc(1.5rem + env(safe-area-inset-top))' }}>
        {/* Header */}
        <div className="flex items-center">
          
          
          <div className="w-8" />
        </div>

        {/* Info Tournoi */}
        <div className="bg-green-50 rounded-xl p-2 shadow-md">
           
          <div className="w-full flex flex-wrap justify-center gap-4 mb-4 px-2">
  {/* 🔙 Retour */}
  <button
    onClick={() => navigateTo("tournoi")}
    className="flex flex-col items-center justify-center w-[60px] h-[60px] rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md active:scale-95 active:shadow-sm transition-all"
  >
    <ArrowLeft className="w-5 h-5 mb-1" />
    <span className="text-[10px] font-medium">Retour</span>
  </button>

  {/* 📊 Stats */}
  <button
    onClick={() => navigateTo2("tournamentStats", { code: tournament.id })}
    className="flex flex-col items-center justify-center w-[60px] h-[60px] rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-md active:scale-95 active:shadow-sm transition-all"
  >
    <BarChart className="w-5 h-5 mb-1" />
    <span className="text-[10px] font-medium">Stats</span>
  </button>

  {/* 🕓 Historique */}
  <button
    onClick={() => navigateTo2("tournamentHistory", {code : tournament.join_code})}
    className="flex flex-col items-center justify-center w-[60px] h-[60px] rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md active:scale-95 active:shadow-sm transition-all"
  >
    <Clock className="w-5 h-5 mb-1" />
    <span className="text-[10px] font-medium">Historique</span>
  </button>

  {/* 🔄 Refresh */}
  <button
    onClick={() => setRefreshKey(prev => prev + 1)}
    className="flex flex-col items-center justify-center w-[60px] h-[60px] rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md active:scale-95 active:shadow-sm transition-all"
  >
    <RefreshCw className="w-5 h-5 mb-1" />
    <span className="text-[10px] font-medium">Refresh</span>
  </button>

  {/* 🏁 Finir tournoi (organisateur uniquement) */}
  {gameState.currentUser?.id === tournament.organizer_id && (
    <button
      onClick={() => setShowConfirm(true)}
      className="flex flex-col items-center justify-center w-[60px] h-[60px] rounded-full bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-md active:scale-95 active:shadow-sm transition-all"
    >
      <Flag className="w-5 h-5 mb-1" />
      <span className="text-[10px] font-medium">Finir</span>
    </button>
  )}
</div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white text-green-900 rounded-2xl p-6 w-[90%] max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-2 text-center">Finir le tournoi ?</h2>
            <p className="text-sm text-gray-700 mb-6 text-center">
              Cette action marquera <strong>tous les matchs comme terminés</strong> et rendra le tournoi inactif.
              Êtes-vous sûr de vouloir continuer ?
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-lg border border-gray-400 hover:bg-gray-100"
              >
                Annuler
              </button>
              <button
                onClick={handleFinishTournament}
                disabled={loadingFinish}
                className="px-5 py-2 rounded-lg bg-purple-700 text-white hover:bg-purple-800 transition disabled:opacity-50"
              >
                {loadingFinish ? "Patientez..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
)}



          <div className="w-full flex flex-col justify-between items-center mb-5">
            
  {/* Nom du tournoi */}
  <h1 className="text-3xl md:text-4xl font-extrabold text-green-800 mb-4 text-center">
    {tournament.name || "Nom du tournoi"}
  </h1>

  {/* Code du tournoi */}
  <div className="flex items-center gap-3 bg-green-100 px-4 py-2 rounded-xl shadow-md">
    <span className="text-green-700 font-semibold">Code du tournoi :</span>
    <span className="font-mono bg-green-200 px-3 py-1 rounded text-green-900">
      {tournament.join_code}
    </span>
  </div>
</div>

          <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm text-green-900">
  <div className="flex items-center gap-2 bg-green-100 px-3 py-1.5 rounded-lg shadow-sm">
    <Trophy className="w-5 h-5 text-green-700" />
    <span>Mode : {tournament.mode}</span>
  </div>

  <div className="flex items-center gap-2 bg-green-100 px-3 py-1.5 rounded-lg shadow-sm">
    <Users className="w-5 h-5 text-green-700" />
    <span>{tournament.total_players} joueurs</span>
  </div>

  <div className="flex items-center gap-2 bg-green-100 px-3 py-1.5 rounded-lg shadow-sm">
    <Clock className="w-5 h-5 text-green-700" />
    <span>{tournament.match_format}</span>
  </div>
  <div className="flex items-center gap-2 bg-green-100 px-3 py-1.5 rounded-lg shadow-sm">
    <Goal className="w-5 h-5 text-green-700" />
    <span>Objectif : {tournament.targetPoints}</span>
  </div>

  <div className="flex items-center gap-2 bg-green-100 px-3 py-1.5 rounded-lg shadow-sm">
    <span>{tournament.options === 'double' ? "Double élimination" : tournament.options === 'single' ? "Élimination directe" : "Swiss"}</span>
  </div>
</div>

        </div>
{gameState.currentUser?.id === tournament.organizer_id && (
  <div className="flex items-start gap-3 bg-green-100 border border-green-300 text-green-800 rounded-xl p-3 mb-3 shadow-sm">
    <div className="flex-shrink-0 mt-0.5">
      <Shield size={20} className="text-green-700" />
    </div>

    <div className="text-sm leading-snug flex-1">
      <p className="font-semibold text-green-900">
        Vous êtes l’organisateur du tournoi
      </p>
      <p className="mt-1 text-green-800">
        Vous avez accès aux boutons{" "}
        <span className="inline-flex items-center gap-1 font-semibold text-green-900">
          <Settings size={14} className="text-green-700" /> Modifier
        </span>{" "}
        et{" "}
        <span className="inline-flex items-center gap-1 font-semibold text-green-900">
          <Flag size={14} className="text-green-700" /> Forfait / Fin du tournoi
        </span>
        .
      </p>
    </div>
  </div>
)}


  {tournament.options === 'swiss' && existingMatches.length > 0 && (existingMatches.every(m => m.status === "finished") || (tournament.maxMatches && existingMatchesSM.length===teamSwiss.length*tournament.maxMatches && existingMatchesSM.every(m => m.status === "finished"))) && (
  <div className="text-center mb-8 px-4">
    <h2 className="text-2xl font-extrabold text-green-800 mb-6 tracking-tight">
      🏁 Tournoi terminé !
    </h2>

    {/* 🥇 Podium */}
    <div className="flex justify-center items-end gap-4 mt-4">
      {teamSwiss
        .sort((a, b) => {
          const diffA = (a.pointsFor ?? 0) - (a.pointsAgainst ?? 0);
          const diffB = (b.pointsFor ?? 0) - (b.pointsAgainst ?? 0);
          if ((b.wins ?? 0) !== (a.wins ?? 0)) return (b.wins ?? 0) - (a.wins ?? 0);
          return diffB - diffA;
        })
        .slice(0, 3)
        .map((team, idx) => {
          const isFirst = idx === 0;
          const isSecond = idx === 1;
          const isThird = idx === 2;

          const colors = isFirst
            ? "from-yellow-300 to-yellow-500 shadow-yellow-400/40"
            : isSecond
            ? "from-gray-300 to-gray-500 shadow-gray-400/40"
            : "from-amber-600 to-amber-800 shadow-amber-700/40";

          return (
            <div
              key={team.name}
              className={`flex flex-col items-center justify-end transition-transform active:scale-95 ${
                isFirst ? "order-2 scale-110" : isSecond ? "order-1 translate-y-3" : "order-3 translate-y-5"
              }`}
            >
              {/* Avatar cercle avec gradient */}
              <div
                className={`w-16 h-16 rounded-full bg-gradient-to-br ${colors} shadow-md flex items-center justify-center border-2 border-white`}
              >
                <span className="text-white font-extrabold text-xl">
                  {team.name?.[0] ?? "?"}
                </span>
              </div>

              {/* Nom d’équipe */}
              <span className="mt-2 font-bold text-green-900 text-sm">
                {team.name}
              </span>

              {/* Stats */}
              <span className="text-xs text-gray-600">
                {team.wins ?? 0} victoire{team.wins > 1 ? "s" : ""}
              </span>
            </div>
            
          );
          
        })}
    </div>

    {/* 🎖️ Petit résumé global */}
    <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-3 shadow-sm">
      <p className="text-sm text-green-900 font-medium leading-snug">
        Félicitations à <span className="font-bold text-green-700">{teamSwiss[0]?.name}</span> 🏆 pour leur victoire !
        <br />
        Merci à toutes les équipes pour leur participation 💚
      </p>
    </div>
  </div>
)}
{tournament.options !== 'swiss' && existingMatches.length > 0 && (existingMatches.every(m => m.status === "finished")) && (
<div className="mt-10 w-full">
    {existingMatches.every((m) => m.status === "finished") && (() => {
  // On récupère les rounds triés du plus petit au plus grand
  const sortedMatches = [...existingMatches].sort((a, b) => a.round - b.round);
  const lastRound = Math.max(...sortedMatches.map(m => m.round));
  const prevRound = lastRound - 1;

  // On récupère les matchs du dernier round
  const lastRoundMatches = sortedMatches.filter(m => m.round === lastRound);
  // Puis ceux de l'avant-dernier round
  const prevRoundMatches = sortedMatches.filter(m => m.round === prevRound);

  // --- 1️⃣ Détermination du vainqueur du tournoi
  // (s’il y a plusieurs matchs, on prend celui avec le score max)
  const finalWinnerMatch = lastRoundMatches.reduce((best, m) => {
    const score = Math.max(m.score_a ?? 0, m.score_b ?? 0);
    return !best || score > Math.max(best.score_a ?? 0, best.score_b ?? 0) ? m : best;
  }, null as any);

  const winnerTeam =
    (finalWinnerMatch?.score_a ?? 0) > (finalWinnerMatch?.score_b ?? 0)
      ? finalWinnerMatch.joueurs_a
      : finalWinnerMatch.joueurs_b;

  // --- 2️⃣ Deuxième place = l’équipe qui a perdu en finale
  const secondTeam =
    (finalWinnerMatch?.score_a ?? 0) < (finalWinnerMatch?.score_b ?? 0)
      ? finalWinnerMatch.joueurs_a
      : finalWinnerMatch.joueurs_b;

  // --- 3️⃣ Troisième place = parmi les perdants de l’avant-dernier round
  // on prend celui avec le plus haut score
  let thirdMatches: any[] = [];

if (prevRoundMatches.length > 0) {
  // On calcule le score du perdant pour chaque match
  const losingScores = prevRoundMatches.map((m) => {
    const losingScore =
      (m.score_a ?? 0) > (m.score_b ?? 0)
        ? m.score_b ?? 0
        : m.score_a ?? 0;
    return { match: m, losingScore };
  });

  // Score max parmi les perdants
  const bestLosingScore = Math.max(...losingScores.map((x) => x.losingScore));

  // On garde tous les matchs ex aequo
  thirdMatches = losingScores
    .filter((x) => x.losingScore === bestLosingScore)
    .map((x) => x.match);
}

// Si plusieurs équipes ex aequo à la 3e place, on les fusionne
const thirdTeam = thirdMatches.flatMap((m) => {
  const losingTeam =
    (m.score_a ?? 0) > (m.score_b ?? 0) ? m.joueurs_b : m.joueurs_a;
console.log(losingTeam)
console.log(winnerTeam)
console.log(secondTeam)
  return losingTeam || [];
});

  // Fonction utilitaire pour afficher les photos (ou fallback)
  const renderTeam = (team: any, size: string) => (
    <div className="flex -space-x-2">
  {team?.map((p: any, idx: number) => (
    p?.profile_picture && typeof p.profile_picture === "string" && p.profile_picture.length > 0 ? (
      <img
        key={idx}
        src={p.profile_picture}
        alt={p.name}
        className={`${size} rounded-full border-2 border-white shadow-md object-cover`}
      />
    ) : (
      <div
        key={idx}
        className={`${size} flex items-center justify-center rounded-full border border-green-700 bg-gray-200 shadow-sm`}
      >
        {p?.name && p.name !== "À déterminer" ? (
          <span className="text-sm font-medium text-green-900">
            {p.name[0]}
          </span>
        ) : (
          <User size={14} className="text-green-700" />
        )}
      </div>
    )
  ))}
</div>
  );

  return (
    <div className="mt-12 p-6 bg-green-50 border border-green-200 rounded-2xl text-center shadow-md">
      <h3 className="text-3xl font-bold text-green-800 mb-4">
        🏆 Tournoi terminé !
      </h3>
      <p className="text-green-700 mb-6 font-medium">
        Félicitations à tous les participants !
      </p>

      {/* Podium */}
      <div className="flex justify-center items-end gap-6">
        {/* 2e */}
        <div className="flex flex-col items-center">
          <span className="text-xl font-semibold text-gray-600">🥈</span>
          <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-full border-4 border-gray-400">
            {renderTeam(secondTeam, "w-8 h-8")}
          </div>
          <span className="mt-2 text-sm text-gray-700">2e place</span>
        </div>

        {/* 1er */}
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-yellow-500">🥇</span>
          <div className="w-24 h-24 flex items-center justify-center bg-yellow-100 rounded-full border-4 border-yellow-400">
            {renderTeam(winnerTeam, "w-10 h-10")}
          </div>
          <span className="mt-2 text-sm text-yellow-700">1ère place</span>
        </div>

        {/* 3e */}
        <div className="flex flex-col items-center">
          <span className="text-xl font-semibold text-orange-600">🥉</span>
          <div className="w-16 h-16 flex items-center justify-center bg-orange-100 rounded-full border-4 border-orange-400">
            {renderTeam(thirdTeam, "w-7 h-7")}
          </div>
          <span className="mt-2 text-sm text-orange-700">3e place</span>
        </div>
      </div>
    </div>
  );
})()}
</div>)}

  <h2 className="flex items-center justify-center gap-2 text-2xl md:text-3xl font-bold text-green-800 mb-6 text-center">
  {tournament.options === "swiss" ? (
    <>
      <Layers3 size={26} className="text-green-700" />
      Classement (Swiss Stage)
    </>
  ) : (
    <>
      <Network size={26} className="text-green-700" />
      Arbre du tournoi
    </>
  )}
</h2>
  <div className="w-full overflow-x-auto py-6">
  {/* ==== SWISS STAGE ==== */}
  {tournament.options === "swiss" ? (
    
  <div className="px-4 py-2">
    {/* 🌐 TABLEAU visible seulement sur écran moyen et + */}
    <div className="hidden md:flex justify-center overflow-x-auto">
      <table className="min-w-[700px] bg-white shadow-md rounded-xl overflow-hidden">
        <thead className="bg-green-700 text-white">
          <tr>
            <th className="px-4 py-3 text-left">#</th>
            <th className="px-4 py-3 text-left">Équipe</th>
            <th className="px-4 py-3 text-center">Matchs</th>
            <th className="px-4 py-3 text-center">Score cumulé</th>
            <th className="px-4 py-3 text-center">Différence</th>
          </tr>
        </thead>
        <tbody>
          {teamSwiss
            .sort((a, b) => {
              const diffA = (a.pointsFor ?? 0) - (a.pointsAgainst ?? 0);
              const diffB = (b.pointsFor ?? 0) - (b.pointsAgainst ?? 0);
              if ((b.wins ?? 0) !== (a.wins ?? 0)) return (b.wins ?? 0) - (a.wins ?? 0);
              return diffB - diffA;
            })
            .map((team, index) => {
              const bgColor =
                index === 0
                  ? "bg-yellow-100"
                  : index === 1
                  ? "bg-gray-100"
                  : index === 2
                  ? "bg-orange-100"
                  : index % 2 === 0
                  ? "bg-gray-50"
                  : "bg-white";

              return (
                <tr key={team.id} className={`border-b hover:bg-green-50 transition-colors ${bgColor}`}>
                  <td className="px-4 py-2 font-semibold text-gray-700">{index + 1}.</td>
                  <td className="px-4 py-2 font-semibold text-green-800">{team.name}</td>
                  <td className="px-4 py-2 text-center">
                    {team.wins ?? 0}-{team.losses ?? 0}
                  </td>
                  <td className="px-4 py-2 text-center font-medium text-gray-800">
                    {team.pointsFor ?? 0}-{team.pointsAgainst ?? 0}
                  </td>
                  <td
                    className={`px-4 py-2 text-center font-semibold ${
                      (team.pointsFor ?? 0) - (team.pointsAgainst ?? 0) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {(team.pointsFor ?? 0) - (team.pointsAgainst ?? 0) >= 0 ? "+" : ""}
                    {(team.pointsFor ?? 0) - (team.pointsAgainst ?? 0)}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>

    {/* 📱 VERSION MOBILE : cartes empilées */}
    <div className="flex flex-col gap-3 md:hidden mt-2">
      {teamSwiss
        .sort((a, b) => {
          const diffA = (a.pointsFor ?? 0) - (a.pointsAgainst ?? 0);
          const diffB = (b.pointsFor ?? 0) - (b.pointsAgainst ?? 0);
          if ((b.wins ?? 0) !== (a.wins ?? 0)) return (b.wins ?? 0) - (a.wins ?? 0);
          return diffB - diffA;
        })
        .map((team, index) => {
          const diff = (team.pointsFor ?? 0) - (team.pointsAgainst ?? 0);
          const color =
            index === 0
              ? "bg-yellow-100"
              : index === 1
              ? "bg-gray-100"
              : index === 2
              ? "bg-orange-100"
              : "bg-white";

          return (
            <div
              key={team.id}
              className={`rounded-xl shadow-sm p-4 border ${color} flex flex-col`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-green-800">
                  #{index + 1} {team.name}
                </span>
                <span
                  className={`font-bold ${
                    diff >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {diff >= 0 ? "+" : ""}
                  {diff}
                </span>
              </div>

              <div className="flex justify-between text-sm mt-2 text-gray-700">
                <span>Matchs : {team.wins ?? 0}-{team.losses ?? 0}</span>
                <span>Score : {team.pointsFor ?? 0}-{team.pointsAgainst ?? 0}</span>
              </div>
            </div>
          );
        })}
    </div>
  </div>
): (
    /* ==== SINGLE / DOUBLE ELIMINATION ==== */
    <div className="flex px-4 gap-16 min-w-max relative">
        
      {rounds.map((r, roundIdx) => {
        const upper = roundsMap[r].filter((m) => m.bracket === "upper");
        const lower = roundsMap[r].filter((m) => m.bracket === "lower");

        return (
          <div key={r} className="flex flex-col items-center gap-10 min-w-[280px]">
            {/* Titres Upper */}
            {upper.length > 0 && (
              <h3 className="font-semibold text-green-700 text-lg text-center mb-2">
                {upper.length === 1 && roundIdx === rounds.length - 1
                  ? "Finale Upper"
                  : upper.length === 2 && roundIdx === rounds.length - 2
                  ? "Demi-finales Upper"
                  : `Round ${r} Upper`}
              </h3>
            )}

            {/* Upper bracket */}
            <div className="flex flex-col gap-10 relative">
              {upper.map((m) => (
                <div key={m.id} className="relative">
                  <MatchCard match={m} />
                  {roundIdx < rounds.length - 1 && (
                    <div className="absolute top-1/2 -right-10 w-10 border-t-2 border-green-300" />
                  )}
                </div>
              ))}
            </div>

            {/* Titres Lower */}
            {lower.length > 0 && (
              <h3 className="font-semibold text-red-700 text-lg text-center mt-6">
                {lower.length === 1 && roundIdx === rounds.length - 1
                  ? "Finale Lower"
                  : lower.length === 2 && roundIdx === rounds.length - 2
                  ? "Demi-finales Lower"
                  : `Round ${r} Lower`}
              </h3>
            )}

            {/* Lower bracket */}
            {lower.length > 0 && (
              <div className="flex flex-col gap-10 relative mt-2">
                {lower.map((m) => (
                  <div key={m.id} className="relative">
                    <MatchCard match={m} />
                    {roundIdx < rounds.length - 1 && (
                      <div className="absolute top-1/2 -right-10 w-10 border-t-2 border-red-300" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  )}
</div>


{tournament.options === "swiss" && (
  <section className="mt-6 w-full flex flex-col gap-8">
    <h2 className="text-2xl font-bold text-green-800 mb-4 text-center">
      🏆 Matchs à venir - Swiss Stage
    </h2>

    {(() => {
      
      const matchesByRound = existingMatchesSM.length > 0 ? existingMatchesSM : existingMatches;
      const roundsMap = new Map<number, any[]>();

matchesByRound.forEach((m) => {
  const roundNum = m.round ?? 0;
  if (!roundsMap.has(roundNum)) roundsMap.set(roundNum, []);
  roundsMap.get(roundNum)!.push(m);
});

// 2️⃣ Vérifier quels rounds sont entièrement terminés
for (const [roundNum, matches] of roundsMap.entries()) {
  const allFinished = matches.every((m) => m.status === "finished");
  if (allFinished) {
    // 3️⃣ Si tout est fini → passer les matchs en status = 99
    matches.forEach((m) => {
      m.round = 99;
    });
  }
}

// 4️⃣ Aplatir et réassigner la liste
const matchToPlay = Array.from(roundsMap.values()).flat();
      const rounds = Object.entries(
        matchToPlay.reduce((acc: Record<number, MatchNode[]>, m: MatchNode) => {
          acc[m.round] = acc[m.round] || [];
          acc[m.round].push(m);
          return acc;
        }, {})
      ).sort(([a], [b]) => Number(a) - Number(b));

      
      const maxMatches = tournament.maxMatches;
      
      const currentRound = round.current
      // 📊 Compter les matchs joués par équipe
      const teamMatchCounts: Record<string, number> = {};
      matchToPlay.forEach((m) => {
        if (m.status === "finished") {
          const teamsInMatch = [
            ...(m.joueurs_a || []).map((p) => p.team),
            ...(m.joueurs_b || []).map((p) => p.team),
          ].filter(Boolean);
          for (const team of teamsInMatch) {
            teamMatchCounts[team] = (teamMatchCounts[team] || 0) + 1;
          }
        }
      });

      return (
        <>
          {rounds.map(([round, matches]) => {
            if (maxMatches && (Number(round) > currentRound && Number(round)!== 99)) return null;

            return (
              <div key={round} className="flex flex-col gap-4">
                <h3 className="text-xl font-semibold text-green-700 text-center mb-2 border-b-2 border-green-200 pb-1">
                  {Number(round) === 99 ? "Matchs Terminés" : `Round ${round}`}
                </h3>

                {matches.map((m) => {
                  const allPlayers = [...(m.joueurs_a || []), ...(m.joueurs_b || [])];
                  const teamA = m.joueurs_a || [];
                  const teamB = m.joueurs_b || [];
                  const isUserInMatch = allPlayers.some(
                    (p) => String(p.id) === String(gameState.currentUser?.id)
                  );
                  const isongoing = m.status === "ongoing"
                  
                  

                  // 🚫 Vérifier limite de matchs
                  
                  const isFinished = m.status === "finished" 
                  

                  return (
                    <div
                      key={m.id}
                      className={`relative flex flex-col gap-3 rounded-xl p-4 shadow-sm border transition-all duration-300 ${
                        isFinished
                          ? "bg-gray-100 border-gray-300"
                          
                          : "bg-green-50 border-green-200"
                      }`}
                    >
                      
                      

                      {/* 🧑‍🤝‍🧑 Équipes */}
                      <div className="flex items-center justify-center gap-6">
                        {/* Team A */}
                        <div className="flex items-center gap-2">
                          {teamA.map((p, idx) => (
  <div
    key={idx}
    className="relative w-10 h-10 rounded-full flex items-center justify-center"
  >
    {/* Image ou initiale */}
    {p?.profile_picture ? (
      <img
        src={p.profile_picture}
        alt={p.name}
        className="object-cover w-10 h-10 rounded-full"
      />
    ) : (
      <span className="font-bold text-green-800 text-sm">
        {p?.name ? p.name[0].toUpperCase() : "?"}
      </span>
    )}

    {/* Cadre décoratif par-dessus l'image */}
    {p?.frames && (
      <img
        src={availableFrames[Number(p.frames) - 1]?.image}
        alt="Cadre décoratif"
        className="absolute inset-0 w-10 h-10 rounded-full pointer-events-none"
        style={{
          transform: `scale(${
            availableFrames[Number(p.frames) - 1]?.scale || 1.1
          })`, // légère mise à l'échelle du cadre
        }}
      />
    )}

    {/* Bordure de base (si tu veux garder ton style d'avant) */}
    <div className="absolute inset-0 rounded-full border-2 border-green-500 pointer-events-none"></div>
  </div>
))}

                        </div>

                        <div className="text-green-600 font-extrabold text-lg tracking-widest">
                          VS
                        </div>

                        {/* Team B */}
                        <div className="flex items-center gap-2">
                          {teamB.map((p, idx) => (
  <div
    key={idx}
    className="relative w-10 h-10 rounded-full flex items-center justify-center"
  >
    {/* Image ou initiale */}
    {p?.profile_picture ? (
      <img
        src={p.profile_picture}
        alt={p.name}
        className="object-cover w-10 h-10 rounded-full"
      />
    ) : (
      <span className="font-bold text-green-800 text-sm">
        {p?.name ? p.name[0].toUpperCase() : "?"}
      </span>
    )}

    {/* Cadre décoratif par-dessus l'image */}
    {p?.frames && (
      <img
        src={availableFrames[Number(p.frames) - 1]?.image}
        alt="Cadre décoratif"
        className="absolute inset-0 w-10 h-10 rounded-full pointer-events-none"
        style={{
          transform: `scale(${
            availableFrames[Number(p.frames) - 1]?.scale || 1.1
          })`, // légère mise à l'échelle du cadre
        }}
      />
    )}

    {/* Bordure de base (si tu veux garder ton style d'avant) */}
    <div className="absolute inset-0 rounded-full border-2 border-green-500 pointer-events-none"></div>
  </div>
))}

                        </div>
                      </div>

                      {/* 🏷️ Noms équipes */}
                      <div className="text-center text-sm font-semibold text-green-900">
                        <span>{teamA.map((p) => p.name).join(", ") || "Équipe A"}</span>{" "}
                        <span className="text-green-500 font-bold">vs</span>{" "}
                        <span>{teamB.map((p) => p.name).join(", ") || "Équipe B"}</span>
                      </div>

                      <div className="flex justify-between text-xs text-green-700 mt-1">
  <span className="px-2 py-0.5 bg-green-100 rounded-md font-medium">
    🎯 Format : {m.format || "BO1"}
  </span>

  <span className="px-2 py-0.5 bg-green-50 border border-green-200 rounded-md font-semibold">
    🧮 Score : {m.score_a != null && m.score_b != null ? `${m.score_a} - ${m.score_b}` : "0 - 0"}
  </span>

  {m.round && (
    <span className="px-2 py-0.5 bg-green-50 border border-green-200 rounded-md">
      🏁 Round {m.round}
    </span>
  )}
</div>


                      {/* ⚙️ Boutons d’action */}
                      <div className="mt-3 flex justify-end gap-2 flex-wrap">
                        {isFinished ? (
                          <div className="flex items-center gap-2">
    <button
      disabled
      className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed text-sm"
    >
      Match terminé
    </button>
    {gameState.currentUser?.id === tournament.organizer_id && (
    <button
      onClick={() => {
        setSelectedMatch(m);
        setShowScorePopup(true);}}
      className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-lg shadow-md hover:bg-gray-300 active:scale-95 transition-all duration-150"
    >
      <Settings size={14} />
      
    </button>
    )}
    </div>
                        ) : isongoing ? (
                          <div className="flex items-center gap-2">
                          <button
                            disabled
                            className="px-4 py-2 bg-gray-300 text-orange-600 rounded-lg cursor-not-allowed text-sm"
                          >
                            Match en cours...
                          </button>
                          {gameState.currentUser?.id === tournament.organizer_id && (
    <button
      onClick={() => {
        setSelectedMatch(m);
        setShowScorePopup(true);}}
      className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-lg shadow-md hover:bg-gray-300 active:scale-95 transition-all duration-150"
    >
      <Settings size={14} />
      
    </button>
    )}
    </div>
                        ) : isUserInMatch ? (
                          (() => {
                            const allHaveTeams =
                              [...(m.joueurs_a || []), ...(m.joueurs_b || [])].length === 4 &&
                              [...(m.joueurs_a || []), ...(m.joueurs_b || [])].every(
                                (p) => p && p.team && p.team.trim() !== ""
                              );

                            return (
                              <div className="flex gap-2">
                                {allHaveTeams ? (
                                  <>
                                  <button
                                    onClick={() => handleStartMatch(m)}
                                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 active:scale-95 transition-all duration-150 text-sm"
                                  >
                                    <Play size={16} />
                                    <span>Lancer</span>
                                  </button>
                                  {error && (
        <span className="text-red-500 text-xs mt-1">{error}</span>
      )}
      </>
                                ) : (
                                  <button
                                    disabled
                                    className="flex items-center gap-2 bg-gray-300 text-gray-600 px-4 py-2 rounded-lg cursor-not-allowed text-sm"
                                  >
                                    <Clock size={14} />
                                    <span>En attente</span>
                                  </button>
                                )}

                                {/* 🚫 Forfait (orga only) */}
                                 {gameState.currentUser?.id === tournament.organizer_id && (
  <div className="flex items-center gap-2">
    {/* Bouton Engrenage */}
    <button
      onClick={() => {
        setSelectedMatch(m);
        setShowScorePopup(true);}}
      className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-lg shadow-md hover:bg-gray-300 active:scale-95 transition-all duration-150"
    >
      <Settings size={14} />
      
    </button>

    {/* Bouton Forfait existant */}
    <button
      onClick={() => {
        setSelectedMatch(m);
        setShowForfeitPopup(true);
      }}
      className="flex items-center justify-center w-10 h-10 bg-red-500 rounded-lg shadow-md hover:bg-red-800 active:scale-95 transition-all duration-150"
    >
      <Flag size={14} />
      
    </button>
  </div>
)}
                              </div>
                            );
                          })()
                        ) : (
                          <div className="flex gap-2">
                            <span className="text-sm text-green-500 italic flex items-center gap-2">
                              <Clock size={14} /> En attente
                            </span>

                             {gameState.currentUser?.id === tournament.organizer_id && (
  <div className="flex items-center gap-2">
    {/* Bouton Engrenage */}
    <button
      onClick={() => {
        setSelectedMatch(m);
        setShowScorePopup(true);}}
      className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-lg shadow-md hover:bg-gray-300 active:scale-95 transition-all duration-150"
    >
      <Settings size={14} />
      
    </button>

    {/* Bouton Forfait existant */}
    <button
      onClick={() => {
        setSelectedMatch(m);
        setShowForfeitPopup(true);
      }}
      className="flex items-center justify-center w-10 h-10 bg-red-500 rounded-lg shadow-md hover:bg-red-800 active:scale-95 transition-all duration-150"
    >
      <Flag size={14} />
      
    </button>
  </div>
)}
                          </div>
                        )}
                      </div>
                      
                    </div>
                    
                  );
                  
                })}
              </div>
            );
          })}
          

          {/* ⏭️ Navigation entre rounds */}
          
        </>
        
      );
      
    })()}
    
  </section>
)}

{showScorePopup && selectedMatch && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 animate-fadeIn overflow-hidden">
    <div className="bg-white rounded-2xl p-6 w-11/12 max-w-sm shadow-2xl">
      <h2 className="text-xl font-bold text-center mb-6 text-gray-800">
        Entrer les scores
      </h2>

      <div className="flex flex-col gap-5 mb-6">
        {/* Équipe A */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-600 mb-1">
            Score de {selectedMatch.joueurs_a?.map((p) => p.name).join(" et ") || "Équipe A"}
          </label>
          <input
            type="number"
            inputMode="numeric"
            placeholder="—"
            min={0}
            max={tournament.targetPoints + 500}
            value={scoreA === 0 ? "" : scoreA}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val <= tournament.targetPoints + 500) setScoreA(val);
            }}
            className="text-center text-lg font-semibold w-full border border-gray-300 rounded-lg py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
        </div>

        {/* Équipe B */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-600 mb-1">
            Score de {selectedMatch.joueurs_b?.map((p) => p.name).join(" et ") || "Équipe B"}
          </label>
          <input
            type="number"
            inputMode="numeric"
            placeholder="—"
            min={0}
            max={tournament.targetPoints + 500}
            value={scoreB === 0 ? "" : scoreB}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val <= tournament.targetPoints + 500) setScoreB(val);
            }}
            className="text-center text-lg font-semibold w-full border border-gray-300 rounded-lg py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={() => setShowScorePopup(false)}
          className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 active:scale-95 transition-all duration-150"
        >
          Annuler
        </button>

        <button
          disabled={!scoreA || !scoreB}
          onClick={async () => {
            await modifMatch(selectedMatch, scoreA, scoreB);
            setShowScorePopup(false);
          }}
          className={`px-4 py-2 rounded-lg font-semibold text-white transition-all duration-150 active:scale-95 ${
            !scoreA || !scoreB
              ? "bg-green-400 opacity-60 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          Valider
        </button>
      </div>
    </div>
  </div>
)}

  {/* ⚡ Popup Forfait */}

  {showForfeitPopup && selectedMatch && (
<div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm overflow-hidden">      <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-lg">
        <h2 className="text-lg font-bold text-red-700 mb-3">Déclarer un forfait</h2>
        <p className="text-gray-700 text-sm mb-5">Quelle équipe déclare forfait ?</p>

        <div className="flex flex-col gap-3 mb-5">
          <button
            onClick={() => setForfeitTeam("A")}
            className={`py-2 rounded-lg font-medium border ${
              forfeitTeam === "A"
                ? "bg-red-600 text-white border-red-600"
                : "bg-gray-100 text-gray-800 border-gray-300"
            }`}
          >
            {selectedMatch.joueurs_a?.map((p) => p.name).join(", ") || "Équipe A"}
          </button>

          <button
            onClick={() => setForfeitTeam("B")}
            className={`py-2 rounded-lg font-medium border ${
              forfeitTeam === "B"
                ? "bg-red-600 text-white border-red-600"
                : "bg-gray-100 text-gray-800 border-gray-300"
            }`}
          >
            {selectedMatch.joueurs_b?.map((p) => p.name).join(", ") || "Équipe B"}
          </button>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              setShowForfeitPopup(false);
              setForfeitTeam(null);
            }}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium active:scale-95 transition-all"
          >
            Annuler
          </button>
          <button
            disabled={!forfeitTeam}
            onClick={() => {
              if (!forfeitTeam) return;
              finishMatchAsForfeit(selectedMatch, forfeitTeam,tournament.targetPoints);
              setShowForfeitPopup(false);
              setForfeitTeam(null);
            }}
            className={`px-4 py-2 rounded-lg font-medium active:scale-95 transition-all ${
              forfeitTeam
                ? "bg-red-600 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  )}





        {/* Stats simples */}



{/* 🏆 Matchs à venir */}
{(tournament.options === "single" || tournament.options === "double") && (
  
  
  <div className="mt-10 w-full">
    
    <h2 className="flex items-center gap-3 text-2xl font-bold text-green-900 mb-8">
      <span className="text-green-700">🎯</span>
      Matchs du tournoi
    </h2>
    

    {
    Object.keys(roundsMap).length === 0 ? (
      <div className="text-green-700 italic text-center bg-green-50 border border-green-200 py-6 rounded-2xl shadow-sm">
        Aucun match à venir pour le moment.
      </div>
    ) : (
      <div className="flex flex-col gap-10">
        {Object.entries(roundsMap).map(([roundNumber, matchesInRound]) => {
          const allfinish = matchesInRound.every((m) => m.status === "finished");
          if (allfinish) {
      matchesInRound.forEach((m) => {
        m.winner_id = 99; // ⚙️ Round terminé → statut spécial
      });
    }

  

          const upper = matchesInRound.filter((m) => m.bracket !== "lower");
          const lower = matchesInRound.filter((m) => m.bracket === "lower");
          console.log(upper)

          return (
            <div key={roundNumber} className="space-y-6">
              <h3 className="flex items-center gap-2 text-xl font-semibold text-green-800 border-b-2 border-green-200 pb-2">
                🌀 {Number(matchesInRound[0].winner_id) === 99 ? "Matchs Terminés" : `Round ${roundNumber}`}
              </h3>

              {[{ label: "Upper Bracket", data: upper, color: "green" },
                { label: "Lower Bracket", data: lower, color: "orange" }]
                .filter((b) => b.data.length > 0)
                .map((bracket) => (
                  <section key={bracket.label}>
                    <h4
                      className={`flex items-center gap-2 text-lg font-semibold text-${bracket.color}-700 mb-3 border-l-4 border-${bracket.color}-500 pl-3`}
                    >
                      {bracket.color === "green" ? "🥇" : "🔁"} {bracket.label}
                    </h4>

                    <div className="grid sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {bracket.data.map((m) => {
                        const allPlayers = [
                          ...(m.joueurs_a || []),
                          ...(m.joueurs_b || []),
                        ];
                        const isUserInMatch = allPlayers.some(
                          (p) =>
                            String(p.id) === String(gameState.currentUser?.id)
                        );
                        const isFinished = m.status === "finished";
                        const isongoing = m.status === "ongoing";
                        console.log(isongoing)
                        const matchColor = bracket.color;

                        return (
                          <div
                            key={m.id}
                            className={`relative border border-${matchColor}-200 rounded-2xl shadow-md transition-all duration-200 overflow-hidden ${
                              isFinished
                                ? "bg-gray-100 opacity-75 cursor-not-allowed"
                                : "bg-white/90 hover:shadow-lg"
                            }`}
                          >
                            <div
                              className={`bg-gradient-to-r from-${matchColor}-700 via-${matchColor}-500 to-${matchColor}-400 h-2 w-full`}
                            />

                            {/* Contenu principal */}
                            <div className="p-5 flex flex-col items-center gap-4">
                              {/* Équipes */}
                              <div className="flex items-center justify-center gap-4">
                                {/* Équipe A */}
                                <div className="flex items-center gap-2">
                                  {m.joueurs_a?.map((p, idx) => (
                                    <div
                                      key={idx}
                                      className={`relative w-10 h-10   rounded-full border-2 border-${matchColor}-500 shadow-sm  bg-${matchColor}-50 flex items-center justify-center`}
                                    >
                                      
                                      {p?.profile_picture ? (
                                        <img
                                          src={p.profile_picture}
                                          alt={p.name}
                                          className="object-cover w-10 h-10 rounded-full flex-shrink-0"
                                        />
                                      ) : (
                                        <span
                                          className={`text-${matchColor}-800 font-bold text-sm`}
                                        >
                                          {p?.name?.[0]?.toUpperCase() || "?"}
                                        </span>
                                      )}
                                      {p?.frames && (
                                          <img
                                            src={availableFrames[Number(p.frames) - 1]?.image}
                                            alt="Cadre décoratif"
                                            className="absolute -inset-0 w-auto h-auto pointer-events-none"
                                            style={{
                                                                      transform: `scale(${availableFrames[Number(p.frames) - 1]?.scale || 1})`, // par défaut scale 1 si non défini
                                                                    }}
                                          />
                                        )}
                                      
                                    </div>
                                  ))}
                                </div>

                                {/* VS stylisé */}
                                <div className="relative flex flex-col items-center justify-center">
                                  <div
                                    className={`text-${matchColor}-600 font-extrabold text-lg tracking-widest`}
                                  >
                                    VS
                                  </div>
                                  <div
                                    className={`absolute -bottom-1 w-6 h-[1px] bg-${matchColor}-300 rounded-full`}
                                  ></div>
                                </div>

                                {/* Équipe B */}
                                <div className="flex items-center gap-2">
                                  {m.joueurs_b?.map((p, idx) => (
                                    <div
                                      key={idx}
                                      className={`relative w-10 h-10 rounded-full border-2 border-${matchColor}-500 shadow-sm bg-${matchColor}-50 flex items-center justify-center`}
                                    >
                                      
                                      {p?.profile_picture ? (
                                        <img
                                          src={p.profile_picture}
                                          alt={p.name}
                                          className="object-cover w-10 h-10 rounded-full flex-shrink-0"
                                        />
                                      ) : (
                                        <span
                                          className={`text-${matchColor}-800 font-bold text-sm`}
                                        >
                                          {p?.name?.[0]?.toUpperCase() || "?"}
                                        </span>
                                      )}
                                      {p?.frames && (
                                          <img
                                            src={availableFrames[Number(p.frames) - 1]?.image}
                                            alt="Cadre décoratif"
                                            className="absolute -inset-0 w-auto h-auto pointer-events-none"
                                            style={{
                                                                      transform: `scale(${availableFrames[Number(p.frames) - 1]?.scale || 1})`, // par défaut scale 1 si non défini
                                                                    }}
                                          />
                                        )}
                                      
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Noms + score visible */}
                              <div
                                className={`text-center text-base font-semibold text-${matchColor}-900`}
                              >
                                <span>
                                  {m.joueurs_a?.map((p) => p.name).join(", ") ||
                                    "Équipe A"}
                                </span>
                                <span
                                  className={`mx-2 font-extrabold text-2xl text-${matchColor}-700`}
                                >
                                  {m.score_a ?? 0} - {m.score_b ?? 0}
                                </span>
                                <span>
                                  {m.joueurs_b?.map((p) => p.name).join(", ") ||
                                    "Équipe B"}
                                </span>
                              </div>

                              {/* Boutons d’action (Lancer / Forfait / etc.) */}
<div className="mt-3 flex justify-end gap-2 flex-wrap">
  {isFinished ? (
    <div className="flex items-center gap-2">
    <button
      disabled
      className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed text-sm"
    >
      Match terminé
    </button>
    {gameState.currentUser?.id === tournament.organizer_id && (
    <button
      onClick={() => {
        setSelectedMatch(m);
        setShowScorePopup(true);}}
      className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-lg shadow-md hover:bg-gray-300 active:scale-95 transition-all duration-150"
    >
      <Settings size={14} />
      
    </button>
    )}
    </div>
  ) : isongoing ? (
    <div className="flex items-center gap-2">
    <button
      disabled
      className="px-4 py-2 bg-gray-400 text-orange rounded-lg cursor-not-allowed text-sm"
    >
      Match en cours ...
    </button>
    {gameState.currentUser?.id === tournament.organizer_id && (
    <button
      onClick={() => {
        setSelectedMatch(m);
        setShowScorePopup(true);}}
      className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-lg shadow-md hover:bg-gray-300 active:scale-95 transition-all duration-150"
    >
      <Settings size={14} />
      
    </button>
    )}
    </div>
  ) :  isUserInMatch ? (
    (() => {
      const allHaveTeams =
        [...(m.joueurs_a || []), ...(m.joueurs_b || [])].length === 4 &&
        [...(m.joueurs_a || []), ...(m.joueurs_b || [])].every(
          (p) => p && p.team && p.team.trim() !== ""
        );

      return (
        <div className="flex gap-2">
          {allHaveTeams ? (
            <>
            <button
              onClick={() => handleStartMatch(m)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 active:scale-95 transition-all duration-150 text-sm"
            >
              <Play size={16} />
              <span>Lancer</span>
            </button>
            {error && (
        <span className="text-red-500 text-xs mt-1">{error}</span>
      )}
            </>
          ) : (
            <button
              disabled
              className="flex items-center gap-2 bg-gray-300 text-gray-600 px-4 py-2 rounded-lg cursor-not-allowed text-sm"
            >
              <Clock size={14} />
              <span>En attente</span>
            </button>
          )}

          {/* 🚫 Bouton “Déclarer forfait” (uniquement pour l’organisateur) */}
 {gameState.currentUser?.id === tournament.organizer_id && (
  <div className="flex items-center gap-2">
    {/* Bouton Engrenage */}
    <button
      onClick={() => {
        setSelectedMatch(m);
        setShowScorePopup(true);}}
      className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-lg shadow-md hover:bg-gray-300 active:scale-95 transition-all duration-150"
    >
      <Settings size={14} />
      
    </button>

    {/* Bouton Forfait existant */}
    <button
      onClick={() => {
        setSelectedMatch(m);
        setShowForfeitPopup(true);
      }}
      className="flex items-center justify-center w-10 h-10 bg-red-500 rounded-lg shadow-md hover:bg-red-800 active:scale-95 transition-all duration-150"
    >
      <Flag size={14} />
      
    </button>
  </div>
)}
        </div>
      );
    })()
  ) : (
    <div className="flex gap-2">
    <span className="text-sm text-green-500 italic flex items-center gap-2">
      <Clock size={14} /> En attente
    </span>
    {gameState.currentUser?.id === tournament.organizer_id && (
  <div className="flex items-center gap-2">
    {/* Bouton Engrenage */}
    <button
      onClick={() => {
        setSelectedMatch(m);
        setShowScorePopup(true);}}
      className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-lg shadow-md hover:bg-gray-300 active:scale-95 transition-all duration-150"
    >
      <Settings size={14} />
      
    </button>

    {/* Bouton Forfait existant */}
    <button
      onClick={() => {
        setSelectedMatch(m);
        setShowForfeitPopup(true);
      }}
      className="flex items-center justify-center w-10 h-10 bg-red-500 rounded-lg shadow-md hover:bg-red-800 active:scale-95 transition-all duration-150"
    >
      <Flag size={14} />
      
    </button>
  </div>
)}
        </div>
  )}
</div>

{showScorePopup && selectedMatch && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 animate-fadeIn overflow-hidden">
    <div className="bg-white rounded-2xl p-6 w-11/12 max-w-sm shadow-2xl">
      <h2 className="text-xl font-bold text-center mb-6 text-gray-800">
        Modifier les scores du match
      </h2>

      <div className="flex flex-col gap-5 mb-6">
        {/* Équipe A */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-green-600 mb-1">
            Score de {selectedMatch.joueurs_a?.map((p) => p.name).join(" et ") || "Équipe A"}
          </label>
          <input
            type="number"
            inputMode="numeric"
            placeholder="—"
            min={0}
            max={tournament.targetPoints + 500}
            value={scoreA === 0 ? "" : scoreA}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val <= tournament.targetPoints + 500) setScoreA(val);
            }}
            className="text-center text-lg font-semibold w-full border border-green-300 rounded-lg py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
        </div>

        {/* Équipe B */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-green-600 mb-1">
            Score de {selectedMatch.joueurs_b?.map((p) => p.name).join(" et ") || "Équipe B"}
          </label>
          <input
            type="number"
            inputMode="numeric"
            placeholder="—"
            min={0}
            max={tournament.targetPoints + 500}
            value={scoreB === 0 ? "" : scoreB}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val <= tournament.targetPoints + 500) setScoreB(val);
            }}
            className="text-center text-lg font-semibold w-full border border-green-300 rounded-lg py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={() => setShowScorePopup(false)}
          className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 active:scale-95 transition-all duration-150"
        >
          Annuler
        </button>

        <button
          disabled={!scoreA || !scoreB}
          onClick={async () => {
            await modifMatch(selectedMatch, scoreA, scoreB);
            setShowScorePopup(false);
          }}
          className={`px-4 py-2 rounded-lg font-semibold text-white transition-all duration-150 active:scale-95 ${
            !scoreA || !scoreB
              ? "bg-green-400 opacity-60 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          Valider
        </button>
      </div>
    </div>
  </div>
)}

{/* 🪟 Popup forfait */}
{showForfeitPopup && selectedMatch && (
<div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm overflow-hidden">    <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-lg">
      <h2 className="text-lg font-bold text-red-700 mb-3">Déclarer un forfait</h2>
      <p className="text-gray-700 text-sm mb-5">
        Quelle équipe déclare forfait ?
      </p>

      <div className="flex flex-col gap-3 mb-5">
        <button
          onClick={() => setForfeitTeam("A")}
          className={`py-2 rounded-lg font-medium border ${
            forfeitTeam === "A"
              ? "bg-red-600 text-white border-red-600"
              : "bg-gray-100 text-gray-800 border-gray-300"
          }`}
        >
          {selectedMatch.joueurs_a?.map((p) => p.name).join(", ")|| "Équipe A"}
        </button>

        <button
          onClick={() => setForfeitTeam("B")}
          className={`py-2 rounded-lg font-medium border ${
            forfeitTeam === "B"
              ? "bg-red-600 text-white border-red-600"
              : "bg-gray-100 text-gray-800 border-gray-300"
          }`}
        >
          {selectedMatch.joueurs_b?.map((p) => p.name).join(", ") || "Équipe B"}
        </button>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={() => {
            setShowForfeitPopup(false);
            setForfeitTeam(null);
          }}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium active:scale-95 transition-all"
        >
          Annuler
        </button>
        <button
          disabled={!forfeitTeam}
          onClick={() => {
            if (!forfeitTeam) return;
            finishMatchAsForfeit(selectedMatch, forfeitTeam,tournament.targetPoints);
            setShowForfeitPopup(false);
            setForfeitTeam(null);
          }}
          className={`px-4 py-2 rounded-lg font-medium active:scale-95 transition-all ${
            forfeitTeam
              ? "bg-red-600 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Confirmer
        </button>
      </div>
    </div>
  </div>
)}


                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
            </div>
          );
        })}
      </div>
    )}

    {/* 🏁 Fin du tournoi */}
    
  </div>
)}





        
      </div>
    </div>
  );
}


