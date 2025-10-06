import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { MangaPage } from './assets/compinenets/mangaPage';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
  <div className='main-page'>
    <MangaPage></MangaPage>
  </div>
  </StrictMode>,
)

