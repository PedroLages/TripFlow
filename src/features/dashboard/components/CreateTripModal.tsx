/**
 * CreateTripModal Component
 *
 * Modal for creating a new trip with mobile-first design.
 * Follows TripFlow's compact modal pattern from CLAUDE.md:
 * - py-3 inputs/buttons (~38px height)
 * - p-6 sm:p-8 modal padding
 * - space-y-8 section spacing
 * - rounded-2xl for most elements
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateTrip } from '@/src/features/trips/hooks/useTrips';
import { ROUTES } from '@/src/lib/router';

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTripModal({ isOpen, onClose }: CreateTripModalProps) {
  const navigate = useNavigate();
  const createTrip = useCreateTrip();

  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
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
      setFormData({ name: '', start_date: '', end_date: '' });
      setErrors([]);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Validation
    const validationErrors: string[] = [];

    if (!formData.name.trim()) {
      validationErrors.push('Trip name is required');
    }

    if (!formData.start_date) {
      validationErrors.push('Start date is required');
    }

    if (!formData.end_date) {
      validationErrors.push('End date is required');
    }

    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);

      if (end < start) {
        validationErrors.push('End date must be after start date');
      }
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Create trip
    try {
      const newTrip = await createTrip.mutateAsync({
        name: formData.name.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date,
      });

      // Close modal and navigate to trip detail (when it exists)
      onClose();

      // TODO: Navigate to trip detail once TripDetail component exists
      // navigate(ROUTES.tripDetail(newTrip.id));
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Failed to create trip']);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-slate-950/95 backdrop-blur-3xl">
      <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-[2.5rem] sm:rounded-[3.5rem] shadow-3xl overflow-hidden animate-in zoom-in duration-300 border border-white/5 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 flex-shrink-0">
          <h3 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white">
            Create New Trip
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
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8 overflow-y-auto no-scrollbar">
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

          {/* Trip Name */}
          <div className="space-y-2">
            <Label htmlFor="trip-name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Trip Name
            </Label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="trip-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Tokyo Adventure 2024"
                className="pl-11 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none dark:text-white border-2 border-transparent focus:border-brand-primary/20 transition-all text-sm font-medium"
                autoFocus
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Start Date
              </Label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="start-date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="pl-11 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none dark:text-white border-2 border-transparent focus:border-brand-primary/20 transition-all text-sm font-medium"
                />
              </div>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                End Date
              </Label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="end-date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="pl-11 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none dark:text-white border-2 border-transparent focus:border-brand-primary/20 transition-all text-sm font-medium"
                />
              </div>
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
              disabled={createTrip.isPending}
              className="flex-1 px-6 py-3 bg-brand-primary text-white rounded-2xl font-medium text-sm shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              {createTrip.isPending ? 'Creating...' : 'Create Trip'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
