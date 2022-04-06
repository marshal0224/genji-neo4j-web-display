import React from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes } from '../utils'

export default class Poem extends React.Component { 

    constructor(props) {
        super(props)
        initDriver(this.props.uri, this.props.user, this.props.password)
        this.driver = getDriver()
        this.state = {
            // speaker: "",
            // addressee: "",
            poemProperties: [],
        }
        console.log('poem init')
    }

    async componentDidMount() {
        const session = this.driver.session()
        console.log('poem mounted')
        const speaker = this.props.speaker
        const addressee = this.props.addressee

        const getPoem = `match (s:Character {name: $speaker})-[p: SPEAKER_OF]-(j:Japanese)-[q:ADDRESSEE_OF]-(a:Character {name: $addressee}) return (j) as poems`

        const res = await session.readTransaction(tx => tx.run(getPoem, { speaker, addressee}))
        let temp = res.records.map(row => {return toNativeTypes(row.get('poems'))})
        // properties[i]: {Japanese, Romaji, pnum}
        this.setState({
            poemProperties: temp.map((poem) => poem.properties)
        }, 
        () => {
            console.log('poemProperties set')
        })
        await session.close()
        closeDriver()
    }

    async componentDidUpdate(nextState) {
        // const session = nextState.driver.session()
        console.log('Poem did update')
        // const speaker = nextState.props.speaker
        // const addressee = nextState.props.addressee

        // const getPoem = `match (s:Character {name: $speaker})-[p: SPEAKER_OF]-(j:Japanese)-[q:ADDRESSEE_OF]-(a:Character {name: $addressee}) return (j) as poems`

        // const res = await session.readTransaction(tx => tx.run(getPoem, { speaker, addressee}))
        // let temp = res.records.map(row => {return toNativeTypes(row.get('poems'))})
        // // properties[i]: {Japanese, Romaji, pnum}
        // nextState.setState({
        //     poemProperties: temp.map((poem) => poem.properties)
        // }, 
        // () => {
        //     console.log('poemProperties set')
        // })
        // await session.close()
        // await closeDriver()
    }
    //componentDidUpdate() {this.componentDidMount()}

    render() {
        let properties = this.state.poemProperties;
        console.log('poem rendered')
        return (
            <table>
                <thead>
                    <tr>
                        <th>Poem Number</th>
                        <th>Japanese</th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {properties.map((row) => <tr key={row.pnum}>
                                                <td>{row.pnum}</td>
                                                <td>{row.Japanese}</td>
                                            </tr>)}
                </tbody>
            </table>
        )
    }
}