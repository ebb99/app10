/**
 * set-admin.js
 * Usage:
 *   node set-admin.js <username> <password>
 */

require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

// ===============================
// CLI Parameter
// ===============================
const [, , username, password] = process.argv;

if (!username || !password) {
    console.error("❌ Usage: node set-admin.js <username> <password>");
    process.exit(1);
}

// ===============================
// DB Verbindung
// ===============================
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432
});

// ===============================
// Admin setzen
// ===============================
async function setAdmin() {
    try {
        const hash = await bcrypt.hash(password, 10);

        const existing = await pool.query(
            "SELECT id FROM users WHERE name = $1",
            [username]
        );

        if (existing.rowCount > 0) {
            await pool.query(
                `
                UPDATE users
                SET password = $1, role = 'admin'
                WHERE name = $2
                `,
                [hash, username]
            );

            console.log(`✅ Admin '${username}' aktualisiert`);
        } else {
            await pool.query(
                `
                INSERT INTO users (name, password, role)
                VALUES ($1, $2, 'admin')
                `,
                [username, hash]
            );

            console.log(`✅ Admin '${username}' angelegt`);
        }

    } catch (err) {
        console.error("❌ Fehler:", err.message);
    } finally {
        await pool.end();
    }
}

setAdmin();
