const jwt = require('jsonwebtoken')
const express = require("express");
const router = express.Router();

router.get('/:id', async (req, res) => {
  try {
    const [scheme, token] = req.headers.authorization.split(' ');
    const user = jwt.verify(token, process.env.JWT_KEY);

    const post_id = req.params.id;

    const [likes] = await req.db.query(`
      SELECT COUNT(post_id) AS Likes FROM post_likes l
      WHERE l.post_id = "${post_id}"
      AND l.user_id in (SELECT id FROM users u WHERE l.user_id = u.id AND u.date_deleted is NULL)`
    );
    const [userLike] = await req.db.query(`
      SELECT COUNT(user_id) AS userLike FROM post_likes
      WHERE post_id = "${post_id}" AND user_id = ${user.userId}`
    );

    res.status(200).json({ likes, userLike });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/', async function (req, res) {
  try {
    const [scheme, token] = req.headers.authorization.split(' ');
    const user = jwt.verify(token, process.env.JWT_KEY);

    await req.db.query(`
      INSERT INTO post_likes (post_id, user_id)
      VALUES (:id, ${user.userId})`,
      {
      id: req.body.id,
      }
    );

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  };
});

router.delete('/:id', async function (req, res) {
  try{
    const [scheme, token] = req.headers.authorization.split(' ');
    const user = jwt.verify(token, process.env.JWT_KEY);

    const post_id = req.params.id;

    await req.db.query(`
      DELETE FROM post_likes 
      WHERE post_likes.post_id = "${post_id}" AND post_likes.user_id = ${user.userId}`,{hello: 'bye'}
    );

    res.status(204).send();
  } catch (error){
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router