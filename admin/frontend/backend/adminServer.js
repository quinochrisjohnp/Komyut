import express from "express";
import dotenv from "dotenv";
import { sql } from "./config/db.js";

dotenv.config();
const app = express();

app.get("/", (req, res) => {
  res.send("Admin server is working ✅");
});

async function initDB() {
  try {
    // Admin User Info
    await sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
      );
    `;

    // System Info
    await sql`
      CREATE TABLE IF NOT EXISTS system_info (
        system_status BOOLEAN DEFAULT TRUE,
        mode VARCHAR(50) DEFAULT 'Normal',
        total_users INT DEFAULT 0,
        active_routes INT DEFAULT 0
      );
    `;

    // User Activity
    await sql`
      CREATE TABLE IF NOT EXISTS user_activity (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES user_id(id) ON DELETE SET NULL,
        activity_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        activity_type VARCHAR(100),
        details TEXT
      );
    `;

    // Admin Activity
    await sql`
      CREATE TABLE IF NOT EXISTS admin_activity (
        id SERIAL PRIMARY KEY,
        admin_id INT REFERENCES admin_users(id) ON DELETE SET NULL,
        activity_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        activity_type VARCHAR(100),
        details TEXT
      );
    `;

    // Route Management
    await sql`
      CREATE TABLE IF NOT EXISTS route_management (
        id SERIAL PRIMARY KEY,
        vehicle_type VARCHAR(50),
        start_point VARCHAR(100),
        price NUMERIC(10,2),
        action VARCHAR(50)
      );
    `;

    // Notifications
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        title VARCHAR(150),
        sent_status BOOLEAN DEFAULT FALSE,
        time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        details TEXT
      );
    `;

    // User Feedback
    await sql`
      CREATE TABLE IF NOT EXISTS user_feedback (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES admin_users(id) ON DELETE SET NULL,
        content TEXT,
        time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status BOOLEAN DEFAULT FALSE
      );
    `;

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing DB:", error);
  }
}

app.listen(5002, async () => {
  console.log("Admin Server is up and running on PORT:5002");
  await initDB(); // Initialize DB when server starts
});
