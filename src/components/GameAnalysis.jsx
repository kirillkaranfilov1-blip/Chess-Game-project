import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  Loader2,
  Target,
  AlertTriangle,
} from 'lucide-react';
import { engineAnalyze, resetEngine } from '../utils/engineClient';
import { summarizeGameWithDeepSeek } from '../utils/deepseek';
import { formatScore } from '../utils/engine';

const LABELS = {
  best: { text: 'Лучший', mark: '★', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400', arrow: 'rgba(16,185,129,0.85)' },
  good: { text: 'Хороший', mark: '', badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30', dot: 'bg-sky-400', arrow: 'rgba(56,189,248,0.85)' },
  inaccuracy: { text: 'Неточность', mark: '?!', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30', dot: 'bg-amber-400', arrow: 'rgba(245,158,11,0.9)' },
  mistake: { text: 'Ошибка', mark: '?', badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30', dot: 'bg-orange-400', arrow: 'rgba(249,115,22,0.9)' },
  blunder: { text: 'Зевок', mark: '??', badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30', dot: 'bg-rose-400', arrow: 'rgba(244,63,94,0.9)' },
};

function EvalChart({ evals, selected, onSelect }) {
  const W = 600;
  const H = 120;
  const PAD = 4;
  const n = evals.length;
  if (n < 2) return null;

  const x = (i) => PAD + (i / (n - 1)) * (W - PAD * 2);
  const y = (cp) => {
    // Map ±800cp to the chart height with a soft curve
    const v = Math.max(-1, Math.min(1, Math.tanh(cp / 500)));
    return H / 2 - v * (H / 2 - PAD);
  };

  const points = evals.map((e, i) => `${x(i)},${y(e)}`).join(' ');
  const areaWhite = `${x(0)},${H / 2} ${points} ${x(n - 1)},${H / 2}`;

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28 rounded-lg bg-slate-900/70 border border-slate-800/80" preserveAspectRatio="none">
        <defs>
          <linearGradient id="evalFillW" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(241,245,249,0.75)" />
            <stop offset="100%" stopColor="rgba(241,245,249,0.05)" />
          </linearGradient>
          <clipPath id="clipTop"><rect x="0" y="0" width={W} height={H / 2} /></clipPath>
          <clipPath id="clipBottom"><rect x="0" y={H / 2} width={W} height={H / 2} /></clipPath>
        </defs>
        <rect x="0" y="0" width={W} height={H / 2} fill="rgba(30,41,59,0.6)" />
        <rect x="0" y={H / 2} width={W} height={H / 2} fill="rgba(2,6,23,0.6)" />
        <polygon points={areaWhite} fill="url(#evalFillW)" clipPath="url(#clipTop)" />
        <polygon points={areaWhite} fill="rgba(99,102,241,0.35)" clipPath="url(#clipBottom)" />
        <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="rgba(148,163,184,0.5)" strokeDasharray="4 4" />
        <polyline points={points} fill="none" stroke="rgba(226,232,240,0.9)" strokeWidth="2" strokeLinejoin="round" />
        {selected != null && selected < n && (
          <>
            <line x1={x(selected)} y1="0" x2={x(selected)} y2={H} stroke="rgba(99,102,241,0.9)" strokeWidth="1.5" />
            <circle cx={x(selected)} cy={y(evals[selected])} r="4.5" fill="#6366f1" stroke="#fff" strokeWidth="1.5" />
          </>
        )}
        {evals.map((_, i) => (
          <rect
            key={i}
            x={x(i) - (W / (n - 1)) / 2}
            y="0"
            width={W / (n - 1)}
            height={H}
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onClick={() => onSelect(i)}
          />
        ))}
      </svg>
    </div>
  );
}

function AccuracyCard({ side, data, isPlayer }) {
  const acc = data?.accuracy ?? 0;
  const ring = acc >= 85 ? 'text-emerald-400' : acc >= 70 ? 'text-amber-400' : 'text-rose-400';
  const c = data?.counts || {};
  return (
    <div className={`rounded-xl border p-3 flex flex-col gap-2 ${isPlayer ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-slate-800 bg-slate-900/60'}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-white flex items-center gap-1.5">
          <span className={`w-3 h-3 rounded-full border ${side === 'w' ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-500'}`} />
          {side === 'w' ? 'Белые' : 'Чёрные'}
          {isPlayer && <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-600/40 text-indigo-200">вы</span>}
        </span>
        <span className={`text-lg font-black tabular-nums ${ring}`}>{acc}%</span>
      </div>
      <div className="grid grid-cols-5 gap-1 text-[10px] text-center">
        {['best', 'good', 'inaccuracy', 'mistake', 'blunder'].map((k) => (
          <div key={k} className={`rounded-md border px-1 py-1 ${LABELS[k].badge}`} title={LABELS[k].text}>
            <div className="font-bold tabular-nums">{c[k] ?? 0}</div>
            <div className="opacity-80 truncate">{LABELS[k].mark || '✓'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GameAnalysis({
  isOpen,
  onClose,
  sanMoves,
  resultText,
  playerColor = 'w',
  theme,
  pieces,
  boardOrientation = 'white',
}) {
  const [status, setStatus] = useState('idle'); // idle | running | done | error
  const [progress, setProgress] = useState({ done: 0, total: 1 });
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [selectedPly, setSelectedPly] = useState(0);
  const [narrative, setNarrative] = useState('');
  const [narrativeStatus, setNarrativeStatus] = useState('idle');
  const abortRef = useRef(null);
  const listRef = useRef(null);

  // Run analysis when opened
  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('running');
    setError('');
    setAnalysis(null);
    setNarrative('');
    setNarrativeStatus('idle');
    setProgress({ done: 0, total: sanMoves.length + 1 });
    setSelectedPly(0);

    engineAnalyze(
      sanMoves,
      { maxDepth: 4, timeMs: 450 },
      { signal: controller.signal, onProgress: (done, total) => setProgress({ done, total }) }
    )
      .then((result) => {
        if (controller.signal.aborted) return;
        setAnalysis(result);
        setStatus('done');
        setSelectedPly(result.moves.length);
        setNarrativeStatus('running');
        return summarizeGameWithDeepSeek(
          { sanMoves, analysis: result, resultText, playerColor },
          { signal: controller.signal }
        )
          .then((text) => {
            if (!controller.signal.aborted) {
              setNarrative(text);
              setNarrativeStatus('done');
            }
          })
          .catch((err) => {
            if (controller.signal.aborted) return;
            setNarrative(`Не удалось получить комментарий DeepSeek: ${err.message}`);
            setNarrativeStatus('error');
          });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err.message || 'Ошибка анализа');
        setStatus('error');
      });

    return () => {
      controller.abort();
      // The worker is synchronous; terminate it so a closed review doesn't keep the CPU busy
      resetEngine();
    };
  }, [isOpen, sanMoves, resultText, playerColor]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (!analysis) return;
      if (e.key === 'ArrowLeft') setSelectedPly((p) => Math.max(0, p - 1));
      if (e.key === 'ArrowRight') setSelectedPly((p) => Math.min(analysis.moves.length, p + 1));
      if (e.key === 'Home') setSelectedPly(0);
      if (e.key === 'End') setSelectedPly(analysis.moves.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, analysis, onClose]);

  // Keep selected move visible in list
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-ply="${selectedPly}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedPly]);

  const selectedMove = analysis && selectedPly > 0 ? analysis.moves[selectedPly - 1] : null;
  const fen = useMemo(() => {
    if (!analysis) return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    return selectedPly === 0 ? analysis.startFen : analysis.moves[selectedPly - 1].fenAfter;
  }, [analysis, selectedPly]);

  const arrows = useMemo(() => {
    if (!selectedMove) return [];
    const list = [{ startSquare: selectedMove.from, endSquare: selectedMove.to, color: LABELS[selectedMove.label].arrow }];
    if (selectedMove.label !== 'best' && selectedMove.bestFrom && selectedMove.bestTo) {
      list.push({ startSquare: selectedMove.bestFrom, endSquare: selectedMove.bestTo, color: 'rgba(16,185,129,0.9)' });
    }
    return list;
  }, [selectedMove]);

  const keyMoments = useMemo(() => {
    if (!analysis) return [];
    return [...analysis.moves]
      .filter((m) => m.label === 'blunder' || m.label === 'mistake' || m.label === 'inaccuracy')
      .sort((a, b) => b.cpLoss - a.cpLoss)
      .slice(0, 5);
  }, [analysis]);

  if (!isOpen) return null;

  const pct = Math.round((progress.done / Math.max(1, progress.total)) * 100);
  const evalNow = analysis ? (analysis.rawEvals?.[selectedPly] ?? analysis.evals[selectedPly]) : 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-3 sm:p-5">
      <div className="relative w-full max-w-6xl h-[92vh] bg-slate-950/95 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-modal-in flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Target className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white leading-tight">Разбор партии</h2>
              <p className="text-[11px] text-slate-400">{resultText}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer" title="Закрыть (Esc)">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress */}
        {status === 'running' && (
          <div className="px-5 py-2 border-b border-slate-800/80 bg-slate-900/40 flex items-center gap-3">
            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
            <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[11px] font-mono text-slate-400 tabular-nums">{progress.done}/{progress.total}</span>
          </div>
        )}
        {status === 'error' && (
          <div className="px-5 py-2 border-b border-slate-800/80 bg-rose-950/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px]">
          {/* Board column */}
          <div className="flex flex-col items-center justify-center gap-3 p-4 min-h-0 overflow-hidden">
            <div className="w-full flex items-center justify-between max-w-[560px]">
              <span className="text-xs text-slate-400">
                {selectedMove
                  ? `${selectedMove.moveNumber}${selectedMove.color === 'w' ? '.' : '...'} ${selectedMove.san}`
                  : 'Начальная позиция'}
              </span>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${evalNow >= 0 ? 'bg-slate-100 text-slate-900' : 'bg-slate-800 text-slate-100 border border-slate-600'}`}>
                {analysis ? formatScore(evalNow) : '—'}
              </span>
            </div>

            <div className="w-[min(100%,560px,calc(92vh-280px))] aspect-square rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
              <Chessboard
                options={{
                  id: 'analysis-board',
                  position: fen,
                  boardOrientation,
                  pieces,
                  allowDragging: false,
                  arrows,
                  darkSquareStyle: { backgroundColor: theme?.dark || '#769656' },
                  lightSquareStyle: { backgroundColor: theme?.light || '#eeeed2' },
                  animationDurationInMs: 220,
                  showAnimations: true,
                }}
              />
            </div>

            {/* Nav */}
            <div className="flex items-center gap-1.5">
              <button disabled={!analysis || selectedPly === 0} onClick={() => setSelectedPly(0)} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"><ChevronsLeft className="w-4 h-4" /></button>
              <button disabled={!analysis || selectedPly === 0} onClick={() => setSelectedPly((p) => p - 1)} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
              <span className="px-3 text-xs font-mono text-slate-400 tabular-nums">{selectedPly}/{analysis?.moves.length ?? sanMoves.length}</span>
              <button disabled={!analysis || selectedPly >= analysis.moves.length} onClick={() => setSelectedPly((p) => p + 1)} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
              <button disabled={!analysis || selectedPly >= analysis.moves.length} onClick={() => setSelectedPly(analysis.moves.length)} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"><ChevronsRight className="w-4 h-4" /></button>
            </div>

            {/* Selected move details */}
            {selectedMove && (
              <div key={selectedPly} className="w-full max-w-[560px] rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs animate-slide-up">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-md border font-bold ${LABELS[selectedMove.label].badge}`}>
                    {selectedMove.san}{LABELS[selectedMove.label].mark} · {LABELS[selectedMove.label].text}
                  </span>
                  {selectedMove.cpLoss > 0 && (
                    <span className="text-slate-400">потеря <b className="text-slate-200 tabular-nums">{(selectedMove.cpLoss / 100).toFixed(2)}</b></span>
                  )}
                  {selectedMove.label !== 'best' && selectedMove.bestMove && (
                    <span className="text-slate-400">лучше: <b className="text-emerald-300">{selectedMove.bestMove}</b></span>
                  )}
                  <span className="ml-auto text-slate-500 font-mono">
                    {formatScore(selectedMove.rawEvalBefore ?? selectedMove.evalBefore)} → {formatScore(selectedMove.rawEvalAfter ?? selectedMove.evalAfter)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="border-t lg:border-t-0 lg:border-l border-slate-800/80 bg-slate-900/30 flex flex-col min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-4">
              {/* Accuracy */}
              <div className="grid grid-cols-2 gap-2">
                <AccuracyCard side="w" data={analysis?.summary.w} isPlayer={playerColor === 'w'} />
                <AccuracyCard side="b" data={analysis?.summary.b} isPlayer={playerColor === 'b'} />
              </div>

              {/* Chart */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">График оценки</span>
                {analysis ? (
                  <EvalChart evals={analysis.evals} selected={selectedPly} onSelect={setSelectedPly} />
                ) : (
                  <div className="h-28 rounded-lg shimmer border border-slate-800/80" />
                )}
              </div>

              {/* Key moments */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ключевые моменты</span>
                {status === 'running' && <div className="h-16 rounded-lg shimmer border border-slate-800/80" />}
                {analysis && keyMoments.length === 0 && (
                  <p className="text-xs text-slate-400 rounded-lg border border-slate-800 bg-slate-900/60 p-3">Серьёзных ошибок движок не нашёл. Отличная партия!</p>
                )}
                {keyMoments.map((m) => (
                  <button
                    key={m.ply}
                    onClick={() => setSelectedPly(m.ply)}
                    className={`text-left rounded-lg border p-2.5 text-xs flex items-start gap-2.5 cursor-pointer hover:bg-slate-800/60 transition-colors ${selectedPly === m.ply ? 'border-indigo-500/60 bg-indigo-500/10' : 'border-slate-800 bg-slate-900/60'}`}
                  >
                    <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${LABELS[m.label].dot}`} />
                    <span className="flex-1 min-w-0">
                      <span className="text-white font-semibold">{m.moveNumber}{m.color === 'w' ? '.' : '...'} {m.san}{LABELS[m.label].mark}</span>
                      <span className="text-slate-400"> — {LABELS[m.label].text.toLowerCase()} {m.color === 'w' ? 'белых' : 'чёрных'}, потеря {(m.cpLoss / 100).toFixed(1)}. </span>
                      {m.bestMove && <span className="text-slate-300">Лучше было <b className="text-emerald-300">{m.bestMove}</b>.</span>}
                    </span>
                  </button>
                ))}
              </div>

              {/* DeepSeek narrative */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Комментарий тренера DeepSeek
                </span>
                {narrativeStatus === 'running' && (
                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs text-cyan-300 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Тренер изучает партию...
                  </div>
                )}
                {(narrativeStatus === 'done' || narrativeStatus === 'error') && (
                  <div className={`rounded-lg border p-3 text-xs leading-relaxed whitespace-pre-line animate-slide-up ${narrativeStatus === 'error' ? 'border-rose-800/50 bg-rose-950/30 text-rose-200' : 'border-cyan-800/40 bg-cyan-950/20 text-slate-200'}`}>
                    {narrative}
                  </div>
                )}
                {narrativeStatus === 'idle' && status === 'running' && (
                  <div className="h-20 rounded-lg shimmer border border-slate-800/80" />
                )}
              </div>

              {/* Move list */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Все ходы</span>
                <div ref={listRef} className="rounded-lg border border-slate-800 bg-slate-900/60 p-1.5 grid grid-cols-[auto_1fr_1fr] gap-x-1 gap-y-0.5 text-xs font-mono">
                  {Array.from({ length: Math.ceil(sanMoves.length / 2) }, (_, i) => {
                    const wIdx = i * 2;
                    const bIdx = i * 2 + 1;
                    const wm = analysis?.moves[wIdx];
                    const bm = analysis?.moves[bIdx];
                    const cell = (idx, m) => {
                      if (idx >= sanMoves.length) return <div />;
                      const ply = idx + 1;
                      const active = selectedPly === ply;
                      const label = m ? LABELS[m.label] : null;
                      return (
                        <button
                          data-ply={ply}
                          onClick={() => analysis && setSelectedPly(ply)}
                          className={`flex items-center justify-between gap-1 px-2 py-1 rounded-md text-left cursor-pointer transition-colors ${active ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800/70 text-slate-200'}`}
                        >
                          <span className="font-semibold">{sanMoves[idx]}{m && m.label !== 'best' ? label.mark : ''}</span>
                          {label && <span className={`w-1.5 h-1.5 rounded-full ${label.dot}`} />}
                        </button>
                      );
                    };
                    return (
                      <React.Fragment key={i}>
                        <span className="text-slate-500 px-1 py-1 tabular-nums">{i + 1}.</span>
                        {cell(wIdx, wm)}
                        {cell(bIdx, bm)}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
