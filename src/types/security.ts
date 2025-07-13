/**
 * Security interfaces and types for the World Builder application
 * Following SOLID principles with dependency inversion and single responsibility
 */

import { z } from 'zod';

// Permission system - granular access control
export interface Permission {
  readonly resource: string;
  readonly action: PermissionAction;
  readonly scope?: PermissionScope;
}

export type PermissionAction = 
  | 'create' 
  | 'read' 
  | 'update' 
  | 'delete' 
  | 'execute' 
  | 'configure';

export type PermissionScope = 'own' | 'project' | 'global';

export interface User {
  readonly id: string;
  readonly email: string;
  readonly permissions: Permission[];
  readonly isActive: boolean;
  readonly lastLogin?: Date;
}

// Validation service interface - follows Interface Segregation Principle
export interface IValidationService {
  validate<T>(data: unknown, schema: z.ZodSchema<T>): Promise<T>;
  sanitizeHtml(content: string): Promise<string>;
  validateAndSanitize<T>(data: unknown, schema: z.ZodSchema<T>): Promise<T>;
}

// Permission service interface - Single Responsibility
export interface IPermissionService {
  hasPermission(user: User, permission: Permission): boolean;
  hasAnyPermission(user: User, permissions: Permission[]): boolean;
  filterByPermissions<T extends { id: string }>(
    user: User, 
    items: T[], 
    requiredPermission: Omit<Permission, 'scope'>
  ): T[];
}

// Plugin sandbox configuration
export interface PluginSandboxConfig {
  readonly allowedAPIs: string[];
  readonly maxMemoryMB: number;
  readonly maxExecutionTimeMs: number;
  readonly networkAccess: boolean;
  readonly fileSystemAccess: 'none' | 'readonly' | 'project-only';
}

// Secure component props base interface
export interface SecureComponentProps {
  user: User;
  requiredPermissions: Permission[];
  validationSchema?: z.ZodSchema;
  sandboxConfig?: PluginSandboxConfig;
}

// Input validation schemas using Zod
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  permissions: z.array(z.object({
    resource: z.string().min(1),
    action: z.enum(['create', 'read', 'update', 'delete', 'execute', 'configure']),
    scope: z.enum(['own', 'project', 'global']).optional()
  })),
  isActive: z.boolean(),
  lastLogin: z.date().optional()
});

export const PermissionSchema = z.object({
  resource: z.string().min(1),
  action: z.enum(['create', 'read', 'update', 'delete', 'execute', 'configure']),
  scope: z.enum(['own', 'project', 'global']).optional()
});

// Common validation schemas for application data
export const DocumentContentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255),
  content: z.string().max(10000000), // 10MB limit
  contentType: z.enum(['text', 'markdown', 'html']),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  authorId: z.string().uuid()
});

export const PluginConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  permissions: z.array(PermissionSchema),
  sandbox: z.object({
    allowedAPIs: z.array(z.string()),
    maxMemoryMB: z.number().positive().max(512),
    maxExecutionTimeMs: z.number().positive().max(30000),
    networkAccess: z.boolean(),
    fileSystemAccess: z.enum(['none', 'readonly', 'project-only'])
  })
});

// Error types for security violations
export class SecurityError extends Error {
  constructor(
    message: string, 
    public readonly code: SecurityErrorCode,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'SecurityError';
  }
}

export type SecurityErrorCode = 
  | 'PERMISSION_DENIED'
  | 'INVALID_INPUT'
  | 'SANDBOX_VIOLATION'
  | 'AUTHENTICATION_REQUIRED'
  | 'RATE_LIMIT_EXCEEDED';