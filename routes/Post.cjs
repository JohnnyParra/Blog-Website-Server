const jwt = require('jsonwebtoken');
const express = require("express");
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const sharp = require('sharp');


function ensureDirectoryExistence(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDirectoryExistence('./public/uploads/temp');
    cb(null, './public/uploads/temp');
  },
  filename: (req, file, cb) => {
    cb(null, `${new Date().getTime()}-${file.originalname}`);
  }
})


const upload = multer({
  storage: storage,
});


function appendToFilename(filename, string) {
  let dotIndex = filename.lastIndexOf(".");
  return filename.substring(0, dotIndex) + string + filename.substring(dotIndex);
}



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
  const user = jwt.verify(token, process.env.JWT_KEY);
  const file = req.file;
  let imageURL = `http://localhost:3000/`;
  const tempPath = `./public/uploads/temp/${file?.filename}`;

  try {
    let published = req.body.type === 'publish' ? 1 : 0;
    let imageMetaData;

    if (file) {
      const postId = req.body.id;
      const postDir = `./public/uploads/${postId}`;
      ensureDirectoryExistence(postDir);

      const originalPath = path.join(postDir, file.filename);
      fs.renameSync(tempPath, originalPath);

      const postCardFilename = appendToFilename(file.filename, '-post-card');
      const postCardPath = path.join(postDir, postCardFilename);
      await sharp(originalPath)
        .resize(260, 260, {
          fit: 'outside',
        })
        .toFile(postCardPath);
      
      const featuredFilename = appendToFilename(file.filename, '-featured');
      const featuredPath = path.join(postDir, featuredFilename)
      await sharp(originalPath)
        .resize(1200, 1200, {
          fit: 'cover',
          position: 'left top'
        })
        .toFile(featuredPath);

      let originalUrl = imageURL + originalPath.replace(/^\/|\\/g, '/');
      let postCardUrl = imageURL + postCardPath.replace(/^\/|\\/g, '/');
      let featuredUrl = imageURL + featuredPath.replace(/^\/|\\/g, '/');

      imageMetaData = {
        original: originalUrl,
        postCard: postCardUrl,
        featured: featuredUrl,
        pathname: file.pathname,
        contentType: file.contentType,
        originalSizeKB: (file.size / 1024).toFixed(2),
      }
      imageURL = originalUrl;
    }

    const [post] = await req.db.query(`
      INSERT INTO posts (id, user_id, title, description, author, content, category, image, image_metadata, is_published, date_published, date_deleted)
      VALUES (:id, ${user.userId}, :title, :description, '${user.name}', :content, :category, :image, :image_metadata, ${published}, IF(${published} = 1, UTC_TIMESTAMP(), NULL), NULL)`, 
      {
        id: req.body.id,
        title: req.body.title,
        description: req.body.description,
        content: req.body.content,
        category: req.body.category,
        image: file === undefined ? '' : imageURL,
        image_metadata: file === undefined ? NULL : JSON.stringify(imageMetaData),
      }
    );
    res.json({Success: true})

  } catch (error) {
    console.log('error', error);
    res.json({Success: false})
  };
});




router.put('/', upload.single('image'), async function (req, res) { //300x225 1200x350
  const [scheme, token] = req.headers.authorization.split(' ');
  const user = jwt.verify(token, process.env.JWT_KEY)
  const file = req.file;
  let imageURL = 'http://localhost:3000/';
  const tempPath = `./public/uploads/temp/${file?.filename}`;

  try {
    let published = req.body.type === 'publish' ? 1 : 0;
    let imageMetaData;

    const [postCheck] = await req.db.query(`
    SELECT image FROM posts
    WHERE id = :id`,
    {id: req.body.id})

    if (postCheck[0].image) {
      fs.rmSync(`./public/uploads/${req.body.id}`, {recursive: true, force: true}, err => {
        if (err) {
          console.log("delete image error: ", err);
        } else {
          console.log("Image deleted")
        }
      })
    }

    if (file) {
      const postId = req.body.id;
      const postDir = `./public/uploads/${postId}`;
      ensureDirectoryExistence(postDir);

      const originalPath = path.join(postDir, file.filename);
      fs.renameSync(tempPath, originalPath);

      const postCardFilename = appendToFilename(file.filename, '-post-card');
      const postCardPath = path.join(postDir, postCardFilename);
      await sharp(originalPath)
        .resize(260, 260, {
          fit: 'outside',
        })
        .toFile(postCardPath);
      
      const featuredFilename = appendToFilename(file.filename, '-featured');
      const featuredPath = path.join(postDir, featuredFilename)
      await sharp(originalPath)
        .resize(1200, 1200, {
          fit: 'cover',
          position: 'left top'
        })
        .toFile(featuredPath);

      let originalUrl = imageURL + originalPath.replace(/^\/|\\/g, '/');
      let postCardUrl = imageURL + postCardPath.replace(/^\/|\\/g, '/');
      let featuredUrl = imageURL + featuredPath.replace(/^\/|\\/g, '/');

      imageMetaData = {
        original: originalUrl,
        postCard: postCardUrl,
        featured: featuredUrl,
        pathname: file.pathname,
        contentType: file.contentType,
        originalSizeKB: (file.size / 1024).toFixed(2),
      }
      imageURL = originalUrl;
    }

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
      WHERE id = :id
        AND user_id = ${user.userId}`, 
      {
        id: req.body.id,
        title: req.body.title,
        description: req.body.description,
        content: req.body.content,
        category: req.body.category,
        image: file === undefined ? postCheck[0].image : imageURL,
        image_metadata: file === undefined ? NULL : JSON.stringify(imageMetaData),
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