import './app.css';
import App from './App.svelte';
import { mount } from 'svelte';

let app;

try {
  const target = document.getElementById('app');
  if (target) {
    if (typeof mount === 'function') {
      app = mount(App, { target });
    } else {
      app = new App({ target });
    }
  } else {
    console.error('Root #app element not found in DOM.');
  }
} catch (err) {
  console.error('Error mounting Hackathon Tracker app:', err);
}

export default app;
