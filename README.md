## Features:

- Full MVC pattern with modularity that ensures maximum resue of code, maintaining DRY principle.
- Iron strong server side validation.
- In memory cache for repetitive database queries.
- Api rate limitting is implemented for stopping abuse.
- Supports advanced query with mongoDb operators in the query param.
- limit-offset based pagination with in memory cache.
- JWT based stateless auth flow with Role-based access control (RBAC).
- Centralized error handling for production and development.
- async code for potential blocking tasks, so no blocking of the event loop.
- Written in TypeScript with type safety.
- Fully documented API with postman.

## Environment Setup Steps :

- Setup Dependencies: `npm install`

- Init prisma: `npx prisma generate`

- Start development server: `npm run dev`

- Rename the `sample.env` file to `.env` and set value to the variables with proper credentials.

- `MONGODB_URL="mongodb://admin:admin@localhost:27020/ums"`

- Prisma requires mongoDB Replica Set. So, use MongoDB atlas with prisma. Mongoose works fine with localhost mongoDB in Docker.
