import * as amqp from 'amqplib';
import { rabbitMq } from '../utils/constants/rabbitMq';
import { Logger } from '@nestjs/common';
import { worker } from 'src/utils/constants/worker';

const {
  ERROR_FIXED_RATE_CDT_WORKER_QUEUE,
  RABBIT_MQ_SERVER,
  CONNECTION_MESSAGE,
  CONNECTION_ERROR_MESSAGE,
  ON_CLOSE_CONNECTION_MESSAGE,
  EMAIL_TO_LIQUIDATED_FIXED_RATE_CDT_WORKER_QUEUE,
} = rabbitMq;

const { FIXED_RATE_CDT_WORKER_NAME } = worker.NAMES;

export const sendErrorFixedCdtToErrorQueue = async (
  fixedRateCdtWithProblem,
) => {
  try {
    const connection = await amqp.connect(RABBIT_MQ_SERVER);
    connection.on('error', (err) => {
      new Logger().error(CONNECTION_ERROR_MESSAGE, err);
    });

    connection.on('close', () => {
      new Logger().log(ON_CLOSE_CONNECTION_MESSAGE);
    });

    const channel = await connection.createChannel();

    await channel.assertQueue(ERROR_FIXED_RATE_CDT_WORKER_QUEUE, {
      durable: true,
    });

    new Logger().log(
      CONNECTION_MESSAGE(
        FIXED_RATE_CDT_WORKER_NAME,
        ERROR_FIXED_RATE_CDT_WORKER_QUEUE,
        RABBIT_MQ_SERVER,
      ),
    );

    channel.sendToQueue(
      ERROR_FIXED_RATE_CDT_WORKER_QUEUE,
      Buffer.from(JSON.stringify(fixedRateCdtWithProblem)),
    );
    setTimeout(() => {
      connection.close();
    }, 1000);
  } catch (error) {
    new Logger().error(error);
  }
};

export const addEmailFlagForLiquidatedFixedCdt = async (emailData) => {
  try {
    const connection = await amqp.connect(RABBIT_MQ_SERVER);
    connection.on('error', (err) => {
      new Logger().error(CONNECTION_ERROR_MESSAGE, err);
    });

    connection.on('close', () => {
      new Logger().log(ON_CLOSE_CONNECTION_MESSAGE);
    });

    const channel = await connection.createChannel();

    await channel.assertQueue(EMAIL_TO_LIQUIDATED_FIXED_RATE_CDT_WORKER_QUEUE, {
      durable: true,
    });

    new Logger().log(
      CONNECTION_MESSAGE(
        EMAIL_TO_LIQUIDATED_FIXED_RATE_CDT_WORKER_QUEUE,
        ERROR_FIXED_RATE_CDT_WORKER_QUEUE,
        RABBIT_MQ_SERVER,
      ),
    );

    channel.sendToQueue(
      EMAIL_TO_LIQUIDATED_FIXED_RATE_CDT_WORKER_QUEUE,
      Buffer.from(JSON.stringify(emailData)),
    );
    setTimeout(() => {
      connection.close();
    }, 1000);
  } catch (error) {
    new Logger().error(error);
  }
};
