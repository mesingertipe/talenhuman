import React from 'react';

/**
 * PermissionGate
 * 
 * Conditionally renders children based on the user's granular permissions.
 * 
 * @param {string} module - The module code (e.g., 'CORE')
 * @param {string} sub - The sub-module code (e.g., 'STORES')
 * @param {string} action - The action letter (R, C, U, D, X, E)
 * @param {object} user - The user object from context
 * @param {React.ReactNode} children - The content to guard
 */
const PermissionGate = ({ module, sub, action, user, children }) => {
  if (!user) return null;
  
  // SuperAdmin has all permissions
  if (user.roles?.includes('SuperAdmin')) return <>{children}</>;

  // Format in user.permissions: ["MODULE:SUBMODULE:ACTIONS"]
  const granularKey = `${module}:${sub}`;
  const permItem = user.permissions?.find(p => p.startsWith(`${granularKey}:`));

  if (!permItem) return null;

  const allowedActions = permItem.split(':')[2];
  if (allowedActions.includes(action)) {
    return <>{children}</>;
  }

  return null;
};

export default PermissionGate;
