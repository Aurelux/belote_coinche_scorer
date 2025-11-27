import React from "react";
import { Armchair, Club, RectangleHorizontal, RectangleVertical, Table2 } from "lucide-react";

export default function DealerSelector({
  players,
  onSelect,
}: {
  players: string[];
  onSelect: (index: number) => void;
}) {
  // On récupère les initiales ou le nom abrégé
  const shortNames = players.map((p) => ({
    initials: p
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    full: p.slice(0,5),
  }));

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="bg-green-900 rounded-3xl shadow-2xl p-6 w-80 flex flex-col items-center">
        <h2 className="text-2xl font-extrabold mb-6 text-center text-yellow-300">
          Qui distribue en premier ?
        </h2>

        {/* Boutons de sélection */}
        <div className="grid gap-3 w-full">
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
        <h2 className="text-2xl font-extrabold  mt-6 text-center text-yellow-300">
          Disposition des joueurs
        </h2>

      {/* Table Coinche */}
        {players.length === 4 && (
          
          <div className="relative mt-4 w-52 h-52 flex items-center justify-center">
            <h2 className="text-1xl font-extrabold   text-center text-yellow-300">
          Table
        </h2>
            {/* Icône de table au centre */}
            <div className="absolute text-yellow-400 opacity-80">
  <div className="relative  flex items-center justify-center">
    {/* Le rectangle */}
    <RectangleHorizontal size={110} strokeWidth={1.5} />

    {/* Le symbole Club au centre */}
    
    
  </div>
</div>

            {/* Haut */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="w-12 h-12 bg-yellow-700 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-md border border-yellow-400">
                <Armchair
      size={23}
      strokeWidth={1.5}
      className="absolute text-yellow-300"
    />
              </div>
              <span className="text-xs text-yellow-200 mt-1">
                {shortNames[0].full}
              </span>
            </div>

            {/* Bas */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="w-12 h-12 bg-yellow-700 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-md border border-yellow-400">
<Armchair
      size={23}
      strokeWidth={1.5}
      className="absolute text-yellow-300"
    />              </div>
              <span className="text-xs text-yellow-200 mt-1">
                {shortNames[1].full}
              </span>
            </div>

            {/* Gauche */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="w-12 h-12 bg-yellow-700 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-md border border-yellow-400">
<Armchair
      size={23}
      strokeWidth={1.5}
      className="absolute text-yellow-300"
    />              </div>
              <span className="text-xs text-yellow-200 mt-1">
                {shortNames[3].full}
              </span>
            </div>

            {/* Droite */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="w-12 h-12 bg-yellow-700 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-md border border-yellow-400">
<Armchair
      size={23}
      strokeWidth={1.5}
      className="absolute text-yellow-300"
    />              </div>
              <span className="text-xs text-yellow-200 mt-1">
                {shortNames[2].full}
              </span>
            </div>
          </div>
        )}
        {/* Table Coinche pour 3 joueurs */}
{players.length === 3 && (
  <div className="relative mt-4 w-52 h-52 flex items-center justify-center">
    <h2 className="text-1xl font-extrabold text-center text-yellow-300">Table</h2>
    
    {/* Icône de table au centre */}
    <div className="absolute text-yellow-400 opacity-80">
      <div className="relative flex items-center justify-center">
        <RectangleHorizontal size={110} strokeWidth={1.5} />
      </div>
    </div>

    {/* Haut */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
      <div className="w-12 h-12 bg-yellow-700 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-md border border-yellow-400">
        <Armchair size={23} strokeWidth={1.5} className="absolute text-yellow-300" />
      </div>
      <span className="text-xs text-yellow-200 mt-1">{shortNames[0].full}</span>
    </div>

    {/* Bas gauche */}
    <div className="absolute bottom-0 left-1/4 -translate-x-1/2 flex flex-col items-center">
      <div className="w-12 h-12 bg-yellow-700 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-md border border-yellow-400">
        <Armchair size={23} strokeWidth={1.5} className="absolute text-yellow-300" />
      </div>
      <span className="text-xs text-yellow-200 mt-1">{shortNames[1].full}</span>
    </div>

    {/* Bas droite */}
    <div className="absolute bottom-0 right-0 -translate-x-1/2 flex flex-col items-center">
      <div className="w-12 h-12 bg-yellow-700 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-md border border-yellow-400">
        <Armchair size={23} strokeWidth={1.5} className="absolute text-yellow-300" />
      </div>
      <span className="text-xs text-yellow-200 mt-1">{shortNames[2].full}</span>
    </div>
  </div>
)}

{/* Table Coinche pour 2 joueurs */}
{players.length === 2 && (
  <div className="relative mt-4 w-52 h-52 flex items-center justify-center">
    <h2 className="text-1xl font-extrabold text-center text-yellow-300">Table</h2>
    
    {/* Icône de table au centre */}
    <div className="absolute text-yellow-400 opacity-80">
      <div className="relative flex items-center justify-center">
        <RectangleHorizontal size={110} strokeWidth={1.5} />
      </div>
    </div>

    {/* Haut */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
      <div className="w-12 h-12 bg-yellow-700 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-md border border-yellow-400">
        <Armchair size={23} strokeWidth={1.5} className="absolute text-yellow-300" />
      </div>
      <span className="text-xs text-yellow-200 mt-1">{shortNames[0].full}</span>
    </div>

    {/* Bas */}
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
      <div className="w-12 h-12 bg-yellow-700 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-md border border-yellow-400">
        <Armchair size={23} strokeWidth={1.5} className="absolute text-yellow-300" />
      </div>
      <span className="text-xs text-yellow-200 mt-1">{shortNames[1].full}</span>
    </div>
  </div>
)}

      </div>
    </div>
  );
}
