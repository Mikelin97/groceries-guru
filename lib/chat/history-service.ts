import { getRedisClient, CHAT_KEYS, CHAT_CONFIG } from '@/lib/db/redis';
import { db } from '@/lib/db/drizzle';
import { conversations, messages, NewConversation, NewMessage, Conversation, Message } from '@/lib/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { withRetry, withCircuitBreaker, RetryableError, NonRetryableError, isTransientError } from './error-handler';

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system' | 'data';
  content: string;
  attachments?: any[];
  toolInvocations?: any[];
  metadata?: any;
  createdAt?: Date;
  conversationId?: number;
  tempId?: string; // For optimistic updates
}

export interface ConversationSummary {
  id: number;
  title?: string;
  language: string;
  lastMessageAt?: Date;
  messageCount: number;
  isActive: boolean;
  createdAt: Date;
}

export class ChatHistoryService {
  private redis = getRedisClient();

  async createConversation(
    userId: number, 
    teamId?: number, 
    language: string = 'en',
    title?: string
  ): Promise<Conversation> {
    // Create conversation metadata in PostgreSQL (but messages will be saved later)
    const [conversation] = await db.insert(conversations)
      .values({
        userId,
        teamId,
        title,
        language,
        isActive: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        messageCount: 0, // Messages will be counted when saved from Redis
      })
      .returning();

    // Cache the conversation summary for quick access
    const redis = await this.redis;
    await redis.zAdd(
      CHAT_KEYS.conversationList(userId),
      { score: Date.now(), value: JSON.stringify(conversation) }
    );

    // Keep only the most recent conversations in cache
    await redis.zRemRangeByRank(
      CHAT_KEYS.conversationList(userId),
      0,
      -(CHAT_CONFIG.CONVERSATION_LIST_SIZE + 1)
    );

    console.log(`Created new conversation ${conversation.id} for user ${userId}`);
    return conversation;
  }

  async addMessageToRedis(
    conversationId: number,
    message: ChatMessage
  ): Promise<{ success: boolean; tempId: string }> {
    const tempId = uuidv4();

    return await withCircuitBreaker(async () => {
      return await withRetry(async () => {
        try {
          const redis = await this.redis;
          const tempMessage = {
            ...message,
            tempId,
            createdAt: new Date(),
            conversationId,
          };

          // Store in Redis only for fast chat experience
          await redis.lPush(
            CHAT_KEYS.recentMessages(conversationId),
            JSON.stringify(tempMessage)
          );

          await redis.lTrim(
            CHAT_KEYS.recentMessages(conversationId),
            0,
            CHAT_CONFIG.MESSAGE_BUFFER_SIZE - 1
          );

          // Set expiration for the conversation messages
          await redis.expire(
            CHAT_KEYS.recentMessages(conversationId),
            CHAT_CONFIG.SESSION_TTL
          );

          return { success: true, tempId };
        } catch (error) {
          const err = error as Error;
          if (isTransientError(err)) {
            throw new RetryableError(`Failed to store message to Redis: ${err.message}`, err);
          }
          throw new NonRetryableError(`Non-retryable error storing message to Redis: ${err.message}`, err);
        }
      });
    }, {
      failureThreshold: 3,
      recoveryTimeout: 30000,
    });
  }

