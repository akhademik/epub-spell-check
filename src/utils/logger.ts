
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