const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
var jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.STRIPE_KEY)


// middle Ware

app.use(
    cors({
      origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "https://love-link-client.vercel.app"
      ]
    })
  );
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

        // Mongo DB collection in Love Link
        const bioDataCollection = client.db("Love-Link").collection("bioData");
        const usersCollection = client.db("Love-Link").collection("users");
        const favouriteCollection = client.db("Love-Link").collection("favourite");
        const paymentsCollection = client.db("Love-Link").collection("payments");
        const storyCollection = client.db("Love-Link").collection("story");



        // JWT Auth Related Api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            // console.log(user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
            // console.log('user',token)
            res.send({ token })

        })



        // middle wire verify Token
        const verifyToken = (req, res, next) => {
            // console.log("inside verify token" , req.headers.authorization);
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'Not Access' })
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN, (err, decode) => {
                //     // error
                if (err) {
                    // console.log(err)
                    return res.status(401).send({ massage: "Unauthorized " })
                }
                //  token veiled check 
                req.decode = decode;
                // console.log("value In the verifyToken", decode)
                next();
            })
            // next();


        }



        // Use Verify Admin is Verify (Not type url & see Admin data )
        const verifyAdmin = async (req, res, next) => {
            const email = req.decode.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            const isAdmin = user?.role === 'admin';
            if (!isAdmin) {
                return res.status(403).send({ message: 'Admin verify Token Check & Not Admin . Unauthorized' })
            }
            next();
        }



        // // Admin Check Api (valid Admin Or UnValid Admin)
        app.get('/users/admin/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            // console.log(email) 
            if (email !== req.decode.email) {
                return res.status(403).send({ massage: "Don't match email . Unauthorized" })
            }
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            let admin = false;
            if (user) {
                admin = user?.role === 'admin'
            }
            res.send({ admin });
        })




        // Make Admin Api
        app.patch('/users/admin/:id', verifyToken,verifyAdmin, async (req, res) => {
            const id = req.params.id;
            // console.log(id)
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result)
        })



        // premium statues send "pending" update Mongo DB  with contact request (payment collection)
        app.patch('/bioData/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const update = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const data = {
                $set: {
                    status: update.status,
                },
            };
            const result = await bioDataCollection.updateOne(filter, data, options);
            res.send(result)

        })


        // Make Premium Api with Approved Premium Dashboard(Admin) (bioData collection)
        app.patch('/bioData/premium/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            // console.log(id)
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    status: 'premium'
                }
            }
            const result = await bioDataCollection.updateOne(filter, updateDoc);
            res.send(result)
        })


        //  premium member Check Api (valid premium Or UnValid premium)
        app.get('/allContact/premium/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            // console.log(email) 
            if (email !== req.decode.email) {
                return res.status(403).send({ massage: "Don't match email . Unauthorized" })
            }
            const query = { email: email }
            const user = await paymentsCollection.findOne(query);
            let premium = false;
            if (user) {
                premium = user?.status === 'approved'
            }
            res.send({ premium });
        })





        // user data save (push) MongoDB with user collection
        app.post('/users', async (req, res) => {
            const users = req.body;
            // USER email check
            const query = { email: users.email }
            const existingUser = await usersCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: "user Already exist ", insertOne: null })
            }
            const result = await usersCollection.insertOne(users);
            res.send(result)
        })



        // All users Data Show  in client side ( Admin DashBoard)
        app.get('/users', verifyToken,verifyAdmin, async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        })

        // Find Users  Data With Email show client side ...
        app.get('/users/:email', verifyToken, async (req, res) => {
            const query = { email: req.params.email }
            const result = await usersCollection.findOne(query);
            res.send(result)
        })




        // user data save (push) MongoDB
        app.post('/bioData', async (req, res) => {
            const users = req.body;
            users.age = parseInt(users.age)
            // USER email check
            const query = { email: users.email }
            const existingUser = await bioDataCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: "user Already exist. ", insertOne: null })
            }
            // Bio Data Id Make
            const allBioData = await bioDataCollection.find().sort({ id: 1 }).toArray();
            users.id = allBioData.length + 1;
            const result = await bioDataCollection.insertOne({ ...users, id: allBioData.length + 1 });
            res.send(result)
        })



        // All bio Data Show  in client side  
        app.get('/bioData', async (req, res) => {
            const result = await bioDataCollection.find().toArray();
            res.send(result);
        })


        // // Find  Data With Email ...
        app.get('/bioData/:email', async (req, res) => {
            const query = { email: req.params.email }
            const result = await bioDataCollection.findOne(query);
            res.send(result)
        })




        //   View Details Page ...
        app.get('/bioDatass/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bioDataCollection.findOne(query);
            res.send(result)
        })



        // favourite data save (push) MongoDB
        app.post('/favourite', async (req, res) => {
            const favourites = req.body;
            const result = await favouriteCollection.insertOne(favourites);
            res.send(result)
        })


        // favourite Bio Data Show favourite List 
        app.get('/favourite/:email', verifyToken, async (req, res) => {
            const query = { email: req.params.email }
            const result = await favouriteCollection.find(query).toArray();
            res.send(result);
        })


        // DashBoard User contact request Delete 
        app.delete('/favourite/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await favouriteCollection.deleteOne(query);
            res.send(result);
        })



        // ================ Stripe Pay USD API =================
        // Stripe intent Api Create with CheckOut Pages
        app.post("/create-payment-intent", async (req, res) => {
            const { price } = req.body;
            const amount = parseInt(price * 100);
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ["card"],
            })
            res.send({
                clientSecret: paymentIntent.client_secret,
            });

        })


        // ================== Dashboard Contact Request Api ==================
        // Payment related api  with CheckOut pages (payment collection)
        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const paymentResult = await paymentsCollection.insertOne(payment)
            res.send({ paymentResult })
        })


        // Make Premium Api with contact request (payment collection)
        app.patch('/contact/premium/:id',verifyToken, async (req, res) => {
            const id = req.params.id;
            // console.log(id)
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    status: 'approved'
                }
            }
            const result = await paymentsCollection.updateOne(filter, updateDoc);
            res.send(result)
        })

        //  show in paymentsCollection Approved contact request Admin in Mongo DB (Admin dashboard)
        app.get('/payments', verifyToken,verifyAdmin, async (req, res) => {
            const result = await paymentsCollection.find().toArray();
            res.send(result);
        })


        //  show in paymentsCollection Approved contact request Admin in Mongo DB
        app.get('/allContact', verifyToken,verifyAdmin, async (req, res) => {
            const result = await paymentsCollection.find().toArray();
            res.send(result);
        })

        //  show in paymentsCollection Approved contact request in Mongo DB
        app.get('/allContact/:email', verifyToken, async (req, res) => {
            const query = { email: req.params.email }
            const result = await paymentsCollection.find(query).toArray();
            res.send(result);
        })



        // DashBoard User contact request Delete 
        app.delete('/allContact/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await paymentsCollection.deleteOne(query);
            res.send(result);
        })



        // Share Your Success Story GotMarried Page Data Save in MongoDB 
        app.post('/story', async (req, res) => {
            const story = req.body;
            story.rating = parseInt(story.rating)
            const result = await storyCollection.insertOne(story);
            res.send(result)
        })



        //  show in storyCollection  Our Success Stories in Home Page
        app.get('/story', async (req, res) => {
            const result = await storyCollection.find().toArray();
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



