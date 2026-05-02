/**
 * Frontend Logger Utility
 * 
 * Structured logging for frontend operations with consistent formatting.
 * Uses [SYSTEM] prefix for production debugging.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: unknown;
}

/**
 * Format a log entry with consistent structure
 */
function formatLogEntry(
  level: LogLevel,
  context: string,
  message: string,
  data?: unknown
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    context,
    message,
    data,
  };
}

/**
 * Get emoji for log level
 */
function getLevelEmoji(level: LogLevel): string {
  switch (level) {
    case 'debug':
      return '🔍';
    case 'info':
      return 'ℹ️';
    case 'warn':
      return '⚠️';
    case 'error':
      return '❌';
  }
}

/**
 * Log at specified level
 */
function logAtLevel(
  level: LogLevel,
  context: string,
  message: string,
  data?: unknown
) {
  const entry = formatLogEntry(level, context, message, data);
  const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  logFn(
    `[SYSTEM] ${getLevelEmoji(level)} [${entry.context}] ${entry.message}`,
    entry.data || ''
  );
}

/**
 * Logger for frontend operations
 */
export const logger = {
  /**
   * Debug level log - development only
   */
  debug(context: string, message: string, data?: unknown) {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[SYSTEM] ${getLevelEmoji('debug')} ${formatLogEntry('debug', context, message, data)}`
      );
    }
  },

  /**
   * Info level log - general information
   */
  info(context: string, message: string, data?: unknown) {
    logAtLevel('info', context, message, data);
  },

  /**
   * Warn level log - something needs attention
   */
  warn(context: string, message: string, data?: unknown) {
    logAtLevel('warn', context, message, data);
  },

  /**
   * Error level log - something failed
   */
  error(context: string, message: string, data?: unknown) {
    logAtLevel('error', context, message, data);
  },

  /**
   * Log API request
   */
  apiRequest(method: string, url: string, body?: unknown) {
    logger.debug('API', `${method} ${url}`, body);
  },

  /**
   * Log API response
   */
  apiResponse(method: string, url: string, status: number, duration: number) {
    const entry = formatLogEntry(
      status >= 400 ? 'error' : 'info',
      'API',
      `${method} ${url} -> ${status} (${duration}ms)`
    );
    const logFn = status >= 400 ? console.error : console.log;
    logFn(
      `[SYSTEM] ${getLevelEmoji(entry.level)} [${entry.context}] ${entry.message}`
    );
  },

  /**
   * Log user action
   */
  userAction(action: string, details?: unknown) {
    logger.info('USER', action, details);
  },

  /**
   * Log system event
   */
  systemEvent(event: string, details?: unknown) {
    logger.info('SYSTEM', event, details);
  },

  /**
   * Generic log method
   */
  log(level: LogLevel, context: string, message: string, data?: unknown) {
    logAtLevel(level, context, message, data);
  },
};

// Export for use in components
export default logger;
