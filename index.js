
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
    const transfer = client.db('JOBDB').collection('transfer')
    const cashCollection = client.db('JOBDB').collection('cash')
    const agentCollection = client.db('JOBDB').collection('agent')
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

  app.get('/item/:email',async(req,res)=>{
    const email = req.params.email
    const query = {email: email}
    const cursor = transfer.find(query)
    const result = await cursor.toArray()
     res.send(result)
  })

  app.get('/cash/:email',async(req,res)=>{
    const email = req.params.email
    const query = {status: email}
    const cursor = transfer.find(query)
    const result = await cursor.toArray()
    res.send(result)
  })

  app.get('/mobile', async (req, res) => {
    const cursor = cashCollection.find();
    const result = await cursor.toArray();
    res.send(result);
});

app.get('/agent', async (req, res) => {
  const cursor = agentCollection.find();
  const result = await cursor.toArray();
  res.send(result);
});

app.get('/transfer', async (req, res) => {
  const cursor = transfer.find();
  const result = await cursor.toArray();
  res.send(result);
});

app.get('/admin/:id', async (req, res) => {
  const id = req.params.id
  if(id === "all")
  {
    const cursor = userCollection.find();
    const result = await cursor.toArray();
    res.send(result);
  }
  else{
    const result = await userCollection.find({ name: id }).toArray();
    
    if (result.length === 0) {
      return res.status(404).send({ message: 'Admin not found' });
    }
    res.send(result)
  }
});



app.patch('/users/admin/:id',async(req,res)=>{
  const id = req.params.id; 
  const filter = {_id : new ObjectId(id)}
  const updateDoc = {
     $set:{
        status: 'complete'
     }
  }
  const result = await cashCollection.updateOne(filter,updateDoc)
  res.send(result)
 })

 app.patch('/admined/:email',async(req,res)=>{
  const email = req.params.email; 
  const filter = {email:email}
  const updateDoc = {
     $set:{
        status: 'complete',
        balanced: 10000,
        role:"agent"
     }
  }
  const result = await userCollection.updateOne(filter,updateDoc)
  res.send(result)
 })


 app.patch('/updatemoney',async(req,res)=>{
        const user = req.body;
        const {id,customar,agent,money,method} = user 
        console.log(money)
        const filter = {_id : new ObjectId(id)}
        const filter1 = {email : customar}
        const filter2 = {email : agent}
        const updateDoc = {
        $set:{
        status: 'complete'
        }
      }
      const updateDoc1 = {
        $inc: {
           balanced:money
        }
      }
      const updateDoc2 = {
        $inc: {
           balanced:-money
        }
      }
   const result = await cashCollection.updateOne(filter,updateDoc)
   const result1 = await userCollection.updateOne(filter1,updateDoc1)
   const result2 = await userCollection.updateOne(filter2,updateDoc2)
   const result3 = await agentCollection.insertOne(user)
   res.send(result)
 })
  
 app.patch('/updatemoney1',async(req,res)=>{
  const user = req.body;
  const {id,customar,agent,money,method,charge} = user 
  console.log(money)
  const filter = {_id : new ObjectId(id)}
  const filter1 = {email : customar}
  const filter2 = {email : agent}
  const updateDoc = {
  $set:{
  status: 'complete'
  }
}
const updateDoc1 = {
  $inc: {
     balanced:-money
  }
}
const updateDoc2 = {
  $inc: {
     balanced:charge
  }
}
const result = await cashCollection.updateOne(filter,updateDoc)
const result1 = await userCollection.updateOne(filter1,updateDoc1)
const result2 = await userCollection.updateOne(filter2,updateDoc2)
const result3 = await agentCollection.insertOne(user)
const result4 = await transfer.insertOne(user)
res.send(result)
})

app.delete('/feedback/:id',async(req,res)=>{
  const id = req.params.id
  const query = {
     _id: new ObjectId(id)
  }
  const result = await userCollection.deleteOne(query)
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
  