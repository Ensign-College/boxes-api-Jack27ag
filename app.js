require("dotenv").config();
const redis = require("redis");
const express = require("express");

// Create a Redis client
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

// Log Redis client errors
redisClient.on("error", (err) => {
  console.log("Redis Client error", err);
});
redisClient.connect();

// Create an Express application
const app = express();
app.use(express.json());

// GET API endpoint to test the application
app.get("/", async (req, res) => {
  res.send("Hello World!");
});

// POST API endpoint to set a key-value pair
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

// GET API endpoint to retrieve a value by key
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

app.listen(3000, () => {
  console.log("Application running on port 3000");
});
