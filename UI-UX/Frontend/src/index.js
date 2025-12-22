import React, { useEffect, useState } from "react"
import ReactDOM from "react-dom/client"
import { Provider } from "react-redux"
import store from "./store";  
import { AuthProvider } from "./Screens/AuthContext";  
import "./bootstrap.min.css"
import "./index.css"
import App from "./App"

const rootElement = document.getElementById("root");  
const root = ReactDOM.createRoot(rootElement);  
  
root.render(  
  <React.StrictMode>  
    <Provider store={store}>  
      <AuthProvider>  
        <App />  
      </AuthProvider>  
    </Provider>  
  </React.StrictMode>  
);  