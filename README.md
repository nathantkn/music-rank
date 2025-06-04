# Music Rank

This project is a small full stack application using React for the client and Express for the API.  Vite is used for the development server and build tooling.

## Project layout

```
src/
  client/    # React application
    components/
    styles/
    main.jsx
    App.jsx

  server/    # Express API and Prisma usage
    services/
    scripts/
    db.js
    index.js

prisma/      # Prisma schema and migrations (database files ignored)
```

Run the development server with:

```
npm run dev
```

and start the API with:

```
node src/server/index.js
```

The client is served by Vite and proxies API requests to the Express server running on port `4000`.
