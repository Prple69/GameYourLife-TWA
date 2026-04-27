export default function FriendCard({ friend, onDelete }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border border-gray-700 rounded mb-2">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-bold">
          {friend.display_name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div>
          <div className="text-white text-sm font-medium">{friend.display_name}</div>
          <div className="text-gray-400 text-xs">Уровень {friend.lvl}</div>
        </div>
      </div>
      <button
        onClick={() => onDelete(friend)}
        className="text-gray-500 hover:text-red-400 text-xs px-2 py-1 rounded"
      >
        Удалить
      </button>
    </div>
  );
}
