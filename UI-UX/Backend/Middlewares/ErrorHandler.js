const Missing = (req, res, next) => {
  const error = new Error(`Missing - ${req.originalUrl}`)
  res.status(404)
  next(error)
}

const HandleError = (err, req, res, next) => {  
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;  
  res.status(statusCode);  
  res.json({  
    message: err.message
  });  
};  

export { Missing, HandleError }
