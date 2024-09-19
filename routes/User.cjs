const jwt = require('jsonwebtoken')
const express = require("express");
const VerifyJwt = require("../Middleware/VerifyJwt.cjs")
const router = express.Router();

function appendToFilename(filename, string) {
  let dotIndex = filename.lastIndexOf(".");
  return filename.substring(0, dotIndex) + string + filename.substring(dotIndex);
}

router.get('/', async (req, res) => {
  try {
    const [scheme, token] = req.headers.authorization.split(' ');
    let user;
    try {
      user = jwt.verify(token, process.env.JWT_KEY);
    } catch (err) {
      return res.status(200).json({});
    }

    const [userInfo] = await req.db.query(`
    SELECT id, name, email, date_created, color, avatar, avatar_metadata FROM users
    WHERE id = ${user.userId}`
    ); 
    if (!userInfo.length) {
      console.error('Error in UserInfo get /User/');
      return res.status(404).json({ message: 'User not found' });
    }

    userInfo[0].avatar = appendToFilename(userInfo[0].avatar, '-small');
    res.status(200).json({ user, userInfo: userInfo[0] });
  } catch (err) {
    console.error(err, "");
    res.status(500).json({ message: 'Internal Server Error' })
  }
});


router.get('/posts/liked/:page', async (req, res) => {
  try {
    const [scheme, token] = req.headers.authorization.split(' ');
    const user = jwt.verify(token, process.env.JWT_KEY);

    const page = Number(req.params.page) - 1;
    const nextPage = Number(req.params.page) + 1;
    const itemsPerPage = 10;

    const [count] = await req.db.query(`
      SELECT COUNT(*) as count FROM posts
      WHERE posts.id IN(
        SELECT post_id FROM post_likes
        WHERE post_likes.user_id = ${user.userId}
      )`
    );
    if (!count.length) {
      return res.status(404).json({ message: 'No liked posts found' });
    }

    const hasMore = (page + 1) * itemsPerPage < count[0]['count'];

    const [posts] = await req.db.query(`
      SELECT id, user_id, title, description, author, category, image, image_metadata, date_published FROM posts
      WHERE posts.id IN(
        SELECT post_id FROM post_likes
        WHERE post_likes.user_id = ${user.userId}
      )
        AND date_deleted is NULL
      ORDER BY posts.date_published DESC
      LIMIT ${page * itemsPerPage}, ${itemsPerPage}`
    );

    res.status(200).json({ posts, count: count[0]['count'], hasMore, nextPage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/posts/:published/:page', async (req, res) => {
  try {
    const [scheme, token] = req.headers.authorization.split(' ');
    const user = jwt.verify(token, process.env.JWT_KEY);

    const published = req.params.published;
    const page = Number(req.params.page) - 1;
    const nextPage = Number(req.params.page) + 1;
    const itemsPerPage = 10;

    let countQuery;
    let postQuery;
    if (published === 'deleted') {
      countQuery = `
        SELECT COUNT(*) as count FROM posts p
        WHERE p.user_id = ${user.userId}
          AND p.date_deleted is not NULL
      `;
      postQuery = `
        SELECT id, user_id, title, description, author, category, image, image_metadata, date_published FROM posts
        WHERE user_id = ${user.userId} 
          AND date_deleted is not NULL
        ORDER BY date_published DESC
        LIMIT ${page * itemsPerPage}, ${itemsPerPage}
      `;
    } else {
      countQuery = `
        SELECT COUNT(*) as count FROM posts p
        WHERE p.user_id = ${user.userId}
          AND is_published = ${published}
          AND p.date_deleted is NULL
      `;
      postQuery = `
        SELECT id, user_id, title, description, author, category, image, image_metadata, date_published FROM posts
        WHERE user_id = ${user.userId} 
          AND is_published = ${published}
          AND date_deleted is NULL
        ORDER BY date_published DESC
        LIMIT ${page * itemsPerPage}, ${itemsPerPage}
      ;`
    }
    const [count] = await req.db.query(countQuery);
    if (!count[0]['count']) {
      return res.status(404).json({ message: 'No posts found' });
    }

    const hasMore = (page + 1) * itemsPerPage < count[0]['count'];
    const [posts] = await req.db.query(postQuery);

    res.status(200).json({ posts, count: count[0]['count'], hasMore, nextPage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
  });

  router.delete('/', async (req, res) => {
    try {
    const [scheme, token] = req.headers.authorization.split(' ');
    const user = jwt.verify(token, process.env.JWT_KEY)

    await req.db.query(`
    UPDATE users
    SET date_deleted = UTC_TIMESTAMP()
    WHERE id = ${user.userId};`
    ); 

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
  });

module.exports = router;