import React from 'react'
//import {  } from '../neo4j'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes } from '../utils'
import { Dropdown } from 'rsuite'
import { json } from 'neo4j-driver-core'

export default class Filter extends React.Component {

    constructor(props) {
        super(props)
        initDriver(this.props.uri, this.props.user, this.props.password)
        this.driver = getDriver()
        this.state = {
            chapter: [],
            characters: [],
            charNum: 0,
            speaker: [],
            addressee: [],
            gender: [], 
            selectedChapter: "Any",
            selectedSpeaker: "Any",
            selectedAddressee: "Any",
            adjmat_SA: [], 
            chapterList: [], 
            speakerList: [], 
            addresseeList: [],
            // lockChapter: false,
            // lockSpeaker: false,
            // lockAddressee: false,
            //chp_SA: [0:{dict{speaker: addressee}}]
            chp_SA: [],
        }
    }

    async componentDidMount() {
        const getChp = 'match (c:Chapter) return (c) as chapters'
        const getExchange = 'match path=(c:Character)-[r:SPEAKER_OF]-(j:Japanese)-[s:ADDRESSEE_OF]-(d:Character) return path'
        const getChar = 'match (c:Character) return c.name as char order by c.name'

        const session = this.driver.session()

        try {
            const resChp = await session.readTransaction(tx => tx.run(getChp))
            const resExchange = await session.readTransaction(tx => tx.run(getExchange))
            const resChar = await session.readTransaction(tx => tx.run(getChar))
            
            let tempChp = resChp.records.map(row => {return toNativeTypes(row.get('chapters'))}).map((chp) => chp.properties)
            let tempExchange = resExchange.records.map(row => {return toNativeTypes(row.get('path'))}).map(({segments}) => segments)
            let chars= resChar.records.map(row => {return toNativeTypes(row.get('char'))}).map(e => Object.values(e).join(''))
            const charNum = chars.length

            //115 as of April 10th, 2022
            //console.log(charNum)

            let speakers = []
            let addressees = []
            let chapters = []
    
            tempExchange.forEach(([s, a]) => {
                speakers.push(s)
                addressees.push(a)
            })
            //speakers: [{start, relationship, end}...]
            tempChp.forEach((e) => {
                chapters.push([e.chapter_number, e.kanji, e.chapter_name])
            })
            //['1', '桐壺', 'Kiritsubo']
            this.setState({
                chapter: chapters,
                characters: chars,
                charNum: charNum,
                speaker: Array.from([...new Set(speakers.map(({start}) => start.properties.name))]).sort(),
                addressee: Array.from([...new Set(addressees.map(({end}) => end.properties.name))]).sort(),
                chapterList: chapters, 
                speakerList: Array.from([...new Set(speakers.map(({start}) => start.properties.name))]).sort(),
                addresseeList: Array.from([...new Set(addressees.map(({end}) => end.properties.name))]).sort(),
            }, () => {
                // init chapter to speaker&addressee mapping
                let chp_SA = new Array(this.state.chapter.length)
                for (let i = 0; i < speakers.length; i++) {
                    let chpnum = speakers[i].end.properties.pnum.substring(0, 2)
                    if (chpnum.substring(0, 1) == '0') {
                        chpnum = parseInt(chpnum.substring(1, 2))
                    } else {
                        chpnum = parseInt(chpnum)
                    }
                    chp_SA[chpnum-1] = [speakers[i].start.properties.name, addressees[i].end.properties.name]
                }
                // init adjacency mat
                let mat = []
                for (let i = 0; i < charNum; i++){
                    mat.push([])
                    for (let j = 0; j < charNum; j++){
                        mat[i][j] = 0
                    }
                }
                // if a future bug appears here, check if #addressee > #speaker
                // In addition, Genji has the most poems (225), so when the index of a spaker is identified in speakers, we search the next 250 entries for their prospective counterpart. 
                this.state.speaker.forEach(s => {
                    //for each speaker stored in this.state.speaker
                    let mat_s = chars.indexOf(s)
                    let scount = this.state.speaker.indexOf(s)
                    this.state.addressee.forEach(a => {
                        //for each addressee stored in this.state.addressee
                        let mat_a = chars.indexOf(a)
                        if (mat[mat_s][mat_a] === 0) {
                            // if the current adjmat entry for a pair of characters is 0, first find where does the speaker first appear in all the exchanges
                            let si = speakers.findIndex(e => e.start.properties.name === this.state.speaker[scount])
                            // no need to exclude si=-1 since si is indexed based on this.state.speakers 
                            // while si does not increment out of bounds of speaker list and si corresponds to the same name as the current speaker from the speaker list
                            while ((si < speakers.length) && speakers[si].start.properties.name === s) {
                                // if the addressee half of this exchange matches the this.state.addressee element being iterated through
                                if (addressees[si].end.properties.name === a) {
                                    mat[mat_s][mat_a] = 1
                                } 
                                si = si + 1
                            }
                        }
                    })
                })
                this.setState({
                    adjmat_SA: mat, 
                    chp_SA: chp_SA
                }, () => {
                    // console.log(this.state.chp_SA)
                    // console.log(this.state.chp_SA[0])
                    // console.log(this.state.chp_SA[0][0])
                    console.log('filter options set')
                })
            })
        } catch (e) {
            console.log('Error in filter: '+e)
        } finally {
            await session.close()
        }

        closeDriver()

    }

