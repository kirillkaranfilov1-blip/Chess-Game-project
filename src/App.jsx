import React, { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import CapturedPieces from './components/CapturedPieces';
import PromotionModal from './components/PromotionModal';
import GameOverModal from './components/GameOverModal';
import { BOARD_THEMES } from './data/themes';
import { PUZZLES } from './data/puzzles';
import { sound } from './utils/sound';
import { getBestMove, evaluateBoard } from './utils/ai';

// Helper to calculate captured pieces & material difference
function getCapturedAndAdvantage(chess) {
  const initial = {
    w: { p: 8, n: 2, b: 2, r: 2, q: 1 },
    b: { p: 8, n: 2, b: 2, r: 2, q: 1 },
  };
  const current = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0 },
  };

  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.type !== 'k') {
        current[piece.color][piece.type] = (current[piece.color][piece.type] || 0) + 1;
      }
    }
  }

  const captured = { w: [], b: [] };
  const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9 };
  let advantage = 0;

  ['p', 'n', 'b', 'r', 'q'].forEach((type) => {
    // White pieces missing (captured by Black)
    const wDiff = initial.w[type] - current.w[type];
    for (let i = 0; i < wDiff; i++) captured.w.push(type);

    // Black pieces missing (captured by White)
    const bDiff = initial.b[type] - current.b[type];
    for (let i = 0; i < bDiff; i++) captured.b.push(type);

    advantage += current.w[type] * pieceValues[type];
    advantage -= current.b[type] * pieceValues[type];
  });

  return { captured, advantage };
}

