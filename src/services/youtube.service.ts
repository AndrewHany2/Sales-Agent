import axios, { AxiosResponse } from 'axios';
import { TokenStorageService } from './tokenStorage.service';
import { Platform } from '@prisma/client';
import { Logger } from '../utils/logger';
import { LiveChatMessage, YouTubeComment, YouTubeCommentThread, YouTubeVideo } from '../types/types';

export class YouTubeService {
    private tokenStorage: TokenStorageService;
    private baseUrl = 'https://www.googleapis.com/youtube/v3';
  
    constructor() {
      this.tokenStorage = new TokenStorageService();
    }
  
    private async getAccessToken(clientId: string): Promise<string | null> {
      const tokenData = await this.tokenStorage.getToken(clientId, Platform.YOUTUBE);
      return tokenData?.accessToken || null;
    }
  
    /**
     * Get channel information
     */
    async getChannel(clientId: string): Promise<unknown> {
      try {
        const accessToken = await this.getAccessToken(clientId);
        if (!accessToken) throw new Error('No access token available');
  
        const response: AxiosResponse = await axios.get(`${this.baseUrl}/channels`, {
          params: {
            part: 'snippet,statistics,contentDetails',
            mine: 'true',
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
  
        return response.data.items?.[0];
      } catch (error) {
        Logger.error('Failed to get YouTube channel', error instanceof Error ? error : new Error('Unknown error'));
        throw error;
      }
    }
  
    /**
     * Get channel videos
     */
    async getChannelVideos(clientId: string, maxResults: number = 10): Promise<YouTubeVideo[]> {
      try {
        const accessToken = await this.getAccessToken(clientId);
        if (!accessToken) throw new Error('No access token available');
  
        // First, get uploads playlist ID
        const channelResponse: AxiosResponse = await axios.get(`${this.baseUrl}/channels`, {
          params: {
            part: 'contentDetails',
            mine: 'true',
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
  
        const uploadsPlaylistId = channelResponse.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  
        if (!uploadsPlaylistId) {
          return [];
        }
  
        // Get videos from uploads playlist
        const playlistResponse: AxiosResponse = await axios.get(`${this.baseUrl}/playlistItems`, {
          params: {
            part: 'snippet',
            playlistId: uploadsPlaylistId,
            maxResults,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
  
        const videoIds = playlistResponse.data.items
          ?.map((item: { snippet?: { resourceId?: { videoId?: string } } }) => item.snippet?.resourceId?.videoId)
          .filter(Boolean);
  
        if (!videoIds || videoIds.length === 0) {
          return [];
        }
  
        // Get video details including statistics
        const videosResponse: AxiosResponse = await axios.get(`${this.baseUrl}/videos`, {
          params: {
            part: 'snippet,statistics',
            id: videoIds.join(','),
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
  
        return videosResponse.data.items || [];
      } catch (error) {
        Logger.error('Failed to get YouTube videos', error instanceof Error ? error : new Error('Unknown error'));
        return [];
      }
    }
  
    /**
     * Get comments for a video
     */
    async getVideoComments(
      clientId: string,
      videoId: string,
      maxResults: number = 20
    ): Promise<YouTubeCommentThread[]> {
      try {
        const accessToken = await this.getAccessToken(clientId);
        if (!accessToken) throw new Error('No access token available');
  
        const response: AxiosResponse = await axios.get(`${this.baseUrl}/commentThreads`, {
          params: {
            part: 'snippet,replies',
            videoId,
            maxResults,
            order: 'time', // 'time', 'relevance'
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
  
        return response.data.items || [];
      } catch (error) {
        Logger.error('Failed to get video comments', error instanceof Error ? error : new Error('Unknown error'));
        return [];
      }
    }
  
    /**
     * Reply to a comment
     */
    async replyToComment(
      clientId: string,
      commentId: string,
      text: string
    ): Promise<YouTubeComment | null> {
      try {
        const accessToken = await this.getAccessToken(clientId);
        if (!accessToken) throw new Error('No access token available');
  
        const response: AxiosResponse = await axios.post(
          `${this.baseUrl}/comments`,
          {
            snippet: {
              parentId: commentId,
              textOriginal: text,
            },
          },
          {
            params: {
              part: 'snippet',
            },
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
  
        Logger.info('Comment reply posted', { commentId });
        return response.data;
      } catch (error) {
        Logger.error('Failed to reply to comment', error instanceof Error ? error : new Error('Unknown error'));
        return null;
      }
    }
  
    /**
     * Delete a comment
     */
    async deleteComment(clientId: string, commentId: string): Promise<boolean> {
      try {
        const accessToken = await this.getAccessToken(clientId);
        if (!accessToken) throw new Error('No access token available');
  
        await axios.delete(`${this.baseUrl}/comments`, {
          params: {
            id: commentId,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
  
        Logger.info('Comment deleted', { commentId });
        return true;
      } catch (error) {
        Logger.error('Failed to delete comment', error instanceof Error ? error : new Error('Unknown error'));
        return false;
      }
    }
  
    /**
     * Get live streams for channel
     */
    async getLiveStreams(clientId: string): Promise<unknown[]> {
      try {
        const accessToken = await this.getAccessToken(clientId);
        if (!accessToken) throw new Error('No access token available');
  
        const response: AxiosResponse = await axios.get(`${this.baseUrl}/liveBroadcasts`, {
          params: {
            part: 'snippet,status',
            broadcastStatus: 'active',
            mine: 'true',
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
  
        return response.data.items || [];
      } catch (error) {
        Logger.error('Failed to get live streams', error instanceof Error ? error : new Error('Unknown error'));
        return [];
      }
    }
  
    /**
     * Get live chat messages
     */
    async getLiveChatMessages(
      clientId: string,
      liveChatId: string,
      pageToken?: string
    ): Promise<{ messages: LiveChatMessage[]; nextPageToken?: string; pollingIntervalMillis?: number }> {
      try {
        const accessToken = await this.getAccessToken(clientId);
        if (!accessToken) throw new Error('No access token available');
  
        const response: AxiosResponse = await axios.get(`${this.baseUrl}/liveChat/messages`, {
          params: {
            liveChatId,
            part: 'snippet,authorDetails',
            maxResults: 200,
            pageToken,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
  
        return {
          messages: response.data.items || [],
          nextPageToken: response.data.nextPageToken,
          pollingIntervalMillis: response.data.pollingIntervalMillis,
        };
      } catch (error) {
        Logger.error('Failed to get live chat messages', error instanceof Error ? error : new Error('Unknown error'));
        return { messages: [] };
      }
    }
  
    /**
     * Send live chat message
     */
    async sendLiveChatMessage(
      clientId: string,
      liveChatId: string,
      text: string
    ): Promise<LiveChatMessage | null> {
      try {
        const accessToken = await this.getAccessToken(clientId);
        if (!accessToken) throw new Error('No access token available');
  
        const response: AxiosResponse = await axios.post(
          `${this.baseUrl}/liveChat/messages`,
          {
            snippet: {
              liveChatId,
              type: 'textMessageEvent',
              textMessageDetails: {
                messageText: text,
              },
            },
          },
          {
            params: {
              part: 'snippet',
            },
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
  
        Logger.info('Live chat message sent', { liveChatId });
        return response.data;
      } catch (error) {
        Logger.error('Failed to send live chat message', error instanceof Error ? error : new Error('Unknown error'));
        return null;
      }
    }
  }