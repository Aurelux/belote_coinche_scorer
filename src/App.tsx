import React , { useEffect, useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { AuthScreen } from './components/AuthScreen';
import { PlayerSetup } from './components/PlayerSetup';
import { GameModeSelection } from './components/GameModeSelection';
import { GameBoard } from './components/GameBoard';
import { Analytics } from './components/Analytics';
import { MatchHistory } from './components/MatchHistory';
import { ProfileScreen } from './components/ProfileScreen';
import { UserProfileScreen } from './components/UserProfileScreen';
import { RankingsScreen } from './components/RankingsScreen';
import { FriendsScreen } from './components/FriendsScreen';
import SplashScreen from './components/SplashScreen';
import { User } from 'lucide-react';

function ProfileButton() {
  const { gameState, setCurrentScreen } = useGame();
  
  if (!gameState.currentUser) return null;

  return (
    <button
      onClick={() => setCurrentScreen('profile')}
      className="fixed top-4 right-4 z-40 p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-green-100 hover:border-green-300"
      style={{ top: 'calc(1.5rem + env(safe-area-inset-top))' }}
      title="Mon profil"
    >
      {gameState.currentUser.profilePicture ? (
        <img
          src={gameState.currentUser.profilePicture}
          alt={gameState.currentUser.displayName}
          className="w-8 h-8 rounded-full object-cover"
        />
      ) : (
        <User className="w-8 h-8 text-green-600" />
      )}
    </button>
  );
}

function AppContent() {
  const { currentScreen } = useGame();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simule un démarrage d’app, puis on cache le splash
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 3600); // 👈 attend 4s

    return () => clearTimeout(timeout);
  }, []);

  if (isLoading) return <SplashScreen onFinish={() => setIsLoading(false)} />;

  return (
    <div className="relative">
      <ProfileButton />
      
      {(() => {
        switch (currentScreen) {
          case 'auth':
            return <AuthScreen />;
          case 'setup':
            return <PlayerSetup />;
          case 'game-mode':
            return <GameModeSelection />;
          case 'game':
            return <GameBoard />;
          case 'analytics':
            return <Analytics />;
          case 'history':
            return <MatchHistory />;
          case 'profile':
            return <ProfileScreen />;
          case 'user-profile':
            return <UserProfileScreen />;
          case 'rankings':
            return <RankingsScreen />;
          case 'friends':
            return <FriendsScreen />;
          default:
            return <AuthScreen />;
        }
      })()}
    </div>
  );
}

function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

export default App;