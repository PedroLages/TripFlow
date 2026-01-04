import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { Users, Mail, Crown, UserMinus, XCircle, Send, Plus, Shield, Eye, Clock, Sparkles } from 'lucide-react';
import type { Trip, Collaborator, UserRole } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { formatDistanceToNow } from 'date-fns';

interface TeamManagementProps {
  trip: Trip;
  onUpdate: () => void;
}

interface TripInvitation {
  id: string;
  invitee_email: string;
  role: UserRole;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  expires_at: string;
  invited_by: string;
}

export function TeamManagement({ trip, onUpdate }: TeamManagementProps) {
  const [invitations, setInvitations] = useState<TripInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('Viewer');
  const [emailError, setEmailError] = useState('');
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  // Get current user
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const isOwner = trip.ownerEmail === currentUserEmail;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setCurrentUserEmail(user.email);
      }
    });
  }, []);

  // ESC key handler for modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && inviteModalOpen) {
        setInviteModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [inviteModalOpen]);

  // Fetch pending invitations
  useEffect(() => {
    fetchInvitations();
  }, [trip.id]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('trip_invitations')
        .select('*')
        .eq('trip_id', trip.id)
        .in('status', ['pending'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (err) {
      console.error('Error fetching invitations:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(inviteEmail)) {
      return;
    }

    try {
      setSendingInvite(true);

      // Call Edge Function to send invitation
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invitation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            tripId: trip.id,
            inviteeEmail: inviteEmail,
            role: inviteRole,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to send invitation');
      }

      showToast(`Invitation sent to ${inviteEmail}`, 'success');
      setInviteEmail('');
      setInviteRole('Viewer');
      setInviteModalOpen(false);
      fetchInvitations();
      onUpdate();
    } catch (err: any) {
      showToast(err.message || 'Failed to send invitation', 'error');
    } finally {
      setSendingInvite(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string, inviteeEmail: string) => {
    // Show confirmation dialog
    const confirmed = await confirm({
      title: 'Cancel Invitation',
      message: `Are you sure you want to cancel the invitation for ${inviteeEmail}? They won't be able to join this trip.`,
      type: 'warning',
      confirmText: 'Cancel Invitation',
      cancelText: 'Keep Invitation'
    });

    if (!confirmed) return;

    try {
      // Delete the invitation (RLS policy allows owners/editors to delete)
      const { error } = await supabase
        .from('trip_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      showToast('Invitation cancelled', 'success');
      fetchInvitations();
      onUpdate();
    } catch (err: any) {
      console.error('Error cancelling invitation:', err);
      showToast(err.message || 'Failed to cancel invitation', 'error');
    }
  };

  const handleChangeRole = async (memberEmail: string, newRole: UserRole) => {
    try {
      // First, get the user_id from profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', memberEmail)
        .single();

      if (profileError) throw new Error(`Failed to find user: ${profileError.message}`);
      if (!profile?.id) throw new Error('User not found');

      // Then update in trip_members table
      const { error } = await supabase
        .from('trip_members')
        .update({ role: newRole })
        .eq('trip_id', trip.id)
        .eq('user_id', profile.id);

      if (error) throw error;

      showToast(`${memberEmail}'s role changed to ${newRole}`, 'success');
      onUpdate();
    } catch (err: any) {
      console.error('Error changing role:', err);
      showToast(err.message || 'Failed to update role', 'error');
    }
  };

  const handleRemoveMember = async (memberEmail: string) => {
    // Show confirmation dialog
    const confirmed = await confirm({
      title: 'Remove Team Member',
      message: `Are you sure you want to remove ${memberEmail} from this trip? They will lose access immediately.`,
      type: 'danger',
      confirmText: 'Remove Member',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    try {
      // First, get the user_id from profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', memberEmail)
        .single();

      if (profileError) throw new Error(`Failed to find user: ${profileError.message}`);
      if (!profile?.id) throw new Error('User not found');

      // Then delete from trip_members table
      const { error } = await supabase
        .from('trip_members')
        .delete()
        .eq('trip_id', trip.id)
        .eq('user_id', profile.id);

      if (error) throw error;

      showToast(`${memberEmail} has been removed from the trip`, 'success');
      onUpdate();
    } catch (err: any) {
      console.error('Error removing member:', err);
      showToast(err.message || 'Failed to remove member', 'error');
    }
  };

  const getRoleIcon = (role: UserRole) => {
    if (role === 'Editor') return <Shield size={14} className="text-purple-600 dark:text-purple-400" />;
    return <Eye size={14} className="text-slate-500 dark:text-slate-400" />;
  };

  const getRoleBadgeClasses = (role: UserRole) => {
    if (role === 'Editor') {
      return 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800';
    }
    return 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Team Members</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {trip.collaborators.length} {trip.collaborators.length === 1 ? 'member' : 'members'}
              {invitations.length > 0 && ` · ${invitations.length} pending`}
            </p>
          </div>
        </div>
        {isOwner && (
          <button
            onClick={() => setInviteModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-medium text-sm shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={16} />
            Invite Member
          </button>
        )}
      </div>

      {/* Current Members */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Users size={18} className="text-slate-500" />
            Active Members
          </h3>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {trip.collaborators.map((member) => (
            <div
              key={member.email}
              className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={member.avatar || 'https://i.pravatar.cc/150?u=' + member.email}
                      alt={member.email}
                      className="w-12 h-12 rounded-xl object-cover shadow-md ring-2 ring-white dark:ring-slate-800"
                    />
                    {member.isOwner && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-md">
                        <Crown size={12} className="text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                        {member.email}
                      </p>
                      {member.isOwner && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-lg text-xs font-medium border border-yellow-200 dark:border-yellow-800">
                          <Crown size={10} />
                          Owner
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${getRoleBadgeClasses(member.role)}`}>
                        {getRoleIcon(member.role)}
                        {member.role}
                      </span>
                    </div>
                  </div>
                </div>

                {isOwner && !member.isOwner && (
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <select
                      value={member.role}
                      onChange={(e) => handleChangeRole(member.email, e.target.value as UserRole)}
                      className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 transition-all cursor-pointer hover:border-purple-300 dark:hover:border-purple-700"
                    >
                      <option value="Editor">Editor</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(member.email)}
                      className="w-9 h-9 flex items-center justify-center text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                      title="Remove member"
                    >
                      <UserMinus size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {trip.collaborators.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">No team members yet</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Invite people to collaborate on this trip</p>
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-2xl shadow-md border border-blue-100 dark:border-blue-900/30 overflow-hidden">
          <div className="p-6 border-b border-blue-100 dark:border-blue-900/30">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail size={18} className="text-blue-600 dark:text-blue-400" />
              Pending Invitations
              <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 dark:bg-blue-500 text-white text-xs font-bold rounded-full">
                {invitations.length}
              </span>
            </h3>
          </div>

          <div className="divide-y divide-blue-100 dark:divide-blue-900/30">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="p-4 hover:bg-white/50 dark:hover:bg-slate-900/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Mail size={20} className="text-blue-600 dark:text-blue-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                        {invitation.invitee_email}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${getRoleBadgeClasses(invitation.role)}`}>
                          {getRoleIcon(invitation.role)}
                          {invitation.role}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium border border-blue-200 dark:border-blue-800">
                          <Clock size={10} />
                          Pending
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Expires {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isOwner && (
                    <button
                      onClick={() => handleCancelInvitation(invitation.id, invitation.invitee_email)}
                      className="w-9 h-9 flex items-center justify-center text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100 flex-shrink-0 ml-2"
                      title="Cancel invitation"
                    >
                      <XCircle size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-[#0a0e1a]/98 backdrop-blur-2xl animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#161b28] w-full max-w-lg rounded-[2.5rem] sm:rounded-[3.5rem] shadow-3xl overflow-hidden animate-in zoom-in duration-300 border border-slate-200 dark:border-[#1e2533]/30 flex flex-col max-h-[90vh]">

            {/* Modal Header */}
            <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-[#1e2533]/50 flex justify-between items-center dark:bg-[#0f1419]/30 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Invite Team Member
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Send invitation via email</p>
                </div>
              </div>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="w-10 h-10 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl flex items-center justify-center transition-all text-slate-400 flex-shrink-0"
              >
                <XCircle size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSendInvitation} className="p-6 sm:p-8 space-y-6 overflow-y-auto no-scrollbar">
              {/* Email Input */}
              <div>
                <label
                  htmlFor="invite-email"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2"
                >
                  <Mail size={14} />
                  Email Address
                </label>
                <input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  placeholder="colleague@example.com"
                  required
                  autoFocus
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-[#0d1117] rounded-2xl outline-none dark:text-white border-2 ${
                    emailError
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-slate-200 dark:border-[#1e2533]/50 focus:border-blue-500 dark:focus:border-blue-500/80'
                  } transition-all text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500`}
                />
                {emailError && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <XCircle size={14} />
                    {emailError}
                  </p>
                )}
              </div>

              {/* Role Select */}
              <div>
                <label
                  htmlFor="invite-role"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2"
                >
                  <Shield size={14} />
                  Permission Level
                </label>
                <div className="space-y-2">
                  <label className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    inviteRole === 'Editor'
                      ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 dark:border-purple-600'
                      : 'bg-slate-50 dark:bg-[#0f1419] border-slate-200 dark:border-[#1e2533]/50 hover:border-purple-300 dark:hover:border-[#1e2533]'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="Editor"
                      checked={inviteRole === 'Editor'}
                      onChange={(e) => setInviteRole(e.target.value as UserRole)}
                      className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Shield size={16} className="text-purple-600 dark:text-purple-400" />
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">Editor</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Can view and edit all trip details</p>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    inviteRole === 'Viewer'
                      ? 'bg-slate-100 dark:bg-slate-800/50 border-slate-500 dark:border-slate-600'
                      : 'bg-slate-50 dark:bg-[#0f1419] border-slate-200 dark:border-[#1e2533]/50 hover:border-slate-300 dark:hover:border-[#1e2533]'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="Viewer"
                      checked={inviteRole === 'Viewer'}
                      onChange={(e) => setInviteRole(e.target.value as UserRole)}
                      className="w-4 h-4 text-slate-600 focus:ring-slate-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Eye size={16} className="text-slate-500 dark:text-slate-400" />
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">Viewer</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Can only view trip information</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-[#0f1419] border border-blue-200 dark:border-[#1e2533]/50 rounded-2xl p-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  An email will be sent to <strong>{inviteEmail || 'the invitee'}</strong> with a link to join this trip.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-6 py-3 bg-slate-100 dark:bg-[#0f1419] text-slate-900 dark:text-white rounded-2xl font-medium text-sm hover:bg-slate-200 dark:hover:bg-[#0d1117] transition-all border border-slate-200 dark:border-[#1e2533]/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingInvite}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-medium text-sm shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {sendingInvite ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Send Invitation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
