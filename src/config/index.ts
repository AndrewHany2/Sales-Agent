import { Config } from '../types/types';

export const config: Config = {
  port: 3000,
  platforms: {
    facebook: {
      enabled: false,
      pageAccessToken: process.env.FB_PAGE_ACCESS_TOKEN,
      verifyToken: process.env.FB_VERIFY_TOKEN,
      apiVersion: 'v18.0',
    },
    instagram: {
      enabled: false,
      accessToken: process.env.IG_ACCESS_TOKEN,
      businessAccountId: process.env.IG_BUSINESS_ACCOUNT_ID,
    },
    twitter: {
      enabled: false,
      apiKey: process.env.TWITTER_API_KEY,
      apiSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    },
    telegram: {
      enabled: false,
      botToken: process.env.TELEGRAM_BOT_TOKEN,
    },
    whatsapp: {
      enabled: false,
      phoneNumberId: process.env.WA_PHONE_NUMBER_ID,
      accessToken: process.env.WA_ACCESS_TOKEN,
    },
    slack: {
      enabled: false,
      botToken: process.env.SLACK_BOT_TOKEN,
      signingSecret: process.env.SLACK_SIGNING_SECRET,
    },
  },
};
console.log(config)
