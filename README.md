# Dive Workshop

## Local setup

1. Install dependencies

```bash
npm install
```

2. Start Postgres (Docker)

create a .env file with `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dive`

```bash
docker compose up -d
```

3. Run Prisma migrations + generate client

```bash
npx prisma migrate dev
npx prisma generate
```

4. Seed the database

```bash
npm run prisma:seed
```

5. Start the dev server

```bash
npm run dev
```

App runs at `http://localhost:3000`.

## Prisma workflow (day-to-day)

- Edit schema: `prisma/schema.prisma`
- Apply changes locally:

```bash
npx prisma migrate dev --name <change-name>
npx prisma generate
```

- Reset local DB (destructive):

```bash
npx prisma migrate reset
```

## Useful commands

- Prisma Studio:

```bash
npx prisma studio
```

- Run tests:

```bash
npm run test
```
