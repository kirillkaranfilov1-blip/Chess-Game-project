// Stronger chess engine: negamax + alpha-beta + quiescence + iterative deepening.
// Pure functions, safe to run inside a Web Worker.
//
// Performance note: chess.js' public API (move()/moves({verbose})) builds SAN
// strings and recomputes FEN on every call, which makes it ~50x too slow for
// tree search. When available we use its internal 0x88 move generator
// (_moves/_makeMove/_undoMove) and fall back to the public API otherwise.

import { Chess } from 'chess.js';
import {
  PIECE_VALUES,
  PAWN_TABLE,
  KNIGHT_TABLE,
  BISHOP_TABLE,
  ROOK_TABLE,
  QUEEN_TABLE,
  KING_TABLE,
} from './ai';

export const MATE = 100000;
export const MATE_THRESHOLD = MATE - 1000;
const INF = 1e9;
const STOP = Symbol('stop');

// King table for endgames: centralize the king
const KING_END_TABLE = [
  [-50, -40, -30, -20, -20, -30, -40, -50],
  [-30, -20, -10, 0, 0, -10, -20, -30],
  [-30, -10, 20, 30, 30, 20, -10, -30],
  [-30, -10, 30, 40, 40, 30, -10, -30],
  [-30, -10, 30, 40, 40, 30, -10, -30],
  [-30, -10, 20, 30, 30, 20, -10, -30],
  [-30, -30, 0, 0, 0, 0, -30, -30],
  [-50, -30, -30, -30, -30, -30, -30, -50],
];

const TABLES = {
  p: PAWN_TABLE,
  n: KNIGHT_TABLE,
  b: BISHOP_TABLE,
  r: ROOK_TABLE,
  q: QUEEN_TABLE,
  k: KING_TABLE,
};

const MATERIAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
const FILES = 'abcdefgh';

/** 0x88 square index -> algebraic ("e4") */
function algebraic(sq) {
  return FILES[sq & 15] + (8 - (sq >> 4));
}

// ---------- Board adapter (fast internal API with public fallback) ----------

function hasInternals(game) {
  return (
    typeof game._moves === 'function' &&
    typeof game._makeMove === 'function' &&
    typeof game._undoMove === 'function' &&
    typeof game._isKingAttacked === 'function' &&
    Array.isArray(game._board)
  );
}

function createAdapter(game) {
  if (hasInternals(game)) {
    return {
      fast: true,
      turn: () => game._turn,
      moves: () => game._moves(),
      make: (m) => game._makeMove(m),
      unmake: () => game._undoMove(),
      inCheck: () => game._isKingAttacked(game._turn),
      evaluate: () => evaluateBoard0x88(game._board, game._turn),
      historyLength: () => game._history.length,
      moveKey: (m) => m.from * 128 + m.to,
      toPublic: (m) => {
        const from = algebraic(m.from);
        const to = algebraic(m.to);
        const pretty = game.move({ from, to, promotion: m.promotion });
        game.undo();
        return {
          from,
          to,
          promotion: m.promotion,
          san: pretty.san,
          piece: m.piece,
          captured: m.captured,
        };
      },
    };
  }

  return {
    fast: false,
    turn: () => game.turn(),
    moves: () => game.moves({ verbose: true }),
    make: (m) => game.move(m),
    unmake: () => game.undo(),
    inCheck: () => game.inCheck(),
    evaluate: () => evaluateFen(game.fen()),
    historyLength: () => game.history().length,
    moveKey: (m) => `${m.from}${m.to}`,
    toPublic: (m) => ({
      from: m.from,
      to: m.to,
      promotion: m.promotion,
      san: m.san,
      piece: m.piece,
      captured: m.captured,
    }),
  };
}

// ---------- Evaluation (side-to-move perspective) ----------

