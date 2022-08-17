import React from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes, getChpList } from '../utils'
import { Select } from 'antd';
import 'antd/dist/antd.css';
import _ from 'lodash'
// const { Option } = Select;

export default class Search extends React.Component {
    Graph = require("graph-data-structure")
    constructor(props) {
        super(props)
        this.state = {
            // original data pulled from Neo4j
            chapters: Array.from(Array(54), (_,i)=> i),
            characters: [],
            // charNum: 0,
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
        this.hasNode = this.hasNode.bind(this)
    }

    hasNode(graph, node) {
        let prev = JSON.stringify(graph.nodes())
        let after = JSON.stringify(graph.addNode(node).nodes())
        return prev === after
    }

    async componentDidMount() {
        initDriver(this.uri, this.user, this.password)
        const driver = getDriver()
        const session = driver.session()
        console.log('40')
        let query = 'match exchange=(s:Character)-[:SPEAKER_OF]-(g:Genji_Poem)-[:ADDRESSEE_OF]-(a:Character) return exchange'
        let res = await session.readTransaction(tx => tx.run(query))
        let exchange = res.records.map(row => {return toNativeTypes(row.get('exchange'))})
        let graph = this.Graph()
        let characters = []
        let speakers = []
        let addressees = []
        this.state.addresseeGenderList.forEach(gender => graph.addNode(gender))
        for (let i = 0; i < exchange.length; i++) {
            let pnum = exchange[i].segments[0].end.properties.pnum
            let spkr = exchange[i].start.properties.name
            let spkr_gen = exchange[i].start.properties.gender
            let addr = exchange[i].end.properties.name
            let addr_gen = exchange[i].end.properties.gender
            if (!this.hasNode(graph, spkr)) {
                characters.push(spkr)
                graph.addEdge(spkr_gen, spkr)
            }
            if (!this.hasNode(graph, addr)) {
                characters.push(addr)
                graph.addEdge(addr_gen, spkr)
            }
            if (!graph.hasEdge(pnum, pnum.substring(0,2))) {
                graph.addEdge(pnum, pnum.substring(0,2))
            }
            // w=2 for speaker, w=1 for addressee
            if (!graph.hasEdge(spkr, pnum, 2)) {
                graph.addEdge(spkr, pnum, 2)
            }
            graph.addEdge(addr, pnum, 1)
        }
        for (let i = 0; i < characters.length; i++) {
            let add_list = graph.adjacent(characters[i]).filter(n => graph.getEdgeWeight(characters[i], n) === 1)
            if (add_list.length > 0) {
                addressees.push(characters[i])
            }
            let spk_list = graph.adjacent(characters[i]).filter(n => graph.getEdgeWeight(characters[i], n) === 2)
            if (spk_list.length > 0) {
                speakers.push(characters[i])
            }
        }
        // console.log(addressees.sort())
        session.close()
        closeDriver()
    }

    // async componentDidUpdate() {
    //     initDriver(this.uri, this.user, this.password)
    //     const driver = getDriver()
    //     const session = driver.session()
    //     console.log('53')
    //     let query = 'match chp_poem=(:Chapter)-[:INCLUDED_IN]-(:Genji_Poem), exchange=(:Character)-[:SPEAKER_OF]-(:Genji_Poem)-[:ADDRESSEE_OF]-(:Character) return chp_poem, exchange'
    //     let res = await session.readTransaction(tx => tx.run(query))
    //     let chp_poem = res.records.map(row => {return toNativeTypes(row.get('chp_poem'))})
    //     let exchange = res.records.map(row => {return toNativeTypes(row.get('exchange'))})
    //     console.log(chp_poem)
    //     session.close()
    //     closeDriver()
    // }

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
        return (
            <div>
                {/* <p>Hello world</p> */}
                <form>
                    <label htmlFor="chapter">Chapter</label>
                    <br />
                    <Select 
                        style={{ width:220 }}
                        showSearch
                        placeholder="Select a person"
                        optionFilterProp="children"
                        filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}
                    >
                        {this.state.chapters.map(chp => <option value={chp}>{chp+1 + ' '+getChpList()[chp]}</option>)}
                        {/* <option value="tom">Tom</option> */}
                    </Select>
                </form>
                {/* <br />
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