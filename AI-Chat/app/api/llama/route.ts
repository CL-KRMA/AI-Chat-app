import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Call Ollama with Llama
    const ollamaResponse = await fetch('http://ollama:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3:8b',
        prompt: prompt,
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
