const jwt = require('jsonwebtoken');
const express = require("express");
const { put, del } = require("@vercel/blob")
const multer = require('multer');
const router = express.Router();
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
});

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

router.post('/', upload.single('image'), async function (req, res) {
  const [scheme, token] = req.headers.authorization.split(' ');
  const user = jwt.verify(token, process.env.JWT_KEY)
  console.log("user: ", user)
  const file = req.file;
  let imageURL;
  console.log('post added: ',req.body);

  try {
    let published;
    if(req.body.type === 'publish'){
      published = 1;
    } else if( req.body.type === 'save'){
      published = 0;
    }

    const blobName = `${new Date().getTime()}-${file.originalname}`
    const blob = await put(blobName, file.buffer, {
      access: 'public'
    })
    imageURL = blob;

    const [post] = await req.db.query(`
      INSERT INTO posts (id, user_id, title, description, author, content, category, image, image_metadata, is_published, date_published, date_deleted)
      VALUES (:id, ${user.userId}, :title, :description, '${user.name}', :content, :category, :image, :image_metadata, ${published}, IF(${published} = 1, UTC_TIMESTAMP(), NULL), NULL)`, 
      {
        id: req.body.id,
        title: req.body.title,
        description: req.body.description,
        content: req.body.content,
        category: req.body.category,
        image: file === undefined ? NULL : imageURL.url,
        image_metadata: file === undefined ? NULL : imageURL
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
  let imageURL;
  console.log('post updated: ',req.body);

  try {
    let published;
    if(req.body.type === 'publish'){
      published = 1;
    } else if( req.body.type === 'save'){
      published = 0;
    }

    try {
      const [postCheck] = await req.db.query(`
      SELECT image FROM posts
      WHERE id = :id`,
      {id: req.body.id})
      if (postCheck[0].image) {
        await del(postCheck[0].image)
      }
      
    } catch (err) {
      console.log("delete image error: ", err);
    } finally {
      console.log("Image deleted")
    }

    const blobName = `${new Date().getTime()}-${file.originalname}`
    const blob = await put(blobName, file.buffer, {
      access: 'public'
    })
    imageURL = blob;

    const [post] = await req.db.query(`
      UPDATE posts
      SET title = :title, 
        description = :description, 
        content = :content, 
        category = :category, 
        image = :image,
        image_metadata = :image_metadata, 
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
        image: file === undefined ? postCheck[0].image : imageURL.url,
        image_metadata: file === undefined ? NULL : imageURL
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