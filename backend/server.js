import express from "express";
import dotenv from "dotenv";
import { sql } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";
import saved_routesPath from './path/saved_routesPath.js'

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

    console.log("Database tables ready.");
  } catch (error) {
    console.error("Error creating tables:", error.message);
    process.exit(1);
  }
};

app.use("/api/saved_routes", saved_routesPath);

app.get("/", (req,res) => {
  res.send("It's working")
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server running on PORT:", PORT);
  });
});
