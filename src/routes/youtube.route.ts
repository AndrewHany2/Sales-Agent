// src/routes/youtube.route.ts

import { Router, Request, Response } from 'express';
import { YouTubeService } from '../services/youtube.service';

export const createYouTubeRoutes = (): Router => {
  const router = Router();
  const youtubeService = new YouTubeService();

  // Get channel info
  router.get('/channel/:clientId', async (req: Request, res: Response) => {
    try {
      const { clientId } = req.params;
      const channel = await youtubeService.getChannel(clientId);
      return res.json({ success: true, channel });
    } catch (error) {
        return res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Get channel videos
  router.get('/videos/:clientId', async (req: Request, res: Response) => {
    try {
      const { clientId } = req.params;
      const maxResults = parseInt(req.query.maxResults as string) || 10;
      const videos = await youtubeService.getChannelVideos(clientId, maxResults);
      return  res.json({ success: true, videos, count: videos.length });
    } catch (error) {
        return res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Get video comments
  router.get('/comments/:clientId/:videoId', async (req: Request, res: Response) => {
    try {
      const { clientId, videoId } = req.params;
      const maxResults = parseInt(req.query.maxResults as string) || 20;
      const comments = await youtubeService.getVideoComments(clientId, videoId, maxResults);
      return res.json({ success: true, comments, count: comments.length });
    } catch (error) {
        return res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Reply to comment
  router.post('/comments/reply', async (req: Request, res: Response) => {
    try {
      const { clientId, commentId, text } = req.body;
      
      if (!clientId || !commentId || !text) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: clientId, commentId, text' 
        });
      }

      const reply = await youtubeService.replyToComment(clientId, commentId, text);
      return res.json({ success: true, reply });
    } catch (error) {
        return res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Delete comment
  router.delete('/comments/:clientId/:commentId', async (req: Request, res: Response) => {
    try {
      const { clientId, commentId } = req.params;
      const success = await youtubeService.deleteComment(clientId, commentId);
      return res.json({ success });
    } catch (error) {
        return res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Get live streams
  router.get('/live/:clientId', async (req: Request, res: Response) => {
    try {
      const { clientId } = req.params;
      const streams = await youtubeService.getLiveStreams(clientId);
      return res.json({ success: true, streams, count: streams.length });
    } catch (error) {
        return res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Get live chat messages
  router.get('/live/chat/:clientId/:liveChatId', async (req: Request, res: Response) => {
    try {
      const { clientId, liveChatId } = req.params;
      const pageToken = req.query.pageToken as string;
      const result = await youtubeService.getLiveChatMessages(clientId, liveChatId, pageToken);
      return res.json({ success: true, ...result });
    } catch (error) {
        return res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Send live chat message
  router.post('/live/chat/send', async (req: Request, res: Response) => {
    try {
      const { clientId, liveChatId, text } = req.body;
      
      if (!clientId || !liveChatId || !text) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: clientId, liveChatId, text' 
        });
      }

      const message = await youtubeService.sendLiveChatMessage(clientId, liveChatId, text);
      return res.json({ success: true, message });
    } catch (error) {
    return res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  return router;
};