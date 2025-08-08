import { createClient, RedisClientType } from 'redis';

let redis: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redis = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 10000,
      },
    });

    redis.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redis.on('connect', () => {
      console.log('Redis Client Connected');
    });

    redis.on('disconnect', () => {
      console.log('Redis Client Disconnected');
    });

    await redis.connect();
  }

  return redis;
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

export const CHAT_KEYS = {
  activeSession: (userId: number, conversationId?: number) => 
    conversationId ? `chat:session:${userId}:${conversationId}` : `chat:session:${userId}:active`,
  conversationList: (userId: number) => `chat:conversations:${userId}`,
  recentMessages: (conversationId: number) => `chat:messages:${conversationId}`,
  tempMessage: (conversationId: number, messageId: string) => `chat:temp:${conversationId}:${messageId}`,
  syncQueue: () => 'chat:sync:queue',
} as const;

export const CHAT_CONFIG = {
  SESSION_TTL: 60 * 60 * 24, // 24 hours
  MESSAGE_BUFFER_SIZE: 100, // Keep last 100 messages in Redis
  CONVERSATION_LIST_SIZE: 50, // Keep last 50 conversations in list
  TEMP_MESSAGE_TTL: 60 * 5, // 5 minutes for temporary messages
  SYNC_BATCH_SIZE: 10, // Sync 10 messages at a time
} as const;