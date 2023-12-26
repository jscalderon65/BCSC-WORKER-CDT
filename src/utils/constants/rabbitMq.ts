export const rabbitMq = {
  RABBIT_MQ_SERVER: 'amqp://localhost:5672',
  FIXED_RATE_CDT_WORKER_QUEUE: 'FIXED_RATE_CDT',
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
