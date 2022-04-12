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
        console.log('chapter for poem table is: '+chapter)
        
        try {
            let getPoem_S, getPoem_A, getPoem_C
            if (speaker === 'Any') {
                getPoem_S = '(s:Character)'
            } else {
                getPoem_S = '(s:Character {name: "'+speaker+'"})'
            } 
            if (addressee === 'Any') {
                getPoem_A = '(a:Character)'
            } else {
                getPoem_A = '(a:Character {name: "'+addressee+'"})'
            }
            if (chapter === 'Any') {
                getPoem_C = ''
            } else {
                //as of Apirl 2022, the chapter numbers are in string
                getPoem_C = ', (j)-[r:INCLUDED_IN]-(c:Chapter {chapter_number: "'+chapter+'"})'
            }
            let getPoem =   'match '+getPoem_S+'-[p: SPEAKER_OF]-(j:Japanese)-'
                            +'[q:ADDRESSEE_OF]-'+getPoem_A 
                            +getPoem_C
                            +' return (j) as poems'
            console.log(getPoem)
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

    getDerived

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