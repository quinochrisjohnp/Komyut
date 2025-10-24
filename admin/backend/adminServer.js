import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import rateLimiter from "./middleware/rateLimiter.js";
import { sql } from "./config/db.js";
import notificationsPath from "./Path/notificationsPath.js";

dotenv.config();
const app = express();

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

//Middleware
app.use(rateLimiter);
app.use(express.json());

//Root route
app.get("/", (req, res) => {
  res.send("✅ Admin server is working fine!");
});

//Notifications route
app.use("/api/notifications", notificationsPath);



//Initialize DB (runs once when server starts)
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
    console.log("📦 Table 'notifications' checked/created successfully!");
  } catch (error) {
    console.error("❌ Error creating table:", error);
  }
}

//Start server
app.listen(5002, async () => {
  console.log("🚀 Admin Server running on PORT 5002");
  await initDB();
});
