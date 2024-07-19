const jwt = require('jsonwebtoken');
const express = require("express");
const { put, list, del } = require("@vercel/blob")
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
  try {
    const [scheme, token] = req.headers.authorization.split(' ');
    const user = jwt.verify(token, process.env.JWT_KEY);

    const file = req.file;
    const userId = user.userId;
    const timeStamp = new Date().getTime();
    const imagePath = `ProjectB/avatars/${userId}/`;
    let imageUrl;

    const [[dbUser]] = await req.db.query(`SELECT * FROM users WHERE id = :id`, { id: user.userId });
    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const dbPassword = `${dbUser.password}`
    const compare = await bcrypt.compare(req.body.password, dbPassword);
    if (!compare) {
      return res.status(400).json({ message: 'Incorrect password' });
    }
    
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
        console.error("delete image error: ", err);
      }

      const originalAvatar = file.buffer;
      const smallAvatar = await sharp(originalAvatar)
        .resize(80, 80, {
          fit: 'outside',
        }).toBuffer();

      const originalBlobName = `${imagePath}${timeStamp}-${file.originalname}`;
      const smallBlobName = appendToFilename(`${imagePath}${timeStamp}-${file.originalname}`, '-small');

      const [originalBlob, smallBlob] = await Promise.all([
        put(originalBlobName, originalAvatar, {access: 'public'}),
        put(smallBlobName, smallAvatar, {access: 'public'}),
      ])

      const originalBlobSize = Buffer.byteLength(originalAvatar) / 1024;
      imageMetaData = {
        original: originalBlob.url,
        small: smallBlob.url,
        contentType: originalBlob.contentType,
        pathname: originalBlob.pathname,
        originalSizeKB: originalBlobSize.toFixed(2),
      }
      imageUrl = originalBlob.url;
    }

    await req.db.query(`
      UPDATE users
      SET avatar = :avatar, avatar_metadata = :avatar_metadata, email = :email, name = :name
      WHERE id = ${user.userId}
    `, 
    {
      name: req.body.name,
      email: req.body.email,
      avatar: file === undefined ? dbUser.avatar : imageUrl,
      avatar_metadata: file === undefined ? JSON.stringify(dbUser.avatar_metadata) : JSON.stringify(imageMetaData)
    });

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });  };
});

router.get('/avatar', async function (req, res) {
  try {
    const [scheme, token] = req.headers.authorization.split(' ');
    const user = jwt.verify(token, process.env.JWT_KEY);

    const [image] = await req.db.query(`
      SELECT avatar, avatar_metadata FROM users
      WHERE id = ${user.userId}
    `)
    if (!image) {
      return res.status(404).json({ message: 'Avatar not found' });
    }

    res.status(200).json({ image });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  };
});

module.exports = router;