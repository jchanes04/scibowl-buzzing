# Info

This website is used by the Science Bowl club at Enloe High School. We use it for online practices/scrimmages, keeping track of member written questions, and more.

## Local Development

### Buzzing App

The buzzing app supports two database modes:

#### 1. MongoDB (Production)
Set the `DATABASE_URL` environment variable to your MongoDB connection string.

#### 2. SQLite (Local Development)
For local development without MongoDB access, you can use a local SQLite database:

```bash
cd buzzing
npm install
npm run dev:local
```

Or manually set the environment variable:
```bash
USE_LOCAL_DB=true npm run dev
```

The SQLite database will be created at `buzzing-local.db` in the buzzing directory. This file is gitignored.

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | MongoDB connection string | No (if using local DB) |
| `USE_LOCAL_DB` | Set to `true` to use SQLite instead of MongoDB | No |
| `SQLITE_DB_PATH` | Custom path for the SQLite database file | No |
| `PUBLIC_HOST_URL` | The public URL of the app for CORS | Yes |

### SSL Certificates

The app requires SSL certificates for local development. Generate them using:
```bash
mkcert localhost
```

This creates `localhost.pem` and `localhost-key.pem` files.