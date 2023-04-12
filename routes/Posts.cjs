const express = require('express');
const router = express.Router();

router.get('/featured/:category', async (req, res) => {
  const category = req.params.category;

  try {
    if (category == 0) {
      const [post] = await req.db.query(`
        SELECT * FROM posts
        WHERE published = 1 AND deleted = 0
        ORDER BY posts.likes DESC
        LIMIT 1`
      );
      res.json({ post });
    } else {
      const [post] = await req.db.query(`
        SELECT * FROM posts
        WHERE category = ${category} AND published = 1 AND deleted = 0
        ORDER BY posts.likes DESC
        LIMIT 1`
      );
      res.json({ post });
    }
  } catch (err) {
    console.log(err);
    res.json({ err });
  }
});

router.get('/:category/:sort', async (req, res) => {
  const category = req.params.category;
  const sort = req.params.sort;

  try {
    if(category == 0){
      const [featuredPost] = await req.db.query(`
        SELECT post_id FROM posts
        WHERE published = 1 AND deleted = 0
        ORDER BY posts.likes DESC
        LIMIT 1`
      );
      if(sort == 1){
        const [posts] = await req.db.query(`
          SELECT * FROM posts
          WHERE post_id != '${featuredPost[0].post_id}' AND published = 1 AND deleted = 0
          ORDER BY date_created DESC
          LIMIT 3`
        );
        res.json({ posts });
      } else if(sort == 2){
        const [posts] = await req.db.query(`
          SELECT * FROM posts
          WHERE post_id != '${featuredPost[0].post_id}' AND published = 1 AND deleted = 0
          ORDER BY date_created DESC
          LIMIT 3`
        );
        res.json({ posts });
      }else if(sort == 3){
        const [posts] = await req.db.query(`
          SELECT * FROM posts
          WHERE published = 1 AND deleted = 0
          ORDER BY posts.likes DESC
          LIMIT 1, 3`
        );
        res.json({ posts });
      }
    } else {
      const [featuredPost] = await req.db.query(`
        SELECT post_id FROM posts
        WHERE category = ${category} AND published = 1 AND deleted = 0
        ORDER BY posts.likes DESC
        LIMIT 1`
      );
      if(sort == 1){
        const [posts] = await req.db.query(`
          SELECT * FROM posts
          WHERE category = ${category} AND post_id != '${featuredPost[0].post_id}' AND published = 1 AND deleted = 0
          ORDER BY date_created DESC
          LIMIT 2`
        );
        res.json({ posts });
      } else if(sort == 2){
        const [posts] = await req.db.query(`
          SELECT * FROM posts
          WHERE category = ${category} AND post_id != '${featuredPost[0].post_id}' AND published = 1 AND deleted = 0
          ORDER BY date_created DESC
          LIMIT 2`
        );
        res.json({ posts });
      } else if(sort == 3){
        const [posts] = await req.db.query(`
          SELECT * FROM posts
          WHERE category = ${category} AND published = 1 AND deleted = 0
          ORDER BY posts.likes DESC
          LIMIT 1, 2`
        );
        res.json({ posts });
      }
    }  
  } catch (err) {
    console.log(err);
    res.json({ err });
  }
});

module.exports = router;