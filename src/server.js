require("dotenv").config();
const app = require("./app");
const { initDatabase } = require("./db");

const port = Number(process.env.PORT) || 4000;

async function startServer() {
  try {
    await initDatabase();
    app.listen(port, () => {
      console.log(`NextForge backend is running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
