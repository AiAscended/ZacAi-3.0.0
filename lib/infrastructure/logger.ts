/**
 * ==========================================================
 * File: /lib/infrastructure/logger.ts
 * Project: ZacAI 3.0
 * Role: Centralized Structured Logging Utility
 * Description:
 *   - Provides a unified interface for logging across the entire application.
 *   - Supports structured logging (JSON) for easy parsing by log aggregation systems.
 *   - Allows for different log levels (debug, info, warn, error, fatal).
 * Advanced Features:
 *   - Configurable output (console, file, external log service).
 *   - Contextual logging (user ID, session ID, module name).
 *   - Integration with monitoring and alerting systems.
 * ==========================================================
 */

import fs from 'fs/promises';
import path from 'path';

// --- Configuration ---
// Define log levels for severity filtering
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

// Global minimum log level to output (e.g., set to LogLevel.INFO for production)
const MIN_LOG_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;

// Enable or disable file logging
const ENABLE_FILE_LOGGING: boolean = process.env.NODE_ENV === 'production';
const LOG_FILE_PATH: string = path.join(process.cwd(), 'data', 'system', 'app.log'); // Using the data/system folder

// Ensure the log directory exists
async function ensureLogDirectory(): Promise<void> {
  const logDir = path.dirname(LOG_FILE_PATH);
  try {
    await fs.mkdir(logDir, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') { // Ignore if directory already exists
      console.error(`[Logger] Failed to create log directory: ${logDir}`, error);
    }
  }
}

// Call this once on application startup if file logging is enabled
if (ENABLE_FILE_LOGGING) {
  ensureLogDirectory().catch(err => console.error("Error ensuring log directory exists:", err));
}

/**
 * @interface LogEntry
 * @description Represents the structure of a single structured log entry.
 */
interface LogEntry {
  timestamp: string;
  level: keyof typeof LogLevel;
  module: string; // e.g., 'Orchestrator', 'CodingEngine', 'Cache'
  message: string;
  context?: Record<string, any>; // Additional contextual data
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  userId?: string;
  sessionId?: string;
  traceId?: string; // Link to the explainability trace
}

/**
 * @class AppLogger
 * @description Centralized logging class with structured output.
 */
class AppLogger {
  private static instance: AppLogger;

  private constructor() {
    // Private constructor to enforce singleton
  }

  public static getInstance(): AppLogger {
    if (!AppLogger.instance) {
      AppLogger.instance = new AppLogger();
    }
    return AppLogger.instance;
  }

  /**
   * @private
   * @method _log
   * @description Internal method to create and dispatch a log entry.
   * @param level The severity level of the log.
   * @param module The module/component generating the log.
   * @param message The main log message.
   * @param context Additional data.
   */
  private _log(
    level: LogLevel,
    module: string,
    message: string,
    context?: Record<string, any>,
    error?: Error,
    userId?: string,
    sessionId?: string,
    traceId?: string,
  ): void {
    if (level < MIN_LOG_LEVEL) {
      return; // Filter out logs below the minimum configured level
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level] as keyof typeof LogLevel,
      module,
      message,
      context,
      userId,
      sessionId,
      traceId,
    };

    if (error) {
      logEntry.error = {
        message: error.message,
        stack: error.stack,
        // Add more error properties if available, e.g., (error as any).code
      };
    }

    const jsonLog = JSON.stringify(logEntry);

    // Output to console
    const consoleOutput = `[${logEntry.level}] [${logEntry.timestamp}] [${logEntry.module}] ${logEntry.message}`;
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(consoleOutput, context || '', error || '');
        break;
      case LogLevel.INFO:
        console.info(consoleOutput, context || '', error || '');
        break;
      case LogLevel.WARN:
        console.warn(consoleOutput, context || '', error || '');
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(consoleOutput, context || '', error || '');
        break;
    }

    // Output to file (asynchronously)
    if (ENABLE_FILE_LOGGING) {
      fs.appendFile(LOG_FILE_PATH, jsonLog + '\n').catch(fileErr => {
        console.error(`[Logger] Failed to write to log file: ${LOG_FILE_PATH}`, fileErr);
      });
    }

    // TODO: Add integration for external log services (e.g., Datadog, Splunk) here
    // sendToExternalLogService(jsonLog);
  }

  // --- Public Logging Methods ---
  debug(module: string, message: string, context?: Record<string, any>, userId?: string, sessionId?: string, traceId?: string): void {
    this._log(LogLevel.DEBUG, module, message, context, undefined, userId, sessionId, traceId);
  }

  info(module: string, message: string, context?: Record<string, any>, userId?: string, sessionId?: string, traceId?: string): void {
    this._log(LogLevel.INFO, module, message, context, undefined, userId, sessionId, traceId);
  }

  warn(module: string, message: string, context?: Record<string, any>, userId?: string, sessionId?: string, traceId?: string): void {
    this._log(LogLevel.WARN, module, message, context, undefined, userId, sessionId, traceId);
  }

  error(module: string, message: string, error?: Error, context?: Record<string, any>, userId?: string, sessionId?: string, traceId?: string): void {
    this._log(LogLevel.ERROR, module, message, context, error, userId, sessionId, traceId);
  }

  fatal(module: string, message: string, error?: Error, context?: Record<string, any>, userId?: string, sessionId?: string, traceId?: string): void {
    this._log(LogLevel.FATAL, module, message, context, error, userId, sessionId, traceId);
  }
}

export const appLogger = AppLogger.getInstance();

// Example Usage:
// import { appLogger } from '../infrastructure/logger';
// appLogger.info('Orchestrator', 'Processing new prompt', { promptId: 'abc' }, 'user123');
// appLogger.error('CodingEngine', 'Code execution failed', new Error('Timeout'), { codeSnippet: '...' });
