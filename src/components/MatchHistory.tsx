import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, Trophy, Clock, Users, Target, Calendar,
  TrendingUp, Star, Zap, Award, BarChart2, Shield, Flame,
  ThumbsUp, ThumbsDown, Swords, Crown
} from 'lucide-react';
import { useGame } from '../context/useGame';

type Team = 'A' | 'B' | 'C';

// ─── Composants UI ─────────────────────────────────────────────────────────────

function StatBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="w-full bg-green-900/40 rounded-full h-2 overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, accent }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; accent: string;
}) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-2 border border-white/10 bg-green-900/30 backdrop-blur">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-green-300/70 text-xs font-medium uppercase tracking-widest">{label}</p>
      <p className="text-white text-2xl font-bold leading-none">{value}</p>
      {sub && <p className="text-green-400/60 text-xs">{sub}</p>}
    </div>
  );
}

function RingChart({ pct, label, color }: { pct: number; label: string; color: string }) {
  const r = 36, circ = 2 * Math.PI * r, dash = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 44 44)" style={{ transition: 'stroke-dasharray 1s ease' }} />
        <text x="44" y="49" textAnchor="middle" fill="white" fontSize="14" fontWeight="700">{pct}%</text>
      </svg>
      <p className="text-green-300/70 text-xs text-center">{label}</p>
    </div>
  );
}

function Medal({ rank }: { rank: number }) {
  if (rank === 0) return <span className="text-lg">🥇</span>;
  if (rank === 1) return <span className="text-lg">🥈</span>;
  if (rank === 2) return <span className="text-lg">🥉</span>;
  return <span className="text-green-400/40 text-sm font-bold">#{rank + 1}</span>;
}

function RankRow({ rank, label, wins, matches, winRate, barColor, sub }: {
  rank: number; label: string; wins: number; matches: number;
  winRate: number; barColor: string; sub?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 flex-shrink-0 flex items-center justify-center"><Medal rank={rank} /></div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-1 gap-2">
          <span className="text-white font-medium text-sm truncate">{label}</span>
          <span className="text-green-300 text-xs font-semibold flex-shrink-0">
            {winRate}% · {wins}V/{matches}P
          </span>
        </div>
        {sub && <p className="text-green-400/50 text-[10px] mb-1">{sub}</p>}
        <StatBar value={winRate} max={100} color={barColor} />
      </div>
    </div>
  );
}

function SectionCard({ icon: Icon, title, iconColor, children }: {
  icon: React.ElementType; title: string; iconColor: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-green-900/30 border border-white/10 p-5">
      <h2 className="text-white font-bold mb-4 flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconColor}`} /> {title}
      </h2>
      {children}
    </div>
  );
}

// ─── Calcul stats (centré sur l'utilisateur) ───────────────────────────────────

function bayesWinRate(wins: number, matches: number, z = 1.96) {
  if (matches === 0) return 0;

  const p = wins / matches;
  const denominator = 1 + (z * z) / matches;

  const centre = p + (z * z) / (2 * matches);
  const margin = z * Math.sqrt(
    (p * (1 - p) + (z * z) / (4 * matches)) / matches
  );

  return (centre - margin) / denominator;
}

