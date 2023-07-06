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
  });
  

const User = mongoose.model('User', userSchema);

const imageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  imageName: {
    type: String,
    required: true,
  },
  imageData: {
    type: String,
    required: true,
  },
  selectedOption: {
    type: String,
    required: true,
  },
});

const Image = mongoose.model('Image', imageSchema);


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
  try {
    const { username, option } = req.body;
    const user = await User.findOne({ username: req.body.username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const image = new Image({
      user: user._id,
      imageName: req.file.originalname,
      imageData: req.file.buffer.toString('base64'),
      selectedOption: option,
    });

    await image.save();

    res.json({ message: 'Image uploaded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/api/images/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const images = await Image.find({ user: user._id });

    const imageNames = images.map((image) => ({
      name: image.imageName,
      detail: `Semester-${image.selectedOption}`,
    }));

    res.json({ imageNames });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/api/images/:username/:imageName', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const image = await Image.findOne({ user: user._id, imageName: req.params.imageName });

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const imageData = Buffer.from(image.imageData, 'base64');

    res.set('Content-Type', 'image/jpeg');
    res.send(imageData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const port = 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});