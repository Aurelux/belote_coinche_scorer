import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useGame } from "../context/GameContext";
import {
  ArrowLeft,
  Trophy,
  User,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  Target,
  Star,
  Crown,
  Award,
  Users,
  Activity,
  PieChart,
  Info,
  
} from "lucide-react";
import {
  ResponsiveContainer,
  
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  
  BarChart,
  Bar,
  
  
  
} from "recharts";

interface TournamentStat {
  user_id: string;
  display_name: string;
  profile_picture?: string | null;
  points_scored: number;
  points_conceded: number;
  wins?: number;
  losses?: number;
  total_coinches?: number;
  successful_coinches?: number;
  capots?: number;
  contractsTaken?: number;
  successful_contracts?: number;
}

interface PlayerStat {
  user_id: string;
  name: string;
  avatar?: string | null;
  pointsScored: number;
  pointsConceded: number;
  wins?: number;
  losses?: number;
  total_coinches?: number;
  successful_coinches?: number;
  capots?: number;
  contractsTaken?: number;
  successful_contracts?: number;
}

export default function TournamentStats({ tournamentId }: { tournamentId: string }) {
  const { navigateTo2 } = useGame();
  const [stats, setStats] = useState<TournamentStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [tournamentInfo, setTournamentInfo] = useState<{ name?: string; created_at?: string } | null>(null);
const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
const [visiblePlayers, setVisiblePlayers] = useState<string[]>([]);
const [sortedStats, setSortedStats] = useState<TournamentStat[]>([]);
const [playerStats, setPlayerStats] = useState<PlayerStat[]>([]);
const [code, setCode] = useState<string>("");
  useEffect(() => {
  const fetchStats = async () => {
    setLoading(true);
    const { data: join , error : tnmterror} = await supabase
      .from("tournaments")
      .select("join_code")
      .eq("id", tournamentId)
      .single();
       if (tnmterror || !join) {
      console.error("Erreur chargement stats :", statsError);
      setLoading(false);
      return;
    }
    setCode(join.join_code)
    // 1️⃣ Récupération des stats du tournoi
    const { data: statsData, error: statsError } = await supabase
      .from("tournament_stats")
      .select("*")
      .eq("tournament_id", tournamentId);

    if (statsError || !statsData) {
      console.error("Erreur chargement stats :", statsError);
      setLoading(false);
      return;
    }
    console.log(statsData)

    // 2️⃣ Récupération des infos utilisateurs
    const userIds = statsData.map((s) => s.user_id);
    console.log(userIds)
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, display_name, profile_picture")
      .in("id", userIds);

    if (usersError || !usersData) {
      console.error("Erreur chargement users :", usersError);
    }

    // 3️⃣ Fusion stats + infos utilisateurs
    console.log(usersData)
    const mergedStats = statsData.map((s) => {
      const user = usersData?.find((u) => u.id === s.user_id);
      return {
        ...s,
        display_name: user?.display_name ?? s.name_user ?? "Joueur inconnu",
        profile_picture: user?.profile_picture ?? null,
      };
    });

    setStats(mergedStats);

    
  const computeScore = (s: TournamentStat) => {
    const totalGames = (s.wins ?? 0) + (s.losses ?? 0);
    const winRate = totalGames > 0 ? s.wins! / totalGames : 0;
    const diff = s.points_scored - s.points_conceded;
    const performance = totalGames > 0 ? diff / totalGames : 0;
    const coincheRate = (s.total_coinches ?? 0) > 0 ? (s.successful_coinches ?? 0) / (s.total_coinches ?? 1) : 0;
    const contractRate = (s.contractsTaken ?? 0) > 0 ? (s.successful_contracts ?? 0) / (s.contractsTaken ?? 1) : 0;
    return Math.max(
      0,
      Math.min(
        100,
        Math.round(
          35 * winRate +
            20 * Math.tanh(performance / 50) +
            15 * Math.tanh(diff / 500) +
            10 * coincheRate +
            10 * contractRate +
            5 * Math.min((s.capots ?? 0) / 3, 1)
        )
      )
    );
  };

  

  const sortedStats = [...mergedStats].sort((a, b) => computeScore(b) - computeScore(a));
  setSortedStats(sortedStats)
  // --- Calcul des différentes top stats ---
  
  // Graphiques
 

  const playerStats = sortedStats.map((s) => ({
    name: s.display_name,
    pointsScored: s.points_scored,
    pointsConceded: s.points_conceded,
    avatar: s.profile_picture,
    wins : s.wins,
    losses : s.losses,
    total_coinches :s.total_coinches,
    successful_coinches : s.successful_coinches,
    successful_contracts : s.successful_contracts,
    contractsTaken : s.contractsTaken,
    capots : s.capots,
    user_id : s.user_id
  }));
  setPlayerStats(playerStats)

  setVisiblePlayers(sortedStats.map(p => p.display_name.slice(0, 5)).slice(0, 5));

    setLoading(false);
  };

  fetchStats();
}, [tournamentId]);

console.log(playerStats)

const computeScore = (s: TournamentStat) => {
    const totalGames = (s.wins ?? 0) + (s.losses ?? 0);
    const winRate = totalGames > 0 ? s.wins! / totalGames : 0;
    const diff = s.points_scored - s.points_conceded;
    const performance = totalGames > 0 ? diff / totalGames : 0;
    const coincheRate = (s.total_coinches ?? 0) > 0 ? (s.successful_coinches ?? 0) / (s.total_coinches ?? 1) : 0;
    const contractRate = (s.contractsTaken ?? 0) > 0 ? (s.successful_contracts ?? 0) / (s.contractsTaken ?? 1) : 0;
    return Math.max(
      0,
      Math.min(
        100,
        Math.round(
          35 * winRate +
            20 * Math.tanh(performance / 50) +
            15 * Math.tanh(diff / 500) +
            10 * coincheRate +
            10 * contractRate +
            5 * Math.min((s.capots ?? 0) / 3, 1)
        )
      )
    );
  };

const kingOfGame = sortedStats[0];
  const bestScorer = sortedStats.reduce((a, b) => (b.points_scored > (a.points_scored ?? 0) ? b : a), sortedStats[0]);
  const worstPlayer = sortedStats.reduce((a, b) => (b.points_conceded > (a.points_conceded ?? 0) ? b : a), sortedStats[0]);
  const bestDefense = sortedStats.reduce((a, b) => ((a.points_conceded ?? 0) < (b.points_conceded ?? 0) ? a : b), sortedStats[0]);
  const mostCapots = sortedStats.reduce((a, b) => ((b.capots ?? 0) > (a.capots ?? 0) ? b : a), sortedStats[0]);
  const mostCoinches = sortedStats.reduce((a, b) => ((b.successful_coinches ?? 0) > (a.successful_coinches ?? 0) ? b : a), sortedStats[0]);

if (loading)
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
        Chargement des statistiques...
      </p>

      {/* Petit texte d’ambiance */}
      <p className="mt-3 text-sm text-green-400 opacity-80 italic">
        Préparation des stats ♣️♦️♥️♠️
      </p>
    </div>
  );



  // Préparer les données par axes
  const axes = ["Attack", "Performance", "Coinche", "Capots", "Contracts"];
  const data = axes.map(axis => {
    const item: any = { stat: axis };
    playerStats.forEach(p => {
      const totalGames = (p.wins ?? 0) + (p.losses ?? 0) || 1;
      const attack = (p.pointsScored ?? 0) / totalGames;
      const performance = ((p.pointsScored ?? 0) - (p.pointsConceded ?? 0)) / totalGames;
      const coincheRate = (p.total_coinches ?? 0) > 0 ? (p.successful_coinches ?? 0) / (p.total_coinches ?? 1) : 0;
      const capots = Math.min((p.capots ?? 0), 20)*2/totalGames;
      const contracts = (p.contractsTaken ?? 0) > 0 ? (p.successful_contracts ?? 0) / (p.contractsTaken ?? 1) : 0;

      const normalized = {
        Attack: attack,
        Performance: performance,
        Coinche: coincheRate * 10,
        Capots: capots * 10,
        Contracts: contracts * 10,
      };

      item[p.name.slice(0, 5)] = normalized[axis];
    });
    return item;
  });

  const handleLegendClick = (e: any) => {
    const clickedName = e.value; // nom du joueur
    setVisiblePlayers(prev =>
      prev.length === 1 && prev[0] === clickedName
        ? playerStats.map(p => p.name.slice(0, 5)) // réaffiche tous
        : [clickedName] // afficher seulement le joueur cliqué
    );
  };
  const COLORS = ["#4ade80", "#facc15", "#f87171", "#60a5fa", "#a78bfa", "#f472b6"];


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
      <div className=" w-full max-w-5xl space-y-6 mb-10 mt-2">
        {/* Header */}
        <div 
  className="max-w-7xl mx-auto relative" 
  style={{ top: 'calc(2em + env(safe-area-inset-top))' }}
