import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }), 
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `[${timestamp}] [${level.toUpperCase()}]: ${stack || message}`;
  })
);

const fileRotateTransport = new winston.transports.DailyRotateFile({
  dirname: path.resolve(__dirname, '..', '..', 'logs'),
  filename: 'lyos-bot-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true, 
  maxSize: '20m',     
  maxFiles: '30d',   
});


export const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    fileRotateTransport,
    
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        logFormat
      )
    })
  ]
});