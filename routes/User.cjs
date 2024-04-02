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
  WHERE posts.id IN(
    SELECT post_id FROM post_likes
    WHERE post_likes.user_id = ${user.userId}
  )
  ORDER BY posts.date_published DESC`
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
        AND date_deleted is not NULL
      ORDER BY date_published DESC`
      );
      res.json({ posts });
    } else {
      const [posts] = await req.db.query(`
      SELECT * FROM posts
      WHERE user_id = ${user.userId} 
        AND is_published = ${published}
        AND date_deleted is NULL
      ORDER BY date_published DESC`
      );
      res.json({ posts });
    }
  } catch (err) {
    console.log(err);
    res.json({ err });
  }
  });

  router.delete('/', async (req, res) => {
    const [scheme, token] = req.headers.authorization.split(' ');
    const user = jwt.verify(token, process.env.JWT_KEY)
    console.log('user: ', user)
  try {
    const [userInfo] = await req.db.query(`
    UPDATE users
    SET date_deleted = UTC_TIMESTAMP()
    WHERE id = ${user.userId};`
    ); 
    res.json({ Success: true });
  } catch (err) {
    console.log(err);
    res.json({ Success: false, err });
  }
  });

module.exports = router;