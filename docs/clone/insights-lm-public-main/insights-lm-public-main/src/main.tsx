import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

async function bootstrap() {
  if (import.meta.env.VITE_USE_MOCKS === 'true') {
    try {
      const { worker } = await import('./mocks/browser');
      await worker.start();
      // eslint-disable-next-line no-console
      console.info('[mocks] MSW worker started');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[mocks] Failed to start MSW worker', err);
    }
  }

  createRoot(document.getElementById('root')!).render(<App />);
}

bootstrap();
