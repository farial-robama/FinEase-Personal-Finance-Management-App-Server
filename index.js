const express = require('express')
const cors = require ('cors')
const app = express()
const admin = require("firebase-admin")
const serviceAccount = require("./serviceKey.json");
require("dotenv").config()
const port = process.env.PORT||5000

app.use(cors())
app.use(express.json())



app.get('/', (req, res) => {
  res.send('Hello World!')
})

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.zeqi5bj.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// const verifyFirebaseToken = async (req, res, next) => {
//     const authorization = req.headers.authorization;

//     if (!authorization) {
//         return res.status(401).send({message: "Unauthorized access. Token not found!"})
//     }
//     const token = authorization.split(" ")[1];
//     try {
//         const decodedToken = await admin.auth().verifyIdToken(token);
//         req.user = decodedToken
//         next()
//     }catch (err) {
//         res.status(401).send({message: "Unauthorized access."})
//     }
// }


async function run() {
  try {
    // await client.connect()
    
    const db = client.db("FineEase-db");
    const transactionCollection = db.collection("transactions");
    const userCollection = db.collection("users");

    // Add User
    app.post('/users', async (req,res) => {
        try{
            const user = req.body;
            const existingUser = await userCollection.findOne({ email: user.email})

    if (existingUser) {
        return res.status(200).send({message: "User already exists!"})
    }

    user.createdAt = new Date()
    const result = await userCollection.insertOne(user);
    res.status(201).send({message: "User added successfully!", id: result.insertedId})
        } 
        catch(err) {
            console.error(err)
            res.status(500).send({message: "Error adding user"})
        }
    })

    // Add Transaction
    app.post('/transactions', async (req,res) => {
        try{
            const transaction = req.body;

    if (!transaction.type || !transaction.category || transaction.amount == null) {
        return res.status(400).json({message: "Missing required fields"})
    }

    transaction.createdAt = new Date()
    const result = await transactionCollection.insertOne(transaction);
    res.status(201).send({message: "Transaction added successfully!", id: result.insertedId})
        } 
        catch(err) {
            console.error(err)
            res.status(500).send({message: "Error adding transections"})
        }
    })
    
    // Get All Transactions
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


    // Get single transaction by id
    app.get('/transactions/id/:id', async (req, res) => {
        try {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const transaction = await transactionCollection.findOne(query)

            if (!transaction) {
                return res.status(404).send({ message: "Transaction not found" })
            }
            res.status(200).send(transaction)
        } catch (err) {
            console.error(err)
            res.status(500).send({ message: "Error fetching transaction details "})
        }
    })

    // Get User Specific Transactions
    app.get('/transactions/:email',  async (req, res) => {
        try {
            const email = req.params.email;
            // const authenticatedEmail = req.user?.email
            // if (requestedEmail !== authenticatedEmail) {
            //     return res.status(403).send({message: "Forbidden: You can view only view your own transactions."})
            // }

            // const sortField = req.query.sortField || "createdAt";
            // const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
            // const result = (await transactionCollection.find({ userEmail: email }).sort({[ sortField ]: sortOrder}).toArray());
            const result = await transactionCollection.find({ userEmail: email }).sort({createdAt: -1}).toArray();
            res.status(200).send(result);
        } catch(err) {
            console.error(err)
            res.status(500).send({message: "Error fetching user transections"})
        }
    })

    // Update Transactions
    app.put('/transactions/:id',  async (req, res) => {
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

   // Delete Transactions
   app.delete('/transactions/:id',  async (req, res) => {
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

    // await client.db("admin").command({ ping: 1 });
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
