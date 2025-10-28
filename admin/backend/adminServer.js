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


dotenv.config();
const app = express();

// ✅ ES6 module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Allow frontend connections
app.use(cors());

app.use(rateLimiter);
app.use(express.json());

// ✅ Serve static files from frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// ✅ API routes (put BEFORE catch-all)
app.use("/api/notifications", notificationsPath);
app.use("/api/add-route", addRoutesPath);
app.use("/api/clerk-users", usersInfoPath);

// ✅ FIXED: Use regex instead of '*'
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// ✅ Auto-create table if not exists
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
  console.log("🚀 Admin Server running on http://localhost:5002");
  await initDB();
});