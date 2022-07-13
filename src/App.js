import './App.css';
import React from 'react'
import Filter from './components/filter'
import Poem from './components/poem'
import $ from 'jquery';

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
      spkrGen: "Any",
      addrGen: "Any",
      spkrOn: true,
      addrOn: true,
    }

    this.filterRef = React.createRef()
    this.ptRef = React.createRef() // poem table ref
  }
  
  query = (event) => {
    this.setState({ 
      queried: !this.state.queried,
      chapter: this.filterRef.state.selectedChapter,
      speaker: this.filterRef.state.selectedSpeaker,
      addressee: this.filterRef.state.selectedAddressee,
      spkrGen: this.filterRef.state.selectedSpeakerGender,
      addrGen: this.filterRef.state.selectedAddresseeGender,
  })}

  test = (event) => {
    this.setState({
      queried: true,
      chapter: '5',
      speaker: 'Hikaru Genji',
      addressee: 'Murasaki',
    })
  }

  spkrDisplay

  toggleSpkr = (event) => {
    this.setState({
      spkrOn: !this.state.spkrOn
    },
      () => {
        if (this.state.spkrOn) {
          this.spkrDisplay = 'table-cell'
        } else {
          this.spkrDisplay = 'none'
        }
        $('.spkrCol').css('display', this.spkrDisplay)
        console.log('speaker display is' + this.state.spkrOn)
      }
    )
  }

  addrDisplay

  toggleAddr = (event) => {
    this.setState({
      addrOn: !this.state.addrOn
    },
      () => {
        if (this.state.addrOn) {
          this.addrDisplay = 'table-cell'
        } else {
          this.addrDisplay = 'none'
        }
        $('.addrCol').css('display', this.addrDisplay)
        console.log('addressee display is' + this.state.addrOn)
      }
    )
  }

  render() {
    return (
      <div className="App">
        <div>
          <Filter ref={(filterRef) => {this.filterRef = filterRef}} uri={this.uri} user={this.user} password={this.password}/>
          <br/>
          <button onClick={this.query}>Query</button>
          <button onClick={this.test}>Test</button>
          <button disabled={!this.state.queried} onClick={this.toggleSpkr}>Toggle Speaker</button>
          <button disabled={!this.state.queried} onClick={this.toggleAddr}>Toggle Addressee</button>
          <br/>
        </div>
        <br />
        <div>
          <Poem key={this.state.queried} ref={(ptRef) => {this.ptRef = ptRef}} uri={this.uri} user={this.user} password={this.password} chapter={this.state.chapter} speaker={this.state.speaker} addressee={this.state.addressee} spkrGen={this.state.spkrGen} addrGen={this.state.addrGen}/>
        </div>
      </div>
    )}}