const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");

const holobuilder_api = require("./routes/holobuilder");

const app = express();
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.text({ defaultCharset: "utf-16" }));
//app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(fileUpload({
  useTempFiles : true,
  tempFileDir : './json_files'
}));

app.use(cors());
app.use("/api/holobuilder", holobuilder_api);

const port = process.env.PROXY_PORT || 5000;

app.listen(port, () =>
  console.log(`Express server is running on port:${port}`)
);
