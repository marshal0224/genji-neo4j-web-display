import React from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes, getChpList } from '../utils'
import { Select, Checkbox, Col, Row } from 'antd';
import 'antd/dist/antd.min.css';
// import _ from 'lodash'
const { Option, OptGroup } = Select;
const CheckboxGroup = Checkbox.Group;

export default class Search extends React.Component {
    Graph = require("graph-data-structure")
    constructor(props) {
        super(props)
        this.state = {
            // original data pulled from Neo4j
            chapters: Array.from(Array(54), (_,i)=> i).map(e => e+1),
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
            selectedChapter: [],
            selectedSpeaker: [],
            selectedAddressee: [],
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
        this.handleChpChange = this.handleChpChange.bind(this)
        this.updateCharacters = this.updateCharacters.bind(this)
    }

    hasNode(graph, node) {
        let prev = JSON.stringify(graph.nodes())
        let after = JSON.stringify(graph.addNode(node).nodes())
        return prev === after
    }

    handleChpChange(value) {
        this.setState({
            selectedChapter: value,
        })
    }

    updateCharacters(chars, graph, flag, chp) {
        // flag should be false for select, true for deselect
        chars.filter(e => e[1] == flag).forEach(char => {
            let selectedChp = this.state.selectedChapter
            selectedChp.splice(this.state.selectedChapter.indexOf(chp), 1)
            try {
                graph.shortestPath(char[0], chp)
                selectedChp = selectedChp.map(sc => graph.lowestCommonAncestors(char[0], sc)[0] === sc)
                if (!selectedChp.includes(true)) {
                    char[1] = !flag
                }
            } catch(e) {}
        })
        return chars
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
            let chp = value
            male_speakers = this.updateCharacters(male_speakers, graph, false, chp)
            female_speakers = this.updateCharacters(female_speakers, graph, false, chp)
            male_addressees = this.updateCharacters(male_addressees, graph, false, chp)
            female_addressees = this.updateCharacters(female_addressees, graph, false, chp)
            nonhuman_addressees = this.updateCharacters(nonhuman_addressees, graph, false, chp)
            multiple_addressees = this.updateCharacters(multiple_addressees, graph, false, chp)
            this.setState({
                male_speakers: male_speakers,
                female_speakers: female_speakers,
                male_addressees: male_addressees,
                female_addressees: female_addressees,
                nonhuman_addressees: nonhuman_addressees,
                multiple_addressees: multiple_addressees,
            })
        }
    }

    deselected(value, Option){
        let cls = Option.className
        let graph = this.state.graph
        let male_speakers = this.state.male_speakers
        let female_speakers = this.state.female_speakers
        let male_addressees = this.state.male_addressees
        let female_addressees = this.state.female_addressees
        let nonhuman_addressees = this.state.nonhuman_addressees
        let multiple_addressees = this.state.multiple_addressees
        // console.log(selectedChp)
        // if a chapter is removed, make its spkr/addr unavailable
        if (cls === 'chp_opt') {
            if (value === 'anychp') {
                male_speakers = male_speakers.map(e => [e[0], 0])
                female_speakers = female_speakers.map(e => [e[0], 0])
                male_addressees = male_addressees.map(e => [e[0], 0])
                female_addressees = female_addressees.map(e => [e[0], 0])
                nonhuman_addressees = nonhuman_addressees.map(e => [e[0], 0])
                multiple_addressees = multiple_addressees.map(e => [e[0], 0])
            } else {
                let chp = value
                male_speakers = this.updateCharacters(male_speakers, graph, true, chp)
                female_speakers = this.updateCharacters(female_speakers, graph, true, chp)
                male_addressees = this.updateCharacters(male_addressees, graph, true, chp)
                female_addressees = this.updateCharacters(female_addressees, graph, true, chp)
                nonhuman_addressees = this.updateCharacters(nonhuman_addressees, graph, true, chp)
                multiple_addressees = this.updateCharacters(multiple_addressees, graph, true, chp)
            }
            this.setState({
                male_speakers: male_speakers,
                female_speakers: female_speakers,
                male_addressees: male_addressees,
                female_addressees: female_addressees,
                nonhuman_addressees: nonhuman_addressees,
                multiple_addressees: multiple_addressees,
            })
        }
    }

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
                        onDeselect={this.deselected}
                        onChange={this.handleChpChange}
                        defaultValue={'anychp'}
                    >
                        <Option className={'chp_opt'} value='anychp'>Any</Option>
                        {this.state.chapters.map(chp => <Option className={'chp_opt'} value={chp}>{chp + ' '+getChpList()[chp-1]}</Option>)}
                    </Select>
                </form>
                <form>
                    {/* <Checkbox checked={true}>Male</Checkbox>
                    <Checkbox checked={true}>Female</Checkbox> */}
                    <CheckboxGroup options={this.state.speakerGenderList} defaultValue={this.state.speakerGenderList}/>
                    <br />
                    <Select 
                        style={{ width:200 }}
                        mode={'tags'}
                        open={true}
                        showSearch
                        placeholder="Select speaker(s)"
                    >
                        <OptGroup label='male'>value
                        {this.state.male_speakers.map(spkr => <Option className={'spkr_opt'} value={spkr[0]} disabled={!spkr[1]}>{spkr[0]}</Option>)}
                        </OptGroup>
                        <OptGroup label='female'>
                        {this.state.female_speakers.map(spkr => <Option className={'spkr_opt'} value={spkr[0]} disabled={!spkr[1]}>{spkr[0]}</Option>)}
                        </OptGroup>
                    </Select>
                </form>
                <form>
                    <CheckboxGroup defaultValue={this.state.addresseeGenderList}>
                        <Row justify="space-between">
                            <Col>
                                <Checkbox value={'male'}>male</Checkbox>
                            </Col>
                            <Col>
                                <Checkbox value={'female'}>female</Checkbox>
                            </Col>
                        </Row>
                        <Row justify="space-between">
                            <Col>
                                <Checkbox value={'nonhuman'}>nonhuman</Checkbox>
                            </Col>
                            <Col>
                                <Checkbox value={'multiple'}>multiple</Checkbox>
                            </Col>
                        </Row>
                    </CheckboxGroup>
                    <br />
                    <Select 
                        style={{ width:200 }}
                        mode={'tags'}
                        open={true}                        
                        showSearch
                        placeholder="Select addressee(s)"
                    >
                        <OptGroup label='male'>
                        {this.state.male_addressees.map(addr => <Option className={'addr_opt'} value={addr[0]} disabled={!addr[1]}>{addr[0]}</Option>)}
                        </OptGroup>
                        <OptGroup label='female'>
                        {this.state.female_addressees.map(addr => <Option className={'addr_opt'} value={addr[0]} disabled={!addr[1]}>{addr[0]}</Option>)}
                        </OptGroup>
                        <OptGroup label='nonhuman'>
                        {this.state.nonhuman_addressees.map(addr => <Option className={'addr_opt'} value={addr[0]} disabled={!addr[1]}>{addr[0]}</Option>)}
                        </OptGroup>
                        <OptGroup label='multiple'>
                        {this.state.multiple_addressees.map(addr => <Option className={'addr_opt'} value={addr[0]} disabled={!addr[1]}>{addr[0]}</Option>)}
                        </OptGroup>
                    </Select>
                </form>
        </div>
        )
    }
}