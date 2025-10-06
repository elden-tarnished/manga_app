import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { useGSAP } from "@gsap/react";
import { Manga } from './assets/compinenets/mangaShower/MainManga/Manga';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
  <div className='main-page'>
    <Manga></Manga>
  </div>
  </StrictMode>,
)

