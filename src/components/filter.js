import React from 'react'
//import {  } from '../neo4j'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes } from '../utils'

export default class Filter extends React.Component {

    //driver

    constructor(props) {
        super(props)
        initDriver(this.props.uri, this.props.user, this.props.password)
        this.driver = getDriver()
        this.state = {
            chapter: [],
            speaker: [],
            addressee: [],
            gender: [], 
            selectedSpeaker: "",
            selectedAddressee: "",
            selectedPoems: [],
        }
    }

    async componentDidMount() {
        const getChp = 'match (c:Chapter) return (c) as chapters'
        const getExchange = 'match path=(c:Character)-[r:SPEAKER_OF]-(j:Japanese)-[s:ADDRESSEE_OF]-(d:Character) return path'

        const session = this.driver.session()

        const resChp = await session.readTransaction(tx => tx.run(getChp))
        const resExchange = await session.readTransaction(tx => tx.run(getExchange))

        let tempChp = resChp.records.map(row => {return toNativeTypes(row.get('chapters'))}).map((chp) => chp.properties)
        let tempExchange = resExchange.records.map(row => {return toNativeTypes(row.get('path'))}).map(({segments}) => segments)
        
        let speakers = []
        let addressees = []
        let chapters = []

        tempExchange.forEach(([s, a]) => {
            speakers.push(s)
            addressees.push(a)
        })

        tempChp.forEach((e) => {
            chapters.push([e.chapter_number, e.kanji, e.chapter_name])
        })
        //['1', '桐壺', 'Kiritsubo']
        //console.log(chapters)

        this.setState({
            chapter: chapters,
            speaker: speakers.map(({start}) => start.properties.name),
                    //pnum: zeros.map(({start}) => start.properties.name),
            addressee: addressees.map(({end}) => end.properties.name)
        }, () => {
            console.log('filter options set')
        })

        //const res2 = await session.readTransaction(tx => tx.run(getPoem))
        // let temp2 = res2.records.map(row => {return toNativeTypes(row.get('path'))})
        // let newtemp2 = temp2.map(({segments}) => segments)
        //console.log(newtemp2)
        await session.close()
        closeDriver()
    }

    render() {
        let speakerForm = [...new Set(this.state.speaker)];
        let addresseeForm = [...new Set(this.state.addressee)];
        let updateSelectedSpeaker = (event) => {
            this.setState({
                selectedSpeaker: event.target.value
                }, 
                () => {
                    console.log('selected speaker now is: ' + this.state.selectedSpeaker)
                }
            )
        }
        let updateSelectedAddressee = (event) => {
            this.setState({
                selectedAddressee: event.target.value
                }, 
                () => {
                    console.log('selected addressee now is: ' + this.state.selectedAddressee)
                }
            )
        }
        return (
            <div>
                <form>
                    <label htmlFor="chapter">Choose a chapter</label>
                    <br />
                    <select 
                        id="chapter"
                        //value={formData.speaker}
                        //onChange={updateSelectedSpeaker}
                        name="chapter"
                    >
                        <optgroup>
                            <option value="">Any</option>
                            {this.state.chapter.map((row) => <option key={row[2]}>{row[0]+' '+row[1]+' '+row[2]}</option>)}
                        </optgroup>
                    </select>
                </form>
                <form>
                    <label htmlFor="speaker">Choose a speaker</label>
                    <br />
                    <select 
                        id="speaker"
                        //value={formData.speaker}
                        onChange={updateSelectedSpeaker}
                        name="speaker"
                    >
                        <option value="">Any</option>
                        {speakerForm.map((row) => <option key={row}>{row}</option>)}
                    </select>
                </form>
                <form>
                <label htmlFor="addressee">Choose an addressee</label>
                <br />
                <select 
                    id="addressee"
                    //value={formData.speaker}
                    onChange={updateSelectedAddressee}
                    name="addressee"
                >
                    <option value="">Any</option>
                    {addresseeForm.map((row) => <option key={row}>{row}</option>)}
                </select>
            </form>
        </div>
        )
    }
}