import React from 'react';
import { ArrowLeft, Trophy, Target, TrendingUp, Crown, Zap, Shield, User, TrendingDown, Award } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export function Analytics() {
  const { gameState, setCurrentScreen, navigateTo, goBack } = useGame();

  if (!gameState.hands.length) {
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

>        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucune donnée</h2>
          <p className="text-gray-600 mb-6">Jouez quelques mains pour voir les statistiques !</p>
          <button
            onClick={() => navigateTo('game')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Retour au Jeu
          </button>
        </div>
      </div>
    );
  }

  // Calculate score evolution data
    
  const scoreEvolution = gameState.hands.reduce((acc, hand, index) => {
    const prevData = acc[index - 1] || { teamA: 0, teamB: 0, teamC: 0 };
    
    acc.push({
      hand: index + 1,
      teamA: prevData.teamA + (hand.teamAScore || 0),
      teamB: prevData.teamB + (hand.teamBScore || 0),
      teamC: prevData.teamC + (hand.teamCScore || 0)
    });
    
    return acc;
  }, [] as Array<{ hand: number; teamA: number; teamB: number; teamC: number }>);

  // Calculate team statistics
  const teamStats = {
    A: {
      handsWon: gameState.hands.filter(h => h.winningTeam === 'A').length,
      totalPoints: gameState.teamAScore,
      capots: gameState.hands.filter(h => h.winningTeam === 'A' && h.isCapot).length,
      avgPoints: Math.round(gameState.teamAScore / Math.max(gameState.hands.filter(h => h.winningTeam === 'A').length, 1))
    },
    B: {
      handsWon: gameState.hands.filter(h => h.winningTeam === 'B').length,
      totalPoints: gameState.teamBScore,
      capots: gameState.hands.filter(h => h.winningTeam === 'B' && h.isCapot).length,
      avgPoints: Math.round(gameState.teamBScore / Math.max(gameState.hands.filter(h => h.winningTeam === 'B').length, 1))
    },
    C: {
      handsWon: gameState.hands.filter(h => h.winningTeam === 'C').length,
      totalPoints: gameState.teamCScore,
      capots: gameState.hands.filter(h => h.winningTeam === 'C' && h.isCapot).length,
      avgPoints: Math.round(gameState.teamCScore / Math.max(gameState.hands.filter(h => h.winningTeam === 'C').length, 1))
    }
  };

  // Player individual stats
  const playerStats = gameState.players.map(player => {
  const takenHands = gameState.hands.filter(h => h.taker === player.id);
  const coincheHands = gameState.hands.filter(h => h.coincher === player.id);
  const surcoincheHands = gameState.hands.filter(h => h.surcoincher === player.id);

  const successfulCoinches = gameState.hands.filter(h => h.coincher === player.id && h.isCoincheSuccessful);
  const successfulSurcoinches = gameState.hands.filter(h => h.surcoincher === player.id && h.isSurcoincheSuccessful);
  const contractsWon = gameState.hands.filter(h => h.taker === player.id && h.contractFulfilled);

  // points pour contrat réussi
  const is3Players = gameState.settings.playerCount === 3;
  const is2Players = gameState.settings.playerCount === 2;
    

  let pointsScored = 0;
  let pointsConceded = 0;

  // ------------------------------------------------------------
  // 🔹 CONTRATS RÉUSSIS (non coinchés / surcoinchés)
  // ------------------------------------------------------------
  gameState.hands
    .filter(h => h.contractFulfilled && !h.coincher && !h.surcoincher)
    .forEach(h => {
      const takerTeam = gameState.players.find(p => p.id === h.taker)?.team;
      if (!takerTeam) return;

      if (is3Players) {
        // à 3 joueurs : si ce joueur n’est PAS le preneur → il gagne exactement ses points
        if (player.team !== takerTeam) {
          const score = player.team === 'A' ? h.teamAScore :
                        player.team === 'B' ? h.teamBScore :
                                              h.teamCScore;
          pointsScored += (score || 0);
        } else {
          // preneur : il gagne son propre score (celui de sa team)
          const score = player.team === 'A' ? h.teamAScore :
                        player.team === 'B' ? h.teamBScore :
                                              h.teamCScore;
          pointsScored += (score || 0);
        }
      } if (is2Players) {
        // à 2 joueurs (équipes)
        if (player.team === takerTeam) {
          // preneur ou coéquipier : il gagne ses points
          const score = player.team === 'A' ? h.teamAScore : h.teamBScore;
          pointsScored += (score || 0);
        } else {
          // adverse : il gagne la moitié de ses points car partagé
          const opponentScore = player.team === 'A' ? h.teamAScore : h.teamBScore;
          pointsScored += (opponentScore || 0);
        }
      } if (!is2Players && !is3Players) {
        if (player.team === takerTeam && player.id === h.taker){
          pointsScored+= player.team === 'A' ? h.teamAScore : player.team === 'B' ? h.teamBScore : h.teamCScore;
        }
       if ( player.team !== takerTeam){
          pointsScored += (player.team === 'A' ? h.teamAScore : player.team === 'B' ? h.teamBScore : h.teamCScore)/2;
        }
        

    // Score fait par l'équipe du joueur
    
  
      }
    
    });
  gameState.hands
    
    .filter(h => h.isCoincheSuccessful && !h.surcoincher)
    .forEach(h => {
      const takerTeam = gameState.players.find(p => p.id === h.taker)?.team;
      const coincherTeam = gameState.players.find(p => p.id === h.coincher)?.team;

      if (!takerTeam || !coincherTeam) return;

      const scoreA = h.teamAScore || 0;
      const scoreB = h.teamBScore || 0;
      const scoreC = h.teamCScore || 0;

      // applique ton calcul d’exemple : 
      // preneur perd sa mise et donne tous les points (score coinché) aux autres
      if (is3Players) {
        
          // Coinche réussie
          if (player.team === coincherTeam) {
            // joueur qui a coinché → gagne ses points *2 + contrat ?
            const base = player.team === 'A' ? scoreA : player.team === 'B' ? scoreB : scoreC;
            pointsScored += base + (takerTeam === 'A' ? -scoreA : takerTeam === 'B' ? -scoreB : -scoreC);
          } 
          if (player.team !== takerTeam && player.team !== coincherTeam) {
            // 3e joueur → gagne ses points *2
            const base = player.team === 'A' ? scoreA : player.team === 'B' ? scoreB : scoreC;
            pointsScored += base;
          }
          // preneur → concède tous les points (base *2 des deux autres + contrat)
          if (player.team === takerTeam) {
           
            pointsConceded += player.team === 'A' ? scoreB + scoreC -scoreA : player.team === 'B' ? scoreA + scoreC -scoreB : scoreB + scoreA -scoreC ; // ajoute la mise
          }
      
        }
       else {
        if ( player.team === coincherTeam && h.coincher === player.id){
          pointsScored+= coincherTeam === 'A' ? scoreA : scoreB;
        // 2 jo;
      }
        if(player.team === takerTeam && h.taker === player.id){
          pointsConceded+= coincherTeam === 'A' ? scoreA : scoreB;
        }
    }});
  // points pour coinche réussie
  

  // points pour surcoinche réussie
  gameState.hands
    .filter(h => h.surcoincher && h.isSurcoincheSuccessful)
    .forEach(h => {
      const takerTeam = gameState.players.find(p => p.id === h.coincher)?.team;
      const surTeam = gameState.players.find(p => p.id === h.surcoincher)?.team;

      if (!takerTeam || !surTeam) return;

      const scoreA = h.teamAScore || 0;
      const scoreB = h.teamBScore || 0;
      const scoreC = h.teamCScore || 0;

      // applique la même logique que coinche mais avec surcoinche
      if (is3Players) {
        if (h.isSurcoincheSuccessful) {
          if (player.team === surTeam) {
            const base = player.team === 'A' ? scoreA : player.team === 'B' ? scoreB : scoreC;
            pointsScored += base + takerTeam=== 'A' ? -scoreA : takerTeam === 'B' ? -scoreB : -scoreC; // surcoinche double la coinche
          }
          if (player.team === takerTeam) {
            const base = player.team === 'A' ? scoreA : player.team === 'B' ? scoreB : scoreC;
            pointsScored += 0;
          
          
            pointsConceded += player.team === 'A' ? scoreB+scoreC - base : player.team === 'B' ? scoreA + scoreC - base : scoreA + scoreB -base;
          }
          else {
            pointsScored += player.team === 'A' ? scoreA : player.team === 'B' ? scoreB : scoreC;
          }
        }
      } else {
        if ( player.team === surTeam && h.surcoincher === player.id){
          pointsScored+= surTeam === 'A' ? scoreA : scoreB;
        // 2 jo;
      }
       if(player.team === takerTeam && h.coincher === player.id){
          pointsConceded+= surTeam === 'A' ? scoreA : scoreB;
        }
        
  }});
    

  


// ------------------------------------------------------------
// 🔹 CONTRATS PERDUS (non coinchés / surcoinchés)
// ------------------------------------------------------------
gameState.hands
  .filter(h => h.taker && !h.contractFulfilled && !h.coincher && !h.surcoincher)
  .forEach(h => {
    const takerTeam = gameState.players.find(p => p.id === h.taker)?.team;
    if (!takerTeam) return;

    if (player.team === takerTeam) {
      if (is3Players) {
        // on concède les points des deux autres joueurs individuellement
        
            pointsConceded += 160 ;
          
          
      } else {
        // 2 joueurs : additionne les points adverses et les divise par 2
        const opponentTeam = takerTeam === 'A' ? 'B' : 'A';
        const oppScore = opponentTeam === 'A' ? h.teamAScore : h.teamBScore;
        if (player.id === h.taker){
        pointsConceded += (oppScore || 0);
        }
      }
    }
    else { if (!is2Players && !is3Players){
      pointsScored += (player.team === 'A' ? h.teamAScore : player.team === 'B' ? h.teamBScore : h.teamCScore)/2
    }else{
      pointsScored += player.team === 'A' ? h.teamAScore : player.team === 'B' ? h.teamBScore : h.teamCScore
    }}
  });

// ------------------------------------------------------------
// 🔹 COINCHE PERDUE
// ------------------------------------------------------------
gameState.hands
  .filter(h => h.coincher && !h.isCoincheSuccessful && !h.surcoincher)
  .forEach(h => {
    const coincherTeam = gameState.players.find(p => p.id === h.coincher)?.team;
    if (!coincherTeam) return;

    if (player.team === coincherTeam) {
      if (is3Players) {
        
            // en coinche perdue, l’équipe coincheuse concède les points normaux des autres
            pointsConceded += player.team === 'A' ?  -h.teamAScore + h.teamBScore + h.teamCScore : player.team === 'B' ? -h.teamBScore + h.teamAScore + h.teamCScore : -h.teamCScore + h.teamBScore + h.teamAScore ;
          
      } 
      if (player.id === h.coincher && !is3Players){
        const oppTeam = coincherTeam === 'A' ? 'B' : 'A';
        const oppScore = oppTeam === 'A' ? h.teamAScore : h.teamBScore;
        
        pointsConceded += (oppScore || 0) ;
      }} else {
      
     
      if (player.id === h.taker){
      pointsScored += player.team === 'A' ? h.teamAScore : player.team === 'B' ? h.teamBScore : h.teamCScore - (coincherTeam=== 'A' ? h.teamAScore : coincherTeam === 'B' ? h.teamBScore : h.teamCScore);
    }
         }
    
  
    
  });

// ------------------------------------------------------------
// 🔹 SURCOINCHE PERDUE
// ------------------------------------------------------------
gameState.hands
  .filter(h => h.surcoincher && !h.isSurcoincheSuccessful)
  .forEach(h => {
    const surTeam = gameState.players.find(p => p.id === h.surcoincher)?.team;
    if (!surTeam) return;

    if (player.team === surTeam) {
      if (is3Players) {
        pointsConceded += player.team === 'A' ?  -h.teamAScore + h.teamBScore + h.teamCScore : player.team === 'B' ? -h.teamBScore + h.teamAScore + h.teamCScore : -h.teamCScore + h.teamBScore + h.teamAScore ;
      } else {
        const oppTeam = surTeam === 'A' ? 'B' : 'A';
        const oppScore = oppTeam === 'A' ? h.teamAScore : h.teamBScore;
        if (player.id === h.surcoincher){
        pointsConceded += (oppScore || 0) ;
        }
      }
    } else {
      if (player.id === h.coincher){
      pointsScored += player.team === 'A' ? h.teamAScore : player.team === 'B' ? h.teamBScore : h.teamCScore - (surTeam=== 'A' ? h.teamAScore : surTeam === 'B' ? h.teamBScore : h.teamCScore);
    } if (player.id !== h.coincher && is3Players){
        pointsScored+=player.team === 'A' ? h.teamAScore : player.team === 'B' ? h.teamBScore : h.teamCScore;
    }
    }
  });


  

  return {
    name: player.name,
    team: player.team,
    handsTaken: takenHands.length,
    contractsWon: contractsWon.length,
    coinches: coincheHands.length,
    surcoinches: surcoincheHands.length,
    successfulCoinches: successfulCoinches.length,
    successfulSurcoinches: successfulSurcoinches.length,
    pointsScored,
    pointsConceded,
    coincheSuccessRate: coincheHands.length > 0
      ? Math.round((successfulCoinches.length / coincheHands.length) * 100)
      : 0,
    surcoincheSuccessRate: surcoincheHands.length > 0
      ? Math.round((successfulSurcoinches.length / surcoincheHands.length) * 100)
      : 0,
    contractSuccessRate: takenHands.length > 0
      ? Math.round((contractsWon.length / takenHands.length) * 100)
      : 0
  };
});

  // King of the game (player with most points)
  const kingOfGame = playerStats.reduce((king, player) => 
    player.pointsWon > king.pointsWon ? player : king
  );

  // Most active taker
  const mostActiveTaker = playerStats.reduce((taker, player) => 
    player.handsTaken > taker.handsTaken ? player : taker
  );

  // Crazy coincher (most coinches)
  const crazyCoincher = playerStats.reduce((coincher, player) => 
    player.coinches > coincher.coinches ? player : coincher
  );

  // Worst player (lowest win/loss ratio)
  const worstPlayer = playerStats.reduce((worst, player) => {
    
    return player.pointsConceded > worst.pointsConceded ? player : worst;
  });

  // Best scorer (most points scored when taking contracts)
  const bestScorer = playerStats.reduce((best, player) => 
    player.pointsScored > best.pointsScored ? player : best
  );

  // Best coincher (highest success rate with at least 1 coinche)
  const bestCoincher = playerStats
    .filter(p => p.coinches >= 1)
    .reduce((best, player) => 
      player.coincheSuccessRate > best.coincheSuccessRate ? player : best, 
      { coincheSuccessRate: -1, name: 'Aucun' }
    );

  // Best contract player
  const bestContractPlayer = playerStats
    .filter(p => p.handsTaken >= 2)
    .reduce((best, player) => 
      player.contractSuccessRate > best.contractSuccessRate ? player : best,
      { contractSuccessRate: -1, name: 'Aucun' }
    );

  const getTeamPlayers = (team: 'A' | 'B' | 'C') => {
    return gameState.players.filter(p => p.team === team);
  };

  const getTeamColor = (team: 'A' | 'B' | 'C') => {
    const colors = {
      A: 'blue',
      B: 'red',
      C: 'green'
    };
    return colors[team];
  };

  // Taker distribution data
  const takerData = playerStats.map(player => ({
    name: player.name,
    taken: player.handsTaken,
    team: player.team
  }));

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
      <div 
  className="max-w-7xl mx-auto relative" 
  style={{ top: 'calc(2em + env(safe-area-inset-top))' }}
>
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateTo('game')}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Statistiques</h1>
              <p className="text-gray-600">
                {gameState.hands.length} mains jouées • {gameState.settings.playerCount} joueurs • {gameState.settings.mode}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Trophy className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{teamStats.A.handsWon}</div>
                <div className="text-sm text-gray-600">Mains {gameState.settings.playerCount === 4 ? 'Équipe' : 'Joueur'} A</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-red-100 p-3 rounded-lg">
                <Trophy className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{teamStats.B.handsWon}</div>
                <div className="text-sm text-gray-600">Mains {gameState.settings.playerCount === 4 ? 'Équipe' : 'Joueur'} B</div>
              </div>
            </div>
          </div>

          {gameState.settings.playerCount === 3 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{teamStats.C.handsWon}</div>
                  <div className="text-sm text-gray-600">Mains Joueur C</div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Crown className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">{kingOfGame.name}</div>
                <div className="text-sm text-gray-600">Roi de la {gameState.settings.mode}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">{bestScorer.name}</div>
                <div className="text-sm text-gray-600">Meilleur marqueur</div>
                <div className="text-xs text-gray-500">{bestScorer.pointsScored} pts</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-red-100 p-3 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">{worstPlayer.name}</div>
                <div className="text-sm text-gray-600">Pire joueur</div>
                <div className="text-xs text-gray-500">{worstPlayer.pointsConceded} pts concédés</div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Score Evolution */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <span>Évolution des Scores</span>
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreEvolution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hand" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="teamA" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    name={gameState.settings.playerCount === 4 ? "Équipe A" : "Joueur A"}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="teamB" 
                    stroke="#DC2626" 
                    strokeWidth={3}
                    name={gameState.settings.playerCount === 4 ? "Équipe B" : "Joueur B"}
                  />
                  {gameState.settings.playerCount === 3 && (
                    <Line 
                      type="monotone" 
                      dataKey="teamC" 
                      stroke="#059669" 
                      strokeWidth={3}
                      name="Joueur C"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Points Scored vs Conceded */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Points Marqués vs Concédés</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={playerStats.map(p => ({
                  name: p.name.slice(0, 5),
                  scored: p.pointsScored,
                  conceded: p.pointsConceded
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="scored" fill="#10B981" name="Points marqués" />
                  <Bar dataKey="conceded" fill="#EF4444" name="Points concédés" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Advanced Statistics */}
        {gameState.settings.mode === 'coinche' && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Statistiques Coinche</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <Zap className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{gameState.hands.filter(h => h.coincher).length}</div>
                <div className="text-sm text-gray-600">Coinches déclarées</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Shield className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{gameState.hands.filter(h => h.surcoincher).length}</div>
                <div className="text-sm text-gray-600">Surcoinches déclarées</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{gameState.hands.filter(h => h.isCoincheSuccessful).length}</div>
                <div className="text-sm text-gray-600">Coinches réussies</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Crown className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-gray-900">{bestCoincher.name}</div>
                <div className="text-sm text-gray-600">Meilleur coincheur</div>
                {bestCoincher.coincheSuccessRate >= 0 && (
                  <div className="text-xs text-gray-500">{bestCoincher.coincheSuccessRate}% de réussite</div>
                )}
              </div>

              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <Trophy className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-gray-900">{bestContractPlayer.name}</div>
                <div className="text-sm text-gray-600">Meilleur contractant</div>
                {bestContractPlayer.contractSuccessRate >= 0 && (
                  <div className="text-xs text-gray-500">{bestContractPlayer.contractSuccessRate}% de réussite</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Team/Player Details */}
        <div className={`grid gap-8 ${gameState.settings.playerCount === 3 ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}`}>
          {/* Team/Player A Stats */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-blue-600 mb-6">
              Statistiques {gameState.settings.playerCount === 4 ? 'Équipe' : 'Joueur'} A
            </h3>
            <div className="space-y-4">
              {getTeamPlayers('A').map(player => {
                const stats = playerStats.find(p => p.name === player.name);
                return (
                  <div key={player.id} className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-gray-900 flex items-center space-x-2">
                        <span>{player.name}</span>
                        {stats?.name === kingOfGame.name && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                        {stats?.name === mostActiveTaker.name && (
                          <User className="w-4 h-4 text-green-500" />
                        )}
                        {stats?.name === crazyCoincher.name && (
                          <Zap className="w-4 h-4 text-yellow-500" />
                        )}
                        {stats?.name === worstPlayer.name && (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        {stats?.name === bestScorer.name && (
                          <Award className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <div>{stats?.handsWon} mains gagnées</div>
                        <div>{stats?.handsTaken} mains prises</div>
                        <div>{stats?.pointsWon} points totaux</div>
                        <div>{stats?.pointsScored} pts marqués</div>
                        <div>{stats?.beloteRebelotes} Belote-Rebelote</div>
                      </div>
                      <div>
                        <div>{stats?.pointsConceded} pts concédés</div>
                        {gameState.settings.mode === 'coinche' && (
                          <>
                            <div>{stats?.coinches} coinches</div>
                            <div>{stats?.surcoinches} surcoinches</div>
                            {stats?.coinches > 0 && (
                              <div>{stats?.coincheSuccessRate}% réussite coinche</div>
                            )}
                            {stats?.handsTaken > 0 && (
                              <div>{stats?.contractSuccessRate}% contrats réussis</div>
                            )}
                          </>
                        )}
                        {stats?.capots > 0 && <div>{stats.capots} capot(s)</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{teamStats.A.totalPoints}</div>
                    <div className="text-sm text-gray-600">Points Total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{teamStats.A.capots}</div>
                    <div className="text-sm text-gray-600">Capots</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Team/Player B Stats */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-red-600 mb-6">
              Statistiques {gameState.settings.playerCount === 4 ? 'Équipe' : 'Joueur'} B
            </h3>
            <div className="space-y-4">
              {getTeamPlayers('B').map(player => {
                const stats = playerStats.find(p => p.name === player.name);
                return (
                  <div key={player.id} className="p-4 bg-red-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-gray-900 flex items-center space-x-2">
                        <span>{player.name}</span>
                        {stats?.name === kingOfGame.name && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                        {stats?.name === mostActiveTaker.name && (
                          <User className="w-4 h-4 text-green-500" />
                        )}
                        {stats?.name === crazyCoincher.name && (
                          <Zap className="w-4 h-4 text-yellow-500" />
                        )}
                        {stats?.name === worstPlayer.name && (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        {stats?.name === bestScorer.name && (
                          <Award className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <div>{stats?.handsWon} mains gagnées</div>
                        <div>{stats?.handsTaken} mains prises</div>
                        <div>{stats?.pointsWon} points totaux</div>
                        <div>{stats?.pointsScored} pts marqués</div>
                        <div>{stats?.beloteRebelotes} Belote-Rebelote</div>
                      </div>
                      <div>
                        <div>{stats?.pointsConceded} pts concédés</div>
                        {gameState.settings.mode === 'coinche' && (
                          <>
                            <div>{stats?.coinches} coinches</div>
                            <div>{stats?.surcoinches} surcoinches</div>
                            {stats?.coinches > 0 && (
                              <div>{stats?.coincheSuccessRate}% réussite coinche</div>
                            )}
                            {stats?.handsTaken > 0 && (
                              <div>{stats?.contractSuccessRate}% contrats réussis</div>
                            )}
                          </>
                        )}
                        {stats?.capots > 0 && <div>{stats.capots} capot(s)</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-red-600">{teamStats.B.totalPoints}</div>
                    <div className="text-sm text-gray-600">Points Total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{teamStats.B.capots}</div>
                    <div className="text-sm text-gray-600">Capots</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Player C Stats (3-player mode) */}
          {gameState.settings.playerCount === 3 && (
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <h3 className="text-xl font-bold text-green-600 mb-6">Statistiques Joueur C</h3>
              <div className="space-y-4">
                {getTeamPlayers('C').map(player => {
                  const stats = playerStats.find(p => p.name === player.name);
                  return (
                    <div key={player.id} className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-gray-900 flex items-center space-x-2">
                          <span>{player.name}</span>
                          {stats?.name === kingOfGame.name && (
                            <Crown className="w-4 h-4 text-yellow-500" />
                          )}
                          {stats?.name === mostActiveTaker.name && (
                            <User className="w-4 h-4 text-green-500" />
                          )}
                          {stats?.name === crazyCoincher.name && (
                            <Zap className="w-4 h-4 text-yellow-500" />
                          )}
                          {stats?.name === worstPlayer.name && (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          )}
                          {stats?.name === bestScorer.name && (
                            <Award className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <div>{stats?.handsWon} mains gagnées</div>
                          <div>{stats?.handsTaken} mains prises</div>
                          <div>{stats?.pointsWon} points totaux</div>
                          <div>{stats?.pointsScored} pts marqués</div>
                          <div>{stats?.beloteRebelotes} Belote-Rebelote</div>
                        </div>
                        <div>
                          <div>{stats?.pointsConceded} pts concédés</div>
                          {gameState.settings.mode === 'coinche' && (
                            <>
                              <div>{stats?.coinches} coinches</div>
                              <div>{stats?.surcoinches} surcoinches</div>
                              {stats?.coinches > 0 && (
                                <div>{stats?.coincheSuccessRate}% réussite coinche</div>
                              )}
                              {stats?.handsTaken > 0 && (
                                <div>{stats?.contractSuccessRate}% contrats réussis</div>
                              )}
                            </>
                          )}
                          {stats?.capots > 0 && <div>{stats.capots} capot(s)</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{teamStats.C.totalPoints}</div>
                      <div className="text-sm text-gray-600">Points Total</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{teamStats.C.capots}</div>
                      <div className="text-sm text-gray-600">Capots</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}