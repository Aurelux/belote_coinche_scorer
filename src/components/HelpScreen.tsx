import React from "react";
import { ArrowLeft } from "lucide-react";
import { useGame } from '../context/GameContext';

export default function HelpScreen() {
  const { navigateTo, goBack } = useGame();
  const games = [
    { label: "Belote 2 joueurs", page: "helpBelote2j" },
    { label: "Belote 3 joueurs", page: "helpBelote3j" },
    { label: "Belote 4 joueurs", page: "helpBelote4j" },
    { label: "Coinche 2 joueurs", page: "helpCoinche2j" },
    { label: "Coinche 3 joueurs", page: "helpCoinche3j" },
    { label: "Coinche 4 joueurs", page: "helpCoinche4j" },
  ];

  return (
<div className="min-h-screen pt-safe pb-safe flex items-center justify-center p-4"
     style={{
       backgroundColor: '#0b3d0b', // vert très foncé
       backgroundImage: `
         radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px),
         radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px)
       `,
       backgroundPosition: '0 0, 10px 10px',
       backgroundSize: '20px 20px'
     }}
>      <div className="max-w-md w-full bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-6 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() =>navigateTo('setup')}
            className="p-2 text-green-700 hover:text-green-900 hover:bg-green-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="flex-1 text-center text-2xl font-bold text-green-800">
            Aide & Règles
          </h1>
          <div className="w-8" /> {/* placeholder pour équilibrer le header */}
        </div>

        {/* Boutons d'aide */}
        <div className="flex flex-col space-y-4 items-center">
          {games.map((game) => (
            <button
              key={game.page}
              onClick={() => navigateTo(game.page)}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl shadow-md flex justify-between items-center transition-colors"
            >
              <span className="font-semibold text-lg">{game.label}</span>
              <span className="text-green-200 font-bold text-xl">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
