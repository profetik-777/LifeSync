import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LIFE_AREAS, getTodayDate } from "@/lib/constants";
import RichTextEditor from "./RichTextEditor";
import { parseNaturalLanguageTitle } from "@/lib/nlp";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  creationSource?: 'task' | 'calendar' | 'backlog';
  initialTimeSlot?: string;
  selectedDate?: string;
  preselectedCategory?: string;
}

export default function QuickAddModal({ 
  isOpen, 
  onClose, 
  creationSource = 'task',
  initialTimeSlot = '09:00',
  selectedDate = getTodayDate(),
  preselectedCategory = ''
}: QuickAddModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    category: preselectedCategory,
    startTime: '',
    endTime: '',
    location: '',
    notes: '',
    date: selectedDate,
  });
  const [parsedInfo, setParsedInfo] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(preselectedCategory);
  const { toast } = useToast();

  useEffect(() => {
    if (initialTimeSlot && creationSource === 'calendar') {
      const startHour = parseInt(initialTimeSlot.split(':')[0]);
      const endHour = startHour + 1;
      const endTime = `${String(endHour).padStart(2, '0')}:00`;
      
      setFormData(prev => ({
        ...prev,
        startTime: initialTimeSlot,
        endTime: endTime,
      }));
    }
  }, [initialTimeSlot, creationSource]);

  useEffect(() => {
    setSelectedCategory(preselectedCategory);
    setFormData(prev => ({
      ...prev,
      category: preselectedCategory
    }));
  }, [preselectedCategory]);

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/tasks', {
        title: data.title,
        description: data.description,
        category: data.category,
        completed: data.completed || false,
        // Include calendar fields if they exist (unified model)
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        isAllDay: data.isAllDay,
        location: data.location,
        notes: data.notes,
        // Include backlog field
        isBacklog: data.isBacklog,
      });
      return response.json();
    },
    onSuccess: (result, variables) => {
      // Invalidate both task queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", { withDates: true }] });
      
      const hasDateFields = variables.date || variables.startTime || variables.endTime;
      toast({
        title: hasDateFields ? "Event created" : "Task created",
        description: hasDateFields 
          ? "Your new event has been added to the calendar." 
          : "Your new task has been added to the task list.",
      });
      onClose();
      resetForm();
    },
  });


  const resetForm = () => {
    setFormData({
      title: '',
      category: preselectedCategory,
      startTime: '',
      endTime: '',
      location: '',
      notes: '',
      date: selectedDate,
    });
    setSelectedCategory(preselectedCategory);
    setParsedInfo('');
  };

  const handleTitleChange = (newTitle: string) => {
    // Always update the title first to ensure typing works properly
    setFormData(prev => ({
      ...prev,
      title: newTitle,
    }));

    // Use setTimeout to delay NLP parsing to avoid interfering with typing
    setTimeout(() => {
      if (newTitle.trim().length > 3) { // Only parse if there's meaningful content
        const parsed = parseNaturalLanguageTitle(newTitle);
        
        // Only update non-title fields from parsing, never modify the title itself
        setFormData(prev => {
          const newStartTime = parsed.detectedTime || prev.startTime;
          const newEndTime = parsed.detectedEndTime || prev.endTime;
          
          // Determine if this should be an all-day event
          const shouldBeAllDay = !parsed.detectedTime && creationSource === 'calendar';
          
          // Auto-generate end time if we have start time but no end time (for timed calendar events)
          let calculatedEndTime = newEndTime;
          if (newStartTime && !newEndTime && creationSource === 'calendar' && !shouldBeAllDay) {
            const [hours, minutes] = newStartTime.split(':').map(Number);
            const endDate = new Date();
            endDate.setHours(hours, minutes + 60); // Default to 1 hour duration
            calculatedEndTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
          }
          
          return {
            ...prev,
            startTime: shouldBeAllDay ? '' : newStartTime,
            endTime: shouldBeAllDay ? '' : calculatedEndTime,
            location: parsed.detectedLocation || prev.location,
          };
        });

        // Show parsed information
        const info = [];
        if (parsed.detectedDate) {
          info.push(`📅 ${parsed.detectedDate}`);
          info.push(`🔄 Will become calendar event`);
        }
        if (parsed.detectedTime) info.push(`⏰ ${parsed.detectedTime}`);
        else if (creationSource === 'calendar' || parsed.detectedDate) info.push(`📅 Will appear as "sometime today" on target date`);
        if (parsed.detectedLocation) info.push(`📍 ${parsed.detectedLocation}`);
        setParsedInfo(info.length > 0 ? `Detected: ${info.join(', ')}` : '');
      } else {
        setParsedInfo('');
      }
    }, 300); // Small delay to avoid interfering with active typing
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.category) {
      toast({
        title: "Missing information",
        description: "Please fill in the title and category.",
        variant: "destructive",
      });
      return;
    }


    // Check if this should be a calendar event based on detected date
    const parsed = parseNaturalLanguageTitle(formData.title);
    const hasDate = !!parsed.detectedDate;
    
    // Unified approach: always create a task, but with calendar fields if needed
    const isFlexibleTime = !parsed.detectedTime && (!formData.startTime || !formData.endTime);
    const targetDate = parsed.detectedDate || selectedDate;
    
    console.log('Debug QuickAdd:', { 
      title: formData.title,
      parsed, 
      targetDate, 
      isFlexibleTime,
      hasDate,
      creationSource 
    });
    
    const taskData = {
      ...formData,
      // Calendar fields (will be null if no date detected)
      date: targetDate || null,
      startTime: parsed.detectedTime || formData.startTime || null,
      endTime: parsed.detectedEndTime || formData.endTime || null,
      isAllDay: targetDate ? (!parsed.detectedTime && !formData.startTime) : false,
      location: formData.location || null,
      notes: formData.notes || null,
      isBacklog: creationSource === 'backlog', // Mark as backlog if created from backlog view
    };
    
    // Always use unified task creation endpoint
    createTaskMutation.mutate(taskData);
  };

  const isLoading = createTaskMutation.isPending;
  // Check if task should become event based on natural language
  const parsed = parseNaturalLanguageTitle(formData.title);
  const willBecomeEvent = creationSource === 'calendar' || !!parsed.detectedDate;
  
  const modalTitle = willBecomeEvent
    ? (creationSource === 'calendar' ? `Add New Event - ${initialTimeSlot}` : `Add New Event - ${parsed.detectedDate || 'Date Detected'}`)
    : 'Add New Task';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[90vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="border-b border-gray-200 pb-6 mb-8">
          <DialogTitle className="text-xl font-semibold mb-4">
            {modalTitle}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            {willBecomeEvent
              ? 'Create a new calendar event with time and location details.'
              : 'Create a new task to add to your task list. Add dates (like "tomorrow") to make it a calendar event!'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 pb-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold">
              Title *
            </Label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => {
                handleTitleChange(e.target.value);
              }}
              onKeyDown={(e) => {
                // Only prevent Enter to avoid form submission
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
              placeholder=""
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-base"
              required
              autoFocus
            />
            {parsedInfo && (
              <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200 mt-1">
                {parsedInfo}
              </div>
            )}
          </div>

          {/* Category Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">
              Life Area *
            </Label>
            {!formData.category ? (
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(LIFE_AREAS).map(([key, area]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, category: key }))}
                    className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
                    data-testid={`button-life-area-${key}`}
                  >
                    <span style={{ color: area.color }} className="text-lg">●</span>
                    <span className="font-medium">{area.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-lg border border-blue-500 bg-blue-50">
                <div className="flex items-center space-x-2">
                  <span style={{ color: LIFE_AREAS[formData.category as keyof typeof LIFE_AREAS]?.color }} className="text-lg">●</span>
                  <span className="font-medium text-blue-700">{LIFE_AREAS[formData.category as keyof typeof LIFE_AREAS]?.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: '' }))}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* Time Selection - Only show for calendar events */}
          {creationSource === 'calendar' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Time</Label>
                <div className="text-xs text-gray-500">
                  Leave empty for flexible timing
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-sm font-medium">
                    Start Time
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => {
                      const newStartTime = e.target.value;
                      setFormData(prev => {
                        // Auto-generate end time if not set
                        let newEndTime = prev.endTime;
                        if (newStartTime && !newEndTime) {
                          const [hours, minutes] = newStartTime.split(':').map(Number);
                          const endDate = new Date();
                          endDate.setHours(hours, minutes + 60); // Default to 1 hour duration
                          newEndTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
                        }
                        return { ...prev, startTime: newStartTime, endTime: newEndTime };
                      });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime" className="text-sm font-medium">
                    End Time
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Location - Only show for calendar events */}
          {creationSource === 'calendar' && (
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-semibold">
                Location
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder=""
              />
            </div>
          )}

          {/* Rich Text Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              {creationSource === 'calendar' ? 'Notes' : 'Description'}
            </Label>
            <RichTextEditor
              content={formData.notes}
              onChange={(content) => setFormData(prev => ({ ...prev, notes: content }))}
              placeholder=""
              className="min-h-[200px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isLoading}
            >
              {isLoading 
                ? (creationSource === 'calendar' ? 'Creating Event...' : 'Creating Task...') 
                : (creationSource === 'calendar' ? 'Create Event' : 'Create Task')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}