  async addMessage(
    conversationId: number,
    message: ChatMessage,
    optimistic: boolean = false
  ): Promise<{ success: boolean; messageId?: string; tempId?: string }> {
    const tempId = optimistic ? uuidv4() : undefined;

    return await withCircuitBreaker(async () => {
      if (optimistic) {
        return await withRetry(async () => {
          try {
            const redis = await this.redis;
            const tempMessage = {
              ...message,
              tempId,
              createdAt: new Date(),
              conversationId,
            };

            // Store operations in Redis with error handling
            await redis.setEx(
              CHAT_KEYS.tempMessage(conversationId, tempId!),
              CHAT_CONFIG.TEMP_MESSAGE_TTL,
              JSON.stringify(tempMessage)
            );

            await redis.lPush(
              CHAT_KEYS.recentMessages(conversationId),
              JSON.stringify(tempMessage)
            );

            await redis.lTrim(
              CHAT_KEYS.recentMessages(conversationId),
              0,
              CHAT_CONFIG.MESSAGE_BUFFER_SIZE - 1
            );

            // Queue for database sync
            await redis.lPush(
              CHAT_KEYS.syncQueue(),
              JSON.stringify({
                action: 'add_message',
                conversationId,
                message: tempMessage,
                tempId,
              })
            );

            return { success: true, tempId };
          } catch (error) {
            const err = error as Error;
            if (isTransientError(err)) {
              throw new RetryableError(`Failed to store message optimistically: ${err.message}`, err);
            }
            throw new NonRetryableError(`Non-retryable error storing message: ${err.message}`, err);
          }
        });
      } else {
        // Direct database insert with retry logic
        return await withRetry(async () => {
          try {
            const [dbMessage] = await db.insert(messages)
              .values({
                conversationId,
                role: message.role,
                content: message.content,
                attachments: message.attachments ? JSON.stringify(message.attachments) : null,
                toolInvocations: message.toolInvocations ? JSON.stringify(message.toolInvocations) : null,
                metadata: message.metadata ? JSON.stringify(message.metadata) : null,
                createdAt: new Date(),
                updatedAt: new Date(),
              })
              .returning();

            // Update conversation metadata
            await db.update(conversations)
              .set({
                lastMessageAt: new Date(),
                messageCount: sql`${conversations.messageCount} + 1`,
                updatedAt: new Date(),
              })
              .where(eq(conversations.id, conversationId));

            // Update Redis cache (with fallback on Redis failure)
            try {
              const redis = await this.redis;
              await redis.lPush(
                CHAT_KEYS.recentMessages(conversationId),
                JSON.stringify({
                  ...dbMessage,
                  attachments: message.attachments,
                  toolInvocations: message.toolInvocations,
                  metadata: message.metadata,
                })
              );

              await redis.lTrim(
                CHAT_KEYS.recentMessages(conversationId),
                0,
                CHAT_CONFIG.MESSAGE_BUFFER_SIZE - 1
              );
            } catch (cacheError) {
              console.warn('Failed to update Redis cache, continuing without cache:', cacheError);
            }

            return { success: true, messageId: dbMessage.id.toString() };
          } catch (error) {
            const err = error as Error;
            if (isTransientError(err)) {
              throw new RetryableError(`Failed to store message in database: ${err.message}`, err);
            }
            throw new NonRetryableError(`Non-retryable database error: ${err.message}`, err);
          }
        });
      }
    }, {
      failureThreshold: 3,
      recoveryTimeout: 30000, // 30 seconds
    });
  }

  async getConversationHistory(
    userId: number,
    conversationId: number,
    includeTemp: boolean = true
  ): Promise<ChatMessage[]> {
    const redis = await this.redis;
    const cacheKey = CHAT_KEYS.recentMessages(conversationId);

    try {
      // Try Redis first for ongoing/recent conversations
      const cachedMessages = await redis.lRange(cacheKey, 0, -1);
      
      if (cachedMessages.length > 0) {
        // Return Redis messages for ongoing chat sessions
        const parsedMessages = cachedMessages
          .reverse()
          .map(msg => JSON.parse(msg))
          .filter(msg => includeTemp || !msg.tempId) // Filter temp messages if needed
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        if (parsedMessages.length > 0) {
          console.log(`Retrieved ${parsedMessages.length} messages from Redis for conversation ${conversationId}`);
          return parsedMessages;
        }
      }

      // Fallback to database for complete history
      const dbMessages = await db.select()
        .from(messages)
        .innerJoin(conversations, eq(messages.conversationId, conversations.id))
        .where(
          and(
            eq(messages.conversationId, conversationId),
            eq(conversations.userId, userId)
          )
        )
        .orderBy(messages.createdAt);

      const formattedMessages: ChatMessage[] = dbMessages.map(row => ({
        id: row.messages.id.toString(),
        role: row.messages.role as 'user' | 'assistant' | 'system',
        content: row.messages.content,
        attachments: row.messages.attachments ? JSON.parse(row.messages.attachments) : undefined,
        toolInvocations: row.messages.toolInvocations ? JSON.parse(row.messages.toolInvocations) : undefined,
        metadata: row.messages.metadata ? JSON.parse(row.messages.metadata) : undefined,
        createdAt: row.messages.createdAt,
        conversationId: row.messages.conversationId,
      }));

      // Update cache with database data
      if (formattedMessages.length > 0) {
        await redis.del(cacheKey);
        const messageStrings = formattedMessages
          .slice(-CHAT_CONFIG.MESSAGE_BUFFER_SIZE)
          .reverse()
          .map(msg => JSON.stringify(msg));

        if (messageStrings.length > 0) {
          await redis.lPush(cacheKey, messageStrings);
          await redis.expire(cacheKey, CHAT_CONFIG.SESSION_TTL);
        }
      }

      return formattedMessages;
    } catch (error) {
      console.error('Error getting conversation history:', error);
      
      // Final fallback to database only
      const dbMessages = await db.select()
        .from(messages)
        .innerJoin(conversations, eq(messages.conversationId, conversations.id))
        .where(
          and(
            eq(messages.conversationId, conversationId),
            eq(conversations.userId, userId)
          )
        )
        .orderBy(messages.createdAt);

      return dbMessages.map(row => ({
        id: row.messages.id.toString(),
        role: row.messages.role as 'user' | 'assistant' | 'system',
        content: row.messages.content,
        attachments: row.messages.attachments ? JSON.parse(row.messages.attachments) : undefined,
        toolInvocations: row.messages.toolInvocations ? JSON.parse(row.messages.toolInvocations) : undefined,
        metadata: row.messages.metadata ? JSON.parse(row.messages.metadata) : undefined,
        createdAt: row.messages.createdAt,
        conversationId: row.messages.conversationId,
      }));
    }
  }

