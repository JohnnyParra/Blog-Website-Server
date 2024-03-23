const express = require('express');
const router = express.Router();

router.get('/featured/:category', async (req, res) => {
  const category = req.params.category;

  try {
    if (category == 0) {
      const [post] = await req.db.query(`
        SELECT * FROM posts p
        WHERE p.is_published = 1 AND p.date_deleted is NULL
        ORDER BY (SELECT COUNT(post_id) FROM post_likes l WHERE l.post_id = p.id) DESC
        LIMIT 1`
      );
      res.json({ post });
    } else {
      const [post] = await req.db.query(`
        SELECT * FROM posts p
        WHERE p.category = ${category} AND p.is_published = 1 AND p.date_deleted is NULL
        ORDER BY (SELECT COUNT(post_id) FROM post_likes l WHERE l.post_id = p.id) DESC
        LIMIT 1`
      );
      res.json({ post });
    }
  } catch (err) {
    console.log(err);
    res.json({ err });
  }
});

router.get('/:category/:sort/:page', async (req, res) => {
  const category = req.params.category;
  const sort = req.params.sort;
  const page = req.params.page - 1;

  try {
    if(category == 0){
      const [featuredPost] = await req.db.query(`
        SELECT id FROM posts p
        WHERE p.is_published = 1 AND p.date_deleted is NULL
        ORDER BY (SELECT COUNT(post_id) FROM post_likes l WHERE l.post_id = p.id) DESC
        LIMIT 1`
      );
      const [count] = await req.db.query(`
      SELECT COUNT(*) FROM posts
      WHERE is_published = 1 AND date_deleted is NULL`
      );
      if(sort == 1){
        const [posts] = await req.db.query(`
          SELECT * FROM posts
          WHERE id != '${featuredPost[0].post_id}' AND is_published = 1 AND date_deleted is NULL
          ORDER BY date_published DESC
          LIMIT ${page * 2}, 2`
        );
        res.json({ posts, count });
      } else if(sort == 2){
        const [posts] = await req.db.query(`
          SELECT * FROM posts
          WHERE id != '${featuredPost[0].post_id}' AND is_published = 1 AND date_deleted is NULL
          ORDER BY date_published DESC
          LIMIT ${page * 2}, 2`
        );
        res.json({ posts, count });
      }else if(sort == 3){
        const [posts] = await req.db.query(`
          SELECT * FROM posts p
          WHERE p.id != '${featuredPost[0].post_id}' AND p.is_published = 1 AND p.date_deleted is NULL
          ORDER BY (SELECT COUNT(post_id) FROM post_likes l WHERE l.post_id = p.id) DESC
          LIMIT ${page * 2}, 2`
        );
        res.json({ posts, count });
      }
    } else {
      const [featuredPost] = await req.db.query(`
        SELECT p.id FROM posts p
        WHERE p.category = ${category} AND p.is_published = 1 AND p.date_deleted is NULL
        ORDER BY (SELECT COUNT(post_id) FROM post_likes l WHERE l.post_id = p.id) DESC
        LIMIT 1`
      );
      const [count] = await req.db.query(`
      SELECT COUNT(*) FROM posts
      WHERE category = ${category} AND is_published = 1 AND date_deleted is NULL`
      );
      if(sort == 1){
        const [posts] = await req.db.query(`
          SELECT * FROM posts
          WHERE category = ${category} AND id != '${featuredPost[0].post_id}' AND is_published = 1 AND date_deleted is NULL
          ORDER BY date_published DESC
          LIMIT ${page * 2}, 2`
        );
        res.json({ posts, count });
      } else if(sort == 2){
        const [posts] = await req.db.query(`
          SELECT * FROM posts
          WHERE category = ${category} AND id != '${featuredPost[0].post_id}' AND is_published = 1 AND date_deleted is NULL
          ORDER BY date_published DESC
          LIMIT ${page * 2}, 2`
        );
        res.json({ posts, count });
      } else if(sort == 3){
        const [posts] = await req.db.query(`
          SELECT * FROM posts p
          WHERE p.id != '${featuredPost[0].post_id}' AND p.category = ${category} AND p.is_published = 1 AND p.date_deleted is NULL
          ORDER BY (SELECT COUNT(post_id) FROM post_likes l WHERE l.post_id = p.id) DESC
          LIMIT ${page * 2}, 2`
        );
        res.json({ posts, count });
      }
    }  
  } catch (err) {
    console.log(err);
    res.json({ err });
  }
});

module.exports = router;