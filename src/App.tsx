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
import HelpScreen from './components/HelpScreen';
import HelpBelote2j from './components/HelpBelote2j';
import HelpBelote4j from './components/HelpBelote4j';
import HelpBelote3j from './components/HelpBelote3j';
import HelpCoinche2j from './components/HelpCoinche2j';
import HelpCoinche3j from './components/HelpCoinche3j';
import HomeScreen from './components/HomeScreen';
import HelpCoinche4j from './components/HelpCoinche4j';
import { User } from 'lucide-react';
import TournamentsScreen from './components/TournamentScreen';

import CreateTournament from './components/CreateTournament';
import JoinTournament from './components/JoinTournament';
import TournamentView from './components/TournamentView';
import TournamentAssignTeams from './components/TournamentAssignTeams';
import TournamentStats from './components/TournamentStats';
import TournamentHistory from './components/TournamentHistory';

function ProfileButton() {
  const { gameState, navigateTo } = useGame();
  
  if (!gameState.currentUser || gameState.currentUser.id.startsWith('det')) return null;

  return (
    <button
      onClick={() => navigateTo('profile')}
      className="fixed top-4 right-4 z-40 p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-green-600 hover:border-green-800"
      style={{ top: 'calc(2.5rem + env(safe-area-inset-top))' }}
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
  const { currentScreen, screenParams} = useGame();
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
          case 'home': 
            return <HomeScreen />;
          case 'friends':
            return <FriendsScreen />;
          case 'help':
            return <HelpScreen />;
          case 'helpBelote2j':
            return <HelpBelote2j />;
          case 'helpBelote3j':
            return <HelpBelote3j />;
          case 'helpBelote4j':
            return <HelpBelote4j />;
          case 'helpCoinche2j':
            return <HelpCoinche2j />;
          case 'helpCoinche3j':
            return <HelpCoinche3j />;
          case 'helpCoinche4j':
            return <HelpCoinche4j />;
          case 'tournoi':
            return <TournamentsScreen />;
          case 'createtournament':
            return <CreateTournament />;
          case 'jointournoi':
            return <JoinTournament />;
          case 'tournamentview':
            return <TournamentView code={screenParams.code} />;
          case 'tournamentAssignTeams':
            return <TournamentAssignTeams code={screenParams.code} />;
            case 'tournamentStats':
            return <TournamentStats tournamentId={screenParams.code} />;
          case 'tournamentHistory':
            return <TournamentHistory code={screenParams.code} />;
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