// services/database/TransactionManager.ts
import mongoose, { ClientSession } from "mongoose";

/**
 * Transaction Manager Service
 *
 * Provides transaction support for multi-step database operations.
 * Ensures atomicity - either all operations succeed or all fail together.
 *
 * Benefits:
 * - Data integrity (no partial updates)
 * - Automatic rollback on errors
 * - Consistent error handling
 * - Cleaner code (no manual session management)
 *
 * Usage:
 * ```typescript
 * const txManager = new TransactionManager();
 * const result = await txManager.executeInTransaction(async (session) => {
 *   const tournament = await Tournament.create([data], { session });
 *   await BracketState.create([bracketData], { session });
 *   return tournament[0];
 * });
 * ```
 */

export interface TransactionResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
}

export class TransactionManager {
  private defaultOptions: any = {
    readPreference: 'primary',
    readConcern: { level: 'majority' },
    writeConcern: { w: 'majority' }
  };

  /**
   * Execute an operation within a transaction
   *
   * @param operation - Async function that performs database operations
   * @param options - Optional MongoDB transaction options
   * @returns Result of the operation
   * @throws Error if transaction fails
   */
  async executeInTransaction<T>(
    operation: (session: ClientSession) => Promise<T>,
    options?: any
  ): Promise<T> {
    const session = await mongoose.startSession();

    try {
      // Start transaction with options
      session.startTransaction({
        ...this.defaultOptions,
        ...options
      });

      // Execute the operation
      const result = await operation(session);

      // Commit if successful
      await session.commitTransaction();

      return result;
    } catch (error) {
      // Rollback on any error
      await session.abortTransaction();
      throw error;
    } finally {
      // Always end the session
      session.endSession();
    }
  }

  /**
   * Execute an operation with transaction and error handling
   * Returns a result object instead of throwing
   *
   * @param operation - Async function that performs database operations
   * @param options - Optional MongoDB transaction options
   * @returns TransactionResult with success status and data or error
   */
  async executeWithResult<T>(
    operation: (session: ClientSession) => Promise<T>,
    options?: any
  ): Promise<TransactionResult<T>> {
    try {
      const data = await this.executeInTransaction(operation, options);
      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * Execute multiple operations in a single transaction
   * Useful for batch operations
   *
   * @param operations - Array of async functions to execute
   * @param options - Optional MongoDB transaction options
   * @returns Array of results in the same order as operations
   */
  async executeBatch<T>(
    operations: Array<(session: ClientSession) => Promise<T>>,
    options?: any
  ): Promise<T[]> {
    return this.executeInTransaction(async (session) => {
      const results: T[] = [];

      for (const operation of operations) {
        const result = await operation(session);
        results.push(result);
      }

      return results;
    }, options);
  }

  /**
   * Execute an operation with retries on transient errors
   * Useful for handling temporary network issues
   *
   * @param operation - Async function that performs database operations
   * @param maxRetries - Maximum number of retry attempts (default: 3)
   * @param retryDelay - Delay between retries in ms (default: 100)
   * @param options - Optional MongoDB transaction options
   * @returns Result of the operation
   */
  async executeWithRetry<T>(
    operation: (session: ClientSession) => Promise<T>,
    maxRetries: number = 3,
    retryDelay: number = 100,
    options?: any
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.executeInTransaction(operation, options);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if it's a transient error
        const isTransient = this.isTransientError(lastError);

        if (!isTransient || attempt === maxRetries) {
          throw lastError;
        }

        // Wait before retrying
        await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
      }
    }

    throw lastError || new Error('Transaction failed after retries');
  }

  /**
   * Check if an error is transient (retriable)
   */
  private isTransientError(error: Error): boolean {
    const transientErrorCodes = [
      112, // WriteConflict
      117, // NetworkTimeout
      6,   // HostUnreachable
      7,   // HostNotFound
      89,  // NetworkInterfaceExceededTimeLimit
      91,  // ShutdownInProgress
    ];

    const errorMessage = error.message.toLowerCase();

    // Check for MongoDB error codes
    if ('code' in error && typeof error.code === 'number') {
      if (transientErrorCodes.includes(error.code)) {
        return true;
      }
    }

    // Check for common transient error messages
    const transientMessages = [
      'transient',
      'temporary',
      'timeout',
      'network',
      'connection',
    ];

    return transientMessages.some(msg => errorMessage.includes(msg));
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if MongoDB session/transaction support is available
   */
  static async isTransactionSupported(): Promise<boolean> {
    try {
      const session = await mongoose.startSession();
      session.endSession();
      return true;
    } catch (error) {
      console.warn('MongoDB transactions not supported:', error);
      return false;
    }
  }
}

/**
 * Singleton instance for convenience
 */
export const transactionManager = new TransactionManager();

/**
 * Convenience function for simple transaction execution
 */
export async function withTransaction<T>(
  operation: (session: ClientSession) => Promise<T>,
  options?: any
): Promise<T> {
  return transactionManager.executeInTransaction(operation, options);
}
