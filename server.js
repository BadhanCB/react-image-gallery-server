const express = require("express");
const app = express();
require("dotenv").config();
const cors = require('cors');
const fileUpload = require('express-fileupload');
const galleryRouter = require('./routers/gallery');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(fileUpload());

const port = process.env.PORT || 3210;

app.use('/gallery', galleryRouter);

app.listen(port, () => console.log(`Server start at port: ${port}`));
