import React, { useState } from 'react';

interface DayData {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPeriod: boolean;
  isOvulation: boolean;
  isFertile: boolean;
  isPredicted: boolean;
}

export const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];
  
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  
  const getDaysInMonth = (date: Date): DayData[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();
    
    const days: DayData[] = [];
    
    // Previous month's trailing days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startWeekday - 1; i >= 0; i--) {
      days.push({
        date: prevMonth.getDate() - i,
        isCurrentMonth: false,
        isToday: false,
        isPeriod: false,
        isOvulation: false,
        isFertile: false,
        isPredicted: false,
      });
    }
    
    // Current month's days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDay = new Date(year, month, day);
      const isToday = currentDay.toDateString() === today.toDateString();
      
      // Sample data for demonstration
      const isPeriod = [12, 13, 14, 15, 16].includes(day);
      const isOvulation = day === 26;
      const isFertile = [24, 25, 26, 27, 28].includes(day);
      const isPredicted = [10, 11, 12, 13, 14, 15, 16, 17].includes(day) && month === today.getMonth() + 1;
      
      days.push({
        date: day,
        isCurrentMonth: true,
        isToday,
        isPeriod,
        isOvulation,
        isFertile,
        isPredicted,
      });
    }
    
    // Next month's leading days
    const remainingSlots = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingSlots; day++) {
      days.push({
        date: day,
        isCurrentMonth: false,
        isToday: false,
        isPeriod: false,
        isOvulation: false,
        isFertile: false,
        isPredicted: false,
      });
    }
    
    return days;
  };
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };
  
  const days = getDaysInMonth(currentDate);
  
  const getDayClassName = (day: DayData): string => {
    let className = 'w-10 h-10 flex items-center justify-center text-sm font-medium rounded-lg transition-colors relative ';
    
    if (!day.isCurrentMonth) {
      className += 'text-gray-300 ';
    } else if (day.isToday) {
      className += 'bg-primary-600 text-white ';
    } else if (day.isPeriod) {
      className += 'bg-red-500 text-white ';
    } else if (day.isOvulation) {
      className += 'bg-purple-500 text-white ';
    } else if (day.isFertile) {
      className += 'bg-purple-100 text-purple-700 ';
    } else if (day.isPredicted) {
      className += 'bg-red-100 text-red-700 border border-red-300 ';
    } else {
      className += 'text-gray-700 hover:bg-gray-100 ';
    }
    
    return className;
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-medical p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-sm text-primary-600 hover:text-primary-700 transition-colors"
          >
            今日
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {weekdays.map(day => (
          <div key={day} className="w-10 h-8 flex items-center justify-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <button
            key={index}
            className={getDayClassName(day)}
          >
            {day.date}
            {day.isPeriod && (
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-red-600 rounded-full"></div>
            )}
            {day.isOvulation && (
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-purple-600 rounded-full"></div>
            )}
          </button>
        ))}
      </div>
      
      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600">生理日</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span className="text-gray-600">排卵日</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-100 border border-purple-300 rounded"></div>
            <span className="text-gray-600">妊娠しやすい日</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
            <span className="text-gray-600">予測日</span>
          </div>
        </div>
      </div>
    </div>
  );
};