const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const fileUpload = require("express-fileupload");
const MongoDbConnect = require("./connection");
const port = process.env.PORT;
const tempDir = path.join(__dirname, "temp");

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

MongoDbConnect();

const sliderRoutes = require("./routes/sliderRoutes");
const popupRoutes = require("./routes/popupRoute");
const categoryRoutes = require("./routes/categoryRoutes");
const moleculeRoutes = require("./routes/moleculeRoutes");
const strengthRoutes = require("./routes/strengthRoutes");
const packagingsizeRoutes = require("./routes/packagingsizeRoutes");

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({ useTempFiles: true, tempFileDir: "/temp/" }));
app.use(bodyParser.json());

app.use("/api/sliders", sliderRoutes);
app.use("/api/popups", popupRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/molecules", moleculeRoutes);
app.use("/api/strengths", strengthRoutes);
app.use("/api/packagingsize", packagingsizeRoutes);

app.listen(port, () => {
  console.log(`Port starts on  ${port}`);
});
