const express = require('express');
const compression = require('compression');
const cors = require('cors');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

// importing routes
const authenticateRoute = require('./routes/Authenticate.cjs');
const postsRoute = require('./routes/Posts.cjs');
const userRoute = require('./routes/User.cjs');
const postRoute = require('./routes/Post.cjs');
const likeRoute = require('./routes/Likes.cjs');
const profileRoute = require('./routes/Profile.cjs');
const searchRoute = require('./routes/Search.cjs');
const commentsRoute = require('./routes/Comments.cjs')

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
    database: process.env.DB_NAME,
    timezone: "+00:00"
});

app.use(cors(corsOptions));
app.use(compression({filter: shouldCompress}));

function shouldCompress (req, res) {
  if (req.headers['x-no-compression']) {
    return false;
  }
  return compression.filter(req, res);
}

// Makes Express parse the JSON body of any requests and adds the body to the req object
app.use(bodyParser.json({limit: '50mb'}));

app.use(async (req, res, next) => {
  try {
    // Connecting to our SQL db. req gets modified and is available down the line in other middleware and endpoint functions
    req.db = await pool.getConnection();
    req.db.connection.config.namedPlaceholders = true;

    // Traditional mode ensures not null is respected for unsupplied fields, ensures valid JavaScript dates, etc.
    await req.db.query('SET SESSION sql_mode = "TRADITIONAL"');
    await req.db.query(`SET time_zone = '+00:00'`);

    // Moves the request on down the line to the n ext middleware functions and/or the endpoint it's headed for
    next();

    // After the endpoint has been reached and resolved, disconnects from the database
    req.db.release();
  } catch (err) {
    console.error(err)
    if (req.db) {
      req.db.release();
      return res.status(503).json({ message: 'Failed to connect to database' });
    }
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.use("/public", express.static("public"));


// Routes before a jwt is needed
app.use("/authenticate", authenticateRoute);
app.use("/posts", postsRoute);
app.use("/search", searchRoute);

// Jwt verification checks to see if there is an authorization header with a valid jwt in it.
// app.use(async function verifyJwt(req, res, next) {
//   try {
//     if (!req.headers.authorization) {
//       return res.json('Invalid authorization, no authorization headers');
//     }

//     const [scheme, token] = req.headers.authorization.split(' ');
//     if (scheme !== 'Bearer') {
//       return res.json('Invalid authorization, invalid authorization scheme');
//     }

//     const payload = jwt.verify(token, process.env.JWT_KEY);
//     req.user = payload;
//   } catch (err) {
//     console.error(err);
//     if (
//       err.message && 
//       (err.message.toUpperCase() === 'INVALID TOKEN' || 
//       err.message.toUpperCase() === 'JWT EXPIRED')
//     ) {

//       req.status = err.status || 500;
//       req.body = err.message;
//       req.app.emit('jwt-error', err, req);
//     } else {
//       throw((err.status || 500), err.message);
//     }
//   }

//   next();
// });

// Routes
app.use("/user", userRoute);
app.use("/post", postRoute);
app.use("/likes", likeRoute);
app.use("/profile", profileRoute)
app.use("/comments", commentsRoute)

// Start the Express server
app.listen(port || 3000, () => {
  console.log(`server started at http://localhost:${port || 3000}`);
});
