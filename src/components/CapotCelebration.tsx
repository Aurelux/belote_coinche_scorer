import React, { useEffect, useState } from 'react';
import { Trophy, Star } from 'lucide-react';

interface CapotCelebrationProps {
  team: 'A' | 'B' | 'C';
}

export function CapotCelebration({ team }: CapotCelebrationProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; delay: number }>>([]);

  useEffect(() => {
    const newConfetti = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2
    }));
    setConfetti(newConfetti);
  }, []);

  const getTeamColor = (team: 'A' | 'B' | 'C') => {
    const colors = {
      A: 'blue',
      B: 'red',
      C: 'green'
    };
    return colors[team];
  };

  const teamColor = getTeamColor(team);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Confetti */}
        {confetti.map(piece => (
          <div
            key={piece.id}
            className={`absolute w-3 h-3 bg-${teamColor}-500 animate-bounce`}
            style={{
              left: `${piece.x}%`,
              top: '20%',
              animationDelay: `${piece.delay}s`,
              animationDuration: '3s'
            }}
          />
        ))}
        
        {/* Main celebration */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl animate-pulse">
          <div className={`w-24 h-24 bg-${teamColor}-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-spin`}>
            <Trophy className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4 animate-bounce">
            CAPOT!
          </h1>
          
          <p className={`text-xl text-${teamColor}-600 font-semibold mb-4`}>
            {team === 'A' ? 'Équipe A' : team === 'B' ? 'Équipe B' : 'Joueur C'} fait un carton plein!
          </p>
          
          <div className="flex justify-center space-x-2">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-6 h-6 text-yellow-400 animate-ping`}
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
          
          <div className="text-3xl font-bold text-gray-900 mt-4">
            +252 points!
          </div>
        </div>
      </div>
    </div>
  );
}