export default function App() {
  // Core game state
  const [game, setGame] = useState(() => new Chess());
  const [fen, setFen] = useState(() => game.fen());
  const [moveHistory, setMoveHistory] = useState([]);
  const [mode, setMode] = useState('bot'); // 'bot' | 'puzzles' | 'pvp'
  const [botDifficulty, setBotDifficulty] = useState('medium'); // 'easy' | 'medium' | 'hard'
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('classic');
  const [boardOrientation, setBoardOrientation] = useState('white');
  const [showLegalMoves, setShowLegalMoves] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Selected square for click-to-move
  const [selectedSquare, setSelectedSquare] = useState(null);

  // Pawn promotion modal
  const [pendingPromotion, setPendingPromotion] = useState(null);

  // Game over state
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState(false);
  const [gameOverDetails, setGameOverDetails] = useState({ title: '', subtitle: '', isWin: false });

  // Puzzles state
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [puzzleMoveStep, setPuzzleMoveStep] = useState(0);
  const [puzzleStatus, setPuzzleStatus] = useState('idle'); // 'idle' | 'correct' | 'wrong'
  const [hintVisible, setHintVisible] = useState(false);
  const [solvedPuzzles, setSolvedPuzzles] = useState(new Set());

  // Sound sync
  useEffect(() => {
    sound.toggleSound(soundEnabled);
  }, [soundEnabled]);

  // Handle Game Over detection
  const checkGameOver = useCallback((currentGame) => {
    if (currentGame.isGameOver()) {
      let title = 'Партия окончена';
      let subtitle = '';
      let isWin = false;

      if (currentGame.isCheckmate()) {
        const winner = currentGame.turn() === 'w' ? 'Черные' : 'Белые';
        title = `Мат! Победили ${winner}!`;
        subtitle = `Король ${currentGame.turn() === 'w' ? 'белых' : 'черных'} получил мат.`;
        isWin = currentGame.turn() === 'b'; // White win
        sound.playWin();
      } else if (currentGame.isDraw()) {
        title = 'Ничья';
        if (currentGame.isStalemate()) subtitle = 'Пат: королю некуда ходить.';
        else if (currentGame.isThreefoldRepetition()) subtitle = 'Троекратное повторение позиции.';
        else if (currentGame.isInsufficientMaterial()) subtitle = 'Недостаточно фигур для мата.';
        else subtitle = 'Ничья по правилу 50 ходов.';
      }

      setGameOverDetails({ title, subtitle, isWin });
      setIsGameOverModalOpen(true);
      return true;
    }
    return false;
  }, []);

  // Bot Turn Trigger
  useEffect(() => {
    if (mode !== 'bot') return;
    if (game.turn() === 'b' && !game.isGameOver()) {
      const timer = setTimeout(() => {
        setIsBotThinking(true);
        setTimeout(() => {
          try {
            const botMove = getBestMove(game, botDifficulty);
            if (botMove) {
              const moveResult = game.move(botMove);
              if (moveResult) {
                setFen(game.fen());
                setMoveHistory([...game.history({ verbose: true })]);

                if (moveResult.captured) sound.playCapture();
                else if (moveResult.san.includes('O-O')) sound.playCastle();
                else sound.playMove();

                if (game.isCheck()) sound.playCheck();
                checkGameOver(game);
              }
            }
          } catch (e) {
            console.error('Bot move error', e);
          } finally {
            setIsBotThinking(false);
          }
        }, 350);
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [fen, mode, botDifficulty, game, checkGameOver]);

  // Load Puzzle
  const loadPuzzle = useCallback((index) => {
    const puzzle = PUZZLES[index];
    if (!puzzle) return;
    const newG = new Chess(puzzle.fen);
    setGame(newG);
    setFen(newG.fen());
    setMoveHistory([]);
    setCurrentPuzzleIndex(index);
    setPuzzleMoveStep(0);
    setPuzzleStatus('idle');
    setHintVisible(false);
    setSelectedSquare(null);
    setBoardOrientation(puzzle.turn === 'w' ? 'white' : 'black');
  }, []);

  // Switch Mode
  const handleModeChange = (newMode) => {
    setMode(newMode);
    setIsGameOverModalOpen(false);
    setSelectedSquare(null);
    if (newMode === 'puzzles') {
      loadPuzzle(currentPuzzleIndex);
    } else {
      const newG = new Chess();
      setGame(newG);
      setFen(newG.fen());
      setMoveHistory([]);
      setBoardOrientation('white');
    }
  };

  // Reset Game
  const handleResetGame = () => {
    setIsGameOverModalOpen(false);
    setSelectedSquare(null);
    if (mode === 'puzzles') {
      loadPuzzle(currentPuzzleIndex);
    } else {
      const newG = new Chess();
      setGame(newG);
      setFen(newG.fen());
      setMoveHistory([]);
    }
  };

  // Undo Move
  const handleUndoMove = () => {
    if (mode === 'puzzles') return; // disabled in puzzle mode
    if (isBotThinking) return;

    if (mode === 'bot') {
      // Undo both bot and player move
      game.undo();
      game.undo();
    } else {
      game.undo();
    }
    setFen(game.fen());
    setMoveHistory([...game.history({ verbose: true })]);
    setSelectedSquare(null);
    sound.playMove();
  };

  // Core move executor
  const makeAMove = useCallback(
    (moveObj) => {
      try {
        const move = game.move(moveObj);
        if (!move) return false;

        // Play move sound
        if (move.captured) sound.playCapture();
        else if (move.san.includes('O-O')) sound.playCastle();
        else sound.playMove();

        if (game.isCheck()) sound.playCheck();

        setFen(game.fen());
        setMoveHistory([...game.history({ verbose: true })]);
        setSelectedSquare(null);

        // In puzzle mode, validate puzzle move sequence
        if (mode === 'puzzles') {
          const puzzle = PUZZLES[currentPuzzleIndex];
          const expectedMove = puzzle.moves[puzzleMoveStep];

          if (expectedMove && move.from === expectedMove.from && move.to === expectedMove.to) {
            // Correct move!
            const nextStep = puzzleMoveStep + 1;
            const replyStep = puzzle.moves[nextStep];

            if (replyStep && replyStep.reply) {
              // Bot replies
              setPuzzleStatus('idle');
              setTimeout(() => {
                const repMove = game.move(replyStep.reply);
                if (repMove) {
                  setFen(game.fen());
                  setMoveHistory([...game.history({ verbose: true })]);
                  if (repMove.captured) sound.playCapture();
                  else sound.playMove();
                }
                setPuzzleMoveStep(nextStep + 1);
              }, 450);
            } else if (nextStep >= puzzle.moves.length) {
              // Solved!
              setPuzzleStatus('correct');
              setSolvedPuzzles((prev) => new Set(prev).add(puzzle.id));
              sound.playWin();
              setGameOverDetails({
                title: '🎉 Задача решена!',
                subtitle: `Отличная тактика в задаче "${puzzle.title}". Переходите к следующей!`,
                isWin: true,
              });
              setIsGameOverModalOpen(true);
            } else {
              setPuzzleMoveStep(nextStep);
            }
          } else {
            // Incorrect move in puzzle mode!
            sound.playError();
            setPuzzleStatus('wrong');
            // Undo user move after brief pause
            setTimeout(() => {
              game.undo();
              setFen(game.fen());
              setMoveHistory([...game.history({ verbose: true })]);
            }, 600);
            return false;
          }
        } else {
          checkGameOver(game);
        }

        return true;
      } catch {
        return false;
      }
    },
    [game, mode, currentPuzzleIndex, puzzleMoveStep, checkGameOver]
  );

  // Piece Drop Handler (react-chessboard v5)
  const onPieceDrop = ({ sourceSquare, targetSquare, piece }) => {
    if (isBotThinking) return false;
    if (mode === 'bot' && game.turn() === 'b') return false;

    // Check pawn promotion
    const isPawn = (piece?.pieceType || '').toLowerCase().includes('p');
    const isPromotionRank = targetSquare.endsWith('8') || targetSquare.endsWith('1');
    if (isPawn && isPromotionRank) {
      setPendingPromotion({ from: sourceSquare, to: targetSquare });
      return false;
    }

    return makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    });
  };

  // Promotion choice
  const handlePromotionSelect = (pieceType) => {
    if (pendingPromotion) {
      makeAMove({
        from: pendingPromotion.from,
        to: pendingPromotion.to,
        promotion: pieceType,
      });
      setPendingPromotion(null);
    }
  };

  // Click-to-move and legal move dots
  const onSquareClick = ({ square }) => {
    if (isBotThinking) return;
    if (mode === 'bot' && game.turn() === 'b') return;

    if (!selectedSquare) {
      // First click: select piece if owned by turn player
      const pieceOnSquare = game.get(square);
      if (pieceOnSquare && pieceOnSquare.color === game.turn()) {
        setSelectedSquare(square);
      }
    } else {
      // Second click: try move
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }

      const isPawn = game.get(selectedSquare)?.type === 'p';
      const isPromotionRank = square.endsWith('8') || square.endsWith('1');
      if (isPawn && isPromotionRank) {
        const moves = game.moves({ square: selectedSquare, verbose: true });
        const canMoveTo = moves.some((m) => m.to === square);
        if (canMoveTo) {
          setPendingPromotion({ from: selectedSquare, to: square });
          setSelectedSquare(null);
          return;
        }
      }

      const moved = makeAMove({
        from: selectedSquare,
        to: square,
        promotion: 'q',
      });

      if (!moved) {
        // Maybe clicked another piece of same color?
        const pieceOnSquare = game.get(square);
        if (pieceOnSquare && pieceOnSquare.color === game.turn()) {
          setSelectedSquare(square);
        } else {
          setSelectedSquare(null);
        }
      } else {
        setSelectedSquare(null);
      }
    }
  };

  // Custom square styles (highlight selected piece, legal moves, check, last move)
  const getCustomSquareStyles = () => {
    const styles = {};

    // Highlight last move
    const lastMove = moveHistory[moveHistory.length - 1];
    if (lastMove) {
      styles[lastMove.from] = { backgroundColor: 'rgba(234, 179, 8, 0.25)' };
      styles[lastMove.to] = { backgroundColor: 'rgba(234, 179, 8, 0.35)' };
    }

    // Highlight check on King
    if (game.isCheck()) {
      const board = game.board();
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = board[r][c];
          if (piece && piece.type === 'k' && piece.color === game.turn()) {
            const sq = `${String.fromCharCode(97 + c)}${8 - r}`;
            styles[sq] = {
              backgroundColor: 'rgba(239, 68, 68, 0.65)',
              boxShadow: 'inset 0 0 15px rgba(239, 68, 68, 0.9)',
            };
          }
        }
      }
    }

    // Highlight selected square & legal moves
    if (selectedSquare) {
      styles[selectedSquare] = {
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        boxShadow: 'inset 0 0 10px rgba(99, 102, 241, 0.8)',
      };

      if (showLegalMoves) {
        const moves = game.moves({ square: selectedSquare, verbose: true });
        moves.forEach((m) => {
          const hasPiece = game.get(m.to);
          styles[m.to] = {
            background: hasPiece
              ? 'radial-gradient(circle, transparent 20%, rgba(99, 102, 241, 0.7) 21%, rgba(99, 102, 241, 0.7) 80%, transparent 81%)'
              : 'radial-gradient(circle, rgba(99, 102, 241, 0.7) 25%, transparent 26%)',
            cursor: 'pointer',
          };
        });
      }
    }

    return styles;
  };

  const themeObj = BOARD_THEMES[currentTheme] || BOARD_THEMES.classic;
  const { captured, advantage } = getCapturedAndAdvantage(game);
  const evalScore = evaluateBoard(game);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        mode={mode}
        onModeChange={handleModeChange}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
      />

      {/* Main Content Arena */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 lg:gap-8">
        {/* Chessboard Column */}
        <div className="flex flex-col items-center gap-3 w-full max-w-[560px]">
          {/* Top Player Card (Black or Opponent) */}
          <div className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl backdrop-blur-md shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-lg text-slate-300">
                {mode === 'bot' ? '🤖' : '♟'}
              </div>
              <div>
                <h3 className="text-xs font-bold text-white leading-tight">
                  {mode === 'bot' ? `Шахматный Бот (${botDifficulty})` : mode === 'puzzles' ? 'Защитник' : 'Игрок 2 (Черные)'}
                </h3>
                <span className="text-[10px] text-slate-400">
                  {mode === 'bot' ? 'Уровень: ' + botDifficulty : 'Рейтинг: 1500'}
                </span>
              </div>
            </div>

            {isBotThinking && (
              <span className="text-[11px] font-semibold text-indigo-400 flex items-center gap-1.5 animate-pulse">
                Думает...
              </span>
            )}
          </div>

          {/* Captured Pieces Bar (Top) */}
          <div className="w-full">
            <CapturedPieces captured={captured} advantage={advantage} />
          </div>

          {/* Chessboard Wrapper with rich glow frame */}
          <div className="relative w-full aspect-square rounded-2xl p-2 sm:p-3 bg-gradient-to-b from-slate-800/90 to-slate-900/90 border border-slate-700/60 shadow-2xl overflow-hidden group">
            <div className="w-full h-full rounded-xl overflow-hidden shadow-inner">
              <Chessboard
                options={{
                  position: fen,
                  onPieceDrop: onPieceDrop,
                  onSquareClick: onSquareClick,
                  boardOrientation: boardOrientation,
                  darkSquareStyle: { backgroundColor: themeObj.dark },
                  lightSquareStyle: { backgroundColor: themeObj.light },
                  squareStyles: getCustomSquareStyles(),
                  animationDurationInMs: 250,
                  showAnimations: true,
                }}
              />
            </div>
          </div>

          {/* Bottom Player Card (White or User) */}
          <div className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl backdrop-blur-md shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-lg text-indigo-300">
                👤
              </div>
              <div>
                <h3 className="text-xs font-bold text-white leading-tight">
                  Вы (Белые)
                </h3>
                <span className="text-[10px] text-slate-400">Рейтинг: 1600</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  game.turn() === 'w' && !isBotThinking ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
                }`}
              />
              <span className="text-xs font-semibold text-slate-300">
                {game.turn() === 'w' ? 'Ваш ход' : 'Ожидание'}
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Controls Column */}
        <Sidebar
          mode={mode}
          turn={game.turn()}
          isCheck={game.isCheck()}
          isGameOver={game.isGameOver()}
          gameOverReason={
            game.isCheckmate()
              ? 'Мат!'
              : game.isStalemate()
              ? 'Пат'
              : game.isDraw()
              ? 'Ничья'
              : ''
          }
          botDifficulty={botDifficulty}
          onDifficultyChange={setBotDifficulty}
          isBotThinking={isBotThinking}
          currentTheme={currentTheme}
          onThemeChange={setCurrentTheme}
          moveHistory={moveHistory}
          onResetGame={handleResetGame}
          onUndoMove={handleUndoMove}
          onFlipBoard={() =>
            setBoardOrientation((prev) => (prev === 'white' ? 'black' : 'white'))
          }
          showLegalMoves={showLegalMoves}
          onToggleLegalMoves={() => setShowLegalMoves((prev) => !prev)}
          // Puzzles props
          puzzles={PUZZLES}
          currentPuzzleIndex={currentPuzzleIndex}
          onSelectPuzzle={loadPuzzle}
          onNextPuzzle={() =>
            currentPuzzleIndex < PUZZLES.length - 1 && loadPuzzle(currentPuzzleIndex + 1)
          }
          onPrevPuzzle={() =>
            currentPuzzleIndex > 0 && loadPuzzle(currentPuzzleIndex - 1)
          }
          puzzleStatus={puzzleStatus}
          onShowHint={() => setHintVisible((prev) => !prev)}
          hintVisible={hintVisible}
          solvedPuzzles={solvedPuzzles}
          evalScore={evalScore}
        />
      </main>

      {/* Promotion Modal */}
      <PromotionModal
        isOpen={!!pendingPromotion}
        color={game.turn()}
        onSelect={handlePromotionSelect}
      />

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={isGameOverModalOpen}
        title={gameOverDetails.title}
        subtitle={gameOverDetails.subtitle}
        isWin={gameOverDetails.isWin}
        onRestart={handleResetGame}
        onNext={
          mode === 'puzzles' && currentPuzzleIndex < PUZZLES.length - 1
            ? () => {
                setIsGameOverModalOpen(false);
                loadPuzzle(currentPuzzleIndex + 1);
              }
            : null
        }
        nextLabel="Следующая задача"
      />
    </div>
  );
}
