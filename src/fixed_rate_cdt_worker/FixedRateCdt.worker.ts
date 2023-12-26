import * as amqp from 'amqplib';
import { rabbitMq } from '../utils/constants/rabbitMq';
import { worker } from '../utils/constants/worker';
import { Logger } from '@nestjs/common';
import mongoose, { Types } from 'mongoose';
import { credentials } from '../utils/constants/credentials';
import { mongoDb } from '../utils/constants/mongoDb';
import { messages } from '../utils/constants/messages';
import {
  addEmailFlagForLiquidatedFixedCdt,
  sendErrorFixedCdtToErrorQueue,
} from './FixedRateCdt.operations';
const {
  FIXED_RATE_CDT_WORKER_QUEUE,
  RABBIT_MQ_SERVER,
  CONNECTION_MESSAGE,
  CONNECTION_ERROR_MESSAGE,
  ON_CLOSE_CONNECTION_MESSAGE,
} = rabbitMq;

const { FIXED_RATE_CDT_WORKER_NAME } = worker.NAMES;

const { FIXED_RATE_CDT, BANKING_ACCOUNT, FIXED_RATE_CERTIFICATES } =
  mongoDb.SCHEMA_NAMES;
const MONGO_URI = credentials.MONGO_URI;

export class FixedRateCdtWorker {
  constructor() {}

  async startListening(): Promise<void> {
    try {
      new Logger().log(FIXED_RATE_CDT_WORKER_NAME + ' started...');
      const connection = await amqp.connect(RABBIT_MQ_SERVER);
      connection.on('error', (err) => {
        new Logger().error(CONNECTION_ERROR_MESSAGE, err);
      });

      connection.on('close', () => {
        new Logger().log(ON_CLOSE_CONNECTION_MESSAGE);
      });

      const channel = await connection.createChannel();

      await channel.assertQueue(FIXED_RATE_CDT, { durable: true });

      new Logger().log(
        CONNECTION_MESSAGE(
          FIXED_RATE_CDT_WORKER_NAME,
          FIXED_RATE_CDT_WORKER_QUEUE,
          RABBIT_MQ_SERVER,
        ),
      );

      await mongoose.connect(MONGO_URI);
      new Logger().log(messages.CONNECTION_MESSAGES.MONGO_CORRECT_CONNECTION);

      const db = mongoose.connection;
      const FixedRateCdtModel = db.collection(FIXED_RATE_CDT);
      const BankingAccountModel = db.collection(BANKING_ACCOUNT);
      const FixedRateCertificatesModel = db.collection(FIXED_RATE_CERTIFICATES);

      const deleteRepeated = [];
      channel.consume(FIXED_RATE_CDT_WORKER_QUEUE, async (msg) => {
        if (msg !== null) {
          new Logger().log(msg.content.toString());
          const messageFormatted = JSON.parse(msg.content.toString());
          const fixedRateCdtId = messageFormatted?._id || '';
          deleteRepeated.push(messageFormatted);

          const FixedRateCertificatesId = messageFormatted?.fixed_rate_id || '';
          const bankingAccountId = messageFormatted?.account_id || '';

          const getFixedRateCertificateById =
            await FixedRateCertificatesModel.findOne({
              _id: new Types.ObjectId(FixedRateCertificatesId),
            });

          const getBankingAccountById = await BankingAccountModel.findOne({
            _id: new Types.ObjectId(bankingAccountId),
          });

          const getFixedRateCdtById = await FixedRateCdtModel.findOne({
            _id: new Types.ObjectId(fixedRateCdtId),
          });

          if (getBankingAccountById && getFixedRateCertificateById) {
            const depositDays: number = getFixedRateCdtById.depositDays;
            const cdtRate = getFixedRateCertificateById.rates.find(
              (rate) =>
                depositDays >= rate.minDaysLimit &&
                depositDays <= rate.maxDaysLimit,
            );

            const depositedAmount: number = getFixedRateCdtById.depositedAmount;
            const availableBalance: number =
              getBankingAccountById.available_balance;

            const { grossInterest, withholdingTax, remainingValue } =
              this.calculateCDTInterest(
                depositDays,
                cdtRate.rate,
                depositedAmount,
              );

            const newBalance: number =
              depositedAmount + availableBalance + remainingValue;

            await FixedRateCdtModel.updateOne(
              { _id: new Types.ObjectId(fixedRateCdtId) },
              { $set: { is_liquidated: true } },
            );

            await BankingAccountModel.updateOne(
              { _id: new Types.ObjectId(bankingAccountId) },
              { $set: { available_balance: newBalance } },
            );

            const emailData = {
              grossInterest,
              withholdingTax,
              remainingValue,
              clientId: getBankingAccountById?.client_id || '',
            };

            await addEmailFlagForLiquidatedFixedCdt(emailData);

            channel.ack(msg);
          } else {
            await FixedRateCdtModel.updateOne(
              { _id: new Types.ObjectId(fixedRateCdtId) },
              { $set: { has_liquidation_problems: true } },
            );
            await sendErrorFixedCdtToErrorQueue(msg);
            channel.ack(msg);
          }
        }
      });
    } catch (error) {
      new Logger().error(error);
    }
  }

  calculateCDTInterest(
    days: number,
    annualInterestRate: number,
    value: number,
  ) {
    const effectiveRate = annualInterestRate / 100;
    const dailyRate = effectiveRate / 360;

    const grossInterest = value * dailyRate * days;

    const withholdingTaxPercentage = 0.06;
    const withholdingTax = grossInterest * withholdingTaxPercentage;

    const remainingValue = grossInterest - withholdingTax;

    return {
      grossInterest,
      withholdingTax,
      remainingValue,
    };
  }
}
