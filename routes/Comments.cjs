const jwt = require("jsonwebtoken");
const express = require("express");
const router = express.Router();

router.get("/likes/:id", async (req, res) => {
  const [scheme, token] = req.headers.authorization.split(" ");
  const user = jwt.verify(token, process.env.JWT_KEY);
  const comment_id = req.params.id;

  try {
    const [likes] = await req.db.query(`
      SELECT COUNT(comment_id) AS Likes FROM comment_likes l
      WHERE l.comment_id = "${comment_id}"
      AND l.user_id in (SELECT id FROM users u WHERE l.user_id = u.id AND u.date_deleted is NULL)`);
    const [userLike] = await req.db.query(`
      SELECT COUNT(user_id) AS userLike FROM comment_likes
      WHERE comment_id = "${comment_id}" AND user_id = ${user.userId}`);
    res.json({ likes, userLike });
  } catch (err) {
    console.log(err);
    res.json({ err });
  }
});

router.post("/likes/:id", async function (req, res) {
  const [scheme, token] = req.headers.authorization.split(" ");
  const user = jwt.verify(token, process.env.JWT_KEY);
  // console.log('like added: ',req.params.id);

  try {
    const [like] = await req.db.query(`
      INSERT INTO comment_likes (comment_id, user_id)
      VALUES (${req.params.id}, ${user.userId});`);
    res.json({ Success: true });
  } catch (error) {
    console.log("error", error);
    res.json({ Success: false });
  }
});

router.delete("/likes/:id", async function (req, res) {
  const [scheme, token] = req.headers.authorization.split(" ");
  const user = jwt.verify(token, process.env.JWT_KEY);
  const comment_id = req.params.id;
  // console.log('deleted like: ', comment_id, user.userId);
  try {
    const [task] = await req.db.query(
      `
      DELETE FROM comment_likes 
      WHERE comment_likes.comment_id = "${comment_id}" AND comment_likes.user_id = ${user.userId}`,
      { hello: "bye" }
    );
    res.json({ Success: true });
  } catch (error) {
    console.log("error", error);
    res.json({ Success: false });
  }
});

router.get("/replies/:id/:page", async (req, res) => {
  const parent_id = req.params.id;
  const page = Number(req.params.page) - 1;
  const nextPage = Number(req.params.page) + 1;
  const itemsPerPage = 8;

  try {
    const [comments] = await req.db.query(`
      SELECT c.*, u.avatar, u.name FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.parent_id = '${parent_id}' AND c.date_deleted is NULL
      ORDER BY c.date_created asc
      LIMIT ${page * itemsPerPage}, ${itemsPerPage};
    `);
    const [total] = await req.db.query(`
      SELECT COUNT(*) as total FROM comments
      WHERE parent_id = '${parent_id}' AND date_deleted is NULL
    `);
    const hasMore = (page + 1) * itemsPerPage < total[0]['total'];
    res.json({comments, total, hasMore, nextPage});
  } catch (err) {
    console.log(err);
    res.json({ err });
  }
});

router.get("/:id/:page", async (req, res) => {
  const post_id = req.params.id;
  const page = Number(req.params.page) - 1;
  const nextPage = Number(req.params.page) + 1;
  const itemsPerPage = 20;

  try {
    const [comments] = await req.db.query(`
      SELECT x.*, COUNT(y.id) as child_count, u.avatar, u.name FROM comments y
      RIGHT JOIN comments x on y.parent_id = x.id
      JOIN users u ON u.id = x.user_id
      WHERE x.post_id = '${post_id}' AND x.date_deleted is NULL
      GROUP BY x.id
      HAVING x.parent_id is NULL
      ORDER BY x.date_created ASC
      LIMIT ${page * itemsPerPage}, ${itemsPerPage};
    `);

    const [total] = await req.db.query(`
      SELECT COUNT(*) as total FROM comments
      WHERE post_id = '${post_id}' AND date_deleted is NULL
    `);

    const [count] = await req.db.query(`
      SELECT COUNT(*) AS count FROM comments
      WHERE post_id = '${post_id}' AND parent_id is NULL
    `);
    const hasMore = (page + 1) * itemsPerPage < count[0]['count'];

    res.json({ comments: comments, total: total, hasMore, nextPage });
  } catch (err) {
    console.log(err);
    res.json({ err });
  }
});

router.post("/", async function (req, res) {
  const [scheme, token] = req.headers.authorization.split(" ");
  const user = jwt.verify(token, process.env.JWT_KEY);

  try {
    const [comment] = await req.db.query(
      `
      INSERT INTO comments (user_id, post_id, text, parent_id, date_created)
      VALUES (${user.userId}, :post_id, :text, :parent_id, UTC_TIMESTAMP)`,
      {
        post_id: req.body.post_id,
        text: req.body.text,
        parent_id: req.body.parent_id,
      }
    );
    res.json({ Success: true });
  } catch (error) {
    console.log("error", error);
    res.json({ Success: false });
  }
});

router.put("/", async function (req, res) {
  const [scheme, token] = req.headers.authorization.split(" ");
  const user = jwt.verify(token, process.env.JWT_KEY);

  try {
    const [comment] = await req.db.query(
      `
      UPDATE comments
      SET text = :text, date_updated = UTC_TIMESTAMP
      WHERE id = :comment_id`,
      {
        comment_id: req.body.comment_id,
        text: req.body.text,
        parent_id: req.body.parent_id,
      }
    );
    res.json({ Success: true });
  } catch (error) {
    console.log("error", error);
    res.json({ Success: false });
  }
});

router.delete("/:id", async function (req, res) {
  const [scheme, token] = req.headers.authorization.split(" ");
  const user = jwt.verify(token, process.env.JWT_KEY);
  const comment_id = req.params.id;

  try {
    const [deleted] = await req.db.query(`
      UPDATE comments
      SET date_deleted = UTC_TIMESTAMP
      WHERE user_id = ${user.userId} AND id = ${comment_id}`
    );
    res.json({ Success: true });
  } catch (error) {
    console.log("error", error);
    res.json({ Success: false });
  }
});

module.exports = router;
