import './App.css';
import React from 'react'
import Filter from './components/filter'
import Poem from './components/poem'
import Title from './components/title';
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
      displayPT: false,
      key: 'odd',
      chapter: "",
      speaker: "",
      addressee: "",
      spkrGen: "Any",
      addrGen: "Any",
      spkrOn: true,
      addrOn: true,
      count: 0,
      app_username: '',
      app_password: '',
      auth: false,
    }
    this.characters = []
    this.genders = []
    this.changeKey = this.changeKey.bind(this)
    this.updateUsername = this.updateUsername.bind(this)
    this.updatePassword = this.updatePassword.bind(this)
    this.login = this.login.bind(this)
    this.logout = this.logout.bind(this)
    this.filterRef = React.createRef()
    this.ptRef = React.createRef() // poem table ref
    this.poemCount = this.poemCount.bind(this)
  }

  componentDidUpdate() {
    this.characters = this.filterRef.state.characters
    this.genders = this.filterRef.state.genders
  }
  
  changeKey() {
    if (this.state.key === 'odd') {
      this.setState({
        key: 'even'
      })
    } else {
      this.setState({
        key: 'odd'
      })
    }
  }

  query = (event) => {
    this.poemCount()
    this.setState({ 
      displayPT: true,
      chapter: this.filterRef.state.selectedChapter,
      speaker: this.filterRef.state.selectedSpeaker,
      addressee: this.filterRef.state.selectedAddressee,
      spkrGen: this.filterRef.state.selectedSpeakerGender,
      addrGen: this.filterRef.state.selectedAddresseeGender,
  }, () => {
    this.changeKey()
    // this.changeKey()
  })} 

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

  poemCount(count) {
    this.setState({
      count: count,
    })
  }

  render() {
    return (
      <div className="App">
        <Title />
        <div className='login'>
          <label>
            Username:
            <input onChange={this.updateUsername}></input>
          </label>
          <button disabled={this.state.auth} onClick={this.login}>Log in</button>
          <br/>
          <label>
            Password:
            <input onChange={this.updatePassword}></input>
          </label>
          <button disabled={!this.state.auth} onClick={this.logout}>Log out</button>
        </div>
        <div>
          <Filter ref={(filterRef) => {this.filterRef = filterRef}} uri={this.uri} user={this.user} password={this.password}/>
          <br/>
          <button onClick={this.query}>Query</button>
          <button onClick={this.filterRef.resetFilters}>Reset Filters</button>
          {/* <button onClick={this.toggleSpkr}>Toggle Speaker</button> */}
          {/* <button onClick={this.toggleAddr}>Toggle Addressee</button> */}
          <br/>
        </div>
        {this.state.displayPT && <p>{this.state.count} poems quried</p>}
        <br />
        <div>
          {this.state.displayPT && <Poem ref={(ptRef) => {this.ptRef = ptRef}} key={this.state.key} uri={this.uri} user={this.user} password={this.password} chapter={this.state.chapter} characters={this.characters} speaker={this.state.speaker} addressee={this.state.addressee} genders={this.genders} spkrGen={this.state.spkrGen} addrGen={this.state.addrGen} changeKey={this.changeKey} auth={this.state.auth} updateCount={this.poemCount}/>}
        </div>
      </div>
    )}}