import React from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes, getChpList } from '../utils'
import { Select } from 'antd';
import 'antd/dist/antd.min.css';
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
        this.selected = this.selected.bind(this)
        this.deselected = this.deselected.bind(this)
        this.spkrGenRef = React.createRef()
    }

    hasNode(graph, node) {
        let prev = JSON.stringify(graph.nodes())
        let after = JSON.stringify(graph.addNode(node).nodes())
        return prev === after
    }

    selected(value, Option){
        let cls = Option.className
        let graph = this.state.graph
        let male_speakers = this.state.male_speakers
        let female_speakers = this.state.female_speakers
        let male_addressees = this.state.male_addressees
        let female_addressees = this.state.female_addressees
        let nonhuman_addressees = this.state.nonhuman_addressees
        let multiple_addressees = this.state.multiple_addressees
        // if a new chapter is added, make its spkr/addr with the right gender(s) available
        if (cls === 'chp_opt') {
            let chp = value+1
            male_speakers.forEach(spkr => {
                try {
                    graph.shortestPath(spkr[0], chp)
                } catch (e) {
                    spkr[1] = 0
                }
            })
            this.setState({
                male_speakers: male_speakers
            })
        }
    }

    deselected(){}

    async componentDidMount() {
        initDriver(this.uri, this.user, this.password)
        const driver = getDriver()
        const session = driver.session()
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
        this.state.addresseeGenderList.forEach(gender => graph.addNode(gender))
        graph.addNode('soliloquies')
        for (let i = 0; i < exchange.length; i++) {
            let pnum = exchange[i].segments[0].end.properties.pnum
            let spkr = exchange[i].segments[0].start.properties.name
            let spkr_gen = exchange[i].segments[0].start.properties.gender
            let addr = exchange[i].segments[1].end.properties.name
            let addr_gen = exchange[i].segments[1].end.properties.gender
            // if (pnum === '44TA09') {
            //     console.log(pnum, spkr, addr)
            // }
            if (!this.hasNode(graph, spkr)) {
                characters.push(spkr)
                graph.addEdge(spkr_gen, spkr)
            }
            if (!this.hasNode(graph, addr)) {
                characters.push(addr)
                graph.addEdge(addr_gen, addr)
            }
            if (!graph.hasEdge(pnum, parseInt(pnum.substring(0,2)))) {
                graph.addEdge(pnum, parseInt(pnum.substring(0,2)))
            }
            // w=3 for speaker, w=2 for addressee
            if (!graph.hasEdge(spkr, pnum, 3)) {
                graph.addEdge(spkr, pnum, 3)
            }
            graph.addEdge(addr, pnum, 2)
            if (spkr === addr) {
                graph.addEdge(spkr, 'soliloquies')
            }
        }
        for (let i = 0; i < characters.length; i++) {
            let add_list = graph.adjacent(characters[i]).filter(n => graph.getEdgeWeight(characters[i], n) === 2)
            if (add_list.length === 0 && graph.hasEdge(characters[i], 'soliloquies')) {
                add_list.push(['1'])
            }
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
            }
            let spk_list = graph.adjacent(characters[i]).filter(n => graph.getEdgeWeight(characters[i], n) === 3)
            if (spk_list.length === 0 && graph.hasEdge(characters[i], 'soliloquies')) {
                spk_list.push(['1'])
            }
            if (spk_list.length > 0) {
                if (graph.hasEdge('male', characters[i])) {
                    male_speakers.push(characters[i])
                } else if (graph.hasEdge('female', characters[i])) {
                    female_speakers.push(characters[i])
                }
            }
        }
        this.setState({
            characters:characters.sort().map(e => [e, 1]),
            male_speakers: male_speakers.sort().map(e => [e, 1]), 
            female_speakers: female_speakers.sort().map(e => [e, 1]), 
            male_addressees: male_addressees.sort().map(e => [e, 1]),
            female_addressees: female_addressees.sort().map(e => [e, 1]),
            multiple_addressees: multiple_addressees.sort().map(e => [e, 1]),
            nonhuman_addressees: nonhuman_addressees.sort().map(e => [e, 1]),
            graph: graph,
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
                        style={{ width:200 }}
                        mode={'tags'}
                        open={true}
                        showSearch
                        placeholder="Select chapter(s)"
                        onSelect={this.selected}
                        defaultValue={'any'}
                    >
                        <Option className={'chp_opt'} value='any'>Any</Option>
                        {this.state.chapters.map(chp => <Option className={'chp_opt'} value={chp}>{chp+1 + ' '+getChpList()[chp]}</Option>)}
                    </Select>
                </form>
                <form>
                    <label>Speaker</label>
                    <br />
                    <Select 
                        style={{ width:200 }}
                        mode={'tags'}
                        open={true}
                        showSearch
                        placeholder="Select speaker(s)"
                        defaultValue={'anygen'}
                    >
                        <OptGroup label='gender'>
                            <Option className={'spkr_opt'} value='anygen'>Any gender</Option>
                            {this.state.speakerGenderList.map(gen => <Option className={'spkr_opt'} value={gen}>{gen}</Option>)}
                        </OptGroup>
                        <OptGroup label='male'>value
                        {this.state.male_speakers.map(spkr => <Option className={'spkr_opt'} value={spkr[0]} disabled={!spkr[1]}>{spkr[0]}</Option>)}
                        </OptGroup>
                        <OptGroup label='female'>
                        {this.state.female_speakers.map(spkr => <Option className={'spkr_opt'} value={spkr[0]} disabled={!spkr[1]}>{spkr[0]}</Option>)}
                        </OptGroup>
                    </Select>
                </form>
                <form>
                    <label>Addressee</label>
                    <br />
                    <Select 
                        style={{ width:200 }}
                        mode={'tags'}
                        open={true}                        
                        showSearch
                        placeholder="Select addressee(s)"
                        defaultValue={'anygen'}
                    >
                        <OptGroup label='gender'>
                            <Option className={'addr_opt'} value='anygen'>Any gender</Option>
                            {this.state.addresseeGenderList.map(gen => <Option className={'addr_opt'} value={gen}>{gen}</Option>)}
                        </OptGroup>
                        <OptGroup label='male'>
                        {this.state.male_addressees.map(addr => <Option className={'addr_opt'} value={addr[0]} disabled={!addr[1]}>{addr[0]}</Option>)}
                        </OptGroup>
                        <OptGroup label='female'>
                        {this.state.female_addressees.map(addr => <Option className={'addr_opt'} value={addr[0]} disabled={!addr[1]}>{addr[1]}</Option>)}
                        </OptGroup>
                        <OptGroup label='nonhuman'>
                        {this.state.nonhuman_addressees.map(addr => <Option className={'addr_opt'} value={addr[0]} disabled={!addr[1]}>{addr[0]}</Option>)}
                        </OptGroup>
                        <OptGroup label='multiple'>
                        {this.state.multiple_addressees.map(addr => <Option className={'addr_opt'} value={addr} disabled={!addr[1]}>{addr[0]}</Option>)}
                        </OptGroup>
                    </Select>
                </form>
        </div>
        )
    }
}