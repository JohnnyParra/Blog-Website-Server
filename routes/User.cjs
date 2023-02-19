const jwt = require('jsonwebtoken')
const express = require("express");
const router = express.Router();

router.get('/', async (req, res) => {
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
    const [posts] = await req.db.query(`
    SELECT * FROM posts
    WHERE user_id = ${user.userId} AND published = ${published}
    ORDER BY date_created DESC`
  );
  
    res.json({ posts });
  } catch (err) {
    console.log(err);
    res.json({ err });
  }
  });

module.exports = router;