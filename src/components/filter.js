import React from 'react'
//import {  } from '../neo4j'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes } from '../utils'
import { Dropdown } from 'rsuite'

export default class Filter extends React.Component {

    //driver

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
            lockChapter: false,
            lockSpeaker: false,
            lockAddressee: false,
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
                // console.log(this.state.speaker)
                // console.log(this.state.addressee)
                //init adjacency mat
                let mat = []
                for (let i = 0; i < charNum; i++){
                    mat.push([])
                    for (let j = 0; j < charNum; j++){
                        mat[i][j] = 0
                    }
                }
                this.setState({
                    adjmat_sa: mat
                }, () => {
                    // if a future bug appears here, check if #addressee > #speaker
                    // In addition, Genji has the most poems (225), so when the index of a spaker is identified in speakers, we search the next 250 entries for their prospective counterpart. 
                    let excount = new Set()
                    this.state.speaker.forEach(s => {
                        //for each speaker stored in this.state.speaker
                        let mat_s = chars.indexOf(s)
                        let scount = this.state.speaker.indexOf(s)
                        this.state.addressee.forEach(a => {
                            // if (scount === 0) {
                            //     console.log(a)
                            // }
                            //for each addressee stored in this.state.addressee
                            let mat_a = chars.indexOf(a)
                            if (mat[mat_s][mat_a] === 0) {
                                // if the current adjmat entry for a pair of characters is 0, first find where does the speaker first appear in all the exchanges
                                let si = speakers.findIndex(e => e.start.properties.name === this.state.speaker[scount])
                                excount.add(si)
                                // no need to exclude si=-1 since si is indexed based on this.state.speakers 
                                // while si does not increment out of bounds of speaker list and si corresponds to the same name as the current speaker from the speaker list
                                while ((si < speakers.length) && speakers[si].start.properties.name === s) {
                                    // if the addressee half of this exchange matches the this.state.addressee element being iterated through
                                    if (addressees[si].end.properties.name === a) {
                                        // if (si == 58) {
                                        // console.log(speakers[si].end.properties.pnum+' '+addressees[si].start.properties.pnum)
                                        // excount += 1
                                        // }
                                        // try {
                                        mat[mat_s][mat_a] = 1
                                        //mat[mat_a][mat_s] = 1
                                        // } catch (e){
                                        //     console.log('error while setting mat'+e+', mat_s and mat_a are '+mat_s+', '+mat_a)
                                        // }
                                        //console.log('set'+mat_s+mat_a)
                                        //break
                                    } 
                                    si = si + 1
                                }
                            }
                        })
                        // } catch (e) {
                        //     if (e != BreakException) {throw e}
                        // }
                    })
                    // for (let i = 0; i < this.state.speaker.length; i++) {
                    //     for (let j = 0; j < this.state.addressee.length; j++){
                    //         excount = excount + mat[i][j]
                    //     }
                    // }
                    // console.log('adjmat sum: '+excount)
                    // console.log(excount)
                })
                this.setState({
                    adjmat_SA: mat
                }, () => {
                    // console.log(this.state.adjmat_sa)
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

    // componentDidChange() {
    //     if (this.state.selectedSpeaker != "Any") {
    //         console.log('selected speaker is not any now')
    //     }
    // }

    render() {
        
        // if (!this.state.lockChapter && !this.state.lockSpeaker && !this.state.lockAddressee) {
        //     this.setState({
        //         adjmat_sa: mat
        //     }, () => {
        //         console.log(this.state.adjmat_sa)
        //     })
        // }
        let updateSelectedChapter = (event) => {
            this.setState({
                selectedChapter: event.target.value.split(' ')[0]
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
                lockSpeaker: true,
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
                lockAddressee: true
            }, 
                () => {
                    console.log('selected addressee now is: ' + this.state.selectedAddressee)
                }
            )
        }
        return (
            <div>
                {/* <label htmlFor="chapter">Choose a chapter:</label>
                <br />
                    <Dropdown title="chapter">
                    <Dropdown.Item>New File</Dropdown.Item>
                    {this.state.chapter.map((row) => <Dropdown.Item key={row[2]}>{row[0]+' '+row[1]+' '+row[2]}</Dropdown.Item>)}
                </Dropdown>  */}
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