>
  <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
        <div className="relative flex items-center">
  {/* Bouton à gauche */}
  <button
    onClick={() => navigateTo2("tournamentview", { code: code })}
    className="flex items-center gap-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
  >
    <ArrowLeft className="w-5 h-5" /> 
  </button>

  {/* Titre centré */}
  <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl font-bold text-green-800 flex items-center gap-2 whitespace-nowrap">
    <Trophy className="w-6 h-6 text-yellow-400" /> Stats Tournoi
  </h1>
</div>

        
        </div>
        

        {/* Top Stats Minimalistes */}
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
  {[
    { player: kingOfGame, label: "Roi", icon: <Crown className="w-6 h-6 text-yellow-500" /> },
    { player: bestScorer, label: "Meilleur marqueur", icon: <Award className="w-6 h-6 text-green-500" /> },
    { player: worstPlayer, label: "Pire joueur", icon: <TrendingDown className="w-6 h-6 text-red-500" /> },
    { player: bestDefense, label: "Meilleure défense", icon: <Shield className="w-6 h-6 text-blue-500" /> },
    { player: mostCapots, label: "Plus de capots", icon: <Star className="w-6 h-6 text-purple-500" /> },
    { player: mostCoinches, label: "Plus de coinches", icon: <Zap className="w-6 h-6 text-orange-500" /> },
  ].map(
    ({ player, label, icon }) =>
      player && (
        <div
          key={label}
          className="bg-white rounded-xl shadow-md p-3 flex flex-col items-center text-center"
        >
          <div className="w-12 h-12 mb-2 flex items-center justify-center bg-gray-100 rounded-full">
            {
              icon
            }
          </div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="font-semibold text-gray-900 truncate">{player.display_name}</p>
          <p className="text-sm text-gray-600 mt-1">
            {label === "Meilleur marqueur" ? `${player.points_scored} pts marqués` : ""}
            {label === "Pire joueur" ? `${player.points_conceded} pts concédés` : ""}
            {label === "Plus de capots" ? `${player.capots ?? 0} capots` : ""}
            {label === "Plus de coinches" ? `${player.successful_coinches ?? 0} coinches` : ""}
            {label === "Roi" && computeScore(player) ? `${computeScore(player)} de score` : ""}
            {label === "Meilleure défense" && `${player.points_conceded} pts concédés`}
          </p>
        </div>
      )
  )}
