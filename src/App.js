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
    this.setState({ 
      queried: true,
      speaker: this.filterRef.current.state.selectedSpeaker,
      addressee: this.filterRef.current.state.selectedAddressee
    }, 
      () => {
        console.log('quried, this.state.addressee from app is now: '+this.state.addressee)
      }
    )
  }
  reset = (event) => {
    this.setState({ 
      queried: false,
      speaker: this.filterRef.current.state.selectedSpeaker,
      addressee: this.filterRef.current.state.selectedAddressee
    }, 
      () => {
        console.log('reset')
      }
    )
  }

  render() {
    return (
      <div className="App">
        <Filter ref={this.filterRef} uri={this.uri} user={this.user} password={this.password}/>
        <button disabled={this.state.queried} onClick={this.query}>Query</button>
        <button disabled={!this.state.queried} onClick={this.reset}>Reset</button>
        {this.state.queried && <Poem uri={this.uri} user={this.user} password={this.password} speaker={this.state.speaker} addressee={this.state.addressee}/>}
      </div>
    )
  }
}
