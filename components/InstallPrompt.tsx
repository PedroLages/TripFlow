import React, { useState, useEffect } from 'react';
import { Download, X, Zap, Wifi, HardDrive } from 'lucide-react';

interface InstallPromptProps {
  onInstall: () => void;
}

/**
 * Install Prompt Component
 *
 * Displays a dismissible banner encouraging users to install the PWA.
 * Shows benefits of installation and provides easy install action.
 *
 * Position: Fixed at bottom, above mobile nav (bottom-24 md:bottom-6)
 * Dismissible: Stores dismissal in localStorage
 */
export const InstallPrompt: React.FC<InstallPromptProps> = ({ onInstall }) => {
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if user has dismissed the prompt
  useEffect(() => {
    const dismissed = localStorage.getItem('tripflow_install_prompt_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('tripflow_install_prompt_dismissed', 'true');
    setIsDismissed(true);
  };

  const handleInstall = () => {
    onInstall();
    handleDismiss();
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div
      className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-40 animate-fade-in"
      role="dialog"
      aria-labelledby="install-prompt-title"
      aria-describedby="install-prompt-description"
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-xl">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3
                id="install-prompt-title"
                className="font-semibold text-gray-900 dark:text-white"
              >
                Install TripFlow
              </h3>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Dismiss install prompt"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Benefits */}
        <p
          id="install-prompt-description"
          className="text-sm text-gray-600 dark:text-gray-300 mb-4"
        >
          Get the best experience with:
        </p>
        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <Zap className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span>Faster loading times</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <Wifi className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span>Works offline</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <HardDrive className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span>Saves storage space</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleInstall}
            className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
          >
            Install App
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
