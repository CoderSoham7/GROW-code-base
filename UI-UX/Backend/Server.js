import express from "express";
import path from "path";
import dotenv from "dotenv";
import ConnectDB from "./DbConfig/ConnectDB.js";
import UserRoutes from "./Routes/UserRoutes.js";
import UploadRoutes from "./Routes/UploadRoutes.js";
import FunctionRoutes from "./Routes/FunctionRoutes.js"
import CodingRoutes from "./Routes/CodingRoutes.js";
import { Missing, HandleError } from "./Middlewares/ErrorHandler.js";
import ExpressMongoSanitize from "express-mongo-sanitize"; 
import helmet from 'helmet';
import cors from "cors";
import cookieParser from 'cookie-parser';  

dotenv.config();
ConnectDB();

const app = express();  
app.disable('x-powered-by')  
app.use(express.json());   
app.use(ExpressMongoSanitize());  
app.use(helmet.hsts({  
  maxAge: 31536000,  
  includeSubDomains: true, 
  preload: true  
}));  

const allowedOrigins = process.env.CORS_ORIGINS.split(';');  
  
const isAllowedOrigin = (origin) => {   
  return allowedOrigins.some(domain => {  
    const domainPattern = new RegExp('([a-z0-9]+[.])*' + domain.replace('.', '[.]') + '$', 'i');  
    return domainPattern.test(origin);  
  });  
};  
  
app.use(cors({  
  origin: function(origin, callback){  
    if (!origin) return callback(null, true); 
    if (isAllowedOrigin(origin)) {  
      return callback(null, true);  
    } else {  
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';  
      return callback(new Error(msg), false);  
    }  
  },  
  credentials: true  
}));  

app.use(function(req, res, next) {  
  const csp = allowedOrigins.join(' ');  
  
  res.header("Content-Security-Policy", "default-src 'self'; " +  
    "script-src 'self' " + csp + "; " +  
    "style-src 'self' 'unsafe-inline' " + csp + "; " +  
    "img-src 'self' data: blob: https: http:; " +  
    "font-src 'self' data: " + csp + "; " +  
    "frame-src " + csp + "; " +  
    "connect-src 'self' " + csp + "; " + 
    "media-src 'self' data: https: http:;"  
  );  
  next();  
});  

app.use(cookieParser());  
app.use("/api/users", UserRoutes); 
app.use("/api/upload", UploadRoutes); 
app.use("/api/ext", FunctionRoutes);
app.use("/api/coding", CodingRoutes);
app.get('/test', (req, res) => {
  res.send('HTTPS is working');
  console.log('working maybe!');
});
const __dirname = path.resolve();
if (process.env.NODE_ENV === "PROD") {
  app.use(express.static(path.join(__dirname, "/Frontend/build")));  
  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "Frontend", "build", "index.html"))
  );
}
app.use(Missing);
app.use(HandleError);
app.maxHeadersCount = 10000;
const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
  console.log(`Server Running mode on PORT ${PORT}`)
});

