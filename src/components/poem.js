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

    // getDerived

    render() {
        let properties = this.state.poemProperties;
        let plist = new Array(properties.length)
        for (let i = 0; i < properties.length; i++) {
            plist[i] = [properties[i].pnum, properties[i].Japanese, properties[i].Romaji]
        }
        for (let i = 0; i < plist.length-1; i++) {
            for (let j = 0; j < plist.length-i-1; j++) {
                if ((parseInt(plist[j][0].substring(0, 2)) > parseInt(plist[j+1][0].substring(0, 2))) 
                || (parseInt(plist[j][0].substring(0, 2)) >= parseInt(plist[j+1][0].substring(0, 2)) 
                && parseInt(plist[j][0].substring(4, 6)) > parseInt(plist[j+1][0].substring(4, 6)))) {
                    let temp = plist[j+1]
                    plist[j+1] = plist[j]
                    plist[j] = temp
                    // console.log('swpped')
                }
            }
        }
        console.log('Poem table rendering inited')
        // console.log(plist)
        // for (let i = 0; i < plist.length-1; i++) {
        //     if (plist[i][0].substring(0, 2) > plist[i][0].substring(0, 2)
        // }
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
                    {plist.map((row) => <tr key={row[0]}>
                                                <td>{row[0]}</td>
                                                <td>{row[1]}</td>
                                                <td>
                                                    <p>field 1</p>
                                                </td>
                                                <td><p>field 2</p></td>
                                                <td><p>field 3</p></td>
                                            </tr>)}
                </tbody>
            </table>
        )
    }
}