const express = require("express");
const cors = require("cors");
const loginRoutes = require("./routes/login");
const cashierRoutes = require("./routes/cashier");
const translateRoutes = require("./routes/translate");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/login", loginRoutes);
app.use("/api/cashier", cashierRoutes);
app.use("/api/translate", translateRoutes);

module.exports = app;