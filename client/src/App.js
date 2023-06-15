import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet, useNavigate } from 'react-router-dom';
import bcrypt from 'bcryptjs';
import axios from 'axios';

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const navigate = useNavigate();

  const handleSignUp = async (username, password) => {
    try {
      const checkUsername = await axios.post('http://localhost:5000/api/checkUsername', { username });
      if (checkUsername.data.message === 'Username already exists') {
        alert('Username already exists');
        return;
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const newUser = await axios.post('http://localhost:5000/api/signup', { username, password: hashedPassword });
      alert(newUser.data.message);
    } catch (error) {
      console.error(error);
      alert('Error creating user');
    }
  };

  const handleLogin = async (username, password) => {
    try {
      const user = await axios.post('http://localhost:5000/api/login', { username, password });
      if (user.data.error) {
        alert('User not found or invalid password');
        return;
      }

      setLoggedInUser(user.data);

      if (user.data.isAdmin) {
        // Navigate to admin portal
        navigate('/admin');
      } else {
        // Navigate to user portal with username as route parameter
        navigate(`/user/${username}`);
      }
    } catch (error) {
      console.error(error);
      alert('Error logging in');
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    navigate('/');
  };

  return (
    <div>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          {loggedInUser ? (
            <>
              {loggedInUser.isAdmin ? (
                <li>
                  <Link to="/admin">Admin Portal</Link>
                </li>
              ) : (
                <li>
                  <Link to={`/user/${loggedInUser.username}`}>User Portal</Link>
                </li>
              )}
            </>
          ) : (
            <>
              <li>
                <Link to="/login">Login</Link>
              </li>
              <li>
                <Link to="/signup">Sign Up</Link>
              </li>
            </>
          )}
        </ul>
        {loggedInUser && (
          <button onClick={handleLogout}>Logout</button>
        )}
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/*" element={<AdminPortal loggedInUser={loggedInUser} />} />
        <Route path="/user/:username" element={<UserPortal loggedInUser={loggedInUser} />} />
        <Route path="/user/:username/upload-certificate" element={<UploadCertificate loggedInUser={loggedInUser} />} />
        <Route path="/user/:username/view-certificate" element={<ViewCertificate />} />
        <Route path="/login" element={<LoginForm handleLogin={handleLogin} />} />
        <Route path="/signup" element={<SignUpForm handleSignUp={handleSignUp} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

function Home() {
  return (
    <div>
      <h1>Home</h1>
      <p>Welcome to the home page!</p>
    </div>
  );
}

function AdminPortal({ loggedInUser }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!loggedInUser || !loggedInUser.isAdmin) {
      navigate('/');
    }
  }, [loggedInUser, navigate]);

  return (
    <div>
      <h1>Admin Portal</h1>
      {loggedInUser && (
        <p>Welcome, {loggedInUser.username}!</p>
      )}
    </div>
  );
}

function UserPortal({ loggedInUser }) {
  const navigate = useNavigate();
  const username = loggedInUser ? loggedInUser.username : '';

  useEffect(() => {
    if (!loggedInUser || loggedInUser.isAdmin) {
      navigate('/');
    }
  }, [loggedInUser, navigate]);

  return (
    <div>
      <h1>User Portal</h1>
      <h2>{`User Portal - ${username}`}</h2>
      <p>Welcome, {username}!</p>
      <Link to={`/user/${username}/upload-certificate`}>Upload Certificate</Link>
      <br />
      <Link to={`/user/${username}/view-certificate`}>View Certificate</Link>
      <Outlet />
    </div>
  );
}

function UploadCertificate({loggedInUser}) {
  const [image, setImage] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    setImage(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!loggedInUser) {
      alert('User not logged in');
      return;
    }

    if (!image) {
      alert('Please select an image');
      return;
    }

    const formData = new FormData();
    formData.append('image', image);
    formData.append('username', loggedInUser.username);

    try {
      await axios.post('http://localhost:5000/api/uploadImage', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Image uploaded successfully');
    } catch (error) {
      console.error(error);
      alert('Error uploading image');
    }
  };

  return (
    <div>
      <h3>Upload Certificate</h3>
      <form onSubmit={handleSubmit}>
        <input type="file" accept="image/jpeg" onChange={handleImageUpload} />
        <br />
        <button type="submit">Upload</button>
      </form>
    </div>
  );
}

function ViewCertificate() {
  // Logic for viewing certificate
  return (
    <div>
      <h3>View Certificate</h3>
      {/* Your view certificate logic or component */}
    </div>
  );
}

function LoginForm({ handleLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin(username, password);
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <br />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <br />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

function SignUpForm({ handleSignUp }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSignUp(username, password);
  };

  return (
    <div>
      <h1>Sign Up</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <br />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <br />
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
}

function NotFound() {
  return (
    <div>
      <h1>404 Not Found</h1>
      <p>Oops! The page you're looking for does not exist.</p>
    </div>
  );
}

export default App;