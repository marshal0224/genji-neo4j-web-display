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
            pnum: this.props.pnum,
            name: '',
        }
        this.getDBPropertyVal = this.getDBPropertyVal.bind(this)
        this.updateStatePropertyVal = this.updateStatePropertyVal.bind(this)
        this.updateDBPropertyVal = this.updateDBPropertyVal.bind(this)
    }

    async getDBPropertyVal() {
        initDriver(this.state.uri, this.state.user, this.state.password)
        const driver = getDriver()
        const session = driver.session()
        let propertyName = this.props.propertyName
        let pnum = this.state.pnum
        let name
        let read
        if (propertyName === 'Japanese' || propertyName === 'Romaji') {
            read = await session.readTransaction(tx => {
                return tx.run(
                    'MATCH (n:Genji_Poem {pnum:"'+pnum+'"}) return n.'+propertyName+' as val'
                , {pnum, propertyName})
            })
        } else if (propertyName === 'name') {
            name = this.props.name
            read = await session.readTransaction(tx => {
                return tx.run(
                    'MATCH (c:Character {name:"'+name+'"}) return c.name as val'
            )})
        } else if (propertyName === 'page') {
            read = await session.readTransaction(tx => {
                return tx.run(
                    'MATCH (n:Genji_Poem {pnum:"'+pnum+'"})<-[:TRANSLATION_OF]-(t:Translation)<-[:TRANSLATOR_OF]-(p:People {name:"Waley"}) return t.WaleyPageNum as val'
                , {pnum, propertyName})
            })
        } else {
            read = await session.readTransaction(tx => {
                return tx.run(
                    'MATCH (n:Genji_Poem {pnum:"'+pnum+'"})<-[:TRANSLATION_OF]-(t:Translation)<-[:TRANSLATOR_OF]-(p:People {name:"'+propertyName+'"}) return t.translation as val'
                , {pnum, propertyName})
            })
        }
        if (!read.records[0]._fields[0]) {
            console.log(read.records[0])
            this.setState({
                propertyVal: 'not entered'
            })
        } else {
            let val = read.records.map(row => {return toNativeTypes(row.get('val'))})
            let res
            if (propertyName === 'Japanese') {
                val = JSON.stringify(val[0].valueOf())
                let len = val.length
                val = val.substring(0, len-1).split(',')
                res = ''
                for (let i=0; i < val.length; i++) {
                    let e = val[i].split(':')[1]
                    e = e.substring(1,e.length-1)
                    res += e
                }
                this.setState({
                    propertyVal: res,
                })
            } else if (propertyName === 'name') {
                val = Object.values(val[0]).join('')
                res = val
                this.setState({
                    propertyVal: res,
                    name: res,
                })
            } else {
                val = Object.values(val[0]).join('')
                res = val
                this.setState({
                    propertyVal: res,
                })
            }
        }
        session.close()
        closeDriver()
    }

    async updateDBPropertyVal() {
        initDriver(this.state.uri, this.state.user, this.state.password)
        const driver = getDriver()
        const session = driver.session()
        let propertyName = this.props.propertyName
        let propertyVal = this.state.propertyVal
        let pnum = this.state.pnum
        let write
        if (window.confirm('About to update a DB property')) {
            if (propertyName === 'Japanese' || propertyName === 'Romaji') {
                write = await session.writeTransaction(tx => {
                    return tx.run(
                        'MATCH (n:Genji_Poem {pnum: "'+pnum+'"}) SET n.'+propertyName+' = "'+propertyVal+'" RETURN n.'+propertyName+' AS val'
                    , {pnum, propertyName, propertyVal})
                })
            } else if (propertyName === 'name') {
                let name = this.state.name
                write = await session.writeTransaction(tx => {
                    return tx.run(
                        'MATCH (c:Character {name: "'+name+'"}) SET c.name = "'+propertyVal+'" RETURN c.'+propertyName+' AS val'
                    , {propertyVal, name})
                })
            } else if (propertyName === 'page') {
                write = await session.writeTransaction(tx => {
                    return tx.run(
                        'MATCH (n:Genji_Poem {pnum:"'+pnum+'"})<-[:TRANSLATION_OF]-(t:Translation)<-[:TRANSLATOR_OF]-(p:People {name:"Waley"}) SET t.WaleyPageNum="'+propertyVal+'"'
                        , {pnum})
                })
            } else {
                write = await session.writeTransaction(tx => {
                    return tx.run(
                        'MATCH (n:Genji_Poem {pnum:"'+pnum+'"})<-[:TRANSLATION_OF]-(t:Translation)<-[:TRANSLATOR_OF]-(p:People {name:"'+propertyName+'"}) SET t.translation="'+propertyVal+'"'
                        , {pnum, propertyName})
                })
            }
            console.log('updated')
            this.props.changeKey()
        } else {
            alert('DB update canceled')
        }
        session.close()
        closeDriver()
    }

    updateStatePropertyVal(event) {
        this.setState({
            propertyVal: event.target.value
        })
    }

    render() {
        // this.getDBPropertyVal()
        return(
            <div>
                <label>
                    <textarea value={this.state.propertyVal} onChange={this.updateStatePropertyVal}></textarea>
                    <br/>
                    <button onClick={this.getDBPropertyVal}>Get Val</button>
                    <button onClick={this.updateDBPropertyVal}>Update</button>
                </label>
            </div>
        )
    }
}