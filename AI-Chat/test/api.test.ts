/**
 * Tests des routes API — llama, llava, gemma
 * Mock de fetch vers Ollama (http://ollama:11434)
 */

import { NextRequest } from 'next/server';

// ============================================================
// Type pour le mock de NextResponse
// ============================================================
type MockResponse = {
  data: Record<string, unknown>;
  status: number;
};

// ============================================================
// Mock de next/server
// ============================================================
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn(
      (
        data: Record<string, unknown>,
        init?: { status?: number }
      ): MockResponse => ({
        data,
        status: init?.status ?? 200,
      })
    ),
  },
}));

// Silencer les console.error pendant les tests
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

// ============================================================
// Helpers
// ============================================================

// Cast explicite en NextRequest pour satisfaire TypeScript
function makeRequest(body: object): NextRequest {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
}

// Mocker une réponse Ollama réussie
function mockOllamaSuccess(response: string) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({ response }),
  });
}

// Mocker une erreur Ollama (ok: false)
function mockOllamaError(statusText = 'Internal Server Error') {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    text: jest.fn().mockResolvedValue(statusText),
  });
}

// Mocker un crash réseau
function mockOllamaNetworkError(message = 'Network error') {
  global.fetch = jest.fn().mockRejectedValue(new Error(message));
}

// Helper pour appeler une route et caster la réponse
async function callRoute(
  route: (req: NextRequest) => Promise<unknown>,
  body: object
): Promise<MockResponse> {
  return (await route(makeRequest(body))) as MockResponse;
}

// ============================================================
// Import des routes
// ============================================================
import { POST as llamaPost } from '../app/api/llama/route';
import { POST as llavaPost } from '../app/api/llava/route';
import { POST as gemmaPost } from '../app/api/gemma/route';

