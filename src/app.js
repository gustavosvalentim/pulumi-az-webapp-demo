const express = require("express");

const PORT = process.env.PORT || 8080;
const ENVIRONMENT = process.env.API_ENVIRONMENT || "local";

let counter = 0;

const app = express();

app.get("/counter", (req, res) => res.send({ counter }));
app.post("/counter", (req, res) => {
  counter++;
  res.sendStatus(200);
});
app.get("/health", (req, res) =>
  res.send({ healthy: true, environment: ENVIRONMENT })
);

app.listen(PORT, () => console.log(`Listening to port ${PORT}`));
