//import config from 'dotenv'
//import 'neo4j-driver' as neo4j

// export default function CreateDriver() {
//     var neo4j = require('neo4j-driver')
//     //require('dotenv').config()

//     const uri = process.env.REACT_APP_NEO4J_URI
//     const user = process.env.REACT_APP_NEO4J_USERNAME
//     const password = process.env.REACT_APP_NEO4J_PASSWORD

//     const driver = neo4j.driver(uri, neo4j.auth.basic(user, password))
//     return driver
// }

// TODO: Import the neo4j-driver dependency
import neo4j from 'neo4j-driver'
/**
 * A singleton instance of the Neo4j Driver to be used across the app
 *
 * @type {neo4j.Driver}
 */
// tag::driver[]
let driver
// end::driver[]


/**
 * Initiate the Neo4j Driver
 *
 * @param {string} uri   The neo4j URI, eg. `neo4j://localhost:7687`
 * @param {string} username   The username to connect to Neo4j with, eg `neo4j`
 * @param {string} password   The password for the user
 * @returns {neo4j.Driver}
 */
// tag::initDriver[]

export function initDriver(uri, username, password) {
    driver = neo4j.driver(uri, neo4j.auth.basic(username, password))

  // Verify connectivity
    return driver.verifyConnectivity()
    // Resolve with an instance of the driver
    .then(() => driver)
}
// end::initDriver[]

/**
 * Get the instance of the Neo4j Driver created in the
 * `initDriver` function
 *
 * @param {string} uri   The neo4j URI, eg. `neo4j://localhost:7687`
 * @param {string} username   The username to connect to Neo4j with, eg `neo4j`
 * @param {string} password   The password for the user
 * @returns {neo4j.Driver}
 */
// tag::getDriver[]
export function getDriver() {
    return driver
}
// end::getDriver[]

/**
 * If the driver has been instantiated, close it and all
 * remaining open sessions
 *
 * @returns {void}
 */
// tag::closeDriver[]
export function closeDriver() {
    return driver && driver.close()
}
// end::closeDriver[]
