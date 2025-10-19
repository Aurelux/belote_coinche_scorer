import React, { useState } from 'react';
import { Users, Mail, Lock, Camera, UserPlus, LogIn, Eye, EyeOff, User } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { PROFILE_TITLES } from '../types/game';

export function AuthScreen() {
  const { registerUser, loginUser, setCurrentScreen, navigateTo, goBack, updateProfilePicture, gameState, setGameState } = useGame();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    accessCode: '',
    confirmAccessCode: '',
    profilePicture: '',
    profileTitle: 'player'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
const letsInvite = () => {
  setGameState({
      ...gameState,
      currentUser: undefined,
    });

  navigateTo("home");
};
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const user = await loginUser(formData.email, formData.accessCode);
        if (user) {
          setCurrentScreen('home');
        } else {
          setError('Email ou code d\'accès incorrect');
        }
      } else {
        // Register
        if (formData.accessCode !== formData.confirmAccessCode) {
          setError('Les codes d\'accès ne correspondent pas');
          return;
        }
        
        if (formData.accessCode.length !== 4 || !/^\d{4}$/.test(formData.accessCode)) {
          setError('Le code d\'accès doit contenir exactement 4 chiffres');
          return;
        }

        if (!formData.displayName.trim()) {
          setError('Le nom d\'affichage est requis');
          return;
        }

        await registerUser({
          displayName: formData.displayName.trim(),
          email: formData.email,
          accessCode: formData.accessCode,
          profilePicture: formData.profilePicture,
          profileTitle: formData.profileTitle,
          friends: [],
          achievements: []
        });
        navigateTo('home');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
  
      setUploadingPhoto(true);
      try {
        await updateProfilePicture(file);
      } catch (error) {
        console.error('Error uploading photo:', error);
      } finally {
        setUploadingPhoto(false);
      }
    };
  

  const defaultTitles = PROFILE_TITLES.filter(title => !title.requirement);

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
    
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-green-800 to-green-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Connexion' : 'Créer un compte'}
          </h1>
          <p className="text-gray-600">
            {isLogin ? 'Connectez-vous à votre compte' : 'Rejoignez la communauté Belote & Coinche'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <>
              {/* Profile Picture Upload */}
              <div className="text-center">
                <div className="relative inline-block">
                  {formData.profilePicture ? (
                    <img
                      src={formData.profilePicture}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover border-4 border-gray-200"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center border-4 border-gray-200">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-600 mt-2">Photo de profil (optionnel)</p>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom d'affichage
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                  placeholder="Votre nom d'affichage"
                  required
                />
              </div>

              {/* Profile Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre de profil
                </label>
                <select
                  value={formData.profileTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, profileTitle: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                >
                  {defaultTitles.map(title => (
                    <option key={title.id} value={title.id}>
                      {title.title} - {title.description}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                placeholder="votre@email.com"
                required
              />
            </div>
          </div>

          {/* Access Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code d'accès (4 chiffres)
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.accessCode}
                onChange={(e) => setFormData(prev => ({ ...prev, accessCode: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-center text-2xl tracking-widest touch-manipulation"
                placeholder="••••"
                maxLength={4}
                inputMode="numeric"
                pattern="[0-9]*"
                
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Access Code (Register only) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le code d'accès
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmAccessCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmAccessCode: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-center text-2xl tracking-widest"
                  placeholder="••••"
                  maxLength={4}
                  inputMode="numeric"
                pattern="[0-9]*"
                  required
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-700 to-green-800 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                <span>{isLogin ? 'Se connecter' : 'Créer le compte'}</span>
              </>
            )}
          </button>
        </form>

        {/* Separator */}
<hr className="my-10 border-t border-green-800 opacity-60" />

{/* Toggle Login/Register */}
<div className="text-center space-y-3">
  <h3 className="text-lg font-semibold text-gray-500">
    {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
  </h3>
  <button
    onClick={() => {
      setIsLogin(!isLogin);
      setError('');
      setFormData({
        displayName: '',
        email: '',
        accessCode: '',
        confirmAccessCode: '',
        profilePicture: '',
        profileTitle: 'player'
      });
    }}
    className="bg-green-700 hover:bg-green-600 text-white px-5 py-3 rounded-xl text-base font-medium shadow-md transition-all duration-200"
  >
    {isLogin ? "Créer un compte" : "Se connecter"}
  </button>
  <p className="text-gray-400 text-sm italic">
  (Suis tes progrès, rejoins le classement mondial et organise des tournois !)
</p>

</div>

{/* Separator */}
<hr className="my-10 border-t border-green-800 opacity-60" />

{/* Guest Mode */}
<div className="text-center space-y-3">
  <h3 className="text-lg font-semibold text-gray-500">
    Tu veux jouer sans compte ?
  </h3>
  <button
    onClick={letsInvite}
    className="bg-green-700 hover:bg-green-600 text-white px-5 py-3 rounded-xl text-base font-medium shadow-md transition-all duration-200"
  >
    Continuer en mode invité
  </button>
  <p className="text-gray-400 text-sm italic">
    (Tu pourras rejoindre des tournois et compter des parties)
  </p>
</div>



        {/* Profile Button for Logged Users */}
        
      </div>
    </div>
  );
}