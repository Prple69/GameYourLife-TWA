import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Header from '../components/Header';
import ConfirmModal from '../components/ConfirmModal';
import AddTaskModal from '../components/AddTaskModal';
import QuestDetailsModal from '../components/QuestDetailsModal';

const DEBUG_MODE = false;

const RollingValue = ({ isAnalyzing, value, colorClass, label, prefix = '+' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    let interval;
    if (isAnalyzing) {
      interval = setInterval(() => setDisplayValue(Math.floor(Math.random() * 99)), 200);
    } else {
      setDisplayValue(Number(value) || 0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing, value]);

  return (
    <span className={`${colorClass} text-[9px] font-black uppercase`}>
      {prefix}
      {displayValue} {label}
    </span>
  );
};

const RetroStatus = ({ text }) => (
  <div
    className="min-h-screen bg-black flex items-center justify-center font-mono text-yellow-400 text-xs"
    style={{ fontFamily: "'Press Start 2P', monospace" }}
  >
    {text}
  </div>
);

const QuestsPage = () => {
  const queryClient = useQueryClient();
  const [confirmTask, setConfirmTask] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [optimisticTasks, setOptimisticTasks] = useState([]);

  const [visualTick, setVisualTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setVisualTick((t) => t + 1), 300);
    return () => clearInterval(interval);
  }, []);

  const {
    data: character,
    isLoading: userLoading,
  } = useQuery({
    queryKey: ['user'],
    queryFn: () => api.get('/user/me').then((r) => r.data),
    staleTime: 1000 * 60,
  });

  const {
    data: serverTasks = [],
    isLoading: questsLoading,
  } = useQuery({
    queryKey: ['quests'],
    queryFn: () => api.get('/quests/me').then((r) => r.data),
    staleTime: 1000 * 30,
  });

  const tasks = [...serverTasks, ...optimisticTasks];

  const completeMutation = useMutation({
    mutationFn: (questId) => api.post(`/quests/complete/${questId}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const getDifficultyStyles = (task) => {
    if (!task) return { label: '???', color: 'text-white' };
    const styles = {
      easy: { label: 'Легкий', color: 'text-[#4ade80] border-[#4ade80]/30 bg-[#4ade80]/10' },
      medium: { label: 'Средний', color: 'text-[#facc15] border-[#facc15]/30 bg-[#facc15]/10' },
      hard: { label: 'Тяжелый', color: 'text-[#ef4444] border-[#ef4444]/30 bg-[#ef4444]/10' },
      epic: { label: 'Эпический', color: 'text-[#a855f7] border-[#a855f7]/30 bg-[#a855f7]/10' },
    };
    if (task.isAnalyzing) {
      const keys = ['easy', 'medium', 'hard', 'epic'];
      return styles[keys[visualTick % 4]];
    }
    return styles[task.difficulty] || styles.easy;
  };

  const onAddTask = async (basicData) => {
    if (!character) return;

    const tempId = `tmp-${Date.now()}`;
    const tempTask = {
      id: tempId,
      title: basicData.title,
      deadline: basicData.deadline,
      isAnalyzing: true,
      xp_reward: 0,
      gold_reward: 0,
      hp_penalty: 0,
    };

    setOptimisticTasks((prev) => [...prev, tempTask]);
    setIsAddModalOpen(false);

    try {
      const analysisPayload = {
        ...basicData,
        current_hp: character.hp,
        max_hp: character.max_hp,
        lvl: character.lvl,
      };

      let analyzedData;
      try {
        const response = await api.post('/analyze', analysisPayload);
        analyzedData = response.data;
      } catch (e) {
        if (DEBUG_MODE) {
          analyzedData = {
            difficulty: ['easy', 'medium', 'hard', 'epic'][Math.floor(Math.random() * 4)],
            xp: 50,
            gold: 20,
            hp_penalty: 15,
          };
        } else {
          throw e;
        }
      }

      await api.post('/quests/save', {
        title: basicData.title,
        deadline: basicData.deadline,
        difficulty: analyzedData.difficulty,
        xp_reward: analyzedData.xp,
        gold_reward: analyzedData.gold,
        hp_penalty: analyzedData.hp_penalty,
      });

      setOptimisticTasks((prev) => prev.filter((t) => t.id !== tempId));
      queryClient.invalidateQueries({ queryKey: ['quests'] });
    } catch (error) {
      console.error('Ошибка при создании', error);
      setOptimisticTasks((prev) => prev.filter((t) => t.id !== tempId));
    }
  };

  const finalizeTask = async () => {
    if (!confirmTask) return;
    try {
      await completeMutation.mutateAsync(confirmTask.id);
      setConfirmTask(null);
    } catch (e) {
      console.error(e);
    }
  };

  if (userLoading || questsLoading) return <RetroStatus text="ЗАГРУЗКА КОНТРАКТОВ..." />;

  return (
    <div className="min-h-screen w-full bg-black flex flex-col font-mono items-center relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full h-full px-[4%] max-w-full">
        <Header title="Задания" subtitle={DEBUG_MODE ? 'DEBUG ACTIVE' : 'Контракты'} />

        <div className="flex-1 w-full max-w-2xl overflow-y-auto overflow-x-hidden space-y-4 pt-4 mb-[130px] custom-scrollbar">
          {Array.isArray(tasks) && tasks.length > 0 ? (
            tasks.map((task) => {
              const diff = getDifficultyStyles(task);
              return (
                <div
                  key={task.id}
                  className="group relative w-full max-w-full overflow-hidden bg-black/80 border border-white/10 p-4 flex items-center justify-between shadow-[6px_6px_0px_rgba(0,0,0,0.9)] gap-3 active:bg-white/5 transition-colors"
                  onClick={() => !task.isAnalyzing && setSelectedDetails(task)}
                >
                  <div className="flex flex-col gap-2 min-w-0 flex-1">
                    <span className="text-white text-[14px] uppercase font-black truncate">
                      {task.title}
                    </span>

                    <div className="flex flex-wrap gap-2 items-center">
                      <span
                        className={`text-[8px] px-1.5 py-0.5 font-bold border rounded-sm uppercase ${diff.color} whitespace-nowrap`}
                      >
                        {diff.label}
                      </span>

                      <div className="flex items-center gap-3 border-l border-white/10 pl-2 overflow-hidden">
                        <RollingValue
                          isAnalyzing={task.isAnalyzing}
                          value={task.gold_reward || 0}
                          colorClass="text-[#daa520]"
                          label="G"
                        />
                        <RollingValue
                          isAnalyzing={task.isAnalyzing}
                          value={task.xp_reward || 0}
                          colorClass="text-[#a855f7]"
                          label="XP"
                        />
                        <RollingValue
                          isAnalyzing={task.isAnalyzing}
                          value={task.hp_penalty || 0}
                          colorClass="text-red-500"
                          label="HP"
                          prefix="-"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={task.isAnalyzing}
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmTask(task);
                    }}
                    className={`shrink-0 px-4 py-2 font-black text-[10px] uppercase shadow-[2px_2px_0_#000]
                      ${
                        task.isAnalyzing
                          ? 'bg-white/5 text-white/10'
                          : 'bg-[#daa520] text-black active:shadow-none'
                      }`}
                  >
                    {task.isAnalyzing ? '???' : 'OK'}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 opacity-30 text-[10px] uppercase tracking-widest">
              Список контрактов пуст
            </div>
          )}

          <div
            onClick={() => setIsAddModalOpen(true)}
            className="w-full border-2 border-dashed border-[#daa520]/20 p-6 mt-4 text-center bg-black/30 active:bg-black/50 transition-all cursor-pointer"
          >
            <span className="text-[11px] text-[#daa520]/60 uppercase font-black tracking-widest">
              + НОВЫЙ КОНТРАКТ
            </span>
          </div>
        </div>
      </div>

      <QuestDetailsModal
        task={selectedDetails}
        character={character}
        onClose={() => setSelectedDetails(null)}
      />
      <ConfirmModal
        task={confirmTask}
        onConfirm={finalizeTask}
        onCancel={() => setConfirmTask(null)}
      />
      {isAddModalOpen && (
        <AddTaskModal onAdd={onAddTask} onClose={() => setIsAddModalOpen(false)} />
      )}
    </div>
  );
};

export default QuestsPage;
