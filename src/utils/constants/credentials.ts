import * as dotenv from 'dotenv';
dotenv.config();

export const credentials = {
  MONGO_URI: process.env.MONGO_HOST + '/' + process.env.MONGO_DB,
  MONGO_DB: process.env.MONGO_DB,
  PORT: process.env.PORT,
  CLIENT_AXIOS_INSTANCE: 'AXIOS_INSTANCE',
  URL_CLIENT_SERVICE: process.env.URL_CLIENT_SERVICE,
  TIME_ZONE: process.env.TZ,
  MAILJET_API_KEY: process.env.MAILJET_API_KEY,
  MAILJET_API_SECRET: process.env.MAILJET_API_SECRET,
  SENDER_MAILJET_EMAIL: process.env.SENDER_MAILJET_EMAIL,
};
