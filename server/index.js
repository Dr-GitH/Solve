const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});


const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

mongoose
  .connect('mongodb+srv://username:certificate@cluster0.ctqdit2.mongodb.net/test?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

  const userSchema = new mongoose.Schema({
    username: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isUser: {
      type: Boolean,
      default: true,
    },
    image: {
      type: String,
      default: null,
    },
  });
  

const User = mongoose.model('User', userSchema);

app.post('/api/checkUsername', async (req, res) => {
  const { username } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      res.json({ message: 'Username already exists' });
    } else {
      res.json({ message: 'Username available' });
    }
  } catch (error) {
    console.error('Error checking username:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;

  try {
    const newUser = new User({
      username,
      password,
    });

    await newUser.save();
    res.json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      res.json({ error: 'User not found' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.json({ error: 'Invalid password' });
      return;
    }

    res.json({ username: user.username, isAdmin: user.isAdmin });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.get('/api/user/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      res.json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Error retrieving user:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.post('/api/uploadImage', upload.single('image'), async (req, res) => {
  const { username } = req.body;
  const image = req.file;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      res.json({ error: 'User not found' });
      return;
    }

    if (!image) {
      res.json({ error: 'No image uploaded' });
      return;
    }

    // Convert image to base64
    const base64Image = image.buffer.toString('base64');

    // Save base64 image to user document
    user.image = base64Image;
    await user.save();

    res.json({ message: 'Image uploaded successfully' });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

const port = 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});