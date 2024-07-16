const jwt = require('jsonwebtoken');
const express = require("express");
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const router = express.Router();
const sharp = require('sharp');

function ensureDirectoryExistence(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true }, err => {
      if (err) {
        console.error('make directory error: ', err)
      }
    });
  }
}

function appendToFilename(filename, string) {
  let dotIndex = filename.lastIndexOf(".");
  return filename.substring(0, dotIndex) + string + filename.substring(dotIndex);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDirectoryExistence('./public/avatars/temp');
    cb(null, './public/avatars/temp');
  },
  filename: (req, file, cb) => {
    cb(null, `${new Date().getTime()}-${file.originalname}`);
  }
})

const upload = multer({
  storage: storage,
});

router.put('/', upload.single('avatar'), async function (req, res) {
  try {
    const [scheme, token] = req.headers.authorization.split(' ');
    const user = jwt.verify(token, process.env.JWT_KEY)

    const file = req.file;
    let imageURL = `http://localhost:3000/`;
    const tempPath = `./public/avatars/temp/${file?.filename}`;

    const [[dbUser]] = await req.db.query(`SELECT * FROM users WHERE id = :id`, { id: user.userId });
    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const dbPassword = `${dbUser.password}`
    const compare = await bcrypt.compare(req.body.password, dbPassword);
    if (!compare) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    let avatarMetaData;
    const [image] = await req.db.query(`
      SELECT avatar, avatar_metadata FROM users
      WHERE id = ${user.userId}
    `)

    if (image[0].avatar) {
      fs.rmSync(`./public/avatars/${user.userId}`, {recursive: true, force: true}, err => {
        if (err) {
          console.error("delete image error: ", err);
        }
      })
    }

    if (file) {
      const userId = user.userId;
      const avatarDir = `./public/avatars/${userId}`;
      ensureDirectoryExistence(avatarDir);

      const originalPath = path.join(avatarDir, file.filename);
      fs.renameSync(tempPath, originalPath, err => {
        if (err) {
          console.error("rename error: ", err);
        }
      });

      const avatarFilename = appendToFilename(file.filename, '-small');
      const avatarPath = path.join(avatarDir, avatarFilename);
      await sharp(originalPath)
        .resize(80, 80, {
          fit: 'outside',
        })
        .toFile(avatarPath);

      let originalUrl = imageURL + originalPath.replace(/^\/|\\/g, '/');
      let smallUrl = imageURL + avatarPath.replace(/^\/|\\/g, '/');

      avatarMetaData = {
        original: originalUrl,
        small: smallUrl,
        pathname: file.pathname,
        contentType: file.contentType,
        originalSizeKB: (file.size / 1024).toFixed(2),
      }
      imageURL = originalUrl;
    }

    await req.db.query(`
      UPDATE users
      SET avatar = :avatar, avatar_metadata = :avatar_metadata, email = :email, name = :name
      WHERE id = ${user.userId}
    `, 
    {
      name: req.body.name,
      email: req.body.email,
      avatar: file === undefined ? dbUser.avatar : imageURL,
      avatar_metadata: file === undefined ? dbUser.avatar_metadata : JSON.stringify(avatarMetaData)
    });

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  };
});

router.get('/avatar', async function (req, res) {
  try {
    const [scheme, token] = req.headers.authorization.split(' ');
    const user = jwt.verify(token, process.env.JWT_KEY);

    const [image] = await req.db.query(`
      SELECT avatar FROM users
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