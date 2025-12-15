import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { MangaPage } from './pages/Manga/MangaPage.jsx';
import './index.css';
import Authentication from './pages/Login/Authentication.jsx'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div className='main-page'>
      <MangaPage />
    </div>
  </StrictMode>,
)

