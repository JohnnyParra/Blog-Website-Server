const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

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

app.post('/register', async function (req, res) {
  try {
    let encodedUser;
    if(Object.values(req.body).indexOf('') > -1){
      throw new Error('missing fields');
    } else if(req.body.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) == null){
      throw new Error('Invalid Email');
    }
    // Hashes the password and inserts the info into the `user` table
    await bcrypt.hash(req.body.password, 10).then(async hash => {
      try {
        console.log('HASHED PASSWORD', hash);

        const [user] = await req.db.query(`
          INSERT INTO users (name, email, password)
          VALUES (:name, :email, :password);
        `, {
          name: req.body.name,
          email: req.body.email,
          password: hash
        });

        console.log('USER', user)

        encodedUser = jwt.sign(
          { 
            userId: user.insertId,
            name: user.name,
            email: user.email
          },
          process.env.JWT_KEY
        );

        console.log('ENCODED USER', encodedUser);
      } catch (error) {
        console.log('error', error);
      }
    });

    res.json({ jwt: encodedUser });
  } catch (err) {
    console.log('err', err);
    res.json({ err });
  }
});

// authenticates user when they log in
app.post('/authenticate', async function (req, res) {
  try {
    const { email, password } = req.body;
    const [[user]] = await req.db.query(`SELECT * FROM users WHERE email = :email`, {  email });

    if (!user) res.json('Email not found');
    const dbPassword = `${user.password}`
    const compare = await bcrypt.compare(password, dbPassword);

    if (compare) {
      const payload = {
        userId: user.id,
        name: user.name,
        email: user.email,
      }
      
      const encodedUser = jwt.sign(payload, process.env.JWT_KEY);

      res.json({ jwt: encodedUser });
    } else {
      res.json('Password not found');
    }
    
  } catch (err) {
    console.log('Error in /authenticate', err)
  }
});

