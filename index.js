
const express = require('express')
const app = express()
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000
const cors = require('cors')
const bcrypt = require('bcryptjs');
// 
const { default: axios } = require('axios'); 
// 
app.use(cors({
   origin: [
     'http://localhost:5173',
   ],
   credentials: true
}))
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded())






const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.f8w8siu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;



const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  
  

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  };

  async function run() {
    try { 
    const userCollection = client.db('JOBDB').collection('accounts')
    const transfer = client.db('JOBDB').collection('transfer')
    const cashCollection = client.db('JOBDB').collection('cash')
    const verifyToken = async(req,res,next)=>{
      if(!req.headers.authorization){
           return res.status(401).send({messsage:'forbidden access'})
      }
      const token = req.headers.authorization.split(' ')[1]
      jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
          if(err){
             return res.status(401).send({message:'forbidden access'})
          }
          req.decoded = decoded
          next()
      })
              
    }
  
    app.post('/test',async(req,res)=>{
        const user = req.body;
        console.log("ok")
        res.send(true)
    })

    app.post('/jwt',async(req,res)=>{
       const user = req.body 
       const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET ,{expiresIn: '1000h'})
       res
       .cookie('token',token,cookieOptions)
       .send({token}) 
    })

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'Your are not a admin' });
      }
      next();
    }

    const verifySurveyor = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'surveyor';
      if (!isAdmin) {
        return res.status(403).send({ message: 'You are not a surveyor' });
      }
      next();
    }

    app.post('/logout',async(req,res)=>{
        const user = req.body;
        res.clearCookie('token',{...cookieOptions, maxAge:0}).send({success:true})

    })
   
    app.post('/users',async(req,res)=>{
      const {name,phone,email,pin,status,role,balanced} = req.body
      const hash_password = await bcrypt.hash(pin,10) 
      const userItem = {
           name,phone,email,pin:hash_password,status,role,balanced
      }
      const result = await userCollection.insertOne(userItem)
      res.send(result)
 })

 app.post('/transfer',async(req,res)=>{
      const user = req.body
      const result = await transfer.insertOne(user) 
      res.send(result)
 })

 app.post('/cash',async(req,res)=>{
       const user = req.body 
       const result = await cashCollection.insertOne(user)
       res.send(result)
 })

  app.post('/loginuser',async(req,res)=>{
      const {email,pin} = req.body
      const query = {email: email}
      const user = await userCollection.findOne(query)
      const hashedPassword = user?.pin
      const isMatch = await bcrypt.compare(pin, hashedPassword);
      res.send(isMatch)
  })


  app.patch('/user/:email', async (req, res) => {
    const user = req.body;
    const email = req.params.email;
    const { balanced } = user;
    const query = { email: email };
  
    const updateDoc = {
      $set: { balanced }
    };
  
      const result = await userCollection.updateOne(query, updateDoc);
      if (result.modifiedCount === 1) {
        res.send({message: 'User balance updated successfully' });
      } else {
        res.send({ message: 'User not found or balance not changed' });
      }
  });

  app.get('/users/:email',async(req,res)=>{
    const email = req.params.email
    const query = {email: email}
    const result = await userCollection.findOne(query)
    res.send(result)
  })

 
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
      
    }
  }
  run().catch(console.dir);
  
  
  
  
  
  
  app.get('/', (req, res) => {
      res.send('Hello World! it s me how are you i am localhost')
    })
  
  
  
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`)
    })
  