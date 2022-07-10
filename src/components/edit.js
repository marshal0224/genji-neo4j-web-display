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
        }
        this.fun = this.fun.bind(this)
    }

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
                    'CREATE (p:People {name:"Marshal Dong"})'
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

    render() {
        return(
            <button onClick={this.fun}>Click me</button>
        )
    }
}