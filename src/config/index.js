import pkg from "pg";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pkg;

dotenv.config();

const databaseConfig = {
  user: "lone_user",
  host: "postgres-staging-projects.mtechub.com",
  database: "lone_db",
  password: "mtechub123",
  port: 5432,
};

const pool = new Pool(databaseConfig);

pool.on("error", (err) => {
  console.error("Database connection error:", err);
  process.exit(-1);
});

const initializeDatabase = async () => {
  try {
    const client = await pool.connect();
    console.log("Connected to database successfully");

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const initSqlPath = path.join(__dirname, "..", "models", "init.sql");
    console.log("init.sql path:", initSqlPath);

    const initSql = fs.readFileSync(initSqlPath).toString();
    //    console.log("init.sql contents:", initSql);

    await client.query(initSql);
    console.log("All Database tables initialized successfully");

    client.release();
  } catch (err) {
    console.error("Error initializing database tables:", err);
    console.error("Detailed Error Stack:", err.stack);
  }
};

initializeDatabase();

export default pool;
export { initializeDatabase };
