import * as amqp from 'amqplib';
import { rabbitMq } from '../utils/constants/rabbitMq';
import { worker } from '../utils/constants/worker';
import { Logger } from '@nestjs/common';
import mongoose, { Types } from 'mongoose';
import { credentials } from '../utils/constants/credentials';
import { mongoDb } from '../utils/constants/mongoDb';
import { messages } from '../utils/constants/messages';
import Mailjet from 'node-mailjet';
import { sendGridTemplate } from '../assets/LiquidatedFixeRateCdtEmail';

const {
  RABBIT_MQ_SERVER,
  CONNECTION_MESSAGE,
  CONNECTION_ERROR_MESSAGE,
  ON_CLOSE_CONNECTION_MESSAGE,
  EMAIL_TO_LIQUIDATED_FIXED_RATE_CDT_WORKER_QUEUE,
} = rabbitMq;

const { SEND_EMAIL_FOR_LIQUIDATED_CDT_WORKER_NAME } = worker.NAMES;

const { CLIENT } = mongoDb.SCHEMA_NAMES;
const { MONGO_URI, MAILJET_API_KEY, MAILJET_API_SECRET, SENDER_MAILJET_EMAIL } =
  credentials;

const { LIQUIDATED_CDT_SUBJECT, CONFIRMATION_EMAIL_MESSAGE } =
  messages.EMAIL_MESSAGES;

export class SendEmailForLiquidatedCdtWorker {
  constructor() {}

  async startListening(): Promise<void> {
    try {
      new Logger().log(
        EMAIL_TO_LIQUIDATED_FIXED_RATE_CDT_WORKER_QUEUE + ' started...',
      );
      const connection = await amqp.connect(RABBIT_MQ_SERVER);
      connection.on('error', (err) => {
        new Logger().error(CONNECTION_ERROR_MESSAGE, err);
      });

      connection.on('close', () => {
        new Logger().log(ON_CLOSE_CONNECTION_MESSAGE);
      });

      const channel = await connection.createChannel();

      await channel.assertQueue(
        EMAIL_TO_LIQUIDATED_FIXED_RATE_CDT_WORKER_QUEUE,
        { durable: true },
      );

      new Logger().log(
        CONNECTION_MESSAGE(
          SEND_EMAIL_FOR_LIQUIDATED_CDT_WORKER_NAME,
          EMAIL_TO_LIQUIDATED_FIXED_RATE_CDT_WORKER_QUEUE,
          RABBIT_MQ_SERVER,
        ),
      );

      await mongoose.connect(MONGO_URI);
      new Logger().log(messages.CONNECTION_MESSAGES.MONGO_CORRECT_CONNECTION);

      const db = mongoose.connection;
      const clientModel = db.collection(CLIENT);

      channel.consume(
        EMAIL_TO_LIQUIDATED_FIXED_RATE_CDT_WORKER_QUEUE,
        async (msg) => {
          if (msg !== null) {
            new Logger().log(msg.content.toString());
            const emailContent = JSON.parse(msg.content);
            const clientId: string = emailContent?.clientId || '';

            const getClientById = await clientModel.findOne({
              _id: new Types.ObjectId(clientId),
            });

            if (getClientById) {
              const clientEmail: string = getClientById.email;
              const clientName: string =
                getClientById.first_name + ' ' + getClientById.last_name;

              const emailBodyData = {
                ...emailContent,
                clientEmail,
                clientName,
              };

              await this.sendEmail(emailBodyData);
            } //Podría ponerse otra cola para insertar errores de envíos de correos
            channel.ack(msg);
          }
        },
      );
    } catch (error) {
      new Logger().error(error);
    }
  }

  async sendEmail(emailData) {
    try {
      new Logger().log(
        'Start email process to clientId: ' + emailData.clientId,
      );
      const mailJetInstance = new Mailjet({
        apiKey: MAILJET_API_KEY,
        apiSecret: MAILJET_API_SECRET,
      });

      await mailJetInstance.post('send', { version: 'v3.1' }).request({
        Messages: [
          {
            From: {
              Email: SENDER_MAILJET_EMAIL,
              Name: SENDER_MAILJET_EMAIL,
            },
            To: [
              {
                Email: emailData.clientEmail,
                Name: emailData.clientName,
              },
            ],
            Subject: LIQUIDATED_CDT_SUBJECT,
            TextPart: LIQUIDATED_CDT_SUBJECT,
            HTMLPart: sendGridTemplate(
              emailData.grossInterest,
              emailData.withholdingTax,
              emailData.remainingValue,
              emailData.clientName,
            ),
          },
        ],
      });

      new Logger().log(CONFIRMATION_EMAIL_MESSAGE(emailData.clientId));
    } catch (error) {
      new Logger().error(error);
    }
  }
}
