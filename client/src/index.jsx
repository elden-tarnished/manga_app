import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './router.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div className='main-page'>
      <RouterProvider router={router} />
    </div>
  </StrictMode>,
)