function wilsonLosses(wins: number, matches: number, z = 1.96) {
  const losses = matches - wins;
  return bayesWinRate(losses, matches, z);
}
function computeCareerStats(history: any[], uid: string) {
  if (!history.length || !uid) return null;

  // ── Globaux ──────────────────────────────────────────────────────────────────
  const totalMatches   = history.length;
  const totalMinutes   = history.reduce((a, m) => a + (m.duration ?? 0), 0);
  const totalHours     = Math.floor(totalMinutes / 60);
  const remMin         = totalMinutes % 60;
  const totalHands     = history.reduce((a, m) => a + (m.handsPlayed ?? 0), 0);
  const avgHandsPerMatch = Math.round(totalHands / totalMatches);

  // ── Modes ────────────────────────────────────────────────────────────────────
  const beloteCount  = history.filter(m => m.settings.mode === 'belote').length;
  const coincheCount = totalMatches - beloteCount;
  const belotePct    = Math.round((beloteCount / totalMatches) * 100);

  // ── Streak de l'user ─────────────────────────────────────────────────────────
  let streak = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const m = history[i];
    const userTeam = m.players.find((p: any) => p.name.slice(0, 5) === uid)?.team;
    if (userTeam && m.winningTeam === userTeam) streak++;
    else break;
  }

  // ── Durées ───────────────────────────────────────────────────────────────────
  const longestMin  = history.reduce((a, b) => a.duration > b.duration ? a : b).duration;
  const shortestMin = history.reduce((a, b) => a.duration < b.duration ? a : b).duration;

  // ── Parties où l'user est présent ────────────────────────────────────────────
  const userMatches = history.filter(m => m.players.some((p: any) => p.name.slice(0, 5) === uid));

  // ── Score moyen de la team de l'user ─────────────────────────────────────────
  let userScoreSum = 0, userScoreCount = 0;
  userMatches.forEach(m => {
    const userTeam = m.players.find((p: any) => p.name.slice(0, 5) === uid)?.team as Team | undefined;
    if (!userTeam) return;
    const score = m.finalScores[`team${userTeam}`];
    if (score !== undefined) { userScoreSum += score; userScoreCount++; }
  });
  const avgUserScore = userScoreCount > 0 ? Math.round(userScoreSum / userScoreCount) : 0;

  // ── Partenaires (dans la team de l'user) ─────────────────────────────────────
  const teammateStats: Record<string, { matches: number; wins: number }> = {};
  userMatches.forEach(m => {
    const userPlayer = m.players.find((p: any) => p.name.slice(0, 5) === uid);
    if (!userPlayer) return;
    const userWon = m.winningTeam === userPlayer.team;
    m.players
      .filter((p: any) => p.team === userPlayer.team && p.name.slice(0, 5) !== uid)
      .forEach((t: any) => {
        if (!teammateStats[t.name.slice(0, 5)]) teammateStats[t.name.slice(0, 5)] = { matches: 0, wins: 0 };
        teammateStats[t.name.slice(0, 5)].matches += 1;
        if (userWon) teammateStats[t.name.slice(0, 5)].wins += 1;
      });
  });

  const teammateList = Object.entries(teammateStats).map(([name, s]) => ({
    name, matches: s.matches, wins: s.wins,
    winRate: Math.round((s.wins / s.matches) * 100),
    score: bayesWinRate(s.wins, s.matches),
    score_nef : wilsonLosses(s.wins,s.matches),
  }));

  const bestTeammates  = [...teammateList].sort((a, b) => b.score - a.score).slice(0, 10);
  const worstTeammates = [...teammateList].sort((a, b) => b.score_nef - a.score_nef).slice(0, 10);

  // ── Équipes adverses (duos dans la team opposée) ──────────────────────────────
  const vsTeamStats: Record<string, { matches: number; winsAgainstUser: number }> = {};
  userMatches.forEach(m => {
    const userPlayer = m.players.find((p: any) => p.name.slice(0, 5) === uid);
    if (!userPlayer) return;

    // Grouper les adversaires par team
    const oppTeams: Record<string, string[]> = {};
    m.players
      .filter((p: any) => p.team !== userPlayer.team)
      .forEach((p: any) => {
        if (!oppTeams[p.team]) oppTeams[p.team] = [];
        oppTeams[p.team].push(p.name.slice(0, 5));
      });

    Object.entries(oppTeams).forEach(([team, names]) => {
      if (names.length < 2) return; // on ne veut que les duos
      const key = [...names].sort().join(' & ');
      if (!vsTeamStats[key]) vsTeamStats[key] = { matches: 0, winsAgainstUser: 0 };
      vsTeamStats[key].matches += 1;
      if (m.winningTeam === team) vsTeamStats[key].winsAgainstUser += 1;
    });
  });

  const vsPlayerStatsSolo: Record<string, { matches: number; winsAgainstUser: number }> = {};

