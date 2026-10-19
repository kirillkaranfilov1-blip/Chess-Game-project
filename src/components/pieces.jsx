import React from 'react';

/**
 * Custom Staunton-style chess pieces with gradients and soft shadows.
 * Compatible with react-chessboard v5 PieceRenderObject API.
 */

function PieceSvg({ id, children, svgStyle, fill }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      viewBox="0 0 45 45"
      width="100%"
      height="100%"
      style={{
        filter: 'drop-shadow(0 1.5px 1.5px rgba(0,0,0,0.35))',
        ...svgStyle,
      }}
      className="chess-piece-svg"
    >
      <defs>
        <linearGradient id={`${id}-w`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#f5f0e6" />
          <stop offset="100%" stopColor="#d4cfc4" />
        </linearGradient>
        <linearGradient id={`${id}-b`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5a5a5a" />
          <stop offset="40%" stopColor="#2a2a2a" />
          <stop offset="100%" stopColor="#0f0f0f" />
        </linearGradient>
        <radialGradient id={`${id}-shine`} cx="35%" cy="30%" r="60%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      {children(fill)}
    </svg>
  );
}

function whiteFill(id, props) {
  return props?.fill ?? `url(#${id}-w)`;
}

function blackFill(id, props) {
  return props?.fill ?? `url(#${id}-b)`;
}

const strokeCommon = {
  stroke: '#1a1a1a',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

// --- White pieces ---

const wP = (props) => {
  const id = 'wP';
  return (
    <PieceSvg id={id} svgStyle={props?.svgStyle} fill={whiteFill(id, props)}>
      {(fill) => (
        <g>
          <path
            d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 H 34 C 34,31.58 29.59,27.09 26.59,26.03 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z"
            style={{ fill, ...strokeCommon }}
          />
          <ellipse cx="22.5" cy="18" rx="4" ry="3" fill={`url(#${id}-shine)`} />
        </g>
      )}
    </PieceSvg>
  );
};

const wR = (props) => {
  const id = 'wR';
  return (
    <PieceSvg id={id} svgStyle={props?.svgStyle} fill={whiteFill(id, props)}>
      {(fill) => (
        <g style={{ fill, ...strokeCommon }}>
          <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" style={{ strokeLinecap: 'butt' }} />
          <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z" style={{ strokeLinecap: 'butt' }} />
          <path
            d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14"
            style={{ strokeLinecap: 'butt' }}
          />
          <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
          <path
            d="M 31,17 L 31,29.5 L 14,29.5 L 14,17"
            style={{ strokeLinecap: 'butt', strokeLinejoin: 'miter' }}
          />
          <path d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5" />
          <path d="M 11,14 L 34,14" style={{ fill: 'none', stroke: '#1a1a1a' }} />
          <rect x="14" y="19" width="17" height="8" fill={`url(#${id}-shine)`} opacity="0.5" />
        </g>
      )}
    </PieceSvg>
  );
};

const wN = (props) => {
  const id = 'wN';
  return (
    <PieceSvg id={id} svgStyle={props?.svgStyle} fill={whiteFill(id, props)}>
      {(fill) => (
        <g style={{ fill: 'none', ...strokeCommon }}>
          <path
            d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18"
            style={{ fill, stroke: '#1a1a1a' }}
          />
          <path
            d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10"
            style={{ fill, stroke: '#1a1a1a' }}
          />
          <path
            d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z"
            style={{ fill: '#1a1a1a', stroke: '#1a1a1a' }}
          />
          <path
            d="M 15 15.5 A 0.5 1.5 0 1 1 14,15.5 A 0.5 1.5 0 1 1 15 15.5 z"
            transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)"
            style={{ fill: '#1a1a1a', stroke: '#1a1a1a' }}
          />
          <ellipse cx="20" cy="20" rx="5" ry="7" fill={`url(#${id}-shine)`} opacity="0.4" />
        </g>
      )}
    </PieceSvg>
  );
};

const wB = (props) => {
  const id = 'wB';
  return (
    <PieceSvg id={id} svgStyle={props?.svgStyle} fill={whiteFill(id, props)}>
      {(fill) => (
        <g style={{ fill: 'none', ...strokeCommon }}>
          <g style={{ fill, stroke: '#1a1a1a', strokeLinecap: 'butt' }}>
            <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.65,38.99 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 z" />
            <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z" />
            <path d="M 25 8 A 2.5 2.5 0 1 1 20,8 A 2.5 2.5 0 1 1 25 8 z" />
          </g>
          <path
            d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18"
            style={{ fill: 'none', stroke: '#1a1a1a', strokeLinejoin: 'miter' }}
          />
        </g>
      )}
    </PieceSvg>
  );
};

const wQ = (props) => {
  const id = 'wQ';
  return (
    <PieceSvg id={id} svgStyle={props?.svgStyle} fill={whiteFill(id, props)}>
      {(fill) => (
        <g style={{ fill, stroke: '#1a1a1a', strokeWidth: 1.5, strokeLinejoin: 'round' }}>
          <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z" />
          <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z" />
          <path d="M 11.5,30 C 15,29 30,29 33.5,30" style={{ fill: 'none' }} />
          <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5" style={{ fill: 'none' }} />
          <circle cx="6" cy="12" r="2" />
          <circle cx="14" cy="9" r="2" />
          <circle cx="22.5" cy="8" r="2" />
          <circle cx="31" cy="9" r="2" />
          <circle cx="39" cy="12" r="2" />
          <ellipse cx="22.5" cy="30" rx="8" ry="4" fill={`url(#${id}-shine)`} opacity="0.35" />
        </g>
      )}
    </PieceSvg>
  );
};

const wK = (props) => {
  const id = 'wK';
  return (
    <PieceSvg id={id} svgStyle={props?.svgStyle} fill={whiteFill(id, props)}>
      {(fill) => (
        <g style={{ fill: 'none', fillRule: 'evenodd', ...strokeCommon }}>
          <path d="M 22.5,11.63 L 22.5,6" style={{ fill: 'none', stroke: '#1a1a1a', strokeLinejoin: 'miter' }} />
          <path d="M 20,8 L 25,8" style={{ fill: 'none', stroke: '#1a1a1a', strokeLinejoin: 'miter' }} />
          <path
            d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25"
            style={{ fill, stroke: '#1a1a1a', strokeLinecap: 'butt', strokeLinejoin: 'miter' }}
          />
          <path
            d="M 12.5,37 C 18,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 20,16 10.5,13 6.5,19.5 C 3.5,25.5 12.5,30 12.5,30 L 12.5,37"
            style={{ fill, stroke: '#1a1a1a' }}
          />
          <path d="M 12.5,30 C 18,27 27,27 32.5,30" style={{ fill: 'none', stroke: '#1a1a1a' }} />
          <path d="M 12.5,33.5 C 18,30.5 27,30.5 32.5,33.5" style={{ fill: 'none', stroke: '#1a1a1a' }} />
          <path d="M 12.5,37 C 18,34 27,34 32.5,37" style={{ fill: 'none', stroke: '#1a1a1a' }} />
          <ellipse cx="22.5" cy="24" rx="5" ry="6" fill={`url(#${id}-shine)`} opacity="0.35" />
        </g>
      )}
    </PieceSvg>
  );
};

// --- Black pieces ---

const bP = (props) => {
  const id = 'bP';
  return (
    <PieceSvg id={id} svgStyle={props?.svgStyle} fill={blackFill(id, props)}>
      {(fill) => (
        <g>
          <path
            d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 H 34 C 34,31.58 29.59,27.09 26.59,26.03 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z"
            style={{ fill, ...strokeCommon }}
          />
          <ellipse cx="20" cy="16" rx="3.5" ry="2.5" fill={`url(#${id}-shine)`} opacity="0.55" />
        </g>
      )}
    </PieceSvg>
  );
};

const bR = (props) => {
  const id = 'bR';
  return (
    <PieceSvg id={id} svgStyle={props?.svgStyle} fill={blackFill(id, props)}>
      {(fill) => (
        <g style={{ fill, ...strokeCommon }}>
          <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" style={{ strokeLinecap: 'butt' }} />
          <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z" style={{ strokeLinecap: 'butt' }} />
          <path
            d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14"
            style={{ strokeLinecap: 'butt' }}
          />
          <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
          <path
            d="M 31,17 L 31,29.5 L 14,29.5 L 14,17"
            style={{ strokeLinecap: 'butt', strokeLinejoin: 'miter' }}
          />
          <path d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5" />
          <path d="M 11,14 L 34,14" style={{ fill: 'none', stroke: '#1a1a1a' }} />
          <path
            d="M 12,35.5 L 33,35.5 L 33,35.5"
            style={{ fill: 'none', stroke: '#cfcfcf', strokeWidth: 1, opacity: 0.35 }}
          />
          <rect x="14" y="19" width="17" height="8" fill={`url(#${id}-shine)`} opacity="0.35" />
        </g>
      )}
    </PieceSvg>
  );
};

const bN = (props) => {
  const id = 'bN';
  return (
    <PieceSvg id={id} svgStyle={props?.svgStyle} fill={blackFill(id, props)}>
      {(fill) => (
        <g style={{ fill: 'none', ...strokeCommon }}>
          <path
            d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18"
            style={{ fill, stroke: '#1a1a1a' }}
          />
          <path
            d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10"
            style={{ fill, stroke: '#1a1a1a' }}
          />
          <path
            d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z"
            style={{ fill: '#eeeeee', stroke: '#eeeeee' }}
          />
          <path
            d="M 15 15.5 A 0.5 1.5 0 1 1 14,15.5 A 0.5 1.5 0 1 1 15 15.5 z"
            transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)"
            style={{ fill: '#eeeeee', stroke: '#eeeeee' }}
          />
          <path
            d="M 24.55,10.4 L 24.1,11.85 L 24.6,12 C 27.75,13 30.25,14.49 32.5,18.75 C 34.75,23.01 35.75,29.06 35.25,39 L 35.2,39.5 L 37.45,39.5 L 37.5,39 C 38,28.94 36.62,22.15 34.25,17.66 C 31.88,13.17 28.46,11.02 25.06,10.5 L 24.55,10.4 z"
            style={{ fill: '#eeeeee', stroke: 'none', opacity: 0.2 }}
          />
          <ellipse cx="18" cy="18" rx="4" ry="5" fill={`url(#${id}-shine)`} opacity="0.45" />
        </g>
      )}
    </PieceSvg>
  );
};

