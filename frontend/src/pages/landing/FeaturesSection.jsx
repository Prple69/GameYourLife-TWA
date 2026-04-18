const features = [
  {
    icon: '🤖',
    title: 'AI-АНАЛИЗ',
    desc: 'GPT оценивает каждый квест и назначает справедливую награду — XP, золото и штраф за провал.',
  },
  {
    icon: '⚔️',
    title: 'ПРОКАЧКА ГЕРОЯ',
    desc: '4 стата (Сила / Мудрость / Выносливость / Харизма) растут от разных типов задач.',
  },
  {
    icon: '🏪',
    title: 'МАГАЗИН И ЛАВКА',
    desc: 'Трать заработанное золото на бусты XP, слоты для квестов и скины персонажа.',
  },
  {
    icon: '🏆',
    title: 'ГИЛЬДИИ И ЛИДЕРЫ',
    desc: 'Вступай в гильдии, выполняй групповые челленджи и соревнуйся в глобальном рейтинге.',
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 px-6 border-t border-white/5">
      <div className="max-w-4xl mx-auto">
        <h2
          className="text-yellow-400 text-center mb-12 text-sm"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          ВОЗМОЖНОСТИ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="border border-white/10 p-6 space-y-3 hover:border-yellow-400/30 transition-colors group"
            >
              <div className="text-3xl">{icon}</div>
              <h3
                className="text-yellow-400 text-[10px] leading-relaxed group-hover:text-yellow-300 transition-colors"
                style={{ fontFamily: "'Press Start 2P', monospace" }}
              >
                {title}
              </h3>
              <p className="text-white/50 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
