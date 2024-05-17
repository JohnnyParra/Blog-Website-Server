const jwt = require('jsonwebtoken');
const express = require("express");
const { put } = require("@vercel/blob")
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcrypt');
const router = express.Router();
const storage = multer.memoryStorage();

// const storage = multer.diskStorage({
//   destination: './public/avatars',
//   filename: (req, file, cb) => {
//     cb(null, `${new Date().getTime()}-${file.originalname}`);
//   }
// })

const upload = multer({
  storage: storage,
});

router.put('/', upload.single('avatar'), async function (req, res) { // here
  const [scheme, token] = req.headers.authorization.split(' ');
  const user = jwt.verify(token, process.env.JWT_KEY)
  const file = req.file;
  let imageURL;
  // const imageURL = `http://localhost:3000/public/avatars/${file?.filename}`;
  console.log('post updated: ',req.body);

  try {
    const [[dbUser]] = await req.db.query(`SELECT * FROM users WHERE id = :id`, { id: user.userId });
    const dbPassword = `${dbUser.password}`
    const compare = await bcrypt.compare(req.body.password, dbPassword);

    if(compare){
      // const [image] = await req.db.query(` deleting image
      //   SELECT avatar FROM users
      //   WHERE id = ${user.userId}
      // `)

      // if (image[0].avatar) {
      //   fs.unlink(image[0].avatar.split("/").splice(3, 6).join("/"), err => {
      //     if (err) {
      //       console.log("delete image error: ", err);
      //     } else {
      //       console.log("Image deleted")
      //     }
      //   })
      // }
      if(file) {
        const blobName = `${new Date().getTime()}-${file.originalname}`
        const blob = await put(blobName, file.buffer, {
          access: 'public'
        })
        imageURL = blob.url;
      }

      const [avatar] = await req.db.query(`
      UPDATE users
      SET avatar = :avatar, email = :email, name = :name
      WHERE id = ${user.userId}`, 
      {
        name: req.body.name,
        email: req.body.email,
        avatar: file === undefined ? dbUser.avatar : imageURL
      });
    res.json({Success: true, blob: imageURL})
    } else{
      res.json(false);
    }
  } catch (error) {
    console.log('error', error);
    res.json({Success: false})
  };
});

module.exports = router;