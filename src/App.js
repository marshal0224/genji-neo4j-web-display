//import logo from './logo.svg';
import './App.css';
//import { initDriver, closeDriver } from './neo4j.js'
import React, { useEffect } from 'react'
//import * as ReactDOMClient from 'react-dom/client';
import Filter from './components/filter'
import Poem from './components/poem'

export default class App extends React.Component{
  constructor() {
    super()
    this.uri = process.env.REACT_APP_NEO4J_URI
    this.user = process.env.REACT_APP_NEO4J_USERNAME
    this.password = process.env.REACT_APP_NEO4J_PASSWORD
    //this.driver = initDriver(this.uri, this.user, this.password)
    // Init all filter states to be false (unchanged)
    this.state = {
      queried: false,
      speaker: "",
      addressee: "",
    }

    this.filterRef = React.createRef()

    this.query = this.query.bind(this)
    this.reset = this.reset.bind(this)
  }
  
  query = (event) => {
    //const filterState = this.filterRef.current.state
    //let prev = this.state.queried
    this.setState({ 
      queried: true,
      speaker: this.filterRef.current.state.selectedSpeaker,
      addressee: this.filterRef.current.state.selectedAddressee
    }, 
      () => {
        console.log('quried, this.state.addressee from app is now: '+this.state.addressee)
      }
    )
    //const pt = document.getElementById('poemTable')
    //const poemTable = ReactDOMClient.createRoot(pt)
    //poemTable.render(<Poem speaker={poemProp.speaker} addressee={poemProp.addressee}/>)
  }
  reset = (event) => {
    //const filterState = this.filterRef.current.state
    //let prev = this.state.queried
    this.setState({ 
      queried: false,
      speaker: this.filterRef.current.state.selectedSpeaker,
      addressee: this.filterRef.current.state.selectedAddressee
    }, 
      () => {
        console.log('reset')
      }
    )
    //const pt = document.getElementById('poemTable')
    //const poemTable = ReactDOMClient.createRoot(pt)
    //poemTable.render(<Poem speaker={poemProp.speaker} addressee={poemProp.addressee}/>)
  }

  render() {
    return (
      <div className="App">
        {/* <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header> */}
        <Filter ref={this.filterRef} uri={this.uri} user={this.user} password={this.password}/>
        <button disabled={this.state.queried} onClick={this.query}>Query</button>
        <button disabled={!this.state.queried} onClick={this.reset}>Reset</button>
        {this.state.queried && <Poem uri={this.uri} user={this.user} password={this.password} speaker={this.state.speaker} addressee={this.state.addressee}/>}
      </div>
    )
  }
}
