import React from 'react';
import { PieceIcon } from './pieces';

export default function CapturedPieces({ captured, advantage }) {
  const whiteCaptured = captured?.w || [];
  const blackCaptured = captured?.b || [];

  return (
    <div className="flex items-center justify-between text-xs py-1.5 px-3 bg-slate-900/60 rounded-lg border border-slate-800/80">
      {/* Captured by Black (White pieces captured) */}
      <div className="flex items-center gap-1.5 overflow-x-auto max-w-[45%]">
        <span className="text-slate-500 font-mono text-[10px] uppercase">Взято:</span>
        <div className="flex items-center -space-x-1">
          {whiteCaptured.map((p, idx) => (
            <PieceIcon key={idx} color="w" type={p} size={22} title={`Белая фигура: ${p}`} className="animate-pop-in" />
          ))}
          {whiteCaptured.length === 0 && <span className="text-slate-600 text-xs">-</span>}
        </div>
        {advantage < 0 && (
          <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded bg-slate-800 text-slate-300">
            +{Math.abs(advantage)}
          </span>
        )}
      </div>

      {/* Captured by White (Black pieces captured) */}
      <div className="flex items-center gap-1.5 overflow-x-auto max-w-[45%] justify-end">
        {advantage > 0 && (
          <span className="mr-1 px-1.5 py-0.2 text-[10px] font-bold rounded bg-indigo-950/80 text-indigo-400 border border-indigo-800/40">
            +{advantage}
          </span>
        )}
        <div className="flex items-center -space-x-1">
          {blackCaptured.map((p, idx) => (
            <PieceIcon key={idx} color="b" type={p} size={22} title={`Черная фигура: ${p}`} className="animate-pop-in" />
          ))}
          {blackCaptured.length === 0 && <span className="text-slate-600 text-xs">-</span>}
        </div>
      </div>
    </div>
  );
}
