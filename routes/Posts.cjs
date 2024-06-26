const express = require('express');
const router = express.Router();

router.get('/featured/:category', async (req, res) => {
  const category = req.params.category;

  try {
    if (category == 0) {
      const [post] = await req.db.query(`
        SELECT * FROM posts p
        WHERE p.is_published = 1 
          AND p.date_deleted is NULL
          AND p.user_id in (SELECT id FROM users u WHERE p.user_id = u.id AND date_deleted is NULL)
        ORDER BY (SELECT COUNT(post_id) FROM post_likes l WHERE l.post_id = p.id) DESC
        LIMIT 1`
      );
      res.json({ post });
    } else {
      const [post] = await req.db.query(`
        SELECT * FROM posts p
        WHERE p.category = ${category} 
          AND p.is_published = 1 
          AND p.date_deleted is NULL
          AND p.user_id in (SELECT id FROM users u WHERE p.user_id = u.id AND date_deleted is NULL)
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
  const page = Number(req.params.page) - 1;
  const nextPage = Number(req.params.page) + 1;
  const itemsPerPage = 10;

  try {
    if(category == 0){
      const [featuredPost] = await req.db.query(`
        SELECT id FROM posts p
        WHERE p.is_published = 1 
          AND p.date_deleted is NULL
          AND p.user_id in (SELECT id FROM users u WHERE p.user_id = u.id AND date_deleted is NULL)
        ORDER BY (SELECT COUNT(post_id) FROM post_likes l WHERE l.post_id = p.id) DESC
        LIMIT 1`
      );
      const [count] = await req.db.query(`
      SELECT COUNT(*) as count FROM posts p
      WHERE p.is_published = 1 
        AND p.date_deleted is NULL
        AND p.user_id in (SELECT id FROM users u WHERE p.user_id = u.id AND date_deleted is NULL)`
      );
      const hasMore = (page + 1) * 10 < count[0]['count'];
      if(sort == 1){ //Most Recent
        const [posts] = await req.db.query(`
          SELECT * FROM posts p
          WHERE p.id != '${featuredPost[0].id}' 
            AND p.is_published = 1 
            AND p.date_deleted is NULL
            AND p.user_id in (SELECT id FROM users u WHERE p.user_id = u.id AND date_deleted is NULL)
          ORDER BY p.date_published DESC
          LIMIT ${page * itemsPerPage}, ${itemsPerPage}`
        );
        res.json({ posts, count, hasMore, nextPage });
      } else if(sort == 2){ //Most Recent
        const [posts] = await req.db.query(`
          SELECT * FROM posts p
          WHERE p.id != '${featuredPost[0].id}' 
            AND p.is_published = 1 
            AND p.date_deleted is NULL
            AND p.user_id in (SELECT id FROM users u WHERE p.user_id = u.id AND date_deleted is NULL)
          ORDER BY p.date_published DESC
          LIMIT ${page * itemsPerPage}, ${itemsPerPage}`
        );
        res.json({ posts, count, hasMore, nextPage });
      }else if(sort == 3){ //Most Likes
        const [posts] = await req.db.query(`
          SELECT * FROM posts p
          WHERE p.id != '${featuredPost[0].id}' 
            AND p.is_published = 1 
            AND p.date_deleted is NULL
            AND p.user_id in (SELECT id FROM users u WHERE p.user_id = u.id AND date_deleted is NULL)
          ORDER BY (SELECT COUNT(post_id) FROM post_likes l WHERE l.post_id = p.id) DESC
          LIMIT ${page * itemsPerPage}, ${itemsPerPage}`
        );
        res.json({ posts, count, hasMore, nextPage });
      }
    } else {
      const [featuredPost] = await req.db.query(`
        SELECT p.id FROM posts p
        WHERE p.category = ${category} 
          AND p.is_published = 1 
          AND p.date_deleted is NULL
          AND p.user_id in (SELECT id FROM users u WHERE p.user_id = u.id AND date_deleted is NULL)
        ORDER BY (SELECT COUNT(post_id) FROM post_likes l WHERE l.post_id = p.id) DESC
        LIMIT 1`
      );
      const [count] = await req.db.query(`
      SELECT COUNT(*) as count FROM posts p
      WHERE p.category = ${category} 
        AND p.is_published = 1 
        AND p.date_deleted is NULL
        AND p.user_id in (SELECT id FROM users u WHERE p.user_id = u.id AND date_deleted is NULL)`
      );
      const hasMore = (page + 1) * 10 < count[0]['count'];
      if(sort == 1){ //Most Recent
        const [posts] = await req.db.query(`
          SELECT * FROM posts p
          WHERE p.category = ${category} 
            AND p.id != '${featuredPost[0].id}' 
            AND p.is_published = 1 
            AND p.date_deleted is NULL
            AND p.user_id in (SELECT id FROM users u WHERE p.user_id = u.id AND date_deleted is NULL)
          ORDER BY p.date_published DESC
          LIMIT ${page * itemsPerPage}, ${itemsPerPage}`
        );
        res.json({ posts, count, hasMore, nextPage });
      } else if(sort == 2){ //Most Recent
        const [posts] = await req.db.query(`
          SELECT * FROM posts p
          WHERE p.category = ${category} 
            AND p.id != '${featuredPost[0].id}' 
            AND p.is_published = 1 
            AND p.date_deleted is NULL
            AND p.user_id in (SELECT id FROM users u WHERE p.user_id = u.id AND date_deleted is NULL)
          ORDER BY p.date_published DESC
          LIMIT ${page * itemsPerPage}, ${itemsPerPage}`
        );
        res.json({ posts, count, hasMore, nextPage });
      } else if(sort == 3){ //Most Likes
        const [posts] = await req.db.query(`
          SELECT * FROM posts p
          WHERE p.id != '${featuredPost[0].id}' 
            AND p.category = ${category} 
            AND p.is_published = 1 
            AND p.date_deleted is NULL
            AND p.user_id in (SELECT id FROM users u WHERE p.user_id = u.id AND date_deleted is NULL)
          ORDER BY (SELECT COUNT(post_id) FROM post_likes l WHERE l.post_id = p.id) DESC
          LIMIT ${page * itemsPerPage}, ${itemsPerPage}`
        );
        res.json({ posts, count, hasMore, nextPage });
      }
    }  
  } catch (err) {
    console.log(err);
    res.json({ err });
  }
});

module.exports = router;