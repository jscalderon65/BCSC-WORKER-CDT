import * as amqp from 'amqplib';
import { rabbitMq } from '../utils/constants/rabbitMq';
import { worker } from '../utils/constants/worker';
import { Logger } from '@nestjs/common';

const {
  FIXED_RATE_CDT_WORKER_QUEUE,
  RABBIT_MQ_SERVER,
  CONNECTION_MESSAGE,
  CONNECTION_ERROR_MESSAGE,
  ON_CLOSE_CONNECTION_MESSAGE,
} = rabbitMq;

const { FIXED_RATE_CDT_WORKER_NAME } = worker.NAMES;

export class FixedRateCdtWorker {
  constructor() {}

  async startListening(): Promise<void> {
    try {
      const connection = await amqp.connect(RABBIT_MQ_SERVER);
      connection.on('error', (err) => {
        new Logger().error(CONNECTION_ERROR_MESSAGE, err);
      });

      connection.on('close', () => {
        new Logger().log(ON_CLOSE_CONNECTION_MESSAGE);
      });

      const channel = await connection.createChannel();

      await channel.assertQueue(FIXED_RATE_CDT_WORKER_QUEUE, { durable: true });

      new Logger().log(
        CONNECTION_MESSAGE(
          FIXED_RATE_CDT_WORKER_NAME,
          FIXED_RATE_CDT_WORKER_QUEUE,
          RABBIT_MQ_SERVER,
        ),
      );

      channel.consume(FIXED_RATE_CDT_WORKER_QUEUE, (msg) => {
        if (msg !== null) {
          new Logger().log(msg.content.toString());
          channel.ack(msg);
        }
      });
    } catch (error) {
      new Logger().error(error);
    }
  }
}
