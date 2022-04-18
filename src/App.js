//import logo from './logo.svg';
import './App.css';
//import { initDriver, closeDriver } from './neo4j.js'
import React from 'react'
//import * as ReactDOMClient from 'react-dom/client';
import Filter from './components/filter'
import Poem from './components/poem'
// import getPoem from 'components/getPoem'

export default class App extends React.Component{
  constructor() {
    super()
    this.uri = process.env.REACT_APP_NEO4J_URI
    this.user = process.env.REACT_APP_NEO4J_USERNAME
    this.password = process.env.REACT_APP_NEO4J_PASSWORD
    // Init all filter states to be false (unchanged)
    this.state = {
      queried: false,
      chapter: "",
      speaker: "",
      addressee: "",
    }

    this.filterRef = React.createRef()
    this.ptRef = React.createRef() // poem table ref

    this.query = this.query.bind(this)
    this.test = this.test.bind(this)
  }
  
  query = (event) => {
    this.setState({ 
      queried: true,
      chapter: this.filterRef.state.selectedChapter,
      speaker: this.filterRef.state.selectedSpeaker,
      addressee: this.filterRef.state.selectedAddressee
    }, 
      () => {
        this.ptRef.setState({
          chapter: this.state.chapter,
          speaker: this.state.speaker,
          addressee: this.state.addressee,
        }, 
        () => {
          console.log('quried. ptRef.state.addressee is '+this.ptRef.state.addressee)
        })
      }
    )
  }

  reset = (event) => {
    this.setState({ 
      queried: false,
    }, 
      () => {
        console.log('reset')
      }
    )
  }

  test = (event) => {
    this.setState({
      queried: true,
      chapter: '5',
      speaker: 'Hikaru Genji',
      addressee: 'Murasaki',
    })
  }

  render() {
    return (
      <div className="App">
        <div>
          <Filter ref={(filterRef) => {this.filterRef = filterRef}} uri={this.uri} user={this.user} password={this.password}/>
          <br/>
          <button disabled={this.state.queried} onClick={this.query}>Query</button>
          <button disabled={!this.state.queried} onClick={this.reset}>Reset Table</button>
          <button onClick={this.test}>Test</button>
          <br/>
        </div>
        <div>
          {this.state.queried && <Poem ref={(ptRef) => {this.ptRef = ptRef}} uri={this.uri} user={this.user} password={this.password} chapter={this.state.chapter} speaker={this.state.speaker} addressee={this.state.addressee}/>}
        </div>
      </div>
    )
  }
}
