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
  username: String,
  dropdown1: String,
  dropdown2: String,
  certificateDetails: {
    name: String,
    issueDate: String,
    issuer: String
  },
  imageName: String,
  imageData: String,
  status: {
    type: String,
    default: 'pending'
  }
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

    const certificates = await Image.find({ username });
    const imageData = certificates.map((certificate) => {
      return {
        imageName: certificate.imageName,
        dropdown1: certificate.dropdown1,
        dropdown2: certificate.dropdown2,
        certificateDetails: certificate.certificateDetails,
        imageData: certificate.imageData.toString('base64'),
        status: certificate.status,
      };

    });

    res.json({ imageData });
  } catch (error) {
    console.error('Error retrieving user:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});



app.get('/api/image/:username/:imageName', async (req, res) => {
  const { username, imageName } = req.params;

  try {
    const image = await Image.findOne({ username, imageName });
    if (!image) {
      res.status(404).json({ error: 'Image not found' });
      return;
    }

    const imageData = Buffer.from(image.imageData, 'base64');

    res.writeHead(200, {
      'Content-Type': 'image/jpeg',
      'Content-Length': imageData.length,
    });
    res.end(imageData);
  } catch (error) {
    console.error('Error retrieving image:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});




app.post('/api/uploadImage', upload.single('image'), async (req, res) => {
  try {
    const { username, dropdown1, dropdown2, name, issueDate, issuer } = req.body;
    const { originalname, buffer } = req.file;

    const image = new Image({
      username,
      dropdown1,
      dropdown2,
      certificateDetails: {
        name,
        issueDate,
        issuer
      },
      imageName: originalname,
      imageData: buffer.toString('base64'),
    });

    await image.save();

    res.json({ message: 'Image uploaded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error uploading image' });
  }
});



app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false }, 'username');
    res.json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.put('/api/user/:username/image/:imageName', async (req, res) => {
  const { username, imageName } = req.params;
  const { status } = req.body;

  try {
    const image = await Image.findOneAndUpdate(
      { username, imageName },
      { $set: { status } },
      { new: true }
    );

    if (!image) {
      res.status(404).json({ error: 'Image not found' });
      return;
    }

    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});


const port = 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
