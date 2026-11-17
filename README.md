# CivicEvent+ Project

CivicEvent+ frontend built with HTML, Tailwind CSS, and jQuery. The backend API is in `backend/`.

## Setup

Requires Node.js 18+ and PostgreSQL 15+.

1. Create a PostgreSQL database named `civic-events-db`.

2. Run the database migration:
   ```bash
   psql -U postgres -d civic-events-db -f backend/migrations/001_create_tables.sql
   ```

3. Configure the database credentials in `backend/.env`.

4. Install the backend packages and start the server:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

5. Open `frontend/index.html` in your browser.

## API base URL

The API URL is configured in `frontend/js/config.js` and defaults to:

```text
http://localhost:4000/api
```
