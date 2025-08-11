import React, { useState, useEffect } from 'react';
import { X, Trophy, Sword, Shield, Zap, Heart, CheckCircle, XCircle, AlertTriangle, Minus } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { Bid, Penalty } from '../types/game';

interface ScoreEntryProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  editedHand?: Hand | null;
}

export function ScoreEntry({ onClose, onSubmit, editedHand }: ScoreEntryProps) {
  const { gameState, addHand, updateHand } = useGame();
  
  const [activeTab, setActiveTab] = useState<'prise' | 'mise' | 'coinche' | 'score' | 'penalty' | 'total'>('prise');
  const [winningTeam, setWinningTeam] = useState<'A' | 'B' | 'C'>('A');
  const [teamScores, setTeamScores] = useState({ A: 82, B: 80, C: 0 });
  const [announcements, setAnnouncements] = useState(0);
  const [isCapot, setIsCapot] = useState(false);
  const [taker, setTaker] = useState<string>('');
  const [bid, setBid] = useState<Bid | null>(null);
  const [coincher, setCoincher] = useState<string>('');
  const [surcoincher, setSurcoincher] = useState<string>('');
  const [beloteTeam, setBeloteTeam] = useState<'A' | 'B' | 'C' | null>(null);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [showPenaltyForm, setShowPenaltyForm] = useState(false);
  const [penaltyForm, setPenaltyForm] = useState({
    playerId: '',
    points: 50,
    reason: ''
  });
  const [lastChangedTeam, setLastChangedTeam] = useState<'A' | 'B' | 'C' | null>(null);
  const [previousChangedTeam, setPreviousChangedTeam] = useState<string | null>(null);
  const [beloteCounts, setBeloteCounts] = useState<{ A: number; B: number; C: number }>({ A: 0, B: 0, C: 0 });


// Pour afficher le petit popup de sélection
const [beloteModalTeam, setBeloteModalTeam] = useState<null | 'A' | 'B'>(null);


  // Contract evaluation
  const [contractFulfilled, setContractFulfilled] = useState<boolean | null>(null);
  const [calculatedScores, setCalculatedScores] = useState<{
    teamA: number;
    teamB: number;
    teamC: number;
  }>({ teamA: 0, teamB: 0, teamC: 0 });

  const suits = [
    { value: 'hearts', label: '♥️', color: 'text-red-600' },
    { value: 'diamonds', label: '♦️', color: 'text-red-600' },
    { value: 'clubs', label: '♣️', color: 'text-gray-800' },
    { value: 'spades', label: '♠️', color: 'text-gray-800' },
    { value: 'no-trump', label: 'SA', color: 'text-purple-600' },
    { value: 'all-trump', label: 'TA', color: 'text-orange-600' }
  ];

  const bidValues = [80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180];
  useEffect(() => {
  if (editedHand) {
    setTaker(editedHand.taker ?? '');
    setBid(editedHand.bid ?? null);
    setCoincher(editedHand.coincher ?? '');
    setSurcoincher(editedHand.surcoincher ?? '');
    setWinningTeam(editedHand.winningTeam ?? 'A');
    setTeamScores({
      A: editedHand.teamAScore ?? 0,
      B: editedHand.teamBScore ?? 0,
      C: editedHand.teamCScore ?? 0
    });
    setBeloteTeam(editedHand.beloteRebeloteTeam ?? null);
    setPenalties(editedHand.penalties ?? []);
    setIsCapot(editedHand.isCapot ?? false);
    setContractFulfilled(editedHand.contractFulfilled ?? null);
    setBeloteCounts({ A: 0, B: 0, C: 0 }); // tu peux adapter si les valeurs sont stockées
  }
}, [editedHand]);
  console.log("editedHand in handleSubmit", editedHand);
  // Auto-calculate opposing scores
  useEffect(() => {
    if (gameState.settings.playerCount === 2 || gameState.settings.playerCount === 4) {
    if (!isCapot && lastChangedTeam) {
      const totalPoints = 162;
      if (lastChangedTeam === 'A') {
        setTeamScores(prev => ({ ...prev, B: totalPoints - prev.A }));
      } else if (lastChangedTeam === 'B') {
        setTeamScores(prev => ({ ...prev, A: totalPoints - prev.B }));
      }
    }
  } else if (gameState.settings.playerCount === 3) {
    if (!isCapot && lastChangedTeam) {
      const totalPoints = 162;
      setTeamScores(prev => {
        let { A, B, C } = prev;

        if (lastChangedTeam === 'A') {
          // A reste fixe, on modifie seulement celui qui n'était PAS le précédent changé
          const fixed = previousChangedTeam;
          const free = ['B', 'C'].filter(p => p !== fixed)[0];
          if (free === 'B') {
            B = totalPoints - A - C;
          } else {
            C = totalPoints - A - B;
          }
        } 
        else if (lastChangedTeam === 'B') {
          const fixed = previousChangedTeam;
          const free = ['A', 'C'].filter(p => p !== fixed)[0];
          if (free === 'A') {
            A = totalPoints - B - C;
          } else {
            C = totalPoints - B - A;
          }
        } 
        else if (lastChangedTeam === 'C') {
          const fixed = previousChangedTeam;
          const free = ['A', 'B'].filter(p => p !== fixed)[0];
          if (free === 'A') {
            A = totalPoints - C - B;
          } else {
            B = totalPoints - C - A;
          }
        }

        return { A, B, C };
      });

      // on enregistre l'ancien pour la prochaine fois
      setPreviousChangedTeam(lastChangedTeam);
    }
  }
}, [
  teamScores.A, 
  teamScores.B, 
  teamScores.C, 
  lastChangedTeam, 
  previousChangedTeam, 
  isCapot, 
  gameState.settings.playerCount
]);

  // Calculate final scores based on game rules (including penalties)
  useEffect(() => {
    const newScores = { teamA: 0, teamB: 0, teamC: 0 };
    const beloteBonus = bid?.suit === 'all-trump' ? 5 : 20;

    
    // Calculate penalty adjustments
    const penaltyAdjustments = { teamA: 0, teamB: 0, teamC: 0 };
    penalties.forEach(penalty => {
      const player = gameState.players.find(p => p.id === penalty.playerId);
      if (player) {
        if (player.team === 'A') penaltyAdjustments.teamA -= penalty.points;
        else if (player.team === 'B') penaltyAdjustments.teamB -= penalty.points;
        else if (player.team === 'C') penaltyAdjustments.teamC -= penalty.points;
      }
    });
    
    if (gameState.settings.mode === 'coinche' && bid?.value && taker) {
      const takerPlayer = gameState.players.find(p => p.id === taker);
      const contractTeam = takerPlayer?.team;
      const contractValue = bid.value;
      const takerPoints = contractTeam === 'A' ? teamScores.A : contractTeam === 'B' ? teamScores.B : teamScores.C;
      const totalPointsWithBonus =
  takerPoints +
  (beloteTeam === contractTeam
    ? beloteBonus : bid.suit === "all-trump"
        ? beloteCounts[contractTeam] * beloteBonus
        
    : 0);
      
      if (contractTeam) {
        // Determine if contract is fulfilled
        let fulfilled = false;
        
        if (gameState.settings.playerCount === 3) {
          // 3-player Coinche: bidder must score more than each opponent individually
          if (contractValue>300){
            fulfilled = totalPointsWithBonus >=252
          }
          else {
          const otherScores = [teamScores.A, teamScores.B, teamScores.C].filter((_, i) => 
            ['A', 'B', 'C'][i] !== contractTeam
          );
          fulfilled = totalPointsWithBonus >= contractValue;
          }
        } else {
          if (contractValue>300){
            fulfilled = totalPointsWithBonus >=252
          }
          else {
          // 4-player: standard contract fulfillment
          fulfilled = totalPointsWithBonus >= contractValue;
        }}
        
        setContractFulfilled(fulfilled);
        
        // Calculate scores based on coinche/surcoinche status
        if (gameState.settings.playerCount === 4 || gameState.settings.playerCount === 2) {
          // 4-player mode scoring
          if (surcoincher) {
            // Surcoinche declared
            const isCoincheSuccessful = !fulfilled;
            const isSurcoincheSuccessful = fulfilled;
            
            if (isSurcoincheSuccessful) {
              // Surcoinche successful
              if (contractTeam === 'A') {
                newScores.teamA = contractValue * 3 + takerPoints + (beloteTeam === 'A' ? beloteBonus : 0) + (announcements || 0);
                newScores.teamB = beloteTeam === 'B' ? beloteBonus : 0;
              } else {
                newScores.teamB = contractValue * 3 + takerPoints + (beloteTeam === 'B' ? beloteBonus : 0) + (announcements || 0);
                newScores.teamA = beloteTeam === 'A' ? beloteBonus : 0;
              }
            } else {
              // Surcoinche failed
              if (contractTeam === 'A') {
                newScores.teamA = beloteTeam === 'A' ? beloteBonus : 0;
                newScores.teamB = contractValue * 3 + 162 + (beloteTeam === 'B' ? beloteBonus : 0);
              } else {
                newScores.teamB = beloteTeam === 'B' ? beloteBonus : 0;
                newScores.teamA = contractValue * 3 + 162 + (beloteTeam === 'A' ? beloteBonus : 0);
              }
            }
          } else if (coincher) {
            // Coinche declared (no surcoinche)
            const isCoincheSuccessful = !fulfilled;
            
            if (isCoincheSuccessful) {
              // Coinche successful
              if (contractTeam === 'A') {
                newScores.teamA = beloteTeam === 'A' ? beloteBonus : 0;
                newScores.teamB = contractValue * 2 + 162 + (beloteTeam === 'B' ? beloteBonus : 0);
              } else {
                newScores.teamB = beloteTeam === 'B' ? beloteBonus : 0;
                newScores.teamA = contractValue * 2 + 162 + (beloteTeam === 'A' ? beloteBonus : 0);
              }
            } else {
              // Coinche failed
              if (contractTeam === 'A') {
                newScores.teamA = contractValue * 2 + 162 + (beloteTeam === 'A' ? beloteBonus : 0);
                newScores.teamB = beloteTeam === 'B' ? beloteBonus : 0;
              } else {
                newScores.teamB = contractValue * 2 + 162 + (beloteTeam === 'B' ? beloteBonus : 0);
                newScores.teamA = beloteTeam === 'A' ? beloteBonus : 0;
              }
            }
          } else {
            // No coinche/surcoinche - standard contract scoring
            if (fulfilled) {
              if (contractTeam === 'A') {
                newScores.teamA = contractValue + takerPoints + (beloteTeam === 'A' ? beloteBonus : 0) + (announcements || 0);
                newScores.teamB = teamScores.B + (beloteTeam === 'B' ? beloteBonus : 0);
              } else {
                newScores.teamB = contractValue + takerPoints + (beloteTeam === 'B' ? beloteBonus : 0) + (announcements || 0);
                newScores.teamA = teamScores.A + (beloteTeam === 'A' ? beloteBonus : 0);
              }
            } else {
              if (contractTeam === 'A') {
                newScores.teamA = beloteTeam === 'A' ? beloteBonus : 0;
                newScores.teamB = contractValue + 162 + (beloteTeam === 'B' ? beloteBonus : 0);
              } else {
                newScores.teamB = beloteTeam === 'B' ? beloteBonus : 0;
                newScores.teamA = contractValue + 162 + (beloteTeam === 'A' ? beloteBonus : 0);
              }
            }
          }
        } else if (gameState.settings.playerCount === 3) {

          
          // 3-player Coinche scoring (similar logic but for 3 players)
          // ... (keeping existing 3-player logic)
          if (coincher && !surcoincher) {
            const isCoincheSuccessful = !fulfilled;
          const isSurcoincheSuccessful = fulfilled;
            // Coinche declared
            const coincherPlayer = gameState.players.find(p => p.id === coincher);
            const coincherTeam = coincherPlayer?.team;
            const otherTeam = gameState.players.find(p => p.team !== contractTeam && p.team !== coincherTeam)?.team;
            
            if (isCoincheSuccessful) {
              // Coinche succeeds
              if (coincherTeam === 'A') {
                newScores.teamA = contractValue + 80 + (beloteTeam === 'A' ? beloteBonus : 0);
              } else if (coincherTeam === 'B') {
                newScores.teamB = contractValue + 80 + (beloteTeam === 'B' ? beloteBonus : 0);
              } else if (coincherTeam === 'C') {
                newScores.teamC = contractValue + 80 + (beloteTeam === 'C' ? beloteBonus : 0);
              }
              
              if (contractTeam === 'A') {
                newScores.teamA = -contractValue + (beloteTeam === 'A' ? beloteBonus : 0);
              } else if (contractTeam === 'B') {
                newScores.teamB = -contractValue + (beloteTeam === 'B' ? beloteBonus : 0);
              } else if (contractTeam === 'C') {
                newScores.teamC = -contractValue + (beloteTeam === 'C' ? beloteBonus : 0);
              }
              
              if (otherTeam === 'A') {
                newScores.teamA = 80 + (beloteTeam === 'A' ? beloteBonus : 0);
              } else if (otherTeam === 'B') {
                newScores.teamB = 80 + (beloteTeam === 'B' ? beloteBonus : 0);
              } else if (otherTeam === 'C') {
                newScores.teamC = 80 + (beloteTeam === 'C' ? beloteBonus : 0);
              }
            } else {
              // Coinche fails
              if (contractTeam === 'A') {
                newScores.teamA = contractValue + 80 + takerPoints + (beloteTeam === 'A' ? beloteBonus : 0);
              } else if (contractTeam === 'B') {
                newScores.teamB = contractValue + 80 + takerPoints + (beloteTeam === 'B' ? beloteBonus : 0);
              } else if (contractTeam === 'C') {
                newScores.teamC = contractValue + 80 + takerPoints + (beloteTeam === 'C' ? beloteBonus : 0);
              }
              
              if (coincherTeam === 'A') {
                newScores.teamA = -contractValue + (beloteTeam === 'A' ? beloteBonus : 0);
              } else if (coincherTeam === 'B') {
                newScores.teamB = -contractValue + (beloteTeam === 'B' ? beloteBonus : 0);
              } else if (coincherTeam === 'C') {
                newScores.teamC = -contractValue + (beloteTeam === 'C' ? beloteBonus : 0);
              }
              
              if (otherTeam === 'A') {
                newScores.teamA = (beloteTeam === 'A' ? beloteBonus : 0);
              } else if (otherTeam === 'B') {
                newScores.teamB = (beloteTeam === 'B' ? beloteBonus : 0);
              } else if (otherTeam === 'C') {
                newScores.teamC = (beloteTeam === 'C' ? beloteBonus : 0);
              }
            }
          } else if (surcoincher) {

          const isCoincheSuccessful = !fulfilled;
          const isSurcoincheSuccessful = fulfilled;
            // Coinche declared
            const coincherPlayer = gameState.players.find(p => p.id === coincher);
            const coincherTeam = coincherPlayer?.team;
            const otherTeam = gameState.players.find(p => p.team !== contractTeam && p.team !== coincherTeam)?.team;
            // Surcoinche declared
            if (isSurcoincheSuccessful) {
              // Surcoinche successful
              if (contractTeam === 'A') {
                newScores.teamA = contractValue * 2 + takerPoints + (beloteTeam === 'A' ? beloteBonus : 0);
              } else if (contractTeam === 'B') {
                newScores.teamB = contractValue * 2 + takerPlayer + (beloteTeam === 'B' ? beloteBonus : 0);
              } else if (contractTeam === 'C') {
                newScores.teamC = contractValue * 2 + takerPoints + (beloteTeam === 'C' ? beloteBonus : 0);
              }
              if (coincherTeam === 'A') {
                newScores.teamA = -2*contractValue + (beloteTeam === 'A' ? beloteBonus : 0);
              } else if (coincherTeam === 'B') {
                newScores.teamB = -2*contractValue + (beloteTeam === 'B' ? beloteBonus : 0);
              } else if (coincherTeam === 'C') {
                newScores.teamC = -2*contractValue + (beloteTeam === 'C' ? beloteBonus : 0);
              }
              
              if (otherTeam === 'A') {
                newScores.teamA = (beloteTeam === 'A' ? beloteBonus : 0);
              } else if (otherTeam === 'B') {
                newScores.teamB = (beloteTeam === 'B' ? beloteBonus : 0);
              } else if (otherTeam === 'C') {
                newScores.teamC = (beloteTeam === 'C' ? beloteBonus : 0);
              }
            } else {
              // Surcoinche failed
              if (contractTeam === 'A') {
                newScores.teamA = -2*contractValue  + (beloteTeam === 'A' ? beloteBonus : 0);
              } else if (contractTeam === 'B') {
                newScores.teamB = -2*contractValue  + (beloteTeam === 'B' ? beloteBonus : 0);
              } else if (contractTeam === 'C') {
                newScores.teamC = -2*contractValue  + (beloteTeam === 'C' ? beloteBonus : 0);
              }
              if (coincherTeam === 'A') {
                newScores.teamA = 2*contractValue + 80 + (beloteTeam === 'A' ? beloteBonus : 0);
              } else if (coincherTeam === 'B') {
                newScores.teamB = 2*contractValue + 80 +  (beloteTeam === 'B' ? beloteBonus : 0);
              } else if (coincherTeam === 'C') {
                newScores.teamC = 2*contractValue + 80 + (beloteTeam === 'C' ? beloteBonus : 0);
              }
              
              if (otherTeam === 'A') {
                newScores.teamA = 80+(beloteTeam === 'A' ? beloteBonus : 0);
              } else if (otherTeam === 'B') {
                newScores.teamB = 80+(beloteTeam === 'B' ? beloteBonus : 0);
              } else if (otherTeam === 'C') {
                newScores.teamC = 80+(beloteTeam === 'C' ? beloteBonus : 0);
              }
            }
          } else {
            // No coinche - standard 3-player scoring
            if (fulfilled) {
              if (contractTeam === 'A') {
                newScores.teamA = contractValue + takerPoints + (beloteTeam === 'A' ? beloteBonus : 0) ;
              } else if (contractTeam === 'B') {
                newScores.teamB = contractValue + takerPoints + (beloteTeam === 'B' ? beloteBonus : 0) ;
              } else if (contractTeam === 'C') {
                newScores.teamC = contractValue + takerPoints + (beloteTeam === 'C' ? beloteBonus : 0) ;
              }
              
              // Other players get their points
              const remainingPoints = 162 - takerPoints;
              const otherPlayers = gameState.players.filter(p => p.team !== contractTeam);
              otherPlayers.forEach((player, index) => {
                const playerPoints = Math.floor(remainingPoints / 2) + (index === 0 ? remainingPoints % 2 : 0);
                if (player.team === 'A') {
                  newScores.teamA += teamScores.A + (beloteTeam === 'A' ? beloteBonus : 0);
                } else if (player.team === 'B') {
                  newScores.teamB += teamScores.B + (beloteTeam === 'B' ? beloteBonus : 0);
                } else if (player.team === 'C') {
                  newScores.teamC += teamScores.C  + (beloteTeam === 'C' ? beloteBonus : 0);
                }
              });
            } else {
              // Contract failed
              if (contractTeam === 'A') {
                newScores.teamA = -80+ (beloteTeam === 'A' ? beloteBonus : 0);
              } else if (contractTeam === 'B') {
                newScores.teamB = -80+ (beloteTeam === 'B' ? beloteBonus : 0);
              } else if (contractTeam === 'C') {
                newScores.teamC = -80 + (beloteTeam === 'C' ? beloteBonus : 0);
              }
              
              // Other players get 80 each
              const otherPlayers = gameState.players.filter(p => p.team !== contractTeam);
              otherPlayers.forEach(player => {
                if (player.team === 'A') {
                  newScores.teamA = 80+ (beloteTeam === 'A' ? beloteBonus : 0);
                } else if (player.team === 'B') {
                  newScores.teamB = 80+ (beloteTeam === 'B' ? beloteBonus : 0);
                } else if (player.team === 'C') {
                  newScores.teamC = 80+ (beloteTeam === 'C' ? beloteBonus : 0);
                }
              });
            }
          }
        }
        if (bid?.suit === 'all-trump'){
            const belotePoints = {
        A: beloteCounts.A * 5,
        B: beloteCounts.B * 5,
        C: beloteCounts.C * 5
          }
        console.log("BeloteCounts:", beloteCounts);
        newScores.teamA += belotePoints.A ;
        newScores.teamB += belotePoints.B ;
        newScores.teamC += belotePoints.C
      }
        if(bid?.type && !coincher){
          if (contractTeam==='A' && isCapot){
            newScores.teamA = bid?.value + 252 + (beloteTeam === 'A' ? beloteBonus : 0)
            newScores.teamB = (beloteTeam === 'B' ? beloteBonus : 0)
            newScores.teamC = (beloteTeam === 'C' ? beloteBonus : 0)
          }
          if (contractTeam==='B' && isCapot){
            newScores.teamB = bid?.value + 252 + (beloteTeam === 'B' ? beloteBonus : 0)
            newScores.teamA = (beloteTeam === 'A' ? beloteBonus : 0)
            newScores.teamC = (beloteTeam === 'C' ? beloteBonus : 0) 
          }
          if (contractTeam==='C' && isCapot){
            newScores.teamC = bid?.value + 252 + (beloteTeam === 'C' ? beloteBonus : 0)
            newScores.teamA = (beloteTeam === 'A' ? beloteBonus : 0)
            newScores.teamB = (beloteTeam === 'B' ? beloteBonus : 0)
          }
        }
        if(bid?.type && surcoincher){
          if (contractTeam==='A' && isCapot){
            newScores.teamA = bid?.value*3 + 252 + (beloteTeam === 'A' ? beloteBonus : 0)
            newScores.teamB = (beloteTeam === 'B' ? beloteBonus : 0)
            newScores.teamC = (beloteTeam === 'C' ? beloteBonus : 0)
          }
          if (contractTeam==='B' && isCapot){
            newScores.teamB = bid?.value*3 + 252 + (beloteTeam === 'B' ? beloteBonus : 0)
            newScores.teamA = (beloteTeam === 'A' ? beloteBonus : 0)
            newScores.teamC = (beloteTeam === 'C' ? beloteBonus : 0)
          }
          if (contractTeam==='C' && isCapot){
            newScores.teamC = bid?.value*3+ 252 + (beloteTeam === 'C' ? beloteBonus : 0)
            newScores.teamA = (beloteTeam === 'A' ? beloteBonus : 0)
            newScores.teamB = (beloteTeam === 'B' ? beloteBonus : 0)
          }
        }
        
        
        // Apply penalties
        newScores.teamA += penaltyAdjustments.teamA;
        newScores.teamB += penaltyAdjustments.teamB;
        newScores.teamC += penaltyAdjustments.teamC;
        
        setCalculatedScores(newScores);
      }
    } else if (gameState.settings.mode === 'belote') {
      // Belote mode scoring
      setContractFulfilled(null);
      
      if (gameState.settings.playerCount === 3) {
        // 3-player Belote: taker must score more than each opponent
        const takerPlayer = gameState.players.find(p => p.id === taker);
        const contractTeam = takerPlayer?.team;
        
        if (contractTeam) {
          const takerPoints = contractTeam === 'A' ? teamScores.A : contractTeam === 'B' ? teamScores.B : teamScores.C;
          const takerTotalPoints = takerPoints + (beloteTeam === contractTeam ? beloteBonus : 0);
          
          const otherScores = [teamScores.A, teamScores.B, teamScores.C].filter((_, i) => 
            ['A', 'B', 'C'][i] !== contractTeam
          );
          const success = takerTotalPoints > Math.max(...otherScores);
          
          if (success) {
            // Taker wins
            newScores.teamA = teamScores.A + (beloteTeam === 'A' ? beloteBonus : 0) + (contractTeam === 'A' ? (announcements || 0) : 0);
            newScores.teamB = teamScores.B + (beloteTeam === 'B' ? beloteBonus : 0) + (contractTeam === 'B' ? (announcements || 0) : 0);
            newScores.teamC = teamScores.C + (beloteTeam === 'C' ? beloteBonus : 0) + (contractTeam === 'C' ? (announcements || 0) : 0);
          } else {
            // Taker fails
            if (contractTeam === 'A') {
              newScores.teamA = beloteTeam === 'A' ? beloteBonus : 0;
              newScores.teamB = 81 + (beloteTeam === 'B' ? beloteBonus : 0);
              newScores.teamC = 81 + (beloteTeam === 'C' ? beloteBonus : 0);
            } else if (contractTeam === 'B') {
              newScores.teamB = beloteTeam === 'B' ? beloteBonus : 0;
              newScores.teamA = 81 + (beloteTeam === 'A' ? beloteBonus : 0);
              newScores.teamC = 81 + (beloteTeam === 'C' ? beloteBonus : 0);
            } else if (contractTeam === 'C') {
              newScores.teamC = beloteTeam === 'C' ? beloteBonus : 0;
              newScores.teamA = 81 + (beloteTeam === 'A' ? beloteBonus : 0);
              newScores.teamB = 81 + (beloteTeam === 'B' ? beloteBonus : 0);
            }
          }
        }
      } else {
        const takerPlayer = gameState.players.find(p => p.id === taker);
        const contractTeam = takerPlayer?.team;
        
        if (contractTeam) {
          const takerPoints = contractTeam === 'A' ? teamScores.A  : teamScores.B;
          const takerTotalPoints = takerPoints + (beloteTeam === contractTeam ? beloteBonus : 0);
          
          const otherScores = [teamScores.A, teamScores.B].filter((_, i) => 
            ['A', 'B'][i] !== contractTeam
          );
          const success = takerTotalPoints > Math.max(...otherScores);
          
          if (success) {
        // 2 or 4 player Belote
        newScores.teamA = teamScores.A + (beloteTeam === 'A' ? beloteBonus : 0) ;
        newScores.teamB = teamScores.B + (beloteTeam === 'B' ? beloteBonus : 0) ;

            } else {
            // Taker fails
            if (contractTeam === 'A') {
              newScores.teamA = beloteTeam === 'A' ? beloteBonus : 0;
              newScores.teamB = 162 + (beloteTeam === 'B' ? beloteBonus : 0);
              
            } else if (contractTeam === 'B') {
              newScores.teamB = beloteTeam === 'B' ? beloteBonus : 0;
              newScores.teamA = 162 + (beloteTeam === 'A' ? beloteBonus : 0);
              
            } 
              
            
          }
        }
      }
      
      
      // Apply penalties
      newScores.teamA += penaltyAdjustments.teamA;
      newScores.teamB += penaltyAdjustments.teamB;
      newScores.teamC += penaltyAdjustments.teamC;
      
      
      
      setCalculatedScores(newScores);
    }
  }, [bid, teamScores, taker, winningTeam, announcements, gameState.settings.mode, gameState.settings.playerCount, gameState.players, coincher, surcoincher, isCapot, beloteTeam, penalties, beloteCounts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine winning team based on scores
    let finalWinningTeam: 'A' | 'B' | 'C' = 'A';
    if (gameState.settings.playerCount === 3) {
      if (calculatedScores.teamB > calculatedScores.teamA && calculatedScores.teamB > calculatedScores.teamC) {
        finalWinningTeam = 'B';
      } else if (calculatedScores.teamC > calculatedScores.teamA && calculatedScores.teamC > calculatedScores.teamB) {
        finalWinningTeam = 'C';
      }
    } else {
      finalWinningTeam = calculatedScores.teamA > calculatedScores.teamB ? 'A' : 'B';
    }
    
    const handData = {
      id: editedHand?.id ?? crypto.randomUUID(),
      dealer: gameState.players[gameState.currentDealer].id,
      taker: taker || undefined,
      bid: gameState.settings.mode === 'coinche' && bid ? bid : undefined,
      coincher: coincher || undefined,
      surcoincher: surcoincher || undefined,
      winningTeam: finalWinningTeam,
      points: isCapot ? 252 : (taker ? (gameState.players.find(p => p.id === taker)?.team === 'A' ? teamScores.A : gameState.players.find(p => p.id === taker)?.team === 'B' ? teamScores.B : teamScores.C) : teamScores.A),
      announcements: gameState.settings.withAnnouncements ? announcements : 0,
      beloteRebelote: beloteTeam ? true : undefined,
      beloteRebeloteTeam: beloteTeam ? beloteTeam : undefined,
      isCapot,
      contractFulfilled,
      isCoincheSuccessful: coincher ? !contractFulfilled : undefined,
      isSurcoincheSuccessful: surcoincher ? contractFulfilled : undefined,
      penalties: penalties.length > 0 ? penalties : undefined,
      teamAScore: calculatedScores.teamA,
      teamBScore: calculatedScores.teamB,
      teamCScore: calculatedScores.teamC
    };

    
  addHand(handData);
  onSubmit(handData);

    
  };
  const getTeamNames = (team: 'A' | 'B' | 'C') => {
  const names = gameState.players
    .filter(p => p.team === team)
    .map(p => p.name.slice(0, 6));
  return names.join(' & ');
};

  const addPenalty = () => {
    if (penaltyForm.playerId && penaltyForm.points > 0) {
      const newPenalty: Penalty = {
        id: Date.now().toString(),
        playerId: penaltyForm.playerId,
        points: penaltyForm.points,
        reason: penaltyForm.reason || undefined,
        appliedBy: gameState.currentUser?.id || 'system',
        timestamp: new Date()
      };
      
      setPenalties(prev => [...prev, newPenalty]);
      setPenaltyForm({ playerId: '', points: 50, reason: '' });
      setShowPenaltyForm(false);
    }
  };

  const removePenalty = (penaltyId: string) => {
    setPenalties(prev => prev.filter(p => p.id !== penaltyId));
  };

  const allPlayers = gameState.players;
  const opposingPlayers = taker ? allPlayers.filter(p => {
    const takerPlayer = allPlayers.find(pl => pl.id === taker);
    return takerPlayer && p.team !== takerPlayer.team;
  }) : [];

  const getTeamColor = (team: 'A' | 'B' | 'C') => {
    const colors = {
      A: 'blue',
      B: 'red',
      C: 'green'
    };
    return colors[team];
  };

  const getAvailableTeams = () => {
    if (gameState.settings.playerCount === 4) {
      return ['A', 'B'];
    } else {
      return ['A', 'B', 'C'].slice(0, gameState.settings.playerCount);
    }
  };

  const handleCapot = (team: 'A' | 'B' | 'C') => {
  const isAlreadyCapot =
    isCapot && teamScores[team as keyof typeof teamScores] === 252;

  if (isAlreadyCapot) {
    // Désélectionne le capot
    setIsCapot(false);
    setTeamScores({ A: 0, B: 0, C: 0 });
    setWinningTeam('');
  } else {
    // Active le capot
    setIsCapot(true);
    setTeamScores({
      A: team === 'A' ? 252 : 0,
      B: team === 'B' ? 252 : 0,
      C: team === 'C' ? 252 : 0
    });
    setWinningTeam(team);
  }
};

  const handleBeloteRebelote = (team: 'A' | 'B' | 'C') => {
  if (bid?.suit === 'all-trump') {
    // Ouvre un petit modal de sélection de nombre de belotes
    setBeloteModalTeam(team);
  } else {
    // Mode standard : toggle une seule équipe
    setBeloteTeam(prev => (prev === team ? '' : team));
  }
};

  const tabs = [
    { id: 'prise', label: 'Prise' },
    ...(gameState.settings.mode === 'coinche' ? [{ id: 'mise', label: 'Mise' }] : []),
    ...(gameState.settings.mode === 'coinche' ? [{ id: 'coinche', label: 'Coinche' }] : []),
    { id: 'score', label: 'Score' },
    
    { id: 'total', label: 'Total' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-white rounded-t-2xl border-b border-gray-200 p-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">Ajout</h2>
          <div className="w-9"></div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-50 px-4 py-2">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-4 space-y-6">
            {/* Prise Tab */}
            {activeTab === 'prise' && (
              <div className="space-y-4">
                <h3 className="text-center text-lg font-medium text-gray-900">Preneur</h3>
                <div className="grid grid-cols-2 gap-3">
                  {allPlayers.map(player => (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => {
                        setTaker(player.id);
                        setWinningTeam(player.team);
                      }}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        taker === player.id
                          ? `border-${getTeamColor(player.team)}-500 bg-${getTeamColor(player.team)}-50`
                          : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{player.name}</div>
                      <div className="text-sm text-gray-600">{player.team}</div>
                    </button>
                  ))}
                </div>

                {gameState.settings.mode === 'coinche' && (
                  <div className="space-y-3">
                    <h4 className="text-center text-gray-700">Couleur</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {suits.map(suit => (
                        <button
                          key={suit.value}
                          type="button"
                          onClick={() => setBid(prev => ({ 
                            ...prev, 
                            value: prev?.value || 80,
                            suit: suit.value as any,
                            player: taker || allPlayers[0].id
                          }))}
                          className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                            bid?.suit === suit.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                          }`}
                        >
                          <div className={`text-2xl ${suit.color}`}>{suit.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mise Tab */}
            {activeTab === 'mise' && gameState.settings.mode === 'coinche' && (
              <div className="space-y-4">
                <h3 className="text-center text-lg font-medium text-gray-900">Mise</h3>
                <div className="grid grid-cols-3 gap-2">
                  {bidValues.map(value => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setBid(prev => ({ 
                        ...prev, 
                        value: value,
                        suit: prev?.suit || 'hearts',
                        player: taker || allPlayers[0].id
                      }))}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                        bid?.value === value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 bg-gray-50 text-gray-700'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBid(prev => ({ 
                        ...prev, 
                        value: 250,
                        suit: prev?.suit || 'hearts',
                        player: taker || allPlayers[0].id
                      }))}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                        bid?.value === 250
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 bg-gray-50 text-gray-700'
                      }`}
                  >
                    Capot
                  </button>
                  <button
                    type="button"
                    onClick={() => setBid(prev => ({ 
                      ...prev, 
                      value: 500,
                      suit: prev?.suit || 'hearts',
                      player: taker || allPlayers[0].id,
                      type: 'general'
                    }))}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                      bid?.value === 500 & bid?.type === 'general'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300 bg-gray-50 text-gray-700'
                    }`}
                  >
                    Général
                  </button>
                </div>
              </div>
            )}

            {/* Coinche Tab */}
            {activeTab === 'coinche' && gameState.settings.mode === 'coinche' && bid?.value && (
              <div className="space-y-4">
                <h3 className="text-center text-lg font-medium text-gray-900">Coinche</h3>
                <div className="grid grid-cols-2 gap-3">
                  {opposingPlayers.map(player => (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => setCoincher(coincher === player.id ? '' : player.id)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        coincher === player.id
                          ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                          : 'border-gray-200 hover:border-gray-300 bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="font-medium">Coinche</div>
                      <div className="text-sm">{player.name}</div>
                    </button>
                  ))}
                </div>

                {coincher && (
                  <div className="space-y-3">
                    <h4 className="text-center text-gray-700">Surcoinche</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {allPlayers.filter(p => {
                        const takerPlayer = allPlayers.find(pl => pl.id === taker);
                        return takerPlayer && p.team === takerPlayer.team;
                      }).map(player => (
                        <button
                          key={player.id}
                          type="button"
                          onClick={() => setSurcoincher(surcoincher === player.id ? '' : player.id)}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            surcoincher === player.id
                              ? 'border-purple-500 bg-purple-50 text-purple-700'
                              : 'border-gray-200 hover:border-gray-300 bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div className="font-medium">Surcoinche</div>
                          <div className="text-sm">{player.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Score Tab */}
            {activeTab === 'score' && (
              <div className="space-y-4">
                <h3 className="text-center text-lg font-medium text-gray-900">Score</h3>
                
                {/* Score Inputs */}
                <div className={`grid gap-3 ${gameState.settings.playerCount === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  {getAvailableTeams().map(team => (
                    <div key={team} className="text-center">
                      <div className={`font-medium text-${getTeamColor(team as 'A' | 'B' | 'C')}-600 mb-2`}>
                        <div className={`font-medium text-${getTeamColor(team as 'A' | 'B' | 'C')}-600 mb-2`}>
                          
  {getTeamNames(team as 'A' | 'B' | 'C')}
</div>
                      </div>
                      <input
                        type="number"
                        value={isCapot ? (teamScores[team as keyof typeof teamScores] || 0) : teamScores[team as keyof typeof teamScores]}
                        onChange={(e) => {
  const value = parseInt(e.target.value) || 0;
  setTeamScores(prev => ({ ...prev, [team]: value }));
  setLastChangedTeam(team as 'A' | 'B' | 'C'); // <-- ici
  setIsCapot(false);
}}
                        disabled={isCapot}
                        className="w-full text-center text-lg sm:text-xl font-bold bg-gray-50 border border-gray-200 rounded-lg py-2 px-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
                        min="0"
                        max="252"
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                    </div>
                  ))}
                </div>

                {beloteModalTeam && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div className="bg-white rounded-xl p-6 space-y-4 w-64 shadow-xl">
      <div className="text-lg font-semibold mb-2">
        Nombre de belotes pour l’équipe {beloteModalTeam}
      </div>
      {[1, 2, 3, 4].map(count => (
        <button
          key={count}
          onClick={() => {
            setBeloteCounts(prev => ({ ...prev, [beloteModalTeam]: count }));
            setBeloteModalTeam(null);
          }}
          className="w-full py-2 border rounded-lg hover:bg-gray-100 transition"
        >
          {count} belote{count > 1 ? 's' : ''}
        </button>
      ))}
      <button
        onClick={() => {
          setBeloteCounts(prev => ({ ...prev, [beloteModalTeam!]: 0 }));
          setBeloteModalTeam(null);
        }}
        className="w-full text-sm text-red-500 hover:underline mt-2"
      >
        Supprimer la belote pour {beloteModalTeam}
      </button>
    </div>
  </div>
)}


                {/* Action Buttons */}
                <div className="space-y-3">
                  {/* Belote/Rebelote Buttons */}
                  <div className="grid grid-cols-2 gap-2">
    {getAvailableTeams().map(team => {
      const isTA = bid?.suit === 'all-trump';
      const isSelected = isTA
        ? beloteCounts[team as 'A' | 'B' | 'C'] > 0
        : beloteTeam === team;

      return (
        <button
          key={team}
          type="button"
          onClick={() => handleBeloteRebelote(team as 'A' | 'B' | 'C')}
          className={`p-3 rounded-xl border-2 transition-all duration-200 text-sm ${
            isSelected
              ? 'border-red-500 bg-red-50 text-red-700'
              : 'border-gray-200 hover:border-gray-300 bg-gray-50 text-gray-700'
          }`}
        >
          <div className="font-medium">Belote</div>
          <div className="font-medium text-gray-900">
            {getTeamNames(team as 'A' | 'B' | 'C')}
          </div>
          {isTA && beloteCounts[team as 'A' | 'B' | 'C'] > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              {beloteCounts[team as 'A' | 'B' | 'C']} belote
              {beloteCounts[team as 'A' | 'B' | 'C'] > 1 ? 's' : ''}
            </div>
          )}
        </button>
      );
    })}
  </div>

                  {/* Capot Buttons */}
                  <div className={`grid gap-2 ${gameState.settings.playerCount === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    {getAvailableTeams().map(team => (
                      <button
                        key={team}
                        type="button"
                        onClick={() => handleCapot(team as 'A' | 'B' | 'C')}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                          isCapot && teamScores[team as keyof typeof teamScores] === 252
                            ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                            : 'border-gray-200 hover:border-gray-300 bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="font-medium">Capot</div>
                        <div className="font-medium text-gray-900">
  {getTeamNames(team as 'A' | 'B' | 'C')}
</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Penalty Tab */}
            {activeTab === 'penalty' && (
              <div className="space-y-4">
                <h3 className="text-center text-lg font-medium text-gray-900">Pénalités</h3>
                
                {/* Existing Penalties */}
                {penalties.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Pénalités appliquées</h4>
                    {penalties.map(penalty => {
                      const player = gameState.players.find(p => p.id === penalty.playerId);
                      return (
                        <div key={penalty.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                          <div>
                            <div className="font-medium text-red-900">{player?.name}</div>
                            <div className="text-sm text-red-700">-{penalty.points} points</div>
                            {penalty.reason && (
                              <div className="text-xs text-red-600">{penalty.reason}</div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removePenalty(penalty.id)}
                            className="p-1 text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add Penalty Form */}
                {showPenaltyForm ? (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700">Ajouter une pénalité</h4>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Joueur</label>
                      <select
                        value={penaltyForm.playerId}
                        onChange={(e) => setPenaltyForm(prev => ({ ...prev, playerId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">Sélectionner un joueur</option>
                        {gameState.players.map(player => (
                          <option key={player.id} value={player.id}>
                            {player.name} (Équipe {player.team})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Points de pénalité</label>
                      <input
                        type="number"
                        value={penaltyForm.points}
                        onChange={(e) => setPenaltyForm(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        min="1"
                        max="500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Raison (optionnel)</label>
                      <input
                        type="text"
                        value={penaltyForm.reason}
                        onChange={(e) => setPenaltyForm(prev => ({ ...prev, reason: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Ex: Comportement antisportif"
                      />
                    </div>

                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={addPenalty}
                        disabled={!penaltyForm.playerId || penaltyForm.points <= 0}
                        className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Ajouter
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPenaltyForm(false)}
                        className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-400"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowPenaltyForm(true)}
                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-red-400 hover:text-red-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Minus className="w-5 h-5" />
                    <span>Ajouter une pénalité</span>
                  </button>
                )}
              </div>
            )}

            {/* Total Tab */}
            {activeTab === 'total' && (
              <div className="space-y-4">
                <h3 className="text-center text-lg font-medium text-gray-900">Total</h3>
                
                {/* Contract Status */}
                {gameState.settings.mode === 'coinche' && bid?.value && contractFulfilled !== null && (
                  <div className={`p-4 rounded-xl border-2 ${(bid.value === 500 && isCapot)? 'border-green-500 bg-green-50' 
                      :
                    contractFulfilled 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-red-500 bg-red-50'
                  }`}>
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      {(bid.value === 500 && isCapot)? (<CheckCircle className="w-5 h-5 text-green-600" />
                      ) : contractFulfilled ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className={`font-semibold ${
                        (bid.value === 500 && isCapot) ? 'text-green-700' : contractFulfilled ? 'text-green-700' : 'text-red-700'
                      }`}>
                        Contrat {(bid.value === 500 && isCapot)? 'Réussi' : contractFulfilled ? 'Réussi' : 'Échoué'}
                      </span>
                    </div>
                    <div className="text-center text-sm text-gray-600">
                      Contrat: {bid.value} points
                    </div>
                  </div>
                )}

                {/* Penalties Summary */}
                {penalties.length > 0 && (
                  <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                    <h4 className="font-semibold text-red-900 mb-2">Pénalités appliquées</h4>
                    <div className="space-y-1">
                      {penalties.map(penalty => {
                        const player = gameState.players.find(p => p.id === penalty.playerId);
                        return (
                          <div key={penalty.id} className="text-sm text-red-700">
                            {player?.name}: -{penalty.points} points
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Final Scores */}
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-900 mb-3 text-center">Scores finaux</h4>
                  <div className={`grid gap-4 ${gameState.settings.playerCount === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    {getAvailableTeams().map(team => (
                      <div key={team} className="text-center">
                        <div className={`font-medium text-${getTeamColor(team as 'A' | 'B' | 'C')}-600`}>
                          <div className={`font-medium text-${getTeamColor(team as 'A' | 'B' | 'C')}-600 mb-2`}>
                          
  {getTeamNames(team as 'A' | 'B' | 'C')}
</div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {calculatedScores[`team${team}` as keyof typeof calculatedScores] > 0 ? '+' : ''}{calculatedScores[`team${team}` as keyof typeof calculatedScores]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!taker}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Valider
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}