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
    await client.connect();
    const db = client.db("FineEase-db");
    const transactionCollection = db.collection("transactions");

    app.post('/transactions', async (req,res) => {
        try{
            const transaction = req.body;

    if (!transaction.userEmail || !transaction.userName || !transaction.type || !transaction.category || !transaction.amount) {
        return res.status(400).json({message: "Missing required fields"})
    }

    transaction.cratedAt = new Date()
    const result = await transactionCollection.insertOne(transaction);
    res.status(201).send({message: "Transaction added successfully!", id: result.insertedId})
        } 
        catch(err) {
            console.error(err)
            res.status(500).send({message: "Error fetching transections"})
        }
    })

    app.get('/transactions', async (req, res) => {
        try {
            const cursor = transactionCollection.find();
            const result = await cursor.toArray()
            res.status(200).send(result)
        } catch(err) {
            console.error(err)
            res.status(500).send({message: "Server error"})
        }
    })

    app.get('/transactions/:email', async (req, res) => {
        try {
            const email = req.params.email;
            const result = await transactionCollection.find({ userEmail: email }).toArray();
            res.status(200).send(result);
        } catch(err) {
            console.error(err)
            res.status(500).send({message: "Error fetching user transections"})
        }
    })

    app.put('/transactions/:id', async (req, res) => {
        try{
            const id = req.params.id;
            const updatedData = req.body;
            const filter = { _id: new ObjectId(id)};
            const updateDoc = {
                $set: {
                    ...updatedData,
                    updatedAt: new Date(),
                },
            }
            const result = await transactionCollection.updateOne(filter, updateDoc) 
            res.status(200).send(result)      
        } catch(err) {
            console.error(err)
            res.status(500).send({message: "Server error while updating transactions"})
        }
    })


   app.delete('/transactions/:id', async (req, res) => {
     try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await transactionCollection.deleteOne(query)
        res.status(200).send(result)
     } catch(err) {
        console.error(err)
            res.status(500).send({message: "Server error while deleting transactions"})
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
