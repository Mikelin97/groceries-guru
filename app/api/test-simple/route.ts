export async function POST(req: Request) {
  console.log('TEST: Request received');
  
  try {
    const body = await req.json();
    console.log('TEST: Body:', JSON.stringify(body));
    
    // Return a simple streaming response
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      start(controller) {
        const message = "Hello! This is a test response from the simple chat.";
        controller.enqueue(encoder.encode(`0:"${message}"\n`));
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'x-vercel-ai-data-stream': 'v1'
      }
    });
    
  } catch (error) {
    console.error('TEST: Error:', error);
    return new Response('Error', { status: 500 });
  }
}