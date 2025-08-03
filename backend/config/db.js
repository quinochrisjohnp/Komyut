import { neon } from "@neondatabase/serverless";
import"dotenv/config";


//sql connection using DATABASE_URL
export const sql = neon(process.env.DATABASE_URL);