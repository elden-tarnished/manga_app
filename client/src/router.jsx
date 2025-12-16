
import { createBrowserRouter } from 'react-router';
import { RootLayout } from './layouts/RootLayout.jsx';
import { MangaContainer } from './Components/Manga/MangaContainer.jsx';
import LoginAuthentication from './pages/Login/Authentication.jsx';
import SignupAuthentication from './pages/Signup/Authentication.jsx';
import { NotFound } from './pages/NotFound/NotFound.jsx';

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
                // Login page - matches "/login"
                path: 'login',
                element: <LoginAuthentication />,
            },
            {
                // Signup page - matches "/signup"
                path: 'signup',
                element: <SignupAuthentication />,
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
