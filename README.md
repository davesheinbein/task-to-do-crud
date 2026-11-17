# task-to-do-crud

Minimal task manager (create, list, edit, toggle open/done, delete, filter). Plain HTML/CSS/JS, no build step.

**This is an MVP.** Tasks are stored in browser `localStorage` and the logged-in user is a hardcoded mock (`user-1`). There is no production database or server-side authentication. The "API" in `src/taskService.js` is a promise-based mock that enforces ownership (simulated 403/404 errors).

## Run

Requires Node.js 18+ (ES modules need an HTTP server, not `file://`):

```
npm start
```

Then open the URL it prints.

## Test

```
npm test
```

Uses Node's built-in test runner; no dependencies to install.
