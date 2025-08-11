import React, { useEffect, useState } from 'react';
import { Shield, Sword, Crown } from 'lucide-react';

interface SurcoincheSuccessAnimationProps {
  playerName: string;
  onComplete: () => void;
}

export function SurcoincheSuccessAnimation({ playerName, onComplete }: SurcoincheSuccessAnimationProps) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setStage(1), 300);
    const timer2 = setTimeout(() => setStage(2), 1000);
    const timer3 = setTimeout(() => setStage(3), 2000);
    const timer4 = setTimeout(() => onComplete(), 3500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="text-center relative">
        {/* Shield and Sword Animation */}
        <div className="relative mb-8">
          {/* Shield */}
          <div className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ${
            stage >= 1 ? 'scale-100 -translate-x-20' : 'scale-0'
          }`}>
            <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center animate-pulse">
              <Shield className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Sword */}
          <div className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ${
            stage >= 1 ? 'scale-100 translate-x-20 rotate-45' : 'scale-0 rotate-0'
          }`}>
            <div className="w-24 h-24 bg-orange-600 rounded-full flex items-center justify-center animate-pulse">
              <Sword className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Clash effect */}
          {stage >= 2 && (
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-32 h-32 bg-white rounded-full animate-ping opacity-75" />
              <div className="absolute inset-0 w-32 h-32 bg-yellow-400 rounded-full animate-pulse" />
            </div>
          )}
        </div>

        {/* Victory crown */}
        {stage >= 3 && (
          <div className="mb-6 animate-bounce">
            <Crown className="w-20 h-20 text-yellow-400 mx-auto animate-spin" />
          </div>
        )}

        {/* Text animation */}
        <div className={`transition-all duration-1000 ${stage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h1 className="text-5xl font-bold text-purple-400 mb-4">
            SURCOINCHE VICTORIEUSE!
          </h1>
          <p className="text-2xl text-white font-semibold mb-4">
            {playerName} contre-attaque avec succès!
          </p>
          <div className="flex justify-center space-x-4 text-4xl">
            <span className="animate-bounce">⚔️</span>
            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>🛡️</span>
            <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>👑</span>
          </div>
        </div>

        {/* Sparks */}
        {stage >= 2 && (
          <>
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                style={{
                  left: `${50 + 40 * Math.cos((i * Math.PI) / 6)}%`,
                  top: `${50 + 40 * Math.sin((i * Math.PI) / 6)}%`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '3s'
                }}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}