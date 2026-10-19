// Chess AI Engine using Minimax with Alpha-Beta Pruning & Positional Heuristics

const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Positional tables (from White's perspective)
const PAWN_TABLE = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5, 5, 10, 25, 25, 10, 5, 5],
  [0, 0, 0, 20, 20, 0, 0, 0],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [5, 10, 10, -20, -20, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const KNIGHT_TABLE = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50],
];

const BISHOP_TABLE = [
  [-20, -10, -10, -10, -10, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 10, 10, 5, 0, -10],
  [-10, 5, 5, 10, 10, 5, 5, -10],
  [-10, 0, 10, 10, 10, 10, 0, -10],
  [-10, 10, 10, 10, 10, 10, 10, -10],
  [-10, 5, 0, 0, 0, 0, 5, -10],
  [-20, -10, -10, -10, -10, -10, -10, -20],
];

const ROOK_TABLE = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [5, 10, 10, 10, 10, 10, 10, 5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [0, 0, 0, 5, 5, 0, 0, 0],
];

const QUEEN_TABLE = [
  [-20, -10, -10, -5, -5, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 5, 5, 5, 0, -10],
  [-5, 0, 5, 5, 5, 5, 0, -5],
  [0, 0, 5, 5, 5, 5, 0, -5],
  [-10, 5, 5, 5, 5, 5, 0, -10],
  [-10, 0, 5, 0, 0, 0, 0, -10],
  [-20, -10, -10, -5, -5, -10, -10, -20],
];

const KING_TABLE = [
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [20, 20, 0, 0, 0, 0, 20, 20],
  [20, 30, 10, 0, 0, 10, 30, 20],
];

export { PIECE_VALUES, PAWN_TABLE, KNIGHT_TABLE, BISHOP_TABLE, ROOK_TABLE, QUEEN_TABLE, KING_TABLE };

function getPieceTableScore(piece, row, col, color) {
  const r = color === 'w' ? row : 7 - row;
  const c = col;

  switch (piece) {
    case 'p': return PAWN_TABLE[r][c];
    case 'n': return KNIGHT_TABLE[r][c];
    case 'b': return BISHOP_TABLE[r][c];
    case 'r': return ROOK_TABLE[r][c];
    case 'q': return QUEEN_TABLE[r][c];
    case 'k': return KING_TABLE[r][c];
    default: return 0;
  }
}

// Evaluate board from White's perspective (+ positive for White, - negative for Black)
export function evaluateBoard(game) {
  if (game.isCheckmate()) {
    return game.turn() === 'w' ? -100000 : 100000;
  }
  if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) {
    return 0;
  }

  let totalScore = 0;
  const board = game.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const square = board[r][c];
      if (square) {
        const material = PIECE_VALUES[square.type] || 0;
        const position = getPieceTableScore(square.type, r, c, square.color);
        const val = material + position;
        if (square.color === 'w') {
          totalScore += val;
        } else {
          totalScore -= val;
        }
      }
    }
  }

  return totalScore;
}

// Order moves to optimize alpha-beta pruning (captures & checks evaluated first)
function orderMoves(moves) {
  return [...moves].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    if (a.captured) scoreA += 10 * (PIECE_VALUES[a.captured] || 100) - (PIECE_VALUES[a.piece] || 100);
    if (b.captured) scoreB += 10 * (PIECE_VALUES[b.captured] || 100) - (PIECE_VALUES[b.piece] || 100);
    if (a.promotion) scoreA += 800;
    if (b.promotion) scoreB += 800;
    return scoreB - scoreA;
  });
}

function minimax(game, depth, alpha, beta, isMaximizing) {
  if (depth === 0 || game.isGameOver()) {
    return evaluateBoard(game);
  }

  const moves = orderMoves(game.moves({ verbose: true }));

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const evalScore = minimax(game, depth - 1, alpha, beta, false);
      game.undo();
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break; // Beta cut-off
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const evalScore = minimax(game, depth - 1, alpha, beta, true);
      game.undo();
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break; // Alpha cut-off
    }
    return minEval;
  }
}

export function getBestMove(game, difficulty = 'medium') {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;

  const currentTurn = game.turn();
  const isMaximizing = currentTurn === 'w';

  // Easy / Novice: 70% random, 30% take hanging piece
  if (difficulty === 'easy') {
    const captures = moves.filter((m) => m.captured);
    if (captures.length > 0 && Math.random() < 0.4) {
      return captures[Math.floor(Math.random() * captures.length)];
    }
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // Medium: Depth 2
  if (difficulty === 'medium') {
    const sortedMoves = orderMoves(moves);
    let bestMove = sortedMoves[0];
    let bestValue = isMaximizing ? -Infinity : Infinity;

    for (const move of sortedMoves) {
      game.move(move);
      const moveValue = minimax(game, 1, -Infinity, Infinity, !isMaximizing);
      game.undo();

      if (isMaximizing && moveValue > bestValue) {
        bestValue = moveValue;
        bestMove = move;
      } else if (!isMaximizing && moveValue < bestValue) {
        bestValue = moveValue;
        bestMove = move;
      }
    }
    return bestMove;
  }

  // Hard / Master: Depth 3 Minimax with Alpha-Beta
  const sortedMoves = orderMoves(moves);
  let bestMove = sortedMoves[0];
  let bestValue = isMaximizing ? -Infinity : Infinity;
  let alpha = -Infinity;
  let beta = Infinity;

  for (const move of sortedMoves) {
    game.move(move);
    const moveValue = minimax(game, 2, alpha, beta, !isMaximizing);
    game.undo();

    if (isMaximizing) {
      if (moveValue > bestValue) {
        bestValue = moveValue;
        bestMove = move;
      }
      alpha = Math.max(alpha, bestValue);
    } else {
      if (moveValue < bestValue) {
        bestValue = moveValue;
        bestMove = move;
      }
      beta = Math.min(beta, bestValue);
    }
  }

  return bestMove;
}
