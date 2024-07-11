const jwt = require('jsonwebtoken');
const express = require("express");
const { put, del } = require("@vercel/blob")
const multer = require('multer');
const router = express.Router();
const storage = multer.memoryStorage();
const sharp = require('sharp');

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
  const user = jwt.verify(token, process.env.JWT_KEY)
  const file = req.file;
  const postId = req.body.id;
  const timeStamp = new Date().getTime();
  const imagePath = `ProjectB/posts/${postId}`;

  try {
    let published = req.body.type === 'publish' ? 1 : 0;
    let imageMetaData = {};

    if (file) {
      const originalImage = file.buffer;
      const postImage = await sharp(originalImage)
        .resize(260, 260, {
          fit: 'cover',
          position: 'left top'
        }).toBuffer();
      const featuredImage = await sharp(originalImage)
        .resize(1200, 1200, {
          fit: 'cover',
          position: 'left top'
        }).toBuffer();

      const originalBlobName = `${imagePath}${timeStamp}-${file.originalname}`;
      const postBlobName = appendToFilename(`${imagePath}${timeStamp}-${file.originalname}`, '-post-card');
      const featuredBlobName = appendToFilename(`${imagePath}${timeStamp}-${file.originalname}`, '-featured');

      const [originalBlob, postBlob, featuredBlob] = await Promise.all([
        put(originalBlobName, originalImage, {access: 'public'}),
        put(postBlobName, postImage, {access: 'public'}),
        put(featuredBlobName, featuredImage, {access: 'public'}),
      ])

      const originalBlobSize = Buffer.byteLength(originalImage) / 1024;
      imageMetaData = {
        original: originalBlob.url,
        postCard: postBlob.url,
        featured: featuredBlob.url,
        contentType: originalBlob.contentType,
        pathname: originalBlob.pathname,
        originalSizeKB: originalBlobSize.toFixed(2),
      }
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
        image: file === undefined ? NULL : originalBlob.url,
        image_metadata: file === undefined ? NULL : JSON.stringify(imageMetaData)
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
  const postId = req.body.id;
  const timeStamp = new Date().getTime();
  const imagePath = `ProjectB/posts/${postId}`;

  try {
    let published = req.body.type === 'publish' ? 1 : 0;

    try {
      const [postCheck] = await req.db.query(`
      SELECT image FROM posts
      WHERE id = :id`,
      {id: req.body.id})
      if (postCheck[0].image) {
        await del(imagePath)
      }
      
    } catch (err) {
      console.log("delete image error: ", err);
    } finally {
      console.log("Image deleted")
    }

    if (file) {
      const originalImage = file.buffer;
      const postImage = await sharp(originalImage)
        .resize(260, 260, {
          fit: 'cover',
          position: 'left top'
        }).toBuffer();
      const featuredImage = await sharp(originalImage)
        .resize(1200, 1200, {
          fit: 'cover',
          position: 'left top'
        }).toBuffer();

      const originalBlobName = `${imagePath}${timeStamp}-${file.originalname}`;
      const postBlobName = appendToFilename(`${imagePath}${timeStamp}-${file.originalname}`, '-post-card');
      const featuredBlobName = appendToFilename(`${imagePath}${timeStamp}-${file.originalname}`, '-featured');

      const [originalBlob, postBlob, featuredBlob] = await Promise.all([
        put(originalBlobName, originalImage, {access: 'public'}),
        put(postBlobName, postImage, {access: 'public'}),
        put(featuredBlobName, featuredImage, {access: 'public'}),
      ])

      const originalBlobSize = Buffer.byteLength(originalImage) / 1024;
      imageMetaData = {
        original: originalBlob.url,
        postCard: postBlob.url,
        featured: featuredBlob.url,
        contentType: originalBlob.contentType,
        pathname: originalBlob.pathname,
        originalSizeKB: originalBlobSize.toFixed(2),
      }
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
        image: file === undefined ? postCheck[0].image : originalBlob.url,
        image_metadata: file === undefined ? NULL : JSON.stringify(imageMetaData)
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