import express from "express";
import { sql } from "../config/db.js";

const router = express.Router();

// ✅ POST /api/add-route
router.post("/", async (req, res) => {
  const { route_from, route_to, estimated_price, vehicle_type } = req.body;

  if (!route_from || !route_to || !estimated_price || !vehicle_type) {
    return res.status(400).json({ error: "Please fill in all required fields." });
  }

  try {
    const result = await sql`
      INSERT INTO add_route (route_from, route_to, estimated_price, vehicle_type)
      VALUES (${route_from}, ${route_to}, ${estimated_price}, ${vehicle_type})
      RETURNING *;
    `;

    res.json({
      success: true,
      message: "Route added successfully!",
      data: result[0],
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Database error while adding route." });
  }
});

// ✅ GET /api/add-route
router.get("/", async (req, res) => {
  try {
    const routes = await sql`SELECT * FROM add_route ORDER BY route_id ASC;`;
    res.json(routes);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Database error fetching routes." });
  }
});

// ✅ PUT /api/add-route/:id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { route_from, route_to, estimated_price, vehicle_type } = req.body;

  if (!route_from || !route_to || !estimated_price || !vehicle_type) {
    return res.status(400).json({ error: "Please fill in all required fields." });
  }

  try {
    const updated = await sql`
      UPDATE add_route
      SET route_from = ${route_from},
          route_to = ${route_to},
          estimated_price = ${estimated_price},
          vehicle_type = ${vehicle_type}
      WHERE route_id = ${id}
      RETURNING *;
    `;
    res.json({
      success: true,
      message: "Route updated successfully!",
      data: updated[0],
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Database error updating route." });
  }
});

// ✅ DELETE /api/add-route/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await sql`DELETE FROM add_route WHERE route_id = ${id}`;
    res.json({ success: true, message: "Route deleted successfully!" });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Database error deleting route." });
  }
});

export default router;
