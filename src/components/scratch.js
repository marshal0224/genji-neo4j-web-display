// import { useState, useEffect } from 'react';

// const Dashboard = props => {
//   const classes = useStyles();
//   const [token, setToken] = useState(null);
//   useEffect(() => {
//      async function getToken() {
//          const token = await fetchKey(props.auth);
//          setToken(token);
//      }
//      getToken();
//   }, [])


//   return (
//   ... rest of the functional component's code
//   // Remember to handle the first render when token is null