
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
     'https://bkash-app-920d1.firebaseapp.com',
     'https://bkash-app-920d1.web.app'

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
    const dataCollection = client.db('JOBDB').collection('products')
    
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



    app.post('/jwt',async(req,res)=>{
       const user = req.body 
       const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET ,{expiresIn: '1000h'})
       res
       .cookie('token',token,cookieOptions)
       .send({token}) 
    })

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

app.get('/productsCount',async(req,res)=>{
        
  const count = await dataCollection.estimatedDocumentCount();
  res.send({count});
})

app.get('/products',async(req,res)=>{
const page = parseInt(req.query.page)
const size = parseInt(req.query.size)
const cursor = dataCollection.find()
const result = await cursor.skip(page * size).limit(size).toArray()
res.send(result)
})


app.get('/search/:email', async (req, res) => {
  const email = req.params.email
    let query = {};
    if (email) query.brandName = email;
    const cursor = dataCollection.find(query)
    const products = await cursor.toArray();
    if (products.length > 0) {
      res.send(products);
    } else {
      res.send({ brandName: 'Product not found' });
    }
 
});


app.post('/search', async (req, res) => {
  try {
    const { brandName, price, category } = req.body;
    let query = {};

    if (brandName) query.brandName = brandName;
    if (price !== undefined) query.price = price;
    if (category) query.category = category;

    const cursor = dataCollection.find(query)
    const products = await cursor.toArray();

    if (products.length > 0) {
      res.send(products);
    } else {
      res.send({ brandName: 'Product not found' });
    }
  } catch (error) {
    res.send({ brandName: 'Product not found' });
  }
});



 


 
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
  