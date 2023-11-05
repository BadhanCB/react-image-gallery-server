const express = require("express");
const router = express.Router();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const sharp = require("sharp");

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tinfh.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
let collection;

async function run() {
  try {
    await client.connect();
    collection = client.db(process.env.DB_NAME).collection("images");
    await client.db(process.env.DB_NAME).command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

// router for /gallery
router
  //get api for getting all image data sort by id
  .get("/", async (req, res) => {
    try {
      const result = await collection.find({}).sort({ id: 1 }).toArray();
      res.status(200).send(result);
    } catch (error) {
      res.status(400).send({ message: "Failed to get Data" });
    }
  })
  /**
   * api for receive image as file
   * reduce size and convert to webp image with sharp package
   * convert img to base 64 data for storing to the mongodb
   */
  .post("/", async (req, res) => {
    try {
      const { name, data, size, mimetype } = req?.files?.file;
      const id = parseInt(req.body.id);

      let img;
      await sharp(data)
        .resize(200)
        .toFormat("webp")
        .toBuffer()
        .then((data) => (img = data));

      const encImg = img.toString("base64");
      const image = {
        id: id,
        name: name.split(".")[0],
        imgData: {
          img: Buffer.from(encImg, "base64"),
          type: "image/webp",
          size,
        },
      };

      const result = await collection.insertOne(image);

      if (result.acknowledged) {
        res.status(201).send({ message: "Image Uploaded Successfully" });
      } else {
        res.status(400).send({ message: "Image not Uploaded" });
      }
    } catch (error) {
      res.status(500).send(error);
    }
  })
  /**
   * to update img serial by receiving new serial id
   * update img serial with Bulk operations builder
   */
  .patch('/', async (req, res) => {
    try {
      const updatedData = req.body;

      const bulk = collection.initializeOrderedBulkOp();
      updatedData.forEach((data) => {
        bulk.find({ _id: ObjectId(data._id) }).updateOne({ $set: { id: data.id } });
      });
      await bulk.execute();

      res.status(202).send({ message: "Image SuccessFully Updated" });
    } catch (error) {
      res.status(500).send({ message: "Failed to delete" });
    }
  })
  /**
   * delete multiple data by receiving array of _id
   * wrap them with mongoDB ObjectId class
   * delete multiple data by using $in operator
   * after deleting, update img serial with Bulk operations builder
   */
  .delete("/", async (req, res) => {
    try {
      let imgIds = req.body;
      imgIds = imgIds.map((id) => ObjectId(id));
      const result = await collection.deleteMany({ _id: { $in: imgIds } });

      const existingData = await collection.find({}).sort({ id: 1 }).toArray();
      const bulk = collection.initializeOrderedBulkOp();
      existingData.forEach((data, i) => {
        bulk.find({ _id: data._id }).updateOne({ $set: { id: i + 1 } });
      });
      await bulk.execute();

      if (result.deletedCount) {
        res.status(202).send({ message: "Image Deleted SuccessFully" });
      } else {
        res.status(404).send({ message: "Image Not Found" });
      }
    } catch (error) {
      res.status(500).send({ message: "Failed to delete" });
    }
  });

module.exports = router;
