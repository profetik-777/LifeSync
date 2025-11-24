import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LIFE_AREAS } from "@/lib/constants";

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTimeSlot: string;
  today: string;
}

export default function AddEventModal({ isOpen, onClose, initialTimeSlot, today }: AddEventModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    startTime: initialTimeSlot,
    endTime: '',
    location: '',
    notes: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (initialTimeSlot) {
      const startHour = parseInt(initialTimeSlot.split(':')[0]);
      const endHour = startHour + 1;
      const endTime = `${String(endHour).padStart(2, '0')}:00`;
      
      setFormData(prev => ({
        ...prev,
        startTime: initialTimeSlot,
        endTime: endTime,
      }));
    }
  }, [initialTimeSlot]);

  // Create task event mutation
  const createTaskEventMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Generate a temporary task ID for direct event creation
      const tempTaskId = `temp-${Date.now()}`;
      
      const response = await apiRequest('POST', '/api/tasks', {
        title: data.title,
        category: data.category,
        startTime: data.startTime,
        endTime: data.endTime,
        date: today,
        location: data.location,
        notes: data.notes,
        completed: false,
        isAllDay: false,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", { withDates: true }] });
      toast({
        title: "Event created",
        description: "Your new event has been added to the calendar.",
      });
      onClose();
      // Reset form
      setFormData({
        title: '',
        category: '',
        startTime: initialTimeSlot,
        endTime: '',
        location: '',
        notes: '',
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create event.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.category) {
      toast({
        title: "Missing information",
        description: "Please fill in the event title and category.",
        variant: "destructive",
      });
      return;
    }
    createTaskEventMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="border-b border-gray-200 pb-4">
          <DialogTitle className="text-xl font-semibold">
            Add New Event - {initialTimeSlot}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* Event Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold">
              Event Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder=""
              className="text-base"
              required
            />
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Life Area *
            </Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LIFE_AREAS).map(([key, area]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center space-x-2">
                      <span style={{ color: area.color }}>●</span>
                      <span>{area.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="text-sm font-semibold">
                Start Time
              </Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime" className="text-sm font-semibold">
                End Time
              </Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Location */}
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

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-semibold">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder=""
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createTaskEventMutation.isPending}
            >
              {createTaskEventMutation.isPending ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}