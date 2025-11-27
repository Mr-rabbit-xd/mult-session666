const { existsSync } = require("fs");
const path = require("path");
const { Sequelize } = require("sequelize");
if (existsSync(path.join(__dirname, "config.env"))) {
  require("dotenv").config({ path: path.join(__dirname, "config.env") });
}
const isTrue = (x) => x === "true" || x === true;
const DB_URL = process.env.DATABASE_URL || "";
module.exports = {
  prefix: process.env.PREFIX || ".",
  owner: process.env.OWNER_NUMBER || "917074029156",
  sudo: process.env.SUDO || "917074029156",
  packname: process.env.PACKNAME || "ɠαɾϝιҽʅɗ",
  author: process.env.AUTHOR || "ɳαxσɾ",
  SESSION_ID: process.env.SESSION_ID || "",
  THEME: process.env.THEME || "t", //Garfield
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024,
  timezone: process.env.TIMEZONE || "UTC",
  GIST_URL: process.env.GIST_URL || "",
  MONGODB_URI: process.env.MONGODB_URI || "",
  WORK_TYPE: process.env.WORK_TYPE || "public",
  STATUS_REACT: isTrue(process.env.STATUS_REACT) || false, // true

  DATABASE: DB_URL
    ? new Sequelize(DB_URL, {
        dialect: "postgres",
        ssl: true,
        protocol: "postgres",
        dialectOptions: {
          native: true,
          ssl: { require: true, rejectUnauthorized: false },
        },
        logging: false,
      })
    : new Sequelize({
        dialect: "sqlite",
        storage: "./database.db",
        logging: false,
      }),
};
