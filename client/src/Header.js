import { useContext, useEffect, useState } from 'react';
import './Header.css'
import {Link, useNavigate} from 'react-router-dom'
import { UserContext } from './UserContext';

function Header(){
    const {setUserInfo,userInfo}=useContext(UserContext);
    const navigate = useNavigate();
    useEffect( ()=>{
       fetch('http://localhost:4000/profile',{
            credentials:'include',
        }).then(response=>{
            response.json().then(userInfo=>{
                setUserInfo(userInfo);
            });
        });
    },[]);


    function logOut(){
        fetch('http://localhost:4000/logout',{
            credentials:'include',
            method:'POST',
        });
        setUserInfo(null);
        navigate('/login');
    }

const username=userInfo?.username;

    return( <header>
              <Link to='/' className='logo'>MyBlog</Link>
              <nav>
                {username&&(<>
                <span>Hello, {username}</span>
                <Link to='/create'>Create new post</Link>
                <a onClick={logOut}>Logout</a>
                </>)}
                {
                    !username&&(
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/register">Register</Link>
                    </>)
                }
                
              </nav>
          </header>)
}
export default Header;