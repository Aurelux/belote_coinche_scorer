import React, { useState, useEffect } from 'react';
import { HelpCircle,Users, ArrowRight, Search, UserPlus, X, ArrowLeft} from 'lucide-react';
import {  useGame } from '../context/useGame';
import { PlayerConfirmationModal } from './PlayerConfirmationModal';
import { Player } from '../types/game';
import { debounce } from 'lodash'; 
import { supabase } from '../lib/supabase';// ou tu peux coder ton propre debounce

interface PlayerInput {
  displayName: string;
  elo: number;
  eloBadge: "L" | "M" | "GM" | null;
}

export function PlayerSetup() {
  const { gameState, setPlayers, setCurrentScreen,createEmptyUserStats,setGameState, searchUsers, sendFriendRequest, showPlayerConfirmationModal, goBack, navigateTo } = useGame();
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(4);
const [playerInputs, setPlayerInputs] = useState<PlayerInput[]>([
  { displayName: "", elo: 0, eloBadge: null },
  { displayName: "", elo: 0, eloBadge: null },
  { displayName: "", elo: 0, eloBadge: null },
  { displayName: "", elo: 0, eloBadge: null }
]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null);
  const [showAddFriend, setShowAddFriend] = useState(false);
  

  // Pre-fill current user's name
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*");
      
      if (!error && data) {
        const h = data.map((u: any) => ({
  id: u.id,
  displayName: u.display_name,
  email: u.email,
  profilePicture: u.profile_picture,
  frames: u.profile_frame,
  accessCode: u.access_code,
  profileTitle: u.profile_title,
  friends: [],
  createdAt: new Date(u.created_at),
  stats: u.stats || {},
  achievements: [],
  lastLoginAt: new Date(),
  elo: u.elo ?? {  // ✅ NOUVEAU
    coinche4P: 1500, coinche3P: 1500, coinche2P: 1500,
    belote4P: 1500,  belote3P: 1500,  belote2P: 1500,
  },
}))

         setGameState({
  ...gameState,
  users: h
});
      }
    };

    fetchUsers();
  }, []);
console.log(gameState.users)
  useEffect(() => {
    
    if (gameState.currentUser && gameState.users.length > 0) {
      setPlayerInputs(prev => {
        const newInputs = [...prev];
        const currentUserData = gameState.users.find(
  u => u.displayName === gameState.currentUser?.displayName
);
        const elo = currentUserData?.elo
  ? Math.max(...Object.values(currentUserData.elo))
  : 1500;
        newInputs[0] = {
  displayName: gameState.currentUser!.displayName,
  elo: elo,
  eloBadge: elo >= 2300
    ? "GM"
    : elo >= 2100
      ? "M"
      : elo >= 1900
        ? "L"
        : null,
};
        return newInputs;
      });
    }
  }, [gameState.currentUser,gameState.users]);
  console.log(playerInputs)
  const handleSubmit = (e: React.FormEvent) => {
    gameState.settings.isTournament=false;
    e.preventDefault();
    
    const activeInputs = playerInputs.slice(0, playerCount);
    if (activeInputs.every(player => player.displayName.trim())) {
      console.log('Form submitted with players:', activeInputs);
      
      const players: Player[] = activeInputs.map((name, index) => {
        let team: 'A' | 'B' | 'C';
        
        if (playerCount === 2) {
          team = index === 0 ? 'A' : 'B';
        } else if (playerCount === 3) {
          team = index === 0 ? 'A' : index === 1 ? 'B' : 'C';
        } else {
          team = index < 2 ? 'A' : 'B';
        }

        // Check if this is a friend or the current user
        let userId: string | undefined;
        let profilePicture: string | undefined;
        let profileTitle: string | undefined;
        let frames: string | undefined;
        let eloSnapshot: number = 1500; 
        const modeKey = `${gameState.settings.mode}${gameState.settings.playerCount}P`;

        
        if (index === 0 && gameState.currentUser) {
          // Current user
          userId = gameState.currentUser.id;
          profilePicture = gameState.currentUser.profilePicture;
          profileTitle = gameState.currentUser.profileTitle;
          frames = gameState.currentUser.frames;
          eloSnapshot = gameState.currentUser.elo?.[modeKey] ?? 1500;
        } else {
          // Check if it's a registered user (from all users, not just friends)
          
          const registeredUser = gameState.users.find(
          u => u.displayName.toLowerCase() === name.displayName.trim().toLowerCase()
        );

        if (registeredUser) {
          userId = registeredUser.id;
          profilePicture = registeredUser.profilePicture;
          profileTitle = registeredUser.profileTitle;
          frames = registeredUser.frames;
          eloSnapshot = registeredUser.elo?.[modeKey] ?? 1500;
          
        } else {
          console.warn(`Aucun utilisateur trouvé pour le nom "${name.displayName.trim()}", ce joueur sera traité comme invité.`);
        }
      }
        
        return {
          id: `player-${index}`,
          name: name.displayName.trim(),
          team,
          userId,
          profilePicture,
          profileTitle,
          isGuest: !userId,
          frames,
          eloSnapshot
        };
      });
      
      console.log('Created players array:', players);
      setPlayers(players);
    }
  };

  


