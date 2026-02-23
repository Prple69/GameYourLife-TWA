import React, { useState, useEffect } from 'react';
import Picker from 'react-mobile-picker';

const BrutalDatePicker = ({ value, onChange }) => {
  // Генерируем данные для барабанов
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear + i).toString());

  // Разбиваем пришедшую дату "YYYY-MM-DD" на части
  const [pickerValue, setPickerValue] = useState({
    day: value?.split('-')[2] || '01',
    month: value?.split('-')[1] || '01',
    year: value?.split('-')[0] || currentYear.toString()
  });

  const handleChange = (newValue) => {
    setPickerValue(newValue);
    onChange(`${newValue.year}-${newValue.month}-${newValue.day}`);
  };

  return (
    <div className="relative bg-black/50 border border-white/10 p-2 overflow-hidden h-[150px] font-mono">
      {/* Центрирующая рамка (визуальный фокус) */}
      <div className="absolute top-1/2 left-0 w-full h-8 -translate-y-1/2 border-y border-[#daa520]/30 pointer-events-none" />
      
      <Picker value={pickerValue} onChange={handleChange} wheelMode="normal">
        {Object.keys(pickerValue).map(name => (
          <Picker.Column key={name} name={name}>
            {(name === 'day' ? days : name === 'month' ? months : years).map(option => (
              <Picker.Item key={option} value={option}>
                {({ selected }) => (
                  <div className={`text-center transition-all ${selected ? 'text-[#daa520] font-black scale-110' : 'text-white/20 text-xs'}`}>
                    {option}
                  </div>
                )}
              </Picker.Item>
            ))}
          </Picker.Column>
        ))}
      </Picker>
    </div>
  );
};

export default BrutalDatePicker;