    render() {
        let updateSelectedChapter = (event) => {
            let lockChapter = event.target.value.split(' ')
            let index = (this.state.chapter.map(e => json.stringify(e))).indexOf(json.stringify(lockChapter))
            let validSpeakers, validAddressees = []
            if (index === -1) {
                validSpeakers = this.state.speaker
                validAddressees = this.state.addressee
            } else {
                validSpeakers = Array.from(new Set(this.state.chp_SA[index].map(e => e[0])))
                validAddressees = Array.from(new Set(this.state.chp_SA[index].map(e => e[1])))
                console.log(validSpeakers)
            }
            this.setState({
                selectedChapter: event.target.value.split(' ')[0], 
                speakerList: validSpeakers, 
                addresseeList: validAddressees, 
            }, 
            () => {
                console.log('selected chapter now is: ' + this.state.selectedChapter)
            })
        }
        let updateSelectedSpeaker = (event) => {
            let lockedSpeaker = event.target.value
            let index = this.state.characters.indexOf(lockedSpeaker)
            let validAddressees = []
            if (index === -1) {
                validAddressees = this.state.addressee
            } else {
                for (let j = 0; j < this.state.charNum; j++) {
                    if (this.state.adjmat_SA[index][j]) {
                        validAddressees.push(this.state.characters[j])
                    }
                }
            }
            this.setState({
                selectedSpeaker: lockedSpeaker,
                addresseeList: validAddressees, 
                // lockSpeaker: true,
            }, 
                () => {
                    console.log('selected speaker now is: ' + this.state.selectedSpeaker)
                }
            )
        }
        let updateSelectedAddressee = (event) => {
            let lockedAddressee = event.target.value
            let index = this.state.characters.indexOf(lockedAddressee)
            let validSpeakers = []
            if (index === -1) {
                validSpeakers = this.state.speaker
            } else {
                for (let j=0; j < this.state.charNum; j++) {
                    if (this.state.adjmat_SA[j][index]) {
                        validSpeakers.push(this.state.characters[j])
                    }
                }
            }
            this.setState({
                selectedAddressee: lockedAddressee,
                speakerList: validSpeakers, 
                // lockAddressee: true
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
                        onChange={updateSelectedChapter}
                        name="chapter"
                    >
                        <option value="Any">Any</option>
                        {this.state.chapterList.map((row) => <option key={row[2]}>{row[0]+' '+row[1]+' '+row[2]}</option>)}
                    </select>
                </form>
                <form>
                    <label htmlFor="speaker">Choose a speaker</label>
                    <br />
                    <select 
                        id="speaker"
                        //onClick={console.log('clicked spaker bar')}
                        onChange={updateSelectedSpeaker}
                        name="speaker"
                    >
                        <option value="Any">Any</option>
                        {this.state.speakerList.map((row) => <option key={row}>{row}</option>)}
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
                    <option value="Any">Any</option>
                    {this.state.addresseeList.map((row) => <option key={row}>{row}</option>)}
                </select>
            </form>
        </div>
        )
    }
}