import React from "react";
import { Trophy, Gamepad2, BarChart3, BookOpen, Spade } from "lucide-react";
import { useGame } from "../context/GameContext";

export default function HomeScreen() {
  const { navigateTo, gameState } = useGame();

  const menuItems = [
    { label: "Compter une partie", icon: <Spade className="w-5 h-5 sm:w-6 sm:h-6" />, page: "setup" },
    { label: "Tournois", icon: <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />, page: "tournoi" },
    { label: "Classement", icon: <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />, page: "rankings" },
    { label: "Règles", icon: <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />, page: "help" },
  ];

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
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl relative left-1/2 transform -translate-x-1/2" style={{ top: 'calc(1.5rem + env(safe-area-inset-top))' }}>
        
        {/* LOGO */}
        <div className="flex flex-col items-center mb-8 sm:mb-10">
          <img
            src="../ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"
            alt="Coinche Royale"
            className="w-24 h-24 sm:w-32 sm:h-32 mb-4 rounded-2xl shadow-md"
          />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-green-800 text-center drop-shadow-sm">
            Coinche Royale
          </h1>
          <p className="text-green-700 text-center mt-2 text-base sm:text-lg font-medium leading-snug">
            Prouvez enfin que vous êtes le·la meilleur·e à la table !
          </p>
        </div>

        {/* MENU */}
        <div className="flex flex-col space-y-4 w-full">
  {menuItems.map((item) => {
    const isDisabled = item.page === "rankings" && !gameState.currentUser;
    const isSemiBlock = item.page === "tournoi" && !gameState.currentUser;
    return (
      <div key={item.page} className="flex flex-col">
        <button
          onClick={() => !isDisabled && navigateTo(item.page)}
          className={`
            w-full px-4 py-4 rounded-2xl shadow-lg flex flex-col justify-center items-center space-x-3 transition-all duration-200 text-lg sm:text-xl font-semibold touch-manipulation
            ${isDisabled 
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-green-600 hover:bg-green-700 active:bg-green-800 text-white"
            }
          `}
          style={{ minHeight: "3.5rem" }}
          disabled={isDisabled}
        >
          
          <div className="flex items-center space-x-2">
    {item.icon}
    <span>{item.label}</span>
  </div>
  {isDisabled && (
    <span className="text-xs text-gray-200 italic">
      Créez un compte pour consulter les classements
    </span>
  )}
  {isSemiBlock && (
          <p className="mt-1 text-xs text-white-500 text-center">
            (Vous ne pouvez que rejoindre un tournoi)
          </p>
        )}
        </button>
        
      </div>
    );
  })}
</div>

        {/* Footer */}
        <p className="mt-8 text-xs sm:text-sm text-gray-500 text-center">
          © 2025 Coinche Royale — Tous droits réservés
        </p>
      </div>
    </div>
  );
}
