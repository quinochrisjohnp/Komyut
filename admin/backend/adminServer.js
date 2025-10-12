import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import { sql } from "./config/db.js";
import systemInfoRoutes from "./Path/systemInfoPath.js";

dotenv.config();
const app = express();

// ✅ Enable CORS once (clean version)
app.use(
  cors({
    origin: [
      "http://127.0.0.1:5500",
      "http://localhost:5500",
      "http://localhost",
      "http://127.0.0.1",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// ✅ Middleware
app.use(bodyParser.json());

// ✅ Root route
app.get("/", (req, res) => {
  res.send("Admin server is working ✅");
});

// ✅ Mount system info route
app.use("/api/system-info", systemInfoRoutes);

// ✅ Initialize DB
async function initDB() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin'
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS system_info (
        id SERIAL PRIMARY KEY,
        system_status BOOLEAN DEFAULT TRUE,
        mode VARCHAR(50) DEFAULT 'Normal',
        total_users INT DEFAULT 0,
        active_routes INT DEFAULT 0
      );
    `;

    const result = await sql`SELECT COUNT(*) FROM system_info;`;
    if (parseInt(result[0].count) === 0) {
      await sql`
        INSERT INTO system_info (system_status, mode, total_users, active_routes)
        VALUES (TRUE, 'Normal', 0, 0);
      `;
      console.log("✅ system_info initialized with default row");
    }

    await sql`
      CREATE TABLE IF NOT EXISTS user_feedback (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255),
        content TEXT,
        time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status BOOLEAN DEFAULT FALSE
      );
    `;

    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing DB:", error);
  }
}

// ✅ Start server
app.listen(5002, async () => {
  console.log("🚀 Admin Server running on PORT 5002");
  await initDB();
});
