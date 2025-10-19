import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { ArrowLeft, LogIn } from "lucide-react";

export default function JoinTournament() {
  const { navigateTo, navigateTo2} = useGame();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleJoin = () => {
    if (!code.trim()) {
      setError("Veuillez entrer un code valide");
      return;
    }
    console.log(code)
    navigateTo2("tournamentview", { code: code.trim().toUpperCase() });
  };

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
      <div className="max-w-md w-full bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 space-y-6">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigateTo("tournoi")}
            className="p-2 text-green-700 hover:text-green-900 hover:bg-green-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="flex-1 text-center text-2xl font-bold text-green-800">
            Rejoindre un tournoi
          </h1>
          <div className="w-8" />
        </div>

        <div className="space-y-4">
          <label className="block text-green-900 font-semibold">
            Code du tournoi
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError("");
            }}
            className="w-full text-center text-lg font-mono uppercase border border-green-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Ex : YW1K4S"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleJoin}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors"
          >
            <LogIn className="w-5 h-5" />
            <span>Rejoindre</span>
          </button>
        </div>
      </div>
    </div>
  );
}
