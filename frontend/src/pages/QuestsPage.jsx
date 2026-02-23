import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import ConfirmModal from '../components/ConfirmModal';
import AddTaskModal from '../components/AddTaskModal';
import HistoryModal from '../components/HistoryModal';

// --- Вспомогательный компонент: Рулетка наград ---
const RollingValue = ({ isAnalyzing, value, colorClass, label }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let interval;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 150));
      }, 120);
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

const QuestsPage = ({ character, setCharacter, videos, triggerHaptic }) => {
  const [tasks, setTasks] = useState([]);
  const [history, setHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [confirmTask, setConfirmTask] = useState(null);

  // 1. Загрузка активных контрактов при входе (с проверкой просрочки на бэкенде)
  useEffect(() => {
    const fetchQuests = async () => {
      try {
        const res = await axios.get(`/api/quests/${character.telegram_id}`);
        setTasks(res.data);
      } catch (e) {
        console.error("Ошибка синхронизации списка задач");
      }
    };
    if (character?.telegram_id) fetchQuests();
  }, [character?.telegram_id]);

  // 2. Логика открытия истории (загрузка из БД)
  const handleOpenHistory = async () => {
    triggerHaptic?.('light');
    try {
      const res = await axios.get(`/api/quests/history/${character.telegram_id}`);
      setHistory(res.data);
      setIsHistoryOpen(true);
    } catch (e) {
      console.error("Не удалось подгрузить архив");
    }
  };

  // 3. Стилизация сложности (включая анимацию во время анализа)
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

  // 4. Добавление нового контракта (Gemini + DB Save)
  const onAddTask = async (basicData) => {
    const tempId = Date.now();
    const newTask = { id: tempId, title: basicData.title, deadline: basicData.deadline, isAnalyzing: true };
    
    setTasks(prev => [...prev, newTask]);
    setIsAddModalOpen(false);
    triggerHaptic?.('medium');

    try {
      // Шаг A: ИИ Анализ
      const aiRes = await axios.post('/api/analyze', { 
        ...basicData, 
        today: new Date().toISOString().split('T')[0] 
      });
      
      // Шаг B: Сохранение в Postgres через FastAPI
      const saveRes = await axios.post(`/api/quests/save/${character.telegram_id}`, {
        title: basicData.title,
        deadline: basicData.deadline,
        difficulty: aiRes.data.difficulty,
        xp_reward: aiRes.data.xp,
        gold_reward: aiRes.data.gold
      });

      // Шаг C: Завершение анимации "рулетки"
      setTimeout(() => {
        setTasks(prev => prev.map(t => t.id === tempId ? { ...saveRes.data, isSettling: true } : t));
        triggerHaptic?.('success');
        
        setTimeout(() => {
          setTasks(prev => prev.map(t => t.id === saveRes.data.id ? { ...t, isSettling: false } : t));
        }, 1000);
      }, 1500);
    } catch (error) {
      setTasks(prev => prev.filter(t => t.id !== tempId));
      console.error("Ошибка при создании контракта");
    }
  };

  // 5. Выполнение контракта (Reward + Level Up check)
  const finalizeTask = async () => {
    try {
      const res = await axios.post(`/api/quests/complete/${confirmTask.id}?tg_id=${character.telegram_id}`);
      
      setTasks(prev => prev.filter(t => t.id !== confirmTask.id));
      setCharacter(res.data.user); // Обновляем прогресс героя
      setConfirmTask(null);
      triggerHaptic?.('success');
      
      if (res.data.leveled_up) {
        console.log("LEVEL UP! Пора добавить салют!");
      }
    } catch (e) {
      console.error("Ошибка при закрытии контракта");
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden flex flex-col font-mono items-center">
      {/* Background Video Layer */}
      <div className="absolute inset-0 z-0">
        <video src={videos?.quests || ""} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center w-full h-full px-[4%]">
        <div className="w-full flex justify-between items-start mt-4">
          <Header title="Задания" subtitle="Активные контракты"/>
          <button 
            onClick={handleOpenHistory}
            className="mt-2 p-2 border border-[#daa520]/30 bg-[#daa520]/5 active:scale-90 transition-transform shadow-[0_0_10px_rgba(218,165,32,0.1)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#daa520" strokeWidth="2.5">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>

        {/* Quest List */}
        <div className="flex-1 w-full max-w-2xl overflow-y-auto space-y-4 pt-4 mb-[130px] custom-scrollbar">
          {tasks.length === 0 && !isAddModalOpen && (
            <div className="text-center py-20 opacity-30 uppercase text-[10px] tracking-widest">Нет активных контрактов</div>
          )}
          
          {tasks.map(task => {
            const diff = getDifficultyStyles(task);
            return (
              <div 
                key={task.id} 
                className={`group relative w-full bg-black/70 border p-4 flex items-center justify-between shadow-[6px_6px_0px_rgba(0,0,0,0.9)] transition-all duration-700 gap-3 
                ${task.isSettling ? 'scale-[1.03] border-[#daa520] shadow-[0_0_20px_rgba(218,165,32,0.3)]' : 'scale-100 border-white/10'}`}
              >
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                  <span className="text-white text-[14px] uppercase font-black tracking-tight leading-tight break-words">
                    {task.title}
                  </span>
                  
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className={`text-[9px] px-2 py-0.5 font-bold border rounded-sm uppercase tracking-widest transition-all duration-500 ${diff.color}`}>
                      {diff.label}
                    </span>
                    
                    <div className="flex items-center gap-2 border-l border-white/10 pl-2">
                      <RollingValue isAnalyzing={task.isAnalyzing} value={task.gold_reward} colorClass="text-[#daa520]" label="Gold" />
                      <RollingValue isAnalyzing={task.isAnalyzing} value={task.xp_reward} colorClass="text-[#a855f7]" label="XP" />
                    </div>
                  </div>
                </div>

                <button 
                  disabled={task.isAnalyzing}
                  onClick={() => { triggerHaptic?.('medium'); setConfirmTask(task); }}
                  className={`shrink-0 px-3 py-2.5 font-black text-[10px] uppercase shadow-[2px_2px_0_#000] transition-all 
                    ${task.isAnalyzing ? 'bg-white/5 text-white/10 opacity-50' : 'bg-[#daa520] text-black active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'}`}
                >
                  {task.isAnalyzing ? '???' : 'ВЫПОЛНИТЬ'}
                </button>
              </div>
            );
          })}

          {/* Add Quest Button Placeholder */}
          <div 
            onClick={() => { setIsAddModalOpen(true); triggerHaptic?.('light'); }} 
            className="w-full border-2 border-dashed border-[#daa520]/20 p-6 mt-4 text-center bg-black/30 active:bg-black/50 cursor-pointer group transition-all"
          >
            <span className="text-[11px] text-[#daa520]/60 group-active:text-[#daa520] tracking-[0.3em] uppercase font-black">
              + ДОБАВИТЬ КОНТРАКТ
            </span>
          </div>
        </div>
      </div>

      {/* Modals Section */}
      <ConfirmModal 
        task={confirmTask} 
        onConfirm={finalizeTask} 
        onCancel={() => setConfirmTask(null)} 
      />
      
      <HistoryModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        history={history} 
        triggerHaptic={triggerHaptic}
      />
      
      {isAddModalOpen && (
        <AddTaskModal 
          onAdd={onAddTask} 
          onClose={() => setIsAddModalOpen(false)} 
          triggerHaptic={triggerHaptic} 
        />
      )}
    </div>
  );
};

export default QuestsPage;