//import config from 'dotenv'
//import 'neo4j-driver' as neo4j

// export default function CreateDriver() {
//     var neo4j = require('neo4j-driver')
//     //require('dotenv').config()

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

const cred = {
    uri: process.env.NEO4J_URI,
    username: process.env.NEO4J_USERNAME,
    password: process.env.NEO4J_PASSWORD
}
export function initDriver() {
    const {uri, username, password} = cred
    driver = neo4j.driver("neo4j+s://1ab121f8.databases.neo4j.io", neo4j.auth.basic(username, password))
// Verify connectivity
    // return driver.verifyConnectivity()
    // // Resolve with an instance of the driver
    // .then(() => driver)
    return driver
}
// end::initDriver[]

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
