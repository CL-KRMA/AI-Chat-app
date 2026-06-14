import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt, image } = await request.json();

    if (!prompt && !image) {
      return NextResponse.json(
        { error: 'Prompt or image is required' },
        { status: 400 }
      );
    }

    const fullPrompt = prompt; // corrigé : const au lieu de let

    // Call Ollama with Llava
    const ollamaResponse = await fetch('http://ollama:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llava:7b',
        prompt: fullPrompt,
        images: image ? [image] : undefined,
        stream: false,
      }),
    });

    if (!ollamaResponse.ok) {
      const error = await ollamaResponse.text();
      console.error('Ollama error:', error);
      return NextResponse.json(
        { error: 'Failed to get response from Ollama' },
        { status: 500 }
      );
    }

    const data = await ollamaResponse.json();

    return NextResponse.json({
      response: data.response.trim(),
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Alias for backward compatibility - redirect to /llava
export { POST as POST_LLAVA };
