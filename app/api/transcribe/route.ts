// Note: openai import was unused, removed

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('Transcribe API: Request received');
  
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return new Response('No audio file provided', { status: 400 });
    }

    console.log('Transcribe API: Processing audio file:', audioFile.name, audioFile.size);

    // For now, return empty transcription since we're using browser speech recognition
    // This would be replaced with actual OpenAI Whisper API call when needed
    const transcription = "";
    
    console.log('Transcribe API: Returning transcription');
    
    return new Response(JSON.stringify({ 
      text: transcription,
      confidence: 0.95 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: unknown) {
    console.error('Transcribe API Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to transcribe audio',
        details: (error instanceof Error ? error.message : 'Unknown error')
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}