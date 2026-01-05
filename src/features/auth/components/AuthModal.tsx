/**
 * AuthModal Component
 *
 * Mobile-first authentication modal with sign in and sign up.
 * Follows TripFlow's compact modal pattern.
 *
 * Features:
 * - Email/password authentication via Supabase
 * - Toggle between sign in and sign up modes
 * - Session persistence (auto-login on refresh)
 * - Form validation and error handling
 * - ESC key support
 */

import { useState, useEffect } from 'react';
import { X, Mail, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/src/lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type AuthMode = 'signin' | 'signup';

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

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

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      setFormData({ email: '', password: '', confirmPassword: '' });
      setErrors([]);
    }
  }, [isOpen, mode]);

  const validateForm = (): string[] => {
    const validationErrors: string[] = [];

    // Email validation
    if (!formData.email.trim()) {
      validationErrors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      validationErrors.push('Invalid email address');
    }

    // Password validation
    if (!formData.password) {
      validationErrors.push('Password is required');
    } else if (formData.password.length < 6) {
      validationErrors.push('Password must be at least 6 characters');
    }

    // Confirm password (sign up only)
    if (mode === 'signup') {
      if (!formData.confirmPassword) {
        validationErrors.push('Please confirm your password');
      } else if (formData.password !== formData.confirmPassword) {
        validationErrors.push('Passwords do not match');
      }
    }

    return validationErrors;
  };

  const handleSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      console.error('Sign in error:', error);
      throw new Error(error.message);
    }

    return data;
  };

  const handleSignUp = async () => {
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        // Disable email confirmation for development
        emailRedirectTo: undefined,
      },
    });

    if (error) {
      console.error('Sign up error:', error);
      throw new Error(error.message);
    }

    // Check if email confirmation is required
    if (data.user && !data.session) {
      throw new Error(
        'Please check your email to confirm your account. If you don\'t see the email, check your Supabase settings to disable email confirmation for development.'
      );
    }

    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Validate
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Authenticate
    setLoading(true);
    try {
      if (mode === 'signin') {
        await handleSignIn();
      } else {
        await handleSignUp();
      }

      // Success
      onSuccess?.();
      onClose();
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Authentication failed']);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-slate-950/95 backdrop-blur-3xl">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] sm:rounded-[3.5rem] shadow-3xl overflow-hidden animate-in zoom-in duration-300 border border-white/5 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 flex-shrink-0">
          <h3 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white">
            {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
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

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="auth-email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="auth-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
                className="pl-11 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none dark:text-white border-2 border-transparent focus:border-brand-primary/20 transition-all text-sm font-medium"
                autoFocus
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="auth-password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="auth-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                className="pl-11 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none dark:text-white border-2 border-transparent focus:border-brand-primary/20 transition-all text-sm font-medium"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </div>
          </div>

          {/* Confirm Password (Sign Up only) */}
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="auth-confirm-password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="auth-confirm-password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="••••••••"
                  className="pl-11 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none dark:text-white border-2 border-transparent focus:border-brand-primary/20 transition-all text-sm font-medium"
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-brand-primary text-white rounded-2xl font-medium text-sm shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </Button>

          {/* Toggle Mode */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-brand-primary transition-colors"
            >
              {mode === 'signin' ? (
                <>
                  Don't have an account? <span className="font-semibold">Sign up</span>
                </>
              ) : (
                <>
                  Already have an account? <span className="font-semibold">Sign in</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
