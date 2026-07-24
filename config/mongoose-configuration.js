const mongoose = require("mongoose");
const dns = require("dns");

dns.setServers(["8.8.8.8"]);

mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log("MongoDB connected"))
.catch((err) => console.log(err));