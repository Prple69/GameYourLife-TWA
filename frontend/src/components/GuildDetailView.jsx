import ChallengeCard from './ChallengeCard'

const ROLE_LABEL = { owner: 'Владелец', officer: 'Офицер', member: 'Участник' }

export default function GuildDetailView({ guild, challenges, onJoin, onLeave, loadingAction }) {
  const isOwner = guild.my_role === 'owner'
  const isMember = guild.my_role !== null && guild.my_role !== undefined

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-yellow-400">{guild.name}</h2>
          {guild.description && (
            <p className="text-gray-400 mt-1 text-sm">{guild.description}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">{guild.member_count} участников</p>
        </div>
        <div className="shrink-0">
          {!isMember && (
            <button
              onClick={onJoin}
              disabled={loadingAction}
              className="bg-yellow-500 text-black px-4 py-2 rounded font-bold
                         hover:bg-yellow-400 disabled:opacity-50"
            >
              Вступить
            </button>
          )}
          {isMember && !isOwner && (
            <button
              onClick={onLeave}
              disabled={loadingAction}
              className="bg-gray-700 text-gray-300 px-4 py-2 rounded
                         hover:bg-gray-600 disabled:opacity-50"
            >
              Покинуть
            </button>
          )}
          {isOwner && (
            <span
              title="Передайте права владельца другому участнику перед выходом"
              className="bg-gray-800 text-gray-500 px-4 py-2 rounded cursor-not-allowed text-sm"
            >
              Владелец
            </span>
          )}
        </div>
      </div>

      {/* Members */}
      <div>
        <h3 className="font-semibold text-gray-200 mb-2">Участники</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {guild.members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 py-1">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm">
                {m.avatar ? (
                  <img src={`/avatars/${m.avatar}.png`} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span>{(m.display_name || '?')[0].toUpperCase()}</span>
                )}
              </div>
              <span className="flex-1 text-sm text-white">
                {m.display_name}
              </span>
              <span className="text-xs text-gray-500 capitalize">
                {ROLE_LABEL[m.role] || m.role}
              </span>
              <span className="text-xs text-yellow-500">Lv.{m.lvl}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Challenges */}
      {isMember && (
        <div>
          <h3 className="font-semibold text-gray-200 mb-2">Активные челленджи</h3>
          {challenges.length === 0 ? (
            <p className="text-gray-500 text-sm">Нет активных челленджей</p>
          ) : (
            <div className="space-y-3">
              {challenges.map((c) => (
                <ChallengeCard key={c.id} challenge={c} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
