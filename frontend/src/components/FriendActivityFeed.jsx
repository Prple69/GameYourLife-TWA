export default function FriendActivityFeed({ activity }) {
  if (!activity || activity.length === 0) {
    return <p className="text-gray-500 text-sm text-center py-4">Нет активности за последние 7 дней</p>;
  }

  const formatTime = (ts) => {
    const diff = Date.now() - new Date(ts).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'только что';
    if (hours < 24) return `${hours}ч назад`;
    return `${Math.floor(hours / 24)}д назад`;
  };

  return (
    <ul className="space-y-2">
      {activity.map((item, idx) => (
        <li key={idx} className="flex items-start gap-3 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm">
          <div className="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {item.display_name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-yellow-400 font-medium">{item.display_name}</span>
            <span className="text-gray-300"> выполнил(а) квест </span>
            <span className="text-white font-medium">«{item.event_data?.quest_title}»</span>
            {item.event_data?.difficulty && (
              <span className="text-gray-500 ml-1">({item.event_data.difficulty})</span>
            )}
          </div>
          <span className="text-gray-500 text-xs flex-shrink-0">{formatTime(item.timestamp)}</span>
        </li>
      ))}
    </ul>
  );
}
