import React from 'react';
import {
  ArrowLeft, Trophy, Target, Award, Crown, Users, Medal, BarChart3
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { PROFILE_TITLES } from '../types/game';

export function UserProfileScreen() {
  const { gameState, setCurrentScreen, goBack, navigateTo } = useGame();
  const user = gameState.selectedUser;

  if (!user) {
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
        <p className="mb-4">Aucun utilisateur sélectionné.</p>
        <button
          onClick={() => navigateTo('friends')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retour aux amis
        </button>
      </div>
    );
  }

  const stats = user.stats;
  const getGameModeStats = (mode: 'belote' | 'coinche', playerCount: 2 | 3 | 4) => {
    const key = `${mode}${playerCount}P` as keyof typeof stats;
    return stats[key];
  };

  const userTitle = PROFILE_TITLES.find(t => t.id === user.profileTitle);

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
      <div className="max-w-4xl mx-auto relative" style={{ top: 'calc(1.5rem + env(safe-area-inset-top))' }}>
        {/* Header */}
        <div className="bg-white text-gray-900 rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateTo('friends')}
              className="p-2 text-gray-500 hover:text-gray-800"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>

            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.displayName}
                className="w-16 h-16 rounded-full object-cover border-2 border-green-300"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
            )}

            <div>
              <h1 className="text-2xl font-bold">{user.displayName}</h1>
              <p className="text-blue-600 font-medium">{userTitle?.title}</p>
              <p className="text-sm text-gray-500">
                Membre depuis {new Intl.DateTimeFormat('fr-FR', { year: 'numeric', month: 'long' }).format(user.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Global stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={<Trophy />} label="Parties jouées" value={stats.totalGames} color="blue" />
          <StatCard icon={<Target />} label="Taux de victoire" value={`${stats.winRate.toFixed(1)}%`} color="green" />
          <StatCard icon={<Award />} label="Meilleur score" value={stats.highestScore} color="purple" />
          <StatCard icon={<Crown />} label="Capots réalisés" value={stats.totalCapots} color="yellow" />
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white text-gray-900 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4">Performance Générale</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Points marqués</span>
                <span className="font-semibold text-green-600">{stats.totalPointsScored}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Points concédés</span>
                <span className="font-semibold text-red-600">{stats.totalPointsConceded}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pénalités reçues</span>
                <span className="font-semibold text-orange-600">{stats.totalPenalties}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Moyenne par partie</span>
                <span className="font-semibold text-blue-600">{stats.averagePointsPerGame.toFixed(1)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white text-gray-900 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4">Coinche & Contrats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Coinches déclarées</span>
                <span className="font-semibold text-yellow-600">{stats.totalCoinches}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Coinches réussies</span>
                <span className="font-semibold text-green-600">{stats.successfulCoinches}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Contrats pris</span>
                <span className="font-semibold text-purple-600">{stats.totalContractsTaken}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Contrats réussis</span>
                <span className="font-semibold text-green-600">{stats.successfulContracts}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats par mode */}
        <div className="bg-white text-gray-900 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Modes de jeu</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {['belote', 'coinche'].map((mode) => (
              <div key={mode}>
                <h3 className={`text-lg font-semibold mb-2 ${mode === 'belote' ? 'text-blue-600' : 'text-red-600'}`}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </h3>
                <div className="space-y-3">
                  {[2, 3, 4].map((p) => {
                    const modeStats = getGameModeStats(mode as 'belote' | 'coinche', p as 2 | 3 | 4);
                    if (!modeStats || modeStats.games === 0) return null;

                    return (
                      <div key={p} className={`p-4 rounded-lg ${mode === 'belote' ? 'bg-blue-50' : 'bg-red-50'}`}>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-700 font-medium">{p} joueurs</span>
                          <span className="text-sm text-gray-600">{modeStats.games} parties</span>
                        </div>
                        <div className="grid grid-cols-4 text-center text-sm">
                          <div>
                            <div className="font-bold text-green-600">{modeStats.winRate.toFixed(1)}%</div>
                            <div className="text-gray-500">Victoires</div>
                          </div>
                          <div>
                            <div className="font-bold text-blue-600">{modeStats.averagePoints.toFixed(0)}</div>
                            <div className="text-gray-500">Moy. points</div>
                          </div>
                          <div>
                            <div className="font-bold text-purple-600">{modeStats.rankingScore}</div>
                            <div className="text-gray-500">Score</div>
                          </div>
                          <div>
                            <div className="font-bold text-orange-600">{modeStats.penalties}</div>
                            <div className="text-gray-500">Pénalités</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: React.ReactNode; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 text-gray-900 flex items-center space-x-4">
      <div className={`p-3 rounded-lg bg-${color}-100 text-${color}-600`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-gray-600">{label}</div>
      </div>
    </div>
  );
}