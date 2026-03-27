const express = require("express");
const cors = require("cors");
const loginRoutes = require("./routes/login");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/login", loginRoutes);

module.exports = app;