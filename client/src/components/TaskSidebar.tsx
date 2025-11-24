import { useState } from "react";
import { Draggable, Droppable } from "react-beautiful-dnd";
import { Link } from "wouter";
import { Task } from "@shared/schema";
import { LIFE_AREAS } from "@/lib/constants";
import { GripVertical, Plus, ChevronDown, ChevronRight } from "lucide-react";

interface TaskSidebarProps {
  tasks: Task[];
  onQuickAdd: () => void;
  onTaskClick: (task: Task) => void;
  onQuickAddForCategory: (category: string) => void;
}

export default function TaskSidebar({ tasks, onQuickAdd, onTaskClick, onQuickAddForCategory }: TaskSidebarProps) {
  const [showAllTasks, setShowAllTasks] = useState(false);
  
  // Filter out completed tasks first
  const activeTasks = tasks.filter(task => !task.completed);
  
  // Group all active tasks by category for counting (backlog)
  const allTasksByCategory = activeTasks.reduce((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, Task[]>);
  
  // Filter based on toggle: show only unscheduled tasks or all tasks
  const sidebarTasks = showAllTasks ? activeTasks : activeTasks.filter(task => !task.date);
  
  const groupedTasks = sidebarTasks.reduce((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <div className="lg:col-span-1 space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <button 
            onClick={() => setShowAllTasks(!showAllTasks)}
            className="flex items-center space-x-2 text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
            data-testid="button-toggle-all-tasks"
          >
            <span>Life Areas</span>
            {showAllTasks ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          <button 
            onClick={onQuickAdd}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            + Quick Add
          </button>
        </div>
        {showAllTasks && (
          <div className="mb-4 text-xs text-gray-500 bg-blue-50 p-2 rounded-lg">
            Showing all tasks including scheduled ones
          </div>
        )}

        {Object.entries(LIFE_AREAS).map(([key, area]) => {
          const categoryTasks = groupedTasks[key] || [];
          const totalCount = (allTasksByCategory[key] || []).length;
          
          return (
            <div key={key} className="mb-6">
              <div className="flex items-center mb-3">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: area.color }}
                />
                <h3 className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors">
                  <Link href={`/domain/${key}`}>
                    {area.name}
                  </Link>
                </h3>
                <span className="ml-2 text-xs text-gray-500">
                  {totalCount}
                </span>
                <button 
                  onClick={() => onQuickAddForCategory(key)}
                  className="ml-auto w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-blue-100 text-gray-400 hover:text-blue-600 rounded-full transition-colors"
                  title={`Add task to ${area.name}`}
                  data-testid={`button-add-${key}`}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <Droppable droppableId={`tasks-${key}`}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 min-h-[40px] rounded-lg p-2 transition-colors ${
                      snapshot.isDraggingOver 
                        ? 'bg-blue-50 border-2 border-dashed border-blue-300' 
                        : ''
                    }`}
                  >
                    {categoryTasks.map((task, index) => (
                      <Draggable 
                        key={task.id} 
                        draggableId={task.id} 
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`task-card ${area.bgColor} ${area.borderColor} border rounded-lg p-3 cursor-grab hover:shadow-md transition-shadow ${
                              snapshot.isDragging ? 'opacity-50 rotate-2 transform scale-105' : ''
                            }`}
                            onClick={() => onTaskClick(task)}
                          >
                            <p className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                              {task.title}
                            </p>
                            {task.notes && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {task.notes.replace(/<[^>]*>/g, '').substring(0, 100)}
                                {task.notes.length > 100 ? '...' : ''}
                              </p>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {categoryTasks.length === 0 && (
                      <div className="text-xs text-gray-400 text-center py-2">
                        No tasks yet
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </div>
  );
}
