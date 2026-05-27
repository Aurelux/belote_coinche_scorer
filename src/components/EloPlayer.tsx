export interface EloMap {
  coinche4P: number;
  coinche3P: number;
  coinche2P: number;
  belote4P:  number;
  belote3P:  number;
  belote2P:  number;
}
 
export type GameModeKey = keyof EloMap;
 
export interface EloPlayerSnapshot {
  userId: string;
  elo: number;
  totalGames: number; // pour le facteur K
}
 
interface GameEloContext {
  modeKey: GameModeKey;
  matchId: string;
  // Les 4 snapshots dans l'ordre : [teamA_p1, teamA_p2, teamB_p1, teamB_p2]
  // (ou 2 snapshots pour coinche2P / belote2P)
  players: EloPlayerSnapshot[];
  teamA_playerIds: string[];
  teamB_playerIds: string[];
  winningTeam: 'A' | 'B';
  // Infos de la partie pour les multiplicateurs
  scoreTeamA: number;
  scoreTeamB: number;
  hadCoinche: boolean;
  coincheWonByWinner: boolean;   // true = le gagnant a réussi sa coinche
  hadSurcoinche: boolean;
  surcoincheWonByWinner: boolean;
  hadCapot: boolean;             // capot infligé par le gagnant
}
 
interface EloDelta {
  userId: string;
  eloBefore: number;
  eloAfter: number;
  delta: number;
  kFactor: number;
  multiplier: number;
  events: string[];
  won: boolean;
}
 
// ============================================================
//  CONSTANTES
// ============================================================
 
const ELO_DEFAULT = 1500;
const ELO_FLOOR   = 800;   // plancher absolu
 
// Facteur K selon l'expérience sur CE mode
function getKFactor(totalGames: number): number {
  if (totalGames < 30)  return 40;
  if (totalGames < 100) return 25;
  return 15;
}
 
// Résultat attendu (formule Elo classique)
function expectedScore(eloA: number, eloB: number): number {
  return 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
}
 
// ============================================================
//  CALCUL DES MULTIPLICATEURS
// ============================================================
 
function computeMultiplier(ctx: GameEloContext, isWinner: boolean): { multiplier: number; events: string[] } {
  let multiplier = 1.0;
  const events: string[] = [];
 
  const totalScore = ctx.scoreTeamA + ctx.scoreTeamB;
  const winnerScore = ctx.winningTeam === 'A' ? ctx.scoreTeamA : ctx.scoreTeamB;
 
  // Victoire écrasante : >75% des points
  if (totalScore > 0 && winnerScore / totalScore > 0.75) {
    multiplier += 0.30;
    events.push("Victoire écrasante +30%");
  }
 
  // Coinche réussie par le gagnant
  if (ctx.hadCoinche && ctx.coincheWonByWinner) {
    if (isWinner) {
      multiplier += 0.50;
      events.push("Coinche réussie +50%");
    } else {
      multiplier += 0.40;
      events.push("Coinche subie et perdue +40%");
    }
  }
 
  // Coinche perdue par le gagnant (il a résisté à la coinche adverse)
  if (ctx.hadCoinche && !ctx.coincheWonByWinner) {
    if (isWinner) {
      multiplier += 0.35;
      events.push("Coinche adverse contrée +35%");
    }
  }
 
  // Surcoinche
  if (ctx.hadSurcoinche && ctx.surcoincheWonByWinner) {
    if (isWinner) {
      multiplier += 0.80;
      events.push("Surcoinche réussie +80%");
    } else {
      multiplier += 0.60;
      events.push("Surcoinche subie +60%");
    }
  }
 
  // Capot infligé
  if (ctx.hadCapot) {
    if (isWinner) {
      multiplier += 0.60;
      events.push("Capot infligé +60%");
    } else {
      multiplier += 0.40;
      events.push("Capot subi +40%");
    }
  }
 
  // Adversaire bloqué à 0
  const loserScore = ctx.winningTeam === 'A' ? ctx.scoreTeamB : ctx.scoreTeamA;
  if (loserScore === 0) {
    multiplier += 0.40;
    events.push("Adversaire à 0 pt +40%");
  }
 
  if (events.length === 0) events.push("Partie standard");
 
  return { multiplier: Math.round(multiplier * 100) / 100, events };
}
 
// ============================================================
//  CALCUL DES DELTAS ÉLO (tous les joueurs d'un coup)
// ============================================================
 
