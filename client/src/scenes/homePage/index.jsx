import './homePage.css';
import logo from '../../assets/logo.jpg'; 

const HomePage = () => {
    return (
        <div>
            <div>
            </div>
            <div className='container'>
            
                <img src={logo} alt="Logo" width="1400" height="550" /> 
                <div className="HomepageHeading">
                <h1>Welcome to Rajagiri Activity Point Management System</h1>
                <h1>Please Login or Sign Up to Continue</h1>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
