import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, ArrowRight, Award, BarChart3 } from 'lucide-react';

export default function GameOverModal({ isOpen, title, subtitle, isWin, onRestart, onNext, nextLabel, onAnalyze }) {
  useEffect(() => {
    if (isOpen && isWin) {
      try {
        const colors = ['#6366f1', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 }, colors, scalar: 1.1 });
        const t1 = setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors }), 220);
        const t2 = setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors }), 380);
        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
        };
      } catch {}
    }
  }, [isOpen, isWin]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md animate-fade-in px-4">
      <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden animate-modal-in">
        {/* Ambient Glow */}
        <div
          className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
            isWin ? 'bg-emerald-500/20' : 'bg-indigo-500/20'
          }`}
        />
        <div
          className={`absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
            isWin ? 'bg-amber-500/20' : 'bg-rose-500/20'
          }`}
        />

        {/* Icon */}
        <div className="relative mb-4 flex justify-center">
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center border shadow-lg ${
              isWin
                ? 'bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border-amber-500/40 text-amber-400'
                : 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/40 text-indigo-400'
            }`}
          >
            {isWin ? <Trophy className="w-10 h-10 animate-bounce" /> : <Award className="w-10 h-10" />}
          </div>
        </div>

        {/* Content */}
        <h2 className="text-2xl font-black text-white tracking-tight mb-2">
          {title}
        </h2>
        <p className="text-slate-300 text-sm mb-6 leading-relaxed">
          {subtitle}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {onNext && (
            <button
              onClick={onNext}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold shadow-lg shadow-indigo-600/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>{nextLabel || 'Следующая задача'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onRestart}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold border transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
              onNext
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                : 'flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-600/30 border-transparent'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Сыграть снова</span>
          </button>
        </div>

        {onAnalyze && (
          <button
            onClick={onAnalyze}
            className="mt-3 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-700/70 to-indigo-700/70 hover:from-cyan-600/80 hover:to-indigo-600/80 border border-cyan-500/30 text-white font-semibold shadow-lg shadow-cyan-900/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Разбор партии с ИИ</span>
          </button>
        )}
      </div>
    </div>
  );
}
