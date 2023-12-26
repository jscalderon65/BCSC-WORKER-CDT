import * as dotenv from 'dotenv';
dotenv.config();
import { credentials } from './credentials';

export const messages = {
  CONNECTION_MESSAGES: {
    MONGO_CORRECT_CONNECTION:
      'DB successfully connected to ' + credentials.MONGO_DB,
    MONGO_END_CONNECTION: 'DB disconnected',
  },
  EMAIL_MESSAGES: {
    LIQUIDATED_CDT_SUBJECT:
      'Hemos liquidado tu CDT de tasa fija, te enviamos información acerca de tus intereses',
    CONFIRMATION_EMAIL_MESSAGE: (clientId) =>
      'Email sended to clientId: ' + clientId + ' sended.',
  },
};