  async getUserConversations(userId: number, limit: number = 20): Promise<ConversationSummary[]> {
    const redis = await this.redis;
    const cacheKey = CHAT_KEYS.conversationList(userId);

    try {
      // Try Redis first
      const cachedConversations = await redis.zRange(cacheKey, 0, limit - 1, { REV: true });
      
      if (cachedConversations.length > 0) {
        return cachedConversations.map(conv => JSON.parse(conv));
      }

      // Fallback to database
      const dbConversations = await db.select()
        .from(conversations)
        .where(eq(conversations.userId, userId))
        .orderBy(desc(conversations.updatedAt))
        .limit(limit);

      const summaries: ConversationSummary[] = dbConversations.map(conv => ({
        id: conv.id,
        title: conv.title ?? undefined,
        language: conv.language,
        lastMessageAt: conv.lastMessageAt ?? undefined,
        messageCount: conv.messageCount,
        isActive: conv.isActive === 1,
        createdAt: conv.createdAt,
      }));

      // Update cache
      if (summaries.length > 0) {
        const cacheData = summaries.map(summary => ({
          score: summary.lastMessageAt?.getTime() || summary.createdAt.getTime(),
          value: JSON.stringify(summary)
        }));

        await redis.zAdd(cacheKey, cacheData);
        await redis.expire(cacheKey, CHAT_CONFIG.SESSION_TTL);
      }

      return summaries;
    } catch (error) {
      console.error('Error getting user conversations:', error);
      
      // Final fallback to database only
      const dbConversations = await db.select()
        .from(conversations)
        .where(eq(conversations.userId, userId))
        .orderBy(desc(conversations.updatedAt))
        .limit(limit);

      return dbConversations.map(conv => ({
        id: conv.id,
        title: conv.title ?? undefined,
        language: conv.language,
        lastMessageAt: conv.lastMessageAt ?? undefined,
        messageCount: conv.messageCount,
        isActive: conv.isActive === 1,
        createdAt: conv.createdAt,
      }));
    }
  }

