const express = require('express');
const router = express.Router();

router.get('/featured/:category', async (req, res) => {
  try {
    const category = req.params.category;

    let query;
    if (category == 0) {
      query = `
        SELECT id, user_id, title, description, author, category, image, image_metadata, date_published FROM posts p
        WHERE p.is_published = 1 
          AND p.date_deleted is NULL
          AND p.user_id in (SELECT id FROM users u WHERE p.user_id = u.id AND u.date_deleted is NULL)
        ORDER BY (SELECT COUNT(post_id) FROM post_likes l WHERE l.post_id = p.id) DESC
        LIMIT 1
      `;
    } else {
      query = `
        SELECT id, user_id, title, description, author, category, image, image_metadata, date_published FROM posts p
        WHERE p.category = ${category} 
          AND p.is_published = 1 
          AND p.date_deleted is NULL
          AND p.user_id in (SELECT id FROM users u WHERE p.user_id = u.id AND u.date_deleted is NULL)
        ORDER BY (SELECT COUNT(post_id) FROM post_likes l WHERE l.post_id = p.id) DESC
        LIMIT 1
      `;
    }
    const [post] = await req.db.query(query);

    res.status(200).json({ post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/:category/:sort/:page', async (req, res) => {
  try {
    const category = req.params.category;
    const sort = req.params.sort;
    const page = Number(req.params.page) - 1;
    const nextPage = Number(req.params.page) + 1;
    const itemsPerPage = 10;

    const order = (sort == 1 || sort == 2) ? 'p.date_published'
    : '(SELECT COUNT(post_id) FROM post_likes l WHERE l.post_id = p.id)';

    let postQuery;
    let hasMore;
    let countNumber;

    if (category == 0) {
      const [featuredPost] = await req.db.query(`
        SELECT p.id FROM posts p
        WHERE p.is_published = 1 
          AND p.date_deleted is NULL
          AND p.user_id in (SELECT id FROM users u WHERE p.user_id = u.id AND date_deleted is NULL)
        ORDER BY (SELECT COUNT(post_id) FROM post_likes l WHERE l.post_id = p.id) DESC
        LIMIT 1`
      );
      postQuery = `
        SELECT id, user_id, title, description, author, category, image, image_metadata, date_published FROM posts p
        WHERE p.id != '${featuredPost[0].id}' 
          AND p.is_published = 1 
          AND p.date_deleted is NULL
          AND p.user_id in (SELECT id FROM users u WHERE p.user_id = u.id AND u.date_deleted is NULL)
        ORDER BY ${order} DESC
        LIMIT ${page * itemsPerPage}, ${itemsPerPage}
      `;

      const [count] = await req.db.query(`
        SELECT COUNT(*) FROM posts p
        WHERE p.is_published = 1 
          AND p.date_deleted is NULL
          AND p.user_id in (SELECT id FROM users u WHERE p.user_id = u.id AND u.date_deleted is NULL)`
      );
      countNumber = count[0]['COUNT(*)'];
      hasMore = (page + 1) * 10 < countNumber;
    } else {
      const [featuredPost] = await req.db.query(`
        SELECT p.id FROM posts p
        WHERE p.category = ${category} 
          AND p.is_published = 1 
          AND p.date_deleted is NULL
          AND p.user_id in (SELECT id FROM users u WHERE p.user_id = u.id AND u.date_deleted is NULL)
        ORDER BY (SELECT COUNT(post_id) FROM post_likes l WHERE l.post_id = p.id) DESC
        LIMIT 1`
      );
      postQuery = `
        SELECT id, user_id, title, description, author, category, image, image_metadata, date_published FROM posts p
        WHERE p.category = ${category}
          AND p.id != '${featuredPost[0].id}' 
          AND p.is_published = 1 
          AND p.date_deleted is NULL
          AND p.user_id in (SELECT id FROM users u WHERE p.user_id = u.id AND u.date_deleted is NULL)
        ORDER BY ${order} DESC
        LIMIT ${page * itemsPerPage}, ${itemsPerPage}
      `;

      const [count] = await req.db.query(`
        SELECT COUNT(*) FROM posts p
        WHERE p.category = ${category} 
          AND p.is_published = 1 
          AND p.date_deleted is NULL
          AND p.user_id in (SELECT id FROM users u WHERE p.user_id = u.id AND u.date_deleted is NULL)`
      );
      countNumber = count[0]['COUNT(*)'];
      hasMore = (page + 1) * 10 < countNumber;
    }
      
    const [posts] = await req.db.query(postQuery);
    
    res.status(200).json({ posts, count: countNumber, hasMore, nextPage });
  } catch (err) {
    console.error(err);
    res.json({ err });
  }
});

module.exports = router;