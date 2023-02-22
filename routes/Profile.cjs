const jwt = require('jsonwebtoken');
const express = require("express");
const multer = require('multer');
const router = express.Router();

const storage = multer.diskStorage({
  destination: './public/avatars',
  filename: (req, file, cb) => {
    cb(null, `${new Date()}-${file.originalname}`);
  }
})

const upload = multer({
  storage: storage,
});

router.put('/', upload.single('avatar'), async function (req, res) {
  const [scheme, token] = req.headers.authorization.split(' ');
  const user = jwt.verify(token, process.env.JWT_KEY)
  const file = req.file;
  const imageURL = `http://localhost:3000/public/avatars/${file?.filename}`;
  console.log('post updated: ',req.body);

  try {
    const [avatar] = await req.db.query(`
      UPDATE users
      SET avatar = :avatar
      WHERE id = ${user.userId}`, {avatar: imageURL});
    res.json({Success: true})

  } catch (error) {
    console.log('error', error);
    res.json({Success: false})
  };
});

module.exports = router;