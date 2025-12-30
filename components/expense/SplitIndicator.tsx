/**
 * SplitIndicator Component
 *
 * Visual badge showing split expense status and participants.
 * Color-coded by payment status:
 * - Green: All splits paid
 * - Orange: Partially paid
 * - Red: No splits paid
 */

import React from 'react';
import { Users, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import type { Expense, Collaborator } from '../../types';

interface SplitIndicatorProps {
  expense: Expense;
  collaborators: Collaborator[];
  ownerEmail: string;
  className?: string;
  onClick?: () => void;
}

const SplitIndicator: React.FC<SplitIndicatorProps> = ({
  expense,
  collaborators,
  ownerEmail,
  className = '',
  onClick,
}) => {
  if (!expense.isSplit || !expense.splits) {
    return null;
  }

  // Calculate payment status
  const paidCount = expense.splits.filter(split => split.isPaid).length;
  const totalCount = expense.splits.length;
  const allPaid = paidCount === totalCount;
  const nonePaid = paidCount === 0;

  // Determine colors based on status
  const getBadgeColors = () => {
    if (allPaid) {
      return 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-800/30 dark:text-green-400';
    }
    if (nonePaid) {
      return 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-800/30 dark:text-red-400';
    }
    return 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/20 dark:border-orange-800/30 dark:text-orange-400';
  };

  const getStatusIcon = () => {
    if (allPaid) {
      return <CheckCircle className="w-3.5 h-3.5" />;
    }
    if (nonePaid) {
      return <XCircle className="w-3.5 h-3.5" />;
    }
    return <AlertCircle className="w-3.5 h-3.5" />;
  };

  // Get participant info
  const allUsers = [
    { email: ownerEmail, avatar: 'https://i.pravatar.cc/150?u=demo' },
    ...collaborators
  ];

  const participants = expense.splits.map(split => {
    const user = allUsers.find(u => u.email === split.userId);
    return {
      email: split.userId,
      avatar: user?.avatar || `https://i.pravatar.cc/150?u=${split.userId}`,
      isPaid: split.isPaid,
    };
  });

  // Show max 3 avatars, then +N
  const visibleParticipants = participants.slice(0, 3);
  const remainingCount = participants.length - 3;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${getBadgeColors()} transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      } ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
      aria-label={`Split among ${totalCount} people, ${paidCount} paid`}
    >
      {/* Status Icon */}
      <div className="flex items-center gap-1.5">
        {getStatusIcon()}
        <Users className="w-3.5 h-3.5" />
      </div>

      {/* Participant Avatars */}
      <div className="flex -space-x-2">
        {visibleParticipants.map((participant, index) => (
          <div
            key={participant.email}
            className="relative"
            style={{ zIndex: visibleParticipants.length - index }}
          >
            <img
              src={participant.avatar}
              alt={participant.email}
              className={`w-6 h-6 rounded-full border-2 ${
                participant.isPaid
                  ? 'border-green-400 dark:border-green-600'
                  : 'border-white dark:border-slate-800'
              }`}
            />
            {participant.isPaid && (
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center">
                <CheckCircle className="w-2 h-2 text-white" />
              </div>
            )}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[9px] font-bold">
            +{remainingCount}
          </div>
        )}
      </div>

      {/* Split Method Badge */}
      <span className="text-[10px] font-black uppercase tracking-wider">
        {expense.splitMethod}
      </span>

      {/* Payment Status Text */}
      <span className="text-xs font-semibold">
        {paidCount}/{totalCount}
      </span>
    </div>
  );
};

export default SplitIndicator;
