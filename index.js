const express = require('express')
const cors = require ('cors')
const app = express()
require("dotenv").config()
const port = process.env.PORT||3000

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello World!')
})


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.zeqi5bj.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // await client.connect();
    app.post('/transactions', async (req,res) => {
        try{
            const transaction = req.body;

    if (!transaction.userEmail || !transaction.userName || !transaction.type || !transaction.category || !transaction.amount) {
        return res.status(400).json({message: "Missing required fields"})
    }

    const db = client.db("FineEase-db");
    const collection = db.collection("transactions");

    const result = await collection.insertOne({...transaction, cratedAt: new Date()});
    res.status(201).json({message: "Transaction added successfully!", id: result.insertedId})
        } 
        catch(err) {
            console.error(err)
            res.status(500).json({message: "Server error"})
        }
    })
     

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
