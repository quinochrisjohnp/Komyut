import { neon } from "@neondatabase/serverless";

import "dotenv/config";

// Create a SQL connection using DB.JS
export const sql = neon(process.env.DATABASE_URL)