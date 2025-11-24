import { useState } from "react";
import { useParams, Link } from "wouter";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Task } from "@shared/schema";
import { LIFE_AREAS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, GripVertical, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";

import QuickAddModal from "@/components/QuickAddModal";
import UnifiedTaskModal from "@/components/UnifiedTaskModal";

export default function DomainBacklog() {
  const { domain } = useParams();
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { toast } = useToast();

  // Get domain info
  const domainInfo = domain ? LIFE_AREAS[domain as keyof typeof LIFE_AREAS] : null;

  // Fetch tasks for this domain
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Filter tasks for this domain and exclude completed tasks
  const domainTasks = tasks.filter(task => task.category === domain && !task.completed);
  
  // Split into current (tasks not in backlog) and backlog (tasks specifically marked as backlog)
  const currentTasks = domainTasks.filter(task => !task.isBacklog);
  const backlogTasks = domainTasks.filter(task => task.isBacklog);



  // Update task completion mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: string; completed: boolean }) => {
      const response = await apiRequest('PATCH', `/api/tasks/${taskId}`, {
        completed,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task.",
        variant: "destructive",
      });
    },
  });

  // Move task between current and backlog
  const moveTaskMutation = useMutation({
    mutationFn: async ({ taskId, removeFromCalendar }: { taskId: string; removeFromCalendar: boolean }) => {
      const updateData = removeFromCalendar 
        ? { date: null, startTime: null, endTime: null, isAllDay: false, location: null }
        : {};
      
      const response = await apiRequest('PATCH', `/api/tasks/${taskId}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", { withDates: true }] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to move task.",
        variant: "destructive",
      });
    },
  });

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Move from current to backlog
    if (source.droppableId === 'current-tasks' && destination.droppableId === 'backlog-tasks') {
      moveTaskMutation.mutate({ taskId: draggableId, removeFromCalendar: true });
    }
    // Moving within same section doesn't require API call (just reordering)
  };



  const openTaskModal = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setEditingTask(null);
    setIsTaskModalOpen(false);
  };

  const openQuickAddModal = () => {
    setIsQuickAddModalOpen(true);
  };

  const closeQuickAddModal = () => {
    setIsQuickAddModalOpen(false);
  };

  if (!domainInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Domain not found</h1>
          <Link href="/">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      <Header />

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center">
              <div 
                className="w-4 h-4 rounded-full mr-3"
                style={{ backgroundColor: domainInfo.color }}
              />
              <h1 className="text-2xl font-bold text-gray-900">{domainInfo.name}</h1>
              <span className="ml-2 text-sm text-gray-500">Task Backlog</span>
            </div>
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-4">
            
            {/* Current Tasks Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Current Tasks</h2>
                    <p className="text-sm text-gray-500 mt-1">Active tasks in this life area</p>
                  </div>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                    {currentTasks.length}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <Droppable droppableId="current-tasks">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 min-h-[120px] ${
                        snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg' : ''
                      }`}
                    >
                      {currentTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`${domainInfo.bgColor} ${domainInfo.borderColor} border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all ${
                                snapshot.isDragging ? 'opacity-50 rotate-2 scale-105' : ''
                              } ${task.completed ? 'opacity-50' : ''}`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1">
                                  <button
                                    onClick={() => updateTaskMutation.mutate({ 
                                      taskId: task.id, 
                                      completed: !task.completed 
                                    })}
                                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                      task.completed 
                                        ? `bg-${domainInfo.color} border-${domainInfo.color}` 
                                        : `border-gray-300 hover:border-${domainInfo.color}`
                                    }`}
                                    style={{ 
                                      backgroundColor: task.completed ? domainInfo.color : 'transparent',
                                      borderColor: task.completed ? domainInfo.color : undefined
                                    }}
                                  >
                                    {task.completed && (
                                      <CheckCircle className="w-3 h-3 text-white" />
                                    )}
                                  </button>
                                  <div 
                                    className="flex-1 cursor-pointer"
                                    onClick={() => openTaskModal(task)}
                                  >
                                    <p className={`text-sm font-medium transition-colors ${
                                      task.completed ? 'line-through text-gray-500' : 'text-gray-900 hover:text-blue-600'
                                    }`}>
                                      {task.title}
                                    </p>
                                    {task.date && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        📅 Scheduled: {new Date(task.date).toLocaleDateString()}
                                        {task.startTime && ` at ${task.startTime}`}
                                      </p>
                                    )}
                                    {task.notes && (
                                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                        {task.notes.replace(/<[^>]*>/g, '').substring(0, 100)}
                                        {task.notes.length > 100 ? '...' : ''}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div 
                                  {...provided.dragHandleProps}
                                  className="cursor-grab hover:text-gray-600 transition-colors ml-2 flex-shrink-0"
                                >
                                  <GripVertical className="h-4 w-4 text-gray-400" />
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {currentTasks.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <p className="text-sm">No current tasks</p>
                          <p className="text-xs mt-1">Add tasks below or from the main dashboard</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>

            {/* Backlog Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Backlog</h2>
                    <p className="text-sm text-gray-500 mt-1">Unscheduled tasks to prioritize later</p>
                  </div>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                    {backlogTasks.length}
                  </span>
                </div>
                
                {/* Quick Add Button */}
                <div className="mt-4">
                  <Button 
                    onClick={openQuickAddModal}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Task to Backlog
                  </Button>
                </div>
              </div>
              
              <div className="p-6">
                <Droppable droppableId="backlog-tasks">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 min-h-[120px] ${
                        snapshot.isDraggingOver ? 'bg-gray-50 rounded-lg' : ''
                      }`}
                    >
                      {backlogTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`${domainInfo.bgColor} ${domainInfo.borderColor} border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all ${
                                snapshot.isDragging ? 'opacity-50 rotate-2 scale-105' : ''
                              } ${task.completed ? 'opacity-50' : ''}`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1">
                                  <button
                                    onClick={() => updateTaskMutation.mutate({ 
                                      taskId: task.id, 
                                      completed: !task.completed 
                                    })}
                                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                      task.completed 
                                        ? `bg-${domainInfo.color} border-${domainInfo.color}` 
                                        : `border-gray-300 hover:border-${domainInfo.color}`
                                    }`}
                                    style={{ 
                                      backgroundColor: task.completed ? domainInfo.color : 'transparent',
                                      borderColor: task.completed ? domainInfo.color : undefined
                                    }}
                                  >
                                    {task.completed && (
                                      <CheckCircle className="w-3 h-3 text-white" />
                                    )}
                                  </button>
                                  <div 
                                    className="flex-1 cursor-pointer"
                                    onClick={() => openTaskModal(task)}
                                  >
                                    <p className={`text-sm font-medium transition-colors ${
                                      task.completed ? 'line-through text-gray-500' : 'text-gray-900 hover:text-blue-600'
                                    }`}>
                                      {task.title}
                                    </p>
                                    {task.notes && (
                                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                        {task.notes.replace(/<[^>]*>/g, '').substring(0, 100)}
                                        {task.notes.length > 100 ? '...' : ''}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div 
                                  {...provided.dragHandleProps}
                                  className="cursor-grab hover:text-gray-600 transition-colors ml-2 flex-shrink-0"
                                >
                                  <GripVertical className="h-4 w-4 text-gray-400" />
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {backlogTasks.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <p className="text-sm">No tasks in backlog</p>
                          <p className="text-xs mt-1">Add your first task above</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          </div>
        </div>
      </DragDropContext>

      {/* Modals */}
      <UnifiedTaskModal
        isOpen={isTaskModalOpen}
        onClose={closeTaskModal}
        task={editingTask}
      />

      <QuickAddModal
        isOpen={isQuickAddModalOpen}
        onClose={closeQuickAddModal}
        creationSource="backlog"
        preselectedCategory={domain || ""}
      />
    </div>
  );
}