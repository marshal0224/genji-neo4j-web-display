import React from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes } from '../utils'

export default class Poem extends React.Component { 

    constructor(props) {
        super(props)
        initDriver(this.props.uri, this.props.user, this.props.password)
        this.driver = getDriver()
        this.state = {
            poemProperties: [],
        }
        console.log('poem init')
    }

    async componentDidMount() {
        const session = this.driver.session()
        console.log('poem mounted')
        const chapter = this.props.chapter
        const speaker = this.props.speaker
        const addressee = this.props.addressee

        const getPoem = `match 
                            (s:Character {name: $speaker})-[p: SPEAKER_OF]-(j:Japanese)-[q:ADDRESSEE_OF]-(a:Character {name: $addressee}), 
                            (j:Japanese)-[r:INCLUDED_IN]-(c:Chapter {chapter_number: $chapter})
                        return (j) as poems`
        
        try {
            const res = await session.readTransaction(tx => tx.run(getPoem, { speaker, addressee, chapter}))
            let temp = res.records.map(row => {return toNativeTypes(row.get('poems'))})
            // properties[i]: {Japanese, Romaji, pnum}
            this.setState({
                poemProperties: temp.map((poem) => poem.properties)
            }, 
            () => {
                console.log('poemProperties set')
            })
        } catch (e) {
            console.log('Error in poem: '+e)
        } finally {
            await session.close()
        }
        closeDriver()
    }

    async componentDidUpdate(nextState) {
        console.log('Poem did update')
    }

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