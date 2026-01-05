/**
 * AddActivityModal Component
 *
 * Modal for adding activities to a trip's itinerary.
 * Follows TripFlow's compact modal pattern.
 *
 * Features:
 * - Activity name, date, time, notes
 * - Form validation
 * - ESC key support
 */

import { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateActivity } from '@/src/features/trips/hooks/useActivities';

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  tripStartDate: string;
  tripEndDate: string;
}

export function AddActivityModal({
  isOpen,
  onClose,
  tripId,
  tripStartDate,
  tripEndDate,
}: AddActivityModalProps) {
  const createActivity = useCreateActivity();

  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    location: '',
    notes: '',
  });

  const [errors, setErrors] = useState<string[]>([]);

  // ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        date: tripStartDate, // Default to trip start date
        time: '',
        location: '',
        notes: '',
      });
      setErrors([]);
    }
  }, [isOpen, tripStartDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Validation
    const validationErrors: string[] = [];

    if (!formData.name.trim()) {
      validationErrors.push('Activity name is required');
    }

    if (!formData.date) {
      validationErrors.push('Date is required');
    } else {
      // Check date is within trip dates
      const activityDate = new Date(formData.date);
      const start = new Date(tripStartDate);
      const end = new Date(tripEndDate);

      if (activityDate < start || activityDate > end) {
        validationErrors.push('Date must be within trip dates');
      }
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Create activity via API
    try {
      await createActivity.mutateAsync({
        trip_id: tripId,
        name: formData.name.trim(),
        activity_date: formData.date,
        activity_time: formData.time || null,
        location: formData.location.trim() || null,
        notes: formData.notes.trim() || null,
      });

      // Close modal on success
      onClose();
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Failed to create activity']);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-slate-950/95 backdrop-blur-3xl">
      <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-[2.5rem] sm:rounded-[3.5rem] shadow-3xl overflow-hidden animate-in zoom-in duration-300 border border-white/5 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 flex-shrink-0">
          <h3 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white">
            Add Activity
          </h3>
          <button
            onClick={onClose}
            className="w-10 h-10 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl flex items-center justify-center transition-all text-slate-400 flex-shrink-0"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 overflow-y-auto no-scrollbar">
          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
              <ul className="space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-600 dark:text-red-400">
                    • {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Activity Name */}
          <div className="space-y-2">
            <Label htmlFor="activity-name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Activity Name
            </Label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="activity-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Visit Senso-ji Temple"
                className="pl-11 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none dark:text-white border-2 border-transparent focus:border-brand-primary/20 transition-all text-sm font-medium"
                autoFocus
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="activity-date" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Date
              </Label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="activity-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  min={tripStartDate}
                  max={tripEndDate}
                  className="pl-11 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none dark:text-white border-2 border-transparent focus:border-brand-primary/20 transition-all text-sm font-medium"
                />
              </div>
            </div>

            {/* Time (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="activity-time" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Time (Optional)
              </Label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="activity-time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="pl-11 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none dark:text-white border-2 border-transparent focus:border-brand-primary/20 transition-all text-sm font-medium"
                />
              </div>
            </div>
          </div>

          {/* Location (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="activity-location" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Location (Optional)
            </Label>
            <Input
              id="activity-location"
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., Asakusa, Tokyo"
              className="px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none dark:text-white border-2 border-transparent focus:border-brand-primary/20 transition-all text-sm font-medium"
            />
          </div>

          {/* Notes (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="activity-notes" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Notes (Optional)
            </Label>
            <div className="relative">
              <FileText className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
              <Textarea
                id="activity-notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any notes or details..."
                rows={3}
                className="pl-11 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none dark:text-white border-2 border-transparent focus:border-brand-primary/20 transition-all text-sm font-medium resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-2xl font-medium text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createActivity.isPending}
              className="flex-1 px-6 py-3 bg-brand-primary text-white rounded-2xl font-medium text-sm shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              {createActivity.isPending ? 'Adding...' : 'Add Activity'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
