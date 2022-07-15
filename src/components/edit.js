import React from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes } from '../utils'

// edit pipeline
// 1. initialize (e.g., mounts upon login)
// 2. maps cell type
// 3. retrieves current content
// 4. displays current content in the input box for editing
// 5. upon editing completion, updates DB content according to input

export default class Edit extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            uri: this.props.uri, 
            user: this.props.user,
            password: this.props.password,
            propertyVal: '',
            propertyName: this.props.propertyName,
            pnum: this.props.pnum,
        }
        this.getDBPropertyVal = this.getDBPropertyVal.bind(this)
        this.updateStatePropertyVal = this.updateStatePropertyVal.bind(this)
        this.updateDBPropertyVal = this.updateDBPropertyVal.bind(this)
    }

    async getDBPropertyVal() {
        initDriver(this.state.uri, this.state.user, this.state.password)
        const driver = getDriver()
        const session = driver.session()
        let propertyName = this.state.propertyName
        let pnum = this.state.pnum
        const read = await session.readTransaction(tx => {
            return tx.run(
                'MATCH (n:Genji_Poem {pnum:"'+pnum+'"}) return n.'+propertyName+' as val'
            , {pnum, propertyName})
        })
        let val = read.records.map(row => {return toNativeTypes(row.get('val'))})
        val = JSON.stringify(val[0].valueOf())
        let len = val.length
        val = val.substring(0, len-1).split(',')
        let res = ''
        for (let i=0; i < val.length; i++) {
            let e = val[i].split(':')[1]
            e = e.substring(1,e.length-1)
            res += e
        }
        this.setState({
            propertyVal: res,
        })
        closeDriver()
    }

    async updateDBPropertyVal() {
        initDriver(this.state.uri, this.state.user, this.state.password)
        const driver = getDriver()
        const session = driver.session()
        let propertyName = this.state.propertyName
        let propertyVal = this.state.propertyVal
        let pnum = this.state.pnum
        const write = await session.writeTransaction(tx => {
            return tx.run(
                'MATCH (n:Genji_Poem {pnum: "'+pnum+'"}) SET n.'+propertyName+' = "'+propertyVal+'" RETURN n.'+propertyName+' AS val'
            , {pnum, propertyName, propertyVal})
        })
        console.log('updated')
        closeDriver()
        this.props.changeKey()
    }

    updateStatePropertyVal(event) {
        this.setState({
            propertyVal: event.target.value
        })
    }

    render() {
        console.log('current val is: '+this.state.propertyVal)
        return(
            <div>
                <label>
                    {this.state.propertyName}: 
                    <textarea value={this.state.propertyVal} onChange={this.updateStatePropertyVal}></textarea>
                    <button onClick={this.getDBPropertyVal}>Get Val</button>
                    <button onClick={this.updateDBPropertyVal}>Update Val</button>
                </label>
            </div>
        )
    }
}