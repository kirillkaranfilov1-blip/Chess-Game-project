import { getBestMove, evaluateBoard } from './ai';
import { engineSearch } from './engineClient';
import { MATE_THRESHOLD, formatScore } from './engine';

const DEFAULT_TIMEOUT_MS = 25000;

/**
 * Low-level call to the Vite DeepSeek proxy.
 */
export async function askDeepSeek(messages, opts = {}) {
  const {
    temperature = 0.3,
    response_format,
    max_tokens,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal,
  } = opts;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', onAbort, { once: true });
  }

  try {
    const res = await fetch('/api/deepseek', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        temperature,
        response_format,
        max_tokens,
      }),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || `DeepSeek error (${res.status})`);
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from DeepSeek');
    }
    return content;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Запрос к DeepSeek прерван или превысил время ожидания');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
    if (signal) signal.removeEventListener('abort', onAbort);
  }
}

function parseMoveJson(raw) {
  let text = String(raw).trim();
  // Strip markdown fences if model wraps JSON
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();

  try {
    const parsed = JSON.parse(text);
    return {
      move: String(parsed.move || '').trim(),
      comment: String(parsed.comment || '').trim(),
    };
  } catch {
    // Fallback: try to find a SAN-like token
    const match = text.match(/"move"\s*:\s*"([^"]+)"/);
    if (match) {
      const commentMatch = text.match(/"comment"\s*:\s*"([^"]*)"/);
      return { move: match[1].trim(), comment: commentMatch?.[1]?.trim() || '' };
    }
    throw new Error('Не удалось разобрать ответ DeepSeek');
  }
}

