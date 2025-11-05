// backend/path/all_usersPath.js
import express from "express";
import { Clerk } from "@clerk/clerk-sdk-node";

const router = express.Router();
const clerk = new Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

// GET all Clerk users
router.get("/", async (req, res) => {
  try {
    const users = await clerk.users.getUserList({ limit: 100 });
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("❌ Clerk users fetch error:", error);
    res.status(500).json({ error: "Failed to fetch Clerk users" });
  }
});

export default router;
