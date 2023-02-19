const jwt = require('jsonwebtoken')
const express = require("express");
const router = express.Router();

router.get('/:id', async (req, res) => {
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

router.post('/', async function (req, res) {
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

router.delete('/:id', async function (req, res) {
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

module.exports = router