const express = require('express');
const cors = require('cors');
const jwt=require('jsonwebtoken');
const we = require('./Data/We.json');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const app=express();
const port= process.env.PORT || 5000

///Middleware
app.use(cors())
app.use(express.json())

app.get('/',(req,res)=>{
    res.send(`Car Doctor Server is going on port ${port}`)
})

app.get('/we',(req,res)=>{
    console.log('we all');
    res.send(we)
})
app.get('/we/:id',(req,res)=>{
    const id=req.params.id;
    console.log(id);
    const targetId=we.find(w=>w.id==id)
    res.send(targetId)
})

/////Database work Start
const u=process.env.DB_USER;
const p=process.env.DB_PASSWORD;
console.log(u,'\n',p);




const uri = `mongodb+srv://${u}:${p}@cluster0.jokwhaf.mongodb.net/?retryWrites=true&w=majority`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    //////Database Main work start
    const serviceCollection=client.db('carDoctor').collection('Services')
    const bookingCollection=client.db('carDoctor').collection('Bookings')


    app.get('/services', async(req,res)=>{
        const cursor=serviceCollection.find();
        const result=await cursor.toArray();
        res.send(result)
    })

    app.get('/services/:id',async(req,res)=>{
        const id=req.params.id;
        console.log(id);
        const query={_id: new ObjectId(id) }

        const options = {
            // Include only the `title` and `imdb` fields in the returned document
            projection: { title: 1, price: 1, service_id: 1, img:1},
          };


        const result= await serviceCollection.findOne(query,options)
        res.send(result);

    })



    ///Bookings
    app.post('/bookings',async(req,res)=>{
        const booking=req.body;
        console.log(booking);

        const result= await bookingCollection.insertOne(booking)
        res.send(result)

    })

    // app.get('/bookings',async(req,res)=>{
    //    // const cursor=bookingCollection.find();
    //     const result=await bookingCollection.find().toArray();
    //     res.send(result);
    // })
    app.get('/bookings',async(req,res)=>{
        console.log(req.query.email);
        let query={}
        if(req.query?.email){
            query={email: req.query.email}
        }

        const options = {
            // sort returned documents in ascending order by title (A->Z)
            sort: { status: 1 },
          };


        const result=await bookingCollection.find(query,options).toArray();
        res.send(result);
    })

    app.delete('/bookings/:id', async(req,res)=>{
        const id=req.params.id;
        const query = {_id: new ObjectId(id)  };
        const result = await bookingCollection.deleteOne(query);
        res.send(result)

    })

    app.patch('/bookings/:id', async (req,res)=>{
        const id=req.params.id;
        const filter = {_id: new ObjectId(id)};
        const updatedBooking=req.body;

        const updateDoc = {
            $set: {
              status: updatedBooking.status
            },
          };

          const result=await bookingCollection.updateOne(filter,updateDoc)
          res.send(result)
        console.log(updatedBooking);
    })


    //////Database Main work end



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);


/////Database work End





///Footer
app.listen(port,()=>{
    console.log(`Car Doctor Server is going on port ${port}`);
})