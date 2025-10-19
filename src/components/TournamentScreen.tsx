import React from "react";
import { ArrowLeft, PlusCircle, Users, Clock } from "lucide-react";
import { useGame } from "../context/GameContext";

export default function TournamentsScreen() {
  const { navigateTo, navigateTo2 } = useGame();

  const options = [
    {
      label: "Créer un tournoi",
      icon: <PlusCircle className="w-6 h-6" />,
      page: "createtournament",
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      label: "Rejoindre un tournoi",
      icon: <Users className="w-6 h-6" />,
      page: "jointournoi",
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      label: "Historique des tournois",
      icon: <Clock className="w-6 h-6" />,
      page: "tournamentHistory",
      color: "bg-yellow-600 hover:bg-yellow-700",
    },
  ];

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
      <div className="max-w-md w-full bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-6 flex flex-col" style={{ top: 'calc(1.5rem + env(safe-area-inset-top))' }} >
        
        {/* HEADER */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigateTo('home')}
            className="p-2 text-green-700 hover:text-green-900 hover:bg-green-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="flex-1 text-center text-2xl font-bold text-green-800">
            Tournois
          </h1>
          <div className="w-8" />
        </div>

        {/* TITRE & SOUS-TITRE */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-green-900">
            Relevez le défi ultime !
          </h2>
          <p className="text-green-700 mt-2 text-sm">
            Créez, rejoignez ou revivez vos tournois pour montrer qui est le roi de la table.
          </p>
        </div>

        {/* BOUTONS */}
        <div className="flex flex-col space-y-4 items-center">
  {options.map((opt) => (
    <button
      key={opt.page}
      onClick={() => {
        if (opt.page === "tournamentHistory") {
          navigateTo2(opt.page, { code: null });
        } else {
          navigateTo(opt.page);
        }
      }}
      className={`${opt.color} w-full text-white px-4 py-4 rounded-xl shadow-md flex justify-center items-center space-x-3 transition-colors`}
    >
      {opt.icon}
      <span className="font-semibold text-lg">{opt.label}</span>
    </button>
  ))}
</div>
      </div>
    </div>
  );
}
