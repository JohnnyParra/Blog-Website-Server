const express = require('express');
const router = express.Router();

router.get('/:search', async (req, res) => {
  const search = req.params.search;
  console.log(search);

  try {
    const [posts] = await req.db.query(`
      SELECT * From posts p
      WHERE title LIKE "%${search}%" 
        OR description LIKE "%${search}%"
        AND p.user_id in (SELECT id FROM users u WHERE p.user_id = u.id AND date_deleted is NULL)`
    );
    res.json({ posts });
    
  } catch (err) {
    console.log(err);
    res.json({ err });
  }
});

module.exports = router;