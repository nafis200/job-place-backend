
const express = require('express')
const app = express()
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000
const cors = require('cors')
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
    const userCollection = client.db('accountDB').collection('accounts')
    const mobileCollection = client.db('accountDB').collection('mobile')
    const surveyorCollection = client.db('accountDB').collection('surveyor')
    const reportCollection = client.db('accountDB').collection('report')
    const FeedCollection = client.db('accountDB').collection('feedback')
    const responseCollection = client.db('accountDB').collection('response')
    const paymentCollection = client.db('accountDB').collection('payment')

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
       console.log(user)
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
      const user = req.body;
      res.send({user})
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
  