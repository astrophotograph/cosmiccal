import { useState, useEffect } from 'react';

type CalendarProps = {
  year?: number;
};

export const YearCalendar = ({ year = new Date().getFullYear() }: CalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showTilt, setShowTilt] = useState(false);

  // Add effect to trigger the tilt animation after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTilt(true);
    }, 2000); // 2 second delay

    return () => clearTimeout(timer);
  }, []);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const isToday = (date: Date, month: number, year: number) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           month === today.getMonth() &&
           year === today.getFullYear();
  };

  const isSelected = (date: number, month: number) => {
    return selectedDate?.getDate() === date &&
           selectedDate?.getMonth() === month &&
           selectedDate?.getFullYear() === year;
  };

  const handleDateClick = (date: number, month: number) => {
    setSelectedDate(new Date(year, month, date));
  };

  const renderMonth = (monthIndex: number) => {
    const daysInMonth = getDaysInMonth(monthIndex, year);
    const firstDay = getFirstDayOfMonth(monthIndex, year);

    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-6"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthIndex, day);
      const isCurrentDay = isToday(date, monthIndex, year);
      const isSelectedDay = isSelected(day, monthIndex);

      days.push(
        <div
          key={`day-${day}`}
          onClick={() => handleDateClick(day, monthIndex)}
          className={`h-6 flex items-center justify-center rounded-full cursor-pointer transition-colors text-xs
            ${isCurrentDay ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}
            ${isSelectedDay ? 'bg-blue-800 text-white' : ''}
          `}
        >
          {day}
        </div>
      );
    }

    return (
      <div key={monthIndex} className="bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-700">
        <div className="bg-gray-700 py-1 px-2 font-medium text-gray-200 border-b border-gray-600 text-sm">
          {months[monthIndex]}
        </div>
        <div className="p-2">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-[10px] text-center font-medium text-gray-400">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-gray-200">
            {days}
          </div>
        </div>
      </div>
    );
  };

  const calendarClass = `p-2 transition-all duration-5000 ${showTilt ? 'transform-3d-tilted' : ''}`;

  return (
    <div className={calendarClass}>
      <div className="grid grid-cols-4">
        {months.map((_, index) => renderMonth(index))}
      </div>
    </div>
  );
};
