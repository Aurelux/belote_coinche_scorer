import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, UserPlus, Search, Check, X, Mail } from 'lucide-react';
import { useGame } from '../context/GameContext';

export function FriendsScreen() {
  const { 
    gameState, 
    setCurrentScreen, 
    searchUsers, 
    sendFriendRequest, 
    acceptFriendRequest, 
    declineFriendRequest,
    loadFriends,
    loadFriendRequests,
    setSelectedUser,
    goback,
    navigateTo
  } = useGame();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');

  useEffect(() => {
    loadFriends();
    loadFriendRequests();
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 2) {
      setLoading(true);
      try {
        const results = await searchUsers(query);
        // Filter out current user and existing friends
        const filteredResults = results.filter(user => 
          user.id !== gameState.currentUser?.id &&
          !gameState.friends.some(friend => friend.id === user.id)
        );
        setSearchResults(filteredResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setSearchResults([]);
    }
  };
  
  const handleSendFriendRequest = async (userId: string) => {
    try {
      await sendFriendRequest(userId);
      // Remove from search results
      setSearchResults(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await declineFriendRequest(requestId);
    } catch (error) {
      console.error('Error declining friend request:', error);
    }
  };

  const viewProfile = (user: any) => {
    setSelectedUser(user);
    navigateTo('user-profile');
  };

  return (
    <div className="min-h-screen pt-safe pb-safe flex items-center justify-center p-4"

     style={{

       backgroundColor: '#042204', // vert très foncé

       backgroundImage: `
          radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px),
          radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)
        `,

       backgroundPosition: '0 0, 10px 10px',

       backgroundSize: '20px 20px'

     }}

>

      <div className="max-w-4xl mx-auto relative" style={{ top: 'calc(1.5rem + env(safe-area-inset-top))' }}>
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateTo('profile')}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Amis</h1>
              <p className="text-gray-600">Gérez vos amis et invitations</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex space-x-1 mb-6">
            {[
              { id: 'friends', label: 'Mes Amis', count: gameState.friends.length },
              { id: 'requests', label: 'Demandes', count: gameState.friendRequests.length },
              { id: 'search', label: 'Rechercher', count: null }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className="ml-2 px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Friends Tab */}
          {activeTab === 'friends' && (
            <div className="space-y-4">
              {gameState.friends.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun ami</h3>
                  <p className="text-gray-600 mb-4">Commencez par rechercher et ajouter des amis</p>
                  <button
                    onClick={() => setActiveTab('search')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Rechercher des amis
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gameState.friends.map(friend => (
                    <div key={friend.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        {friend.profilePicture ? (
                          <img
                            src={friend.profilePicture}
                            alt={friend.displayName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-gray-600" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{friend.displayName}</h4>
                          <p className="text-sm text-gray-600">{friend.profileTitle || 'Joueur'}</p>
                        </div>
                        <button
                          onClick={() => viewProfile(friend)}
                          className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          Voir profil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              {gameState.friendRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune demande</h3>
                  <p className="text-gray-600">Vous n'avez pas de demandes d'amis en attente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {gameState.friendRequests.map(request => {
                    // Find the user who sent the request
                    const fromUser = gameState.users.find(u => u.id === request.fromUserId);
                    return (
                      <div key={request.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {fromUser?.profilePicture ? (
                              <img
                                src={fromUser.profilePicture}
                                alt={fromUser.displayName}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-gray-600" />
                              </div>
                            )}
                            <div>
                              <h4 className="font-medium text-gray-900">{fromUser?.displayName || 'Utilisateur inconnu'}</h4>
                              <p className="text-sm text-gray-600">Demande d'ami</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleAcceptRequest(request.id)}
                              className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeclineRequest(request.id)}
                              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Rechercher par nom ou email..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                />
              </div>

              {loading && (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-600 mt-2">Recherche en cours...</p>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-3">
                  {searchResults.map(user => (
                    <div key={user.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {user.profilePicture ? (
                            <img
                              src={user.profilePicture}
                              alt={user.displayName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-gray-600" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-medium text-gray-900">{user.displayName}</h4>
                            
                            <p className="text-xs text-gray-500">{user.profileTitle || 'Joueur'}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => viewProfile(user)}
                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Voir profil
                          </button>
                          <button
                            onClick={() => handleSendFriendRequest(user.id)}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                          >
                            <UserPlus className="w-4 h-4" />
                            <span>Ajouter</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery.length > 2 && !loading && searchResults.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun résultat</h3>
                  <p className="text-gray-600">Aucun utilisateur trouvé pour "{searchQuery}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}