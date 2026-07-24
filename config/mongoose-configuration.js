const mongoose = require("mongoose");

console.log("Connecting to MongoDB...");
console.log("URI exists:", !!process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on("connected", () => {
  console.log("✅ MongoDB connected");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB Error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB disconnected");
});

/*const mongoose = require("mongoose");
const dns = require("dns");

dns.setServers(["8.8.8.8"]);

mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log("MongoDB connected"))
.catch((err) => console.log(err));*/