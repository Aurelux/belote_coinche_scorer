import React from 'react';
import { Spade, Crown, ArrowLeft, Play } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { GameSettings } from '../types/game';

export function GameModeSelection() {
  const { gameState, setGameSettings, setCurrentScreen, goBack, navigateTo, startNewGame } = useGame();
  const [selectedMode, setSelectedMode] = React.useState<'belote' | 'coinche'>('belote');
  const [withAnnouncements, setWithAnnouncements] = React.useState(false);
  const [targetScore, setTargetScore] = React.useState(1001);

  const playerCount = gameState.players.length as 2 | 3 | 4;

  const handleStartGame = () => {
  const settings: GameSettings = {
    mode: selectedMode,
    playerCount,
    withAnnouncements,
    targetScore
  };

  setGameSettings(settings);
  
  // Réinitialiser les scores et mains
  startNewGame();

  navigateTo('game');
};
  
  const getTeamDisplay = () => {
    if (playerCount === 2) {
      return (
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="font-semibold text-blue-600 mb-2">Joueur A</div>
            <div className="text-gray-700">{gameState.players[0]?.name}</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-red-600 mb-2">Joueur B</div>
            <div className="text-gray-700">{gameState.players[1]?.name}</div>
          </div>
        </div>
      );
    } else if (playerCount === 3) {
      return (
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="font-semibold text-blue-600 mb-2">Joueur A</div>
            <div className="text-gray-700">{gameState.players[0]?.name}</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-red-600 mb-2">Joueur B</div>
            <div className="text-gray-700">{gameState.players[1]?.name}</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-green-600 mb-2">Joueur C</div>
            <div className="text-gray-700">{gameState.players[2]?.name}</div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="font-semibold text-blue-600 mb-2">Équipe A</div>
            <div className="space-y-1">
              {gameState.players.filter(p => p.team === 'A').map(player => (
                <div key={player.id} className="text-gray-700">{player.name}</div>
              ))}
            </div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-red-600 mb-2">Équipe B</div>
            <div className="space-y-1">
              {gameState.players.filter(p => p.team === 'B').map(player => (
                <div key={player.id} className="text-gray-700">{player.name}</div>
              ))}
            </div>
          </div>
        </div>
      );
    }
  };

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
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl relative left-1/2 transform -translate-x-1/2 mb-6" style={{ top: 'calc(1.5rem + env(safe-area-inset-top))' }}>
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigateTo('setup')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mode de Jeu</h1>
            <p className="text-gray-600">Configurez votre partie ({playerCount} joueurs)</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Game Mode Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Type de jeu</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedMode('belote')}
                className={`p-6 rounded-xl border-2 transition-all duration-200 touch-manipulation ${
                  selectedMode === 'belote'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <Spade className="w-8 h-8 mx-auto mb-2" />
                <div className="font-semibold">Belote Classique</div>
                <div className="text-sm opacity-75">Jeu traditionnel</div>
              </button>
              
              <button
                onClick={() => setSelectedMode('coinche')}
                className={`p-6 rounded-xl border-2 transition-all duration-200 touch-manipulation ${
                  selectedMode === 'coinche'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <Crown className="w-8 h-8 mx-auto mb-2" />
                <div className="font-semibold">Coinche</div>
                <div className="text-sm opacity-75">Avec enchères</div>
              </button>
            </div>
          </div>

          {/* Announcements */}
          {/* <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Options</h3>
            <label className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={withAnnouncements}
                onChange={(e) => setWithAnnouncements(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-gray-900">Avec annonces</div>
                <div className="text-sm text-gray-600">Permet les annonces pendant la partie</div>
              </div>
            </label>
          </div>*/}

          {/* Target Score */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Score objectif</h3>
            <div className="grid grid-cols-3 gap-3">
              {(selectedMode === 'coinche'
    ? (playerCount === 3 ? [501, 701, 1001] : [1001, 1501, 2001])
    : [501, 701, 1001]).map(score => (
                <button
                  key={score}
                  onClick={() => setTargetScore(score)}
                  className={`py-3 px-4 rounded-lg border-2 font-semibold transition-all duration-200 ${
                    targetScore === score
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>

          {/* Team/Player Display */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {playerCount === 4 ? 'Équipes' : 'Joueurs'}
            </h3>
            {getTeamDisplay()}
          </div>

          <button
            onClick={handleStartGame}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
          >
            <Play className="w-5 h-5" />
            <span>Commencer la Partie</span>
          </button>
        </div>
      </div>
    </div>
  );
}