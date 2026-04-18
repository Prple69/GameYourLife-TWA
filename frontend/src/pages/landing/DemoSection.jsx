export default function DemoSection() {
  return (
    <section className="py-20 px-6 bg-black/60 border-t border-white/5">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
        {/* Explanation */}
        <div className="flex-1 space-y-4">
          <h2
            className="text-yellow-400 text-sm leading-relaxed"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            КАК ЭТО РАБОТАЕТ
          </h2>
          <ol className="space-y-3 text-sm text-white/60 list-none">
            {[
              ['01', 'Создай квест из реальной задачи'],
              ['02', 'AI оценит сложность и назначит XP и золото'],
              ['03', 'Выполни — получи награду и прокачай персонажа'],
              ['04', 'Не выполни — потеряешь HP. Нет, это не шутка.'],
            ].map(([num, text]) => (
              <li key={num} className="flex gap-4 items-start">
                <span className="text-yellow-400 text-xs shrink-0" style={{ fontFamily: "'Press Start 2P', monospace" }}>
                  {num}
                </span>
                <span className="leading-relaxed">{text}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Demo quest card */}
        <div className="flex-1 max-w-sm w-full">
          <div className="border border-yellow-400/30 p-5 bg-black space-y-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-white text-xs font-mono leading-relaxed">Написать 3 страницы диссертации</p>
              <span className="shrink-0 text-[9px] border border-yellow-400/40 text-yellow-400 px-2 py-0.5 font-mono">
                СЛОЖНО
              </span>
            </div>
            <div className="flex gap-4 text-[10px] font-mono">
              <span className="text-yellow-400">+120 XP</span>
              <span className="text-yellow-400">+45 золота</span>
              <span className="text-red-400">-30 HP если провал</span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 h-1 bg-yellow-400/20 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full" style={{ width: '0%' }} />
              </div>
            </div>
            <p className="text-white/30 text-[9px]">Дедлайн: завтра 23:59</p>
          </div>
        </div>
      </div>
    </section>
  );
}
