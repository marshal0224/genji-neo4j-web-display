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
            speaker: [],
            addressee: [],
            gender: [], 
            selectedChapter: "",
            selectedSpeaker: "Any",
            selectedAddressee: "Any",
            adjmat_sa: [], 
            lockChapter: false,
            lockSpeaker: false,
            lockAddressee: false,
        }
    }

    async componentDidMount() {
        const getChp = 'match (c:Chapter) return (c) as chapters'
        const getExchange = 'match path=(c:Character)-[r:SPEAKER_OF]-(j:Japanese)-[s:ADDRESSEE_OF]-(d:Character) return path'

        const session = this.driver.session()

        try {
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

            this.setState({
                chapter: chapters,
                speaker: Array.from([...new Set(speakers.map(({start}) => start.properties.name))]).sort(),
                        //pnum: zeros.map(({start}) => start.properties.name),
                addressee: Array.from([...new Set(addressees.map(({end}) => end.properties.name))]).sort(),
            }, () => {
                //init adjacency mat
                let width = this.state.speaker.length
                let mat = []
                for (let i = 0; i < width; i++){
                    mat.push([])
                    for (let j = 0; j < width; j++){
                        mat[i][j] = 0
                    }
                }
                this.setState({
                    adjmat_sa: mat
                }, () => {
                    console.log('filter options set')
                    function addEdge(vertex1, vertex2, weight = 1) {
                        if (vertex1 > this.size - 1 || vertex2 > this.size - 1) {
                            console.log('invalid vertex');
                        } else if (vertex1 === vertex2) {
                            console.log('same vertex');
                        } else {
                            this.matrix[vertex1][vertex2] = weight;
                            this.matrix[vertex2][vertex1] = weight;
                        }
                    }
                    //if a future bug appears here, check if #addressee > #speaker
                    this.state.speaker.forEach(s => {
                        let scount = this.state.speaker.indexOf(s)
                        this.state.addressee.forEach(a => {
                            let acount = this.state.speaker.indexOf(a)
                            if (!this.state.adjmat_sa[scount][acount]) {
                                speakers.findIndex(({ start }) => start.properties.description)
                            }
                        })
                    })
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
                        <option value="">Any</option>
                        {this.state.chapter.map((row) => <option key={row[2]}>{row[0]+' '+row[1]+' '+row[2]}</option>)}
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
                        <option value="">Any</option>
                        {this.state.speaker.map((row) => <option key={row}>{row}</option>)}
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
                    {this.state.addressee.map((row) => <option key={row}>{row}</option>)}
                </select>
            </form>
        </div>
        )
    }
}