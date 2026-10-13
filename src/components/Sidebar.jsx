import React, { useState } from 'react';
import {
  RotateCcw,
  Undo2,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  History,
  Bot,
  BrainCircuit,
  Palette,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Check,
} from 'lucide-react';
import { BOARD_THEMES } from '../data/themes';

export default function Sidebar({
  mode,
  turn,
  isCheck,
  isGameOver,
  gameOverReason,
  botDifficulty,
  onDifficultyChange,
  isBotThinking,
  currentTheme,
  onThemeChange,
  moveHistory,
  onResetGame,
  onUndoMove,
  onFlipBoard,
  showLegalMoves,
  onToggleLegalMoves,
  // Puzzle props
  puzzles,
  currentPuzzleIndex,
  onSelectPuzzle,
  onNextPuzzle,
  onPrevPuzzle,
  puzzleStatus,
  onShowHint,
  hintVisible,
  solvedPuzzles,
  evalScore,
}) {
  const [activeTab, setActiveTab] = useState('game'); // 'game' | 'history' | 'themes'

  const currentPuzzle = puzzles?.[currentPuzzleIndex];

  return (
    <aside className="w-full lg:w-96 flex flex-col gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl shadow-xl">
      {/* Top Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs font-semibold">
        <button
          onClick={() => setActiveTab('game')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'game'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <BrainCircuit className="w-3.5 h-3.5" />
          <span>{mode === 'puzzles' ? 'Задача' : 'Партия'}</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Ходы ({moveHistory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('themes')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'themes'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Темы</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 flex flex-col gap-4 min-h-[360px]">
        {activeTab === 'game' && (
          <div className="flex flex-col gap-4">
            {/* Status Card */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Статус
                </span>

                {isCheck && !isGameOver && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-full animate-pulse">
                    <AlertTriangle className="w-3 h-3" /> ШАХ!
                  </span>
                )}

                {isGameOver && (
                  <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    {gameOverReason}
                  </span>
                )}
              </div>

              {/* Turn Banner */}
              <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                      turn === 'w'
                        ? 'bg-slate-100 border-slate-300 text-slate-900 shadow-sm'
                        : 'bg-slate-900 border-slate-600 text-white'
                    }`}
                  >
                    {turn === 'w' ? 'Бел' : 'Чер'}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {isGameOver
                        ? 'Игра завершена'
                        : isBotThinking
                        ? 'Бот думает...'
                        : turn === 'w'
                        ? 'Ход белых'
                        : 'Ход черных'}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {isBotThinking
                        ? 'Вычисляет лучший ход...'
                        : isGameOver
                        ? gameOverReason
                        : 'Сделайте ход на доске'}
                    </p>
                  </div>
                </div>

                {isBotThinking && (
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              {/* Live Evaluation Bar (Bot/PVP) */}
              {mode !== 'puzzles' && (
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Оценка позиции</span>
                    <span className="font-mono font-bold text-indigo-400">
                      {evalScore > 0 ? `+${(evalScore / 100).toFixed(1)}` : (evalScore / 100).toFixed(1)}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      className="bg-indigo-500 transition-all duration-300"
                      style={{
                        width: `${Math.min(Math.max(50 + (evalScore / 20), 5), 95)}%`
                      }}
                    />
                    <div
                      className="bg-slate-700 transition-all duration-300"
                      style={{
                        width: `${100 - Math.min(Math.max(50 + (evalScore / 20), 5), 95)}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Mode Specific: Bot difficulty */}
            {mode === 'bot' && (
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    Уровень бота
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {botDifficulty === 'easy' && 'Случайные ходы + зевки'}
                    {botDifficulty === 'medium' && 'Позиционная оценка'}
                    {botDifficulty === 'hard' && 'Minimax + Alpha-Beta'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'easy', label: 'Новичок' },
                    { id: 'medium', label: 'Любитель' },
                    { id: 'hard', label: 'Мастер' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() => onDifficultyChange(lvl.id)}
                      className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        botDifficulty === lvl.id
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mode Specific: Puzzles Panel */}
            {mode === 'puzzles' && currentPuzzle && (
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      {currentPuzzle.category}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-800 text-slate-300">
                      {currentPuzzle.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span>Решено: {solvedPuzzles.size}/{puzzles.length}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white mb-1">
                    {currentPuzzle.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {currentPuzzle.description}
                  </p>
                </div>

                {/* Puzzle feedback state */}
                {puzzleStatus === 'correct' && (
                  <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>Отлично! Верный ход. Задача решена!</span>
                  </div>
                )}

                {puzzleStatus === 'wrong' && (
                  <div className="flex items-center gap-2 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs font-semibold">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Неверный ход. Попробуйте еще раз!</span>
                  </div>
                )}

                {/* Hint */}
                {hintVisible && (
                  <div className="flex items-start gap-2 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs leading-relaxed">
                    <Lightbulb className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
                    <span>{currentPuzzle.hint}</span>
                  </div>
                )}

                {/* Quick Puzzle Switcher Chips */}
                <div className="flex items-center gap-1 overflow-x-auto py-1">
                  {puzzles.map((p, idx) => (
                    <button
                      key={p.id}
                      onClick={() => onSelectPuzzle(idx)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                        idx === currentPuzzleIndex
                          ? 'bg-indigo-600 text-white'
                          : solvedPuzzles.has(p.id)
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {solvedPuzzles.has(p.id) && <Check className="w-3 h-3" />}
                      <span>#{idx + 1}</span>
                    </button>
                  ))}
                </div>

                {/* Puzzle Navigation & Hint buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={onPrevPuzzle}
                    disabled={currentPuzzleIndex === 0}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Предыдущая задача"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={onShowHint}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-amber-400 transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Подсказка</span>
                  </button>

                  <button
                    onClick={onNextPuzzle}
                    disabled={currentPuzzleIndex === puzzles.length - 1}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Следующая задача"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex-1 flex flex-col">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              История ходов
            </h4>
            <div className="flex-1 overflow-y-auto max-h-[300px] pr-1 divide-y divide-slate-800/60">
              {moveHistory.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-xs text-slate-500">
                  Ходов пока нет. Сделайте первый ход!
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs font-mono py-1">
                  {moveHistory.map((m, idx) => {
                    if (idx % 2 === 0) {
                      const roundNum = Math.floor(idx / 2) + 1;
                      const nextMove = moveHistory[idx + 1];
                      return (
                        <React.Fragment key={idx}>
                          <div className="flex items-center gap-2 p-1 rounded hover:bg-slate-800/60 text-slate-200">
                            <span className="text-slate-500 w-5">{roundNum}.</span>
                            <span className="font-semibold text-white">{m.san || m}</span>
                          </div>
                          {nextMove ? (
                            <div className="flex items-center p-1 rounded hover:bg-slate-800/60 text-slate-300">
                              <span className="font-semibold">{nextMove.san || nextMove}</span>
                            </div>
                          ) : (
                            <div />
                          )}
                        </React.Fragment>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Themes Tab */}
        {activeTab === 'themes' && (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Темы оформления доски
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              {Object.values(BOARD_THEMES).map((th) => (
                <button
                  key={th.id}
                  onClick={() => onThemeChange(th.id)}
                  className={`flex flex-col items-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    currentTheme === th.id
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-md shadow-indigo-500/20'
                      : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="w-full h-8 rounded-lg flex overflow-hidden border border-slate-700/60">
                    <div className="w-1/2 h-full" style={{ backgroundColor: th.light }} />
                    <div className="w-1/2 h-full" style={{ backgroundColor: th.dark }} />
                  </div>
                  <span className="text-xs font-medium text-slate-200">{th.name}</span>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                <span>Подсветка возможных ходов</span>
                <input
                  type="checkbox"
                  checked={showLegalMoves}
                  onChange={onToggleLegalMoves}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Bottom */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
        <button
          onClick={onResetGame}
          className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer group"
          title="Сбросить доску"
        >
          <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500 text-indigo-400" />
          <span className="text-[11px] font-semibold">Сброс</span>
        </button>

        <button
          onClick={onUndoMove}
          disabled={moveHistory.length === 0}
          className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          title="Отменить ход"
        >
          <Undo2 className="w-4 h-4 text-amber-400" />
          <span className="text-[11px] font-semibold">Отмена</span>
        </button>

        <button
          onClick={onFlipBoard}
          className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
          title="Перевернуть доску"
        >
          <span className="text-base leading-none text-cyan-400">⇅</span>
          <span className="text-[11px] font-semibold">Разворот</span>
        </button>
      </div>
    </aside>
  );
}
