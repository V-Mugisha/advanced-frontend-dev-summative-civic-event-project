# CivicEvents+ Frontend

Static frontend for the CivicEvents+ assignment. It uses HTML, Tailwind CSS from the Play CDN, and jQuery.

Current scope: authentication, events browsing, event registration, admin event management, event feedback, admin dashboard, user management, announcements, promos, notifications, profile, and my registrations.

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
- Admins create and edit events in `event-form.html`, including image uploads up to 2 MB.
- Admins do not register for events because they organize them.
- Events are always published because the API does not support changing that field.
- Normal users must be registered for an event before the feedback form appears.
- Normal users can add or update their own feedback.
- Admins do not see the attendee feedback form because they organize the event.
- Only admins can load all feedback for an event and see the average rating.

## Admin behavior

- Admins land on `admin-dashboard.html` after login.
- `index.html` is the normal user dashboard and redirects admins to the admin dashboard.
- Shared pages such as Events replace the member Dashboard link with Admin dashboard for admins.
- `admin-dashboard.html` shows user, event, registration, feedback, promo, announcement, and notification totals from `GET /api/dashboard/admin`.
- The user growth chart is rendered with simple CSS bars.
- `admin-users.html` lists users and supports enable and disable actions.
- Role changes are not supported by the API.
- Normal users are redirected away from admin pages.

## Announcements behavior

- The announcements list uses `GET /api/announcements?page=1&limit=100` and filters published items for normal users.
- Audio duration is computed from the audio element metadata because the API does not return it.
- Admin create uses the multipart field `audio` and accepts MP3, WAV, M4A, or OGG files up to 5 MB.
- Admin edit supports title and published changes. Audio cannot be replaced through the edit endpoint.
- Publish, unpublish, and delete use the admin-only endpoints.
- Announcement creation still shows a toast because the assignment requires it.

## Promos behavior

- The promos list uses `GET /api/promos?page=1&limit=100` and filters published items for normal users.
- Client-side pagination shows 6 promos per page.
- Captions are built from `caption_text` as a single WebVTT cue using a Blob URL.
- The caption text is also shown as a transcript.
- Admin create uses the multipart field `video`. The frontend accepts MP4 only because browsers do not reliably play AVI, MKV, or MOV.
- The backend upload limit is 8 MB, so the frontend enforces the same limit.
- MP4 files should use H.264 video and AAC audio for the best browser support.
- Admin edit can update the text fields and optionally replace the video.
- Unsupported or unplayable video files show a warning with a direct file link.
- Publish, unpublish, and delete use the admin-only endpoints.
- Promo actions use inline messages; no promo toast is required.

## Notifications behavior

- The header bell shows an unread count from notifications where `read === false`.
- The notifications page lists broadcast and targeted notifications for the logged-in user.
- Related links use `metadata.event_id`, `metadata.announcement_id`, or `metadata.promo_id`.
- Admin users can delete notifications. Normal users cannot.
- The API has no mark-as-read endpoint, so unread counts cannot be cleared from the frontend.
- Notification deletion refreshes the header count.

## Profile behavior

- Profile data uses `GET /api/users/profile/me`.
- Only full name and email can be edited with `PATCH /api/users/profile/me`.
- Role and active status are read-only.
- Duplicate email addresses return `409`.
- A successful update also refreshes the stored session user and header name.

## My registrations behavior

- The page loads `GET /api/event-registrations/my-registrations`.
- Only rows with `status === 'registered'` are shown.
- Cancel uses `POST /api/event-registrations/cancel` with `{event_id}`.
- Cancelled registrations cannot be re-created because the unique row remains.
- Admins are redirected because they do not register for events.
