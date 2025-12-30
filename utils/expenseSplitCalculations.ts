/**
 * Expense Split Calculations
 *
 * Core algorithms for splitting expenses among collaborators and calculating settlements.
 * Uses greedy algorithm for optimal settlement minimization (O(n log n) complexity).
 */

import type { Expense, Settlement, Collaborator, ExpenseSplit, UserBalance } from '../types';

/**
 * Calculate settlements using greedy algorithm to minimize transactions
 *
 * Algorithm:
 * 1. Build net balance map (who owes/is owed)
 * 2. Separate into creditors (owed) and debtors (owe)
 * 3. Sort both by amount (descending)
 * 4. Match largest creditor with largest debtor
 * 5. Create settlement for min(creditor, debtor)
 * 6. Repeat until balanced
 *
 * Complexity: O(n log n) due to sorting
 *
 * @param expenses - All trip expenses (including split expenses)
 * @param collaborators - Trip collaborators
 * @param ownerEmail - Trip owner email
 * @returns Array of minimal settlement transactions
 */
export const calculateSettlements = (
  expenses: Expense[],
  collaborators: Collaborator[],
  ownerEmail: string
): Settlement[] => {
  // 1. Build user balance map
  const balances = new Map<string, number>();
  const allUsers = [ownerEmail, ...collaborators.map(c => c.email)];
  allUsers.forEach(user => balances.set(user, 0));

  // 2. Process each split expense
  expenses
    .filter(exp => exp.isSplit && exp.splits && exp.paidBy)
    .forEach(expense => {
      // Person who paid gets positive balance (they are owed)
      const currentBalance = balances.get(expense.paidBy!) || 0;
      balances.set(expense.paidBy!, currentBalance + expense.amount);

      // Each split participant owes their share
      expense.splits!.forEach(split => {
        if (!split.isPaid) {
          const userBalance = balances.get(split.userId) || 0;
          balances.set(split.userId, userBalance - split.amount);
        }
      });
    });

  // 3. Separate creditors (owed money) and debtors (owe money)
  const creditors: Array<{ user: string; amount: number }> = [];
  const debtors: Array<{ user: string; amount: number }> = [];

  balances.forEach((balance, user) => {
    if (balance > 0.01) {
      creditors.push({ user, amount: balance });
    } else if (balance < -0.01) {
      debtors.push({ user, amount: Math.abs(balance) });
    }
  });

  // 4. Sort for greedy matching (largest first)
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // 5. Generate minimal settlements
  const settlements: Settlement[] = [];
  let creditorIdx = 0;
  let debtorIdx = 0;

  while (creditorIdx < creditors.length && debtorIdx < debtors.length) {
    const creditor = creditors[creditorIdx];
    const debtor = debtors[debtorIdx];
    const settlementAmount = Math.min(creditor.amount, debtor.amount);

    settlements.push({
      id: `settlement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fromUser: debtor.user,
      toUser: creditor.user,
      amount: parseFloat(settlementAmount.toFixed(2)),
      currency: 'USD',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    creditor.amount -= settlementAmount;
    debtor.amount -= settlementAmount;

    if (creditor.amount < 0.01) creditorIdx++;
    if (debtor.amount < 0.01) debtorIdx++;
  }

  return settlements;
};

/**
 * Split an expense equally among participants
 *
 * @param totalAmount - Total expense amount
 * @param participants - Array of user emails participating in split
 * @param paidBy - Email of user who paid
 * @returns Array of ExpenseSplit objects
 */
export const splitEqually = (
  totalAmount: number,
  participants: string[],
  paidBy: string
): ExpenseSplit[] => {
  const perPersonAmount = totalAmount / participants.length;

  return participants.map(userId => ({
    userId,
    amount: parseFloat(perPersonAmount.toFixed(2)),
    isPaid: userId === paidBy,
    paidAt: userId === paidBy ? new Date().toISOString() : undefined,
  }));
};

/**
 * Split expense by custom amounts
 *
 * @param amounts - Map of user email to their custom amount
 * @param paidBy - Email of user who paid
 * @returns Array of ExpenseSplit objects
 * @throws Error if amounts don't sum to total
 */
export const splitCustomAmounts = (
  amounts: Map<string, number>,
  paidBy: string
): ExpenseSplit[] => {
  return Array.from(amounts.entries()).map(([userId, amount]) => ({
    userId,
    amount: parseFloat(amount.toFixed(2)),
    isPaid: userId === paidBy,
    paidAt: userId === paidBy ? new Date().toISOString() : undefined,
  }));
};

/**
 * Split expense by percentages
 *
 * @param totalAmount - Total expense amount
 * @param percentages - Map of user email to their percentage (0-100)
 * @param paidBy - Email of user who paid
 * @returns Array of ExpenseSplit objects
 * @throws Error if percentages don't sum to 100
 */
export const splitByPercentages = (
  totalAmount: number,
  percentages: Map<string, number>,
  paidBy: string
): ExpenseSplit[] => {
  const totalPercentage = Array.from(percentages.values()).reduce((sum, p) => sum + p, 0);

  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new Error(`Percentages must sum to 100 (got ${totalPercentage})`);
  }

  return Array.from(percentages.entries()).map(([userId, percentage]) => {
    const amount = (totalAmount * percentage) / 100;
    return {
      userId,
      amount: parseFloat(amount.toFixed(2)),
      percentage,
      isPaid: userId === paidBy,
      paidAt: userId === paidBy ? new Date().toISOString() : undefined,
    };
  });
};

/**
 * Split expense by shares
 *
 * @param totalAmount - Total expense amount
 * @param shares - Map of user email to their share count
 * @param paidBy - Email of user who paid
 * @returns Array of ExpenseSplit objects
 */
export const splitByShares = (
  totalAmount: number,
  shares: Map<string, number>,
  paidBy: string
): ExpenseSplit[] => {
  const totalShares = Array.from(shares.values()).reduce((sum, s) => sum + s, 0);

  if (totalShares === 0) {
    throw new Error('Total shares cannot be zero');
  }

  return Array.from(shares.entries()).map(([userId, userShares]) => {
    const amount = (totalAmount * userShares) / totalShares;
    return {
      userId,
      amount: parseFloat(amount.toFixed(2)),
      shares: userShares,
      isPaid: userId === paidBy,
      paidAt: userId === paidBy ? new Date().toISOString() : undefined,
    };
  });
};

/**
 * Calculate balance summary for each user
 *
 * @param expenses - All trip expenses
 * @param collaborators - Trip collaborators
 * @param ownerEmail - Trip owner email
 * @returns Map of user email to their balance summary
 */
export const calculateUserBalances = (
  expenses: Expense[],
  collaborators: Collaborator[],
  ownerEmail: string
): Map<string, UserBalance> => {
  const balances = new Map<string, UserBalance>();
  const allUsers = [ownerEmail, ...collaborators.map(c => c.email)];

  // Initialize balances
  allUsers.forEach(user => {
    balances.set(user, {
      userId: user,
      owes: 0,
      owed: 0,
      netBalance: 0,
    });
  });

  // Process split expenses
  expenses
    .filter(exp => exp.isSplit && exp.splits && exp.paidBy)
    .forEach(expense => {
      const payerBalance = balances.get(expense.paidBy!)!;

      expense.splits!.forEach(split => {
        if (!split.isPaid) {
          // Payer is owed this amount
          payerBalance.owed += split.amount;

          // Participant owes this amount
          const participantBalance = balances.get(split.userId)!;
          participantBalance.owes += split.amount;
        }
      });
    });

  // Calculate net balances
  balances.forEach(balance => {
    balance.netBalance = parseFloat((balance.owed - balance.owes).toFixed(2));
  });

  return balances;
};

/**
 * Validate that split amounts equal total expense amount
 *
 * @param totalAmount - Total expense amount
 * @param splits - Array of expense splits
 * @returns true if valid, false otherwise
 */
export const validateSplitAmounts = (
  totalAmount: number,
  splits: ExpenseSplit[]
): boolean => {
  const splitTotal = splits.reduce((sum, split) => sum + split.amount, 0);
  return Math.abs(splitTotal - totalAmount) < 0.01; // Allow for rounding
};

/**
 * Mark a split as paid
 *
 * @param expense - Expense with splits
 * @param userId - User ID to mark as paid
 * @returns Updated expense
 */
export const markSplitAsPaid = (
  expense: Expense,
  userId: string
): Expense => {
  if (!expense.splits) {
    return expense;
  }

  const updatedSplits = expense.splits.map(split =>
    split.userId === userId
      ? { ...split, isPaid: true, paidAt: new Date().toISOString() }
      : split
  );

  return {
    ...expense,
    splits: updatedSplits,
  };
};

/**
 * Check if all splits in an expense are paid
 *
 * @param expense - Expense to check
 * @returns true if all splits are paid, false otherwise
 */
export const areAllSplitsPaid = (expense: Expense): boolean => {
  if (!expense.isSplit || !expense.splits) {
    return true;
  }

  return expense.splits.every(split => split.isPaid);
};
