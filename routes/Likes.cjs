const jwt = require('jsonwebtoken')
const express = require("express");
const router = express.Router();

router.get('/:id', async (req, res) => {
  const [scheme, token] = req.headers.authorization.split(' ');
  const user = jwt.verify(token, process.env.JWT_KEY)
  const post_id = req.params.id;

  try {
    const [likes] = await req.db.query(`
      SELECT COUNT(post_id) AS Likes FROM post_likes l
      WHERE l.post_id = "${post_id}"
      AND l.user_id in (SELECT id FROM users u WHERE l.user_id = u.id AND u.date_deleted is NULL)`
    );
    const [userLike] = await req.db.query(`
      SELECT COUNT(user_id) AS userLike FROM post_likes
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
    const [like] = await req.db.query(`
      INSERT INTO post_likes (post_id, user_id)
      VALUES (:id, ${user.userId})`,
      {
      id: req.body.id,
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
    const [task] = await req.db.query(`
      DELETE FROM post_likes 
      WHERE post_likes.post_id = "${post_id}" AND post_likes.user_id = ${user.userId}`,{hello: 'bye'}
    );
    res.json({Success: true })

  } catch (error){
    console.log('error', error)
    res.json({Success: false})
  }
});

module.exports = router