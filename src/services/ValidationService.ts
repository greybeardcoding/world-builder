/**
 * Validation service implementation following SOLID principles
 * Single Responsibility: Only handles validation and sanitization
 */

import { z } from 'zod';
import DOMPurify from 'dompurify';
import { IValidationService, SecurityError } from '../types/security';

export class ValidationService implements IValidationService {
  private readonly domPurify: typeof DOMPurify;

  constructor() {
    // Initialize DOMPurify for server-side rendering compatibility
    this.domPurify = DOMPurify;
  }

  /**
   * Validates data against a Zod schema
   * @param data - Unknown input data to validate
   * @param schema - Zod schema to validate against
   * @returns Promise resolving to validated and typed data
   * @throws SecurityError if validation fails
   */
  async validate<T>(data: unknown, schema: z.ZodSchema<T>): Promise<T> {
    try {
      // Zod parse will throw if validation fails
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new SecurityError(
          'Input validation failed',
          'INVALID_INPUT',
          {
            issues: error.issues,
            received: data
          }
        );
      }
      // Re-throw unexpected errors
      throw error;
    }
  }

  /**
   * Sanitizes HTML content to prevent XSS attacks
   * @param content - HTML content to sanitize
   * @returns Promise resolving to sanitized HTML
   */
  async sanitizeHtml(content: string): Promise<string> {
    try {
      // Configure DOMPurify for world-building content
      const config = {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table',
          'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span', 'hr'
        ],
        ALLOWED_ATTR: [
          'href', 'src', 'alt', 'title', 'class', 'id', 'style',
          'target', 'rel', 'width', 'height'
        ],
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|xxx):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
        ADD_ATTR: ['target'],
        FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button'],
        FORBID_ATTR: ['onclick', 'onerror', 'onload', 'onmouseover']
      };

      return this.domPurify.sanitize(content, config);
    } catch {
      throw new SecurityError(
        'HTML sanitization failed',
        'INVALID_INPUT',
        { content: content.substring(0, 100) + '...' }
      );
    }
  }

  /**
   * Validates and sanitizes data in a single operation
   * Useful for HTML content that needs both validation and sanitization
   * @param data - Unknown input data
   * @param schema - Zod schema to validate against
   * @returns Promise resolving to validated and sanitized data
   */
  async validateAndSanitize<T>(data: unknown, schema: z.ZodSchema<T>): Promise<T> {
    // First validate the structure
    const validatedData = await this.validate(data, schema);

    // If the data contains HTML content, sanitize it
    if (this.containsHtmlContent(validatedData)) {
      return this.sanitizeHtmlInObject(validatedData);
    }

    return validatedData;
  }

  /**
   * Checks if an object contains HTML content fields
   * @param obj - Object to check
   * @returns True if object contains HTML content
   */
  private containsHtmlContent(obj: unknown): boolean {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }

    const htmlFields = ['content', 'description', 'notes', 'html'];
    const objRecord = obj as Record<string, unknown>;

    return htmlFields.some(field => 
      field in objRecord && typeof objRecord[field] === 'string'
    );
  }

  /**
   * Recursively sanitizes HTML content in an object
   * @param obj - Object to sanitize
   * @returns Sanitized object
   */
  private async sanitizeHtmlInObject<T>(obj: T): Promise<T> {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const result = { ...obj } as Record<string, unknown>;
    const htmlFields = ['content', 'description', 'notes', 'html'];

    for (const field of htmlFields) {
      if (field in result && typeof result[field] === 'string') {
        result[field] = await this.sanitizeHtml(result[field] as string);
      }
    }

    return result as T;
  }
}

// Singleton instance for dependency injection
export const validationService = new ValidationService();