userMatches.forEach(m => {
  const userPlayer = m.players.find((p: any) => p.name.slice(0, 5) === uid);
  if (!userPlayer) return;

  m.players
    .filter((p: any) => p.team !== userPlayer.team)
    .forEach((p: any) => {
      const key = p.name.slice(0, 5); // identifiant joueur

      if (!vsPlayerStatsSolo[key]) {
        vsPlayerStatsSolo[key] = { matches: 0, winsAgainstUser: 0 };
      }

      vsPlayerStatsSolo[key].matches += 1;

      // si ce joueur gagne contre toi
      if (m.winningTeam !== userPlayer.team) {
        vsPlayerStatsSolo[key].winsAgainstUser += 1;
      }
    });
});

  const vsTeamList = Object.entries(vsTeamStats).map(([name, s]) => ({
    name, matches: s.matches,
    winsAgainstUser: s.winsAgainstUser,
    userWins: s.matches - s.winsAgainstUser,
    winRate: Math.round(((s.matches - s.winsAgainstUser) / s.matches) * 100),
    score: bayesWinRate(s.matches - s.winsAgainstUser, s.matches),
    score_nef : wilsonLosses(s.matches - s.winsAgainstUser,s.matches),
  }));

  const vsTeamListSolo = Object.entries(vsPlayerStatsSolo)
  .map(([name, s]) => {
    const userWins = s.matches - s.winsAgainstUser;

    return {
      name,
      matches: s.matches,
      winsAgainstUser: s.winsAgainstUser,
      userWins,

      // éviter division par 0
      winRate: s.matches > 0
        ? Math.round((userWins / s.matches) * 100)
        : 0,

      // score "joueurs que tu bats"
      score: bayesWinRate(userWins, s.matches),

      // score "équipes qui te battent"
      score_nef: wilsonLosses(userWins, s.matches),
    };
  })
  // 👉 optionnel : filtre pour éviter les stats peu fiables
  .filter(t => t.matches >= 5);

  const mostBeatenOpponentsSolo = [...vsTeamListSolo].sort((a, b) => b.score - a.score).slice(0, 10);
  // Équipes qui battent le plus l'user
  const hardestOpponentsSolo    = [...vsTeamListSolo].sort((a, b) => b.score_nef - a.score_nef).slice(0, 10);
  // Équipes que l'user bat le plus souvent
  const mostBeatenOpponents = [...vsTeamList].sort((a, b) => b.score - a.score).slice(0, 10);
  // Équipes qui battent le plus l'user
  const hardestOpponents    = [...vsTeamList].sort((a, b) => b.score_nef - a.score_nef).slice(0, 10);

  return {
    totalMatches, totalMinutes, totalHours, remMin, totalHands, avgHandsPerMatch,
    beloteCount, coincheCount, belotePct,
    streak, longestMin, shortestMin, avgUserScore,
    bestTeammates, worstTeammates,
    mostBeatenOpponents, hardestOpponents,mostBeatenOpponentsSolo,hardestOpponentsSolo
  };
}

// ─── Onglet Bilan de Carrière ─────────────────────────────────────────────────

