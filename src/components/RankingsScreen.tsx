import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Medal, Award, Crown, TrendingUp, Users, Target, Star,Globe, User } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { PROFILE_TITLES } from '../types/game';
import { supabase } from '../lib/supabase';


export function RankingsScreen() {
  const { gameState, setCurrentScreen, getUserRankings, navigateTo, goBack, setSelectedUser, getTimeFrameUserRankings} = useGame();
  const [selectedMode, setSelectedMode] = useState<'belote' | 'coinche'>('belote');
  const [selectedPlayerCount, setSelectedPlayerCount] = useState<2 | 3 | 4>(4);
  const [selectedGroup, setSelectedGroup] = useState<'world' | 'friends'>('world');
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<'all' | 'month'| 'week'>('all');
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number; playerId: string } | null>(null);



  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  
  useEffect(() => {
    loadRankings();
  }, [selectedMode, selectedPlayerCount,selectedGroup,selectedTimeFrame]);
  useEffect(() => {
  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, display_name, profile_picture, profile_title, stats'); // pas d'email
      
      if (error) throw error;

      const formattedUsers = (data || []).map((u: any) => ({
        id: u.id,
        displayName: u.display_name,
        profilePicture: u.profile_picture,
        profileTitle: u.profile_title,
        stats: u.stats || {}
      }));

      setUsers(formattedUsers);
    } catch (err) {
      console.error('Erreur lors du chargement des users:', err);
    }
  };

  loadUsers();
}, []);

  const loadRankings = async () => {
  setLoading(true);
  try {
    let rankingsData: PlayerRanking[] = [];

    if (selectedTimeFrame === 'all') {
      // utilisation de l'ancien getUserRankings pour le global
      rankingsData = await getUserRankings(selectedMode, selectedPlayerCount, selectedGroup);
    } else {
      // utilisation de la nouvelle fonction timeframe
      rankingsData = await getTimeFrameUserRankings(selectedMode, selectedPlayerCount, selectedTimeFrame, selectedGroup);
    }

    // Limiter à top 30
    setRankings(rankingsData.slice(0, 30));
  } catch (error) {
    console.error('Error loading rankings:', error);
    setRankings([]);
  } finally {
    setLoading(false);
  }
};




