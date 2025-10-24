import React, { useState, useEffect } from "react";
import { ArrowLeft, User } from "lucide-react";
import { useGame } from "../context/GameContext";
import { supabase } from "../lib/supabase";

interface PlayerTeam{
  id?: string;
  name: string;
  team?: string;
  profile_picture?: string;
  frames? : string | null; 
}

interface Tournament {
  id: string;
  name: string;
  total_players: number;
  random_teams: boolean;
  playersPerMatch: number;
  options : string;
  join_code: string;
  players: PlayerTeam[];

}
interface Match {
  round: number;
  match_number: number;
  team_a: string;
  team_b: string | null;
  joueurs_a: PlayerTeam[];
  joueurs_b: PlayerTeam[];
  score_a: number | null;
  score_b: number | null;
  status: "pending" | "finished";
}

export default function TournamentAssignTeams({ code }: { code: string }) {
  const { navigateTo, navigateTo2 } = useGame();
const [error, setError] = useState("");
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<PlayerTeam[]>([]);
  const [teams, setTeams] = useState<string[]>([]);

  useEffect(() => {
    const fetchTournament = async () => {
      const { data: tData } = await supabase
        .from("tournaments")
        .select("*")
        .eq("join_code", code)
        .single();

      if (!tData) return;
      setTournament(tData);

      // On enrichit les joueurs avec la photo de profil depuis users
      const playerIds = (tData.players || [])
  .map((p: PlayerTeam) => String(p.id))
  .filter(Boolean);

if (!playerIds.length) return [];

const { data: userData, error } = await supabase
  .from("users")
  .select("id, display_name, profile_picture, profile_frame")
  .filter("id", "in", `(${playerIds.map(id => `"${id}"`).join(",")})`);

if (error) console.error("Supabase error:", error);
else console.log("userData:", userData);

      const enrichedPlayers = (tData.players || []).map((p: PlayerTeam) => {
        const user = userData?.find(u => u.id === p.id);
        return {
          ...p,
          name: p.name || user?.display_name,
          profile_picture: user?.profile_picture || User,
          frames: user?.profile_frame || null,
        };
      });

      setPlayers(enrichedPlayers);

      // Calcul du nombre d'équipes
      let nTeams = 2;
      if (tData.playersPerMatch === 3) nTeams = tData.total_players;
      else nTeams = tData.total_players / 2;

      const teamNames = Array.from({ length: nTeams }, (_, i) => `Equipe ${i + 1}`);
      console.log(teamNames)
      setTeams(teamNames);
      
      
    };
    fetchTournament();
  }, [code]);

  const assignTeam = (player: PlayerTeam, team: string) => {
    setPlayers(players.map(p => p.id === player.id ? { ...p, team } : p));
  };
  
  const MAX_PER_TEAM = 2;

    const assignRandomTeam = (player: PlayerTeam, teamsMap: { [team: string]: PlayerTeam[] }) => {
  // On filtre les équipes encore dispo
  const availableTeams = teams.filter(t => (teamsMap[t]?.length || 0) < MAX_PER_TEAM);

  if (availableTeams.length === 0) {
    console.warn("⚠️ Toutes les équipes sont pleines !");
    return null;
  }

  // Tirage au hasard parmi celles encore dispos
  const t = availableTeams[Math.floor(Math.random() * availableTeams.length)];
  assignTeam(player, t);
  return t;
};

  const handleLaunchTournament = async () => {
    if (!tournament) return;

    // Vérifier que toutes les équipes sont assignées
    if (!tournament.random_teams && players.some(p => !p.team)) {
      setError("Veuillez attribuer toutes les équipes avant de lancer le tournoi !");
      return;
    }
    
    try {
  console.log("🚀 Lancement du tournoi...");
  console.log("🎮 Players initiaux:", players);

  // Vérifier la génération des équipes
  const teamsMap: { [team: string]: PlayerTeam[] } = {};
  players.forEach(p => {
    const t = tournament.random_teams
      ? assignRandomTeam(p, teamsMap)
      : p.team!;

    if (!t) return;
    p.team = t;
    if (!teamsMap[t]) teamsMap[t] = [];
    teamsMap[t].push(p);
  });

  console.log("🧩 Teams Map:", teamsMap);

  const teamList = Object.keys(teamsMap);
  const matchesToInsert = generateMatches(teamList, teamsMap, tournament.options);

  console.log("🎯 Matches générés:", matchesToInsert);

  

  

  // ⚠️ On envoie une version propre des players (stringifiée si nécessaire)
  const cleanedPlayers = players.map((p, idx) => ({
  id: p.id ?? `det-${idx}`,
  name: p.name,
  team: p.team || null,
  profile_picture: typeof p.profile_picture === "string" ? p.profile_picture : null,
  frames : p?.frames || null,
}));

  const { error: updateError } = await supabase
    .from("tournaments")
    .update({ status: "ongoing", players: cleanedPlayers })
    .eq("id", tournament.id);

  if (updateError) throw updateError;
  console.log("✅ Tournoi mis à jour avec succès");
  


  const statsToInsert = cleanedPlayers.map(p => ({
    tournament_id: tournament.id,
    user_id: p.id,
    name_user: p.name,
    wins: 0,
    losses: 0,
    total_games: 0,
    points_scored: 0,
    points_conceded: 0,
  }));

  const { error: statsError } = await supabase
    .from("tournament_stats")
    .insert(statsToInsert);

  if (statsError) {
    console.error("⚠️ Erreur lors de la création des tournament_stats pour les joueurs 'det':", statsError);
  } else {
    console.log(`✅ ${cleanedPlayers.length} entrées ajoutées dans tournament_stats pour les joueurs 'det'`);
  }


  navigateTo2("tournamentview", { code: tournament.join_code });
} catch (err) {
  console.error("💥 Erreur pendant le lancement du tournoi:", err);
  setError( "Erreur pendant le lancement du tournoi:")
}

  };

  // Fonction utilitaire pour assigner aléatoirement si randomTeams


 const generateMatches = (
  teamList: string[],
  teamsMap: { [team: string]: PlayerTeam[] },
  option = 'simple'
): Match[] => {
  const matches: Match[] = [];
  let round = 1;
  let currentTeams = [...teamList];

  // Winner bracket
  while (currentTeams.length > 1) {
    const roundMatches: Match[] = [];
    for (let i = 0; i < currentTeams.length; i += 2) {
      const teamA = currentTeams[i];
      const teamB = currentTeams[i + 1] || null;

      roundMatches.push({
        round,
        match_number: i / 2,
        team_a: teamA,
        team_b: teamB,
        joueurs_a: teamsMap[teamA] || [{ name: "À déterminer" }, { name: "À déterminer" }],
        joueurs_b: teamB
          ? teamsMap[teamB] || [{ name: "À dét" }, { name: "À dét" }]
          : [{ name: "À dét" }, { name: "À dét" }],
        score_a: null,
        score_b: null,
        status: "pending",
      });
    }
    matches.push(...roundMatches);
    currentTeams = roundMatches.map((m, idx) => `Winner ${round}-${idx}`);
    round++;
  }

  // Loser bracket
  if (option === 'double') {
    let loserRoundTeams: string[] = [];
    let loserRound = 1;
    let winnerRoundMatches = matches.filter(m => m.round === 1); // Round 1 pour récupérer les perdants

    while (winnerRoundMatches.length > 0 || loserRoundTeams.length > 1) {
      const roundMatches: Match[] = [];
      const teamsToPlay = loserRoundTeams.length > 0 ? loserRoundTeams : winnerRoundMatches.map((m, idx) => `Loser 1-${idx}`);

      for (let i = 0; i < teamsToPlay.length; i += 2) {
        const teamA = teamsToPlay[i];
        const teamB = i + 1 < teamsToPlay.length ? teamsToPlay[i + 1] : null;
        roundMatches.push({
          round: round + loserRound - 1,
          match_number: i / 2,
          team_a: teamA,
          team_b: teamB,
          joueurs_a: [{ name: "À dét" }, { name: "À dét" }],
          joueurs_b: teamB ? [{ name: "À dét" }, { name: "À dét" }] : [],
          score_a: null,
          score_b: null,
          status: "pending",
        });
      }

      matches.push(...roundMatches);
      loserRoundTeams = roundMatches.map((m, idx) => `LB Winner ${loserRound}-${idx}`);
      loserRound++;
      winnerRoundMatches = []; // On ne re-utilise les perdants qu’une seule fois
    }
  }

  return matches;
};
  if (!tournament)
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
      <div className="max-w-md w-full bg-white/90 text-green-900 rounded-xl p-6 space-y-4 mt-10 mb-3">
        <div className="flex items-center mb-4">
          <button onClick={() => navigateTo("createtournament")} className="p-2 text-green-700 hover:bg-green-100 rounded-lg">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="flex-1 text-center font-bold text-xl">{tournament.name} - Attribution des équipes</h1>
          <div className="w-8" />
        </div>

        <div className="space-y-2">
          {players.map((p) => (
            <div key={p.id || p.name} className="flex justify-between items-center bg-green-100 rounded p-2">
              <div className="flex items-center gap-2">
                {p?.profile_picture && typeof p.profile_picture === "string" && p.profile_picture.length > 0 ? 
                (<img src={p.profile_picture } alt={p.name} className="w-6 h-6 rounded-full border border-green-700"/>) :(
                              <div className="w-6 h-6 flex items-center justify-center rounded-full border border-green-700 bg-green-200">
                                {p.name && p.name !== "À déterminer" ? p.name[0].toUpperCase() : <User size={16} />}
                              </div>
                            )}
                <span>{p.name}</span>
                
              </div>
{!tournament.random_teams && (
  <div className="flex justify-between items-center w-full max-w-xs mx-auto mt-1">
    <span className="text-base font-medium text-green-800 mr-2">{""}</span>
    <div className="relative">
      <select
        value={p.team === 'A' ?  "" : p.team || ""}
        onChange={(e) => assignTeam(p, e.target.value)}
        className="
          w-full 
          border border-green-300 
          bg-green-100 
          rounded-md 
          px-3 py-1 
          text-base 
          focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400
          appearance-none
        "
        style={{
          
        backgroundColor: p.team !== 'A' ? "#065f46" : "#bbf7d0", // vert foncé si sélectionné, vert clair si vide
        color: p.team !== 'A' ? "#ffffff" : "#065f46",
          width: `${"Equipe 10".length * 1.75}ch`, // fixe selon le nombre de caractères max
        }}
      >
        <option value="" disabled>
    Sélectionnez
  </option>
        {teams
          .filter((t) => {
            const count = players.filter((pl) => pl.team === t).length;
            return count < 2 || t === p.team;
          })
          .map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
      </select>

      {/* Flèche custom */}
      <div className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-green-700">
        ▼
      </div>
    </div>
  </div>
)}




            </div>
          ))}
        </div>

        <button onClick={handleLaunchTournament} className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl font-bold">
          Lancer le tournoi
        </button>
        {error && (
    <p className="text-red-500 text-sm font-medium mt-2">{error}</p>
  )}
      </div>
    </div>
  );
}
