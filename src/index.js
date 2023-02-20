import React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import './index.css';
import App from './App';
import { Home } from './components/Home';
// import reportWebVitals from './reportWebVitals';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import PoemQuery from './components/PoemQuery';
import PoemPage from './components/PoemPage';
import AllusionTable from './components/AllusionTable';
import Search from './components/Search';
import PoemTable from './components/PoemTable';
import EditPage from './components/EditPage';
import { About } from './components/About';
import { Acknowledgements } from './components/Acknowledgements';
import Characters from './components/Characters';

let password = prompt("Please enter the password for visiting this site", "Password");
let auth = false
if (password === process.env.REACT_APP_PASSWORD) {
  auth = true
}
if (auth) {
  const container = document.getElementById('root');

  // Create a root.
  const root = ReactDOMClient.createRoot(container);

  const router = createBrowserRouter([
    {
      path: "/",
      element: <App />, 
      children: [
        {
          index: true,
          element: <Home />
        }, 
        {
          path: "/poems",
          element: <PoemQuery />, 
          children: [
            {
              path: ":chapter/:number",
              element: <PoemPage />
            }
          ]
        }, 
        {
          path: "/characters",
          element: <Characters />
        },
        {
          path: "/allusions",
          element: <AllusionTable />
        }, 
        {
          path: "/search",
          element: <Search />, 
          children: [
            {
              path: ":chapter/:spkrGen/:speaker/:addrGen/:addressee/:auth/:username/:password",
              element: <PoemTable />
            }
          ]
        }, 
        {
          path: "/edit",
          element: <EditPage />,
        }, 
        {
          path: "/about", 
          element: <About />
        }, 
        {
          path: "/acknowledgements",
          element: <Acknowledgements />
        }
      ]
    }
  ])

  root.render(
    // <BrowserRouter>
    //     <App />
    // </BrowserRouter>
    <RouterProvider router={router} />
  );

  // If you want to start measuring performance in your app, pass a function
  // to log results (for example: reportWebVitals(console.log))
  // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//   reportWebVitals();
}