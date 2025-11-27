const mongoose = require("mongoose");
const config = require("../../config.js");
const Panel = new mongoose.Schema(
  {
    jid: { type: String, required: true, unique: true },
    name: String,
    isAdmin: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", Panel);
const GroupSchema = new mongoose.Schema({
  jid: { type: String, required: true, unique: true },
  welcome: { type: Boolean, default: false },
  goodbye: { type: Boolean, default: false },
  msg_wd: {
    type: String,
    default:
      "┌─────⭓\n│ *👋 WELCOME* \n│\n│@user\n*│Member*\n*│Time:* @time\n│ _@group_ \n└─────⭓",
  },
  msg_dw: {
    type: String,
    default:
      "┌─────⭓\n│ *👋 GOODBYE* \n│\n│@user\n*│Left*\n*│Time:* @time\n│ _Goodbye_\n└─────⭓",
  },
});

const Group = mongoose.model("Group", GroupSchema);
const connectDB = async () => {
  try {
    const mn = process.env.MONGODB_URI || config.MONGODB_URI;
    await mongoose.connect(mn);
    console.log("✅ Connected to Mongodb");
  } catch (e) {
    console.error(e);
    throw e;
  }
};

module.exports = { connectDB, User, Group };
