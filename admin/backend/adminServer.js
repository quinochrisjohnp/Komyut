import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import rateLimiter from "./middleware/rateLimiter.js";
import { sql } from "./config/db.js";
import notificationsPath from "./Path/notificationsPath.js";
import addRoutesPath from "./Path/addRoutesPath.js";
import usersInfoPath from "./Path/usersInfoPath.js";
import all_reportsPath from "./Path/all_reportsPath.js";
import all_usersPath from "./Path/all_usersPath.js";

dotenv.config();
const app = express();


// ✅ Allow frontend connections
app.use(cors());
app.use(rateLimiter);
app.use(express.json());



// ✅ API routes
app.use("/api/notifications", notificationsPath);
app.use("/api/add-route", addRoutesPath);
app.use("/api/clerk-users", usersInfoPath);
app.use("/api/all_reports", all_reportsPath);
app.use("/api/all_users", all_usersPath);



// ✅ Auto-create tables if not exists
async function initDB() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        category VARCHAR(150) NOT NULL,
        sent_to VARCHAR(50) DEFAULT 'All Users',
        sent_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        message TEXT NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS add_route (
        route_id SERIAL PRIMARY KEY,
        route_from VARCHAR(100) NOT NULL,
        route_to VARCHAR(100) NOT NULL,
        estimated_price VARCHAR(20) NOT NULL,
        vehicle_type VARCHAR(50) NOT NULL
      );
    `;

    console.log("✅ Tables created successfully!");
  } catch (error) {
    console.error("❌ Error creating table:", error);
  }
}

// ✅ Start server
app.listen(5002, async () => {
  console.log("🚀 Admin Server running at http://localhost:5002");
  await initDB();
});
