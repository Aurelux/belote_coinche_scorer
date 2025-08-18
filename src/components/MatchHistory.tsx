import React, { useEffect, useState } from 'react';

import { ArrowLeft, Trophy, Clock, Users, Target, Calendar } from 'lucide-react';
import { useGame } from '../context/GameContext';

export function MatchHistory() {
  const { gameState, setCurrentScreen, loadMatchHistory, navigateTo, goBack } = useGame();
  
  useEffect(() => {
    loadMatchHistory();
  }, []);

  

  if (!gameState.matchHistory.length) {
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
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucun historique</h2>
          <p className="text-gray-600 mb-6">Terminez quelques parties pour voir l'historique des matchs</p>
          <button
            onClick={() => goBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour au Jeu
          </button>
        </div>
      </div>
    );
  }
 
  const formatDate = (rawDate: string | Date) => {
    const date = new Date(rawDate);
    if (isNaN(date.getTime())) return 'Date invalide';

    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''}`;
  };

  const getTeamColor = (team: 'A' | 'B' | 'C') => {
    const colors = {
      A: 'blue',
      B: 'red',
      C: 'green'
    };
    return colors[team];
  };

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
      <div className="max-w-4xl mx-auto relative" style={{ top: 'calc(.5rem + env(safe-area-inset-top))' }}>
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={goBack}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Historique des Matchs</h1>
              <p className="text-gray-600">{gameState.matchHistory.length} parties terminées</p>
            </div>
          </div>
        </div>

        {/* Match History List */}
        <div className="space-y-4">
          {gameState.matchHistory.slice().reverse().map((match, index) => {
            const winningTeamColor = getTeamColor(match.winningTeam);
            const isTeamMode = match.settings.playerCount === 4;
            
            return (
              <div key={match.id} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  {/* Match Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`w-3 h-3 bg-${winningTeamColor}-500 rounded-full`}></div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Victoire {isTeamMode ? "de l'Équipe" : "du Joueur"} {match.winningTeam}
                      </h3>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        #{gameState.matchHistory.length - index}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(match.timestamp)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDuration(match.duration)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{match.settings.playerCount} joueurs</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Target className="w-4 h-4" />
                        <span>{match.settings.mode === 'belote' ? 'Belote' : 'Coinche'}</span>
                      </div>
                    </div>

                    {/* Players */}
                    <div className={`grid gap-3 ${match.settings.playerCount === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                      {/* Team/Player A */}
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="font-semibold text-blue-700 mb-1">
                          {isTeamMode ? 'Équipe A' : 'Joueur A'}
                        </div>
                        <div className="space-y-1">
                          {match.players.filter(p => p.team === 'A').map(player => (
                            <div key={player.id} className="text-sm text-gray-700">
                              {player.name}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Team/Player B */}
                      <div className="bg-red-50 rounded-lg p-3">
                        <div className="font-semibold text-red-700 mb-1">
                          {isTeamMode ? 'Équipe B' : 'Joueur B'}
                        </div>
                        <div className="space-y-1">
                          {match.players.filter(p => p.team === 'B').map(player => (
                            <div key={player.id} className="text-sm text-gray-700">
                              {player.name}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Player C (3-player mode) */}
                      {match.settings.playerCount === 3 && (
                        <div className="bg-green-50 rounded-lg p-3">
                          <div className="font-semibold text-green-700 mb-1">Joueur C</div>
                          <div className="space-y-1">
                            {match.players.filter(p => p.team === 'C').map(player => (
                              <div key={player.id} className="text-sm text-gray-700">
                                {player.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Final Scores */}
                  <div className="lg:ml-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 text-center">Score Final</h4>
                      <div className={`grid gap-3 ${match.settings.playerCount === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${
                            match.winningTeam === 'A' ? 'text-blue-600' : 'text-gray-600'
                          }`}>
                            {match.finalScores.teamA}
                          </div>
                          <div className="text-xs text-gray-500">A</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${
                            match.winningTeam === 'B' ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {match.finalScores.teamB}
                          </div>
                          <div className="text-xs text-gray-500">B</div>
                        </div>
                        {match.settings.playerCount === 3 && (
                          <div className="text-center">
                            <div className={`text-2xl font-bold ${
                              match.winningTeam === 'C' ? 'text-green-600' : 'text-gray-600'
                            }`}>
                              {match.finalScores.teamC}
                            </div>
                            <div className="text-xs text-gray-500">C</div>
                          </div>
                        )}
                      </div>
                      <div className="text-center mt-2 text-xs text-gray-500">
                        {match.handsPlayed} mains jouées
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}