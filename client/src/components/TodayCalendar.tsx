import { useState } from "react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { TaskEvent } from "@shared/schema";
import { LIFE_AREAS, formatTimeSlot, TIME_SLOTS, getTodayDate } from "@/lib/constants";
import { Plus, MapPin, Clock, ChevronLeft, ChevronRight, ArrowLeft, Calendar } from "lucide-react";

interface TodayCalendarProps {
  taskEvents: TaskEvent[];
  onEditTaskEvent: (taskEvent: TaskEvent) => void;
  onAddEvent: (timeSlot: string, date?: string) => void;
  onDateClick?: (date: string) => void;
  today: string;
}

export default function TodayCalendar({ taskEvents, onEditTaskEvent, onAddEvent, onDateClick, today }: TodayCalendarProps) {
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'month'>('today');
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);
  // Generate upcoming days (today + next 6 days for a week view)
  const generateUpcomingDays = (startDate: string, count: number) => {
    const days = [];
    const start = new Date(startDate);
    
    for (let i = 0; i < count; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      days.push({
        date: currentDate.toISOString().split('T')[0],
        dayName: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
        dayNameShort: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
        monthDay: currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
        fullDate: currentDate.toLocaleDateString('en-US', { 
          weekday: 'long',
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        weekNumber: getWeekNumber(currentDate),
        isToday: currentDate.toISOString().split('T')[0] === today
      });
    }
    return days;
  };

  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const getEventsForDate = (date: string) => {
    return taskEvents.filter(event => event.date === date);
  };

  const getEventsForTimeSlot = (timeSlot: string) => {
    return taskEvents.filter(event => event.date === selectedDate && event.startTime === timeSlot && !event.isAllDay);
  };

  const getFlexibleTimeEvents = (date: string) => {
    return taskEvents.filter(event => event.date === date && event.isAllDay);
  };

  const getScheduledEvents = (date: string) => {
    return taskEvents.filter(event => event.date === date && !event.isAllDay);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleDateCellClick = (date: string) => {
    if (clickTimer) {
      // This is a double click
      clearTimeout(clickTimer);
      setClickTimer(null);
      setSelectedDate(date);
      setViewMode('today');
    } else {
      // This might be a single click, wait to see if double click follows
      const timer = setTimeout(() => {
        setSelectedDate(date);
        if (onDateClick) {
          onDateClick(date);
        }
        setClickTimer(null);
      }, 300);
      setClickTimer(timer);
    }
  };

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setViewMode('today');
  };

  const handleBackToWeek = () => {
    setViewMode('today');
  };

  const handleTodayClick = () => {
    setSelectedDate(getTodayDate());
    setViewMode('today');
  };

  const upcomingDays = generateUpcomingDays(today, 7);

  // Render Today View (single day)
  if (viewMode === 'today') {
    return (
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={handleTodayClick}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      viewMode === 'today' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Today
                  </button>
                  <button 
                    onClick={() => setViewMode('week')}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      viewMode === 'week' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Week
                  </button>
                  <button 
                    onClick={() => setViewMode('month')}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      viewMode === 'month' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Month
                  </button>
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => {
                      const prevDate = new Date(selectedDate);
                      prevDate.setDate(prevDate.getDate() - 1);
                      setSelectedDate(prevDate.toISOString().split('T')[0]);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-xl font-semibold text-gray-900 min-w-[280px] text-center">
                    {formatDate(selectedDate)}
                  </h2>
                  <button 
                    onClick={() => {
                      const nextDate = new Date(selectedDate);
                      nextDate.setDate(nextDate.getDate() + 1);
                      setSelectedDate(nextDate.toISOString().split('T')[0]);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button 
                onClick={() => onAddEvent('09:00')}
                className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                + Add Event
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Drop Zone for "Sometime Today" */}
            <Droppable droppableId="convert-to-flexible-time">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`mb-4 border-2 border-dashed rounded-lg p-4 transition-all ${
                    snapshot.isDraggingOver
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {snapshot.isDraggingOver
                        ? 'Drop here to schedule for "sometime today"'
                        : 'Drag tasks or scheduled events here for flexible time'}
                    </span>
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {/* Flexible Time Events Section */}
            {getFlexibleTimeEvents(selectedDate).length > 0 && (
              <Droppable droppableId="flexible-time-events">
                {(provided) => (
                  <div className="mb-6" ref={provided.innerRef} {...provided.droppableProps}>
                    <div className="space-y-2">
                      {getFlexibleTimeEvents(selectedDate).map((event, index) => {
                        // Transform title for flexible time events - replace "tomorrow" with "sometime today"
                        const displayTitle = event.title
                          .replace(/\btomorrow\b/gi, 'sometime today')
                          .replace(/\bnext week\b/gi, 'this week')
                          .replace(/\btoday\b/gi, 'sometime today')
                          .replace(/\bsometime sometime today\b/gi, 'sometime today'); // Fix double "sometime"
                        
                        return (
                          <Draggable key={event.id} draggableId={event.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => onEditTaskEvent(event)}
                                className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                                  snapshot.isDragging ? 'shadow-lg rotate-2 scale-105' : ''
                                }`}
                                style={{ 
                                  backgroundColor: `${LIFE_AREAS[event.category as keyof typeof LIFE_AREAS]?.color}20`,
                                  borderLeft: `4px solid ${LIFE_AREAS[event.category as keyof typeof LIFE_AREAS]?.color}`,
                                  ...provided.draggableProps.style
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium text-gray-900">{displayTitle}</span>
                                      {event.location && (
                                        <span className="text-sm text-gray-500 flex items-center">
                                          <MapPin className="w-3 h-3 mr-1" />
                                          {event.location}
                                        </span>
                                      )}
                                    </div>
                                    {event.notes && (
                                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{event.notes}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span 
                                      className="text-xs px-2 py-1 rounded-full text-white font-medium"
                                      style={{ backgroundColor: LIFE_AREAS[event.category as keyof typeof LIFE_AREAS]?.color }}
                                    >
                                      {LIFE_AREAS[event.category as keyof typeof LIFE_AREAS]?.name}
                                    </span>
                                    {event.completed && (
                                      <span className="text-xs text-gray-500">✓</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                    <div className="mt-4 border-b border-gray-200"></div>
                  </div>
                )}
              </Droppable>
            )}
            
            {/* Time Slots Section */}
            <div className="space-y-1">
              {TIME_SLOTS.map((timeSlot) => {
                const events = getEventsForTimeSlot(timeSlot);
                
                return (
                  <Droppable key={timeSlot} droppableId={`calendar-${timeSlot}`}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex border-b border-gray-100 py-3 hover:bg-gray-50 transition-colors ${
                          snapshot.isDraggingOver ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="w-16 flex-shrink-0">
                          <span className="text-sm text-gray-500">{formatTimeSlot(timeSlot)}</span>
                        </div>
                        <div className="flex-1 min-h-[60px] relative">
                          {/* Clickable area for adding new events */}
                          {events.length === 0 && (
                            <div 
                              onClick={() => onAddEvent(timeSlot)}
                              className={`absolute inset-0 border-2 border-dashed rounded-lg transition-colors cursor-pointer hover:bg-blue-25 hover:border-blue-300 group ${
                                snapshot.isDraggingOver 
                                  ? 'border-blue-400 bg-blue-50' 
                                  : 'border-transparent hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center justify-center h-full opacity-0 group-hover:opacity-60 transition-opacity">
                                <span className="text-xs text-gray-500 font-medium">+ Add Event</span>
                              </div>
                            </div>
                          )}

                          {/* Existing events */}
                          {events.map((event, index) => (
                            <Draggable key={event.id} draggableId={event.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => onEditTaskEvent(event)}
                                  className={`p-3 mb-2 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-md ${
                                    snapshot.isDragging ? 'shadow-lg rotate-2 scale-105' : ''
                                  } ${
                                    event.category && LIFE_AREAS[event.category as keyof typeof LIFE_AREAS]
                                      ? LIFE_AREAS[event.category as keyof typeof LIFE_AREAS].bgColor 
                                      : 'bg-gray-50'
                                  }`}
                                  style={{ 
                                    borderLeftColor: event.category && LIFE_AREAS[event.category as keyof typeof LIFE_AREAS]
                                      ? LIFE_AREAS[event.category as keyof typeof LIFE_AREAS].color 
                                      : '#6B7280',
                                    ...provided.draggableProps.style 
                                  }}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className={`font-medium text-sm ${
                                        event.completed ? 'line-through opacity-60' : ''
                                      }`}>
                                        {event.title}
                                      </h4>
                                      <div className="flex items-center space-x-2 mt-1">
                                        <span className="text-xs text-gray-500">
                                          {formatTimeSlot(event.startTime)} - {formatTimeSlot(event.endTime)}
                                        </span>
                                        {event.location && (
                                          <div className="flex items-center text-xs text-gray-500">
                                            <MapPin className="w-3 h-3 mr-1" />
                                            {event.location}
                                          </div>
                                        )}
                                      </div>
                                      {event.notes && (
                                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{event.notes}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Month view
  if (viewMode === 'month') {
    const currentDate = new Date(selectedDate);
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Get first day of month and calculate calendar grid
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Create calendar grid (6 weeks max)
    const calendarDays = [];
    const totalCells = 42; // 6 weeks × 7 days
    
    // Previous month overflow days
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      calendarDays.push({
        day,
        date: new Date(prevYear, prevMonth, day),
        isCurrentMonth: false,
        dateString: new Date(prevYear, prevMonth, day).toISOString().split('T')[0]
      });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push({
        day,
        date: new Date(currentYear, currentMonth, day),
        isCurrentMonth: true,
        dateString: new Date(currentYear, currentMonth, day).toISOString().split('T')[0]
      });
    }
    
    // Next month overflow days
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const remainingCells = totalCells - calendarDays.length;
    
    for (let day = 1; day <= remainingCells; day++) {
      calendarDays.push({
        day,
        date: new Date(nextYear, nextMonth, day),
        isCurrentMonth: false,
        dateString: new Date(nextYear, nextMonth, day).toISOString().split('T')[0]
      });
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={handleTodayClick}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      viewMode === 'today' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Today
                  </button>
                  <button 
                    onClick={() => setViewMode('week')}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      viewMode === 'week' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Week
                  </button>
                  <button 
                    onClick={() => setViewMode('month')}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      viewMode === 'month' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Month
                  </button>
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => {
                      const prevMonth = new Date(currentYear, currentMonth - 1, 1);
                      setSelectedDate(prevMonth.toISOString().split('T')[0]);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-xl font-semibold text-gray-900 min-w-[280px] text-center">
                    {monthNames[currentMonth]} {currentYear}
                  </h2>
                  <button 
                    onClick={() => {
                      const nextMonth = new Date(currentYear, currentMonth + 1, 1);
                      setSelectedDate(nextMonth.toISOString().split('T')[0]);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button 
                onClick={() => onAddEvent('09:00')}
                className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                + Add Event
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Month Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="bg-gray-50 p-3 text-center text-sm font-medium text-gray-600">
                  {day}
                </div>
              ))}
              
              {/* Calendar Days */}
              {calendarDays.map((calDay, index) => {
                const dayEvents = getScheduledEvents(calDay.dateString);
                const flexibleEvents = getFlexibleTimeEvents(calDay.dateString);
                const isToday = calDay.dateString === getTodayDate();
                const isSelected = calDay.dateString === selectedDate;
                
                return (
                  <Droppable key={`month-${calDay.dateString}`} droppableId={`day-${calDay.dateString}`}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        onClick={() => handleDateCellClick(calDay.dateString)}
                        className={`bg-white min-h-[120px] p-2 cursor-pointer transition-all ${
                          snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-blue-300' : ''
                        } ${
                          isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''
                        } ${
                          isToday ? 'bg-blue-50' : ''
                        } hover:bg-gray-50`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-medium ${
                            !calDay.isCurrentMonth ? 'text-gray-400' : 
                            isToday ? 'text-blue-600 font-bold' : 'text-gray-900'
                          }`}>
                            {calDay.day}
                          </span>
                          {(dayEvents.length > 0 || flexibleEvents.length > 0) && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        
                        {/* Events for this day */}
                        <div className="space-y-1">
                          {/* Flexible time events */}
                          {flexibleEvents.slice(0, 2).map((event, idx) => {
                            const displayTitle = event.title
                              .replace(/\btomorrow\b/gi, 'sometime today')
                              .replace(/\bnext week\b/gi, 'this week')
                              .replace(/\btoday\b/gi, 'sometime today')
                              .replace(/\bsometime sometime today\b/gi, 'sometime today');
                            
                            return (
                              <Draggable key={event.id} draggableId={event.id} index={idx}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditTaskEvent(event);
                                    }}
                                    className={`text-xs p-1 rounded text-white truncate cursor-pointer ${
                                      snapshot.isDragging ? 'shadow-lg z-50' : ''
                                    }`}
                                    style={{
                                      backgroundColor: LIFE_AREAS[event.category as keyof typeof LIFE_AREAS]?.color,
                                      ...provided.draggableProps.style
                                    }}
                                  >
                                    {displayTitle}
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          
                          {/* Scheduled events */}
                          {dayEvents.slice(0, 3 - flexibleEvents.length).map((event: TaskEvent, idx: number) => (
                            <Draggable key={event.id} draggableId={event.id} index={idx + flexibleEvents.length}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditTaskEvent(event);
                                  }}
                                  className={`text-xs p-1 rounded text-white truncate cursor-pointer ${
                                    snapshot.isDragging ? 'shadow-lg z-50' : ''
                                  }`}
                                  style={{
                                    backgroundColor: LIFE_AREAS[event.category as keyof typeof LIFE_AREAS]?.color,
                                    ...provided.draggableProps.style
                                  }}
                                >
                                  {event.startTime} {event.title}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          
                          {/* Show "+N more" if there are additional events */}
                          {(dayEvents.length + flexibleEvents.length) > 3 && (
                            <div className="text-xs text-gray-500 font-medium">
                              +{(dayEvents.length + flexibleEvents.length) - 3} more
                            </div>
                          )}
                        </div>
                        
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Week view
  return (
    <div className="lg:col-span-2">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[600px]">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleTodayClick}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  viewMode === 'today' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Today
              </button>

              <button 
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  viewMode === 'week' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Week
              </button>
              <button 
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  viewMode === 'month' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Month
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium px-3 py-1.5 bg-gray-100 rounded-lg">
                {selectedDate === today ? 'Today' : formatDate(selectedDate)}
              </span>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Days */}
        <div className="p-6 space-y-6">
          {upcomingDays.map((day) => {
            const dayEvents = getEventsForDate(day.date);
            
            return (
              <div key={day.date} className="space-y-3">
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className={`text-sm font-medium ${
                        day.isToday ? 'text-orange-600' : 'text-gray-500'
                      }`}>
                        {day.isToday ? 'Today' : day.dayName}
                      </h3>
                      {day.isToday && (
                        <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                          Today
                        </span>
                      )}
                    </div>
                    <h2 
                      onClick={() => handleDateClick(day.date)}
                      className="text-xl font-semibold text-gray-900 mt-0.5 cursor-pointer hover:text-blue-600 transition-colors"
                    >
                      {day.monthDay}, {new Date(day.date).getFullYear()}
                    </h2>
                    <span className="text-xs text-gray-400 mt-0.5">Week {day.weekNumber}</span>
                  </div>
                </div>

                {/* Day Content */}
                <Droppable droppableId={`day-${day.date}`}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`border-2 border-dashed rounded-xl min-h-[120px] transition-all ${
                        snapshot.isDraggingOver 
                          ? 'border-blue-300 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Add Event Button */}
                      {dayEvents.length === 0 && !snapshot.isDraggingOver && (
                        <div 
                          onClick={() => onAddEvent('09:00')} // Default to 9 AM for agenda view
                          className="h-full flex items-center justify-center cursor-pointer group"
                        >
                          <div className="flex items-center space-x-2 text-gray-400 group-hover:text-gray-600 transition-colors">
                            <Plus className="w-5 h-5" />
                            <span className="text-sm">Add Event</span>
                          </div>
                        </div>
                      )}

                      {/* Events */}
                      {dayEvents.length > 0 && (
                        <div className="p-4 space-y-3">
                          {dayEvents.map((event, index) => (
                            <Draggable key={event.id} draggableId={event.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => onEditTaskEvent(event)}
                                  className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md group ${
                                    snapshot.isDragging ? 'shadow-lg scale-105' : ''
                                  } ${
                                    event.category && LIFE_AREAS[event.category as keyof typeof LIFE_AREAS]
                                      ? LIFE_AREAS[event.category as keyof typeof LIFE_AREAS].bgColor 
                                      : 'bg-gray-50'
                                  } ${
                                    event.category && LIFE_AREAS[event.category as keyof typeof LIFE_AREAS]
                                      ? LIFE_AREAS[event.category as keyof typeof LIFE_AREAS].borderColor 
                                      : 'border-gray-200'
                                  }`}
                                  style={provided.draggableProps.style}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-2">
                                        {event.category && LIFE_AREAS[event.category as keyof typeof LIFE_AREAS] && (
                                          <div 
                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                            style={{ 
                                              backgroundColor: LIFE_AREAS[event.category as keyof typeof LIFE_AREAS].color 
                                            }}
                                          />
                                        )}
                                        <h4 className={`font-semibold text-gray-900 ${
                                          event.completed ? 'line-through opacity-60' : ''
                                        }`}>
                                          {event.title}
                                        </h4>
                                      </div>
                                      
                                      <div className="flex items-center space-x-3 text-sm text-gray-500 mb-2">
                                        <div className="flex items-center space-x-1">
                                          <Clock className="w-3 h-3" />
                                          <span>
                                            {formatTimeSlot(event.startTime)} - {formatTimeSlot(event.endTime)}
                                          </span>
                                        </div>
                                        {event.location && (
                                          <div className="flex items-center space-x-1">
                                            <MapPin className="w-3 h-3" />
                                            <span>{event.location}</span>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {event.notes && (
                                        <p className="text-sm text-gray-600 line-clamp-2">
                                          {event.notes}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        </div>
                      )}

                      {/* Placeholder for drag operations */}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}