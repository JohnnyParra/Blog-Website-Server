const jwt = require('jsonwebtoken');
const express = require("express");
const { put, list, del } = require("@vercel/blob")
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
  try {
    const post_id = req.params.id;

    const [post] = await req.db.query(`
      SELECT * FROM posts
      WHERE id = '${post_id}'`
    );

    res.status(200).json({ post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/', upload.single('image'), async function (req, res) {
  try {
    const [scheme, token] = req.headers.authorization.split(' ');
    const user = jwt.verify(token, process.env.JWT_KEY);

    const file = req.file;
    const postId = req.body.id;
    const timeStamp = new Date().getTime();
    const imagePath = `ProjectB/posts/${postId}/`;

    let imageUrl;
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

      imageUrl = originalBlob.url;
    }

    await req.db.query(`
      INSERT INTO posts (id, user_id, title, description, author, content, category, image, image_metadata, is_published, date_published, date_deleted)
      VALUES (:id, ${user.userId}, :title, :description, '${user.name}', :content, :category, :image, :image_metadata, ${published}, IF(${published} = 1, UTC_TIMESTAMP(), NULL), NULL)`, 
      {
        id: req.body.id,
        title: req.body.title,
        description: req.body.description,
        content: req.body.content,
        category: req.body.category,
        image: file === undefined ? null : imageUrl,
        image_metadata: file === undefined ? null : JSON.stringify(imageMetaData)
      }
    );

    res.status(201).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  };
});

router.put('/', upload.single('image'), async function (req, res) {
  try {
    const [scheme, token] = req.headers.authorization.split(' ');
    const user = jwt.verify(token, process.env.JWT_KEY);

    const file = req.file;
    const postId = req.body.id;
    const timeStamp = new Date().getTime();
    const imagePath = `ProjectB/posts/${postId}/`;

    let imageUrl;
    let published = req.body.type === 'publish' ? 1 : 0;

    try {
      const [postCheck] = await req.db.query(`
      SELECT image, image_metadata FROM posts
      WHERE id = :id`,
      {id: req.body.id})
      if (postCheck[0].image) {
        const listResult = await list ({
          prefix: imagePath
        })
        
        if (listResult.blobs.length > 0) {
          await del(listResult.blobs.map((blob) => blob.url));
        }
      }
      
    } catch (err) {
      console.error("delete image error: ", err);
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
      imageUrl = originalBlob.url;
    }

    await req.db.query(`
      UPDATE posts
      SET title = :title, 
        description = :description, 
        content = :content, 
        category = :category, 
        image = :image,
        image_metadata = :image_metadata, 
        date_published = IF((${published} = 1 AND date_published is NULL), UTC_TIMESTAMP(), date_published),
        date_edited = IF((${published} = 1 AND date_published is not NULL), UTC_TIMESTAMP(), date_edited), 
        is_published = ${published},
        date_deleted = NULL
      WHERE id = :id
        AND user_id = ${user.userId}`, 
      {
        id: req.body.id,
        title: req.body.title,
        description: req.body.description,
        content: req.body.content,
        category: req.body.category,
        image: file === undefined ? postCheck[0].image : imageUrl,
        image_metadata: file === undefined ? JSON.stringify(postCheck[0].image_metadata) : JSON.stringify(imageMetaData)
      }
    );

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  };
});

router.delete('/:id', async function (req, res) {
  try{
    const [scheme, token] = req.headers.authorization.split(' ');
    const user = jwt.verify(token, process.env.JWT_KEY);

    const post_id = req.params.id;

    await req.db.query(`
      UPDATE posts
      SET date_deleted = UTC_TIMESTAMP()  
      WHERE posts.id = '${post_id}' AND posts.user_id = ${user.userId}`,{hello: 'hello'}
    );

    res.status(204).send();
  } catch (err){
    console.error(err)
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;