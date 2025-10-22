import React, { useState } from 'react';
import { X, Skull, AlertTriangle } from 'lucide-react';
import { useGame } from '../context/GameContext';

interface PenaltyModalProps {
  team: 'A' | 'B' | 'C';
  onClose: () => void;
  onSubmit: (playerId: string, points: number, reason?: string) => void;
}

export function PenaltyModal({ team, onClose, onSubmit }: PenaltyModalProps) {
  const { gameState, applyPenaltyToPlayer } = useGame();
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [penaltyPoints, setPenaltyPoints] = useState(30);
  const [reason, setReason] = useState('');

  const teamPlayers = gameState.players.filter(p => p.team === team);
  const teamColor = team === 'A' ? 'blue' : team === 'B' ? 'red' : 'green';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlayer && penaltyPoints > 0) {
      
      onSubmit(selectedPlayer, penaltyPoints, reason || undefined);
    }
  };

  const presetPenalties = [25, 50, 100, 162, 250];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`p-2 bg-${teamColor}-100 rounded-lg`}>
              <Skull className={`w-6 h-6 text-${teamColor}-600`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Pénalité</h2>
              <p className="text-sm text-gray-600">
                {gameState.settings.playerCount === 4 ? 'Équipe' : 'Joueur'} {team}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Player Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Joueur à pénaliser
            </label>
            <div className="space-y-2">
              {teamPlayers.map(player => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => setSelectedPlayer(player.id)}
                  className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                    selectedPlayer === player.id
                      ? `border-${teamColor}-500 bg-${teamColor}-50`
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {player.profilePicture ? (
                      <img
                        src={player.profilePicture}
                        alt={player.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {player.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{player.name}</div>
                      {player.profileTitle && (
                        <div className="text-xs text-gray-500">{player.profileTitle}</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Penalty Points */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Points de pénalité
            </label>
            
            

            {/* Custom input */}
            <input
  type="number"
  value={penaltyPoints}
  onChange={(e) => {
    let val = parseInt(e.target.value) || 0;

    // 🔹 On limite entre 0 et 250
    if (val > 250) val = 250;
    if (val < 0) val = 0;

    setPenaltyPoints(val);
  }}
  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all duration-200 text-center text-xl font-bold"
  min="0"
  max="250"
  placeholder="Points personnalisés"
/>
          </div>

          {/* Reason */}
          

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Attention</p>
                <p>
                  Cette pénalité sera immédiatement appliquée au score de l'équipe.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!selectedPlayer || penaltyPoints <= 0}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Appliquer Pénalité
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}