// src/utils/logger.ts

/**
 * A simple logger utility to wrap console methods.
 * This adheres to the project convention of not using console directly.
 */
class Logger {
  log(message: string, ...optionalParams: unknown[]) {
    // eslint-disable-next-line no-console
    console.log(message, ...optionalParams);
  }

  warn(message: string, ...optionalParams: unknown[]) {
    // eslint-disable-next-line no-console
    console.warn(message, ...optionalParams);
  }

  error(message: string, ...optionalParams: unknown[]) {
    // eslint-disable-next-line no-console
    console.error(message, ...optionalParams);
  }
}

export const logger = new Logger();