import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useGame } from "../context/GameContext";
import { Crown, Trophy, Medal, Award, ArrowLeft } from "lucide-react";

interface TournamentHistoryEntry {
  id: string;
  name: string;
  mode: string;
  player_count: number;
  top3: {team : string; name: string; avatar: string | null; score: number }[];
  created_at: string;
}

export default function TournamentHistory({ code }: { code: string | null }) {
  const {navigateTo,navigateTo2 } = useGame();
  const [history, setHistory] = useState<TournamentHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
    
      const { data, error } = await supabase
        .from("tournament_history")
        .select("*")
        .order("timestamp", { ascending: false });
      if (!error && data) setHistory(data);
      setLoading(false);
    };
    fetchHistory();
  }, []);

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
        Chargement de l'historique...
      </p>

      {/* Petit texte d’ambiance */}
      <p className="mt-3 text-sm text-green-400 opacity-80 italic">
        Préparation des cartes et des équipes ♣️♦️♥️♠️
      </p>
    </div>
  );


  return (
    <div
      className="min-h-screen w-full px-6 py-10 bg-green-950"
      style={{
        backgroundImage: `
          radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px),
          radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)
        `,
        backgroundPosition: "0 0, 10px 10px",
        backgroundSize: "20px 20px",
      }}
    >
      <div className="w-full max-w-5xl space-y-6">
        {/* Header */}
        <div 
  className="max-w-7xl mx-auto relative" 
  style={{ top: 'calc(0.5em + env(safe-area-inset-top))' }}
><div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
        <div className="relative flex items-center">
  {/* Bouton à gauche */}
  <button
      onClick={() => {
        if (code) {
          navigateTo2("tournamentview", { code : code });
        } else {
          navigateTo("tournoi");
        }
      }}
      className="flex items-center gap-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
    >
      <ArrowLeft className="w-5 h-5" /> 
    </button>

  {/* Titre centré */}
  <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl font-bold text-green-800 flex items-center gap-2 whitespace-nowrap">
    <Trophy className="w-6 h-6 text-yellow-400" /> historique 
  </h1>
</div>

        
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {history.map((t) => (
          <div key={t.id} className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-green-900 mb-2">{t.name}</h2>
            <p className="text-sm text-gray-600 mb-4">
              Mode : <span className="font-semibold">{t.mode}</span> • Joueurs :
              <span className="font-semibold">{t.total_joueurs}</span>
            </p>

            {/* Podium */}
            <div className="flex flex-col gap-3">
  {t.top3.map((p, idx) => {
    const isFirst = idx === 0;
    const isSecond = idx === 1;
    const isThird = idx === 2;

    const colors = isFirst
      ? "bg-gradient-to-br from-yellow-200 to-yellow-400"
      : isSecond
      ? "bg-gradient-to-br from-gray-200 to-gray-400"
      : "bg-gradient-to-br from-amber-200 to-amber-500";

    const Icon = isFirst ? Crown : isSecond ? Medal : Award;

    return (
      <div
        key={p.id}
        className={`flex items-center gap-3 p-3 rounded-xl shadow-sm ${
          isFirst
            ? "bg-yellow-50"
            : isSecond
            ? "bg-gray-50"
            : "bg-orange-50"
        }`}
      >
        {/* Avatar remplacé par icône stylée */}
        <div
          className={`w-10 h-10 rounded-full ${colors} flex items-center justify-center border border-white shadow-md`}
        >
          <Icon
            className={`w-6 h-6 ${
              isFirst ? "text-yellow-700" : isSecond ? "text-gray-700" : "text-amber-800"
            }`}
          />
        </div>

        {/* Infos joueur */}
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{p.name}</p>
          
        </div>

        {/* Petite icône de trophée/couronne à droite */}
        {isFirst && <Crown className="text-yellow-500 w-5 h-5" />}
        {isSecond && <Medal className="text-gray-400 w-4 h-4" />}
        {isThird && <Award className="text-amber-700 w-3 h3" />}
      </div>
    );
  })}
</div>
          </div>
        ))}
      </div>
    </div>
    </div>
    </div>
  );

}
