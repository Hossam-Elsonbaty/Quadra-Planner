# Weekly Planner

A simple weekly planner with full user accounts (signup, login, roles). Each user has their own private data. Add classes, trial classes, and tasks, and schedule each one on an exact date and time. Items can happen once or repeat weekly, monthly, or yearly. The calendar can be viewed by week, month, or year. The user can also create their own item types.

> **Note for the AI:** Follow this file strictly. Do NOT add anything listed under "Do NOT use". Keep the code simple, readable, and minimal. Do not over-engineer. Use well-known libraries where they save effort, but keep the code itself simple.

---

## 1. Goals

- Multi-user with authentication: signup, login, logout, and roles (user and admin). Every user sees and edits only their own types and items. The owner may share the app with friends.
- Simple and fast to use.
- Clean, flat, calm design (see Design section).
- Easy, smooth code. No unnecessary abstractions.

## 2. Tech Stack

**Frontend**

- React (with Vite)
- JavaScript (not TypeScript, to keep it simple)
- Tailwind CSS
- Axios for all API calls (one shared Axios instance in api.js with a base URL and a request interceptor that attaches the auth token)
- React hooks only (`useState`, `useEffect`)

**Backend**

- Node.js
- Express
- MongoDB with Mongoose
- `cors` and `dotenv`

**Hosting**

- Frontend on Vercel
- Backend on Vercel as a serverless function (Express app exported from server/api/index.js, routed by server/vercel.json). Frontend and backend are two separate Vercel projects from the same GitHub repo.
- Database on MongoDB Atlas (free tier)

## 3. Do NOT use

- No Next.js. No fetch for API calls (use Axios only). Still avoid Redux, Docker, and TypeScript.
- No Docker, no docker-compose
- No TypeScript
- No Redux, Zustand, or any state library
- No React Query or SWR
- No server-side rendering, no SEO work
- No GraphQL, no WebSockets
- No monorepo tools (no Turborepo, Nx, workspaces)
- No ORMs other than Mongoose
- No gradients anywhere in the UI

## 3.5 Allowed Libraries

The AI may use these where they help, as long as the code stays simple:

**Frontend**

- UI components: shadcn/ui (with Radix and Tailwind) or Ant Design. Pick ONE and use it everywhere. They must be styled to follow the flat, no-gradient design rules in section 7.
- Animations: Framer Motion (motion) or any small animation library, used lightly (modal open and close, item add and remove, page transitions). Nothing flashy.
- Routing: React Router.
- Forms and validation: React Hook Form with Zod.
- Dates: date-fns.
- Icons: lucide-react.
- Toasts: sonner or react-hot-toast.

**Backend**

- Auth: bcryptjs for password hashing and jsonwebtoken for tokens.
- Validation: Zod or express-validator.
- Security: helmet, express-rate-limit, express-mongo-sanitize, and cors.
- Performance: compression.
- Logging: morgan in development only.

Do not install anything outside these lists unless it clearly improves security, performance, or testing. If you add one, say why in one line.

## 3.6 Authentication and Roles

- Signup with name, email, and password. Login with email and password. Logout.
- Passwords are hashed with bcrypt (never stored in plain text). Minimum length 8.
- On login the server returns a signed JWT. The client stores it and sends it as an Authorization Bearer header through the Axios interceptor.
- JWT expires after 7 days. The secret comes from JWT\_SECRET.
- Roles: user (default) and admin. Admin can list and delete users. Regular users can only touch their own data.
- Protect every /api/types and /api/items route with an auth middleware. Each Type and Item stores an owner (user id), and every query filters by the logged-in user.
- Add a requireRole("admin") middleware for admin routes.
- Client: Login and Signup pages, a protected route wrapper that redirects to login, and an auth context (React context is allowed for this only).
- Auth endpoints: POST /api/auth/signup, POST /api/auth/login, GET /api/auth/me. Admin endpoints: GET /api/users, DELETE /api/users/:id.
- The first user to sign up, or the email set in ADMIN\_EMAIL, becomes admin.
- User model: name, email (unique, lowercase), passwordHash, role (user or admin, default user), timestamps.

## 3.7 Testing

