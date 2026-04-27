export default function ChallengeCard({ challenge }) {
  const pct = Math.min(challenge.progress_percent, 100)
  const end = new Date(challenge.end_date)
  const daysLeft = Math.max(0, Math.ceil((end - Date.now()) / 86400000))

  return (
    <div className="border border-gray-700 bg-gray-900 rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-white">{challenge.name}</h4>
        <span className="text-xs text-gray-500 shrink-0 ml-2">
          {daysLeft > 0 ? `${daysLeft} дн. осталось` : 'Завершён'}
        </span>
      </div>
      {challenge.description && (
        <p className="text-sm text-gray-400 mb-3">{challenge.description}</p>
      )}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-400">
          <span>{challenge.current_xp} XP</span>
          <span>{challenge.target_xp} XP</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-yellow-500 h-2 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="text-right text-xs text-yellow-400">{pct}%</div>
      </div>
    </div>
  )
}
