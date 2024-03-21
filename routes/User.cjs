const jwt = require('jsonwebtoken')
const express = require("express");
const router = express.Router();

router.get('/', async (req, res) => {
  const [scheme, token] = req.headers.authorization.split(' ');
  const user = jwt.verify(token, process.env.JWT_KEY)
  console.log('user: ', user)
try {
  const [userInfo] = await req.db.query(`
  SELECT id, name, email, date_created, color, avatar FROM users
  WHERE id = ${user.userId}`
  ); 
  res.json({ user, userInfo });
} catch (err) {
  console.log(err);
  res.json({ err });
}
});


router.get('/posts/liked', async (req, res) => {
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

router.get('/posts/:published', async (req, res) => {
  const [scheme, token] = req.headers.authorization.split(' ');
  const user = jwt.verify(token, process.env.JWT_KEY)
  const published = req.params.published;
  console.log('user: ', user)
  
  try {
    if (published === 'deleted') {
      const [posts] = await req.db.query(`
      SELECT * FROM posts
      WHERE user_id = ${user.userId} 
        AND deleted = 1
      ORDER BY date_created DESC`
      );
      res.json({ posts });
    } else {
      const [posts] = await req.db.query(`
      SELECT * FROM posts
      WHERE user_id = ${user.userId} 
        AND published = ${published}
        AND deleted = 0
      ORDER BY date_created DESC`
      );
      res.json({ posts });
    }
  } catch (err) {
    console.log(err);
    res.json({ err });
  }
  });

module.exports = router;