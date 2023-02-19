const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

// importing routes
const authenticateRoute = require('./routes/Authenticate.cjs')
const userRoute = require('./routes/User.cjs');
const postRoute = require('./routes/Post.cjs');
const likeRoute = require('./routes/Likes.cjs');

// Allows us to access the .env
require('dotenv').config();

const app = express();
const port = process.env.PORT; // default port to listen

const corsOptions = {
   origin: '*', 
   credentials: true,  // access-control-allow-credentials:true
   optionSuccessStatus: 200,
};

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

app.use(cors(corsOptions));

// Makes Express parse the JSON body of any requests and adds the body to the req object
app.use(bodyParser.json({limit: '50mb'}));

app.use(async (req, res, next) => {
  try {
    // Connecting to our SQL db. req gets modified and is available down the line in other middleware and endpoint functions
    req.db = await pool.getConnection();
    req.db.connection.config.namedPlaceholders = true;

    // Traditional mode ensures not null is respected for unsupplied fields, ensures valid JavaScript dates, etc.
    await req.db.query('SET SESSION sql_mode = "TRADITIONAL"');
    await req.db.query(`SET time_zone = '-8:00'`);

    // Moves the request on down the line to the n ext middleware functions and/or the endpoint it's headed for
    await next();

    // After the endpoint has been reached and resolved, disconnects from the database
    req.db.release();
  } catch (err) {
    // If anything downstream throw an error, we must release the connection allocated for the request
    console.log(err)
    // If an error occurs, disconnects from the database
    if (req.db) req.db.release();
    throw err;
  }
});

app.use("/authenticate", authenticateRoute);

app.get('/posts/:category/:sort', async (req, res) => {
  const category = req.params.category;
  const sort = req.params.sort;

  try {
    if(category == 0){
      if(sort == 1){
        const [posts] = await req.db.query(`
          SELECT * FROM posts
          WHERE published = 1
          ORDER BY date_created DESC
          LIMIT 3`
        );
        res.json({ posts });
      } else if(sort == 2){
        const [posts] = await req.db.query(`
          SELECT * FROM posts
          WHERE published = 1
          ORDER BY date_created DESC
          LIMIT 3`
        );
        res.json({ posts });
      }else if(sort == 3){
        const [posts] = await req.db.query(`
          SELECT * FROM posts
          WHERE published = 1
          ORDER BY posts.likes DESC
          LIMIT 3`
        );
        res.json({ posts });
      }
    } else {
      if(sort == 1){
        const [posts] = await req.db.query(`
          SELECT * FROM posts
          WHERE category = ${category} AND published = 1
          ORDER BY date_created DESC
          LIMIT 2`
        );
        res.json({ posts });
      } else if(sort == 2){
        const [posts] = await req.db.query(`
          SELECT * FROM posts
          WHERE category = ${category} AND published = 1
          ORDER BY date_created DESC
          LIMIT 2`
        );
        res.json({ posts });
      } else if(sort == 3){
        const [posts] = await req.db.query(`
          SELECT * FROM posts
          WHERE category = ${category} AND published = 1
          ORDER BY posts.likes DESC
          LIMIT 2`
        );
        res.json({ posts });
      }
    }  
  } catch (err) {
    console.log(err);
    res.json({ err });
  }
});

// Jwt verification checks to see if there is an authorization header with a valid jwt in it.
app.use(async function verifyJwt(req, res, next) {
  // console.log(req.headers.authorization)
  if (!req.headers.authorization) {
    res.json('Invalid authorization, no authorization headers');
  }

  const [scheme, token] = req.headers.authorization.split(' ');

  if (scheme !== 'Bearer') {
    res.json('Invalid authorization, invalid authorization scheme');
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_KEY);
    req.user = payload;
  } catch (err) {
    console.log(err);
    if (
      err.message && 
      (err.message.toUpperCase() === 'INVALID TOKEN' || 
      err.message.toUpperCase() === 'JWT EXPIRED')
    ) {

      req.status = err.status || 500;
      req.body = err.message;
      req.app.emit('jwt-error', err, req);
    } else {

      throw((err.status || 500), err.message);
    }
  }

  await next();
});

// Routes
app.use("/user", userRoute);
app.use("/post", postRoute);
app.use("/likes", likeRoute);

// Start the Express server
app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});
