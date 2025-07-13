/**
 * Base secure component that all application components should extend
 * Implements security-first design with input validation and permission checking
 */

import React, { ReactNode, useEffect, useState } from 'react';
import { z } from 'zod';
import { 
  SecureComponentProps, 
  SecurityError 
} from '../../types/security';
import { validationService } from '../../services/ValidationService';
import { permissionService } from '../../services/PermissionService';

interface SecureComponentState<T = unknown> {
  isAuthorized: boolean;
  validatedData?: T;
  error?: SecurityError;
  isLoading: boolean;
}

interface ExtendedSecureComponentProps<T = unknown> extends SecureComponentProps {
  data?: unknown;
  validationSchema?: z.ZodSchema<T>;
  children: (state: SecureComponentState<T>) => ReactNode;
  fallbackComponent?: ReactNode;
  loadingComponent?: ReactNode;
}

/**
 * Higher-order component that provides security validation and permission checking
 * Uses render props pattern for maximum flexibility
 */
export function SecureComponent<T = unknown>({
  user,
  requiredPermissions,
  data,
  validationSchema,
  children,
  fallbackComponent = <div>Access Denied</div>,
  loadingComponent = <div>Loading...</div>
}: ExtendedSecureComponentProps<T>) {
  const [state, setState] = useState<SecureComponentState<T>>({
    isAuthorized: false,
    isLoading: true
  });

  useEffect(() => {
    async function validateAndAuthorize() {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: undefined }));

        // Step 1: Check permissions
        const hasPermissions = requiredPermissions.length === 0 || 
          permissionService.hasAnyPermission(user, requiredPermissions);

        if (!hasPermissions) {
          throw new SecurityError(
            'Insufficient permissions',
            'PERMISSION_DENIED',
            { requiredPermissions, userId: user.id }
          );
        }

        // Step 2: Validate data if provided
        let validatedData: T | undefined;
        if (data && validationSchema) {
          validatedData = await validationService.validateAndSanitize(data, validationSchema);
        }

        // Step 3: Update state with successful authorization
        setState({
          isAuthorized: true,
          validatedData,
          isLoading: false
        });

      } catch (error) {
        const securityError = error instanceof SecurityError 
          ? error 
          : new SecurityError('Unknown security error', 'INVALID_INPUT');

        setState({
          isAuthorized: false,
          error: securityError,
          isLoading: false
        });
      }
    }

    validateAndAuthorize();
  }, [user, requiredPermissions, data, validationSchema]);

  // Show loading state
  if (state.isLoading) {
    return <>{loadingComponent}</>;
  }

  // Show error or fallback for unauthorized access
  if (!state.isAuthorized || state.error) {
    return <>{fallbackComponent}</>;
  }

  // Render children with validated state
  return <>{children(state)}</>;
}

/**
 * Hook for using security validation in functional components
 * Provides the same security guarantees as SecureComponent
 */
export function useSecureData<T>(
  user: SecureComponentProps['user'],
  requiredPermissions: SecureComponentProps['requiredPermissions'],
  data?: unknown,
  validationSchema?: z.ZodSchema<T>
) {
  const [state, setState] = useState<SecureComponentState<T>>({
    isAuthorized: false,
    isLoading: true
  });

  useEffect(() => {
    async function validateAndAuthorize() {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: undefined }));

        // Check permissions
        const hasPermissions = requiredPermissions.length === 0 || 
          permissionService.hasAnyPermission(user, requiredPermissions);

        if (!hasPermissions) {
          throw new SecurityError(
            'Insufficient permissions',
            'PERMISSION_DENIED',
            { requiredPermissions, userId: user.id }
          );
        }

        // Validate data if provided
        let validatedData: T | undefined;
        if (data && validationSchema) {
          validatedData = await validationService.validateAndSanitize(data, validationSchema);
        }

        setState({
          isAuthorized: true,
          validatedData,
          isLoading: false
        });

      } catch (error) {
        const securityError = error instanceof SecurityError 
          ? error 
          : new SecurityError('Unknown security error', 'INVALID_INPUT');

        setState({
          isAuthorized: false,
          error: securityError,
          isLoading: false
        });
      }
    }

    validateAndAuthorize();
  }, [user, requiredPermissions, data, validationSchema]);

  return state;
}

/**
 * Simple permission guard component for basic authorization
 */
interface PermissionGuardProps {
  user: SecureComponentProps['user'];
  requiredPermissions: SecureComponentProps['requiredPermissions'];
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({ 
  user, 
  requiredPermissions, 
  children, 
  fallback = null 
}: PermissionGuardProps) {
  const hasPermission = requiredPermissions.length === 0 || 
    permissionService.hasAnyPermission(user, requiredPermissions);

  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

/**
 * Error boundary for security-related errors
 */
interface SecurityErrorBoundaryState {
  hasError: boolean;
  error?: SecurityError;
}

export class SecurityErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: (error: SecurityError) => ReactNode },
  SecurityErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallback?: (error: SecurityError) => ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): SecurityErrorBoundaryState {
    if (error instanceof SecurityError) {
      return { hasError: true, error };
    }
    return { hasError: true, error: new SecurityError('Unknown security error', 'INVALID_INPUT') };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log security errors for monitoring
    console.error('Security error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback 
        ? this.props.fallback(this.state.error)
        : <div>A security error occurred. Please try again.</div>;
    }

    return this.props.children;
  }
}