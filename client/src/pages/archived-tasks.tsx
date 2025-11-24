import { useQuery } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { LIFE_AREAS } from "@/lib/constants";
import { format } from "date-fns";
import Header from "@/components/Header";

export default function ArchivedTasks() {
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const completedTasks = tasks
    .filter((task: Task) => task.completed && task.completedAt)
    .sort((a: Task, b: Task) => {
      if (!a.completedAt || !b.completedAt) return 0;
      return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
    });

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <Link href="/">
            <button 
              className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
              data-testid="button-back-to-dashboard"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </button>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Archived Tasks</h2>
          
          {completedTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No completed tasks yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="table-archived-tasks">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Task</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Life Area</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Completed Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {completedTasks.map((task: Task) => {
                    const lifeArea = LIFE_AREAS[task.category as keyof typeof LIFE_AREAS];
                    return (
                      <tr 
                        key={task.id} 
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        data-testid={`row-task-${task.id}`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div 
                              className="w-2 h-2 rounded-full mr-3 flex-shrink-0"
                              style={{ backgroundColor: lifeArea?.color }}
                            />
                            <span className="text-sm text-gray-900" data-testid={`text-task-title-${task.id}`}>
                              {task.title}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ 
                              backgroundColor: lifeArea?.color
                            }}
                            data-testid={`text-life-area-${task.id}`}
                          >
                            {lifeArea?.name}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600" data-testid={`text-completed-date-${task.id}`}>
                          {task.completedAt && format(new Date(task.completedAt), 'MMM dd, yyyy')}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {task.notes ? (
                            <span className="line-clamp-2" data-testid={`text-notes-${task.id}`}>
                              {task.notes.replace(/<[^>]*>/g, '').substring(0, 100)}
                              {task.notes.length > 100 ? '...' : ''}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
