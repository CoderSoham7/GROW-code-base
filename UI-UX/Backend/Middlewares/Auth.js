import { User } from "../Models/UserModel.js"
import jwt from "jsonwebtoken"
import asyncHandler from "express-async-handler"
import dotenv from "dotenv"
import mongoose from "mongoose";
  
dotenv.config()

const Protect = asyncHandler(async (req, res, next) => {  
  let token;    
  if (req.cookies.token) {  
    token = req.cookies.token 
    try {  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);  
      if (!mongoose.Types.ObjectId.isValid(decoded.id)) {  
        return res.status(400).send('Error Code B107');  
      }    
      req.user = await User.findById(decoded.id).select("-password");  
      if (!req.user) {  
        req.user = await Admin.findById(decoded.id).select("-password");  
      }  
      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }
      next();   
    } catch (error) { 
      console.error("Token verification failed:", error);
      res.status(400).json({ message: "Not authorized, token failed", error: error.message });  
    }  
  } else if (!token) { 
    res.status(401).json({ message: "Did not receive token" });  
  }  
});  

const Admin = asyncHandler(async(req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next()
  } else {
    console.error("Admin check failed:", req.user);
    res.status(401).json({ message: "Error Code B118: Not an admin" });
  }
})

export { Protect, Admin }
