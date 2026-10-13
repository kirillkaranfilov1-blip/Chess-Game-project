import React from 'react';

export default function PromotionModal({ isOpen, color, onSelect }) {
  if (!isOpen) return null;

  const pieces = [
    { type: 'q', name: 'Ферзь', symbol: color === 'w' ? '♕' : '♛' },
    { type: 'r', name: 'Ладья', symbol: color === 'w' ? '♖' : '♜' },
    { type: 'b', name: 'Слон', symbol: color === 'w' ? '♗' : '♝' },
    { type: 'n', name: 'Конь', symbol: color === 'w' ? '♘' : '♞' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 text-center">
        <h3 className="text-xl font-bold text-white mb-2">Превращение пешки</h3>
        <p className="text-slate-400 text-sm mb-6">Выберите фигуру, в которую превратится ваша пешка:</p>
        
        <div className="grid grid-cols-4 gap-3">
          {pieces.map((p) => (
            <button
              key={p.type}
              onClick={() => onSelect(p.type)}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700 hover:border-indigo-500 transition-all transform hover:scale-105 active:scale-95 group cursor-pointer"
            >
              <span className="text-4xl group-hover:scale-110 transition-transform select-none">
                {p.symbol}
              </span>
              <span className="text-xs font-medium text-slate-300 mt-2">
                {p.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
