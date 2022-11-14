import React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from "react-router-dom";

// let password = prompt("Please enter the password for visiting this site", "Password");
// let auth = false
// if (password === process.env.REACT_APP_PASSWORD) {
//   auth = true
// }
// if (auth) {
  const container = document.getElementById('root');

  // Create a root.
  const root = ReactDOMClient.createRoot(container);

  root.render(
    <BrowserRouter>
        <App />
    </BrowserRouter>
  );

  // If you want to start measuring performance in your app, pass a function
  // to log results (for example: reportWebVitals(console.log))
  // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
  reportWebVitals();
// }