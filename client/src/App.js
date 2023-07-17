import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet, useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import './App.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import $ from 'jquery';
import HomePage from './scenes/homePage';
import ribbon from './assets/ribbon.png';

function App() {

  const [loggedInUser, setLoggedInUser] = useState(
    JSON.parse(localStorage.getItem('loggedInUser')) || null
  );

  const navigate = useNavigate();


  const handleSignUp = async (username, password) => {
    try {
      const checkUsername = await axios.post('http://localhost:3080/api/checkUsername', { username });
      if (checkUsername.data.message === 'Username already exists') {
        toast.error('Username already exists', {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
          });
        return;
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const newUser = await axios.post('http://localhost:3080/api/signup', { username, password: hashedPassword });
      alert(newUser.data.message);
    } catch (error) {
      console.error(error);
      toast.error('Error creating user', {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        });
    }
  };

  const handleLogin = async (username, password, onSuccess, onFailure) => {
    try {
      const user = await axios.post('http://localhost:3080/api/login', { username, password });
      if (user.data.error) {
        onFailure();
        toast.error('User not found or invalid password.', {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
          });
        return;
      }

      localStorage.setItem('loggedInUser', JSON.stringify(user.data));

      setLoggedInUser(user.data);
      onSuccess();
      if (user.data.isAdmin) {
        
        navigate('/admin');
      } else {
        
        navigate(`/user/${username}`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Error logging in', {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        });
    }
  };

  const handleLogout = () => {

    localStorage.removeItem('loggedInUser');

    setLoggedInUser(null);
    navigate('/');
    window.location.reload();
  };

  return (
    <div>
      <ToastContainer/>
      <nav>
        <ul>
          <li>
            <Link to="/">APMS</Link>
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
          ) : null}
        </ul>
        {loggedInUser && (
          <button onClick={handleLogout} className='logoutButton'>Logout</button>
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
        <Route path="/admin/user/:username" element={<UserPage navigate={navigate} loggedInUser={loggedInUser} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

function Home() {
  const [loggedInUser] = useState(
    JSON.parse(localStorage.getItem('loggedInUser')) || null
  );
  return (
    <div>
      <HomePage />
      <div className='homeButton'>
        {!loggedInUser ? (
          <>
            <Link to="/login" className='link'>Login</Link>
            <Link to="/signup" className='link'>Sign Up</Link>
          </>
        ) : null
        }
      </div>
    </div>
  );
}



function UsersPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:3080/api/users');
      const filteredUsers = response.data.users.filter((user) => !user.isAdmin);
      setUsers(filteredUsers);
      setFilteredUsers(filteredUsers);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = (e) => {
    const searchTerm = e.target.value;
    setSearchTerm(searchTerm);

    const filteredUsers = users.filter((user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filteredUsers);
  };

  return (
    <div>
      <h2>Users</h2>
      <input
        type="text"
        placeholder="Search User"
        value={searchTerm}
        onChange={handleSearch}
      />
      <ul>
        {filteredUsers.map((user) => (
          <li key={user._id}>
            <Link to={`/admin/user/${user.username}`}>{user.username}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}


function UserPage({ navigate, loggedInUser }) {
  const { username } = useParams();
  const [images, setImages] = useState([]);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await axios.get(`http://localhost:3080/api/user/${username}`);
      const { imageData } = response.data;
      setImages(imageData || []);
    } catch (error) {
      console.error(error);
    }
  };
    

  const handleBack = () => {
    navigate('/admin/users');
  };

  const handleImageClick = (imageName) => {
    window.open(`http://localhost:3080/api/image/${username}/${imageName}`);
  };

  const handleStatusChange = async (imageName, status) => {
    try {
      await axios.put(`http://localhost:3080/api/user/${username}/image/${imageName}`, { status });
      fetchImages(); // Fetch the updated images after status change
    } catch (error) {
      console.error(error);
      toast.error('Error updating status', {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        });
    }
  };

  return (
    <div>
      <h2>User: {username}</h2>
      <button onClick={handleBack}>Back</button>
      {images.length ? (
        <ul>
          {images.map((image, index) => (
            <li key={index}>
              <p>Image Name: <span className="image-link" onClick={() => handleImageClick(image.imageName)}>{image.imageName}</span></p>
              <p>Dropdown 1: {image.dropdown1}</p>
              <p>Dropdown 2: {image.dropdown2}</p>
              <p>Certificate Details:</p>
              <p>Name: {image.certificateDetails.name}</p>
              <p>Issue Date: {image.certificateDetails.issueDate}</p>
              <p>Issuer: {image.certificateDetails.issuer}</p>
              <p>Status: {image.status}</p>
              <p>Activity Points: {image.activityPoints}</p> 

              {loggedInUser && loggedInUser.isAdmin && (
                <div>
                  <label htmlFor={`status-select-${index}`}>Status:</label>
                  <select
                    id={`status-select-${index}`}
                    value={image.status}
                    onChange={(e) => handleStatusChange(image.imageName, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No images found.</p>
      )}
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
    <div className="frame">
      <div className="center">
        <div className="profile">
			    <div className="name">{username}</div>
    			<div className="job">Student</div>
			
			    <div className="actions">
				    <Link className="btn"to={`/user/${username}/upload-certificate`}>Upload</Link>
           <Link className="btn"to={`/user/${username}/view-certificate`}>View </Link>
			    </div>
		    </div>
		
		    <div className="stats">
			    <div className="box">
				    <span className="value">23</span>
				    <span className="parameter">Certificates</span>
			    </div>
			    <div className="box">
				    <span className="value">20</span>
				    <span className="parameter">Approved</span>
			    </div>
			    <div className="box">
				    <span className="value">146</span>
				    <span className="parameter">Activity Points</span>
			    </div>
		    </div>
      </div>
    </div>
  );
}



function UploadCertificate({ loggedInUser }) {
  const [image, setImage] = useState(null);
  const [activityPoints, setActivityPoints] = useState(0);

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
      [name]: value,
    }));
  
    let points = 0;
    if (name === 'dropdown2') {
      if (value === 'NCC/NSS') {
        points = 50;
      } else if (value === 'SPORTS') {
        points = 60;
      } else if (value === 'MUSIC/PERFORMING ARTS') {
        points = 70;
      }
    }
  
    setActivityPoints(points);
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
      toast.error('User not logged in', {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        });
      return;
    }
  
    if (!image) {
      toast.warn('Please select an image', {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        });
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
    formData.append('activityPoints', activityPoints); // Add activityPoints to form data
  
    try {

      await axios.post('http://localhost:3080/api/uploadImage', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Image uploaded successfully', {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        });
      setImage(null);
    } catch (error) {
      console.error(error);
      toast.error('Error uploading image', {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        });
    }
  };
  

  return (
    <div className="certcard">
      <img src={ribbon}/>
      <h2 className="cert-heading">Certificate</h2>
      <div className="CertificateForm"> 
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
        <br />
        <input type="file" accept="image/jpeg" onChange={handleImageUpload} />
        <br />
        <button type="submit">Upload</button>
      </form>
    </div>
    </div>
  )
};


function ViewCertificate({ loggedInUser }) {
  const [imageData, setImageData] = useState([]);

  useEffect(() => {
    fetchCertificate();
  }, []);

  const fetchCertificate = async () => {
    try {
      const response = await axios.get(`http://localhost:3080/api/user/${loggedInUser.username}`);
      const { imageData } = response.data;
      setImageData(imageData || []);
    } catch (error) {
      console.error(error);
    }
  };
  

  const handleImageClick = (imageName) => {
    window.open(`http://localhost:3080/api/image/${loggedInUser.username}/${imageName}`);
  };

  
  return (
    <div>
      <h2>View Certificate</h2>
      {imageData.length ? (
        <ul>
          {imageData.map((image, index) => (
            <li key={index}>
              <p>Image Name: <span className="image-link" onClick={() => handleImageClick(image.imageName)}>{image.imageName}</span></p>
              <p>Dropdown 1: {image.dropdown1}</p>
              <p>Dropdown 2: {image.dropdown2}</p>
              <p>Certificate Details:</p>
              <p>Name: {image.certificateDetails.name}</p>
              <p>Issue Date: {image.certificateDetails.issueDate}</p>
              <p>Issuer: {image.certificateDetails.issuer}</p>
              <p>Status: {image.status}</p>
              {image.status === 'accepted' && (
              <p>Activity Points: {image.activityPoints}</p> 
            )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No images found.</p>
      )}
    </div>
  );
}


function LoginForm({ handleLogin }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin(username, password,handleLoginSuccess,handleLoginFailure);
  };

  const handleLoginSuccess = () => {
    setFailedAttempts(0);
  };

  const handleLoginFailure = () => {
    setFailedAttempts((prevAttempts) => prevAttempts + 1);

    if (failedAttempts + 1 >= 3) {
      toast.error('Maximum login attempts exceeded. Please try again later.', {
        position: "top-right",
        autoClose: false,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        });
      navigate('/');
    }
  };

  return (
    <div className="card" >
      {/* <div className="LoginHead">
        <h1>Login</h1> </div> */}
      <h2 className="card-heading">LOGIN</h2>
      <form className="LoginPage" onSubmit={handleSubmit}>
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
    if (password.length < 8) {
      toast.warn('Password must be at least 8 characters long.', {
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        });
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
      toast.warn('Password must contain at least one uppercase letter and one lowercase letter.', {
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        });
      return;
    }
    if(!/(?=.*\d)/.test(password)){
      toast.warn('Password must contain a digit.', {
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        });
      return;
    }
    handleSignUp(username, password);
  };

  return (
    <div className="card">
      {/* <div className="LoginHead">
      <h1>Sign Up</h1></div> */}
      <h2 className="card-heading">SIGN UP</h2>
      <form className="LoginPage" onSubmit={handleSubmit}>
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <br />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <br />
        <button type="submit">Sign Up</button>
      </form>
      <div className='conditions'>Password must contain 8 characters, at least one upper-case letter, one lower-case letter, and one digit.</div>
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