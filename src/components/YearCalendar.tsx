import { useState } from 'react';

type CalendarProps = {
  year?: number;
};

const YearCalendar = ({ year = new Date().getFullYear() }: CalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
      days.push(<div key={`empty-${i}`} className="h-8"></div>);
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
          className={`h-8 flex items-center justify-center rounded-full cursor-pointer transition-colors
            ${isCurrentDay ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}
            ${isSelectedDay ? 'bg-blue-200' : ''}
          `}
        >
          {day}
        </div>
      );
    }

    return (
      <div key={monthIndex} className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gray-50 py-2 px-3 font-medium text-gray-700 border-b">
          {months[monthIndex]}
        </div>
        <div className="p-3">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-xs text-center font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-sm">
            {days}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-800">{year} Calendar</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {months.map((_, index) => renderMonth(index))}
      </div>
    </div>
  );
};

export default YearCalendar;
