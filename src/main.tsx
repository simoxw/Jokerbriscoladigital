import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Registrazione Service Worker per caching offline (Solo in Produzione)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const baseUrl = import.meta.env.BASE_URL;
    navigator.serviceWorker.register(`${baseUrl}sw.js`)
      .then(reg => console.log('🚀 Service Worker registrato:', reg))
      .catch(err => console.log('⚠️ Errore Service Worker:', err));
  });
}