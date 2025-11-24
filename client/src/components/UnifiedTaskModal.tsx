import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "@/components/RichTextEditor";
import { Checkbox } from "@/components/ui/checkbox";
import { Task } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, File, X, Download, Calendar, Clock, MapPin, ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LIFE_AREAS } from "@/lib/constants";

interface UnifiedTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

interface LogEntry {
  timestamp: string;
  content: string;
}

export default function UnifiedTaskModal({ isOpen, onClose, task }: UnifiedTaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    endTime: '',
    location: '',
    notes: '',
    completed: false,
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<string[]>([]);
  const [showConvertToTask, setShowConvertToTask] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [newLogEntry, setNewLogEntry] = useState<string>('');
  const { toast } = useToast();

  // Check if task is scheduled (has calendar data)
  const isScheduled = task && task.date;

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        startTime: task.startTime || '',
        endTime: task.endTime || '',
        location: task.location || '',
        notes: task.notes || '',
        completed: task.completed || false,
      });
      // Parse logs from JSON string
      try {
        const parsedLogs = task.logs ? JSON.parse(task.logs) : [];
        setLogs(parsedLogs);
      } catch (e) {
        setLogs([]);
      }
      // In a real implementation, you'd fetch existing attachments from the API
      setExistingAttachments([]);
    } else {
      setFormData({
        title: '',
        startTime: '',
        endTime: '',
        location: '',
        notes: '',
        completed: false,
      });
      setLogs([]);
      setNewLogEntry('');
      setAttachments([]);
      setExistingAttachments([]);
    }
  }, [task]);

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (data: Partial<Task>) => {
      if (!task) return;
      
      const response = await apiRequest('PATCH', `/api/tasks/${task.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", { withDates: true }] });
      toast({
        title: isScheduled ? "Event updated" : "Task updated",
        description: "Your changes have been saved successfully.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to update ${isScheduled ? 'event' : 'task'}.`,
        variant: "destructive",
      });
    },
  });

  // Auto-save completion status mutation (doesn't close modal)
  const toggleCompletionMutation = useMutation({
    mutationFn: async (completed: boolean) => {
      if (!task) return;
      
      const response = await apiRequest('PATCH', `/api/tasks/${task.id}`, { completed });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", { withDates: true }] });
      toast({
        title: formData.completed ? "Task completed" : "Task reopened",
        description: formData.completed ? "Task marked as complete and will be archived." : "Task marked as incomplete.",
      });
    },
    onError: () => {
      // Revert the checkbox state on error
      setFormData(prev => ({ ...prev, completed: !prev.completed }));
      toast({
        title: "Error",
        description: "Failed to update task status.",
        variant: "destructive",
      });
    },
  });

  // Delete task mutation (for unscheduled tasks)
  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      if (!task) return;
      
      const response = await apiRequest('DELETE', `/api/tasks/${task.id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", { withDates: true }] });
      toast({
        title: "Task deleted",
        description: "Your task has been deleted.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete task.",
        variant: "destructive",
      });
    },
  });

  // Unschedule task mutation (for scheduled tasks - removes from calendar)
  const unscheduleTaskMutation = useMutation({
    mutationFn: async () => {
      if (!task) return;
      
      const response = await apiRequest('PATCH', `/api/tasks/${task.id}`, {
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
        title: "Event removed from calendar",
        description: "The task has been moved back to your task list.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove event from calendar.",
        variant: "destructive",
      });
    },
  });

  // Convert task event back to task mutation
  const convertToTaskMutation = useMutation({
    mutationFn: async (category: string) => {
      if (!task) return;
      
      const response = await apiRequest('PATCH', `/api/tasks/${task.id}`, {
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
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to convert event back to task.",
        variant: "destructive",
      });
    },
  });

  const handleAddLog = () => {
    if (!newLogEntry.trim()) return;
    
    const newLog: LogEntry = {
      timestamp: new Date().toISOString(),
      content: newLogEntry.trim(),
    };
    
    setLogs(prev => [...prev, newLog]);
    setNewLogEntry('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Stringify logs array for storage
    const logsJson = logs.length > 0 ? JSON.stringify(logs) : null;
    updateTaskMutation.mutate({
      ...formData,
      logs: logsJson,
    });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate();
    }
  };

  const handleRemoveFromCalendar = () => {
    if (confirm('Remove this event from your calendar? The task will be moved back to your task list.')) {
      unscheduleTaskMutation.mutate();
    }
  };

  const handleConvertToTask = () => {
    if (!selectedCategory) {
      toast({
        title: "Please select a category",
        description: "Choose which life area this task belongs to.",
        variant: "destructive",
      });
      return;
    }
    convertToTaskMutation.mutate(selectedCategory);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!task) return null;

  const areaConfig = LIFE_AREAS[task.category as keyof typeof LIFE_AREAS];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-gray-200 pb-4">
          <div className="flex items-center space-x-3">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: areaConfig.color }}
            />
            <DialogTitle className="text-xl font-semibold">
              {isScheduled ? `Edit Event - ${areaConfig.name}` : `Edit Task - ${areaConfig.name}`}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-semibold">
              {isScheduled ? 'Event Title' : 'Task Title'}
            </Label>
            <div className="flex items-center space-x-3">
              <Checkbox
                checked={formData.completed}
                onCheckedChange={(checked) => {
                  const newCompleted = !!checked;
                  setFormData(prev => ({ ...prev, completed: newCompleted }));
                  toggleCompletionMutation.mutate(newCompleted);
                }}
                className="h-5 w-5 life-area-checkbox"
                style={{
                  borderColor: areaConfig.color,
                  '--checkbox-bg': areaConfig.color,
                } as React.CSSProperties}
                data-testid={`checkbox-completed-${task.id}`}
              />
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder=""
                className={`text-lg py-3 flex-1 ${formData.completed ? 'line-through text-gray-500' : ''}`}
                required
                data-testid={`input-title-${task.id}`}
              />
            </div>
          </div>

          {/* Calendar Fields - Only show for scheduled tasks */}
          {isScheduled && (
            <div className="space-y-4 border border-blue-100 rounded-lg p-4 bg-blue-50/50">
              <div className="flex items-center space-x-2 mb-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <Label className="text-base font-semibold text-blue-800">
                  Calendar Details
                </Label>
              </div>
              
              {/* Time Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-sm font-medium flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>Start Time</span>
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full"
                    data-testid={`input-startTime-${task.id}`}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endTime" className="text-sm font-medium flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>End Time</span>
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full"
                    data-testid={`input-endTime-${task.id}`}
                  />
                </div>
              </div>

              {/* Location Field */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>Location (Optional)</span>
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder=""
                  className="w-full"
                  data-testid={`input-location-${task.id}`}
                />
              </div>
            </div>
          )}

          {/* Rich Text Description */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              {isScheduled ? 'Event Notes & Details' : 'Detailed Notes & Planning'}
            </Label>
            <div className="border border-gray-200 rounded-lg">
              <RichTextEditor
                content={formData.notes}
                onChange={(value) => setFormData(prev => ({ ...prev, notes: value }))}
                placeholder=""
              />
              <p className="text-xs text-gray-500 mt-2 px-3 pb-3">
                Use the toolbar above to format your text like a document. Create lists, headers, and organize your thoughts.
              </p>
            </div>
          </div>

          {/* Task Log Section */}
          <div className="space-y-3 border-t border-gray-200 pt-6">
            <Label className="text-base font-semibold">
              Task Log
            </Label>
            <p className="text-sm text-gray-600">
              Track your progress on this task. Each log entry is saved with date and time.
            </p>
            
            {/* Existing Logs */}
            {logs.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
                {logs.map((log, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{log.content}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(log.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add New Log */}
            <div className="space-y-2">
              <div className="border border-gray-200 rounded-lg">
                <Textarea
                  value={newLogEntry}
                  onChange={(e) => setNewLogEntry(e.target.value)}
                  placeholder=""
                  className="min-h-[80px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  data-testid={`textarea-new-log-${task.id}`}
                />
              </div>
              <Button
                type="button"
                onClick={handleAddLog}
                variant="outline"
                className="w-full"
                disabled={!newLogEntry.trim()}
                data-testid={`button-add-log-${task.id}`}
              >
                Add Log Entry
              </Button>
            </div>
          </div>

          {/* Document Attachments Section */}
          <div className="border-t border-gray-200 pt-6">
            <Label className="text-base font-semibold mb-3 block">
              Document Attachments
            </Label>
            
            {/* File Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-base font-medium text-blue-600 hover:text-blue-500">
                      Upload files
                    </span>
                    <span className="text-gray-500"> or drag and drop</span>
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.xls,.xlsx,.ppt,.pptx"
                    data-testid={`input-file-upload-${task.id}`}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  PDF, DOC, images, spreadsheets, presentations up to 10MB each
                </p>
              </div>
            </div>

            {/* Attached Files List */}
            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Attached Files:</h4>
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex items-center space-x-3">
                      <File className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      className="text-gray-400 hover:text-red-500"
                      data-testid={`button-remove-attachment-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Existing Attachments (for when editing) */}
            {existingAttachments.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Existing Attachments:</h4>
                {existingAttachments.map((filename, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <div className="flex items-center space-x-3">
                      <File className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">{filename}</p>
                        <p className="text-xs text-blue-600">Previously uploaded</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                        data-testid={`button-download-attachment-${index}`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-red-500"
                        data-testid={`button-delete-attachment-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Convert to Task Section (only show for scheduled events) */}
          {isScheduled && (
            <div className="border-t border-gray-200 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConvertToTask(!showConvertToTask)}
                className="flex items-center space-x-2 mb-4"
                data-testid={`button-convert-to-task-${task.id}`}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Convert Back to Task</span>
              </Button>
              
              {showConvertToTask && (
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <p className="text-sm text-gray-600 mb-4">
                    This will remove the event from your calendar and convert it back to a regular task in your chosen life area.
                  </p>
                  
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full mb-4" data-testid={`select-category-${task.id}`}>
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LIFE_AREAS).map(([key, area]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: area.color }}
                            />
                            <span>{area.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowConvertToTask(false)}
                      className="flex-1"
                      data-testid={`button-cancel-convert-${task.id}`}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleConvertToTask}
                      disabled={!selectedCategory || convertToTaskMutation.isPending}
                      className="flex-1"
                      data-testid={`button-confirm-convert-${task.id}`}
                    >
                      {convertToTaskMutation.isPending ? 'Converting...' : 'Convert to Task'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Schedule Task Section (only show for unscheduled tasks) */}
          {!isScheduled && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Schedule on Calendar</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Convert this task to a calendar event to time-block your work
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center space-x-2"
                  onClick={() => {
                    // This would open a time picker modal or redirect to calendar
                    toast({
                      title: "Schedule Task",
                      description: "Drag this task to a time slot in the calendar to schedule it.",
                    });
                  }}
                  data-testid={`button-schedule-task-${task.id}`}
                >
                  <Calendar className="h-4 w-4" />
                  <span>Schedule</span>
                </Button>
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            {isScheduled ? (
              <Button 
                type="button" 
                variant="outline"
                onClick={handleRemoveFromCalendar}
                disabled={unscheduleTaskMutation.isPending}
                data-testid={`button-remove-calendar-${task.id}`}
              >
                Remove from Calendar
              </Button>
            ) : (
              <Button 
                type="button" 
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteTaskMutation.isPending}
                data-testid={`button-delete-task-${task.id}`}
              >
                {deleteTaskMutation.isPending ? 'Deleting...' : 'Delete Task'}
              </Button>
            )}
            <div className="space-x-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                data-testid={`button-cancel-${task.id}`}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={updateTaskMutation.isPending}
                className="px-6"
                data-testid={`button-save-${task.id}`}
              >
                {updateTaskMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}