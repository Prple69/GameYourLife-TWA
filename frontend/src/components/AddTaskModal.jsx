import React, { useState } from 'react';

const AddTaskModal = ({ onAdd, onClose }) => {
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');

  const handleSubmit = () => {
    if (!title.trim() || !deadline) return;
    // Передаем данные наверх. Поле difficulty тут не выбирается.
    onAdd({ title, deadline });
    setTitle('');
    setDeadline('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/80">
      <div className="w-full max-w-sm bg-[#111] border-2 border-white/10 p-6 shadow-[10px_10px_0px_#000]">
        <h2 className="text-white text-xl font-black uppercase mb-6 tracking-tighter">Новый контракт</h2>
        
        <div className="space-y-6">
          {/* НАЗВАНИЕ */}
          <div>
            <label className="text-white/40 text-[9px] uppercase font-black mb-2 block tracking-widest">Суть задания</label>
            <input 
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 p-3 text-white font-mono text-sm focus:border-[#daa520] outline-none transition-colors"
              placeholder="Напр: Прочитать 20 страниц..."
            />
          </div>

          {/* ДАТА (iOS/Android Friendly) */}
          <div>
            <label className="text-white/40 text-[9px] uppercase font-black mb-2 block tracking-widest">Выполнить до</label>
            <input 
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-white/5 border border-white/10 p-3 text-white font-mono text-sm focus:border-[#daa520] outline-none appearance-none"
              style={{ colorScheme: 'dark' }} // Делает календарь темным в Chrome
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-10">
          <button 
            onClick={onClose}
            className="py-3 text-white/40 font-black uppercase text-[10px] tracking-widest"
          >
            НАЗАД
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!title.trim() || !deadline}
            className="py-3 bg-white text-black font-black uppercase text-[10px] shadow-[3px_3px_0px_#daa520] disabled:opacity-20 transition-opacity"
          >
            ОЦЕНИТЬ
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;