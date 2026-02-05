# Docker Compose Setup

## Quick Start

### Development Mode (with hot reload)

```bash
docker compose -f compose.dev.yml up --build
```

### Production Mode

```bash
docker compose up --build
```

## Services

- **db**: PostgreSQL 16 database on port 5432
- **app**: Next.js application on port 3000

## First Run

The application will automatically:

1. Wait for the database to be healthy
2. Run Prisma migrations
3. Seed the database (if needed)
4. Start the application

## Stopping

```bash
# Development
docker compose -f compose.dev.yml down

# Production
docker compose down
```

## Rebuilding

If you change dependencies or Prisma schema:

```bash
# Development
docker compose -f compose.dev.yml up --build

# Production
docker compose up --build
```

## Accessing the Application

- Application: http://localhost:3000
- Database: localhost:5432
  - User: postgres
  - Password: postgres
  - Database: dive

## Viewing Logs

```bash
# All services
docker compose -f compose.dev.yml logs -f

# Just the app
docker compose -f compose.dev.yml logs -f app

# Just the database
docker compose -f compose.dev.yml logs -f db
```

## Running Commands Inside Containers

```bash
# Run Prisma commands
docker compose -f compose.dev.yml exec app npx prisma studio

# Access the app container shell
docker compose -f compose.dev.yml exec app sh

# Access the database
docker compose -f compose.dev.yml exec db psql -U postgres -d dive
```

## Troubleshooting

### Reset Everything

```bash
docker compose -f compose.dev.yml down -v
docker compose -f compose.dev.yml up --build
```

### View Database Data

```bash
docker compose -f compose.dev.yml exec db psql -U postgres -d dive -c "\dt"
```
