import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './router.jsx';
import { AuthProvider } from './Context/AuthContext.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <div className='main-page'>
        <RouterProvider router={router} />
      </div>
    </AuthProvider>
  </StrictMode>,
)