function findLegalMove(game, sanOrUci) {
  const legal = game.moves({ verbose: true });
  const token = String(sanOrUci || '').trim();
  if (!token) return null;

  // Exact SAN match
  let found = legal.find((m) => m.san === token);
  if (found) return found;

  // SAN without check/mate markers
  const cleaned = token.replace(/[+#?!]/g, '');
  found = legal.find((m) => m.san.replace(/[+#]/g, '') === cleaned);
  if (found) return found;

  // UCI-like: e2e4 or e7e8q
  const uci = token.toLowerCase().replace(/[^a-h1-8qrbn]/g, '');
  if (uci.length >= 4) {
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci[4] || undefined;
    found = legal.find(
      (m) => m.from === from && m.to === to && (!promotion || m.promotion === promotion)
    );
    if (found) return found;
  }

  return null;
}

function buildMovePrompt(game, retryNote) {
  const fen = game.fen();
  const history = game.history().join(' ');
  const legalSans = game.moves();
  const side = game.turn() === 'w' ? 'White' : 'Black';

  return [
    {
      role: 'system',
      content:
        'You are a strong chess engine playing as Black or White. ' +
        'Reply ONLY with valid JSON: {"move":"<SAN>","comment":"<one short Russian phrase>"}. ' +
        'The move MUST be one of the legal SAN moves provided. No markdown, no extra text.',
    },
    {
      role: 'user',
      content: [
        `Side to move: ${side}`,
        `FEN: ${fen}`,
        `Move history (SAN): ${history || '(start)'}`,
        `Legal moves (SAN): ${legalSans.join(', ')}`,
        retryNote ? `Previous attempt invalid: ${retryNote}. Pick a different legal move.` : '',
        'Choose the strongest move and briefly comment in Russian.',
      ]
        .filter(Boolean)
        .join('\n'),
    },
  ];
}

/**
 * Ask DeepSeek for a move. Falls back to local hard minimax on failure.
 * @returns {{ move: object, comment: string, source: 'deepseek'|'fallback' }}
 */
export async function getDeepSeekMove(game, { signal } = {}) {
  const applyFallback = (reason) => {
    const move = getBestMove(game, 'hard');
    return {
      move,
      comment: reason
        ? `Локальный движок (${reason})`
        : 'Локальный движок (фолбэк)',
      source: 'fallback',
    };
  };

  try {
    let content = await askDeepSeek(buildMovePrompt(game), {
      temperature: 0.2,
      response_format: { type: 'json_object' },
      max_tokens: 200,
      signal,
    });

    let { move: moveToken, comment } = parseMoveJson(content);
    let legalMove = findLegalMove(game, moveToken);

    if (!legalMove) {
      content = await askDeepSeek(
        buildMovePrompt(game, `"${moveToken}" is not legal`),
        {
          temperature: 0.1,
          response_format: { type: 'json_object' },
          max_tokens: 200,
          signal,
        }
      );
      ({ move: moveToken, comment } = parseMoveJson(content));
      legalMove = findLegalMove(game, moveToken);
    }

    if (!legalMove) {
      return applyFallback('невалидный ход');
    }

    return {
      move: legalMove,
      comment: comment || 'DeepSeek сделал ход',
      source: 'deepseek',
    };
  } catch (err) {
    console.warn('[DeepSeek move]', err.message);
    return applyFallback(err.message?.slice(0, 60) || 'ошибка сети');
  }
}

/**
 * Grandmaster level: deep engine search produces top candidates with exact
 * scores, then DeepSeek picks among the near-best ones (positional judgment).
 * Engine always provides the floor: if DeepSeek picks anything weaker than the
 * window or fails, the engine's best move is used.
 */
export async function getGrandmasterMove(game, { signal } = {}) {
  const search = await engineSearch(
    game.fen(),
    { maxDepth: 5, timeMs: 2200, topN: 5 },
    { signal }
  );
  if (!search.bestMove) return null;

  const top = search.candidates[0];
  const toMove = (c) => ({ from: c.move.from, to: c.move.to, promotion: c.move.promotion, san: c.move.san });

  // Forced mate or single legal move: no need to consult the LLM
  if (search.candidates.length === 1 || Math.abs(top.score) >= MATE_THRESHOLD) {
    return {
      move: toMove(top),
      comment: Math.abs(top.score) >= MATE_THRESHOLD ? 'Форсированный мат' : 'Единственный ход',
      source: 'engine',
      depth: search.depth,
    };
  }

  const WINDOW = 60; // centipawns
  const eligible = search.candidates.filter((c) => top.score - c.score <= WINDOW);
  const sideSign = game.turn() === 'w' ? 1 : -1;

  const messages = [
    {
      role: 'system',
      content:
        'You are a chess grandmaster (2700+ Elo). A strong engine has pre-selected candidate moves with exact evaluations. ' +
        'Choose the move with the best long-term plan, king safety and practical winning chances. ' +
        'Reply ONLY with valid JSON: {"move":"<SAN from the candidate list>","comment":"<one short Russian phrase explaining the idea>"}. ' +
        'No markdown, no extra text.',
    },
    {
      role: 'user',
      content: [
        `Side to move: ${game.turn() === 'w' ? 'White' : 'Black'}`,
        `FEN: ${game.fen()}`,
        `Move history (SAN): ${game.history().join(' ') || '(start)'}`,
        `Candidate moves (engine eval from White's perspective, depth ${search.depth}):`,
        ...eligible.map((c, i) => `${i + 1}. ${c.move.san} (${formatScore(sideSign * c.score)})`),
        'Pick exactly one of the candidates.',
      ].join('\n'),
    },
  ];

  try {
    const content = await askDeepSeek(messages, {
      temperature: 0.1,
      response_format: { type: 'json_object' },
      max_tokens: 160,
      signal,
    });
    const { move: token, comment } = parseMoveJson(content);
    const legal = findLegalMove(game, token);
    const picked = legal && eligible.find((c) => c.move.san === legal.san);
    if (picked) {
      return { move: toMove(picked), comment: comment || 'Гроссмейстерский ход', source: 'deepseek', depth: search.depth };
    }
    return { move: toMove(top), comment: comment || `Движок, глубина ${search.depth}`, source: 'engine', depth: search.depth };
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    console.warn('[Grandmaster DeepSeek]', err.message);
    return { move: toMove(top), comment: `Движок, глубина ${search.depth}`, source: 'engine', depth: search.depth };
  }
}

/**
 * Narrative post-game review from DeepSeek, grounded in engine analysis.
 */
export async function summarizeGameWithDeepSeek({ sanMoves, analysis, resultText, playerColor = 'w' }, { signal } = {}) {
  const pgnLine = sanMoves
    .map((san, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${san}` : san))
    .join(' ');

  const worst = [...analysis.moves]
    .filter((m) => m.label === 'mistake' || m.label === 'blunder' || m.label === 'inaccuracy')
    .sort((a, b) => b.cpLoss - a.cpLoss)
    .slice(0, 6)
    .map(
      (m) =>
        `${m.moveNumber}${m.color === 'w' ? '.' : '...'} ${m.san} (${m.color === 'w' ? 'белые' : 'чёрные'}, ${m.label}, потеря ${(m.cpLoss / 100).toFixed(1)}; лучше было ${m.bestMove})`
    );

  const s = analysis.summary;
  const messages = [
    {
      role: 'system',
      content:
        'Ты опытный шахматный тренер. Пиши по-русски, структурированно и по делу: ' +
        '1) краткий итог партии и дебют; 2) ключевые моменты и ошибки с объяснением идей (ссылайся на номера ходов); ' +
        '3) 2–3 конкретных совета игроку. Не выдумывай ходы, которых нет в партии. До 220 слов. Без markdown-заголовков, можно короткие абзацы.',
    },
    {
      role: 'user',
      content: [
        `Результат: ${resultText}`,
        `Игрок играл за ${playerColor === 'w' ? 'белых' : 'чёрных'}.`,
        `Ходы: ${pgnLine}`,
        `Точность: белые ${s.w.accuracy}%, чёрные ${s.b.accuracy}%.`,
        `Ошибки белых: зевков ${s.w.counts.blunder}, ошибок ${s.w.counts.mistake}, неточностей ${s.w.counts.inaccuracy}.`,
        `Ошибки чёрных: зевков ${s.b.counts.blunder}, ошибок ${s.b.counts.mistake}, неточностей ${s.b.counts.inaccuracy}.`,
        worst.length ? `Самые серьёзные ошибки (по движку):\n${worst.join('\n')}` : 'Серьёзных ошибок движок не нашёл.',
        'Сделай разбор партии.',
      ].join('\n'),
    },
  ];

  return askDeepSeek(messages, { temperature: 0.6, max_tokens: 700, signal });
}

/**
 * Chess coach chat helper.
 */
export async function askCoach(game, moveHistory, question, { signal } = {}) {
  const fen = game.fen();
  const history = (moveHistory || [])
    .map((m) => (typeof m === 'string' ? m : m.san))
    .join(' ');
  const evalScore = evaluateBoard(game);
  const evalPawns = (evalScore / 100).toFixed(1);
  const side = game.turn() === 'w' ? 'белых' : 'чёрных';

  const messages = [
    {
      role: 'system',
      content:
        'Ты дружелюбный шахматный тренер. Отвечай по-русски кратко (2–5 предложений), ' +
        'ясно и по делу. Используй шахматную нотацию SAN. Не выдумывай ходы, которых нет среди легальных, если советуешь ход.',
    },
    {
      role: 'user',
      content: [
        `Позиция FEN: ${fen}`,
        `Ход ${side}. Оценка (белые +): ${evalPawns}`,
        `История: ${history || '(партия только началась)'}`,
        `Легальные ходы: ${game.moves().join(', ')}`,
        `Вопрос игрока: ${question}`,
      ].join('\n'),
    },
  ];

  return askDeepSeek(messages, {
    temperature: 0.5,
    max_tokens: 500,
    signal,
  });
}
