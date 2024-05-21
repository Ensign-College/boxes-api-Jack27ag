require("dotenv").config();
const { createClient } = require("redis");
const express = require("express");
const cors = require("cors");

const redisClient = createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

redisClient.on("error", (err) => {
  console.log("Redis Client error", err);
});
redisClient.connect();

const app = express();
app.use(express.json());

const corsOptions = {
  origin: process.env.FRONTEND_ORIGIN,
};
app.use(cors(corsOptions));

app.post("/data/:key", async (req, res) => {
  const { key } = req.params;
  const data = req.body;

  try {
    await redisClient.set(key, JSON.stringify(data));
    res.status(201).send({ message: "Data saved successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error saving data!" });
  }
});

app.get("/data/:key", async (req, res) => {
  const { key } = req.params;

  try {
    const value = await redisClient.get(key);
    if (value === null) {
      res.status(404).send({ message: "Key not found!" });
    } else {
      res.status(200).send({ data: JSON.parse(value) });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error retrieving data!" });
  }
});

app.get("/keys", (req, res) => {
  redisClient.keys("*", (err, keys) => {
    if (err) {
      console.error(err);
      res.status(500).send({ message: "Error retrieving keys!" });
    } else {
      res.status(200).send({ keys });
    }
  });
});

app.listen(3001, () => {
  console.log("Application running on port 3001");
});
