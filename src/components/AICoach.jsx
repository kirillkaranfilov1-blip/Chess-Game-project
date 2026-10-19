import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, Loader2, Sparkles } from 'lucide-react';
import { askCoach } from '../utils/deepseek';

const QUICK_PROMPTS = [
  { id: 'eval', label: 'Оцени позицию', text: 'Оцени текущую позицию: кто лучше и почему?' },
  { id: 'hint', label: 'Подскажи ход', text: 'Какой лучший ход сейчас и зачем?' },
  { id: 'last', label: 'Разбери последний ход', text: 'Разбери последний сделанный ход: хорош ли он и есть ли лучше?' },
];

export default function AICoach({ game, moveHistory }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Привет! Я тренер DeepSeek. Спросите про позицию, попросите подсказку или разбор хода.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const sendQuestion = async (question) => {
    const q = String(question || '').trim();
    if (!q || loading || !game) return;

    setError('');
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setInput('');
    setLoading(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const answer = await askCoach(game, moveHistory, q, { signal: controller.signal });
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch (err) {
      const msg = err.message || 'Не удалось получить ответ';
      setError(msg);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠ ${msg}. Проверьте DEEPSEEK_API_KEY в .env и что сервер запущен через npm run dev.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendQuestion(input);
  };

  return (
    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          Тренер DeepSeek
        </span>
        <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
      </div>

      <div
        ref={listRef}
        className="h-44 overflow-y-auto flex flex-col gap-2 pr-1 rounded-lg bg-slate-900/50 border border-slate-800/60 p-2"
      >
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`text-xs leading-relaxed px-2.5 py-2 rounded-lg max-w-[95%] ${
              m.role === 'user'
                ? 'ml-auto bg-indigo-600/80 text-white'
                : 'mr-auto bg-slate-800/80 text-slate-200 border border-slate-700/50'
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 px-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Думаю...
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={loading}
            onClick={() => sendQuestion(p.text)}
            className="px-2 py-1 rounded-md text-[10px] font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-cyan-700/50 disabled:opacity-40 cursor-pointer transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="Спросите тренера..."
          className="flex-1 min-w-0 px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-600/60 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2 rounded-lg bg-cyan-700/80 hover:bg-cyan-600 text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          title="Отправить"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {error && (
        <p className="text-[10px] text-rose-400/90 leading-snug">{error}</p>
      )}
    </div>
  );
}
