import React from "react";

export default function DealerSelector({
  players,
  onSelect,
}: { players: string[]; onSelect: (index: number) => void }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="bg-green-900 rounded-3xl shadow-2xl p-6 w-80">
        <h2 className="text-2xl font-extrabold mb-6 text-center text-yellow-300">
          Qui distribue en premier ?
        </h2>
        <div className="grid gap-3">
          {players.map((p, i) => (
            <button
              key={i}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl py-2 shadow-lg hover:scale-105 transition-transform duration-200"
              onClick={() => onSelect(i)}
            >
              {p}
            </button>
          ))}
        </div>
        
      </div>
    </div>
  );
}