const bB = (props) => {
  const id = 'bB';
  return (
    <PieceSvg id={id} svgStyle={props?.svgStyle} fill={blackFill(id, props)}>
      {(fill) => (
        <g style={{ fill: 'none', ...strokeCommon }}>
          <g style={{ fill, stroke: '#1a1a1a', strokeLinecap: 'butt' }}>
            <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.65,38.99 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 z" />
            <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z" />
            <path d="M 25 8 A 2.5 2.5 0 1 1 20,8 A 2.5 2.5 0 1 1 25 8 z" />
          </g>
          <path
            d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18"
            style={{ fill: 'none', stroke: '#eeeeee', strokeLinejoin: 'miter', opacity: 0.85 }}
          />
          <ellipse cx="20" cy="18" rx="4" ry="6" fill={`url(#${id}-shine)`} opacity="0.35" />
        </g>
      )}
    </PieceSvg>
  );
};

const bQ = (props) => {
  const id = 'bQ';
  return (
    <PieceSvg id={id} svgStyle={props?.svgStyle} fill={blackFill(id, props)}>
      {(fill) => (
        <g style={{ fill, stroke: '#1a1a1a', strokeWidth: 1.5, strokeLinejoin: 'round' }}>
          <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z" />
          <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z" />
          <path d="M 11.5,30 C 15,29 30,29 33.5,30" style={{ fill: 'none', stroke: '#eeeeee', opacity: 0.7 }} />
          <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5" style={{ fill: 'none', stroke: '#eeeeee', opacity: 0.7 }} />
          <circle cx="6" cy="12" r="2" />
          <circle cx="14" cy="9" r="2" />
          <circle cx="22.5" cy="8" r="2" />
          <circle cx="31" cy="9" r="2" />
          <circle cx="39" cy="12" r="2" />
          <ellipse cx="22.5" cy="28" rx="7" ry="3.5" fill={`url(#${id}-shine)`} opacity="0.4" />
        </g>
      )}
    </PieceSvg>
  );
};

