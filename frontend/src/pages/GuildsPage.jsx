import { useState, useEffect, useCallback } from 'react'
import GuildCard from '../components/GuildCard'
import GuildDetailView from '../components/GuildDetailView'
import GuildCreateForm from '../components/GuildCreateForm'
import { guildsService } from '../services/guildsService'

export default function GuildsPage() {
  const [guilds, setGuilds] = useState([])
  const [selectedGuild, setSelectedGuild] = useState(null)  // GuildDetail
  const [challenges, setChallenges] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadGuilds = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await guildsService.listGuilds({ limit: 20 })
      setGuilds(res.data)
    } catch (e) {
      setError('Не удалось загрузить гильдии')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadGuilds() }, [loadGuilds])

  const openGuild = async (guild) => {
    setError(null)
    try {
      const [detailRes, challengeRes] = await Promise.all([
        guildsService.getGuild(guild.slug),
        guildsService.getChallenges(guild.id).catch(() => ({ data: [] })),
      ])
      setSelectedGuild(detailRes.data)
      setChallenges(challengeRes.data)
    } catch (e) {
      setError('Не удалось загрузить гильдию')
    }
  }

  const handleJoin = async (guild) => {
    setActionLoading(true)
    try {
      await guildsService.joinGuild(guild.id)
      await openGuild(guild)
      await loadGuilds()
    } catch (e) {
      setError(e?.response?.data?.detail || 'Ошибка вступления')
    } finally {
      setActionLoading(false)
    }
  }

  const handleLeave = async () => {
    if (!selectedGuild) return
    setActionLoading(true)
    try {
      await guildsService.leaveGuild(selectedGuild.id)
      await openGuild(selectedGuild)
      await loadGuilds()
    } catch (e) {
      setError(e?.response?.data?.detail || 'Ошибка выхода из гильдии')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreate = async (data) => {
    setActionLoading(true)
    try {
      const res = await guildsService.createGuild(data)
      setShowCreate(false)
      await loadGuilds()
      await openGuild(res.data)
    } finally {
      setActionLoading(false)
    }
  }

  const myGuildIds = new Set(
    guilds.filter((g) => g.my_role !== undefined).map((g) => g.id)
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-yellow-400">Гильдии</h1>
        {!showCreate && !selectedGuild && (
          <button
            onClick={() => setShowCreate(true)}
            className="bg-yellow-500 text-black px-4 py-2 rounded font-bold hover:bg-yellow-400"
          >
            + Создать
          </button>
        )}
        {selectedGuild && (
          <button
            onClick={() => { setSelectedGuild(null); setChallenges([]) }}
            className="text-sm text-gray-400 hover:text-white"
          >
            ← Назад к списку
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="border border-gray-700 bg-gray-900 rounded-lg p-6">
          <GuildCreateForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            loading={actionLoading}
          />
        </div>
      )}

      {/* Guild detail view */}
      {selectedGuild && !showCreate && (
        <div className="border border-gray-700 bg-gray-900 rounded-lg p-6">
          <GuildDetailView
            guild={selectedGuild}
            challenges={challenges}
            onJoin={() => handleJoin(selectedGuild)}
            onLeave={handleLeave}
            loadingAction={actionLoading}
          />
        </div>
      )}

      {/* Guild list */}
      {!selectedGuild && !showCreate && (
        <>
          {loading && (
            <p className="text-gray-500 text-center py-8">Загрузка гильдий...</p>
          )}
          {!loading && guilds.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              Гильдий пока нет. Создайте первую!
            </p>
          )}
          <div className="space-y-3">
            {guilds.map((g) => (
              <GuildCard
                key={g.id}
                guild={g}
                onSelect={openGuild}
                onJoin={handleJoin}
                isJoined={myGuildIds.has(g.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