// Nouvelle fonction pour récupérer les classements par période


  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white shadow-lg';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-lg';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getProfileTitle = (titleId: string) => {
    return PROFILE_TITLES.find(t => t.title === titleId);
  };

  const getCurrentUserRank = () => {
    if (!gameState.currentUser) return null;
    return rankings.find(r => r.userId === gameState.currentUser!.id);
  };

  const currentUserRank = getCurrentUserRank();

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
      <div className="max-w-4xl mx-auto relative" style={{ top: 'calc(1.5rem + env(safe-area-inset-top))' }}>
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateTo('profile')}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Classements</h1>
              <p className="text-gray-600">Top 30 joueurs par mode</p>
            </div>
          </div>
        </div>

        {/* Mode and Player Count Selection */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Game Mode Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mode de jeu</h3>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <button
                  onClick={() => setSelectedMode('belote')}
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedMode === 'belote'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="font-semibold">Belote</div>
                  <div className="text-sm opacity-75">Classique</div>
                </button>
                
                <button
                  onClick={() => setSelectedMode('coinche')}
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedMode === 'coinche'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="font-semibold">Coinche</div>
                  <div className="text-sm opacity-75">Avec enchères</div>
                </button>
              </div>
            </div>

            {/* Player Count Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Nombre de joueurs</h3>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[2, 3, 4].map(count => (
                  <button
                    key={count}
                    onClick={() => setSelectedPlayerCount(count as 2 | 3 | 4)}
                    className={`py-2 sm:py-3 px-3 sm:px-4 rounded-lg border-2 font-semibold transition-all duration-200 text-sm sm:text-base ${
                      selectedPlayerCount === count
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {count}J
                  </button>
                ))}
              </div>
            </div>
            <div>
  <h3 className="text-lg font-semibold text-gray-900 mb-4">Classement</h3>
  <div className="grid grid-cols-2 gap-2 sm:gap-3">
    {[
      { key: 'world', label: 'Monde', icon: <Globe size={18} /> },
      { key: 'friends', label: 'Amis', icon: <Users size={18} /> }
    ].map(option => (
      <button
        key={option.key}
        onClick={() => setSelectedGroup(option.key)}
        className={`flex items-center justify-center gap-2 py-2 sm:py-3 px-3 sm:px-4 rounded-lg border-2 font-semibold transition-all duration-200 text-sm sm:text-base ${
          selectedGroup === option.key
            ? 'border-blue-500 bg-blue-50 text-blue-700'
            : 'border-gray-200 hover:border-gray-300 text-gray-700'
        }`}
      >
        <span className="text-lg">{option.icon}</span>
        {option.label}
      </button>
    ))}
  </div>
  <h3 className="text-lg font-semibold text-gray-900 mb-4">Temporalité</h3>
<div className="grid grid-cols-3 gap-2 sm:gap-3">
  {['all','month','week'].map(tf => (
    <button
      key={tf}
      onClick={() => setSelectedTimeFrame(tf)}
        className={`flex items-center justify-center gap-2 py-2 sm:py-3 px-3 sm:px-4 rounded-lg border-2 font-semibold transition-all duration-200 text-sm sm:text-base ${
          selectedTimeFrame === tf
            ? 'border-blue-500 bg-blue-50 text-blue-700'
            : 'border-gray-200 hover:border-gray-300 text-gray-700'
        }`}
    >
      {tf === 'all' ? 'Global' : tf === 'week' ? 'Hebdo' : 'Mensuel'}
    </button>
  ))}
</div>

</div>
          </div>
        </div>

        {/* Current User Rank (if not in top 30) */}
        {currentUserRank && currentUserRank.rank > 30 && (
          <div className="bg-white rounded-2xl shadow-xl p-4 mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center space-x-2">
              <Star className="w-5 h-5 text-blue-600" />
              <span>Votre classement</span>
            </h3>
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    #{currentUserRank.rank}
                  </div>
                  <div className="flex items-center space-x-2">
                    {gameState.currentUser?.profilePicture ? (
                      <img
                        src={gameState.currentUser.profilePicture}
                        alt={gameState.currentUser.displayName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{gameState.currentUser?.displayName}</div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">{currentUserRank.rankingScore}</div>
                  <div className="text-xs text-gray-600">{currentUserRank.winRate.toFixed(1)}% victoires</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rankings */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
          <div className="flex items-center space-x-3 mb-4 sm:mb-6">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              Top 30 - {selectedMode === 'belote' ? 'Belote' : 'Coinche'}  à {selectedPlayerCount}J ({selectedTimeFrame} - {selectedGroup})
            </h3>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des classements...</p>
            </div>
          ) : rankings.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Aucun classement disponible</h4>
              <p className="text-gray-600">
                Aucun joueur n'a encore joué en mode {selectedMode === 'belote' ? 'Belote' : 'Coinche'} à {selectedPlayerCount} joueurs.
              </p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {rankings.map((player, index) => {
                const profileTitle = getProfileTitle(player.profileTitle || 'player');
                const rankIcon = getRankIcon(player.rank);
                
                return (
                  <div
                    key={player.userId}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 ${
                      player.rank <= 3
                        ? 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                    onClick={(e) => {
  const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
  const popupWidth = 150; // largeur approximative du popup
  let x = rect.left + 8;  // départ à gauche + petit offset

  // Empêcher le popup de dépasser l'écran à droite
  if (x + popupWidth > window.innerWidth) {
    x = window.innerWidth - popupWidth - 8; // 8px de marge
  }
  // Chercher le user correspondant à player.userId
  const user = users.find(u => u.id === player.userId);
  if (!user) return; // sécurité

   if (popupPosition && popupPosition.playerId.id === user.id) {
    setPopupPosition(null);
    return;
  }

  setPopupPosition({
    x,
    y: rect.top + rect.height / 2, // centre verticalement sur le joueur
    playerId: user,
  });
}}
>
                  
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        {/* Rank Badge */}
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base ${getRankBadgeColor(player.rank)}`}>
                          {rankIcon || player.rank}
                        </div>

                        {/* Player Info */}
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                          {player.profilePicture ? (
                            <img
                              src={player.profilePicture}
                              alt={player.name}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">{player.name}</div>
                            <div className={`text-xs sm:text-sm font-medium truncate ${profileTitle?.color || 'text-gray-600'}`}>
                              {profileTitle?.title || 'Joueur'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stats - Mobile Optimized */}
                      <div className="flex items-center space-x-3 sm:space-x-6 flex-shrink-0">
                        <div className="text-center">
                          <div className="text-lg sm:text-2xl font-bold text-blue-600">{player.rankingScore}</div>
                          <div className="text-xs text-gray-600">Score</div>
                        </div>
                        <div className="text-center hidden sm:block">
                          <div className="text-lg font-semibold text-green-600">{player.winRate.toFixed(1)}%</div>
                          <div className="text-xs text-gray-600">Victoires</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm sm:text-lg font-semibold text-purple-600">{player.gamesPlayed}</div>
                          <div className="text-xs text-gray-600">Parties</div>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Stats Row */}
                    <div className="mt-2 pt-2 border-t border-gray-200 sm:hidden">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{player.winRate.toFixed(1)}% victoires</span>
                        <span>{player.averagePoints.toFixed(0)} pts/partie</span>
                        {selectedMode === 'coinche' && (
                          <span>{player.totalCoinches} coinches</span>
                        )}
                      </div>
                    </div>

                    {/* Additional info for top 3 on desktop */}
                    {player.rank <= 3 && (
                      <div className="mt-3 pt-3 border-t border-yellow-200 hidden sm:block">
                        <div className="flex items-center justify-center space-x-6 text-sm">
                          <div className="flex items-center space-x-1 text-gray-600">
                            <TrendingUp className="w-4 h-4" />
                            <span>Taux de victoire: {player.winRate.toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center space-x-1 text-gray-600">
                            <Target className="w-4 h-4" />
                            <span>Perf: {((player.pointsScored - player.pointsConceded)/player.gamesPlayed).toFixed(0)} pts/partie</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
            </div>
          )}
          {popupPosition && (
  <div
    className="fixed bg-green-50 rounded-xl shadow-lg border border-green-200 p-4 z-50"
    style={{
      top: popupPosition.y,
      left: popupPosition.x + 120,
      transform: 'translateY(-50%)',
      minWidth: '160px',
    }}
  >
    <div className="flex flex-col space-y-3">
      <button
        className="flex items-center gap-2 px-3 py-2 text-green-700 font-medium text-sm bg-white rounded-lg shadow-sm hover:bg-green-100 transition-all duration-200"
        onClick={() => {
          setSelectedUser(popupPosition.playerId);
          navigateTo('user-profile');
          setPopupPosition(null);
        }}
      >
        <User className="w-4 h-4" />
        Voir le profil
      </button>
    </div>
  </div>
)}

        </div>
        

        {/* Ranking Explanation */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mt-4 sm:mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Comment fonctionne le classement ?</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <strong>Score de classement</strong> : Formule avancée basée sur :
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Taux de victoire</strong> (0-40 points) : Pourcentage de parties gagnées</li>
              <li><strong>Bonus expérience</strong> (un poids entre 0.7 et 1) : Récompense le nombre de parties jouées</li>
              <li><strong>Bonus performance</strong> (max 40 points) : Ratio points marqués/concédés</li>
              <li><strong>Bonus coinche</strong> (max 10 points) : Taux de réussite des coinches</li>
              <li><strong>Bonus contrats et activté</strong> (max 15 points) : Taux de réussite des contrats pris*nombre de conrtat pris par parties</li>
              <li><strong>Bonus capots</strong> (max 10 points) : Nombre de capots réalisés par partie</li>
              <li><strong>Malus pénalités</strong> (max -10 points) : Pénalités reçues</li>
            </ul>
            <p className="text-xs text-gray-500 mt-3">
              * Certaines parties peuvent etre annulées et non comptabilisées (algo d'anti-triche).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}