const bK = (props) => {
  const id = 'bK';
  return (
    <PieceSvg id={id} svgStyle={props?.svgStyle} fill={blackFill(id, props)}>
      {(fill) => (
        <g style={{ fill: 'none', fillRule: 'evenodd', ...strokeCommon }}>
          <path d="M 22.5,11.63 L 22.5,6" style={{ fill: 'none', stroke: '#1a1a1a', strokeLinejoin: 'miter' }} />
          <path d="M 20,8 L 25,8" style={{ fill: 'none', stroke: '#1a1a1a', strokeLinejoin: 'miter' }} />
          <path
            d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25"
            style={{ fill, stroke: '#1a1a1a', strokeLinecap: 'butt', strokeLinejoin: 'miter' }}
          />
          <path
            d="M 12.5,37 C 18,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 20,16 10.5,13 6.5,19.5 C 3.5,25.5 12.5,30 12.5,30 L 12.5,37"
            style={{ fill, stroke: '#1a1a1a' }}
          />
          <path d="M 12.5,30 C 18,27 27,27 32.5,30" style={{ fill: 'none', stroke: '#eeeeee', opacity: 0.75 }} />
          <path d="M 12.5,33.5 C 18,30.5 27,30.5 32.5,33.5" style={{ fill: 'none', stroke: '#eeeeee', opacity: 0.75 }} />
          <path d="M 12.5,37 C 18,34 27,34 32.5,37" style={{ fill: 'none', stroke: '#eeeeee', opacity: 0.75 }} />
          <ellipse cx="22.5" cy="24" rx="5" ry="6" fill={`url(#${id}-shine)`} opacity="0.4" />
        </g>
      )}
    </PieceSvg>
  );
};

const customPieces = {
  wP,
  wR,
  wN,
  wB,
  wQ,
  wK,
  bP,
  bR,
  bN,
  bB,
  bQ,
  bK,
};

export { customPieces };

/** Render a piece by color ('w'|'b') and type ('p'|'n'|...) for UI outside the board */
export function PieceIcon({ color, type, size = 28, className = '', title }) {
  const key = `${color}${type.toUpperCase()}`;
  const Renderer = customPieces[key];
  if (!Renderer) return null;
  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      title={title}
      aria-hidden
    >
      <Renderer />
    </span>
  );
}
