const jwt = require('jsonwebtoken');
const express = require("express");
const multer = require('multer');
const router = express.Router();

const storage = multer.diskStorage({
  destination: './public/uploads',
  filename: (req, file, cb) => {
    cb(null, `${new Date()}-${file.originalname}`);
  }
})

const upload = multer({
  storage: storage,
});

router.post('/', upload.single('image'), async function (req, res) {
  const [scheme, token] = req.headers.authorization.split(' ');
  const user = jwt.verify(token, process.env.JWT_KEY)
  console.log("user: ", user)
  const file = req.file;
  const imageURL = `http://localhost:3000/public/uploads/${file?.filename}`;
  console.log('post added: ',req.body);

  try {
    let published;
    if(req.body.type === 'publish'){
      published = 1;
    } else if( req.body.type === 'save'){
      published = 0;
    }

    const [post] = await req.db.query(`
      INSERT INTO posts (post_id, post_title, post_description, Author, content, category, date_created, likes, image, user_id, published, deleted)
      VALUES (:post_id, :post_title, :post_description, '${user.name}', :content, :category, :date_created, 0, :image, ${user.userId}, ${published}, ${0})`, 
      {
        post_id: req.body.post_id,
        post_title: req.body.post_title,
        post_description: req.body.post_description,
        content: req.body.content,
        category: req.body.category,
        date_created: req.body.date_created,
        image: file === undefined ? '' : imageURL,
      }
    );
    res.json({Success: true})

  } catch (error) {
    console.log('error', error);
    res.json({Success: false})
  };
});

router.put('/', upload.single('image'), async function (req, res) {
  const [scheme, token] = req.headers.authorization.split(' ');
  const user = jwt.verify(token, process.env.JWT_KEY)
  const file = req.file;
  const imageURL = `http://localhost:3000/public/uploads/${file?.filename}`;
  console.log('post updated: ',req.body);

  try {
    let published;
    if(req.body.type === 'publish'){
      published = 1;
    } else if( req.body.type === 'save'){
      published = 0;
    }
    const [postCheck] = await req.db.query(`
    SELECT image FROM posts
    WHERE post_id = :post_id`,
    {post_id: req.body.post_id})

    const [post] = await req.db.query(`
      UPDATE posts
      SET post_title = :post_title, post_description = :post_description, content = :content, category = :category, image = :image, date_edited = :date_edited, published = ${published}
      WHERE post_id = :post_id`, 
      {
        post_id: req.body.post_id,
        post_title: req.body.post_title,
        post_description: req.body.post_description,
        content: req.body.content,
        category: req.body.category,
        image: file === undefined ? postCheck[0].image : imageURL,
        date_edited: req.body.date_edited,
      }
    );
    res.json({Success: true})

  } catch (error) {
    console.log('error', error);
    res.json({Success: false})
  };
});

router.delete('/:id', async function (req, res) {
  const [scheme, token] = req.headers.authorization.split(' ');
  const user = jwt.verify(token, process.env.JWT_KEY)
  const post_id = req.params.id;
  console.log('deleted post: ', post_id, user.userId);
  try{
    const [task] = await req.db.query(`
      UPDATE posts
      SET deleted = 1 
      WHERE posts.post_id = '${post_id}' AND posts.user_id = ${user.userId}`,{hello: 'hello'}
    );
    res.json({Success: true })

  } catch (error){
    console.log('error', error)
    res.json({Success: false})
  }
});

module.exports = router;