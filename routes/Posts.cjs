const express = require("express");
const router = express.Router();

router.get('/:category/:sort', async (req, res) => {
  const category = req.params.category;
  const sort = req.params.sort;

  try {
    if(category == 0){
      if(sort == 1){
        const [posts] = await req.db.query(`
          SELECT * FROM posts
          WHERE published = 1 AND deleted = 0
          ORDER BY date_created DESC
          LIMIT 3`
        );
        res.json({ posts });
      } else if(sort == 2){
        const [posts] = await req.db.query(`
          SELECT * FROM posts
          WHERE published = 1 AND deleted = 0
          ORDER BY date_created DESC
          LIMIT 3`
        );
        res.json({ posts });
      }else if(sort == 3){
        const [posts] = await req.db.query(`
          SELECT * FROM posts
          WHERE published = 1 AND deleted = 0
          ORDER BY posts.likes DESC
          LIMIT 3`
        );
        res.json({ posts });
      }
    } else {
      if(sort == 1){
        const [posts] = await req.db.query(`
          SELECT * FROM posts
          WHERE category = ${category} AND published = 1 AND deleted = 0
          ORDER BY date_created DESC
          LIMIT 2`
        );
        res.json({ posts });
      } else if(sort == 2){
        const [posts] = await req.db.query(`
          SELECT * FROM posts
          WHERE category = ${category} AND published = 1 AND deleted = 0
          ORDER BY date_created DESC
          LIMIT 2`
        );
        res.json({ posts });
      } else if(sort == 3){
        const [posts] = await req.db.query(`
          SELECT * FROM posts
          WHERE category = ${category} AND published = 1 AND deleted = 0
          ORDER BY posts.likes DESC
          LIMIT 2`
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