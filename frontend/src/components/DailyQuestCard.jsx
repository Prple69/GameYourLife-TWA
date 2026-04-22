import React from 'react';

const CATEGORY_COLOR = {
  work: 'text-blue-400 border-blue-400',
  fitness: 'text-red-400 border-red-400',
  learning: 'text-green-400 border-green-400',
  social: 'text-yellow-400 border-yellow-400',
};

const CATEGORY_LABEL = {
  work: 'РАБОТА',
  fitness: 'ФИТНЕС',
  learning: 'ОБУЧЕНИЕ',
  social: 'ОБЩЕНИЕ',
};

const DIFF_COLOR = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-orange-400',
  epic: 'text-red-500',
};

const DIFF_LABEL = {
  easy: 'ЛЁГКИЙ',
  medium: 'СРЕДНИЙ',
  hard: 'ТЯЖЁЛЫЙ',
  epic: 'ЭПИК',
};

const DailyQuestCard = ({
  suggestion,
  index,
  onAccept,
  onReroll,
  acceptDisabled,
  rerollDisabled,
  isAccepting,
  isRerolling,
}) => {
  const { title, category, difficulty, xp, gold, hp_penalty } = suggestion;

  return (
    <div
      className="border border-yellow-600 bg-black p-3 mb-2 font-mono"
      style={{ fontFamily: "'Press Start 2P', monospace" }}
    >
      <div className="flex justify-between items-start mb-2">
        <span
          className={`text-[8px] border px-1 py-0.5 ${
            CATEGORY_COLOR[category] || 'text-gray-400 border-gray-400'
          }`}
        >
          {CATEGORY_LABEL[category] || category.toUpperCase()}
        </span>
        <span className={`text-[8px] ${DIFF_COLOR[difficulty] || 'text-gray-400'}`}>
          {DIFF_LABEL[difficulty] || difficulty.toUpperCase()}
        </span>
      </div>

      <p className="text-white text-[9px] leading-relaxed mb-3 min-h-[32px]">{title}</p>

      <div className="flex gap-3 mb-3 text-[8px]">
        <span className="text-green-400">+{xp} XP</span>
        <span className="text-yellow-400">+{gold} GOLD</span>
        <span className="text-red-400">-{hp_penalty} HP</span>
      </div>

      <div className="flex justify-between gap-2">
        <button
          onClick={() => !acceptDisabled && !isAccepting && onAccept(index)}
          disabled={acceptDisabled || isAccepting}
          title={acceptDisabled ? 'Освободи слот (5/5)' : undefined}
          className={`text-[8px] px-2 py-1 border ${
            acceptDisabled
              ? 'text-gray-600 border-gray-700 cursor-not-allowed'
              : 'text-green-400 border-green-600 hover:bg-green-900 cursor-pointer'
          }`}
        >
          {isAccepting ? '...' : '✓ ПРИНЯТЬ'}
        </button>

        <button
          onClick={() => !rerollDisabled && !isRerolling && onReroll(index)}
          disabled={rerollDisabled || isRerolling}
          className={`text-[8px] px-2 py-1 border ${
            rerollDisabled
              ? 'text-gray-600 border-gray-700 cursor-not-allowed'
              : 'text-yellow-400 border-yellow-600 hover:bg-yellow-900 cursor-pointer'
          }`}
        >
          {isRerolling ? '...' : '↻ РЕРОЛЛНУТЬ'}
        </button>
      </div>
    </div>
  );
};

export default DailyQuestCard;
