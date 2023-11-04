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

router
  .get("/", async (req, res) => {
    const result = await collection.find({}).sort({ id: 1 }).toArray();
    res.status(200).send(result);
  })
  .post("/", async (req, res) => {
    try {
      const { name, data, size, mimetype } = req?.files?.file;
      const id = parseInt(req.body.id);

      let img;
      await sharp(data)
        .resize(200)
        .toFormat("webp")
        .toBuffer()
        .then(data => img = data);

      const encImg = img.toString("base64");
      const image = {
        id: id,
        name: name.split(".")[0],
        imgData: {
          img: Buffer.from(encImg, "base64"),
          type: 'image/webp',
          size,
        },
      };

      console.log(image)

      const result = await collection.insertOne(image);

      if (result.acknowledged) {
        res.status(201).send("Image Uploaded Successfully");
      } else {
        res.status(400).send("Image not Uploaded");
      }
    } catch (error) {
      res.status(500).send(error);
    }
  })
  .delete("/", async (req, res) => {
    try {
      let imgIds = req.body;
      imgIds = imgIds.map((id) => ObjectId(id));
      const result = await collection.deleteMany({ _id: { $in: imgIds } });
      if (result.deletedCount) {
        res.status(202).send({ message: "Image Deleted SuccessFully" });
      } else {
        res.status(404).send({ message: "Image Not Found" });
      }
    } catch (error) {
      res.status(500).send(error);
    }
  });

module.exports = router;
