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
      spkrOn: true,
      addrOn: true,
    }

    this.filterRef = React.createRef()
    this.ptRef = React.createRef() // poem table ref

    // this.query = this.query.bind(this)
    // this.test = this.test.bind(this)
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

  resetTable = (event) => {
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
          <button disabled={this.state.queried} onClick={this.query}>Query</button>
          <button disabled={!this.state.queried} onClick={this.resetTable}>Reset Table</button>
          <button onClick={this.test}>Test</button>
          <button disabled={!this.state.queried} onClick={this.toggleSpkr}>Toggle Speaker</button>
          <button disabled={!this.state.queried} onClick={this.toggleAddr}>Toggle Addressee</button>
          <br/>
        </div>
        <div>
          {this.state.queried && <Poem ref={(ptRef) => {this.ptRef = ptRef}} uri={this.uri} user={this.user} password={this.password} chapter={this.state.chapter} speaker={this.state.speaker} addressee={this.state.addressee}/>}
        </div>
      </div>
    )
  }
}
