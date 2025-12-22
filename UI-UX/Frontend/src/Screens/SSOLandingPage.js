import React, { useEffect, useState, useContext } from 'react';  
import { useNavigate, useSearchParams } from 'react-router-dom';  
import axios from 'axios';  
import { AuthContext } from './AuthContext';  
import { Card } from 'react-bootstrap';
import swal from 'sweetalert';  
  
const SSOLandingPage = () => {  
  const [searchParams] = useSearchParams();  
  const navigate = useNavigate();  
  const { setUserInfo } = useContext(AuthContext);  
  const [loading, setLoading] = useState(false); 
  
  useEffect(() => {  
    const fetchUserInfo = async () => {  
      const code = searchParams.get('code');  
      if (code) {  
        setLoading(true); 
        try {  
          const response = await axios.get(`/api/users/auth/callback?code=${code}`);  
          const mail = response.data;  
          try {  
            const profileResponse = await axios.post(`/api/users/ssogetprofile`, { email: mail });  
            setUserInfo(profileResponse.data);  
            navigate('/');  
          } catch (profileError) {  
            if (profileError.response && profileError.response.status === 401) { 
              navigate('/login');   
              swal({  
                title: "User not found in system",   
                icon: "error",  
              });               
            } else {  
              swal({  
                title: "Error fetching profile",   
                icon: "error",  
              });
            }  
          }  
        } catch (err) {  
          swal({  
            title: "Error during SSO authentication",   
            icon: "error",  
          }); 
        } finally {  
          setLoading(false); 
        }  
      }  
    };  
  
    fetchUserInfo();  
  }, [searchParams, navigate, setUserInfo]);  
  
 
  if (loading) {  
    return (  
      <Card className='text-center' style={{  
        width: "60rem",  
        fontSize: "30px",  
        textAlign: "justify",  
        textJustify: "inter-word",  
        padding: "25px",  
        color: "#08084e",  
        borderColor: "#a1a7ab",  
        borderWidth: "2px",  
        borderRadius: "0",  
        margin: "auto", 
        marginTop: "100px" 
      }}>  
        Please wait, you are being redirected.  
      </Card>  
    );  
  }  
  
  return null;  
};  
  
export default SSOLandingPage;  
