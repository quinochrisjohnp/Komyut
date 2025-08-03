import express from "express";
import dotenv from "dotenv";
import { sql } from "./config/db.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  console.log("Request received: ", req.method, req.path);
  next();
});

const PORT = process.env.PORT || 5001;

async function initDB() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS user_info (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        profile_image TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS saved_routes (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        type VARCHAR(50),
        start_location VARCHAR(255) NOT NULL,
        destination VARCHAR(255) NOT NULL,
        estimated_cost NUMERIC(10, 2),
        duration_minutes INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    console.log('Database tables ready.');
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
}

// CREATE user_info
app.post("/api/user_info", async (req, res) => {
  try {
    const {
      user_id,
      username,
      email,
      first_name,
      last_name,
      profile_image
    } = req.body;

    if (!user_id || !username || !email) {
      return res.status(400).json({ message: "user_id, username, and email are required" });
    }

    const newUser = await sql`
      INSERT INTO user_info (
        user_id, username, email, first_name, last_name, profile_image
      ) VALUES (
        ${user_id}, ${username}, ${email}, ${first_name}, ${last_name}, ${profile_image}
      )
      ON CONFLICT (user_id) DO NOTHING
      RETURNING *;
    `;

    res.status(201).json(newUser[0]);
  } catch (error) {
    console.error("Error inserting user_info:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// CREATE saved_routes
app.post("/api/saved_routes", async (req, res) => {
  try {
    const {
      user_id,
      type,
      start_location,
      destination,
      estimated_cost,
      duration_minutes
    } = req.body;

    if (!user_id || !start_location || !destination) {
      return res.status(400).json({ message: "user_id, start_location, and destination are required" });
    }

    const newRoute = await sql`
      INSERT INTO saved_routes (
        user_id, type, start_location, destination, estimated_cost, duration_minutes
      )
      VALUES (
        ${user_id}, ${type}, ${start_location}, ${destination}, ${estimated_cost}, ${duration_minutes}
      )
      RETURNING *;
    `;

    res.status(201).json(newRoute[0]);
  } catch (error) {
    console.error("Error saving route:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// READ user_info
app.get("/api/user_info/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    const user_info = await sql`
      SELECT * FROM user_info WHERE user_id = ${user_id} ORDER BY created_at DESC;
    `;

    res.status(200).json(user_info);
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// READ saved_routes
app.get("/api/saved_routes/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    const saved_routes = await sql`
      SELECT * FROM saved_routes WHERE user_id = ${user_id} ORDER BY created_at DESC;
    `;

    res.status(200).json(saved_routes);
  } catch (error) {
    console.error("Error fetching routes:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server running on PORT:", PORT);
  });
});
