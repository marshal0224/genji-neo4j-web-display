import React from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes } from '../utils'
import _ from 'lodash'

export default class Search extends React.Component {
    Graph = require("graph-data-structure")
    constructor(props) {
        super(props)
        this.state = {
            // original data pulled from Neo4j
            chapters: [],
            characters: [],
            charNum: 0,
            speakers: [],
            addressees: [],
            genders: [], 
            // values of the filters
            selectedChapter: "Any",
            selectedSpeaker: "Any",
            selectedAddressee: "Any",
            selectedSpeakerGender: "Any",
            selectedAddresseeGender: "Any",
            // A Graph of all options
            graph: this.Graph(),
            speakerGenderList: ['male', 'female'],
            addresseeGenderList: ['male', 'female', 'multiple', 'nonhuman'],
            backup: [],
        }
        this.uri = process.env.REACT_APP_NEO4J_URI
        this.user = process.env.REACT_APP_NEO4J_USERNAME
        this.password = process.env.REACT_APP_NEO4J_PASSWORD
        this.resetFilters = this.resetFilters.bind(this)
    }

    async componentDidMount() {
        initDriver(this.uri, this.user, this.password)
        const driver = getDriver()
        const session = driver.session()
        console.log('40')
        let query = 'match (g:Genji_Poem), exchange=(s:Character)-[:SPEAKER_OF]-(g:Genji_Poem)-[:ADDRESSEE_OF]-(a:Character) return g.pnum as pnum, exchange'
        let res = await session.readTransaction(tx => tx.run(query))
        let pnum = res.records.map(row => {return toNativeTypes(row.get('pnum'))})
        // chp_poem = chp_poem.map(row => [row[0].start.properties.chapter_number, row[0].end.properties.pnum])
        let exchange = res.records.map(row => {return toNativeTypes(row.get('exchange'))})
        console.log(chp_poem)
        session.close()
        closeDriver()
    }

    async componentDidUpdate() {
        initDriver(this.uri, this.user, this.password)
        const driver = getDriver()
        const session = driver.session()
        console.log('53')
        let query = 'match chp_poem=(:Chapter)-[:INCLUDED_IN]-(:Genji_Poem), exchange=(:Character)-[:SPEAKER_OF]-(:Genji_Poem)-[:ADDRESSEE_OF]-(:Character) return chp_poem, exchange'
        let res = await session.readTransaction(tx => tx.run(query))
        let chp_poem = res.records.map(row => {return toNativeTypes(row.get('chp_poem'))})
        let exchange = res.records.map(row => {return toNativeTypes(row.get('exchange'))})
        console.log(chp_poem)
        session.close()
        closeDriver()
    }

    resetFilters = (event) => {
        let backup = this.state.backup
        this.setState({
            chapters: backup[0],
            characters: backup[1],
            charNum: backup[2],
            speakers: backup[4],
            addressees: backup[5],
            genders: backup[3], 
            selectedChapter: "Any",
            selectedSpeaker: "Any",
            selectedAddressee: "Any",
            selectedSpeakerGender: "Any",
            selectedAddresseeGender: "Any",
            adjmat_SA: backup[9], 
            chp_SA: backup[10],
            chapterList: backup[6], 
            speakerList: backup[7], 
            addresseeList: backup[8],
            speakerGenderList: ['male', 'female'],
            addresseeGenderList: ['male', 'female', 'nonhuman'],
        })
    }

    render() {
        const chpGen = function(list, sg, ag, chapter, exchange, genders, characters) {
            if (sg === 'Any' && ag === 'Any') {
                list.push([...chapter, 1])
            } else if (sg === 'Any' && genders[characters.indexOf(exchange[1])] === ag) {
                list.push([...chapter, 1])
            } else if (ag === 'Any' && genders[characters.indexOf(exchange[0])] === sg) {
                list.push([...chapter, 1])
            } else if (genders[characters.indexOf(exchange[0])] === sg && genders[characters.indexOf(exchange[1])] === ag) {
                list.push([...chapter, 1])
            } 
            return list
        }
        return (
            <div>
                <p>Hello world</p>
                {/* <form>
                    <label htmlFor="chapter">Chapter</label>
                    <br />
                    <select id="chapter" value={this.state.selectedChapter} onChange={updateSelection} name="chapter">
                        <option value="Any">Any</option>
                        {this.state.chapterList.filter(row => row[row.length-1]).map((row) => <option key={row[0]} value={row[0]}>{row[0]+' '+row[1]+' '+row[2]}</option>)}
                    </select>
                </form>
                <br />
                <form>
                    <label htmlFor="speakerGender">Speaker Gender</label>
                    <br />
                    <select id="speakerGender" value={this.state.selectedSpeakerGender} onChange={updateSelection} name="speakerGender">
                        <option value="Any">Any</option>
                        {this.state.speakerGenderList.map(row => <option key={row+'_sg'} value={row}>{row}</option>)}
                    </select>
                </form>
                <br />
                <form>
                    <label htmlFor="speaker">Speaker</label>
                    <br />
                    <select id="speaker" value={this.state.selectedSpeaker} onChange={updateSelection} name="speaker">
                        <option value="Any">Any</option>
                        {this.state.speakerList.filter(row => row[2]).map(row => <option key={row[0]+'_s'} value={row[0]}>{row[0]}</option>)}
                    </select>
                </form>
                <br />
                <form>
                    <label htmlFor="addresseeGender">Addressee Gender</label>
                    <br />
                    <select id="addresseeGender" value={this.state.selectedAddresseeGender} onChange={updateSelection} name="addresseeGender">
                        <option value="Any">Any</option>
                        {this.state.addresseeGenderList.map(row => <option key={row+'_ag'} value={row}>{row}</option>)}
                    </select>
                </form>
                <br />
                <form>
                <label htmlFor="addressee">Addressee</label>
                <br />
                <select id="addressee" onChange={updateSelection} name="addressee">
                    <option value="Any">Any</option>
                    {this.state.addresseeList.filter(row => row[2]).map((row) => <option key={row[0]+'_a'}>{row[0]}</option>)}
                </select>
            </form> */}
        </div>
        )
    }
}