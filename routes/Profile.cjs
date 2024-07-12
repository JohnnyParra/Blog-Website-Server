const jwt = require('jsonwebtoken');
const express = require("express");
const { put, del } = require("@vercel/blob")
const multer = require('multer');
const bcrypt = require('bcrypt');
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

router.put('/', upload.single('avatar'), async function (req, res) {
  const [scheme, token] = req.headers.authorization.split(' ');
  const user = jwt.verify(token, process.env.JWT_KEY)
  const file = req.file;
  const userId = user.userId;
  const timeStamp = new Date().getTime();
  const imagePath = `ProjectB/avatars/${userId}/`;
  let imageUrl;

  try {
    const [[dbUser]] = await req.db.query(`SELECT * FROM users WHERE id = :id`, { id: user.userId });
    const dbPassword = `${dbUser.password}`
    const compare = await bcrypt.compare(req.body.password, dbPassword);
    
    if(compare){
      let imageMetaData = {};

      if(file) {
        try {
          const [image] = await req.db.query(`
          SELECT avatar FROM users
          WHERE id = ${user.userId}
          `)
          if (image[0].avatar) {
            const listResult = await list ({
              prefix: imagePath
            })
            
            if (listResult.blobs.length > 0) {
              await del(listResult.blobs.map((blob) => blob.url));
            }
          }
        } catch (err) {
          console.log("delete image error: ", err);
        } finally {
          console.log("Image deleted")
        }

        const originalAvatar = file.buffer;
        const smallAvatar = await sharp(originalPath)
          .resize(80, 80, {
            fit: 'outside',
          }).toBuffer();

        const originalBlobName = `${imagePath}${timeStamp}-${file.originalname}`;
        const smallBlobName = appendToFilename(`${imagePath}${timeStamp}-${file.originalname}`, '-small');

        const [originalBlob, smallBlob] = await Promise.all([
          put(originalBlobName, originalAvatar, {access: 'public'}),
          put(smallBlobName, smallAvatar, {access: 'public'}),
        ])

        const originalBlobSize = Buffer.byteLength(originalImage) / 1024;
        imageMetaData = {
          original: originalBlob.url,
          small: smallBlob.url,
          contentType: originalBlob.contentType,
          pathname: originalBlob.pathname,
          originalSizeKB: originalBlobSize.toFixed(2),
        }
        imageUrl = originalBlob.url;
      }

      const [avatar] = await req.db.query(`
      UPDATE users
      SET avatar = :avatar, avatar_metadata = avatar_metadata, email = :email, name = :name
      WHERE id = ${user.userId}`, 
      {
        name: req.body.name,
        email: req.body.email,
        avatar: file === undefined ? dbUser.avatar : imageUrl,
        avatar_metadata: file === undefined ? dbUser.avatar_metadata : JSON.stringify(imageMetaData)
      });
    res.json({Success: true })
    } else{
      res.json(false);
    }
  } catch (error) {
    console.log('error', error);
    res.json({Success: false})
  };
});

router.get('/avatar', async function (req, res) {
  const [scheme, token] = req.headers.authorization.split(' ');
  const user = jwt.verify(token, process.env.JWT_KEY)

  try {
    const [image] = await req.db.query(`
      SELECT avatar, avatar_metadata FROM users
      WHERE id = ${user.userId}
    `)

    res.json({image});
  } catch (error) {
    console.log('error', error);
    res.json({Success: false})
  };
});

module.exports = router;