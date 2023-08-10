const express = require("express");
const router = express.Router();
const redis = require("redis");
const client = redis.createClient();

const JsonProcessor = require("../jobs/json_processor");

router.post("/upload", (req, res) => {
  let jsonFile = req.files.file;
  const { project_id, email, token } = req.query;

  if (jsonFile && jsonFile.mimetype === "application/json") {
    const cache_key = "HOLOBUILDER_" + Date.now();

    const data = {
      filepath: jsonFile.tempFilePath,
      project_id: project_id,
      email: email,
      token: token,
    }
    client.set(cache_key, JSON.stringify(data));

    JsonProcessor.add({ cache_key });

    res.status(200);
    res.json({ cache_key });
  } else {
    res.status(400);
    res.json({ error: "Invalid file format. Only JSON file accpeted." });
  }
});

router.get("/status", (req, res) => {
  const { cache_key } = res.params;

  const status = client.get(cache_key + "_STATUS");
  res.status(200);
  res.json({ status });
});

module.exports = router;