function CareerTab({ history, currentUserId }: { history: any[]; currentUserId: string }) {
  const stats = computeCareerStats(history, currentUserId);
  const EmptyState = ({ msg }: { msg: string }) => (
    <p className="text-green-400/50 text-sm text-center py-3">{msg}</p>
  );

  if (!currentUserId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-green-400/60">
        <Trophy className="w-14 h-14 mb-4 opacity-40" />
        <p className="text-lg font-semibold">Utilisateur non identifié</p>
        <p className="text-sm mt-1">Connecte-toi pour voir ton bilan de carrière.</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-green-400/60">
        <Trophy className="w-14 h-14 mb-4 opacity-40" />
        <p className="text-lg font-semibold">Aucune donnée de carrière</p>
        <p className="text-sm mt-1">Terminez des parties pour voir vos stats !</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">

      {/* Identité */}
      <div className="rounded-2xl bg-gradient-to-r from-green-800/60 to-green-900/40 border border-white/10 p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
          {currentUserId.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-white font-bold text-lg leading-tight">{currentUserId}</p>
          <p className="text-green-300/60 text-xs">{stats.totalMatches} parties · {stats.totalHours}h{stats.remMin}m de jeu</p>
        </div>
      </div>

      {/* Chiffres clés */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Trophy} label="Parties jouées"  value={stats.totalMatches}                     accent="bg-yellow-500/80" />
        <StatCard icon={Clock}  label="Temps de jeu"    value={`${stats.totalHours}h${stats.remMin}m`} sub={`${stats.totalMinutes} min au total`} accent="bg-blue-500/80" />
        <StatCard icon={Zap}    label="Mains jouées"    value={stats.totalHands}                       sub={`~${stats.avgHandsPerMatch} / partie`} accent="bg-purple-500/80" />
        <StatCard icon={Flame}  label="Série en cours"  value={`${stats.streak}🔥`}                    sub="victoires consécutives" accent="bg-orange-500/80" />
      </div>

      {/* Modes de jeu */}
      <SectionCard icon={Target} title="Modes de jeu" iconColor="text-green-400">
        <div className="flex justify-around">
          <RingChart pct={stats.belotePct}        label={`Belote (${stats.beloteCount})`}   color="#3b82f6" />
          <RingChart pct={100 - stats.belotePct}  label={`Coinche (${stats.coincheCount})`} color="#f59e0b" />
        </div>
      </SectionCard>

      {/* Score moyen */}
      <SectionCard icon={Award} title="Score moyen de ton équipe" iconColor="text-blue-400">
        <div className="flex justify-center">
          <div className="bg-white/10 rounded-2xl px-10 py-5 text-center">
            <p className="text-4xl font-bold text-white">{stats.avgUserScore}</p>
            <p className="text-green-300/60 text-xs mt-1">points / partie</p>
          </div>
        </div>
      </SectionCard>

      {/* Meilleurs coéquipiers */}
      <SectionCard icon={ThumbsUp} title="🤝 Meilleurs coéquipiers" iconColor="text-emerald-400">
        {stats.bestTeammates.length === 0
          ? <EmptyState msg="Pas encore assez de données" />
          : <div className="space-y-3">
              {stats.bestTeammates.map((t, i) => (
                <RankRow key={t.name} rank={i} label={t.name}
                  wins={t.wins} matches={t.matches} winRate={t.winRate}
                  barColor={i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-300' : 'bg-amber-500'}
                />
              ))}
            </div>
        }
      </SectionCard>

      {/* Pires coéquipiers */}
      <SectionCard icon={ThumbsDown} title="😬 Pires coéquipiers" iconColor="text-red-400">
        {stats.worstTeammates.length === 0
          ? <EmptyState msg="Pas encore assez de données" />
          : <div className="space-y-3">
              {stats.worstTeammates.map((t, i) => (
                <RankRow key={t.name} rank={i} label={t.name}
                  wins={t.wins} matches={t.matches} winRate={t.winRate}
                  barColor="bg-red-400"
                />
              ))}
            </div>
        }
      </SectionCard>

      {/* Équipes les plus battues */}
      <SectionCard icon={Crown} title="👑 Équipes que tu domines" iconColor="text-yellow-400">
        {stats.mostBeatenOpponents.length === 0
          ? <EmptyState msg="Pas encore assez de données" />
          : <div className="space-y-3">
              {stats.mostBeatenOpponents.map((t, i) => (
                <RankRow key={t.name} rank={i} label={t.name}
                  wins={t.userWins} matches={t.matches} winRate={t.winRate}
                  barColor="bg-emerald-400"
                  sub={`Tu gagnes ${t.winRate}% de vos confrontations`}
                />
              ))}
            </div>
        }
      </SectionCard>

      {/* Équipes qui résistent */}
      <SectionCard icon={Swords} title="⚔️ Équipes qui te résistent" iconColor="text-orange-400">
        {stats.hardestOpponents.length === 0
          ? <EmptyState msg="Pas encore assez de données" />
          : <div className="space-y-3">
              {stats.hardestOpponents.map((t, i) => {
                const lossRate = 100 - t.winRate;
                return (
                  <RankRow key={t.name} rank={i} label={t.name}
                    wins={t.winsAgainstUser} matches={t.matches} winRate={lossRate}
                    barColor="bg-orange-400"
                    sub={`Ils gagnent ${lossRate}% de vos confrontations`}
                  />
                );
              })}
            </div>
        }
      </SectionCard>

      {/* Équipes les plus battues */}
      <SectionCard icon={Crown} title="👑 Joueurs que tu domines" iconColor="text-yellow-400">
        {stats.mostBeatenOpponentsSolo.length === 0
          ? <EmptyState msg="Pas encore assez de données" />
          : <div className="space-y-3">
              {stats.mostBeatenOpponentsSolo.map((t, i) => (
                <RankRow key={t.name} rank={i} label={t.name}
                  wins={t.userWins} matches={t.matches} winRate={t.winRate}
                  barColor="bg-emerald-400"
                  sub={`Tu gagnes ${t.winRate}% de vos confrontations`}
                />
              ))}
            </div>
        }
      </SectionCard>

      {/* Équipes qui résistent */}
      <SectionCard icon={Swords} title="⚔️ Joueurs qui te résistent" iconColor="text-orange-400">
        {stats.hardestOpponentsSolo.length === 0
          ? <EmptyState msg="Pas encore assez de données" />
          : <div className="space-y-3">
              {stats.hardestOpponentsSolo.map((t, i) => {
                const lossRate = 100 - t.winRate;
                return (
                  <RankRow key={t.name} rank={i} label={t.name}
                    wins={t.winsAgainstUser} matches={t.matches} winRate={lossRate}
                    barColor="bg-orange-400"
                    sub={`Il/Elle gagne ${lossRate}% de vos confrontations`}
                  />
                );
              })}
            </div>
        }
      </SectionCard>

      {/* Durées */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={TrendingUp} label="Partie la + longue"  value={`${stats.longestMin} min`}  accent="bg-red-500/80"  />
        <StatCard icon={Shield}     label="Partie la + courte"  value={`${stats.shortestMin} min`} accent="bg-teal-500/80" />
      </div>

    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export function MatchHistory() {
  const { gameState, loadMatchHistory, goBack } = useGame();
  const [activeTab, setActiveTab] = useState<'history' | 'career'>('history');

  // ⚠️ Adapte cette ligne selon la structure exacte de ton gameState/context
  // Exemples possibles : gameState.currentUser?.name · gameState.currentUserId · gameState.profile?.username
  const currentUserId = gameState.currentUser?.displayName.slice(0, 5);

  useEffect(() => { loadMatchHistory(); }, []);

  const formatDate = (rawDate: string | Date) => {
    const date = new Date(rawDate);
    if (isNaN(date.getTime())) return 'Date invalide';
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const h = Math.floor(minutes / 60), m = minutes % 60;
    return `${h}h${m > 0 ? ` ${m}min` : ''}`;
  };

  const getTeamColor = (team: Team) => ({ A: 'blue', B: 'red', C: 'green' }[team]);

  const bgStyle = {
    backgroundColor: '#042204',
    backgroundImage: `
      radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px),
      radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)
    `,
    backgroundPosition: '0 0, 10px 10px',
    backgroundSize: '20px 20px',
  };

  return (
    <div className="min-h-screen pt-safe pb-safe p-4" style={bgStyle}>
      <div className="max-w-4xl mx-auto" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
          <div className="flex items-center space-x-4">
            <button onClick={goBack} className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Historique</h1>
              <p className="text-gray-600">{gameState.matchHistory.length} parties terminées</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {(['history', 'career'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-white text-green-900 shadow-lg scale-105'
                  : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
              }`}>
              {tab === 'history' ? '🃏 Matchs' : '🏆 Bilan de Carrière'}
            </button>
          ))}
        </div>

        {/* Contenu */}
        {activeTab === 'history' ? (
          gameState.matchHistory.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucun historique</h2>
              <p className="text-gray-600 mb-6">Terminez quelques parties pour voir l'historique des matchs</p>
              <button onClick={goBack} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Retour au Jeu
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {gameState.matchHistory.slice().reverse().map((match, index) => {
                const winningTeamColor = getTeamColor(match.winningTeam as Team);
                const isTeamMode = match.settings.playerCount === 4;
                return (
                  <div key={match.id} className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`w-3 h-3 bg-${winningTeamColor}-500 rounded-full`}></div>
                          <h3 className="text-lg font-bold text-gray-900">
                            Victoire {isTeamMode ? "de l'Équipe" : "du Joueur"} {match.winningTeam}
                          </h3>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            #{gameState.matchHistory.length - index}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center space-x-1"><Calendar className="w-4 h-4" /><span>{formatDate(match.timestamp)}</span></div>
                          <div className="flex items-center space-x-1"><Clock className="w-4 h-4" /><span>{formatDuration(match.duration)}</span></div>
                          <div className="flex items-center space-x-1"><Users className="w-4 h-4" /><span>{match.settings.playerCount} joueurs</span></div>
                          <div className="flex items-center space-x-1"><Target className="w-4 h-4" /><span>{match.settings.mode === 'belote' ? 'Belote' : 'Coinche'}</span></div>
                        </div>
                        <div className={`grid gap-3 ${match.settings.playerCount === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                          <div className="bg-blue-50 rounded-lg p-3">
                            <div className="font-semibold text-blue-700 mb-1">{isTeamMode ? 'Équipe A' : 'Joueur A'}</div>
                            {match.players.filter((p: any) => p.team === 'A').map((p: any) => <div key={p.id} className="text-sm text-gray-700">{p.name}</div>)}
                          </div>
                          <div className="bg-red-50 rounded-lg p-3">
                            <div className="font-semibold text-red-700 mb-1">{isTeamMode ? 'Équipe B' : 'Joueur B'}</div>
                            {match.players.filter((p: any) => p.team === 'B').map((p: any) => <div key={p.id} className="text-sm text-gray-700">{p.name}</div>)}
                          </div>
                          {match.settings.playerCount === 3 && (
                            <div className="bg-green-50 rounded-lg p-3">
                              <div className="font-semibold text-green-700 mb-1">Joueur C</div>
                              {match.players.filter((p: any) => p.team === 'C').map((p: any) => <div key={p.id} className="text-sm text-gray-700">{p.name}</div>)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="lg:ml-6">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h4 className="font-semibold text-gray-900 mb-3 text-center">Score Final</h4>
                          <div className={`grid gap-3 ${match.settings.playerCount === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${match.winningTeam === 'A' ? 'text-blue-600' : 'text-gray-600'}`}>{match.finalScores.teamA}</div>
                              <div className="text-xs text-gray-500">A</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${match.winningTeam === 'B' ? 'text-red-600' : 'text-gray-600'}`}>{match.finalScores.teamB}</div>
                              <div className="text-xs text-gray-500">B</div>
                            </div>
                            {match.settings.playerCount === 3 && (
                              <div className="text-center">
                                <div className={`text-2xl font-bold ${match.winningTeam === 'C' ? 'text-green-600' : 'text-gray-600'}`}>{match.finalScores.teamC}</div>
                                <div className="text-xs text-gray-500">C</div>
                              </div>
                            )}
                          </div>
                          <div className="text-center mt-2 text-xs text-gray-500">{match.handsPlayed} mains jouées</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <CareerTab history={gameState.matchHistory} currentUserId={currentUserId} />
        )}
      </div>
    </div>
  );
}