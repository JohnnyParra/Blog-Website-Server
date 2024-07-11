const jwt = require('jsonwebtoken')
const express = require("express");
const router = express.Router();

function appendToFilename(filename, string) {
  let dotIndex = filename.lastIndexOf(".");
  return filename.substring(0, dotIndex) + string + filename.substring(dotIndex);
}

router.get('/', async (req, res) => {
  const [scheme, token] = req.headers.authorization.split(' ');
  const user = jwt.verify(token, process.env.JWT_KEY)
try {
  const [userInfo] = await req.db.query(`
  SELECT id, name, email, date_created, color, avatar FROM users
  WHERE id = ${user.userId}`
  ); 
  userInfo[0].avatar = appendToFilename(userInfo[0].avatar, '-small');
  res.json({ user, userInfo });
} catch (err) {
  console.log(err);
  res.json({ err });
}
});


router.get('/posts/liked/:page', async (req, res) => {
const [scheme, token] = req.headers.authorization.split(' ');
const user = jwt.verify(token, process.env.JWT_KEY);
const page = Number(req.params.page) - 1;
const nextPage = Number(req.params.page) + 1;
const itemsPerPage = 10;

try {
  const [count] = await req.db.query(`
    SELECT COUNT(*) as count FROM posts
    WHERE posts.id IN(
      SELECT post_id FROM post_likes
      WHERE post_likes.user_id = ${user.userId}
    )`
  );
  const hasMore = (page + 1) * itemsPerPage < count[0]['count'];

  const [posts] = await req.db.query(`
  SELECT * FROM posts
  WHERE posts.id IN(
    SELECT post_id FROM post_likes
    WHERE post_likes.user_id = ${user.userId}
  )
  ORDER BY posts.date_published DESC
  LIMIT ${page * itemsPerPage}, ${itemsPerPage}`
);

  res.json({ posts, count, hasMore, nextPage });
} catch (err) {
  console.log(err);
  res.json({ err });
}
});

router.get('/posts/:published/:page', async (req, res) => {
  const [scheme, token] = req.headers.authorization.split(' ');
  const user = jwt.verify(token, process.env.JWT_KEY)
  const published = req.params.published;
  const page = Number(req.params.page) - 1;
  const nextPage = Number(req.params.page) + 1;
  const itemsPerPage = 10;
  
  try {
    if (published === 'deleted') {
      const [count] = await req.db.query(`
        SELECT COUNT(*) as count FROM posts p
        WHERE p.user_id = ${user.userId}
          AND p.date_deleted is not NULL`
      );
      const hasMore = (page + 1) * itemsPerPage < count[0]['count'];

      let [posts] = await req.db.query(`
        SELECT * FROM posts
        WHERE user_id = ${user.userId} 
          AND date_deleted is not NULL
        ORDER BY date_published DESC
        LIMIT ${page * itemsPerPage}, ${itemsPerPage}`
      );
      posts = posts.map(post => ({...post, image: appendToFilename(post.image, '-post-card')}))
      res.json({ posts, count, hasMore, nextPage });
    } else {
      const [count] = await req.db.query(`
        SELECT COUNT(*) as count FROM posts p
        WHERE p.user_id = ${user.userId}
          AND is_published = ${published}
          AND p.date_deleted is NULL`
      );
      const hasMore = (page + 1) * itemsPerPage < count[0]['count'];

      let [posts] = await req.db.query(`
        SELECT * FROM posts
        WHERE user_id = ${user.userId} 
          AND is_published = ${published}
          AND date_deleted is NULL
        ORDER BY date_published DESC
        LIMIT ${page * itemsPerPage}, ${itemsPerPage}`
      );
      posts = posts.map(post => ({...post, image: appendToFilename(post.image, '-post-card')}))
      res.json({ posts, count, hasMore, nextPage });
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