const handleInputChange = (index: number, value: string) => {
  const newInputs = [...playerInputs];
   const userData = gameState.users.find(
  u => u.displayName === value
);

const elo = userData?.elo
  ? Math.max(...Object.values(userData.elo))
  : 1500;

newInputs[index] = {
  displayName: value,
  elo,
  eloBadge: elo >= 2300
    ? "GM"
    : elo >= 2100
      ? "M"
      : elo >= 1900
        ? "L"
        : null
};
  setPlayerInputs(newInputs);

  if (index === 0) return;

  setActiveInputIndex(index);
  debouncedSearch(index, value);
};



const debouncedSearch = debounce(async (index: number, value: string) => {
  if (!value.trim()) {
    setSearchResults([]);
    return;
  }
  const query = value.trim().toLowerCase();

  const allUserResults = await searchUsers(query); // normalisation
  const filteredResults = allUserResults
  .filter(user => user.id !== gameState.currentUser?.id)
  .filter(user => 
  !playerInputs.some(u => u.displayName === user.displayName)
);
 // correspondance stricte



  setSearchResults(filteredResults);
}, 200); // délai de 300ms pour éviter le spam
console.log(searchResults)
  const selectUser = (index: number, user: any) => {
    const newInputs = [...playerInputs];
    const userData = gameState.users.find(
  u => u.displayName === user.displayName
);
const elo = userData?.elo
  ? Math.max(...Object.values(userData.elo))
  : 1500;
    newInputs[index] = {
    displayName: user.displayName,
    elo: elo,
    eloBadge: elo >= 2300
    ? "GM"
    : elo >= 2100
      ? "M"
      : elo >= 1900
        ? "L"
        : null
  };
    
    setPlayerInputs(newInputs);
    setSearchResults([]);
    setActiveInputIndex(null);
  };

  const addFriend = async (userId: string) => {
    try {
      await sendFriendRequest(userId);
      setShowAddFriend(false);
      // Refresh search results
      if (activeInputIndex !== null) {
        const currentValue = playerInputs[activeInputIndex]?.displayName || "";

        if (currentValue.trim().length > 0) {
          const results = await searchUsers(currentValue);
          setSearchResults(results);
        }
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };
  const isFormValid = playerInputs
  .slice(0, playerCount)
  .every(player => player.displayName.trim());
console.log(playerInputs)
  const getTeamStructure = () => {
    switch (playerCount) {
      case 2:
        return { A: [0], B: [1] };
      case 3:
        return { A: [0], B: [1], C: [2] };
      case 4:
        return { A: [0, 1], B: [2, 3] };
      default:
        return { A: [0, 1], B: [2, 3] };
    }
  };

  const teamStructure = getTeamStructure();

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
      <div
  className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl relative left-1/2 transform -translate-x-1/2 mb-6" style={{ top: 'calc(1.5rem + env(safe-area-inset-top))' }}
>
 <div className="flex items-center gap-2">
  <button
    onClick={() => navigateTo('home')}
    className="p-2 text-green-700 hover:text-green-900 hover:bg-green-100 rounded-lg transition-colors"
  >
    <ArrowLeft className="w-6 h-6" />
  </button>

  <button
    onClick={() => navigateTo("help")}
    className="
      w-10 h-10 
      bg-white 
      border-2 border-green-600 
      text-green-600 
      flex items-center justify-center 
      rounded-lg 
      shadow-md 
      hover:shadow-lg 
      transition-all duration-200 
      hover:scale-110
    "
  >
    <HelpCircle className="w-6 h-6" />
  </button>
</div>

        
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
     style={{
       backgroundColor: '#0b3d0b', // vert très foncé
       backgroundImage: `
         radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px),
         radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px)
       `,
       backgroundPosition: '0 0, 10px 10px',
       backgroundSize: '20px 20px'
     }}
>
          
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuration des Joueurs</h1>
          <p className="text-gray-600">Choisissez le nombre de joueurs et entrez leurs noms</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Player Count Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nombre de joueurs</h3>
            <div className="grid grid-cols-3 gap-3">
              {[2, 3, 4].map(count => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setPlayerCount(count as 2 | 3 | 4)}
                  className={`py-3 px-4 rounded-lg border-2 font-semibold transition-all duration-200 ${
                    playerCount === count
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {count} joueurs
                  <div className="text-xs mt-1 opacity-75">
                    {count === 2 && '1v1'}
                    {count === 3 && '1v1v1'}
                    {count === 4 && '2v2'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Player Names */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Noms des joueurs</h3>
            
            {playerCount === 4 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-blue-600 text-center">Équipe A</h4>
                  {teamStructure.A.map(index => (
                    <div key={index} className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {index === 0 ? 'Vous' : `Joueur ${index + 1}`}
                      </label>
                      <div className="relative">
                      
                        <input
                          type="text"
value={playerInputs[index].displayName}                          
onChange={(e) => handleInputChange(index, e.target.value)}
                          onFocus={() => setActiveInputIndex(index)}
                          onBlur={() => setTimeout(() => setActiveInputIndex(null), 200)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                          placeholder={
    index === 0
      ? "Votre nom"
      : index === 1
      ? "Joueur avec vous"
      : index === 2
      ? "Joueur à votre gauche"
      : "Joueur à votre droite"
  }
                          disabled={index === 0 && gameState.currentUser}
                          required
                        />
                        {playerInputs[index].eloBadge && (
    <span
  className="absolute top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-md text-xs font-bold text-white"
  style={{
    left: `${playerInputs[index].displayName.length * 9 + 16}px`,
    background:
      playerInputs[index].eloBadge === "GM"
        ? "#C62828"
        : playerInputs[index].eloBadge === "M"
          ? "#9C27B0"
          : "#F48FB1",
  }}
>
  {playerInputs[index].eloBadge}
</span>
  )}
  
                        {index > 0 && (
                          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      
                      {/* Search Results Dropdown */}
                      {activeInputIndex === index && searchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {searchResults.map(user => (
                            <div
                              key={user.id}
                              onClick={() => {
          selectUser(index, user);
          setSearchResults((prev) => prev.filter((u) => u.id !== user.id)); // ❌ enlève ce user de la liste
        }}
                              className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              {user.profilePicture ? (
                                <img
                                  src={user.profilePicture}
                                  alt={user.displayName}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                  <Users className="w-4 h-4 text-gray-600" />
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{user.displayName}  {user.eloBadge && (
    <span
      className="px-1.5 py-0.5 rounded text-xs font-bold text-white"
      style={{
        background:
          user.eloBadge === "GM"
            ? "#C62828"
            : user.eloBadge === "M"
            ? "#9C27B0"
            : "#F48FB1"
      }}
    >
      {user.eloBadge}
    </span>
  )}</div>
                                <div className="text-sm text-gray-500">{user.profileTitle}</div>
                              </div>
                              {!gameState.friends.some(f => f.id === user.id) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addFriend(user.id);
                                  }}
                                  className="p-1 text-blue-600 hover:text-blue-700"
                                >
                                  <UserPlus className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-red-600 text-center">Équipe B</h4>
                  {teamStructure.B.map(index => (
                    <div key={index} className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Joueur {index + 1}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={playerInputs[index].displayName}
                          onChange={(e) => handleInputChange(index, e.target.value)}
                          onFocus={() => setActiveInputIndex(index)}
                          onBlur={() => setTimeout(() => setActiveInputIndex(null), 200)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all duration-200"
                          placeholder={
    index === 0
      ? "Votre nom"
      : index === 1
      ? "Joueur en face de vous"
      : index === 2
      ? "Joueur à votre gauche"
      : "Joueur à votre droite"
  }
                          required
                        />
                        {playerInputs[index].eloBadge && ( <span
  className="absolute top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-md text-xs font-bold text-white"
  style={{
    left: `${playerInputs[index].displayName.length * 9 + 16}px`,
    background:
      playerInputs[index].eloBadge === "GM"
        ? "#C62828"
        : playerInputs[index].eloBadge === "M"
          ? "#9C27B0"
          : "#F48FB1",
  }}
>
  {playerInputs[index].eloBadge}
</span> )}
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      </div>
                      
                      {/* Search Results Dropdown */}
                      {activeInputIndex === index && searchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {searchResults.map(user => (
                            <div
                              key={user.id}
                              onClick={() => {selectUser(index, user);
                                setSearchResults((prev) => prev.filter((u) => u.id !== user.id));}
                              }
                              className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              {user.profilePicture ? (
                                <img
                                  src={user.profilePicture}
                                  alt={user.displayName}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                  <Users className="w-4 h-4 text-gray-600" />
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{user.displayName} {user.eloBadge && (
    <span
      className="px-1.5 py-0.5 rounded text-xs font-bold text-white"
      style={{
        background:
          user.eloBadge === "GM"
            ? "#C62828"
            : user.eloBadge === "M"
            ? "#9C27B0"
            : "#F48FB1"
      }}
    >
      {user.eloBadge}
    </span>
  )}</div>
                                <div className="text-sm text-gray-500">{user.profileTitle}</div>
                              </div>
                              {!gameState.friends.some(f => f.id === user.id) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addFriend(user.id);
                                  }}
                                  className="p-1 text-blue-600 hover:text-blue-700"
                                >
                                  <UserPlus className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: playerCount }, (_, index) => {
                  const teamColors = {
                    A: { bg: 'blue', ring: 'blue' },
                    B: { bg: 'red', ring: 'red' },
                    C: { bg: 'green', ring: 'green' }
                  };
                  
                  let team: 'A' | 'B' | 'C';
                  if (playerCount === 2) {
                    team = index === 0 ? 'A' : 'B';
                  } else {
                    team = index === 0 ? 'A' : index === 1 ? 'B' : 'C';
                  }
                  
                  const colors = teamColors[team];
                  
                  return (
                    <div key={index} className="space-y-2 relative">
                      <label className={`block text-sm font-medium text-${colors.bg}-600 text-center`}>
                        {index === 0 ? 'Vous' : `Joueur ${team}`}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={playerInputs[index].displayName}
                          onChange={(e) => handleInputChange(index, e.target.value)}
                          onFocus={() => setActiveInputIndex(index)}
                          onBlur={() => setTimeout(() => setActiveInputIndex(null), 200)}
                          className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-4 focus:ring-${colors.ring}-100 focus:border-${colors.bg}-500 transition-all duration-200`}
                          placeholder={index === 0 ? "Votre nom" : `Nom joueur ${team}`}
                          disabled={index === 0 && gameState.currentUser}
                          required
                        />
                        {playerInputs[index].eloBadge && ( <span
  className="absolute top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-md text-xs font-bold text-white"
  style={{
    left: `${playerInputs[index].displayName.length * 9 + 16}px`,
    background:
      playerInputs[index].eloBadge === "GM"
        ? "#C62828"
        : playerInputs[index].eloBadge === "M"
          ? "#9C27B0"
          : "#F48FB1",
  }}
>
  {playerInputs[index].eloBadge}
</span> )}
                        {index > 0 && (
                          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      
                      {/* Search Results Dropdown */}
                      {activeInputIndex === index && searchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {searchResults.map(user => (
                            <div
                              key={user.id}
                              onClick={() => {
          selectUser(index, user);
          setSearchResults((prev) => prev.filter((u) => u.id !== user.id)); // ❌ enlève ce user de la liste
        }}
                              className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              {user.profilePicture ? (
                                <img
                                  src={user.profilePicture}
                                  alt={user.displayName}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                  <Users className="w-4 h-4 text-gray-600" />
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{user.displayName}  {user.eloBadge && (
    <span
      className="px-1.5 py-0.5 rounded text-xs font-bold text-white"
      style={{
        background:
          user.eloBadge === "GM"
            ? "#C62828"
            : user.eloBadge === "M"
            ? "#9C27B0"
            : "#F48FB1"
      }}
    >
      {user.eloBadge}
    </span>
  )}</div>
                                <div className="text-sm text-gray-500">{user.profileTitle}</div>
                              </div>
                              {!gameState.friends.some(f => f.id === user.id) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addFriend(user.id);
                                  }}
                                  className="p-1 text-blue-600 hover:text-blue-700"
                                >
                                  <UserPlus className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full bg-gradient-to-r from-green-600 to-green-900 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-green-700 hover:to-green-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg ${
              !isFormValid ? 'cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <span>Continuer</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
        
        {/* Player Confirmation Modal */}
        {gameState.showPlayerConfirmation && <PlayerConfirmationModal />}
      </div>
    </div>
  );
}