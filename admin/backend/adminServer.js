import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import rateLimiter from "./middleware/rateLimiter.js";
import { sql } from "./config/db.js";
import notificationsPath from "./Path/notificationsPath.js";

dotenv.config();
const app = express();

// ✅ Allow frontend connections
app.use(cors());

app.use(rateLimiter);
app.use(express.json());

// ✅ Root route (for testing)
app.get("/", (req, res) => {
  res.send("✅ Admin server is working fine!");
});

// ✅ Use router — changed from /api/notifications → /notifications
app.use("/api/notifications", notificationsPath);

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
    console.log("✅ Notifications table ready");
  } catch (error) {
    console.error("❌ Error creating table:", error);
  }
}

// ✅ Start server
app.listen(5002, async () => {
  console.log("🚀 Admin Server running on PORT 5002");
  await initDB();
});
