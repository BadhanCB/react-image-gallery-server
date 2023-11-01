const express = require('express');
const router = express.Router();
const { MongoClient, ServerApiVersion } = require("mongodb");

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
    collection = client.db(process.env.DB_NAME).collection('images');
    await client.db(process.env.DB_NAME).command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

router.get('/', async (req, res) => {
    const result = await collection.find({}).toArray();
    console.log(result);
    res.status(200).send('Image Gallery');
})

module.exports = router;