function evaluateBoard0x88(board, turn) {
  let score = 0;
  let nonPawnMaterial = 0;
  let wB = 0;
  let bB = 0;
  let wK = -1;
  let bK = -1;

  for (let sq = 0; sq < 128; sq++) {
    if (sq & 0x88) {
      sq += 7;
      continue;
    }
    const p = board[sq];
    if (!p) continue;
    const r = sq >> 4;
    const c = sq & 7;
    const isWhite = p.color === 'w';
    if (p.type === 'k') {
      if (isWhite) wK = sq;
      else bK = sq;
      continue;
    }
    if (p.type !== 'p') nonPawnMaterial += MATERIAL[p.type];
    if (p.type === 'b') {
      if (isWhite) wB++;
      else bB++;
    }
    const rr = isWhite ? r : 7 - r;
    const val = MATERIAL[p.type] + TABLES[p.type][rr][c];
    score += isWhite ? val : -val;
  }

  const kingTable = nonPawnMaterial <= 2600 ? KING_END_TABLE : KING_TABLE;
  if (wK >= 0) score += kingTable[wK >> 4][wK & 7];
  if (bK >= 0) score -= kingTable[7 - (bK >> 4)][bK & 7];

  if (wB >= 2) score += 30;
  if (bB >= 2) score -= 30;

  return turn === 'w' ? score : -score;
}

function evaluateFen(fen) {
  const spaceIdx = fen.indexOf(' ');
  const boardStr = fen.slice(0, spaceIdx);
  const turn = fen.charAt(spaceIdx + 1);

  let score = 0;
  let nonPawnMaterial = 0;
  let wB = 0;
  let bB = 0;
  let wK = -1;
  let bK = -1;

  let r = 0;
  let c = 0;
  for (let i = 0; i < boardStr.length; i++) {
    const ch = boardStr.charCodeAt(i);
    if (ch === 47) {
      r++;
      c = 0;
      continue;
    }
    if (ch >= 49 && ch <= 56) {
      c += ch - 48;
      continue;
    }
    const isWhite = ch >= 65 && ch <= 90;
    const type = String.fromCharCode(isWhite ? ch + 32 : ch);
    if (type === 'k') {
      if (isWhite) wK = r * 8 + c;
      else bK = r * 8 + c;
    } else {
      if (type !== 'p') nonPawnMaterial += MATERIAL[type];
      if (type === 'b') {
        if (isWhite) wB++;
        else bB++;
      }
      const rr = isWhite ? r : 7 - r;
      score += (MATERIAL[type] + TABLES[type][rr][c]) * (isWhite ? 1 : -1);
    }
    c++;
  }

  const kingTable = nonPawnMaterial <= 2600 ? KING_END_TABLE : KING_TABLE;
  if (wK >= 0) score += kingTable[wK >> 3][wK & 7];
  if (bK >= 0) score -= kingTable[7 - (bK >> 3)][bK & 7];
  if (wB >= 2) score += 30;
  if (bB >= 2) score -= 30;

  return turn === 'w' ? score : -score;
}

/** Public helper: static eval of a chess.js instance (side to move). */
export function evaluate(game) {
  return createAdapter(game).evaluate();
}

function mvvLva(move) {
  let s = 0;
  if (move.captured) s += 10 * (PIECE_VALUES[move.captured] || 100) - (PIECE_VALUES[move.piece] || 100);
  if (move.promotion) s += 900;
  return s;
}

// ---------- Search ----------

class Searcher {
  constructor(game, { maxDepth = 4, timeMs = 2000, topN = 5 } = {}) {
    this.game = game;
    this.b = createAdapter(game);
    this.maxDepth = maxDepth;
    this.deadline = Date.now() + timeMs;
    this.topN = topN;
    this.nodes = 0;
    this.completedDepth = 0;
    this.killers = [];
  }

  checkTime() {
    this.nodes++;
    if ((this.nodes & 255) === 0 && this.completedDepth >= 1 && Date.now() > this.deadline) {
      throw STOP;
    }
  }

  orderMoves(moves, ply) {
    const killers = this.killers[ply];
    const scored = new Array(moves.length);
    for (let i = 0; i < moves.length; i++) {
      const m = moves[i];
      let s = mvvLva(m);
      if (killers) {
        const key = this.b.moveKey(m);
        if (killers[0] === key) s += 60;
        else if (killers[1] === key) s += 50;
      }
      scored[i] = { m, s };
    }
    scored.sort((a, b) => b.s - a.s);
    for (let i = 0; i < moves.length; i++) moves[i] = scored[i].m;
    return moves;
  }

