import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import ConfirmModal from '../components/ConfirmModal';
import AddTaskModal from '../components/AddTaskModal';

// --- Компонент для рулетки Gold и XP ---
const RollingValue = ({ isAnalyzing, value, colorClass, label }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let interval;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 150));
      }, 150);
    } else {
      setDisplayValue(value);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing, value]);

  return (
    <span className={`${colorClass} text-[9px] font-black uppercase transition-all duration-700 ${!isAnalyzing ? 'scale-110' : ''}`}>
      +{displayValue} {label}
    </span>
  );
};

// --- Компонент Истории (Modal) ---
const HistoryModal = ({ isOpen, onClose, history }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col p-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6 border-b border-[#daa520]/30 pb-4">
        <h2 className="text-[#daa520] font-black italic text-xl tracking-tighter uppercase">Архив контрактов</h2>
        <button onClick={onClose} className="text-white/50 hover:text-white font-black">ЗАКРЫТЬ</button>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
        {history.length === 0 && <p className="text-white/20 text-center py-10 uppercase text-xs">Архив пуст...</p>}
        {history.map(item => (
          <div key={item.id} className="bg-white/5 border border-white/10 p-3 opacity-60 flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <span className="text-white/80 text-[12px] uppercase font-bold">{item.title}</span>
              <span className="text-[#4ade80] text-[8px] font-black uppercase">Выполнено</span>
            </div>
            <div className="text-right">
              <div className="text-[#daa520] text-[9px] font-black">+{item.gold_reward || item.gold} G</div>
              <div className="text-white/30 text-[8px]">{item.deadline}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const QuestsPage = ({ character, setCharacter, videos, triggerHaptic }) => {
  const [tasks, setTasks] = useState([]);
  const [history, setHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [confirmTask, setConfirmTask] = useState(null);

  // Симуляция тика для анимаций
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 500);
    return () => clearInterval(timer);
  }, []);

  // Загрузка данных при старте
  useEffect(() => {
    const fetchQuests = async () => {
      try {
        const res = await axios.get(`/api/quests/${character.telegram_id}`);
        setTasks(res.data);
      } catch (e) { console.error("Ошибка загрузки квестов"); }
    };
    fetchQuests();
  }, [character.telegram_id]);

  const getDifficultyStyles = (task) => {
    const styles = {
      easy: { label: 'Легкий', color: 'text-[#4ade80] border-[#4ade80]/30 bg-[#4ade80]/10' },
      medium: { label: 'Средний', color: 'text-[#facc15] border-[#facc15]/30 bg-[#facc15]/10' },
      hard: { label: 'Тяжелый', color: 'text-[#ef4444] border-[#ef4444]/30 bg-[#ef4444]/10' },
      epic: { label: 'Эпический', color: 'text-[#a855f7] border-[#a855f7]/30 bg-[#a855f7]/10' }
    };
    if (task.isAnalyzing) {
      const keys = ['easy', 'medium', 'hard', 'epic'];
      const currentKey = keys[Math.floor((Date.now() / 500) % keys.length)];
      return styles[currentKey];
    }
    return styles[task.difficulty] || styles.easy;
  };

  const onAddTask = async (basicData) => {
    const tempId = Date.now();
    const newTask = { id: tempId, title: basicData.title, deadline: basicData.deadline, difficulty: 'easy', xp: 0, gold: 0, isAnalyzing: true };
    setTasks(prev => [...prev, newTask]);
    setIsAddModalOpen(false);
    triggerHaptic?.('medium');

    try {
      const response = await axios.post('/api/analyze', basicData);
      // Сначала сохраняем в БД, потом обновляем фронт
      const saveRes = await axios.post(`/api/quests/save/${character.telegram_id}`, {
        ...basicData,
        difficulty: response.data.difficulty,
        xp_reward: response.data.xp,
        gold_reward: response.data.gold
      });

      setTimeout(() => {
        setTasks(prev => prev.map(t => t.id === tempId ? { ...saveRes.data, isSettling: true } : t));
        triggerHaptic?.('success');
        setTimeout(() => {
          setTasks(prev => prev.map(t => t.id === saveRes.data.id ? { ...t, isSettling: false } : t));
        }, 1000);
      }, 1500);
    } catch (error) {
      setTasks(prev => prev.filter(t => t.id !== tempId));
    }
  };

  const finalizeTask = async () => {
    try {
      const res = await axios.post(`/api/quests/complete/${confirmTask.id}?tg_id=${character.telegram_id}`);
      
      // Добавляем в локальную историю
      setHistory(prev => [confirmTask, ...prev]);
      // Убираем из активных
      setTasks(prev => prev.filter(t => t.id !== confirmTask.id));
      // Обновляем персонажа (статы + левелап)
      setCharacter(res.data.user);
      
      setConfirmTask(null);
      triggerHaptic?.('success');
    } catch (e) { console.error("Ошибка завершения"); }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden flex flex-col font-mono items-center">
      <div className="absolute inset-0 z-0">
        <video src={videos?.quests || ""} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full h-full px-[4%]">
        <div className="w-full flex justify-between items-start mt-4">
          <Header title="Задания" subtitle="Активные контракты"/>
          {/* КНОПКА ИСТОРИИ */}
          <button 
            onClick={() => { setIsHistoryOpen(true); triggerHaptic?.('light'); }}
            className="mt-2 p-2 border border-[#daa520]/30 bg-[#daa520]/5 active:bg-[#daa520]/20 rounded-sm"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#daa520" strokeWidth="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>

        <div className="flex-1 w-full max-w-2xl overflow-y-auto space-y-4 pt-4 mb-[130px] custom-scrollbar">
          {tasks.map(task => {
            const diff = getDifficultyStyles(task);
            return (
              <div 
                key={task.id} 
                className={`group relative w-full bg-black/70 border p-4 flex items-center justify-between shadow-[6px_6px_0px_rgba(0,0,0,0.9)] transition-all duration-700 gap-3 
                ${task.isSettling ? 'scale-[1.03] border-[#daa520] shadow-[0_0_20px_rgba(218,165,32,0.3)]' : 'scale-100 border-white/10'}`}
              >
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                  <span className="text-white text-[14px] uppercase font-black tracking-tight leading-tight break-words">{task.title}</span>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className={`text-[9px] px-2 py-0.5 font-bold border rounded-sm uppercase tracking-widest transition-all duration-500 ${diff.color}`}>
                      {diff.label}
                    </span>
                    <div className="flex items-center gap-2 border-l border-white/10 pl-2">
                      <RollingValue isAnalyzing={task.isAnalyzing} value={task.gold_reward || task.gold} colorClass="text-[#daa520]" label="Gold" />
                      <RollingValue isAnalyzing={task.isAnalyzing} value={task.xp_reward || task.xp} colorClass="text-[#a855f7]" label="XP" />
                    </div>
                  </div>
                </div>

                <button 
                  disabled={task.isAnalyzing}
                  onClick={() => { triggerHaptic?.('medium'); setConfirmTask(task); }}
                  className={`shrink-0 px-3 py-2.5 font-black text-[10px] uppercase shadow-[2px_2px_0_#000] transition-all 
                    ${task.isAnalyzing ? 'bg-white/5 text-white/10 opacity-50' : 'bg-[#daa520] text-black active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'}`}
                >
                  {task.isAnalyzing ? '???' : 'ВЫПОЛНЕНО'}
                </button>
              </div>
            );
          })}

          <div onClick={() => { setIsAddModalOpen(true); triggerHaptic?.('light'); }} className="w-full border-2 border-dashed border-[#daa520]/20 p-6 mt-4 text-center bg-black/30 active:bg-black/50 cursor-pointer group transition-all">
            <span className="text-[11px] text-[#daa520]/60 group-active:text-[#daa520] tracking-[0.3em] uppercase font-black">+ ДОБАВИТЬ КОНТРАКТ</span>
          </div>
        </div>
      </div>

      <ConfirmModal task={confirmTask} onConfirm={finalizeTask} onCancel={() => setConfirmTask(null)} />
      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} history={history} />
      {isAddModalOpen && <AddTaskModal onAdd={onAddTask} onClose={() => setIsAddModalOpen(false)} triggerHaptic={triggerHaptic} />}
    </div>
  );
};

export default QuestsPage;