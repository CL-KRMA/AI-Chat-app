import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt, image, audio, video } = await request.json();

    if (!prompt && !image && !audio && !video) {
      return NextResponse.json(
        { error: 'Prompt, image, audio or video is required' },
        { status: 400 }
      );
    }

    // Use a default prompt if not provided
    const finalPrompt = prompt || 'Analyze this content';

    // Call Ollama with Gemma
    const ollamaResponse = await fetch('http://ollama:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemma4:12b',
        prompt: finalPrompt,
        images: image ? [image] : undefined,
        audio: audio ? audio : undefined,
        video: video ? video : undefined,
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
