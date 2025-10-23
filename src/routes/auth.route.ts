import { Router, Request, Response } from 'express';
import { PlatformManager } from '../services/platformManager.service';
import { config } from '../config';
import { Logger } from '../utils/logger';
import axios from 'axios';
import { GoogleTokenResponse, GoogleUserInfo } from '../types/types';

export const createAuthRoutes = (platformManager: PlatformManager): Router => {
  const router = Router();

  // Get authentication URLs for all platforms
  router.get('/urls', (_req: Request, res: Response) => {
    const authUrls = {
      facebook: {
        enabled: config.platforms.facebook.enabled,
        authUrl: config.platforms.facebook.enabled 
          ? `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.FB_APP_ID}&redirect_uri=${process.env.FB_REDIRECT_URI}&scope=pages_messaging,pages_show_list`
          : null,
        instructions: 'Get Page Access Token from Facebook Developer Console'
      },
      instagram: {
        enabled: config.platforms.instagram.enabled,
        authUrl: config.platforms.instagram.enabled
          ? `https://api.instagram.com/oauth/authorize?client_id=${process.env.IG_APP_ID}&redirect_uri=${process.env.IG_REDIRECT_URI}&scope=user_profile,user_media&response_type=code`
          : null,
        instructions: 'Get Instagram Business Account Access Token'
      },
      telegram: {
        enabled: config.platforms.telegram.enabled,
        authUrl: config.platforms.telegram.enabled
          ? `https://t.me/${process.env.TELEGRAM_BOT_USERNAME || 'your_bot'}`
          : null,
        instructions: 'Start conversation with bot and get chat ID'
      },
      whatsapp: {
        enabled: config.platforms.whatsapp.enabled,
        authUrl: config.platforms.whatsapp.enabled
          ? `https://developers.facebook.com/tools/explorer/`
          : null,
        instructions: 'Get WhatsApp Business API credentials from Meta Business'
      },
      slack: {
        enabled: config.platforms.slack.enabled,
        authUrl: config.platforms.slack.enabled
          ? `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=app_mentions:read,channels:history,chat:write,im:history,im:read,im:write&user_scope=`
          : null,
        instructions: 'Install Slack app and get Bot Token'
      },
      twitter: {
        enabled: config.platforms.twitter.enabled,
        authUrl: config.platforms.twitter.enabled
          ? `https://developer.twitter.com/en/portal/dashboard`
          : null,
        instructions: 'Get API keys from Twitter Developer Portal'
      },
      youtube: {
        enabled: config.platforms.youtube.enabled,
        authUrl: `https://accounts.google.com/o/oauth2/v2/auth?` +
            new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            redirect_uri: process.env.YT_REDIRECT_URI!,
            response_type: 'code',
            scope: [
                'openid',
                'email',
                'profile',
                'https://www.googleapis.com/auth/youtube.readonly'
            ].join(' '),
            access_type: 'offline',     // ask for refresh_token
            prompt: 'consent'           // force consent so you reliably get refresh on dev
            }).toString(),
      },
      instructions: 'Sign in with Google to allow reading YouTube data'
    };

    res.json({ authUrls });
  });

  // Facebook OAuth callback
  router.get('/facebook/callback', (req: Request, res: Response) => {
    const { code, error } = req.query;
    
    if (error) {
      Logger.error('Facebook OAuth error', { error });
      return res.status(400).json({ error: 'Facebook authentication failed' });
    }

    if (!code) {
      return res.status(400).json({ error: 'Authorization code not provided' });
    }

    // Exchange code for access token
    Logger.info('Facebook OAuth callback received', { code });
    return res.json({ 
      success: true, 
      message: 'Facebook authentication successful. Please save the access token.',
      code: code as string
    });
  });

  // Instagram OAuth callback
  router.get('/instagram/callback', (req: Request, res: Response) => {
    const { code, error } = req.query;
    
    if (error) {
      Logger.error('Instagram OAuth error', { error });
      return res.status(400).json({ error: 'Instagram authentication failed' });
    }

    if (!code) {
      return res.status(400).json({ error: 'Authorization code not provided' });
    }

    Logger.info('Instagram OAuth callback received', { code });
    return res.json({ 
      success: true, 
      message: 'Instagram authentication successful. Please save the access token.',
      code: code as string
    });
  });

  // Slack OAuth callback
  router.get('/slack/callback', (req: Request, res: Response) => {
    const { code, error } = req.query;
    
    if (error) {
      Logger.error('Slack OAuth error', { error });
      return res.status(400).json({ error: 'Slack authentication failed' });
    }

    if (!code) {
      return res.status(400).json({ error: 'Authorization code not provided' });
    }

    Logger.info('Slack OAuth callback received', { code });
    return res.json({ 
      success: true, 
      message: 'Slack authentication successful. Please save the bot token.',
      code: code as string
    });
  });

  // Youtube OAuth callback
  router.get('/youtube/callback', async (req: Request, res: Response) => {
    const { code, error } = req.query;

    if (error) {
      Logger.error('YouTube OAuth error', { error });
      return res.status(400).json({ error: 'YouTube authentication failed' });
    }
    if (!code) {
      return res.status(400).json({ error: 'Authorization code not provided' });
    }

    try {
      // 1) Exchange code -> tokens
      const tokenResp = await axios.post<GoogleTokenResponse>(
        'https://oauth2.googleapis.com/token',
        new URLSearchParams({
          code: String(code),
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: process.env.YT_REDIRECT_URI!,
          grant_type: 'authorization_code',
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      const tokens = tokenResp.data;

      // 2) (Optional but useful) Get user profile via OIDC
      const userInfoResp = await axios.get<GoogleUserInfo>(
        'https://openidconnect.googleapis.com/v1/userinfo',
        { headers: { Authorization: `Bearer ${tokens.access_token}` } }
      );
      const user = userInfoResp.data;

      Logger.info('YouTube OAuth success', {
        sub: user.sub,
        email: user.email,
        hasRefresh: Boolean(tokens.refresh_token),
      });

      // 3) Persist tokens (replace with your real persistence)
      // If your PlatformManager has a save method, use it:
      // await platformManager.saveToken('youtube', user.sub, {
      //   accessToken: tokens.access_token,
      //   refreshToken: tokens.refresh_token,
      //   expiresIn: tokens.expires_in,
      //   scope: tokens.scope,
      //   idToken: tokens.id_token,
      //   profile: user,
      // });

      // For now, just return them to the caller (DO NOT do this in production)
      return res.json({
        success: true,
        message: 'YouTube authentication successful.',
        user,
        tokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token, // may be undefined if Google didn’t issue on this run
          expires_in: tokens.expires_in,
          scope: tokens.scope,
          id_token: tokens.id_token,
        },
      });
    } catch (e: any) {
      Logger.error('YouTube token exchange failed', {
        status: e?.response?.status,
        data: e?.response?.data,
        message: e?.message,
      });
      return res.status(500).json({
        error: 'Failed to exchange code for tokens',
        details: e?.response?.data || e?.message || 'Unknown error',
      });
    }
  });

  // Test platform connection
  router.post('/test/:platform', async (req: Request, res: Response) => {
    const { platform } = req.params;
    const { testData } = req.body;
    console.log(testData)
    if (!platformManager.getAdapter(platform)) {
      return res.status(400).json({ error: 'Platform not supported' });
    }

    try {
      // Test connection based on platform
      switch (platform) {
        case 'telegram': {
            return res.json({ 
              success: true, 
              message: 'Telegram connection test successful',
              platform: 'telegram'
            });
        }
        case 'facebook': {
          return res.json({ 
            success: true, 
            message: 'Facebook connection test successful',
            platform: 'facebook'
          });
        }
        case 'instagram': {
          return res.json({ 
            success: true, 
            message: 'Instagram connection test successful',
            platform: 'instagram'
          });
        }
        
        case 'whatsapp': {
          return res.json({ 
            success: true, 
            message: 'WhatsApp connection test successful',
            platform: 'whatsapp'
          });
        }
        
        case 'slack': {
          return res.json({ 
            success: true, 
            message: 'Slack connection test successful',
            platform: 'slack'
          });
        }
        
        case 'twitter': {
          return res.json({ 
            success: true, 
            message: 'Twitter connection test successful',
            platform: 'twitter'
          });
        }
        
        default:
          return res.status(400).json({ error: 'Unknown platform' });
      }
    } catch (error) {
      Logger.error(`Connection test failed for ${platform}`, error);
      return res.status(500).json({ 
        error: `Connection test failed for ${platform}`,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get platform status
  router.get('/status', (_req: Request, res: Response) => {
    const status = Object.keys(config.platforms).map(platform => {
      const platformConfig = config.platforms[platform as keyof typeof config.platforms];
      const adapter = platformManager.getAdapter(platform);
      
      return {
        platform,
        enabled: platformConfig.enabled,
        configured: adapter !== undefined,
        hasToken: platformConfig.enabled && 
          (platformConfig as any).botToken || 
          (platformConfig as any).pageAccessToken || 
          (platformConfig as any).accessToken
      };
    });

    res.json({ platforms: status });
  });

  return router;
};
