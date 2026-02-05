import { createBrowserRouter } from 'react-router';
import { RootLayout } from './layouts/RootLayout.jsx';
import { MangaContainer } from './Components/Manga/MangaContainer.jsx';
import LoginAuthentication from './pages/Login/Authentication.jsx';
import SignupAuthentication from './pages/Signup/Authentication.jsx';
import { NotFound } from './pages/NotFound/NotFound.jsx';
import {UserMenu} from './Components/UserMenu/UserMenu.jsx';
import { FavoritePage } from './pages/Manga/FavoritePage.jsx';
import { SearchPage } from './pages/Manga/SearchPage.jsx';

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
        path: 'favorite',
        element: <FavoritePage />
      },
      {
        path: 'favorites',
        element: <FavoritePage />
      },
      {
        path: 'search',
        element: <SearchPage />
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
