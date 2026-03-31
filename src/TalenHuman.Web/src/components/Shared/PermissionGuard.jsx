import React from 'react';

/**
 * PermissionGuard Component
 * @param {Object} props
 * @param {string} props.module - Module code (e.g., 'CORE', 'ATTENDANCE')
 * @param {string} props.action - Action required ('Read', 'Create', 'Update', 'Delete', 'Export', 'Approve')
 * @param {Object} props.user - User object with permissions and activeModules
 * @param {boolean} props.fallback - What to show if no permission (default: null)
 */
const PermissionGuard = ({ module, action, user, children, fallback = null }) => {
  if (!user) return fallback;

  // SuperAdmin bypass
  if (user.roles?.includes('SuperAdmin')) return children;

  // 1. Check Module activation
  const isModuleActive = user.activeModules?.includes(module);
  if (!isModuleActive) return fallback;

  // 2. Check Permissions
  // Format in user.permissions: ["CORE:R,C,U", "ATTENDANCE:R"]
  const modPerm = user.permissions?.find(p => p.startsWith(`${module}:`));
  if (!modPerm) return fallback;

  const allowedActions = modPerm.split(':')[1];
  const actionCode = action.substring(0, 1).toUpperCase();

  if (!allowedActions.includes(actionCode)) return fallback;

  return children;
};

// Hook version for complex logic
export const usePermission = (user, module, action) => {
  if (!user) return false;
  if (user.roles?.includes('SuperAdmin')) return true;

  const isModuleActive = user.activeModules?.includes(module);
  if (!isModuleActive) return false;

  const modPerm = user.permissions?.find(p => p.startsWith(`${module}:`));
  if (!modPerm) return false;

  const allowedActions = modPerm.split(':')[1];
  const actionCode = action.substring(0, 1).toUpperCase();

  return allowedActions.includes(actionCode);
};

export default PermissionGuard;
