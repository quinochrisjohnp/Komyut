import express from "express";
import { Clerk } from "@clerk/clerk-sdk-node";

const router = express.Router();
const clerk = new Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

// ✅ GET /api/clerk-users
router.get("/", async (req, res) => {
  try {
    // Use the new `clerk.users.getUserList()` method (not destructured)
    const usersList = await clerk.users.getUserList({ limit: 100 });

    // The response itself is an array — no `.data`
    const formatted = usersList.map((u) => ({
      id: u.id,
      username: u.username || "(no username)",
      email: u.emailAddresses?.[0]?.emailAddress || "(no email)",
      createdAt: u.createdAt || null,
    }));

    res.json({
      success: true,
      count: formatted.length,
      users: formatted,
    });
  } catch (error) {
    console.error("❌ Clerk API error:", error);
    res.status(500).json({ error: "Failed to fetch Clerk users" });
  }
});

// ✅ GET /api/clerk-users/admins
router.get("/admins", async (req, res) => {
  try {
    const organizationId = "org_33doVy58IIslJLJSwfomJHqz4rw"; // your actual org ID

    const memberships = await clerk.organizations.getOrganizationMembershipList({
      organizationId,
      limit: 100,
    });

    // ✅ FIXED FILTER
    const admins = memberships
      .filter((m) => m.role === "admin" || m.role === "org:admin")
      .map((m) => ({
        id: m.publicUserData?.userId,
        username: m.publicUserData?.firstName
          ? `${m.publicUserData.firstName} ${m.publicUserData.lastName || ""}`
          : "(no name)",
        email: m.publicUserData?.identifier || "(no email)",
        role: m.role,
      }));

    res.json({
      success: true,
      count: admins.length,
      admins,
    });
  } catch (error) {
    console.error("❌ Clerk API error:", error);
    res.status(500).json({ error: "Failed to fetch organization admins" });
  }
});

export default router;
