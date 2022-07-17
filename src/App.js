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
    this.app_username = process.env.REACT_APP_USERNAME
    this.app_password = process.env.REACT_APP_PASSWORD
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
      app_username: '',
      app_password: '',
    }
    this.changeKey = this.changeKey.bind(this)
    this.updateUsername = this.updateUsername.bind(this)
    this.updatePassword = this.updatePassword.bind(this)
    this.login = this.login.bind(this)
    this.logout = this.logout.bind(this)
    this.filterRef = React.createRef()
    this.ptRef = React.createRef() // poem table ref
  }
  
  changeKey() {
    this.setState({
      queried: !this.state.queried
    })
  }

  query = (event) => {
    this.setState({ 
      // queried: !this.state.queried,
      chapter: this.filterRef.state.selectedChapter,
      speaker: this.filterRef.state.selectedSpeaker,
      addressee: this.filterRef.state.selectedAddressee,
      spkrGen: this.filterRef.state.selectedSpeakerGender,
      addrGen: this.filterRef.state.selectedAddresseeGender,
  }, () => this.changeKey())}

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

// login scripts
  updateUsername(event) {
    this.setState({
      app_username: event.target.value
    })
  }

  updatePassword(event) {
    this.setState({
      app_password: event.target.value
    })
  }

  login() {
    if (this.state.app_username === this.app_username && this.state.app_password === this.app_password) {
      this.setState({
        auth: true,
      }, () => alert('Hi Professor Vincent, you are now logged in.'))
    } else{
      alert('Wrong credentials, please try again.')
    }
  }

  logout() {
    this.setState({
      auth: false,
    }, () => alert('Professor Vincent, you are now logged out.'))
  }

  render() {
    return (
      <div className="App">
        <div>
          <Filter ref={(filterRef) => {this.filterRef = filterRef}} uri={this.uri} user={this.user} password={this.password}/>
          <br/>
          <label>
            Username:
            <input onChange={this.updateUsername}></input>
          </label>
          <label>
            Password:
            <input onChange={this.updatePassword}></input>
          </label>
          <button disabled={this.state.auth} onClick={this.login}>Log in</button>
          <button disabled={!this.state.auth} onClick={this.logout}>Log out</button>
          <br/>
          <br/>
          <button onClick={this.query}>Query</button>
          <button onClick={this.test}>Test</button>
          <button onClick={this.toggleSpkr}>Toggle Speaker</button>
          <button onClick={this.toggleAddr}>Toggle Addressee</button>
          <br/>
        </div>
        <br />
        <div>
          <Poem key={this.state.queried} uri={this.uri} user={this.user} password={this.password} chapter={this.state.chapter} speaker={this.state.speaker} addressee={this.state.addressee} spkrGen={this.state.spkrGen} addrGen={this.state.addrGen} changeKey={this.changeKey} auth={this.state.auth}/>
        </div>
      </div>
    )}}