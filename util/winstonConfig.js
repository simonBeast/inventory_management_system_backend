const winston = require('winston');
require('winston-daily-rotate-file');
const { combine, timestamp, printf, align} = winston.format;

const fileRotateTransport = new winston.transports.DailyRotateFile({
    filename: './logs/%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxFiles: '10d',
});

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format:combine(
        timestamp({
          format: 'YYYY-MM-DD hh:mm:ss.SSS A',
        }),
        printf((info) => `[${info.timestamp}] ${info.level}:    ${info.message}`)
      ),
    transports: [fileRotateTransport,
        new winston.transports.File({
            filename: './logs/app-error.log',
            level: 'error',
        })],
});
module.exports = logger; 