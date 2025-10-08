import React, { useState } from 'react';
import { X, Shield, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useGame } from '../context/GameContext';

export function PlayerConfirmationModal() {
  const { gameState, confirmPlayer, hidePlayerConfirmationModal, setCurrentScreen, navigateTo, goBack } = useGame();
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const pendingConfirmations = gameState.pendingConfirmations?.filter(conf => !conf.confirmed) || [];
  
  console.log('PlayerConfirmationModal - pendingConfirmations:', pendingConfirmations);
  console.log('PlayerConfirmationModal - gameState.showPlayerConfirmation:', gameState.showPlayerConfirmation);
  console.log('PlayerConfirmationModal - modal should show:', gameState.showPlayerConfirmation && pendingConfirmations.length > 0);
  
  if (pendingConfirmations.length === 0) {
    // All players confirmed, proceed to game
    console.log('All players confirmed, proceeding to game mode');
    hidePlayerConfirmationModal();
    navigateTo('game-mode');
    return null;
  }

  const currentConfirmation = pendingConfirmations[currentPlayerIndex];
  if (!currentConfirmation) {
    console.error('No current confirmation found');
    hidePlayerConfirmationModal();
    navigateTo('game-mode');
    return null;
  }
  
  const user = gameState.users.find(u => u.id === currentConfirmation.userId);
  const player = gameState.players.find(p => p.id === currentConfirmation.playerId);
  
  console.log('Current confirmation:', currentConfirmation);
  console.log('Found user:', user);
  console.log('Found player:', player);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) return;

    setLoading(true);
    setError('');

    try {
      const success = await confirmPlayer(currentConfirmation.userId, accessCode);
      
      if (success) {
        // Move to next player or finish
        if (currentPlayerIndex < pendingConfirmations.length - 1) {
          setCurrentPlayerIndex(currentPlayerIndex);
          setAccessCode('');
          setRetryCount(0);
        } else {
          // All players confirmed
          hidePlayerConfirmationModal();
          navigateTo('game-mode');
        }
      } else {
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        
        if (newRetryCount >= 2) {
          setError('Code incorrect. Retour à la sélection des joueurs.');
          setTimeout(() => {
            hidePlayerConfirmationModal();
            navigateTo('setup');
          }, 2000);
        } else {
          setError(`Code incorrect. ${2 - newRetryCount} tentative(s) restante(s).`);
        }
      }
    } catch (err) {
      setError('Erreur lors de la vérification');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (currentPlayerIndex < pendingConfirmations.length - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
      setAccessCode('');
      setError('');
      setRetryCount(0);
    } else {
      hidePlayerConfirmationModal();
      navigateTo('setup');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8" />
              <div>
                <h2 className="text-xl font-bold">Confirmation Joueur</h2>
                <p className="text-green-100 text-sm">
                  {currentPlayerIndex + 1} sur {pendingConfirmations.length}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                hidePlayerConfirmationModal();
                navigateTo('setup');
              }}
              className="p-2 text-green-100 hover:text-white hover:bg-green-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Player Info */}
          <div className="text-center mb-6">
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.displayName}
                className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-4 border-green-200"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-gray-600">
                  {user?.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <h3 className="text-xl font-bold text-gray-900">{user?.displayName}</h3>
            <p className="text-gray-600">{player?.name} doit confirmer sa présence</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code d'accès (4 chiffres)
              </label>
              <input
                type="password"
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value.replace(/\D/g, '').slice(0, 4));
                  setError('');
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 text-center text-2xl tracking-widest"
                placeholder="••••"
                maxLength={4}
                autoFocus
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className={`flex items-center space-x-2 p-3 rounded-lg ${
                error.includes('Trop de tentatives') 
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-amber-50 border border-amber-200 text-amber-700'
              }`}>
                {error.includes('Trop de tentatives') ? (
                  <XCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Attempts Counter */}
            <div className="text-center mb-4">
              <p className="text-gray-600">Veuillez confirmer votre présence avec votre code d'accès</p>
              <p className="text-sm text-gray-500">Tentative {retryCount + 1} sur 2</p>
            </div>

            {/* Buttons */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Passer
              </button>
              <button
                type="submit"
                disabled={loading || accessCode.length !== 4}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Confirmer</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Progress */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Progression</span>
              <span>{currentPlayerIndex + 1}/{pendingConfirmations.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentPlayerIndex + 1) / pendingConfirmations.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}