  quiesce(alpha, beta, qdepth) {
    this.checkTime();
    const stand = this.b.evaluate();
    if (qdepth === 0) return stand;
    if (stand >= beta) return beta;
    if (stand > alpha) alpha = stand;

    const all = this.b.moves();
    const captures = [];
    for (let i = 0; i < all.length; i++) {
      if (all[i].captured || all[i].promotion) captures.push(all[i]);
    }
    captures.sort((a, c) => mvvLva(c) - mvvLva(a));

    for (let i = 0; i < captures.length; i++) {
      this.b.make(captures[i]);
      const score = -this.quiesce(-beta, -alpha, qdepth - 1);
      this.b.unmake();
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  }

  negamax(depth, alpha, beta, ply) {
    this.checkTime();
    const moves = this.b.moves();
    if (moves.length === 0) {
      return this.b.inCheck() ? -MATE + ply : 0;
    }
    // Draw detection is expensive; only check near the root where it matters
    if (ply <= 2 && this.game.isDraw()) return 0;
    if (depth <= 0) return this.quiesce(alpha, beta, 4);

    this.orderMoves(moves, ply);
    let best = -INF;
    for (let i = 0; i < moves.length; i++) {
      const m = moves[i];
      this.b.make(m);
      const score = -this.negamax(depth - 1, -beta, -alpha, ply + 1);
      this.b.unmake();
      if (score > best) best = score;
      if (score > alpha) alpha = score;
      if (alpha >= beta) {
        if (!m.captured) {
          const key = this.b.moveKey(m);
          const k = (this.killers[ply] ||= [null, null]);
          if (k[0] !== key) {
            k[1] = k[0];
            k[0] = key;
          }
        }
        break;
      }
    }
    return best;
  }

  run() {
    const rootMoves = this.b.moves();
    if (rootMoves.length === 0) {
      const score = this.b.inCheck() ? -MATE : 0;
      return { bestMove: null, score, depth: 0, candidates: [], nodes: 0 };
    }

    let results = this.orderMoves(rootMoves.slice(), 0).map((m) => ({ move: m, score: 0 }));
    const baseHistory = this.b.historyLength();

    for (let depth = 1; depth <= this.maxDepth; depth++) {
      try {
        results.sort((a, b) => b.score - a.score);
        const iter = [];
        let alpha = -INF;
        const beta = INF;

        for (let i = 0; i < results.length; i++) {
          const { move } = results[i];
          this.b.make(move);
          let score;
          if (i < this.topN) {
            // Full window for top candidates so their scores are exact
            score = -this.negamax(depth - 1, -INF, INF, 1);
          } else {
            score = -this.negamax(depth - 1, -beta, -alpha, 1);
          }
          this.b.unmake();
          iter.push({ move, score });
          if (score > alpha) alpha = score;
        }

        results = iter;
        this.completedDepth = depth;

        let best = -INF;
        for (let i = 0; i < iter.length; i++) if (iter[i].score > best) best = iter[i].score;
        if (Math.abs(best) >= MATE_THRESHOLD) break;
      } catch (e) {
        // Unwind any moves still on the stack from the interrupted search path
        while (this.b.historyLength() > baseHistory) this.b.unmake();
        if (e !== STOP) throw e;
        break;
      }
    }

    results.sort((a, b) => b.score - a.score);
    const top = results[0];
    return {
      bestMove: this.b.toPublic(top.move),
      score: top.score,
      depth: this.completedDepth,
      candidates: results.slice(0, this.topN).map((r) => ({ move: this.b.toPublic(r.move), score: r.score })),
      nodes: this.nodes,
    };
  }
}

/** Search a FEN. Scores are from side-to-move perspective (centipawns). */
export function searchPosition(fen, options = {}) {
  const game = new Chess(fen);
  const searcher = new Searcher(game, options);
  return searcher.run();
}

// ---------- Game analysis ----------

const CP_CLAMP = 1500;

export function clampCp(score) {
  if (score >= MATE_THRESHOLD) return CP_CLAMP;
  if (score <= -MATE_THRESHOLD) return -CP_CLAMP;
  return Math.max(-CP_CLAMP, Math.min(CP_CLAMP, score));
}

export function winPercent(cp) {
  const c = clampCp(cp);
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * c)) - 1);
}

