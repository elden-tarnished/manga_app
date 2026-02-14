# Manga Site

A full-stack manga discovery platform built with React, Express, and PostgreSQL. Users can browse manga with filters, search titles, view detailed manga information, create accounts, and save favorites.

## Live Links

**Live Demo:** [https://mangaso.vercel.app](https://mangaso.vercel.app)
*(Note: The backend is hosted on a free service. The first request may take a minute to spin up due to cold starts.)*
- backend on render and DB on supabase

## Features

- Browse manga with filters, sorting, and pagination
- Search manga by title
- Manga detail view with related and recommended titles
- User authentication (signup, login, logout) with session cookies
- Favorite/unfavorite manga for logged-in users
- Profile management (update username, email, password)
- Responsive UI with loading skeletons and detail overlays

## Tech Stack

### Frontend (`client/`)

- React 19
- Vite
- React Router
- Axios
- GSAP + GSAP + GSAP + Framer Motion
- CSS Modules

### Backend (`server/`)

- Node.js + Express 5
- PostgreSQL (`pg`)
- Passport (local auth)
- `express-session`
- Argon2 password hashing
- CORS + cookie-based auth

## Project Structure

```text
manga_site/
  client/              # React app (Vite)
  server/              # Express API + auth + database logic
    src/sql/           # SQL schema and seed-related files
  README.md
```
> "It took a hell of a lot of time to make this web application—about 9 months of 'pregnancy'—and finally, it's here. At first, I didn't know what React was, nor GSAP. Now, look where I am: one step further."
> Created by [sepehr] - My First Full Stack Project
