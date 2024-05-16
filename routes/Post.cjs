const jwt = require('jsonwebtoken');
const express = require("express");
const router = express.Router();

router.get('/:id', async (req, res) => {
  const post_id = req.params.id;

  try {
    const [post] = await req.db.query(`
      SELECT * FROM posts
      WHERE id = '${post_id}'`
    );
    res.json({ post });
  } catch (err) {
    console.log(err);
    res.json({ err });
  }
});

router.post('/', async function (req, res) { //here
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
      INSERT INTO posts (id, user_id, title, description, author, content, category, image, is_published, date_published, date_deleted)
      VALUES (:id, ${user.userId}, :title, :description, '${user.name}', :content, :category, :image, ${published}, IF(${published} = 1, UTC_TIMESTAMP(), NULL), NULL)`, 
      {
        id: req.body.id,
        title: req.body.title,
        description: req.body.description,
        content: req.body.content,
        category: req.body.category,
        image: file === undefined ? '' : imageURL,
      }
    );
    res.json({Success: true})

  } catch (error) {
    console.log('error', error);
    res.json({Success: false})
  };
});

router.put('/', async function (req, res) { //here
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
    // const [postCheck] = await req.db.query(` // deleting images
    // SELECT image FROM posts
    // WHERE id = :id`,
    // {id: req.body.id})

    // if (postCheck[0].image) {
    //   fs.unlink(postCheck[0].image.split("/").splice(3, 6).join("/"), err => {
    //     if (err) {
    //       console.log("delete image error: ", err);
    //     } else {
    //       console.log("Image deleted")
    //     }
    //   })
    // }

    const [post] = await req.db.query(`
      UPDATE posts
      SET title = :title, 
        description = :description, 
        content = :content, 
        category = :category, 
        image = :image, 
        date_published = IF((${published} = 1 AND date_published is NULL), UTC_TIMESTAMP(), date_published),
        date_edited = IF((${published} = 1 AND date_published is not NULL), UTC_TIMESTAMP(), date_edited), 
        is_published = ${published}
      WHERE id = :id`, 
      {
        id: req.body.id,
        title: req.body.title,
        description: req.body.description,
        content: req.body.content,
        category: req.body.category,
        image: file === undefined ? postCheck[0].image : imageURL,
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
      SET date_deleted = UTC_TIMESTAMP()  
      WHERE posts.id = '${post_id}' AND posts.user_id = ${user.userId}`,{hello: 'hello'}
    );
    res.json({Success: true })

  } catch (error){
    console.log('error', error)
    res.json({Success: false})
  }
});

module.exports = router;