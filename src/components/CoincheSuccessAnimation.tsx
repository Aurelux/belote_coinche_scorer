import React, { useEffect, useState } from 'react';
import { Zap, Target } from 'lucide-react';

interface CoincheSuccessAnimationProps {
  playerName: string;
  onComplete: () => void;
}

export function CoincheSuccessAnimation({ playerName, onComplete }: CoincheSuccessAnimationProps) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setStage(1), 500);
    const timer2 = setTimeout(() => setStage(2), 1500);
    const timer3 = setTimeout(() => onComplete(), 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Lightning bolts */}
        <div className="relative mb-8">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-8 h-8 text-yellow-400 animate-ping ${stage >= 1 ? 'opacity-100' : 'opacity-0'}`}
              style={{
                left: `${50 + 30 * Math.cos((i * Math.PI) / 4)}%`,
                top: `${50 + 30 * Math.sin((i * Math.PI) / 4)}%`,
                animationDelay: `${i * 0.1}s`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <Zap className="w-8 h-8" />
            </div>
          ))}
          
          <div className={`w-32 h-32 bg-yellow-500 rounded-full flex items-center justify-center mx-auto transition-all duration-1000 ${
            stage >= 1 ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
          }`}>
            <Target className="w-16 h-16 text-white animate-spin" />
          </div>
        </div>

        {/* Text animation */}
        <div className={`transition-all duration-1000 ${stage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h1 className="text-5xl font-bold text-yellow-400 mb-4 animate-bounce">
            COINCHE RÉUSSIE!
          </h1>
          <p className="text-2xl text-white font-semibold mb-4">
            {playerName} a visé juste!
          </p>
          <div className="text-6xl animate-pulse">⚡</div>
        </div>

        {/* Slap effect */}
        <div className={`absolute inset-0 bg-yellow-400 transition-opacity duration-200 ${
          stage === 1 ? 'opacity-30' : 'opacity-0'
        }`} />
      </div>
    </div>
  );
}