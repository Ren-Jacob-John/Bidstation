DB setup for Bidstation

1. Create a `.env` file at the project root with the following variables:

```
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=bidstation
DB_PORT=3306
```

2. Install dependencies:

```
npm install
```

3. Run the initializer to create the database and tables:

```
npm run db:init
```

The project uses `mysql2` and the `server/db/init.js` script to run `schema.sql`.
