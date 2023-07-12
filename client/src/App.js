import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet, useNavigate } from 'react-router-dom';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import './App.css';

import HomePage from './scenes/homePage';

function App() {

  const [loggedInUser, setLoggedInUser] = useState(
    JSON.parse(localStorage.getItem('loggedInUser')) || null
  );

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

      localStorage.setItem('loggedInUser', JSON.stringify(user.data));

      setLoggedInUser(user.data);

      if (user.data.isAdmin) {
        
        navigate('/admin');
      } else {
        
        navigate(`/user/${username}`);
      }
    } catch (error) {
      console.error(error);
      alert('Error logging in');
    }
  };

  const handleLogout = () => {

    localStorage.removeItem('loggedInUser');

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
        <Route path="/user/:username/view-certificate" element={<ViewCertificate loggedInUser={loggedInUser} />} />
        <Route path="/login" element={<LoginForm handleLogin={handleLogin} />} />
        <Route path="/signup" element={<SignUpForm handleSignUp={handleSignUp} />} />
        <Route path="/admin/users" element={<UsersPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

function Home() {
  return (
    <div>
      <HomePage />
    </div>
  );
}


function UsersPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users');
      const filteredUsers = response.data.users.filter((user) => !user.isAdmin);
      setUsers(filteredUsers);
    } catch (error) {
      console.error(error);
    
    }
  };
  

  return (
    <div>
      <h2>Users</h2>
      <ul>
        {users.map((user) => (
          <li key={user._id}>{user.username}</li>
        ))}
      </ul>
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
      <ul>
        <li>
          <Link to="/admin/users">Users</Link>
        </li>
      </ul>
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



function UploadCertificate({ loggedInUser }) {
  const [image, setImage] = useState(null);
  const [dropdownValues, setDropdownValues] = useState({
    dropdown1: 's1',
    dropdown2: ''
  });
  const [certificateData, setCertificateData] = useState({
    name: '',
    issueDate: '',
    issuer: ''
  });

  const handleOptionChange = (event) => {
    const { name, value } = event.target;
    setDropdownValues((prevValues) => ({
      ...prevValues,
      [name]: value
    }));
  };

  const handleCertChange = (event) => {
    const { name, value } = event.target;
    setCertificateData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

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
    formData.append('dropdown1', dropdownValues.dropdown1);
    formData.append('dropdown2', dropdownValues.dropdown2);
    formData.append('name', certificateData.name);
    formData.append('issueDate', certificateData.issueDate);
    formData.append('issuer', certificateData.issuer);

    try {
      await axios.post('http://localhost:5000/api/uploadImage', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Image uploaded successfully');
      setImage(null);
    } catch (error) {
      console.error(error);
      alert('Error uploading image');
    }
  };

  return (
    <div>
      <h3>Upload Certificate</h3>
      <form onSubmit={handleSubmit}>
        <select name="dropdown1" value={dropdownValues.dropdown1} onChange={handleOptionChange}>
          <option value="s1">s1</option>
          <option value="s2">s2</option>
          <option value="s3">s3</option>
          <option value="s4">s4</option>
          <option value="s5">s5</option>
          <option value="s6">s6</option>
          <option value="s7">s7</option>
          <option value="s8">s8</option>
        </select>
        <select name="dropdown2" value={dropdownValues.dropdown2} onChange={handleOptionChange}>
          <option value="">Select an option</option>
          <option value="NCC/NSS">NCC/NSS</option>
          <option value="SPORTS">SPORTS</option>
          <option value="MUSIC/PERFORMING ARTS">MUSIC/PERFORMING ARTS</option>
        </select>
        <div>
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={certificateData.name}
            onChange={handleCertChange}
            required
          />
        </div>
        <div>
          <label htmlFor="issueDate">Date:</label>
          <input
            type="date"
            id="issueDate"
            name="issueDate"
            value={certificateData.issueDate}
            onChange={handleCertChange}
            required
          />
        </div>
        <div>
          <label htmlFor="issuer">Issuer:</label>
          <input
            type="text"
            id="issuer"
            name="issuer"
            value={certificateData.issuer}
            onChange={handleCertChange}
            required
          />
        </div>
        <br />
        <input type="file" accept="image/jpeg" onChange={handleImageUpload} />
        <br />
        <button type="submit">Upload</button>
      </form>
    </div>
  );
}


function ViewCertificate({ loggedInUser }) {
  const [imageNames, setImageNames] = useState([]);

  useEffect(() => {
    const fetchImageNames = async () => {
      try {
        if (loggedInUser) {
          const response = await axios.get(`http://localhost:5000/api/images/${loggedInUser.username}`);
          setImageNames(response.data.imageNames);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchImageNames();
  }, [loggedInUser]);

  return (
    <div>
      <h3>View Certificate</h3>
      {imageNames.map((image, index) => (
        <div key={index}>
          <a href={`http://localhost:5000/api/images/${loggedInUser?.username}/${image.name}`} target="_blank" rel="noopener noreferrer">
            {image.name}
          </a>
          <p>{image.detail}</p> 
        </div>
      ))}
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