const express = require('express');
const cors = require('cors');
const jwt=require('jsonwebtoken');
const we = require('./Data/We.json');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const app=express();
const port= process.env.PORT || 5000

///Middleware
// app.use(cors())
const corsConfig = {
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH']
  }
app.use(cors(corsConfig))


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

// const verifyJwt=(req,res,next)=>{
//   console.log('Hitting verify JWT-1');
//   console.log(req.headers.authorization);
//   const authorization=req.headers.authorization;

//   if(!authorization){
//     return res.status(401).send({error:true, message: "unauthorized access"})
//   }

//   const token=authorization.split(' ')[1]
  
//   console.log('Token inside verify jwt: \n',token);
//   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error,decoded)=>{
//      if(error){
//        res.status(403).send({error: true, message: 'not verified' })
//      }
//      req.decoded=decoded
//      next()
//   })

// }

const verifyJWT=(req,res,next)=>{
  console.log('Verify Heating');
  const authorization=req.headers.authorization;
  if(!authorization){
     return res.status(401).send({error: true, message: 'unauthorized'})
  }
  const token=authorization.split(' ')[1]
  console.log('Token: ',token);

  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET, (err,decoded)=>{
    if(err){
      return res.status(401).send({error: true, message: 'Not Verified'})
    }
    req.decoded=decoded;
    next();
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //await client.connect();

    //////Database Main work start
    const serviceCollection=client.db('carDoctor').collection('Services')
    const bookingCollection=client.db('carDoctor').collection('Bookings')


    ///JWT

    app.post('/jwt', (req,res)=>{
      const user=req.body;
      console.log(user);

      const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
        expiresIn: '1h'
      })

      console.log(token);
      res.send({token})
    })


    ///Services routes
    app.get('/services', async(req,res)=>{
        // const cursor=serviceCollection.find();
        // const result=await cursor.toArray();

        const sort=req.query.sort;
        const search=req.query.search;
        console.log('sort: ',sort);
        console.log('Search: ',search);

       // const query={}
       // const query={price: {$gt:50, $lte:150} }
       const query={
        title:{$regex: search, $options: 'i'}
       }
        const options = {
          // sort returned documents in ascending order by title (A->Z)
          sort: { 
            "price": sort==='asc'? 1 : -1
           },
        };
        const result=await serviceCollection.find(query,options).toArray()
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



    ///Bookings routes
    app.post('/bookings', async(req,res)=>{
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


    app.get('/bookings', verifyJWT, async(req,res)=>{
       const decoded=req.decoded;
       // console.log(req.headers.authorization);
       console.log('Came back after verify',decoded);

       ///Another Time verify
       if(decoded.email!==req.query.email){
         req.status(403).send({error: 1, message: 'forbidden access' })
       }


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