// ============================================================
// Tests — Route /api/llama (llama3:8b — texte uniquement)
// ============================================================
describe('POST /api/llama', () => {

  beforeEach(() => jest.clearAllMocks());

  it('retourne une réponse quand le prompt est valide', async () => {
    mockOllamaSuccess('  Bonjour depuis llama3  ');

    const res = await callRoute(llamaPost, { prompt: 'Bonjour' });

    expect(fetch).toHaveBeenCalledWith(
      'http://ollama:11434/api/generate',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"model":"llama3:8b"'),
      })
    );
    expect(res.data).toEqual({ response: 'Bonjour depuis llama3' });
    expect(res.status).toBe(200);
  });

  it('retourne 400 si le prompt est absent', async () => {
    const res = await callRoute(llamaPost, {});

    expect(res.status).toBe(400);
    expect(res.data).toEqual({ error: 'Prompt is required' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('retourne 400 si le prompt est une chaîne vide', async () => {
    const res = await callRoute(llamaPost, { prompt: '' });

    expect(res.status).toBe(400);
    expect(res.data).toEqual({ error: 'Prompt is required' });
  });

  it('retourne 500 si Ollama répond avec une erreur', async () => {
    mockOllamaError('model not found');

    const res = await callRoute(llamaPost, { prompt: 'Test' });

    expect(res.status).toBe(500);
    expect(res.data).toEqual({ error: 'Failed to get response from Ollama' });
  });

  it('retourne 500 si fetch throw une erreur réseau', async () => {
    mockOllamaNetworkError('Connection refused');

    const res = await callRoute(llamaPost, { prompt: 'Test' });

    expect(res.status).toBe(500);
    expect(res.data.error).toBe('Connection refused');
  });

  it('envoie le prompt et les bons paramètres à Ollama', async () => {
    mockOllamaSuccess('Réponse');

    await callRoute(llamaPost, { prompt: "Qu'est-ce que Kubernetes ?" });

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.prompt).toBe("Qu'est-ce que Kubernetes ?");
    expect(body.model).toBe('llama3:8b');
    expect(body.stream).toBe(false);
  });
});

// ============================================================
// Tests — Route /api/llava (llava:7b — texte + image + audio)
// ============================================================
describe('POST /api/llava', () => {

  beforeEach(() => jest.clearAllMocks());

  it('retourne une réponse avec un prompt texte', async () => {
    mockOllamaSuccess('Description de llava');

    const res = await callRoute(llavaPost, { prompt: 'Décris cette image' });

    expect(fetch).toHaveBeenCalledWith(
      'http://ollama:11434/api/generate',
      expect.objectContaining({
        body: expect.stringContaining('"model":"llava:7b"'),
      })
    );
    expect(res.data).toEqual({ response: 'Description de llava' });
    expect(res.status).toBe(200);
  });

  it('retourne une réponse avec une image (base64)', async () => {
    mockOllamaSuccess('Je vois un chat');
    const fakeImage = 'base64encodedimage==';

    const res = await callRoute(llavaPost, { image: fakeImage });

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.images).toEqual([fakeImage]);
    expect(body.prompt).toBe('Analyze this content');
    expect(res.status).toBe(200);
  });

  it('retourne une réponse avec audio', async () => {
    mockOllamaSuccess('Transcription audio');

    const res = await callRoute(llavaPost, { audio: 'base64audio==' });

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.audio).toBe('base64audio==');
    expect(res.status).toBe(200);
  });

  it('retourne une réponse avec prompt + image combinés', async () => {
    mockOllamaSuccess('Réponse combinée');

    const res = await callRoute(llavaPost, {
      prompt: "Qu'est-ce que tu vois ?",
      image: 'base64image==',
    });

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.prompt).toBe("Qu'est-ce que tu vois ?");
    expect(body.images).toEqual(['base64image==']);
    expect(res.status).toBe(200);
  });

  it('retourne 400 si prompt, image et audio sont tous absents', async () => {
    const res = await callRoute(llavaPost, {});

    expect(res.status).toBe(400);
    expect(res.data).toEqual({ error: 'Prompt, image or audio is required' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('retourne 500 si Ollama échoue', async () => {
    mockOllamaError();

    const res = await callRoute(llavaPost, { prompt: 'Test' });

    expect(res.status).toBe(500);
    expect(res.data).toEqual({ error: 'Failed to get response from Ollama' });
  });

  it('retourne 500 si erreur réseau', async () => {
    mockOllamaNetworkError('ECONNREFUSED');

    const res = await callRoute(llavaPost, { prompt: 'Test' });

    expect(res.status).toBe(500);
    expect(res.data.error).toBe('ECONNREFUSED');
  });

  it("n'envoie pas images si image est absent", async () => {
    mockOllamaSuccess('Réponse texte');

    await callRoute(llavaPost, { prompt: 'Texte seul' });

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.images).toBeUndefined();
  });
});

// ============================================================
// Tests — Route /api/gemma (gemma4:12b — texte + image + audio + video)
// ============================================================
describe('POST /api/gemma', () => {

  beforeEach(() => jest.clearAllMocks());

  it('retourne une réponse avec un prompt texte', async () => {
    mockOllamaSuccess('  Réponse de gemma4  ');

    const res = await callRoute(gemmaPost, { prompt: 'Explique Docker' });

    expect(fetch).toHaveBeenCalledWith(
      'http://ollama:11434/api/generate',
      expect.objectContaining({
        body: expect.stringContaining('"model":"gemma4:12b"'),
      })
    );
    expect(res.data).toEqual({ response: 'Réponse de gemma4' });
    expect(res.status).toBe(200);
  });

  it('utilise le prompt par défaut si absent mais image fournie', async () => {
    mockOllamaSuccess("Analyse de l'image");

    const res = await callRoute(gemmaPost, { image: 'base64image==' });

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.prompt).toBe('Analyze this content');
    expect(body.images).toEqual(['base64image==']);
    expect(res.status).toBe(200);
  });

  it('envoie la vidéo à Ollama si fournie', async () => {
    mockOllamaSuccess('Analyse vidéo');

    const res = await callRoute(gemmaPost, {
      video: 'base64video==',
      prompt: 'Analyse',
    });

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.video).toBe('base64video==');
    expect(res.status).toBe(200);
  });

  it('retourne une réponse avec tous les médias combinés', async () => {
    mockOllamaSuccess('Réponse multimodale');

    const res = await callRoute(gemmaPost, {
      prompt: 'Analyse tout',
      image: 'img==',
      audio: 'aud==',
      video: 'vid==',
    });

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.prompt).toBe('Analyse tout');
    expect(body.images).toEqual(['img==']);
    expect(body.audio).toBe('aud==');
    expect(body.video).toBe('vid==');
    expect(res.status).toBe(200);
  });

  it('retourne 400 si tous les champs sont absents', async () => {
    const res = await callRoute(gemmaPost, {});

    expect(res.status).toBe(400);
    expect(res.data).toEqual({
      error: 'Prompt, image, audio or video is required',
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('retourne 500 si Ollama échoue', async () => {
    mockOllamaError('Service unavailable');

    const res = await callRoute(gemmaPost, { prompt: 'Test' });

    expect(res.status).toBe(500);
    expect(res.data).toEqual({ error: 'Failed to get response from Ollama' });
  });

  it('retourne 500 si erreur réseau', async () => {
    mockOllamaNetworkError('Timeout');

    const res = await callRoute(gemmaPost, { prompt: 'Test' });

    expect(res.status).toBe(500);
    expect(res.data.error).toBe('Timeout');
  });

  it('trimme bien la réponse Ollama', async () => {
    mockOllamaSuccess('   réponse avec espaces   ');

    const res = await callRoute(gemmaPost, { prompt: 'Test trim' });

    expect(res.data.response).toBe('réponse avec espaces');
  });

  it("n'envoie pas images/audio/video si absents", async () => {
    mockOllamaSuccess('Texte seul');

    await callRoute(gemmaPost, { prompt: 'Texte uniquement' });

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.images).toBeUndefined();
    expect(body.audio).toBeUndefined();
    expect(body.video).toBeUndefined();
  });
});
