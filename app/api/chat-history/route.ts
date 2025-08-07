import { NextRequest, NextResponse } from 'next/server';
import { ChatHistoryService } from '@/lib/chat/history-service';
import { getUser } from '@/lib/db/queries';

const chatHistoryService = new ChatHistoryService();

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (conversationId) {
      // Get specific conversation history
      const messages = await chatHistoryService.getConversationHistory(
        user.id,
        parseInt(conversationId),
        true // Include temporary messages for frontend display
      );

      return NextResponse.json({
        success: true,
        messages,
        conversationId: parseInt(conversationId),
      });
    } else {
      // Get user's conversation list
      const conversations = await chatHistoryService.getUserConversations(user.id, limit);

      return NextResponse.json({
        success: true,
        conversations,
      });
    }
  } catch (error) {
    console.error('Chat history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create_conversation': {
        const { teamId, language, title } = data;
        const conversation = await chatHistoryService.createConversation(
          user.id,
          teamId,
          language || 'en',
          title
        );

        return NextResponse.json({
          success: true,
          conversation,
        });
      }

      case 'add_message': {
        const { conversationId, message, optimistic } = data;
        const result = await chatHistoryService.addMessage(
          conversationId,
          message,
          optimistic || false
        );

        return NextResponse.json({
          success: result.success,
          messageId: result.messageId,
          tempId: result.tempId,
        });
      }

      case 'update_title': {
        const { conversationId, title } = data;
        const success = await chatHistoryService.updateConversationTitle(
          conversationId,
          user.id,
          title
        );

        return NextResponse.json({
          success,
        });
      }

      case 'save_to_database': {
        const { conversationId } = data;
        const result = await chatHistoryService.saveConversationToDatabase(
          conversationId,
          user.id
        );

        return NextResponse.json({
          success: result.success,
          messagesSaved: result.messagesSaved,
          error: result.error,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action', success: false },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Chat history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID required', success: false },
        { status: 400 }
      );
    }

    const success = await chatHistoryService.deleteConversation(
      parseInt(conversationId),
      user.id
    );

    return NextResponse.json({
      success,
    });
  } catch (error) {
    console.error('Chat history delete API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}