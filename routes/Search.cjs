const express = require('express');
const router = express.Router();

router.get('/:search', async (req, res) => {
  const search = req.params.search;
  console.log(search);

  try {
    const [posts] = await req.db.query(`
      SELECT * From posts
      WHERE post_title LIKE "%${search}%" OR post_description LIKE "%${search}%"`
    );
    res.json({ posts });
    
  } catch (err) {
    console.log(err);
    res.json({ err });
  }
});

module.exports = router;