</div>


        {/* Bloc Classement */}
<div className="bg-white rounded-2xl shadow-xl p-6 mb-6 mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Classement Joueurs</h2>
          {sortedStats.map((s, idx) => {
            const score = computeScore(s);
            const diff = s.points_scored - s.points_conceded;
            return (
              <div
                key={s.user_id}
                className="flex justify-between items-center bg-gray-50 rounded-xl p-4 shadow hover:shadow-md transition"
              >
                <div className="flex items-center gap-3">
                  {s?.profile_picture && typeof s.profile_picture === "string" && s.profile_picture.length > 0 ? 
                                  (<img src={s.profile_picture } alt={s.display_name} className="w-12 h-12 rounded-full border border-green-700 object-cover"/>) :(
                                                <div className="w-12 h-12 flex items-center justify-center rounded-full border border-green-600 bg-green-200">
                                                  {s.display_name && s.display_name !== "À déterminer" ? s.display_name[0].toUpperCase() : <User size={16} />}
                                                </div>
                                              )}
                    
                  <div>
                    <p className="font-semibold text-gray-900">{s.display_name}</p>
                    <p className="text-xs text-gray-500">{s.wins ?? 0}V / {s.losses ?? 0}D</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-700">{score} <Trophy className="w-4 h-4 text-yellow-400 inline" /></p>
                  <p className={`text-xs font-semibold ${diff >= 0 ? "text-green-600" : "text-red-600"}`}>
                    Diff : {diff >= 0 ? "+" : ""}{diff}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Camembert des points gagnés */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Activity className="w-6 h-6 text-green-600" /> Profil des 5 meilleurs joueurs
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="stat" />
            <PolarRadiusAxis angle={30} domain={[0, 10]} />

            {playerStats
              .filter(p => visiblePlayers.includes(p.name.slice(0, 5)))
              .map((p, idx) => (
                <Radar
                  key={p.user_id}
                  name={p.name.slice(0, 5)}
                  dataKey={p.name.slice(0, 5)}
                  stroke={COLORS[idx % COLORS.length]}
                  fill={COLORS[idx % COLORS.length]}
                  fillOpacity={0.3}
                />
              ))}

            <Legend onClick={handleLegendClick} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>

{/* Légende explicative des axes */}
<div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-gray-700">
  <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
    <Info className="w-4 h-4 text-green-700" />
    Interprétation des axes
  </h4>
  <ul className="space-y-1 pl-2">
    <li><span className="font-semibold text-green-900">🗡️ Attaque :</span> moyenne de points marqués par partie jouée.</li>
    <li><span className="font-semibold text-green-900">⚖️ Performance :</span> différence moyenne entre points marqués et concédés.</li>
    <li><span className="font-semibold text-green-900">🌀 Coinche :</span> taux de réussite des coinches.</li>
    <li><span className="font-semibold text-green-900">🏆 Contrats :</span> taux de réussite des contrats pris.</li>
    <li><span className="font-semibold text-green-900">💥 Capots :</span> fréquence de capots réussis.</li>
  </ul>
  <p className="text-xs text-gray-500 mt-3">
    Chaque joueur est représenté par une couleur. Cliquez sur un nom dans la légende pour afficher uniquement son profil.
  </p>
</div>
      </div>
    </div>
    </div>
  );
}
