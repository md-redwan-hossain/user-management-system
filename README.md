- Setup Dependencies: `npm install`

- Start development server: `npm run dev`

- Rename the `sample.env` file to `.env` and set value to the variables with proper credentials.

- `MONGODB_URL="mongodb://admin:admin@localhost:27020/ums"`

- For running mongoDB in Docker, docker-compose file is added. Just run `docker compose up` inside project's root directory. Add -d flag to run in the background like `docker compose up -d`. In some system, `docker compose` is `docker-compose`.
