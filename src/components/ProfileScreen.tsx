import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Target, Users, Award, TrendingUp, Crown, Medal, BarChart3, LogOut, UserPlus, Settings, Edit, Camera, Upload, History, TrendingDown, User } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { PROFILE_TITLES } from '../types/game';





export function ProfileScreen() {

  
  
  const { gameState, setCurrentScreen, logoutUser, updateProfileTitle, updateProfilePicture, navigateTo, goBack, loadMatchHistory, getUserSoftRankings} = useGame();
  const [showTitleSelector, setShowTitleSelector] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const currentUser = gameState.currentUser;

  const [allUserRankings, setAllUserRankings] = useState<Record<string, number | null>>({});

useEffect(() => {
  const loadAllUserRanks = async () => {
    if (!currentUser) return;

    const modes = ['belote', 'coinche'] as const;
    const playerCounts = [2, 3, 4] as const;

    const requests = modes.flatMap(mode =>
      playerCounts.map(playerCount =>
        getUserSoftRankings(mode, playerCount).then(rankings => {
          const userRanking = rankings.find(r => r.userId === currentUser.id);
          return {
            key: `${mode}_${playerCount}`,
            rank: userRanking ? userRanking.rank : null,
          };
        })
      )
    );

    const results = await Promise.all(requests);
    const newRankings: Record<string, number | null> = {};
    results.forEach(({ key, rank }) => {
      newRankings[key] = rank;
    });

    setAllUserRankings(newRankings);
  };

  loadAllUserRanks();
}, [currentUser]);
  
  useEffect(() => {
    loadMatchHistory();
  }, []);
  if (!currentUser) {
    return (
      <div className="min-h-screen pt-safe pb-safe bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Non connecté</h2>
          <p className="text-gray-600 mb-6">Connectez-vous pour voir votre profil</p>
          <button
            onClick={() => navigateTo('auth')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  const stats = currentUser.stats;
 let winStreak = 0;
let lossStreak = 0;
let mostPlayedWith: { userId: 'id'; name: 'nobody'; count: 0 } ;
  let worstTeammate: { userId: 'id'; name: 'nobody'; losses: 0 } ;

function containsOnlyDigits(str: string, allowedDigits: string[]): boolean {
  return [...str].every(ch => allowedDigits.includes(ch));
}

function checkCondition(allowedDigits: string[]): boolean {
  const results = gameState.matchHistory
    .slice()
    .reverse()
    .map(match => {
      const player = match.players.find(p => p.userId === currentUser.id);
      if (!player || !player.team || !match.winningTeam) return null;
      const score = player.team === "A" ? match.finalScores.teamA.toString() : match.finalScores.teamB.toString();
      return containsOnlyDigits(score, allowedDigits) ? 'O' : 'N';
    })
    .filter(r => r !== null) as ('O' | 'N')[];
  
  return results.some(r => r === 'O');
}

// Fonction pour récupérer et mémoriser dans localStorage
function getPersistentFlag(key: string, allowedDigits: string[]): boolean {
  const stored = localStorage.getItem(key);
  if (stored === 'true') return true; // déjà détecté avant

  // Sinon, on calcule
  const detectedNow = checkCondition(allowedDigits);
  if (detectedNow) {
    localStorage.setItem(key, 'true'); // on garde cette info
  }
  return detectedNow;
}

const isPastis = getPersistentFlag('isPastis', ['5', '1']);
const isBiere = getPersistentFlag('isBiere', ['8', '6']);
const isTempete = getPersistentFlag('isTempete', ['6', '9']);

let maxWinStreak = 0;
let maxLossStreak = 0;
let currentStreak = 0;
if (gameState.matchHistory.length > 0) {
  // On part du match le plus récent
 const results = gameState.matchHistory
  .slice() // pour ne pas muter l'original
  .reverse() // du plus récent au plus ancien
  .map(match => {
    const player = match.players.find(p => p.userId === currentUser.id);
    if (!player || !player.team || !match.winningTeam) return null;
    return player.team === match.winningTeam ? 'W' : 'L';
  })
  .filter(result => result !== null) as ('W' | 'L')[];

// Initialisation

let currentType: 'W' | 'L' | null = null;

for (const r of results) {
  if (r === currentType) {
    currentStreak++;
  } else {
    // Nouvelle série
    if (currentType === 'W') maxWinStreak = Math.max(maxWinStreak, currentStreak);
    if (currentType === 'L') maxLossStreak = Math.max(maxLossStreak, currentStreak);
    currentType = r;
    currentStreak = 1;
  }
}

// Ne pas oublier de comparer la dernière série
if (currentType === 'W') maxWinStreak = Math.max(maxWinStreak, currentStreak);
if (currentType === 'L') maxLossStreak = Math.max(maxLossStreak, currentStreak);

  const teammateCounts: Record<string, { name: string; count: number }> = {};

  gameState.matchHistory.forEach(match => {
    const currentPlayer = match.players.find(p => p.userId === currentUser.id);
    if (!currentPlayer || !currentPlayer.team) return;

    // Cherche les coéquipiers (même équipe, autre que toi)
    const teammates = match.players.filter(
      p => p.team === currentPlayer.team && p.userId !== currentUser.id
    );

    teammates.forEach(teammate => {
      if (!teammateCounts[teammate.userId]) {
        teammateCounts[teammate.userId] = { name: teammate.name, count: 0 };
      }
      teammateCounts[teammate.userId].count += 1;
    });
  });

  // Trouver le joueur avec qui on a le plus joué
  const bestEntry = Object.entries(teammateCounts).reduce(
    (acc, [userId, data]) => {
      return data.count > acc.count ? { userId, ...data } : acc;
    },
    { userId: '', name: '', count: 0 }
  );

  if (bestEntry.userId) {
    mostPlayedWith = bestEntry;
    
  }

 

const teammateLossCounts: Record<string, { name: string; losses: number }> = {};

gameState.matchHistory.forEach(match => {
  const currentPlayer = match.players.find(p => p.userId === currentUser.id);
  if (!currentPlayer || !currentPlayer.team || !match.winningTeam) return;

  const isLoss = currentPlayer.team !== match.winningTeam;

  if (!isLoss) return; // on ne compte que les défaites

  // Cherche les coéquipiers (même équipe, autre que toi)
  const teammates = match.players.filter(
    p => p.team === currentPlayer.team && p.userId !== currentUser.id
  );

  teammates.forEach(teammate => {
    if (!teammateLossCounts[teammate.userId]) {
      teammateLossCounts[teammate.userId] = { name: teammate.name, losses: 0 };
    }
    teammateLossCounts[teammate.userId].losses += 1;
  });
});

// Trouver le joueur avec qui on a le plus perdu
const worstEntry = Object.entries(teammateLossCounts).reduce(
  (acc, [userId, data]) => {
    return data.losses > acc.losses ? { userId, ...data } : acc;
  },
  { userId: '', name: '', losses: 0 }
);

if (worstEntry.userId) {
  worstTeammate = worstEntry;
}
}

  const getGameModeStats = (mode: 'belote' | 'coinche', playerCount: 2 | 3 | 4) => {
    const key = `${mode}${playerCount}P` as keyof typeof stats;
    return stats[key];
  };

  const availableTitles = PROFILE_TITLES.filter(title => {
  if (!title.requirement && !title.customCheck) return true;

  const meetsMinGames = !title.minGames || stats.totalGames >= title.minGames;
  let currentValue = 0
  if (title.requirement && !['winStreak', 'lossStreak', 'isPastis', 'isBiere', 'isTempete'].includes(title.requirement)) {
    currentValue = stats[title.requirement as keyof typeof stats] as number;
    return currentValue >= (title.threshold || 0) && meetsMinGames;
  }
    if (title.requirement === 'winStreak'){
        currentValue = maxWinStreak
        return currentValue >= title.threshold && meetsMinGames;
        
      }
    if (title.requirement === 'mostPlayedWith') {
  if (!mostPlayedWith) return false; // ou return meetsMinGames si tu veux le forcer

  currentValue = mostPlayedWith.count;
  return currentValue >= title.threshold && meetsMinGames;
}

      if (title.requirement === 'lossStreak'){
        currentValue = maxLossStreak
        return currentValue >= title.threshold && meetsMinGames;
        
      }
      if (title.requirement === 'isPastis'){
        currentValue = isPastis? 1 : 0
        return currentValue >= title.threshold && meetsMinGames;
        
      }
      if (title.requirement === 'isBiere'){
        currentValue = isBiere? 1 : 0
        return currentValue >= title.threshold && meetsMinGames;
        
      }
      if (title.requirement === 'isTempete'){
        currentValue = isTempete? 1 : 0
        return currentValue >= title.threshold && meetsMinGames;
        
      }

  if (title.customCheck && typeof customChecks[title.customCheck] === 'function') {
    return customChecks[title.customCheck](playerGames) && meetsMinGames;
  }

  return false;
});

  const handleTitleUpdate = async (titleId: string) => {
    setUpdating(true);
    try {
      await updateProfileTitle(titleId);
      setShowTitleSelector(false);
    } catch (error) {
      console.error('Error updating title:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      await updateProfilePicture(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const currentTitle = PROFILE_TITLES.find(t => t.id === currentUser.profileTitle);
  

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
      <div className="max-w-4xl mx-auto relative" style={{ top: 'calc(1.5rem + env(safe-area-inset-top))' }}>
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4 w-full sm:w-auto">
              <button
                onClick={goBack}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center space-x-4 min-w-0 flex-1">
                <div className="relative">
                  {currentUser.profilePicture ? (
                    <img
                      src={currentUser.profilePicture}
                      alt={currentUser.displayName}
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-4 border-blue-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                    {uploadingPhoto ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={uploadingPhoto}
                    />
                  </label>
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-3xl font-bold text-gray-900 truncate">{currentUser.displayName}</h1>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm sm:text-base font-medium ${currentTitle?.color || 'text-blue-600'}`}>
                      {currentTitle?.title}
                    </span>
                    <button
                      onClick={() => setShowTitleSelector(true)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 truncate">{currentUser.email}</p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Membre depuis {new Intl.DateTimeFormat('fr-FR', { 
                      year: 'numeric', 
                      month: 'long' 
                    }).format(currentUser.createdAt)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={() => navigateTo('friends')}
                className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>Amis ({gameState.friends.length})</span>
              </button>
              <button
                onClick={() => navigateTo('rankings')}
                className="flex items-center space-x-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Classements</span>
                <span className="sm:hidden">Rank</span>
              </button>
              <button
      onClick={() => navigateTo('history')}
      className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
    >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">Historique</span>
              </button>
              <button
                onClick={logoutUser}
                className="flex items-center space-x-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>

        {/* Title Selector Modal */}
        {showTitleSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[80vh] overflow-hidden">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Choisir un titre</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableTitles.map(title => (
                  <button
                    key={title.id}
                    onClick={() => handleTitleUpdate(title.id)}
                    disabled={updating}
                    className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                      currentUser.profileTitle === title.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`font-medium ${title.color || 'text-gray-900'}`}>{title.title}</div>
                    <div className="text-sm text-gray-600">{title.description}</div>
                    {title.requirement && (
                      <div className="text-xs text-green-600 mt-1">
                        ✓ Débloqué ({title.threshold} {title.requirement})
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowTitleSelector(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Overall Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 sm:p-3 rounded-lg">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalGames}</div>
                <div className="text-xs sm:text-sm text-gray-600">Parties jouées</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 sm:p-3 rounded-lg">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{maxWinStreak}</div>
                <div className="text-xs sm:text-sm text-gray-600"> Meilleure série de victoires</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-red-100 p-2 sm:p-3 rounded-lg">
                <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{maxLossStreak}</div>
                <div className="text-xs sm:text-sm text-gray-600"> Plus grande série de défaites</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 sm:p-3 rounded-lg">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.winRate.toFixed(1)}%</div>
                <div className="text-xs sm:text-sm text-gray-600">Taux de victoire</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-2 sm:p-3 rounded-lg">
                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.highestScore}</div>
                <div className="text-xs sm:text-sm text-gray-600">Meilleur score</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-yellow-100 p-2 sm:p-3 rounded-lg">
                <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalCapots}</div>
                <div className="text-xs sm:text-sm text-gray-600">Capots réalisés</div>
              </div>
            </div>
          </div>
          {mostPlayedWith && (
  <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
    <div className="flex items-center space-x-3">
      <div className="bg-yellow-100 p-2 sm:p-3 rounded-lg">
        <User className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
      </div>
      <div>
        <div className="text-xl sm:text-2xl font-bold text-gray-900">
          {mostPlayedWith.name}
        </div>
        <div className="text-xs sm:text-sm text-gray-600">
          {mostPlayedWith.count} parties à tes côtés 
        </div>
      </div>
    </div>
  </div>
)}
          {worstTeammate && (
  <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
    <div className="flex items-center space-x-3">
      <div className="bg-black-100 p-2 sm:p-3 rounded-lg">
        <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-black-600" />
      </div>
      <div>
        <div className="text-xl sm:text-2xl font-bold text-gray-900">
          {worstTeammate.name}
        </div>
        <div className="text-xs sm:text-sm text-gray-600">
          {worstTeammate.losses} parties perdues à tes côtés 
        </div>
      </div>
    </div>
  </div>
)}
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Performance</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base text-gray-600">Points marqués</span>
                <span className="font-semibold text-green-600">{stats.totalPointsScored}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base text-gray-600">Points concédés</span>
                <span className="font-semibold text-red-600">{stats.totalPointsConceded}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base text-gray-600">Pénalités reçues</span>
                <span className="font-semibold text-orange-600">{stats.totalPenalties}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base text-gray-600">Moyenne par partie</span>
                <span className="font-semibold text-blue-600">{stats.averagePointsPerGame.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base text-gray-600">Belote-Rebelote</span>
                <span className="font-semibold text-purple-600">{stats.beloteRebelotes}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Coinche</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base text-gray-600">Coinches déclarées</span>
                <span className="font-semibold text-yellow-600">{stats.totalCoinches}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base text-gray-600">Coinches réussies</span>
                <span className="font-semibold text-green-600">{stats.successfulCoinches}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base text-gray-600">Moyenne de prise</span>
                <span className="font-semibold text-blue-600">
                  {stats.risk ? stats.risk.toFixed(1) : "Aucune"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base text-gray-600">Contrats pris</span>
                <span className="font-semibold text-purple-600">{stats.totalContractsTaken}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base text-gray-600">Contrats réussis</span>
                <span className="font-semibold text-green-600">{stats.successfulContracts}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Game Mode Statistics */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Statistiques par mode de jeu</h3>
          
          {/* User Rankings */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <h4 className="text-md font-semibold text-blue-900 mb-3">Mes Classements</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {(['belote', 'coinche'] as const).map(mode => (
  <div key={mode} className="space-y-2">
    <div className={`font-medium ${mode === 'belote' ? 'text-blue-700' : 'text-red-700'}`}>
      {mode.charAt(0).toUpperCase() + mode.slice(1)}
    </div>
    {[2, 3, 4].map(playerCount => {
      const modeStats = getGameModeStats(mode, playerCount as 2 | 3 | 4);
      if (modeStats.games === 0) return null;

      const userRank = allUserRankings[`${mode}_${playerCount}`];

      return (
        <div key={playerCount} className="flex justify-between items-center py-1 px-2 bg-white rounded text-xs">
          <span>{playerCount}J</span>
          <span className="font-semibold text-purple-600">
            {userRank ? `#${userRank}` : 'Non classé'}
          </span>
        </div>
      );
    })}
  </div>
))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Belote Stats */}
             <div>
    <h4 className="text-lg font-semibold text-blue-600 mb-4">Belote</h4>
    <div className="space-y-4">
      {[2, 3, 4].map(playerCount => {
        const modeStats = getGameModeStats('belote', playerCount as 2 | 3 | 4);
        if (modeStats.games === 0) return null;

        return (
          <div key={playerCount} className="p-3 sm:p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-900">{playerCount} joueurs</span>
              <span className="text-sm text-gray-600">{modeStats.games} parties</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="text-center">
                <div className="font-semibold text-green-600">{modeStats.winRate.toFixed(1)}%</div>
                <div className="text-gray-600">Victoires</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-600">{modeStats.averagePoints.toFixed(0)}</div>
                <div className="text-gray-600">Moy. pts</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-purple-600">{modeStats.rankingScore}</div>
                <div className="text-gray-600">Score</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-orange-600">{modeStats.penalties}</div>
                <div className="text-gray-600">Pénalités</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-yellow-600">{modeStats.capots}</div>
                <div className="text-gray-600">Capots</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-teal-600">
                  {modeStats.successfulContracts}/{modeStats.contractsTaken}
                </div>
                <div className="text-gray-600">Contrats réussis</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>

            {/* Coinche Stats */}
            <div>
    <h4 className="text-lg font-semibold text-red-600 mb-4">Coinche</h4>
    <div className="space-y-4">
      {[2, 3, 4].map(playerCount => {
        const modeStats = getGameModeStats('coinche', playerCount as 2 | 3 | 4);
        if (modeStats.games === 0) return null;

        return (
          <div key={playerCount} className="p-3 sm:p-4 bg-red-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-900">{playerCount} joueurs</span>
              <span className="text-sm text-gray-600">{modeStats.games} parties</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="text-center">
                <div className="font-semibold text-green-600">{modeStats.winRate.toFixed(1)}%</div>
                <div className="text-gray-600">Victoires</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-600">{modeStats.averagePoints.toFixed(0)}</div>
                <div className="text-gray-600">Moy. pts</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-purple-600">{modeStats.rankingScore}</div>
                <div className="text-gray-600">Score</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-orange-600">{modeStats.penalties}</div>
                <div className="text-gray-600">Pénalités</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-pink-600">
                  {modeStats.successfulCoinches}/{modeStats.coinches}
                </div>
                <div className="text-gray-600">Coinches</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-teal-600">
                  {modeStats.successfulContracts}/{modeStats.contractsTaken}
                </div>
                <div className="text-gray-600">Contrats</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
 
</div>
          </div>

          {/* Challenge Progress Section */}
          <div className="mb-8 mt-8">
  <h4 className="text-lg font-semibold text-gray-900 mb-4">Progression des Défis</h4>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {PROFILE_TITLES.filter(title => title.requirement || title.customCheck).map(title => {
      const meetsMinGames = !title.minGames || stats.totalGames >= title.minGames;

      let isUnlocked = false;
      let currentValue = 0;
      let progress = 0;

      if (title.requirement && title.threshold) {
        currentValue = stats[title.requirement as keyof typeof stats] as number;
        isUnlocked = currentValue >= title.threshold && meetsMinGames;
        progress = Math.min((currentValue / title.threshold) * 100, 100);
      }
      if (title.requirement === 'winStreak'){
        currentValue = maxWinStreak
        isUnlocked = currentValue >= title.threshold && meetsMinGames;
        progress = Math.min((currentValue / title.threshold) * 100, 100);
      }

      if (title.requirement === 'lossStreak'){
        currentValue = maxLossStreak
        isUnlocked = currentValue >= title.threshold && meetsMinGames;
        progress = Math.min((currentValue / title.threshold) * 100, 100);
      }
      if (title.requirement === 'isPastis'){
        currentValue = isPastis? 1 : 0
        isUnlocked = currentValue >= title.threshold && meetsMinGames;
        progress = Math.min((currentValue / title.threshold) * 100, 100);
      }
      if (title.requirement === 'isBiere'){
        currentValue = isBiere? 1 : 0
        isUnlocked = currentValue >= title.threshold && meetsMinGames;
        progress = Math.min((currentValue / title.threshold) * 100, 100);
      }
      if (title.requirement === 'isTempete'){
        currentValue = isTempete? 1 : 0
        isUnlocked = currentValue >= title.threshold && meetsMinGames;
        progress = Math.min((currentValue / title.threshold) * 100, 100);
      }
     if (title.requirement === 'mostPlayedWith') {
  const count = mostPlayedWith?.count ?? 0;

  currentValue = count;
  isUnlocked = currentValue >= title.threshold && meetsMinGames;
  progress = Math.min((currentValue / title.threshold) * 100, 100);
}

      if (title.customCheck && typeof customChecks[title.customCheck] === 'function') {
        isUnlocked = customChecks[title.customCheck](playerGames) && meetsMinGames;
        progress = isUnlocked ? 100 : 0; // Tout ou rien
      }

      return (
        <div key={title.id} className={`p-4 rounded-lg border-2 ${
          isUnlocked ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className={`font-medium ${isUnlocked ? title.color : 'text-gray-600'}`}>
              {title.title}
            </div>
            {isUnlocked && (
              <div className="text-green-600 text-sm font-medium">✓ Débloqué</div>
            )}
          </div>
          <div className="text-sm text-gray-600 mb-3">{title.description}</div>

          {/* Progress display only if threshold-based */}
          {title.requirement && title.threshold && (
            <div className="mb-2">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{currentValue} / {title.threshold}</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    isUnlocked ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Custom challenge doesn't show progress bar */}
          {title.customCheck && !title.threshold && (
            <div className="text-xs text-gray-500 italic mb-2">
              Défi spécial – statut : {isUnlocked ? 'débloqué' : 'non débloqué'}
            </div>
          )}
                    
                    {/* Min games requirement */}
                    {title.minGames && (
                      <div className={`text-xs ${meetsMinGames ? 'text-green-600' : 'text-orange-600'}`}>
                        {meetsMinGames ? '✓' : '⚠'} Minimum {title.minGames} parties requises ({stats.totalGames} jouées)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}