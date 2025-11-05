import express from "express";
import dotenv from "dotenv";
import { sql } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";
import saved_routesPath from './path/saved_routesPath.js';
import search_routesPath from './path/search_routesPath.js';
import user_notificationsPath from './path/user_notificationsPath.js';
import user_reportsPath from "./path/user_reportsPath.js";

import job from "./config/cron.js";

dotenv.config();

const app = express();

//middleware
app.use(rateLimiter);
app.use(express.json());

app.use((req, res, next) => {
  console.log("Request received: ", req.method, req.path);
  next();
});

const PORT = process.env.PORT || 5001;

async function initDB() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS saved_routes (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        type VARCHAR(50),
        description VARCHAR(255) NOT NULL,
        start_location VARCHAR(255) NOT NULL,
        destination VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS search_routes (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        starting_loc VARCHAR(255) NOT NULL,
        destination_loc VARCHAR(255) NOT NULL,
        event_time TIME NOT NULL,
        event_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS user_reports (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        username VARCHAR(255),
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;


    console.log("Database tables ready.");
  } catch (error) {
    console.error("Error creating tables:", error.message);
    process.exit(1);
  }
};

app.use("/api/saved_routes", saved_routesPath);
app.use("/api/search_routes", search_routesPath);
app.use("/api/notifications", user_notificationsPath);
app.use("/api/user_reports", user_reportsPath);

app.get("/", (req,res) => {
  res.send("It's working")
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server running on PORT:", PORT);
  });
});
