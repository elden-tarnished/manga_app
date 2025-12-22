import { createBrowserRouter } from 'react-router';
import { RootLayout, AuthenticationLayout } from './layouts/RootLayout.jsx';
import { MangaContainer } from './Components/Manga/MangaContainer.jsx';
import LoginAuthentication from './pages/Login/Authentication.jsx';
import SignupAuthentication from './pages/Signup/Authentication.jsx';
import { NotFound } from './pages/NotFound/NotFound.jsx';
import {UserMenu} from './Components/UserMenu/UserMenu.jsx';

const routes = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        // Home page - matches exactly "/"
        path: '',
        element: <MangaContainer />,
      },
      {
        path: 'login',
        element: <LoginAuthentication />
      },
      {
        path: 'signup',
        element: <SignupAuthentication />
      },
      {
        path: 'user',
        element: <UserMenu />
      },
      {
        path: 'profile',
        element: <UserMenu />
      },
      {
        // 404 catch-all - matches any unmatched path
        path: '*',
        element: <NotFound />,
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
