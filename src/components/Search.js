import React from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes, getChpList } from '../utils'
import { Select } from 'antd';
import 'antd/dist/antd.css';
import _ from 'lodash'
const { Option, OptGroup } = Select;

export default class Search extends React.Component {
    Graph = require("graph-data-structure")
    constructor(props) {
        super(props)
        this.state = {
            // original data pulled from Neo4j
            chapters: Array.from(Array(54), (_,i)=> i),
            characters: [],
            // charNum: 0,
            male_speakers: [],
            female_speakers: [],
            male_addressees: [],
            female_addressees: [],
            nonhuman_addressees: [],
            multiple_addressees: [],
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
        let male_speakers = []
        let female_speakers = []
        let male_addressees = []
        let female_addressees = []
        let nonhuman_addressees = []
        let multiple_addressees = []
        console.log(exchange)
        this.state.addresseeGenderList.forEach(gender => graph.addNode(gender))
        for (let i = 0; i < exchange.length; i++) {
            let pnum = exchange[i].segments[0].end.properties.pnum
            let spkr = exchange[i].start.properties.name
            let spkr_gen = exchange[i].start.properties.gender
            let addr = exchange[i].end.properties.name
            let addr_gen = exchange[i].end.properties.gender
            if (addr === 'Attendees of the Moon Viewing Party at Katsura') {
                console.log(addr_gen)
                console.log(this.hasNode(graph, 'Attendees of the Moon Viewing Party at Katsura'))
            }
            if (!this.hasNode(graph, spkr)) {
                characters.push(spkr)
                graph.addEdge(spkr_gen, spkr)
            }
            if (!this.hasNode(graph, addr)) {
                characters.push(addr)
                graph.addEdge(addr_gen, addr)
            }
            if (!graph.hasEdge(pnum, pnum.substring(0,2))) {
                graph.addEdge(pnum, pnum.substring(0,2))
            }
            // w=3 for speaker, w=2 for addressee
            if (!graph.hasEdge(spkr, pnum, 3)) {
                graph.addEdge(spkr, pnum, 3)
            }
            graph.addEdge(addr, pnum, 2)
        }
        for (let i = 0; i < characters.length; i++) {
            let add_list = graph.adjacent(characters[i]).filter(n => graph.getEdgeWeight(characters[i], n) === 2)
            if (add_list.length > 0) {
                if (graph.hasEdge('male', characters[i])) {
                    male_addressees.push(characters[i])
                } else if (graph.hasEdge('female', characters[i])) {
                    female_addressees.push(characters[i])
                } else if (graph.hasEdge('multiple', characters[i])) {
                    multiple_addressees.push(characters[i])
                } else if (graph.hasEdge('nonhuman', characters[i])) {
                    nonhuman_addressees.push(characters[i])
                }
                // if (characters[i] === 'Cat') {
                //     console.log(graph.adjacent('nonhuman'))
                // }
            }
            let spk_list = graph.adjacent(characters[i]).filter(n => graph.getEdgeWeight(characters[i], n) === 3)
            if (spk_list.length > 0) {
                if (graph.hasEdge('male', characters[i])) {
                    male_speakers.push(characters[i])
                } else if (graph.hasEdge('female', characters[i])) {
                    female_speakers.push(characters[i])
                }
            }
        }
        // console.log(graph.adjacent('nonhuman'))
        this.setState({
            characters:characters.sort(),
            male_speakers: male_speakers.sort(), 
            female_speakers: female_speakers.sort(), 
            male_addressees: male_addressees.sort(),
            female_addressees: female_addressees.sort(),
            multiple_addressees: multiple_addressees.sort(),
            nonhuman_addressees: nonhuman_addressees.sort(),
        })
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
                <form>
                    <label>Chapter</label>
                    <br />
                    <Select 
                        open={true}
                        showSearch
                        placeholder="Select chapter(s)"
                        optionFilterProp="children"
                        filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}
                    >
                        {this.state.chapters.map(chp => <Option value={chp}>{chp+1 + ' '+getChpList()[chp]}</Option>)}
                    </Select>
                </form>
                <form>
                    <label>Speaker</label>
                    <br />
                    <Select 
                        open={true}
                        showSearch
                        placeholder="Select speaker(s)"
                        optionFilterProp="children"
                        filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}
                        // filterSort={(optionA, optionB) =>
                        //     optionA.children.toLowerCase().localeCompare(optionB.children.toLowerCase())
                        // }
                    >
                        <OptGroup label='male'>
                        {this.state.male_speakers.map(spkr => <Option value={spkr}>{spkr}</Option>)}
                        </OptGroup>
                        <OptGroup label='female'>
                        {this.state.female_speakers.map(spkr => <Option value={spkr}>{spkr}</Option>)}
                        </OptGroup>
                    </Select>
                </form>
                <form>
                    <label>Addressee</label>
                    <br />
                    <Select 
                        open={true}                        
                        showSearch
                        placeholder="Select addressee(s)"
                        optionFilterProp="children"
                        filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}
                    >
                        <OptGroup label='male'>
                        {this.state.male_addressees.map(addr => <option value={addr}>{addr}</option>)}
                        </OptGroup>
                        <OptGroup label='female'>
                        {this.state.female_addressees.map(addr => <option value={addr}>{addr}</option>)}
                        </OptGroup>
                        <OptGroup label='nonhuman'>
                        {this.state.nonhuman_addressees.map(addr => <option value={addr}>{addr}</option>)}
                        </OptGroup>
                        <OptGroup label='multiple'>
                        {this.state.multiple_addressees.map(addr => <option value={addr}>{addr}</option>)}
                        </OptGroup>
                    </Select>
                </form>
        </div>
        )
    }
}