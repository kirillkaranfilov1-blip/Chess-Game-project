import React from 'react';
import { Bot, Puzzle, Users, Volume2, VolumeX } from 'lucide-react';

export default function Header({
  mode,
  onModeChange,
  soundEnabled,
  onToggleSound,
}) {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center text-indigo-400 font-black text-xl">
              ♞
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-white tracking-tight">Chess</span>
              <span className="text-xs px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30">AI</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">React • Vite • Tailwind</p>
          </div>
        </div>

        {/* Mode Selector */}
        <nav className="flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-xl shadow-inner">
          <button
            onClick={() => onModeChange('bot')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === 'bot'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Игра с ботом</span>
            <span className="sm:hidden">Бот</span>
          </button>

          <button
            onClick={() => onModeChange('puzzles')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === 'puzzles'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Puzzle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Задачи</span>
            <span className="sm:hidden">Задачи</span>
          </button>

          <button
            onClick={() => onModeChange('pvp')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === 'pvp'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Вдвоём</span>
            <span className="sm:hidden">2P</span>
          </button>
        </nav>

        {/* Sound Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Выключить звук' : 'Включить звук'}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-indigo-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
