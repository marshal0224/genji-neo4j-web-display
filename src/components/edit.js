import React from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes } from '../utils'

export default class Edit extends React.Component {
    constructor(props){
        super(props)
        // initDriver(this.props.uri, this.props.user, this.props.password)
        // this.driver = getDriver()
        this.state = {
            uri: this.props.uri, 
            user: this.props.user,
            password: this.props.password,
            age: '',
        }
        this.fun = this.fun.bind(this)
        this.getAge = this.getAge.bind(this)
        this.updateStateAge = this.updateStateAge.bind(this)
        this.updateAge = this.updateAge.bind(this)
    }
    // edit pipeline
    // 1. initialize (e.g., mounts upon login)
    // 2. maps cell type
    // 3. retrieves current content
    // 4. displays current content in the input box for editing
    // 5. upon editing completion, updates DB content according to input
    async fun() {
        initDriver(this.state.uri, this.state.user, this.state.password)
        const driver = getDriver()
        const session = driver.session()
        const read = await session.readTransaction(tx => {
            return tx.run(
                'MATCH (p:People {name:"Marshal Dong"}) return count(p)'
            )
        })
        let flag = read.records.map(row => {return toNativeTypes(row.get('count(p)'))})[0].low
        const write = await session.writeTransaction(tx => {
            if (flag === 0) {
                return tx.run(
                    'CREATE (p:People {name:"Marshal Dong", age:"21"})'
                )
            } else {
                return tx.run(
                    'MATCH (p:People {name:"Marshal Dong"}) WITH p SKIP 1 DELETE p'
                )
            }
        })
        console.log('clicked! flag is '+flag)
        closeDriver()
    }

    async getAge() {
        initDriver(this.state.uri, this.state.user, this.state.password)
        const driver = getDriver()
        const session = driver.session()
        const read = await session.readTransaction(tx => {
            return tx.run(
                'MATCH (p:People {name:"Marshal Dong"}) return p.age as age'
            )
        })
        let age = read.records.map(row => {return toNativeTypes(row.get('age'))})[0].low
        // age = parseInt(age[0][0]+age[0][1]+age[0][2])
        // console.log(age[0].low)
        this.setState({
            age: age,
        })
        closeDriver()
    }

    async updateAge() {
        initDriver(this.state.uri, this.state.user, this.state.password)
        const driver = getDriver()
        const session = driver.session()
        let age = this.state.age
        const write = await session.writeTransaction(tx => {
            return tx.run(
                'MATCH (p:People {name:"Marshal Dong"}) SET p.age = '+age+' RETURN p.age AS age'
            , {age})
        })
        // const read = await session.readTransaction(tx => {
        //     return tx.run(
        //         'MATCH (p:People {name:"Marshal Dong"}) return p.age as age'
        //     )
        // })
        // let age = read.records.map(row => {return toNativeTypes(row.get('age'))})
        // age = parseInt(age[0][0]+age[0][1]+age[0][2])
        console.log('updated')
        closeDriver()
    }

    updateStateAge(event) {
        this.setState({
            age: event.target.value
        })
    }

    render() {
        console.log('current age is: '+this.state.age)
        return(
            <div>
                <button onClick={this.fun}>Click me</button>
                <label>
                    Age:
                    <input value={this.state.age} onChange={this.updateStateAge}></input>
                    <button onClick={this.getAge}>Get Age</button>
                    <button onClick={this.updateAge}>Update Age</button>
                </label>
            </div>
        )
    }
}