function computeEloDeltas(ctx: GameEloContext): EloDelta[] {
  const { players, teamA_playerIds, teamB_playerIds, winningTeam } = ctx;
 
  // Moyenne Élo de chaque équipe
  const teamA_players = players.filter(p => teamA_playerIds.includes(p.userId));
  const teamB_players = players.filter(p => teamB_playerIds.includes(p.userId));
 
  const avgEloA = teamA_players.reduce((s, p) => s + p.elo, 0) / Math.max(teamA_players.length, 1);
  const avgEloB = teamB_players.reduce((s, p) => s + p.elo, 0) / Math.max(teamB_players.length, 1);
 
  const expected_A = expectedScore(avgEloA, avgEloB); // probabilité que A gagne
  const actual_A   = winningTeam === 'A' ? 1 : 0;
 
  const deltas: EloDelta[] = [];
 
  for (const player of players) {
    const isTeamA  = teamA_playerIds.includes(player.userId);
    const isWinner = (isTeamA && winningTeam === 'A') || (!isTeamA && winningTeam === 'B');
 
    const k = getKFactor(player.totalGames);
    // Pour team B, on inverse : expected_B = 1 - expected_A, actual_B = 1 - actual_A
    const expected = isTeamA ? expected_A : (1 - expected_A);
    const actual   = isWinner ? 1 : 0;
 
    const { multiplier, events } = computeMultiplier(ctx, isWinner);
 
    const rawDelta  = k * (actual - expected);
    const finalDelta = Math.round(rawDelta * multiplier);
 
    const eloAfter = Math.max(ELO_FLOOR, player.elo + finalDelta);
 
    deltas.push({
      userId:    player.userId,
      eloBefore: player.elo,
      eloAfter,
      delta:     eloAfter - player.elo, // respecte le plancher
      kFactor:   k,
      multiplier,
      events,
      won:       isWinner,
    });
  }
 
  return deltas;
}
 
// ============================================================
//  DECAY D'INACTIVITÉ
//  Appelle cette fonction au chargement du profil, pas en jeu
// ============================================================
 
export async function applyEloDecay(
  supabase: any,
  userId: string,
  lastActiveDate: Date
): Promise<void> {
  const daysSince = Math.floor((Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSince < 21) return;
 
  const decayAmount = Math.min(100, Math.floor((daysSince - 21) * 0.5));
  if (decayAmount <= 0) return;
 
  const { data } = await supabase.from('users').select('elo').eq('id', userId).single();
  if (!data?.elo) return;
 
  const newElo: EloMap = { ...data.elo };
  const LEAGUES_FLOORS: Record<string, number> = {
    bronze: 800, argent: 1100, or: 1300, platine: 1500, diamant: 1700, legende: 1900
  };
 
  // Decay sur chaque mode proportionnellement
  for (const mode of Object.keys(newElo) as GameModeKey[]) {
    newElo[mode] = Math.max(ELO_FLOOR, newElo[mode] - decayAmount);
  }
 
  await supabase.from('users').update({ elo: newElo }).eq('id', userId);
}
 
// ============================================================
//  FONCTION PRINCIPALE — À appeler dans updatePlayerStatsInSupabase
// ============================================================
//
//  COMMENT L'UTILISER :
//
//  Dans ta fonction updatePlayerStatsInSupabase(), AVANT le supabase.update final,
//  tu collectes les infos de tous les joueurs et tu appelles calculateAndUpdateElo()
//  UNE SEULE FOIS (pas dans la boucle for player). 
//  Voir exemple d'intégration plus bas.
//
 
export async function calculateAndUpdateElo(
  supabase: any,
  ctx: GameEloContext
): Promise<EloDelta[]> {
  // 1. Calcul de tous les deltas
  const deltas = computeEloDeltas(ctx);
 
  // 2. Pour chaque joueur, mise à jour de users.elo + insert dans elo_history
  for (const delta of deltas) {
    try {
      // Lire l'Élo actuel depuis la DB (source de vérité)
      const { data: userData } = await supabase
        .from('users')
        .select('elo')
        .eq('id', delta.userId)
        .single();
 
      const currentEloMap: EloMap = userData?.elo ?? {
        coinche4P: ELO_DEFAULT, coinche3P: ELO_DEFAULT, coinche2P: ELO_DEFAULT,
        belote4P:  ELO_DEFAULT, belote3P:  ELO_DEFAULT, belote2P:  ELO_DEFAULT,
      };
 
      const eloBefore = currentEloMap[ctx.modeKey] ?? ELO_DEFAULT;
      const eloAfter  = Math.max(ELO_FLOOR, eloBefore + delta.delta);
      const realDelta = eloAfter - eloBefore;
 
      // Mise à jour de la colonne elo (patch uniquement le mode concerné)
      const updatedEloMap = { ...currentEloMap, [ctx.modeKey]: eloAfter };
 
      await supabase
        .from('users')
        .update({ elo: updatedEloMap })
        .eq('id', delta.userId);
 
      // Log dans elo_history
      await supabase.from('elo_history').insert({
        user_id:    delta.userId,
        game_mode:  ctx.modeKey,
        match_id:   ctx.matchId,
        elo_before: eloBefore,
        elo_after:  eloAfter,
        delta:      realDelta,
        k_factor:   delta.kFactor,
        multiplier: delta.multiplier,
        events:     delta.events,
        won:        delta.won,
      });
 
    } catch (err) {
      console.error(`[ELO] Erreur mise à jour pour ${delta.userId}:`, err);
    }
  }
 
  return deltas;
}
 
