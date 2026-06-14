'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="home-container">
      <div className="home-content">
        <div className="home-header">
          <h1>AI Chat</h1>
          <p>Choisissez votre modèle IA préféré</p>
        </div>

        <div className="cards-grid">
          <Link href="/llama" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card card-llama">
              <div className="card-emoji">🦙</div>
              <h2 className="card-title">Llama</h2>
              <p className="card-description">
                Chat rapide et puissant basé sur du texte
              </p>
              <div className="card-info">
                <p>
                  💬 Conversations naturelles
                  <br />
                  ⚡ Réponses rapides
                  <br />
                  🧠 Modèle Llama 3.8B
                </p>
              </div>
            </div>
          </Link>

          <Link href="/llava" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card card-llava">
              <div className="card-emoji">🎨</div>
              <h2 className="card-title">Llava</h2>
              <p className="card-description">
                Vision IA pour analyser vos images
              </p>
              <div className="card-info">
                <p>
                  🖼️ Analyse d'images
                  <br />
                  📸 Vision par IA
                  <br />
                  🎯 Modèle Llava 7B
                </p>
              </div>
            </div>
          </Link>
        </div>

        <div className="home-footer">
          <p>Powered by Ollama</p>
        </div>
      </div>
    </div>
  );
}
