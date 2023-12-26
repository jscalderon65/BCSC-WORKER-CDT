import * as dotenv from 'dotenv';
dotenv.config();

export const rabbitMq = {
  RABBIT_MQ_SERVER: process.env.RABBIT_MQ_SERVER,
  ERROR_FIXED_RATE_CDT_WORKER_QUEUE:
    process.env.ERROR_FIXED_RATE_CDT_WORKER_QUEUE,
  FIXED_RATE_CDT_WORKER_QUEUE: process.env.FIXED_RATE_CDT_WORKER_QUEUE,
  EMAIL_TO_LIQUIDATED_FIXED_RATE_CDT_WORKER_QUEUE:
    process.env.EMAIL_TO_LIQUIDATED_FIXED_RATE_CDT_WORKER_QUEUE,
  CONNECTION_ERROR_MESSAGE: 'Connection error to RabbitMQ',
  ON_CLOSE_CONNECTION_MESSAGE: 'Connection to RabbitMQ closed"',
  CONNECTION_MESSAGE: (
    workerName: string,
    queueName: string,
    host: string,
  ): string =>
    'Worker [' +
    workerName +
    '] connected to: [' +
    queueName +
    '] queue in [' +
    host +
    '] host',
};
