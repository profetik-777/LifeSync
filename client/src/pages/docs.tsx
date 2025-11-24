import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { LIFE_AREAS } from "@/lib/constants";
import { format } from "date-fns";
import Header from "@/components/Header";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Calendar, MapPin, Clock, Plus, CheckSquare } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import RichTextEditor from "@/components/RichTextEditor";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function Docs() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(Object.keys(LIFE_AREAS)));
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>("");
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteCategory, setNewNoteCategory] = useState("uncategorized");
  const [newNoteContent, setNewNoteContent] = useState("");

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Filter tasks that have notes OR are standalone notes
  const tasksWithNotes = tasks.filter((task: Task) => 
    (task.notes && task.notes.trim()) || task.type === "note"
  );

  // Group by category
  const tasksByCategory = Object.keys(LIFE_AREAS).reduce((acc, category) => {
    acc[category] = tasksWithNotes.filter((task: Task) => task.category === category);
    return acc;
  }, {} as Record<string, Task[]>);

  // Filter tasks based on selected category
  const filteredTasks = selectedCategory 
    ? tasksWithNotes.filter((task: Task) => task.category === selectedCategory)
    : tasksWithNotes;

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const createNoteMutation = useMutation({
    mutationFn: async (noteData: { title: string; category: string; notes: string }) => {
      const response = await apiRequest('POST', '/api/tasks', {
        ...noteData,
        type: 'note',
        completed: false,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Note created",
        description: "Your standalone note has been created.",
      });
      setIsCreateNoteOpen(false);
      setNewNoteTitle("");
      setNewNoteCategory("uncategorized");
      setNewNoteContent("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create note.",
        variant: "destructive",
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ taskId, notes }: { taskId: string; notes: string }) => {
      const response = await apiRequest('PATCH', `/api/tasks/${taskId}`, { notes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", { withDates: true }] });
      toast({
        title: "Note updated",
        description: "Your changes have been saved.",
      });
      setEditingTaskId(null);
      setEditingContent("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update note.",
        variant: "destructive",
      });
    },
  });

  const taskifyMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const response = await apiRequest('POST', `/api/tasks/${noteId}/taskify`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Note converted to task",
        description: "Your note has been converted into a task.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to convert note to task.",
        variant: "destructive",
      });
    },
  });

  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingContent(task.notes || "");
  };

  const handleSaveEdit = (taskId: string) => {
    updateNoteMutation.mutate({ taskId, notes: editingContent });
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditingContent("");
  };

  const handleCreateNote = () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) {
      toast({
        title: "Error",
        description: "Please provide both a title and content for your note.",
        variant: "destructive",
      });
      return;
    }

    createNoteMutation.mutate({
      title: newNoteTitle,
      category: newNoteCategory,
      notes: newNoteContent,
    });
  };

  const handleTaskify = (noteId: string) => {
    taskifyMutation.mutate(noteId);
  };

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

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Navigation Panel */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Life Areas</h2>
            <p className="text-xs text-gray-500 mt-1">Filter by category</p>
          </div>

          <div className="p-2">
            {/* All Notes Option */}
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors mb-1 ${
                selectedCategory === null
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              data-testid="filter-all"
            >
              <div className="flex items-center justify-between">
                <span>All Notes</span>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {tasksWithNotes.length}
                </span>
              </div>
            </button>

            {/* Life Area Categories */}
            <div className="mt-4 space-y-1">
              {Object.entries(LIFE_AREAS).map(([categoryKey, categoryConfig]) => {
                const count = tasksByCategory[categoryKey]?.length || 0;
                return (
                  <button
                    key={categoryKey}
                    onClick={() => setSelectedCategory(categoryKey)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                      selectedCategory === categoryKey
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    data-testid={`filter-${categoryKey}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: categoryConfig.color }}
                        />
                        <span className="text-sm">{categoryConfig.name}</span>
                      </div>
                      {count > 0 && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {count}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {selectedCategory 
                    ? LIFE_AREAS[selectedCategory as keyof typeof LIFE_AREAS].name 
                    : 'All Notes'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {selectedCategory
                    ? `Notes in ${LIFE_AREAS[selectedCategory as keyof typeof LIFE_AREAS].name}`
                    : 'All notes from your tasks and events, organized by life area'}
                </p>
              </div>
              <button
                onClick={() => setIsCreateNoteOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                data-testid="button-create-note"
              >
                <Plus className="w-5 h-5" />
                <span>New Note</span>
              </button>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500">
                  {selectedCategory 
                    ? `No notes in ${LIFE_AREAS[selectedCategory as keyof typeof LIFE_AREAS].name} yet.`
                    : 'No notes yet. Add notes to your tasks or events to see them here.'}
                </p>
              </div>
            ) : selectedCategory ? (
              // Single category view (no collapsible needed when filtering)
              <div className="space-y-4">
                {filteredTasks.map((task: Task) => {
                  const categoryInfo = LIFE_AREAS[task.category as keyof typeof LIFE_AREAS];
                  return (
                    <div
                      key={task.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                      data-testid={`doc-${task.id}`}
                    >
                      <div className="px-6 py-5">
                        <h3 
                          className="text-lg font-semibold text-gray-900 mb-3"
                          data-testid={`doc-title-${task.id}`}
                        >
                          {task.title}
                        </h3>

                        <div className="mb-4">
                          {editingTaskId === task.id ? (
                            <div className="space-y-3">
                              <RichTextEditor
                                content={editingContent}
                                onChange={setEditingContent}
                                placeholder="Edit your note..."
                              />
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleSaveEdit(task.id)}
                                  disabled={updateNoteMutation.isPending}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                  data-testid={`button-save-${task.id}`}
                                >
                                  {updateNoteMutation.isPending ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                  data-testid={`button-cancel-${task.id}`}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              onClick={() => handleStartEdit(task)}
                              className="prose max-w-none cursor-pointer hover:bg-gray-50 rounded-lg p-3 -ml-3 transition-colors"
                              dangerouslySetInnerHTML={{ __html: task.notes || '' }}
                              data-testid={`doc-content-${task.id}`}
                            />
                          )}
                        </div>

                        <div className="pt-3 border-t border-gray-100 space-y-1.5">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            {task.type === "note" ? "Standalone Note" : "Origin"}
                          </p>
                          
                          {task.date && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {format(new Date(task.date), 'EEEE, MMMM dd, yyyy')}
                              </span>
                            </div>
                          )}

                          {task.startTime && task.endTime && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span>
                                {task.startTime} - {task.endTime}
                              </span>
                            </div>
                          )}

                          {task.location && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span>{task.location}</span>
                            </div>
                          )}

                          {task.type === "note" ? (
                            <div className="mt-3">
                              <button
                                onClick={() => handleTaskify(task.id)}
                                disabled={taskifyMutation.isPending}
                                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                data-testid={`button-taskify-${task.id}`}
                              >
                                <CheckSquare className="w-4 h-4" />
                                <span>{taskifyMutation.isPending ? "Converting..." : "Convert to Task"}</span>
                              </button>
                            </div>
                          ) : !task.date && (
                            <div className="text-sm text-gray-500 italic">
                              From task in {categoryInfo.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // All notes view with collapsible categories
              <div className="space-y-4">
                {Object.entries(LIFE_AREAS)
                  .filter(([categoryKey]) => {
                    const categoryTasks = tasksByCategory[categoryKey] || [];
                    return categoryTasks.length > 0;
                  })
                  .map(([categoryKey, categoryConfig]) => {
                    const categoryTasks = tasksByCategory[categoryKey] || [];

                    return (
                      <Collapsible
                        key={categoryKey}
                        open={expandedCategories.has(categoryKey)}
                        onOpenChange={() => toggleCategory(categoryKey)}
                      >
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                          <CollapsibleTrigger
                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            data-testid={`button-toggle-${categoryKey}`}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: categoryConfig.color }}
                              />
                              <h2 className="text-xl font-semibold text-gray-900">
                                {categoryConfig.name}
                              </h2>
                              <span className="text-sm text-gray-500">
                                ({categoryTasks.length} {categoryTasks.length === 1 ? 'note' : 'notes'})
                              </span>
                            </div>
                            <ChevronDown
                              className={`w-5 h-5 text-gray-400 transition-transform ${
                                expandedCategories.has(categoryKey) ? 'transform rotate-180' : ''
                              }`}
                            />
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <div className="border-t border-gray-200">
                              {categoryTasks.map((task: Task) => (
                                <div
                                  key={task.id}
                                  className="border-b border-gray-100 last:border-b-0"
                                  data-testid={`doc-${task.id}`}
                                >
                                  <div className="px-6 py-5">
                                    <h3 
                                      className="text-lg font-semibold text-gray-900 mb-3"
                                      data-testid={`doc-title-${task.id}`}
                                    >
                                      {task.title}
                                    </h3>

                                    <div className="mb-4">
                                      {editingTaskId === task.id ? (
                                        <div className="space-y-3">
                                          <RichTextEditor
                                            content={editingContent}
                                            onChange={setEditingContent}
                                            placeholder="Edit your note..."
                                          />
                                          <div className="flex space-x-2">
                                            <button
                                              onClick={() => handleSaveEdit(task.id)}
                                              disabled={updateNoteMutation.isPending}
                                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                              data-testid={`button-save-${task.id}`}
                                            >
                                              {updateNoteMutation.isPending ? 'Saving...' : 'Save'}
                                            </button>
                                            <button
                                              onClick={handleCancelEdit}
                                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                              data-testid={`button-cancel-${task.id}`}
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div 
                                          onClick={() => handleStartEdit(task)}
                                          className="prose max-w-none cursor-pointer hover:bg-gray-50 rounded-lg p-3 -ml-3 transition-colors"
                                          dangerouslySetInnerHTML={{ __html: task.notes || '' }}
                                          data-testid={`doc-content-${task.id}`}
                                        />
                                      )}
                                    </div>

                                    <div className="pt-3 border-t border-gray-100 space-y-1.5">
                                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                        {task.type === "note" ? "Standalone Note" : "Origin"}
                                      </p>
                                      
                                      {task.date && (
                                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                                          <Calendar className="w-4 h-4" />
                                          <span>
                                            {format(new Date(task.date), 'EEEE, MMMM dd, yyyy')}
                                          </span>
                                        </div>
                                      )}

                                      {task.startTime && task.endTime && (
                                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                                          <Clock className="w-4 h-4" />
                                          <span>
                                            {task.startTime} - {task.endTime}
                                          </span>
                                        </div>
                                      )}

                                      {task.location && (
                                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                                          <MapPin className="w-4 h-4" />
                                          <span>{task.location}</span>
                                        </div>
                                      )}

                                      {task.type === "note" ? (
                                        <div className="mt-3">
                                          <button
                                            onClick={() => handleTaskify(task.id)}
                                            disabled={taskifyMutation.isPending}
                                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                            data-testid={`button-taskify-${task.id}`}
                                          >
                                            <CheckSquare className="w-4 h-4" />
                                            <span>{taskifyMutation.isPending ? "Converting..." : "Convert to Task"}</span>
                                          </button>
                                        </div>
                                      ) : !task.date && (
                                        <div className="text-sm text-gray-500 italic">
                                          From task in {categoryConfig.name}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  })}
              </div>
            )}

            {/* Create Note Dialog */}
            <Dialog open={isCreateNoteOpen} onOpenChange={setIsCreateNoteOpen}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Create New Note</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <Input
                      value={newNoteTitle}
                      onChange={(e) => setNewNoteTitle(e.target.value)}
                      placeholder="Enter note title..."
                      data-testid="input-note-title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <Select value={newNoteCategory} onValueChange={setNewNoteCategory}>
                      <SelectTrigger data-testid="select-note-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LIFE_AREAS).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: config.color }}
                              />
                              <span>{config.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content
                    </label>
                    <RichTextEditor
                      content={newNoteContent}
                      onChange={setNewNoteContent}
                      placeholder="Write your note..."
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <button
                      onClick={() => setIsCreateNoteOpen(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      data-testid="button-cancel-create-note"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateNote}
                      disabled={createNoteMutation.isPending}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      data-testid="button-submit-create-note"
                    >
                      {createNoteMutation.isPending ? "Creating..." : "Create Note"}
                    </button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}
