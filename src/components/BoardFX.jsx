import React from 'react';

/**
 * Visual effects overlay for the chessboard: capture bursts, move trails,
 * landing highlights and a persistent check pulse. Purely decorative.
 */

function squareToPos(square, orientation) {
  const file = square.charCodeAt(0) - 97; // a=0
  const rank = parseInt(square[1], 10) - 1; // 1=0
  const col = orientation === 'white' ? file : 7 - file;
  const row = orientation === 'white' ? 7 - rank : rank;
  return { left: `${col * 12.5}%`, top: `${row * 12.5}%` };
}

const PARTICLES = Array.from({ length: 10 }, (_, i) => ({
  angle: `${(360 / 10) * i + (i % 2 ? 12 : -8)}deg`,
  dist: `${55 + (i % 3) * 18}%`,
  delay: `${(i % 4) * 20}ms`,
}));

export default function BoardFX({ effects = [], orientation = 'white', checkSquare = null, mateSquare = null }) {
  return (
    <div className="board-fx" aria-hidden>
      {checkSquare && !mateSquare && (
        <div className="fx" style={squareToPos(checkSquare, orientation)}>
          <div className="fx-check" />
        </div>
      )}
      {mateSquare && (
        <div className="fx" style={squareToPos(mateSquare, orientation)}>
          <div className="fx-mate" />
        </div>
      )}

      {effects.map((fx) => {
        if (fx.type === 'capture') {
          const color = fx.color || 'rgba(251, 191, 36, 0.95)';
          return (
            <div key={fx.id} className="fx" style={{ ...squareToPos(fx.square, orientation), '--fx-color': color }}>
              <div className="fx-flash" />
              <div className="fx-ring" />
              {PARTICLES.map((p, i) => (
                <span
                  key={i}
                  className="fx-particle"
                  style={{ '--angle': p.angle, '--dist': p.dist, animationDelay: p.delay }}
                />
              ))}
            </div>
          );
        }
        if (fx.type === 'move') {
          return (
            <React.Fragment key={fx.id}>
              <div className="fx" style={squareToPos(fx.from, orientation)}>
                <div className="fx-trail" />
              </div>
              <div className="fx" style={squareToPos(fx.to, orientation)}>
                <div className="fx-land" />
              </div>
            </React.Fragment>
          );
        }
        if (fx.type === 'ring') {
          return (
            <div key={fx.id} className="fx" style={{ ...squareToPos(fx.square, orientation), '--fx-color': fx.color }}>
              <div className="fx-ring" />
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
