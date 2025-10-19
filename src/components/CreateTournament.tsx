import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, UserPlus, X, PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useGame } from "../context/GameContext";

type Player = {
  id?: string;
  name: string;
};

export default function CreateTournament() {
  const { gameState,navigateTo, navigateTo2 } = useGame();
  const [error, setError] = useState("");
const [max_Matches, setMaxMatches] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"belote" | "coinche">("belote");
  const [playersPerMatch, setPlayersPerMatch] = useState(4);
  const [totalPlayers, setTotalPlayers] = useState(8);
  const [target_Points, setTargetPoints] = useState(1001);
  const [Options, setOptions] = useState("single");
  const [randomTeams, setRandomTeams] = useState(true);
  const [matchFormat, setMatchFormat] = useState("BO1");
  const [semisMatchFormat, setSemisMatchFormat] = useState("BO1");
  const [finalMatchFormat, setFinalMatchFormat] = useState("BO1");

  const [allUsers, setAllUsers] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from("users").select("id, display_name");
      if (!error && data) {
        setAllUsers(data.map(u => ({ id: u.id, name: u.display_name })));
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {

    const normalizeString = (str: string) =>
  str
    .normalize("NFD")             // décompose les lettres accentuées
    .replace(/[\u0300-\u036f]/g, "") // enlève les diacritiques (accents)
    .toLowerCase();

    if (!searchQuery.trim()) return setFilteredUsers([]);
const lower = normalizeString(searchQuery);    setFilteredUsers(
  allUsers.filter(u => {
    const normalizedUserName = normalizeString(u.name);
    return (
      normalizedUserName.includes(lower) &&
      !selectedPlayers.some(p => p.name === u.name)
    );
  }));
  }, [searchQuery, allUsers, selectedPlayers]);

  const addPlayer = (player: Player) => {
    if (selectedPlayers.length >= totalPlayers) return;
    setSelectedPlayers([...selectedPlayers, player]);
    setSearchQuery("");
  };
  const swissMatchOptions = useMemo(() => {
    const validValues: number[] = [];
    for (let m = 1; m < Math.floor(totalPlayers/2) - 1; m++) {
      if (((Math.floor(totalPlayers / 2)) * m) % 2 === 0) validValues.push(m);
      if (validValues.length === 2) break;
    }
    return validValues;
  }, [totalPlayers]);

  const addCustomPlayer = () => {
    const trimmed = searchQuery.trim();
    if (!trimmed || selectedPlayers.some(p => p.name === trimmed)) return;
    if (selectedPlayers.length >= totalPlayers) return;
    setSelectedPlayers([...selectedPlayers, { name: trimmed }]);
    setSearchQuery("");
  };
const teamOptions = [
  { label: "Équipes aléatoires", value: true },
  { label: "Choisir manuellement", value: false },
];
  const removePlayer = (name: string) => {
    setSelectedPlayers(selectedPlayers.filter(p => p.name !== name));
  };
      const formatOptions = [
  { label: "Format Suisse", value: "swiss" },
  { label: "Élimination Directe", value: "single" },
  { label: "Double Élimination", value: "double" },
];

  const handleCreateTournament = async () => {
     setError(""); // reset avant vérifications

  if (!name.trim()) {
    setError("Veuillez entrer un nom de tournoi !");
    return;
  }

  if (Options !== "swiss" && totalPlayers % playersPerMatch !== 0) {
    setError(
      "Le nombre total de joueurs doit être un multiple du nombre de joueurs par match."
    );
    return;
  }

  if (selectedPlayers.length !== totalPlayers) {
    setError("Veuillez sélectionner tous les joueurs !");
    return;
  }

    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { error } = await supabase.from("tournaments").insert([
      {
        name,
        mode,
        organizer_id: gameState.currentUser?.id,
        players_per_match: playersPerMatch,
        total_players: totalPlayers,
        random_teams: randomTeams,
        options: Options,
        match_format: matchFormat,
        semifinals_format: semisMatchFormat,
        finals_format: finalMatchFormat,
        join_code: joinCode,
        status: "pending",
        targetPoints : target_Points,
        maxMatches: max_Matches,
        players: selectedPlayers.map(p => ({
          id: p.id,
          name: p.name,
          team: "A",
        
        })),
      },
    ]);

    if (error) {
      
      setError("Erreur lors de la création du tournoi");
    }

    navigateTo2("tournamentAssignTeams", { code: joinCode });
  };

  // Liste conditionnelle des totaux possibles
  const possibleTotals =
    Options === "swiss"
      ? []
      : [8, 16, 24].filter(n => n % playersPerMatch === 0);

  return (
    <div className="min-h-screen pt-safe pb-safe flex items-center justify-center p-4"

     style={{

       backgroundColor: '#042204', // vert très foncé

       backgroundImage: `
          radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px),
          radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)
        `,

       backgroundPosition: '0 0, 10px 10px',

       backgroundSize: '20px 20px'

     }}

>
      <motion.div
  initial={{ opacity: 0, y: 25 }}
  animate={{ opacity: 1, y: 0 }}
  className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 flex flex-col space-y-5 mt-6"
>
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateTo("tournoi")}
            className="p-2 text-green-700 hover:bg-green-100 rounded-full transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-green-800">Créer un tournoi</h1>
          <div className="w-8" />
        </div>

        {/* NOM */}
        <input
          type="text"
          placeholder="Nom du tournoi"
          className="w-full border border-green-200 rounded-xl p-3 focus:ring-2 focus:ring-green-400 outline-none"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        {/* FORMAT TOURNOI */}
        <div>
          <p className="font-semibold text-green-900 mb-1">Format du tournoi</p>
          <div className="flex justify-around">
        


  
    {formatOptions.map(({ label, value }) => (
      <button
        key={value}
        onClick={() => setOptions(value)}
        className={`flex-1 mx-1 py-2 rounded-xl font-bold transition-all ${
          Options === value
            ? "bg-green-600 text-white shadow-md"
            : "bg-green-100 text-green-800"
        }`}
      >
        {label}
      </button>
    ))}
  

          </div>
        </div>

        {/* 🔹 Options personnalisées si "Swiss" sélectionné */}
      {Options === "swiss" && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-green-800 font-semibold mb-2 text-center">
            Nombre de matchs maximum par équipe :
          </p>

          <div className="flex justify-center gap-3">
            {swissMatchOptions.map(val => (
              <button
                key={val}
                onClick={() => setMaxMatches(val)}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  max_Matches === val
                    ? "bg-green-600 text-white shadow-md"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {val} matchs
              </button>
            ))}

            {/* Option "tout le monde joue tout le monde" */}
            <button
              onClick={() => setMaxMatches(null)}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                max_Matches === null
                  ? "bg-green-600 text-white shadow-md"
                  : "bg-green-100 text-green-800"
              }`}
            >
              Tout le monde
            </button>
          </div>

          <p className="text-sm text-center mt-3 text-green-700">
            {max_Matches === null
              ? `Chaque équipe affrontera toutes les autres (${Math.floor(totalPlayers/2) - 1} matchs).`
              : `Chaque équipe jouera ${max_Matches} matchs maximum.`}
          </p>
        </div>
      )}

        {/* MODE */}
        <div>
          <p className="font-semibold text-green-900 mb-1">Mode de jeu</p>
          <div className="flex justify-around">
            {["belote", "coinche"].map(opt => (
              <button
                key={opt}
                onClick={() => setMode(opt as "belote" | "coinche")}
                className={`flex-1 mx-1 py-2 rounded-xl font-bold transition-all ${
                  mode === opt
                    ? "bg-green-600 text-white shadow-md"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="font-semibold text-green-900 mb-1">
            Points à atteindre par partie
          </p>
          <div className="flex justify-around">
            {mode === 'belote' ? [501, 701, 1001].map(n => (
              <button
                key={n}
                onClick={() => setTargetPoints(n)}
                className={`flex-1 mx-1 py-2 rounded-xl font-bold transition-all ${
                  target_Points === n
                    ? "bg-green-600 text-white shadow-md"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {n}
              </button>
            )) : [1001, 1501, 2001].map(n => (
              <button
                key={n}
                onClick={() => setTargetPoints(n)}
                className={`flex-1 mx-1 py-2 rounded-xl font-bold transition-all ${
                  target_Points === n
                    ? "bg-green-600 text-white shadow-md"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* JOUEURS PAR MATCH */}
        <div>
  <p className="font-semibold text-green-900 mb-1">Joueurs par partie</p>
  <div className="flex justify-around">
    {[2, 3, 4].map((n) => {
      const isDisabled = n < 4; // ici on grise 2 et 3
      return (
        <div key={n} className="flex-1 mx-1 flex flex-col items-center">
          <button
            onClick={() => !isDisabled && setPlayersPerMatch(n)}
            disabled={isDisabled}
            className={`w-full py-2 rounded-xl font-bold transition-all
              ${playersPerMatch === n ? "bg-green-600 text-white shadow-md" : ""}
              ${isDisabled && playersPerMatch !== n ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-green-100 text-green-800"}
            `}
          >
            {n}
          </button>
          {isDisabled && (
            <span className="text-sm text-gray-500 mt-1">
              Prochainement
            </span>
          )}
        </div>
      );
    })}
  </div>
</div>


        {/* TOTAL JOUEURS */}
        <div>
          <p className="font-semibold text-green-900 mb-1">Joueurs totaux</p>
          {Options === "swiss" ? (
            <>
              <input
                type="number"
                placeholder="Nombre total"
                className="w-full border border-green-200 rounded-xl p-3"
                value={totalPlayers}
                onChange={e => setTotalPlayers(parseInt(e.target.value))}
              />
              <p className="text-xs text-gray-500 mt-1">
                Doit être un multiple de 2.
              </p>
            </>
          ) : (
            <div className="flex justify-around">
              {possibleTotals.map(n => (
                <button
                  key={n}
                  onClick={() => setTotalPlayers(n)}
                  className={`flex-1 mx-1 py-2 rounded-xl font-bold transition-all ${
                    totalPlayers === n
                      ? "bg-green-600 text-white shadow-md"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>

        

        {/* CHECKBOX */}
        
        {/* JOUEURS */}
        <div className="mt-2">
          <p className="font-semibold text-green-900 mb-1">Joueurs</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Rechercher ou ajouter un joueur"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 border border-green-200 rounded-xl p-3"
            />
            <button
              onClick={addCustomPlayer}
              className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all"
            >
              <UserPlus className="w-5 h-5" />
            </button>
          </div>

          <AnimatePresence>
            {searchQuery && filteredUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="border border-green-100 rounded-xl mt-2 bg-white shadow-sm max-h-36 overflow-auto"
              >
                {filteredUsers.map(u => (
                  <div
                    key={u.id}
                    onClick={() => addPlayer(u)}
                    className="p-2 px-3 hover:bg-green-100 cursor-pointer"
                  >
                    {u.name}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* LISTE DES JOUEURS */}
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedPlayers.map(p => (
              <motion.div
                key={p.name}
                layout
                className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center gap-2 shadow-sm"
              >
                <span>{p.name}</span>
                <button
                  onClick={() => removePlayer(p.name)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        <div><p className="font-semibold text-green-900 mb-1">
            Selection des équipes
          </p>
        <div className="flex justify-around">
          
    {teamOptions.map(({ label, value }) => (
      <button
        key={value ? "random" : "manual"}
        onClick={() => setRandomTeams(value)}
        className={`flex-1 mx-1 py-2 rounded-xl font-bold transition-all ${
          randomTeams === value
            ? "bg-green-600 text-white shadow-md"
            : "bg-green-100 text-green-800"
        }`}
      >
        {label}
      </button>
    ))}
  </div>
  </div>

        {/* BUTTON */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleCreateTournament}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 rounded-2xl shadow-md mt-3 transition-all"
        >
          <PlusCircle className="inline w-5 h-5 mr-2" />
          Créer le tournoi
        </motion.button>
        {error && (
    <p className="text-red-500 text-sm font-medium mt-2">{error}</p>
  )}
      </motion.div>
      
    </div>
  );
}
