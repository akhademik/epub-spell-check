class Logger {
  debug(message: string, ...optionalParams: unknown[]) {
    // eslint-disable-next-line no-console
    console.debug(message, ...optionalParams);
  }

  info(message: string, ...optionalParams: unknown[]) {
    // eslint-disable-next-line no-console
    console.info(message, ...optionalParams);
  }

  log(message: string, ...optionalParams: unknown[]) {
    this.info(message, ...optionalParams);
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