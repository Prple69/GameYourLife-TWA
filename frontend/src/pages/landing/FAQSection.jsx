import { useState } from 'react';

const faqs = [
  {
    q: 'Это бесплатно?',
    a: 'Да. Базовые функции — создание квестов, прокачка персонажа, магазин за золото — полностью бесплатны. Кристаллы (gems) покупаются за реальные деньги и открывают дополнительные возможности.',
  },
  {
    q: 'Что такое HP? Я правда теряю его за проваленные квесты?',
    a: 'Да. Персонаж имеет очки здоровья (HP). Квест просрочился — потерял HP. Дошёл до 0 — Game Over (сброс прогресса). Это создаёт настоящие ставки и делает победу значимой.',
  },
  {
    q: 'AI сам создаёт квесты?',
    a: 'AI анализирует квест, который ты создал сам, и назначает сложность, XP и золото. В будущем появятся AI-предложения — персонализированные ежедневные задания на основе твоих статов.',
  },
  {
    q: 'Это работает на телефоне?',
    a: 'Да, сайт полностью адаптирован под мобильные устройства. На телефоне — bottom-навигация с иконками, на компьютере — боковая панель.',
  },
  {
    q: 'Данные в безопасности?',
    a: 'Да. Мы храним данные на серверах в России (152-ФЗ). Пароли хранятся в хешированном виде. Подробнее — в Политике конфиденциальности.',
  },
  {
    q: 'Как отменить аккаунт?',
    a: 'Через настройки аккаунта. Все данные будут удалены в соответствии с Политикой конфиденциальности. Неиспользованные кристаллы (gems) при удалении не возвращаются.',
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState(null);

  return (
    <section className="py-20 px-6 border-t border-white/5">
      <div className="max-w-3xl mx-auto">
        <h2
          className="text-yellow-400 text-center mb-12 text-sm"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          ВОПРОСЫ И ОТВЕТЫ
        </h2>
        <div className="space-y-2">
          {faqs.map(({ q, a }, idx) => (
            <div key={idx} className="border border-white/10">
              <button
                onClick={() => setOpen(open === idx ? null : idx)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
              >
                <span className="text-xs font-mono text-white/80 leading-relaxed pr-4">{q}</span>
                <span className="text-yellow-400 text-sm shrink-0">{open === idx ? '−' : '+'}</span>
              </button>
              {open === idx && (
                <div className="px-5 pb-4">
                  <p className="text-white/50 text-xs leading-relaxed">{a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