- Backend: Vitest or Jest with Supertest, plus mongodb-memory-server so tests never touch the real database.
- Frontend: Vitest with React Testing Library.
- Keep it light: cover auth (signup, login, protected routes), the types and items endpoints, ownership isolation (a user cannot read another user's data), and the repeat logic (none, weekly, monthly, yearly, including month-end and leap-year cases).
- Add an npm test script in both client and server. Run the tests and make sure they pass before finishing each major step.
- No CI/CD pipeline is needed.

## 3.8 Security and Performance

- Use helmet, rate limiting (stricter on login and signup), input validation on every route, and Mongo query sanitizing.
- Never trust client input. Never return passwordHash. Return generic errors on failed login.
- Restrict CORS to CLIENT\_URL only. Keep secrets in environment variables.
- Add MongoDB indexes on owner, date, and repeat, which are used by the calendar range query.
- Use compression, lean Mongoose queries for read routes, and select only the fields needed.
- Frontend: lazy-load pages with React.lazy, avoid unnecessary re-renders, and keep the bundle small.
- Run npm audit and fix serious issues.

## 4. Core Features

### 4.1 Item Types (user-defined)

The user can create, edit, and delete their own types from a small "Types" page.

- Each type has a **name** and a **color** (flat solid color).
- Examples the user will create: Class, Trial Class, Task. The user may add any other type later.
- When adding an item to the planner, the type dropdown is filled from these saved types.
- Do not hardcode types. Do not seed fake types.

### 4.2 Items

Every item has:

- title
- type (reference to a saved type)
- date (the exact day, month, and year chosen by the user)
- start time
- optional end time
- optional notes
- optional reminder from 1 to 10,080 minutes before the item
- repeat mode: `none` (this date only), `weekly`, `monthly`, or `yearly`
- for repeating items: an optional end date (if empty, the item repeats until deleted)
- done flag (mainly for tasks)

### 4.3 Date, time, and repeating

- **This date only:** the item appears once, on its exact date and time, and never again.
- **Every week:** the item repeats on the same weekday and time as its start date, until deleted or until its end date.
- **Every month:** the item repeats on the same day number each month. If a month is shorter (for example day 31), use the last day of that month.
- **Every year:** the item repeats on the same day and month each year. A start date of February 29 repeats on February 28 in non-leap years.
- A repeating item never appears before its start date. It may have an optional end date.
- Occurrences are calculated on the fly for the visible week, month, or year. Do not store one database row per occurrence.
- Reminders apply to the whole series and use browser notifications. The user must grant notification permission and keep the planner open for reminders to fire.

### 4.4 Calendar views (week, month, year)

- A view switcher with three options: Week, Month, Year. The user can change it at any time. The default is Week.
- **Week view:** a grid with seven days. Items are sorted by start time inside each day. Each item shows time, title, and a colored marker for its type.
- **Month view:** a classic calendar grid for the month. Each day cell shows up to three items (time, title, colored marker) and a "+N more" link. Clicking a day opens the full list for that day.
- **Year view:** twelve small month calendars. Days that have items show a small dot. Clicking a day opens its list, and clicking a month name opens that month in Month view.
- Previous, Next, and Today buttons work for the current view (week by week, month by month, year by year). Show the current period as a title, for example "March 2027".
- Clicking an item opens edit. A small checkbox marks the occurrence done.

### 4.5 Add and edit form

A simple modal or side panel with: title, type dropdown, date, start time, end time, repeat choice, notes. The date is picked with a date picker: the user chooses the exact day, month, and year (when adding from a day cell in any view, that date is filled in but can still be changed). The start time is picked with a time picker. The repeat choice is REQUIRED and has NO default selected: before the item can be saved, the user must explicitly pick one of "This date only", "Every week", "Every month", or "Every year", shown as clearly labeled radio buttons or a segmented control. When a repeating option is chosen, show an optional "Ends on" date field. The Save button stays disabled and a short message is shown until a choice is made. The server must also reject any item that has no repeat value. Validate that title, date, start time, and the repeat choice are present, that the end time is after the start time, and that the end date is not before the start date.

## 5. Data Models (Mongoose)

**Type**

- `name`: String, required, unique
- `color`: String, required (hex)

**Item**

- `title`: String, required
- `type`: ObjectId referencing Type, required
- `date`: Date, required (the exact start date chosen by the user, stored as a date-only value such as 2027-03-15)
- `startTime`: String `HH:mm`, required
- `endTime`: String `HH:mm`, optional
- `notes`: String, optional
- `repeat`: String, one of `none`, `weekly`, `monthly`, `yearly`, required (no default value)
- `endDate`: Date, optional (the last day a repeating item can appear)
- `doneDates`: array of date strings (YYYY-MM-DD), default empty
- timestamps enabled

Done is tracked per occurrence: marking an occurrence done adds its date to `doneDates`, and unmarking removes it. This way a weekly, monthly, or yearly item can be done on one date without affecting the others.

## 6. API Endpoints

Base path: `/api`

**Types**

- `GET /types` list all
- `POST /types` create
- `PUT /types/:id` update
- `DELETE /types/:id` delete (block if items still use it, return a clear message)

**Items**

- `GET /items` list the user's items. Accepts optional `from` and `to` query dates and returns every item that could appear in that range (the client then expands repeats for the visible week, month, or year).
- `POST /items` create
- `PUT /items/:id` update
- `DELETE /items/:id` delete
- `PATCH /items/:id/done` toggle done for a given occurrence date (send the date in the body)

All /types and /items routes require a valid token and only return the logged-in user's data. Auth and admin endpoints are described in section 3.6. All responses are JSON. Use proper status codes. Return simple error messages like `{ "message": "..." }`.

## 7. Design Rules

The look must be flat, calm, and easy on the eyes. It must NOT look like a typical AI-generated app.

- **No gradients at all.** Not on backgrounds, buttons, cards, or text. Solid colors only.
- **No glassmorphism, no heavy shadows, no glowing effects, no blurred blobs.**
- **No purple-to-blue or any rainbow palette.** Avoid the usual AI look completely.
- **Palette:** a warm off-white background (for example #F5F2EB), dark charcoal text (for example #2B2B2B), and one muted accent such as sage green or clay. Item type colors are chosen by the user and shown as flat solid markers.
- **Typography:** one clean sans-serif font. Generous line height. Clear hierarchy using size and weight only.
- **Shapes:** small border radius (4 to 6 px), thin 1px borders in a soft gray, flat cards.
- **Spacing:** roomy and consistent. Do not crowd the weekly grid.
- **Motion:** only simple CSS transitions (150 ms) on hover and focus. Nothing else.
- **Dark mode:** not required. Skip it.
- **Responsive:** works well on desktop and is usable on mobile (in week view the days stack vertically on small screens; month and year views shrink to fit and stay easy to tap).
- **Language and direction:** UI text in English, left to right.

## 8. Folder Structure

Keep two separate folders at the root, with no monorepo tooling.

```
weekly-planner/
  .gitignore
  .env.example
  README.md
  client/
    index.html
    package.json
    vite.config.js
    tailwind.config.js
    postcss.config.js
    src/
      main.jsx
      App.jsx
      api.js
      index.css
      utils/
        dates.js
      context/
        AuthContext.jsx
      pages/
        Login.jsx
        Signup.jsx
        Planner.jsx
        Types.jsx
        Admin.jsx
      components/
        ProtectedRoute.jsx
        WeekView.jsx
        MonthView.jsx
        YearView.jsx
        ViewSwitcher.jsx
        DayColumn.jsx
        ItemCard.jsx
        ItemForm.jsx
        TypeForm.jsx
  server/
    package.json
    server.js
    vercel.json
    api/
      index.js
    models/
      User.js
      Type.js
      Item.js
    middleware/
      auth.js
      requireRole.js
      validate.js
    routes/
      auth.js
      users.js
      types.js
      items.js
    tests/
      auth.test.js
      types.test.js
      items.test.js
```

Rules for the code:

- One component per file, kept small.
- All API calls (through Axios) live in `client/src/api.js`, nothing else calls `fetch`.
- Date and repeat helper functions (week, month, and year ranges, and repeat expansion) go in one small file, client/src/utils/dates.js, not scattered around.
- No unused files, no placeholder files, no demo data.
- Short comments only where the logic is not obvious.

## 9. Environment Variables

**server/.env**

- `PORT` (default 5000)
- `MONGODB_URI` (MongoDB Atlas connection string)
- `CLIENT_URL` (the Vercel frontend URL, used for CORS)
- `JWT_SECRET` (long random string)
- `ADMIN_EMAIL` (optional, this email becomes admin on signup)

**client/.env**

- `VITE_API_URL` (the backend base URL, for example `http://localhost:5000/api` locally)

Provide a `.env.example` for both folders with empty values. Never commit real `.env` files.

## 10. Git Setup

Initialize git at the root and create a `.gitignore` that covers:

- `node_modules/`
- `.env` and `.env.*` (but keep `.env.example`)
- `dist/` and `build/`
- `.DS_Store`
- log files and editor folders like `.vscode/` and `.idea/`

## 11. Setup Steps (for the AI to follow in order)

1. Create the root folder `weekly-planner` and run `git init`. Add the `.gitignore`.
2. In `server/`, run `npm init -y`, then install `the packages listed in sections 2 and 3.5 (express, mongoose, cors, dotenv, bcryptjs, jsonwebtoken, helmet, express-rate-limit, express-mongo-sanitize, compression, zod). Install nodemon and the testing packages from section 3.7 as dev dependencies`.
3. Add scripts to `server/package.json`: `start` runs `node server.js`, `dev` runs `nodemon server.js`.
4. Build the Mongoose models (User, Type, Item), then the auth middleware and routes, then the other routes, then `server.js` with CORS limited to `CLIENT_URL` and a simple `GET /` health route.
5. In `client/`, create the app with Vite using the React JavaScript template.
6. Install Tailwind CSS and configure it for Vite. Then install axios, react-router-dom, the chosen UI library, an animation library, and the testing packages from sections 3.5 and 3.7.
7. Build `api.js` with Axios, then the Login and Signup pages with the auth context, then the Types page, then the Planner page with the week, month, and year views and the item form.
8. Connect everything through `VITE_API_URL` and test the full flow locally.
9. Write a short root README section showing how to run the client and the server.

Stop after each major step if something fails and explain the error before continuing.

## 12. Deployment

**Database:** create a free MongoDB Atlas cluster, add a database user, allow access from anywhere (0.0.0.0/0), and copy the connection string into `MONGODB_URI`.

**Backend on Vercel:**

- Import the GitHub repo as a new Vercel project.
- Root directory: `server`
- Framework preset: Other. No build command needed.
- The app runs from server/api/index.js through vercel.json rewrites, so no start command is used.
- Add the environment variables from section 9.
- Serverless functions can have a short cold start on the first request, which is fine.

**Frontend on Vercel:**

- Import the same GitHub repo.
- Root directory: `client`
- Framework preset: Vite
- Build command: `npm run build`, output directory: `dist`
- Add `VITE_API_URL` pointing to the backend Vercel URL followed by `/api`.
- After deploying, set `CLIENT_URL` on the backend Vercel project to the final frontend URL.

## 13. Definition of Done

## 12.5 Express on Vercel (backend setup)

Vercel runs Express as a serverless function, so the server folder needs three small adjustments:

1. Add a file server/api/index.js that imports the Express app from server.js and exports it as the default export. Do not call app.listen inside this file.
2. In server.js, create and configure the Express app and export it. Only call app.listen when running locally (when NODE\_ENV is not production), so npm run dev still works.
3. Add server/vercel.json with a rewrite that sends every path (/(.\*)) to /api. This makes /api/types and /api/items reach the Express app.
4. Cache the MongoDB connection in a module-level variable and reuse it between invocations, so each request does not open a new connection. Connect before handling the request.
5. Keep CORS limited to CLIENT\_URL and handle OPTIONS preflight requests.

Do not add Docker, a custom server, or any extra serverless framework for this.

- User can sign up, log in, and log out. Admin features work. Each user only sees their own data.
- User can add an item with a chosen type, an exact date (day, month, year), a time, and a repeat option.
- The user must choose a repeat option (This date only, Every week, Every month, or Every year) before any item can be saved. Repeating items show on every matching date. One-time items show only on their date.
- User can mark an occurrence as done without affecting other occurrences.
- User can switch between week, month, and year views, and previous, next, and today navigation works in each.
- No gradients, no Docker, no Next.js, no TypeScript. Tests pass in client and server. Security and performance items from section 3.8 are in place.
- Frontend and backend both deploy successfully and talk to each other.

## Local development

1. If needed, create `server/.env` by running `Copy-Item .env.example .env` from `server/`. Set `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_URL=http://localhost:5173`. `PORT` defaults to `5000`.
2. In one terminal, run the backend:

   ```powershell
   Set-Location .\server
   npm install
   npm run dev
   ```

3. From `client/`, run `Copy-Item .env.example .env` and set `VITE_API_URL=http://localhost:5000/api` in `client/.env`.
4. In another terminal, run the frontend:

   ```powershell
   Set-Location .\client
   npm install
   npm run dev
   ```

   Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

Run tests from separate terminals with `Set-Location .\server` then `npm test`, and `Set-Location .\client` then `npm test`.
