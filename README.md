# E-commerce API

NestJS + Prisma backend for an e-commerce application.

This project was created as a simple and accessible backend example for RS School students. It is completely open for everyone. You are free to fork this repository, explore the codebase, and modify it for your own projects or learning purposes :)

## Documentation

- [API documentation — English](docs/API.md)
- [API documentation — Russian](docs/API_RU.md)
- Swagger UI: `http://localhost:3031/docs`

## Local setup

Copy environment variables:

```bash
cp .env.example .env
```

Start local infrastructure:

```bash
docker compose --env-file .env up -d
```

Install dependencies:

```bash
npm ci
```

Push Prisma schema to the local database:

```bash
npx prisma db push
```

Seed demo categories and products:

```bash
npm run seed
```

Start the API:

```bash
npm run dev
```

## Useful commands

```bash
npx prisma validate
npx prisma generate
npm run build
npm test -- --runInBand --passWithNoTests
```
