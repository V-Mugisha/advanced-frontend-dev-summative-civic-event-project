# CivicEvents+ Frontend

Static frontend for the CivicEvents+ assignment. It uses HTML, Tailwind CSS from the Play CDN, and jQuery.

Current scope: authentication plus events browsing and registration.

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
- Signup includes a demo-only account type selector. Choose `Administrator` to create an admin account for testing.
- Login stores the token and `{id, full_name, role}`.
- Sessions use `sessionStorage` by default. "Remember me" uses `localStorage`; use it only on a trusted device.
- Tokens expire after one hour. A protected request that returns `401` clears the session and redirects to login.
- Success and error messages use normal page elements. Signup success uses a simple toast because the assignment asks for it.
- Protected pages call `CivicAuth.requireAuth()`. Role-based guards are commented in `js/auth.js`, `js/app.js`, and pages with admin actions.

## Events behavior

- The events list uses `GET /api/events` and filters published events for normal users.
- Search, location filtering, date filtering, and pagination run in the browser because the API ignores query filters.
- Event details use `GET /api/events/:id`.
- Registration uses the register and cancel endpoints.
- After a registration is cancelled, the API does not allow registering for the same event again.
