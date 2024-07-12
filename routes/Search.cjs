const express = require('express');
const router = express.Router();

router.get('/:search/:page', async (req, res) => {
  const search = req.params.search;
  const page = Number(req.params.page) - 1;
  const nextPage = Number(req.params.page) + 1;
  const itemsPerPage = 10;

  try {
    const [count] = await req.db.query(`
      SELECT COUNT(*) as count From posts p
      WHERE LOWER(title) LIKE LOWER("%${search}%") 
        OR LOWER(description) LIKE LOWER("%${search}%")
        AND p.user_id in (SELECT id FROM users u WHERE p.user_id = u.id AND date_deleted is NULL)`
    );
    const hasMore = (page + 1) * itemsPerPage < count[0]['count'];

    const [posts] = await req.db.query(`
      SELECT id, user_id, title, description, author, category, image, image_metadata, date_published From posts p
      WHERE LOWER(title) LIKE LOWER("%${search}%") 
        OR LOWER(description) LIKE LOWER("%${search}%")
        AND p.user_id in (SELECT id FROM users u WHERE p.user_id = u.id AND date_deleted is NULL)
      LIMIT ${page * itemsPerPage}, ${itemsPerPage}`
    );
    res.json({ posts, count, hasMore, nextPage });
    
  } catch (err) {
    console.log(err);
    res.json({ err });
  }
});

module.exports = router;