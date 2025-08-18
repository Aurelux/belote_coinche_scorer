import React from "react";

export default function DealerSelector({
  players,
  onSelect,
}: { players: string[]; onSelect: (index: number) => void }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-80">
        <h2 className="text-xl font-bold mb-4 text-center">
          Qui distribue en premier ?
        </h2>
        <div className="grid gap-2">
          {players.map((p, i) => (
            <button
              key={i}
              className="bg-blue-500 text-white rounded-xl py-2 hover:bg-blue-600 transition"
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
