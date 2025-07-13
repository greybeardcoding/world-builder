/**
 * Permission service implementation following SOLID principles
 * Single Responsibility: Only handles permission checking and authorization
 */

import { IPermissionService, User, Permission, SecurityError } from '../types/security';

export class PermissionService implements IPermissionService {
  
  /**
   * Checks if a user has a specific permission
   * @param user - User to check permissions for
   * @param permission - Permission to check
   * @returns True if user has the permission
   */
  hasPermission(user: User, permission: Permission): boolean {
    // Inactive users have no permissions
    if (!user.isActive) {
      return false;
    }

    // Check for exact permission match
    return user.permissions.some(userPermission => 
      this.permissionsMatch(userPermission, permission)
    );
  }

  /**
   * Checks if a user has any of the specified permissions
   * @param user - User to check permissions for
   * @param permissions - Array of permissions to check
   * @returns True if user has at least one permission
   */
  hasAnyPermission(user: User, permissions: Permission[]): boolean {
    return permissions.some(permission => 
      this.hasPermission(user, permission)
    );
  }

  /**
   * Filters an array of items based on user permissions
   * @param user - User to check permissions for
   * @param items - Array of items to filter
   * @param requiredPermission - Permission required to access items
   * @returns Filtered array containing only items user can access
   */
  filterByPermissions<T extends { id: string }>(
    user: User, 
    items: T[], 
    requiredPermission: Omit<Permission, 'scope'>
  ): T[] {
    return items.filter(() => {
      // Check if user has global permission
      const globalPermission: Permission = {
        ...requiredPermission,
        scope: 'global'
      };

      if (this.hasPermission(user, globalPermission)) {
        return true;
      }

      // Check if user has project-level permission
      const projectPermission: Permission = {
        ...requiredPermission,
        scope: 'project'
      };

      if (this.hasPermission(user, projectPermission)) {
        return true;
      }

      // Check if user has permission for their own items
      const ownPermission: Permission = {
        ...requiredPermission,
        scope: 'own'
      };

      // Note: This assumes items have an 'authorId' or similar field
      // In practice, you'd need to check ownership based on your data model
      return this.hasPermission(user, ownPermission);
    });
  }

  /**
   * Throws a SecurityError if user doesn't have required permission
   * @param user - User to check permissions for
   * @param permission - Required permission
   * @param resource - Optional resource identifier for error context
   * @throws SecurityError if permission is denied
   */
  requirePermission(user: User, permission: Permission, resource?: string): void {
    if (!this.hasPermission(user, permission)) {
      throw new SecurityError(
        `Permission denied: ${permission.action} on ${permission.resource}`,
        'PERMISSION_DENIED',
        {
          userId: user.id,
          requiredPermission: permission,
          resource
        }
      );
    }
  }

  /**
   * Checks if two permissions match
   * @param userPermission - Permission user has
   * @param requiredPermission - Permission being checked
   * @returns True if permissions match
   */
  private permissionsMatch(userPermission: Permission, requiredPermission: Permission): boolean {
    // Resource must match exactly
    if (userPermission.resource !== requiredPermission.resource) {
      return false;
    }

    // Action must match exactly
    if (userPermission.action !== requiredPermission.action) {
      return false;
    }

    // Scope matching logic
    return this.scopeMatches(userPermission.scope, requiredPermission.scope);
  }

  /**
   * Checks if permission scopes match
   * @param userScope - Scope of user's permission
   * @param requiredScope - Scope being requested
   * @returns True if scopes are compatible
   */
  private scopeMatches(userScope?: string, requiredScope?: string): boolean {
    // If no scope specified on either, it matches
    if (!userScope && !requiredScope) {
      return true;
    }

    // Global permissions can access anything
    if (userScope === 'global') {
      return true;
    }

    // Project permissions can access project and own items
    if (userScope === 'project' && (requiredScope === 'project' || requiredScope === 'own')) {
      return true;
    }

    // Own permissions can only access own items
    if (userScope === 'own' && requiredScope === 'own') {
      return true;
    }

    // Exact match for any other cases
    return userScope === requiredScope;
  }

  /**
   * Gets all permissions for a specific resource
   * @param user - User to get permissions for
   * @param resource - Resource to filter permissions by
   * @returns Array of permissions for the resource
   */
  getPermissionsForResource(user: User, resource: string): Permission[] {
    return user.permissions.filter(permission => 
      permission.resource === resource
    );
  }

  /**
   * Checks if user is a global administrator
   * @param user - User to check
   * @returns True if user has global admin permissions
   */
  isGlobalAdmin(user: User): boolean {
    return this.hasPermission(user, {
      resource: '*',
      action: 'configure',
      scope: 'global'
    });
  }
}

// Singleton instance for dependency injection
export const permissionService = new PermissionService();