export function classifyLoss(cpLoss) {
  if (cpLoss <= 0) return 'best';
  if (cpLoss < 30) return 'good';
  if (cpLoss < 80) return 'inaccuracy';
  if (cpLoss < 200) return 'mistake';
  return 'blunder';
}

export function formatScore(scoreWhite) {
  if (scoreWhite >= MATE_THRESHOLD) return `M${Math.max(1, Math.ceil((MATE - scoreWhite) / 2))}`;
  if (scoreWhite <= -MATE_THRESHOLD) return `-M${Math.max(1, Math.ceil((MATE + scoreWhite) / 2))}`;
  const p = scoreWhite / 100;
  return (p > 0 ? '+' : '') + p.toFixed(1);
}

/**
 * Analyze a full game given SAN moves.
 * @returns {{ moves: Array, evals: number[], summary: object }}
 */
export function analyzeGame(sanMoves, { maxDepth = 4, timeMs = 450, onProgress } = {}) {
  const game = new Chess();
  const positions = [{ fen: game.fen(), turn: game.turn() }];
  const played = [];

  for (const san of sanMoves) {
    const mv = game.move(san);
    if (!mv) break;
    played.push({ from: mv.from, to: mv.to, san: mv.san, captured: mv.captured, promotion: mv.promotion });
    positions.push({ fen: game.fen(), turn: game.turn() });
  }

  const total = positions.length;
  // Keep total analysis time bounded (~25s) for long games
  const perPositionMs = Math.max(150, Math.min(timeMs, Math.floor(25000 / total)));
  const searches = [];
  for (let i = 0; i < total; i++) {
    searches.push(searchPosition(positions[i].fen, { maxDepth, timeMs: perPositionMs, topN: 1 }));
    if (onProgress) onProgress(i + 1, total);
  }

  const moves = [];
  const startEvalWhite = positions[0].turn === 'w' ? searches[0].score : -searches[0].score;
  const evals = [clampCp(startEvalWhite)];
  const rawEvals = [startEvalWhite];
  const acc = { w: [], b: [] };
  const counts = {
    w: { best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
    b: { best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
  };

  for (let i = 0; i < played.length; i++) {
    const mover = positions[i].turn;
    const before = searches[i]; // from mover's perspective
    const after = searches[i + 1]; // from opponent's perspective
    const bestScore = before.score;
    const actualScore = -after.score;
    const isBest = before.bestMove && before.bestMove.san === played[i].san;
    const cpLoss = isBest ? 0 : Math.max(0, clampCp(bestScore) - clampCp(actualScore));
    const label = isBest ? 'best' : classifyLoss(cpLoss);

    const winBefore = winPercent(bestScore);
    const winAfter = winPercent(actualScore);
    const moveAcc = Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * (winBefore - winAfter)) - 3.1669));
    acc[mover].push(moveAcc);
    counts[mover][label]++;

    const evalWhite = mover === 'w' ? actualScore : -actualScore;
    evals.push(clampCp(evalWhite));
    rawEvals.push(evalWhite);

    moves.push({
      ply: i + 1,
      moveNumber: Math.floor(i / 2) + 1,
      color: mover,
      san: played[i].san,
      from: played[i].from,
      to: played[i].to,
      captured: played[i].captured,
      fenBefore: positions[i].fen,
      fenAfter: positions[i + 1].fen,
      evalBefore: clampCp(mover === 'w' ? bestScore : -bestScore),
      evalAfter: clampCp(evalWhite),
      rawEvalBefore: mover === 'w' ? bestScore : -bestScore,
      rawEvalAfter: evalWhite,
      cpLoss,
      label,
      bestMove: before.bestMove ? before.bestMove.san : null,
      bestFrom: before.bestMove ? before.bestMove.from : null,
      bestTo: before.bestMove ? before.bestMove.to : null,
      depth: before.depth,
    });
  }

  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 100);

  return {
    moves,
    evals,
    rawEvals,
    summary: {
      w: { accuracy: Math.round(avg(acc.w)), counts: counts.w, moves: acc.w.length },
      b: { accuracy: Math.round(avg(acc.b)), counts: counts.b, moves: acc.b.length },
    },
    startFen: positions[0].fen,
  };
}
