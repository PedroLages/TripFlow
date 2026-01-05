/**
 * Profile Page
 *
 * User profile and settings management
 * Houses all account settings and preferences
 */

import React from 'react';
import Settings from './Settings';
import { UserSettings } from '../types';

interface ProfileProps {
  settings: UserSettings;
  setSettings: (settings: UserSettings) => void;
  onLogout?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ settings, setSettings, onLogout }) => {
  return <Settings settings={settings} setSettings={setSettings} onLogout={onLogout} />;
};

export default Profile;
