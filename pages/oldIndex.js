import React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import App from './_app';
// import Home from './Home';
// import PoemQuery from './poems';
// import PoemPage from './poems/poems/[chapter]/[number]';
// import AllusionTable from './AllusionTable';
// import Search from './Search';
// import PoemTable from './PoemTable';
// import EditPage from './EditPage';
// import About from './about';
// import Acknowledgements from './acknowledgements';
// import Characters from './Characters';
// import AltChar from './AltCharacters';
export default function Index() {
if (typeof window !== "undefined") {
  let password = prompt("Please enter the password for visiting this site", "Password");
  let auth = false
  if (password === process.env.REACT_APP_PASSWORD) {
    auth = true
  }
  if (auth) {
    const container = document.getElementById('root');
    // Create a root.
    const root = ReactDOMClient.createRoot(container);
  
    // const router = createBrowserRouter([
    //   {
    //     path: "/",
    //     element: <App />, 
    //     children: [
    //       {
    //         index: true,
    //         element: <Home />
    //       }, 
    //       {
    //         path: "/poems",
    //         element: <PoemQuery />, 
    //         children: [
    //           {
    //             path: ":chapter/:number",
    //             element: <PoemPage />
    //           }
    //         ]
    //       }, 
    //       {
    //         path: "/characters",
    //         element: <Characters />
    //       },
    //       {
    //         path: "/alt_characters",
    //         element: <AltChar />
    //       },
    //       {
    //         path: "/allusions",
    //         element: <AllusionTable />
    //       }, 
    //       {
    //         path: "/search",
    //         element: <Search />, 
    //         children: [
    //           {
    //             path: ":chapter/:spkrGen/:speaker/:addrGen/:addressee/:auth/:username/:password",
    //             element: <PoemTable />
    //           }
    //         ]
    //       }, 
    //       {
    //         path: "/edit",
    //         element: <EditPage />,
    //       }, 
    //       {
    //         path: "/about", 
    //         element: <About />
    //       }, 
    //       {
    //         path: "/acknowledgements",
    //         element: <Acknowledgements />
    //       }
    //     ]
    //   }
    // ])
  
    root.render(
      // <BrowserRouter>
          <App />
      // </BrowserRouter>
      // <RouterProvider router={router} />
    );
  }
  // return (
  //   <p>Something</p>
  // )
  }
}