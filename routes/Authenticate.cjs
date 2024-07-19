const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const express = require("express");
const router = express.Router();

router.post('/register', async function (req, res) {
  try {
    let encodedUser;
    if(Object.values(req.body).indexOf('') > -1){
      return res.status(400).json({ message: 'Missing fields'});
    } else if(req.body.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) == null){
      return res.status(400).json({ message: 'Invalid Email' });
    }
    // Hashes the password and inserts the info into the `user` table
    await bcrypt.hash(req.body.password, 10).then(async hash => {
      try {
        const [user] = await req.db.query(`
          INSERT INTO users (name, email, password, date_created)
          VALUES (:name, :email, :password, UTC_TIMESTAMP());
        `, {
          name: req.body.name,
          email: req.body.email,
          password: hash,
        });

        const [ userInfo ] = await req.db.query(`
        SELECT * FROM users
        WHERE id = ${user.insertId}`)

        encodedUser = jwt.sign(
          { 
            userId: user.insertId,
            name: userInfo[0].name,
            email: userInfo[0].email,
            date_created: Date.UTC()
          },
          process.env.JWT_KEY
        );

      } catch (err) {
        console.error('jwt error: ',err);
        return res.status(500).json({ message: 'Database Error' });
      }
    });

    res.status(201).json({ jwt: encodedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// authenticates user when they log in
router.post('/login', async function (req, res) {
  try {
    const { email, password } = req.body;    
    const [[user]] = await req.db.query(`SELECT * FROM users WHERE email = :email AND date_deleted is NULL`, {  email });
    if (!user) {
      return res.status(400).json({ message: 'Email not found' });
    };

    const dbPassword = `${user.password}`
    const compare = await bcrypt.compare(password, dbPassword);

    if (compare) {
      const payload = {
        userId: user.id,
        name: user.name,
        email: user.email,
        date_created: user.date_created,
      }
      
      const encodedUser = jwt.sign(payload, process.env.JWT_KEY);

      res.status(200).json({ jwt: encodedUser });
    } else {
      return res.status(401).json({ message: 'Incorrect Password' });
    }
    
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;