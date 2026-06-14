'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // ajouté

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}

export default function LlavaChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImageData(base64.split(',')[1]);
        setImagePreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !imageData) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      image: imagePreview || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch('/api/llava', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: input,
          image: imageData,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.response },
      ]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Erreur: Impossible de se connecter au serveur',
        },
      ]);
    } finally {
      setLoading(false);
      setInput('');
      setImageData(null);
      setImagePreview(null);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-wrapper">
        <div className="chat-header chat-header-llava">
          <div className="chat-header-left">
            <h1>🎨 Llava Chat</h1>
            <p>Analysez des images avec l&apos;IA de vision</p> {/* corrigé */}
          </div>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <button className="back-button">← Retour</button>
          </Link>
        </div>

        <div className="messages-container">
          {messages.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-content">
                <div className="empty-emoji">🎯</div>
                <h2>Bienvenue sur Llava</h2>
                <p>Uploadez une image et posez une question pour commencer à analyser avec Llava</p>
              </div>
            </div>
          )}

          <div className="messages-list">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`message-group ${message.role === 'user' ? 'user' : 'assistant'}`}
              >
                <div className={`message-bubble ${message.role === 'user' ? 'message-user' : 'message-assistant-llava'}`}>
                  {message.image && (
                    <Image
                      src={message.image}
                      alt="uploaded"
                      width={300}
                      height={200}
                      className="message-image"
                    />
                  )}
                  <p>{message.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="message-group assistant">
                <div className="loading-spinner">
                  <div className="spinner-dot"></div>
                  <div className="spinner-dot"></div>
                  <div className="spinner-dot"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {imagePreview && (
          <div className="image-preview">
            <div className="preview-box">
              <Image
                src={imagePreview}
                alt="preview"
                width={300}
                height={200}
                className="preview-image"
              />
              <button
                type="button"
                onClick={() => {
                  setImageData(null);
                  setImagePreview(null);
                }}
                className="remove-button"
              >
                Supprimer image
              </button>
            </div>
          </div>
        )}

        <div className="input-area">
          <form onSubmit={handleSubmit} className="input-form">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="image-button"
            >
              📷 Image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden-file-input"
            />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question sur l'image..."
              className="text-input"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || (!input.trim() && !imageData)}
              className="send-button"
            >
              {loading ? '⏳' : '📤'} Envoyer
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
