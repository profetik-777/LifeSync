import { useState, useEffect } from "react";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Task, TaskEvent } from "@shared/schema";
import { getTodayDate } from "@/lib/constants";
import TaskSidebar from "@/components/TaskSidebar";
import TodayCalendar from "@/components/TodayCalendar";
import UnifiedTaskModal from "@/components/UnifiedTaskModal";
import QuickAddModal from "@/components/QuickAddModal";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const today = getTodayDate();
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [quickAddSource, setQuickAddSource] = useState<'task' | 'calendar'>('task');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('09:00');
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [preselectedCategory, setPreselectedCategory] = useState<string>('');
  const [isCalendarCollapsed, setIsCalendarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('calendarCollapsed');
      return saved === 'true';
    }
    return false;
  });
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('calendarCollapsed', String(isCalendarCollapsed));
    }
  }, [isCalendarCollapsed]);

  const toggleCalendar = () => {
    setIsCalendarCollapsed(prev => !prev);
  };

  // Fetch tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Fetch all task events (for the entire week view)
  const { data: taskEvents = [], isLoading: eventsLoading } = useQuery<TaskEvent[]>({
    queryKey: ["/api/tasks", { withDates: true }],
    queryFn: async () => {
      const response = await fetch('/api/tasks?withDates=true');
      return response.json();
    },
  });

  // Convert task to task event mutation
  const convertTaskMutation = useMutation({
    mutationFn: async ({ taskId, timeSlot }: { taskId: string; timeSlot: string }) => {
      const endHour = String(parseInt(timeSlot.split(':')[0]) + 1).padStart(2, '0');
      const endTime = `${endHour}:00`;
      
      // Find the task to preserve its description as notes
      const task = tasks.find(t => t.id === taskId);
      const existingNotes = task?.notes || '';
      
      const response = await apiRequest('PATCH', `/api/tasks/${taskId}`, {
        startTime: timeSlot,
        endTime,
        date: today,
        location: '',
        notes: existingNotes,
        isAllDay: false,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", { withDates: true }] });
      toast({
        title: "Task scheduled",
        description: "Your task has been added to the calendar.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to convert task to event.",
        variant: "destructive",
      });
    },
  });

  // Convert task to flexible time event (no specific time)
  const convertTaskToFlexibleTimeMutation = useMutation({
    mutationFn: async ({ taskId, targetDate }: { taskId: string; targetDate: string }) => {
      // Find the task to preserve its description as notes
      const task = tasks.find(t => t.id === taskId);
      const existingNotes = task?.notes || '';
      
      const response = await apiRequest('PATCH', `/api/tasks/${taskId}`, {
        date: targetDate,
        startTime: null,
        endTime: null,
        isAllDay: true,
        location: '',
        notes: existingNotes,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", { withDates: true }] });
      toast({
        title: "Task scheduled for flexible time",
        description: 'Your task is scheduled for "sometime today".',
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to schedule task.",
        variant: "destructive",
      });
    },
  });

  // Convert task event back to task mutation
  const convertEventToTaskMutation = useMutation({
    mutationFn: async ({ eventId, category }: { eventId: string; category: string }) => {
      const response = await apiRequest('PATCH', `/api/tasks/${eventId}`, {
        category,
        date: null,
        startTime: null,
        endTime: null,
        isAllDay: false,
        location: null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", { withDates: true }] });
      toast({
        title: "Event converted back to task",
        description: "Your event has been moved back to the task list.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to convert event back to task.",
        variant: "destructive",
      });
    },
  });

  // Reschedule flexible time event to specific time slot mutation
  const rescheduleEventMutation = useMutation({
    mutationFn: async ({ eventId, timeSlot }: { eventId: string; timeSlot: string }) => {
      const endHour = String(parseInt(timeSlot.split(':')[0]) + 1).padStart(2, '0');
      const endTime = `${endHour}:00`;
      
      // Find the event to get its current title
      const event = taskEvents.find(e => e.id === eventId);
      let cleanTitle = event?.title || '';
      
      // Clean title for scheduled appointment - remove temporal qualifiers
      cleanTitle = cleanTitle
        .replace(/\btomorrow\b/gi, '')
        .replace(/\btoday\b/gi, '')
        .replace(/\bsometime today\b/gi, '')
        .replace(/\bsometime\b/gi, '')
        .replace(/\bnext week\b/gi, '')
        .replace(/\bthis week\b/gi, '')
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/^\s+|\s+$/g, '') // Trim leading/trailing spaces
        .replace(/\s+([.!?])/g, '$1') // Remove spaces before punctuation
        .replace(/^([a-z])/, (match) => match.toUpperCase()); // Capitalize first letter
      
      const response = await apiRequest('PATCH', `/api/tasks/${eventId}`, {
        title: cleanTitle,
        startTime: timeSlot,
        endTime,
        isAllDay: false,
      });
      return response.json();
    },
    onMutate: async ({ eventId, timeSlot }) => {
      // Cancel outgoing refetches to avoid interfering with optimistic update
      await queryClient.cancelQueries({ queryKey: ["/api/tasks", { withDates: true }] });
      await queryClient.cancelQueries({ queryKey: ["/api/tasks"] });
      
      // Snapshot the previous value
      const previousEvents = queryClient.getQueryData(["/api/tasks", { withDates: true }]);
      const previousTasks = queryClient.getQueryData(["/api/tasks"]);
      
      // Optimistically update the event
      queryClient.setQueryData(["/api/tasks", { withDates: true }], (oldData: any) => {
        if (!oldData || !Array.isArray(oldData)) return oldData;
        
        return oldData.map((event: any) => {
          if (event.id === eventId) {
            const endHour = String(parseInt(timeSlot.split(':')[0]) + 1).padStart(2, '0');
            return {
              ...event,
              startTime: timeSlot,
              endTime: `${endHour}:00`,
              isAllDay: false
            };
          }
          return event;
        });
      });
      
      // Return context for rollback
      return { previousEvents, previousTasks };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousEvents) {
        queryClient.setQueryData(["/api/tasks", { withDates: true }], context.previousEvents);
      }
      if (context?.previousTasks) {
        queryClient.setQueryData(["/api/tasks"], context.previousTasks);
      }
      toast({
        title: "Error",
        description: "Failed to reschedule event.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Event rescheduled",
        description: "Your event has been moved to the new time slot.",
      });
    },
    onSettled: () => {
      // Refetch to ensure we're in sync with server
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", { withDates: true }] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  // Convert scheduled event to flexible time (remove time, keep date)
  const convertToFlexibleTimeMutation = useMutation({
    mutationFn: async ({ eventId }: { eventId: string }) => {
      const response = await apiRequest('PATCH', `/api/tasks/${eventId}`, {
        startTime: null,
        endTime: null,
        isAllDay: true,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", { withDates: true }] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Event converted to flexible time",
        description: 'Your event is now scheduled for "sometime today".',
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to convert event to flexible time.",
        variant: "destructive",
      });
    },
  });

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Handle drops from tasks to flexible time drop zone (task -> flexible time event)
    if (destination.droppableId === 'convert-to-flexible-time' && source.droppableId.startsWith('tasks-')) {
      convertTaskToFlexibleTimeMutation.mutate({ taskId: draggableId, targetDate: selectedDate });
    }
    // Handle drops from tasks to calendar days (task -> event) - Week view
    else if (destination.droppableId.startsWith('day-') && source.droppableId.startsWith('tasks-')) {
      const defaultTimeSlot = '09:00'; // Default to 9 AM for agenda view
      convertTaskMutation.mutate({ taskId: draggableId, timeSlot: defaultTimeSlot });
    }
    // Handle drops from tasks to calendar time slots (task -> event) - Day view
    else if (destination.droppableId.startsWith('calendar-') && source.droppableId.startsWith('tasks-')) {
      const timeSlot = destination.droppableId.replace('calendar-', '');
      convertTaskMutation.mutate({ taskId: draggableId, timeSlot });
    }
    // Handle drops from flexible time events to calendar time slots (reschedule event)
    else if (destination.droppableId.startsWith('calendar-') && source.droppableId === 'flexible-time-events') {
      const timeSlot = destination.droppableId.replace('calendar-', '');
      rescheduleEventMutation.mutate({ eventId: draggableId, timeSlot });
    }
    // Handle drops from calendar time slot to another calendar time slot (reschedule event)
    else if (destination.droppableId.startsWith('calendar-') && source.droppableId.startsWith('calendar-')) {
      const timeSlot = destination.droppableId.replace('calendar-', '');
      rescheduleEventMutation.mutate({ eventId: draggableId, timeSlot });
    }
    // Handle drops to flexible time drop zone (convert scheduled event to flexible time)
    else if (destination.droppableId === 'convert-to-flexible-time' && source.droppableId.startsWith('calendar-')) {
      convertToFlexibleTimeMutation.mutate({ eventId: draggableId });
    }
    // Handle drops from calendar to task lists (event -> task)
    else if ((source.droppableId.startsWith('day-') || source.droppableId.startsWith('calendar-') || source.droppableId === 'flexible-time-events') && destination.droppableId.startsWith('tasks-')) {
      const category = destination.droppableId.replace('tasks-', '');
      convertEventToTaskMutation.mutate({ eventId: draggableId, category });
    }
  };


  const openQuickAddModal = () => {
    setIsQuickAddModalOpen(true);
  };

  const closeQuickAddModal = () => {
    setIsQuickAddModalOpen(false);
    setQuickAddSource('task');
    setSelectedTimeSlot('09:00');
    setSelectedDate(today);
    setPreselectedCategory('');
  };

  const openTaskModal = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setEditingTask(null);
    setIsTaskModalOpen(false);
  };

  const openQuickAddFromCalendar = (timeSlot: string, date: string = today) => {
    setSelectedTimeSlot(''); // Don't pre-fill time from month view clicks
    setSelectedDate(date);
    setQuickAddSource('calendar');
    setIsQuickAddModalOpen(true);
  };

  const openQuickAddFromTasks = () => {
    setQuickAddSource('task');
    setPreselectedCategory('');
    setIsQuickAddModalOpen(true);
  };

  const openQuickAddForCategory = (category: string) => {
    setQuickAddSource('task');
    setPreselectedCategory(category);
    setIsQuickAddModalOpen(true);
  };

  if (tasksLoading || eventsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      <Header />

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="relative">
            {/* Toggle Button */}
            <div className="absolute -top-2 right-0 z-10">
              <Button
                onClick={toggleCalendar}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 shadow-sm"
                data-testid="button-toggle-calendar"
              >
                {isCalendarCollapsed ? (
                  <>
                    <ChevronLeft className="h-4 w-4" />
                    Show Calendar
                  </>
                ) : (
                  <>
                    Hide Calendar
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>

            <div className={`grid gap-6 ${isCalendarCollapsed ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
              <TaskSidebar 
                tasks={tasks} 
                onQuickAdd={openQuickAddFromTasks}
                onTaskClick={openTaskModal}
                onQuickAddForCategory={openQuickAddForCategory}
              />
              {!isCalendarCollapsed && (
                <TodayCalendar 
                  taskEvents={taskEvents}
                  onEditTaskEvent={openTaskModal}
                  onAddEvent={openQuickAddFromCalendar}
                  onDateClick={(date: string) => openQuickAddFromCalendar('09:00', date)}
                  today={today}
                />
              )}
            </div>
          </div>
        </div>
      </DragDropContext>

      <UnifiedTaskModal
        isOpen={isTaskModalOpen}
        onClose={closeTaskModal}
        task={editingTask}
      />

      <QuickAddModal
        isOpen={isQuickAddModalOpen}
        onClose={closeQuickAddModal}
        creationSource={quickAddSource}
        initialTimeSlot={selectedTimeSlot}
        selectedDate={selectedDate}
        preselectedCategory={preselectedCategory}
      />
    </div>
  );
}