app.get('/posts/:category/:sort', async (req, res) => {
  const category = req.params.category;
  const sort = req.params.sort;

  try {
    if(category == 0){
      if(sort == 1){
        const [posts] = await req.db.query(`
          SELECT * FROM posts
          ORDER BY date_created DESC
          LIMIT 3`
        );
        res.json({ posts });
      } else if(sort == 2){
        const [posts] = await req.db.query(`
          SELECT * FROM posts
          ORDER BY date_created DESC
          LIMIT 3`
        );
        res.json({ posts });
      }else if(sort == 3){
        const [posts] = await req.db.query(`
          SELECT * FROM posts
          ORDER BY posts.likes DESC
          LIMIT 3`
        );
        res.json({ posts });
      }
    } else {
      if(sort == 1){
        const [posts] = await req.db.query(`
          SELECT * FROM posts
          WHERE category = ${category}
          ORDER BY date_created DESC
          LIMIT 2`
        );
        res.json({ posts });
      } else if(sort == 2){
        const [posts] = await req.db.query(`
          SELECT * FROM posts
          WHERE category = ${category}
          ORDER BY date_created DESC
          LIMIT 2`
        );
        res.json({ posts });
      } else if(sort == 3){
        const [posts] = await req.db.query(`
          SELECT * FROM posts
          WHERE category = ${category}
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

app.get('/get-likes/:id', async (req, res) => {
  const [scheme, token] = req.headers.authorization.split(' ');
  const user = jwt.verify(token, process.env.JWT_KEY)
  const post_id = req.params.id;

  try {
    const [likes] = await req.db.query(`
      SELECT COUNT(post_id) AS Likes FROM likes
      WHERE post_id = "${post_id}"`
    );
    const [userLike] = await req.db.query(`
      SELECT COUNT(user_id) AS userLike FROM likes
      WHERE post_id = "${post_id}" AND user_id = ${user.userId}`
    );
    res.json({ likes, userLike });
  } catch (err) {
    console.log(err);
    res.json({ err });
  }
});

app.get('/user', async (req, res) => {
    const [scheme, token] = req.headers.authorization.split(' ');
    const user = jwt.verify(token, process.env.JWT_KEY)
    console.log('user: ', user)
  try {
    res.json({ user });
  } catch (err) {
    console.log(err);
    res.json({ err });
  }
});

// GET request to http://localhost:8080/tasks
app.get('/user-posts', async (req, res) => {
  const [scheme, token] = req.headers.authorization.split(' ');
  const user = jwt.verify(token, process.env.JWT_KEY)
  console.log('user: ', user)

  try {
    const [posts] = await req.db.query(`
    SELECT * FROM posts
    WHERE user_id = ${user.userId}
    ORDER BY date_created DESC`
  );

    res.json({ posts });
  } catch (err) {
    console.log(err);
    res.json({ err });
  }
});

app.get('/user-liked-posts', async (req, res) => {
  const [scheme, token] = req.headers.authorization.split(' ');
  const user = jwt.verify(token, process.env.JWT_KEY)
  console.log('user: ', user)

  try {
    const [posts] = await req.db.query(`
    SELECT * FROM posts
    WHERE posts.post_id IN(
      SELECT post_id FROM likes
      WHERE likes.user_id = ${user.userId}
    )
    ORDER BY posts.date_created DESC`
  );

    res.json({ posts });
  } catch (err) {
    console.log(err);
    res.json({ err });
  }
});

app.post('/add-post', async function (req, res) {
  const [scheme, token] = req.headers.authorization.split(' ');
  const user = jwt.verify(token, process.env.JWT_KEY)
  console.log('post added: ',req.body);

  try {

    const [post] = await req.db.query(`
      INSERT INTO posts (post_id, post_title, post_description, Author, content, category, date_created, likes, image, user_id, published)
      VALUES (:post_id, :post_title, :post_description, '${user.name}', :content, :category, :date_created, 0, :image, ${user.userId}, ${1})`, 
      {
      post_id: req.body.post_id,
      post_title: req.body.post_title,
      post_description: req.body.post_description,
      content: req.body.content,
      category: req.body.category,
      date_created: req.body.date_created,
      image: req.body.image,
      }
    );
    res.json({Success: true})

  } catch (error) {
    console.log('error', error);
    res.json({Success: false})
  };
});

app.put('/update-post', async function (req, res) {
  const [scheme, token] = req.headers.authorization.split(' ');
  const user = jwt.verify(token, process.env.JWT_KEY)
  console.log('post updated: ',req.body);

  try {

    const [post] = await req.db.query(`
      UPDATE posts
      SET post_title = :post_title, post_description = :post_description, content = :content, category = :category, image = :image, date_edited = :date_edited
      WHERE post_id = :post_id`, 
      {
        post_id: req.body.post_id,
        post_title: req.body.post_title,
        post_description: req.body.post_description,
        content: req.body.content,
        category: req.body.category,
        image: req.body.image,
        date_edited: req.body.date_edited,
      }
    );
    res.json({Success: true})

  } catch (error) {
    console.log('error', error);
    res.json({Success: false})
  };
});

app.post('/add-like', async function (req, res) {
  const [scheme, token] = req.headers.authorization.split(' ');
  const user = jwt.verify(token, process.env.JWT_KEY)
  console.log('like added: ',req.body);

  try {
    const [likes] = await req.db.query(`
      UPDATE posts
      SET likes = likes + 1
      WHERE posts.post_id = :post_id`,
      {
        post_id: req.body.post_id
      }
    );
    const [like] = await req.db.query(`
      INSERT INTO likes (post_id, user_id)
      VALUES (:post_id, ${user.userId})`,
      {
      post_id: req.body.post_id,
      }
    );
    res.json({Success: true})

  } catch (error) {
    console.log('error', error);
    res.json({Success: false})
  };
});

app.delete('/delete-post/:id', async function (req, res) {
  const [scheme, token] = req.headers.authorization.split(' ');
  const user = jwt.verify(token, process.env.JWT_KEY)
  const task_id = req.params.id;
  console.log('deleted post: ', post_id, user.userId);
  try{
    const [task] = await req.db.query(`
      DELETE FROM posts 
      WHERE posts.post_id = '${post_id}' AND post.user_id = ${user.userId}`,{hello: 'hello'}
    );
    res.json({Success: true })

  } catch (error){
    console.log('error', error)
    res.json({Success: false})
  }
});

app.delete('/delete-like/:id', async function (req, res) {
  const [scheme, token] = req.headers.authorization.split(' ');
  const user = jwt.verify(token, process.env.JWT_KEY)
  const post_id = req.params.id;
  console.log('deleted like: ', post_id, user.userId);
  try{
    const [likes] = await req.db.query(`
      UPDATE posts
      SET likes = likes - 1
      WHERE posts.post_id = "${post_id}"`
    );
    const [task] = await req.db.query(`
      DELETE FROM likes 
      WHERE likes.post_id = "${post_id}" AND likes.user_id = ${user.userId}`,{hello: 'bye'}
    );
    res.json({Success: true })

  } catch (error){
    console.log('error', error)
    res.json({Success: false})
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});
