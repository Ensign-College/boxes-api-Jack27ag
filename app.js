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

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// POST /Collections
app.post("/watches", async (req, res) => {
  const key = "Collections";
  const data = {};

  try {
    await redisClient.set(key, JSON.stringify(data));
    res.status(201).send({ message: "Data saved successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error saving data!" });
  }
});

// GET /Collections
app.get("/watches", async (req, res) => {
  try {
    const Collections = await redisClient.get("Collections");
    if (Collections === null) {
      res.status(404).send({ message: "Collections not found!" });
    } else {
      res.status(200).send({ Collections: JSON.parse(Collections) });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error retrieving data!" });
  }
});

// post a collection
app.post("/watches/collection", async (req, res) => {
  const { owner } = req.body;
  let Collections = [];

  redisClient.get("Collections", (err, collection) => {
    if (err) {
      console.error(err);
      res.status(500).send({ message: "Error: Collections not found!" });
      return;
    }

    if (collection) {
      Collections = JSON.parse(collection);
    }

    const newCollectionID = redisClient.incr("collectionID_counter").toString();
    const key = `Collections.collectionID_${newCollectionID}`;

    Collections[newCollectionID] = {
      owner: owner,
      watches: [],
    };

    try {
      redisClient.set(key, JSON.stringify(Collections[newCollectionID]));
      res.status(201).send({ message: "Collection created successfully!" });
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Error creating collection!" });
    }
  });
});

// GET /Collection
app.get("/watches/collection/id", async (req, res) => {
  const { collectionID } = req.params;
  const key = `Collections.collectionID_${collectionID}`;
  try {
    const Collections = await redisClient.get(key);
    if (Collections === null) {
      res.status(404).send({ message: "Collection not found!" });
    } else {
      res.status(200).send({ Collections: JSON.parse(Collections) });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error retrieving data!" });
  }
});

app.listen(process.env.EXPRESS_PORT, () => {
  console.log(
    `Application running on port ${process.env.EXPRESS_HOST}:${process.env.EXPRESS_PORT} !`
  );
});
