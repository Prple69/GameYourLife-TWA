import { useState } from 'react'

export default function GuildCreateForm({ onSubmit, onCancel, loading }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (name.trim().length < 3) {
      setError('Название должно быть от 3 символов')
      return
    }
    setError(null)
    try {
      await onSubmit({ name: name.trim(), description: description.trim() || undefined })
    } catch (err) {
      setError(err?.response?.data?.detail || 'Ошибка создания гильдии')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-bold text-yellow-400">Создать гильдию</h2>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Название *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={64}
          placeholder="Например: Dragon Slayers"
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2
                     text-white placeholder-gray-500 focus:border-yellow-500 outline-none"
          required
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Описание</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={256}
          placeholder="Чем занимается гильдия?"
          rows={3}
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2
                     text-white placeholder-gray-500 focus:border-yellow-500 outline-none resize-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-yellow-500 text-black font-bold py-2 rounded
                     hover:bg-yellow-400 disabled:opacity-50"
        >
          {loading ? 'Создание...' : 'Создать'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-700 text-white py-2 rounded hover:bg-gray-600"
        >
          Отмена
        </button>
      </div>
    </form>
  )
}
