import jwt from "jsonwebtoken";  
import dotenv from "dotenv";

dotenv.config();

const GenerateToken = (id, name) => {
  const token = jwt.sign({ id, name }, process.env.JWT_SECRET, { expiresIn: "1d" }); 
  return token; 
}  
  
export default GenerateToken;  
