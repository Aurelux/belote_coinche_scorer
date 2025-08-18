import React, { useState, useEffect } from 'react';
import { Users, ArrowRight, Search, UserPlus, X } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { PlayerConfirmationModal } from './PlayerConfirmationModal';
import { Player } from '../types/game';
import { debounce } from 'lodash'; // ou tu peux coder ton propre debounce

export function PlayerSetup() {
  const { gameState, setPlayers, setCurrentScreen, searchUsers, sendFriendRequest, showPlayerConfirmationModal, goBack, navigateTo } = useGame();
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(4);
  const [playerInputs, setPlayerInputs] = useState(['', '', '', '']);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null);
  const [showAddFriend, setShowAddFriend] = useState(false);
  

  // Pre-fill current user's name
  useEffect(() => {
    if (gameState.currentUser) {
      setPlayerInputs(prev => {
        const newInputs = [...prev];
        newInputs[0] = gameState.currentUser!.displayName;
        return newInputs;
      });
    }
  }, [gameState.currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const activeInputs = playerInputs.slice(0, playerCount);
    if (activeInputs.every(name => name.trim())) {
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
        
        if (index === 0 && gameState.currentUser) {
          // Current user
          userId = gameState.currentUser.id;
          profilePicture = gameState.currentUser.profilePicture;
          profileTitle = gameState.currentUser.profileTitle;
        } else {
          // Check if it's a registered user (from all users, not just friends)
          const registeredUser = gameState.users.find(
          u => u.displayName.toLowerCase() === name.trim().toLowerCase()
        );

        if (registeredUser) {
          userId = registeredUser.id;
          profilePicture = registeredUser.profilePicture;
          profileTitle = registeredUser.profileTitle;
        } else {
          console.warn(`Aucun utilisateur trouvé pour le nom "${name.trim()}", ce joueur sera traité comme invité.`);
        }
      }
        
        return {
          id: `player-${index}`,
          name: name.trim(),
          team,
          userId,
          profilePicture,
          profileTitle,
          isGuest: !userId
        };
      });
      
      console.log('Created players array:', players);
      setPlayers(players);
    }
  };

  


const handleInputChange = (index: number, value: string) => {
  const newInputs = [...playerInputs];
  newInputs[index] = value;
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
  .filter(user => user.displayName.toLowerCase().includes(query)); // correspondance stricte



  setSearchResults(filteredResults);
}, 200); // délai de 300ms pour éviter le spam

  const selectUser = (index: number, user: any) => {
    const newInputs = [...playerInputs];
    newInputs[index] = user.displayName;
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
        const currentValue = playerInputs[activeInputIndex];
        if (currentValue.trim().length > 0) {
          const results = await searchUsers(currentValue);
          setSearchResults(results);
        }
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const isFormValid = playerInputs.slice(0, playerCount).every(name => name.trim());

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
       backgroundColor: '#0b3d0b', // vert très foncé
       backgroundImage: `
         radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px),
         radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px)
       `,
       backgroundPosition: '0 0, 10px 10px',
       backgroundSize: '20px 20px'
     }}
>
      <div
  className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl relative left-1/2 transform -translate-x-1/2" style={{ top: 'calc(1.5rem + env(safe-area-inset-top))' }}
>
        
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
                          value={playerInputs[index]}
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
                              onClick={() => selectUser(index, user)}
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
                                <div className="font-medium text-gray-900">{user.displayName}</div>
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
                          value={playerInputs[index]}
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
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      </div>
                      
                      {/* Search Results Dropdown */}
                      {activeInputIndex === index && searchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {searchResults.map(user => (
                            <div
                              key={user.id}
                              onClick={() => selectUser(index, user)}
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
                                <div className="font-medium text-gray-900">{user.displayName}</div>
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
                          value={playerInputs[index]}
                          onChange={(e) => handleInputChange(index, e.target.value)}
                          onFocus={() => setActiveInputIndex(index)}
                          onBlur={() => setTimeout(() => setActiveInputIndex(null), 200)}
                          className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-4 focus:ring-${colors.ring}-100 focus:border-${colors.bg}-500 transition-all duration-200`}
                          placeholder={index === 0 ? "Votre nom" : `Nom joueur ${team}`}
                          disabled={index === 0 && gameState.currentUser}
                          required
                        />
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
                              onClick={() => selectUser(index, user)}
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
                                <div className="font-medium text-gray-900">{user.displayName}</div>
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