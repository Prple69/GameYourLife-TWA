export default function GuildCard({ guild, onSelect, onJoin, isJoined }) {
  return (
    <div
      className="border border-gray-700 bg-gray-900 rounded-lg p-4 cursor-pointer
                 hover:border-yellow-500 transition-colors"
      onClick={() => onSelect(guild)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-yellow-400 truncate">{guild.name}</h3>
          {guild.description && (
            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{guild.description}</p>
          )}
          <span className="text-xs text-gray-500 mt-2 block">
            {guild.member_count} {guild.member_count === 1 ? 'участник' : 'участников'}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onJoin(guild); }}
          disabled={isJoined}
          className={`text-sm px-3 py-1 rounded font-medium shrink-0 ${
            isJoined
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-yellow-500 text-black hover:bg-yellow-400'
          }`}
        >
          {isJoined ? 'В гильдии' : 'Вступить'}
        </button>
      </div>
    </div>
  )
}
