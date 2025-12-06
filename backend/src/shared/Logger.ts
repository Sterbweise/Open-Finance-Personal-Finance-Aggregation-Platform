/**
 * Logger Utility
 */

import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} [${level}]: ${stack ?? message} ${metaStr}`;
});

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL ?? 'info',
    format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
    ),
    transports: [
        new winston.transports.Console({
            format: combine(colorize(), logFormat),
        }),
    ],
});

export class Logger {
    constructor(private context?: string) { }

    private formatMessage(message: string): string {
        return this.context ? `[${this.context}] ${message}` : message;
    }

    info(message: string, meta?: Record<string, unknown>): void {
        logger.info(this.formatMessage(message), meta);
    }

    warn(message: string, meta?: Record<string, unknown>): void {
        logger.warn(this.formatMessage(message), meta);
    }

    error(message: string, meta?: Record<string, unknown>): void {
        logger.error(this.formatMessage(message), meta);
    }

    debug(message: string, meta?: Record<string, unknown>): void {
        logger.debug(this.formatMessage(message), meta);
    }
}
