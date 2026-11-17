# CivicEvents+ Frontend

Static frontend for the CivicEvents+ assignment. It uses HTML, Tailwind CSS from the Play CDN, and jQuery.

Current scope: authentication only. This includes signup, login, session handling, and a temporary authenticated home page.

## Prerequisites

- The backend running at `http://localhost:4000`. See `../backend/README.md`.
- A static file server. Python 3 is enough. There is no frontend build step.

## Run locally

1. Start the backend:
   ```bash
   cd backend
   npm run dev
   ```

2. Serve the frontend from the repository root:
   ```bash
   python3 -m http.server 5500 --directory frontend
   ```

3. Open `http://localhost:5500/signup.html` or `http://localhost:5500/login.html`.

Use the HTTP server instead of opening the HTML files directly so browser requests work normally.

## API base URL

The API URL is set in `js/config.js`:

```js
apiBaseUrl: 'http://localhost:4000/api'
```

Change that value if the backend runs elsewhere. CORS is enabled on the provided backend.

## Authentication behavior

- Signup requires at least 8 characters with uppercase, lowercase, a number, and a special character.
- Login stores the token and `{id, full_name, role}`.
- Sessions use `sessionStorage` by default. "Remember me" uses `localStorage`; use it only on a trusted device.
- Tokens expire after one hour. A protected request that returns `401` clears the session and redirects to login.
- Success and error messages use normal page elements. Signup success uses a simple toast because the assignment asks for it.
- Protected pages call `CivicAuth.requireAuth()`. Role-based guards are commented in `js/auth.js` and `js/home.js`.

## Current pages

- `signup.html`: account creation, confirm password, strength meter, client validation.
- `login.html`: sign in, remember me, session messages.
- `index.html`: temporary authenticated home page with user details and logout.

## Testing admin access

There are no seeded users. Sign up normally, then promote the account in PostgreSQL:

```bash
psql -U postgres -d civic-events-db -c "UPDATE users SET role='admin' WHERE email='you@example.com';"
```

The frontend does not expose or send a `role` field during signup.

## Not implemented yet

Events, announcements, promos, notifications, registrations, feedback, profile management, and the admin dashboard.
