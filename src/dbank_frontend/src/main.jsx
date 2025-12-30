
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { HttpAgent, Actor } from '@dfinity/agent';
import { idlFactory as dbank_idl, canisterId as dbank_id } from 'declarations/dbank_backend';

async function init() {
  // use the page hostname (handles ulvla-...localhost) and dev replica port
  const host = `http://${window.location.hostname}:4943`;

  // use the modern factory to avoid the deprecated constructor
  const agent = await HttpAgent.create({ host });

  // fetch root key for local development (required before importing declarations)
  await agent.fetchRootKey();

  const dbank_backend = Actor.createActor(dbank_idl, {
    agent,
    canisterId: dbank_id,
  });

  // import App after agent/root key fetched so declarations verify correctly
  const { default: App } = await import('./App');
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App dbank_backend={dbank_backend} />
    </React.StrictMode>
  );
}

init().catch(err => {
  console.error('App init error', err);
  const root = document.getElementById('root');
  if (root) root.innerText = 'Failed to start app. See console for details.';
});