  async saveConversationToDatabase(
    conversationId: number,
    userId: number
  ): Promise<{ success: boolean; messagesSaved: number; error?: string }> {
    try {
      const redis = await this.redis;
      const cacheKey = CHAT_KEYS.recentMessages(conversationId);
      
      // Get all messages from Redis for this conversation
      const cachedMessages = await redis.lRange(cacheKey, 0, -1);
      
      if (cachedMessages.length === 0) {
        return { success: true, messagesSaved: 0 };
      }

      // Parse messages and sort by creation time
      const parsedMessages = cachedMessages
        .reverse() // Redis stores in reverse order
        .map(msg => JSON.parse(msg))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      let messagesSaved = 0;

      // Save each message to PostgreSQL
      for (const message of parsedMessages) {
        try {
          await db.insert(messages)
            .values({
              conversationId,
              role: message.role,
              content: message.content,
              attachments: message.attachments ? JSON.stringify(message.attachments) : null,
              toolInvocations: message.toolInvocations ? JSON.stringify(message.toolInvocations) : null,
              metadata: message.metadata ? JSON.stringify(message.metadata) : null,
              createdAt: new Date(message.createdAt),
              updatedAt: new Date(),
            })
            .onConflictDoNothing(); // In case message already exists

          messagesSaved++;
        } catch (error) {
          console.error('Error saving individual message:', error);
        }
      }

      // Update conversation metadata
      await db.update(conversations)
        .set({
          lastMessageAt: new Date(),
          messageCount: messagesSaved,
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, conversationId));

      // Clean up Redis cache after successful save
      await redis.del(cacheKey);

      console.log(`Saved ${messagesSaved} messages to database for conversation ${conversationId}`);
      return { success: true, messagesSaved };

    } catch (error) {
      console.error('Error saving conversation to database:', error);
      return { 
        success: false, 
        messagesSaved: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async syncPendingMessages(): Promise<{ processed: number; errors: number }> {
    const redis = await this.redis;
    let processed = 0;
    let errors = 0;

    try {
      // Process sync queue in batches
      for (let i = 0; i < CHAT_CONFIG.SYNC_BATCH_SIZE; i++) {
        const queueItem = await redis.rPop(CHAT_KEYS.syncQueue());
        if (!queueItem) break;

        try {
          const syncData = JSON.parse(queueItem);
          
          if (syncData.action === 'add_message') {
            const { conversationId, message, tempId } = syncData;

            // Insert into database
            const [dbMessage] = await db.insert(messages)
              .values({
                conversationId,
                role: message.role,
                content: message.content,
                attachments: message.attachments ? JSON.stringify(message.attachments) : null,
                toolInvocations: message.toolInvocations ? JSON.stringify(message.toolInvocations) : null,
                metadata: message.metadata ? JSON.stringify(message.metadata) : null,
                createdAt: message.createdAt,
                updatedAt: new Date(),
              })
              .returning();

            // Update conversation metadata
            await db.update(conversations)
              .set({
                lastMessageAt: new Date(),
                messageCount: sql`${conversations.messageCount} + 1`,
                updatedAt: new Date(),
              })
              .where(eq(conversations.id, conversationId));

            // Remove temporary message
            if (tempId) {
              await redis.del(CHAT_KEYS.tempMessage(conversationId, tempId));
            }

            processed++;
          }
        } catch (error) {
          console.error('Error processing sync item:', error);
          errors++;
        }
      }
    } catch (error) {
      console.error('Error in sync process:', error);
      errors++;
    }

    return { processed, errors };
  }

  async updateConversationTitle(conversationId: number, userId: number, title: string): Promise<boolean> {
    try {
      await db.update(conversations)
        .set({ title, updatedAt: new Date() })
        .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)));

      // Update cache
      const redis = await this.redis;
      const cacheKey = CHAT_KEYS.conversationList(userId);
      
      // Remove old entry and add updated one
      const cachedConversations = await redis.zRange(cacheKey, 0, -1, { REV: true });
      for (const convStr of cachedConversations) {
        const conv = JSON.parse(convStr);
        if (conv.id === conversationId) {
          await redis.zRem(cacheKey, convStr);
          conv.title = title;
          await redis.zAdd(cacheKey, { score: Date.now(), value: JSON.stringify(conv) });
          break;
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating conversation title:', error);
      return false;
    }
  }

  async deleteConversation(conversationId: number, userId: number): Promise<boolean> {
    try {
      // Delete from database (messages will be cascade deleted)
      await db.delete(conversations)
        .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)));

      // Clean up Redis cache
      const redis = await this.redis;
      await redis.del(CHAT_KEYS.recentMessages(conversationId));
      
      // Remove from conversation list cache
      const cacheKey = CHAT_KEYS.conversationList(userId);
      const cachedConversationsList = await redis.zRange(cacheKey, 0, -1, { REV: true });
      for (const convStr of cachedConversationsList) {
        const conv = JSON.parse(convStr);
        if (conv.id === conversationId) {
          await redis.zRem(cacheKey, convStr);
          break;
        }
      }

      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  }
}