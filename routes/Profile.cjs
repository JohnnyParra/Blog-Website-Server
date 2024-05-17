const jwt = require('jsonwebtoken');
const express = require("express");
const { put, del } = require("@vercel/blob")
const multer = require('multer');
const bcrypt = require('bcrypt');
const router = express.Router();
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
});

router.put('/', upload.single('avatar'), async function (req, res) {
  const [scheme, token] = req.headers.authorization.split(' ');
  const user = jwt.verify(token, process.env.JWT_KEY)
  const file = req.file;
  let imageURL;
  console.log('post updated: ',req.body);

  try {
    const [[dbUser]] = await req.db.query(`SELECT * FROM users WHERE id = :id`, { id: user.userId });
    const dbPassword = `${dbUser.password}`
    const compare = await bcrypt.compare(req.body.password, dbPassword);

    if(compare){

      if(file) {
        try {
          const [image] = await req.db.query(`
          SELECT avatar FROM users
          WHERE id = ${user.userId}
          `)
          if (image[0].avatar) {
            await del(image[0].avatar)
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
      }

      const [avatar] = await req.db.query(`
      UPDATE users
      SET avatar = :avatar, avatar_metadata = avatar_metadata, email = :email, name = :name
      WHERE id = ${user.userId}`, 
      {
        name: req.body.name,
        email: req.body.email,
        avatar: file === undefined ? dbUser.avatar : imageURL.url,
        avatar_metadata: file === undefined ? dbUser.avatar_metadata : imageURL
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

module.exports = router;