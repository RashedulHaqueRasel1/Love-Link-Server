const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
var jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;

// middle Ware

app.use(cors());
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fcxten6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

        const bioDataCollection = client.db("Love-Link").collection("bioData");



        // JWT Auth Related Api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            // console.log(user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
            // console.log('user',token)
            res.send({ token })

        })



        // Add Bio Data save (push)MongoDB in bioData Collection
        app.post('/bioData', async (req, res) => {
            const bioDataTitle = req.body;
            const result = await bioDataCollection.insertOne(bioDataTitle);
            res.send(result);
        })










        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send("Love Link is running")

})

app.listen(port, () => {
    console.log(`Love Link is Running is on port :${port}`)

})



