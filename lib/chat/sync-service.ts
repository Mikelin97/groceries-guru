import { ChatHistoryService } from './history-service';

export class ChatSyncService {
  private chatHistoryService: ChatHistoryService;
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  
  constructor() {
    this.chatHistoryService = new ChatHistoryService();
  }

  start(intervalMs: number = 10000): void {
    if (this.isRunning) {
      console.log('Chat sync service is already running');
      return;
    }

    this.isRunning = true;
    console.log(`Starting chat sync service with ${intervalMs}ms interval`);

    this.intervalId = setInterval(async () => {
      try {
        const result = await this.chatHistoryService.syncPendingMessages();
        
        if (result.processed > 0) {
          console.log(`Chat sync: processed ${result.processed} messages`);
        }
        
        if (result.errors > 0) {
          console.warn(`Chat sync: encountered ${result.errors} errors`);
        }
      } catch (error) {
        console.error('Chat sync service error:', error);
      }
    }, intervalMs);
  }

  stop(): void {
    if (!this.isRunning) {
      console.log('Chat sync service is not running');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log('Chat sync service stopped');
  }

  async syncOnce(): Promise<{ processed: number; errors: number }> {
    try {
      const result = await this.chatHistoryService.syncPendingMessages();
      console.log(`Manual sync: processed ${result.processed} messages, errors ${result.errors}`);
      return result;
    } catch (error) {
      console.error('Manual sync error:', error);
      return { processed: 0, errors: 1 };
    }
  }

  isServiceRunning(): boolean {
    return this.isRunning;
  }
}

// Global instance for the application
let globalSyncService: ChatSyncService | null = null;

export function getGlobalSyncService(): ChatSyncService {
  if (!globalSyncService) {
    globalSyncService = new ChatSyncService();
    
    // Start sync service in production or when explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CHAT_SYNC === 'true') {
      const syncInterval = parseInt(process.env.CHAT_SYNC_INTERVAL_MS || '10000');
      globalSyncService.start(syncInterval);
    }
  }
  
  return globalSyncService;
}

// Graceful shutdown
process.on('SIGTERM', () => {
  if (globalSyncService) {
    globalSyncService.stop();
  }
});

process.on('SIGINT', () => {
  if (globalSyncService) {
    globalSyncService.stop();
  }
});