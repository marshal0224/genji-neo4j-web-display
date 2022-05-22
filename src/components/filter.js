import React from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes } from '../utils'
import _ from 'lodash'

export default class Filter extends React.Component {

    constructor(props) {
        super(props)
        initDriver(this.props.uri, this.props.user, this.props.password)
        this.driver = getDriver()
        this.state = {
            // original data pulled from Neo4j
            chapters: [],
            characters: [],
            charNum: 0,
            speakers: [],
            addressees: [],
            genders: [], 
            // value for the filters
            selectedChapter: "Any",
            selectedSpeaker: "Any",
            selectedAddressee: "Any",
            selectedSpeakerGender: "Any",
            selectedAddresseeGender: "Any",
            // adjmat_SA[speaker index][addressee index] = 0 for no, 1 for yes, where index is index of character in the list of characters. Direction sensitive.
            adjmat_SA: [], 
            // chp_SA[0][0] = ['Kiritsubo Consort', 'Kiritsubo Emperor'], i.e. 01KR01 is spoken by K.C. to K.E.
            chp_SA: [],
            // lists of filter options
            chapterList: [], 
            // [['Hikaru Genji', 'male', 1] ... ] where 1 is used in the gender filter as a flag for display
            speakerList: [], 
            // [['Murasaki', 'female', 1] ... ]
            addresseeList: [],
            speakerGenderList: [],
            addresseeGenderList: [],
        }
    }

    async componentDidMount() {
        const getChp = 'match (c:Chapter) return (c) as chapters'
        const getExchange = 'match path=(c:Character)-[r:SPEAKER_OF]-(g:Genji_Poem)-[s:ADDRESSEE_OF]-(d:Character) return path'
        const getChar = 'match (c:Character) return c.name as char, c.gender as gender order by c.name'
        const session = this.driver.session()

        try {
            const resChp = await session.readTransaction(tx => tx.run(getChp))
            const resExchange = await session.readTransaction(tx => tx.run(getExchange))
            const resChar = await session.readTransaction(tx => tx.run(getChar))

            let tempChp = resChp.records.map(row => {return toNativeTypes(row.get('chapters'))}).map((chp) => chp.properties)
            let tempExchange = resExchange.records.map(row => {return toNativeTypes(row.get('path'))}).map(({segments}) => segments)
            let chars= resChar.records.map(row => {return toNativeTypes(row.get('char'))}).map(e => Object.values(e).join(''))
            let genders= resChar.records.map(row => {return toNativeTypes(row.get('gender'))}).map(e => Object.values(e).join(''))
            const charNum = chars.length // 139 as of May 18th, 2022

            let speakers = []
            let addressees = []
            let tempSpeakers = []
            let tempAddressees = []
            let chapters = []

            //speakers: [{start, relationship, end}...]    
            tempExchange.forEach(([s, a]) => {
                tempSpeakers.push(s)
                tempAddressees.push(a)
            })
            speakers = Array.from([...new Set(tempSpeakers.map(({start}) => start.properties.name))]).sort()
            addressees = Array.from([...new Set(tempAddressees.map(({end}) => end.properties.name))]).sort()
            tempChp.forEach((e) => {
                chapters.push([e.chapter_number, e.kanji, e.chapter_name])
            })
            let speakerList = []
            speakers.forEach(e => speakerList.push([e, genders[chars.indexOf(e)], 1]))
            let addresseeList = []
            addressees.forEach(e => addresseeList.push([e, genders[chars.indexOf(e)], 1]))
            //['1', '桐壺', 'Kiritsubo']
            this.setState({
                chapters: chapters,
                characters: chars,
                charNum: charNum,
                genders: genders,
                speakers: speakers,
                addressees: addressees,
                chapterList: chapters.map(e => [...e, 1]), 
                speakerList: speakerList,
                addresseeList: addresseeList,
            }, () => {
                // init chapter to speaker&addressee mapping
                let chp_SA = new Array(this.state.chapters.length)
                for (let i = 0; i < tempSpeakers.length; i++) {
                    let chpnum = tempSpeakers[i].end.properties.pnum.substring(0, 2)
                    if (chpnum.substring(0, 1) === '0') {
                        chpnum = parseInt(chpnum.substring(1, 2))
                    } else {
                        chpnum = parseInt(chpnum)
                    }
                    if (chp_SA[chpnum-1] === undefined) {
                        chp_SA[chpnum-1] = [[tempSpeakers[i].start.properties.name, tempAddressees[i].end.properties.name]]
                    } else {
                        chp_SA[chpnum-1].push([tempSpeakers[i].start.properties.name, tempAddressees[i].end.properties.name])
                    }
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
                this.state.speakers.forEach(s => {
                    //for each speaker stored in this.state.speaker
                    let mat_s = chars.indexOf(s)
                    let scount = this.state.speakers.indexOf(s)
                    this.state.addressees.forEach(a => {
                        //for each addressee stored in this.state.addressee
                        let mat_a = chars.indexOf(a)
                        if (mat[mat_s][mat_a] === 0) {
                            // if the current adjmat entry for a pair of characters is 0, first find where does the speaker first appear in all the exchanges
                            let si = tempSpeakers.findIndex(e => e.start.properties.name === this.state.speakers[scount])
                            // no need to exclude si=-1 since si is indexed based on this.state.speakers 
                            // while si does not increment out of bounds of speaker list and si corresponds to the same name as the current speaker from the speaker list
                            while ((si < speakers.length) && tempSpeakers[si].start.properties.name === s) {
                                // if the addressee half of this exchange matches the this.state.addressee element being iterated through
                                if (tempAddressees[si].end.properties.name === a) {
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
        let updateSelection = (event) => {
            let type = event.target.id
            let lockedChapter, lockedSpeaker, lockedAddressee, lockedSpeakerGender, lockedAddresseeGender
            // Remember: selected value != options
            let validSpeakers = this.state.speakerList
            let validAddressees = this.state.addresseeList
            let validChapters = this.state.chapterList
            let validSpeakerGenders = ['male','female']
            let validAddresseeGenders = ['male','female','nonhuman']
            let selectedSpeakerGender = this.state.selectedSpeakerGender
            let selectedAddresseeGender = this.state.selectedAddresseeGender
            if (type === 'chapter') {
                lockedChapter = event.target.value.split(' ')
                // if a selected value is any, remap the rest of the constraints to remove this filter's effect
                if (lockedChapter[0] === 'Any') {
                    // first determine speakers based on selected addressee
                    if (this.state.selectedAddressee === 'Any') {
                        validSpeakers = this.state.speakers.map(e => [e, this.state.genders[this.state.characters.indexOf(e)], 1])
                    } else {
                        validSpeakers = []
                        let index = this.state.characters.indexOf(this.state.selectedAddressee)
                        for (let i = 0; i < this.state.characters.length; i++) {
                            if (this.state.adjmat_SA[i][index]) {
                                validSpeakers.push(this.state.characters[i])
                            }
                        }
                        validSpeakers = validSpeakers.map(e => [e, this.state.genders[this.state.characters.indexOf(e)], 1])
                    } 
                    // vice versa for speaker
                    if (this.state.selectedSpeaker === 'Any') {
                        validAddressees = this.state.addressees.map(e => [e, this.state.genders[this.state.characters.indexOf(e)], 1])
                    } else {
                        validAddressees = []
                        let index = this.state.characters.indexOf(this.state.selectedSpeaker)
                        for (let j = 0; j < this.state.characters.length; j++) {
                            if (this.state.adjmat_SA[index][j]) {
                                validAddressees.push(this.state.characters[j])
                            }
                        }
                        validAddressees = validAddressees.map(e => [e, this.state.genders[this.state.characters.indexOf(e)], 1])
                    }
                }
                // if a filter has a specific selected option, update the constraints on other filters
                else {
                    // speaker
                    let index = parseInt(lockedChapter[0]) - 1
                    if (this.state.selectedAddressee === 'Any') {
                        validSpeakers = new Set()
                        this.state.chp_SA[index].forEach(pair => validSpeakers.add(pair[0]))
                        validSpeakers = Array.from(validSpeakers).sort().map(e => [e, this.state.genders[this.state.characters.indexOf(e)], 1])
                    } else {
                        validSpeakers = new Set()
                        this.state.chp_SA[index].forEach(pair => {
                            if (pair[1] === this.state.selectedAddressee) {
                                validSpeakers.add(pair[0])
                            }
                        })
                        validSpeakers = Array.from(validSpeakers).sort().map(e => [e, this.state.genders[this.state.characters.indexOf(e)], 1])
                    }
                    // addressee
                    if (this.state.selectedSpeaker === 'Any') {
                        validAddressees = new Set()
                        this.state.chp_SA[index].forEach(pair => validAddressees.add(pair[1]))
                        validAddressees = Array.from(validAddressees).sort().map(e => [e, this.state.genders[this.state.characters.indexOf(e)], 1])
                    } else {
                        validAddressees = new Set()
                        this.state.chp_SA[index].forEach(pair => {
                            if (pair[0] === this.state.selectedSpeaker) {
                                validAddressees.add(pair[1])
                            }
                        })
                        validAddressees = Array.from(validAddressees).sort().map(e => [e, this.state.genders[this.state.characters.indexOf(e)], 1])
                    }
                }
            } else if (type === 'speakerGender') {
                lockedSpeakerGender = event.target.value
                if (lockedSpeakerGender === "Any") {
                    for (let i = 0; i < validSpeakers.length; i++) {
                            validSpeakers[i][2] = 1
                    }
                    for (let i = 0; i < validAddressees.length; i++) {
                        validAddressees[i][2] = 1
                    }
                    for (let i = 0; i < validChapters.length; i++) {
                        validChapters[i][validChapters[i].length-1] = 1
                    }
                } else {
                    for (let i = 0; i < validSpeakers.length; i++) {
                        if (validSpeakers[i][1] !== lockedSpeakerGender) {
                            validSpeakers[i][2] = 0
                        }
                        else {
                            validSpeakers[i][2] = 1
                        }
                    }
                    validAddressees.forEach(addr => {
                        let a = this.state.characters.indexOf(addr[0])
                        validSpeakers.every(spkr => {
                            if (!this.state.adjmat_SA[this.state.characters.indexOf(spkr[0])][a]) {
                                validAddressees[validAddressees.indexOf(addr)][2] = 0
                                return false
                            }
                        })
                    })
                    validAddresseeGenders = Array.from(new Set(validAddressees.filter(row => row[2]).map(addr => addr[1])))
                    validChapters.forEach(chp => {
                        let count = 0
                        let emptyls = [42, 43, 44]
                        if (!emptyls.includes(parseInt(chp[0]))) {
                            let exchanges = this.state.chp_SA[parseInt(chp[0])-1]
                            for (let i= 0; i < exchanges.length; i++) {
                                let sg = this.state.genders[this.state.characters.indexOf(exchanges[i][0])]
                                let ag = this.state.genders[this.state.characters.indexOf(exchanges[i][1])]
                                if (sg === lockedSpeakerGender && validAddresseeGenders.includes(ag)) {
                                    count = 1
                                    break
                                }
                            }
                        }
                        if (!count) {
                            let rm = validChapters.indexOf(chp)
                            validChapters[rm][validChapters[rm].length-1] = 0
                        }
                    })
                    // remove after entering the missing chapters
                    validChapters.forEach(chp => {
                        if (parseInt(chp[0]) === 43){
                            let rm = validChapters.indexOf(chp)
                            validChapters.splice(rm, 1)
                        }
                    })
                }
            } else if (type === 'speaker') {
                lockedSpeaker = event.target.value
                if (lockedSpeaker === 'Any') {
                    if (this.state.selectedAddressee === 'Any') {
                        validChapters = this.state.chapters.map(e => [e, 1])
                    } else {
                        // chapters are pushed in order so no need to sort
                        validChapters = []
                        for (let i = 0; i < 54; i++) {
                            if (this.state.chp_SA[i] !== undefined) {
                                for (let j = 0; j < this.state.chp_SA[i].length; j++) {
                                    if (this.state.chp_SA[i][j][1] === this.state.selectedAddressee) {
                                        validChapters.push(this.state.chapters[i], 1)
                                        break
                                    }
                                }
                            }
                        }
                    }
                    if (this.state.selectedChapter === 'Any') {
                        validAddressees = this.state.addressees.map(e => [e, this.state.genders[this.state.characters.indexOf(e)], 1])
                    } else {
                        validAddressees = Array.from(new Set(this.state.chp_SA[parseInt(this.state.selectedChapter)-1].map(pair => pair[1]))).sort().map(e => [e, this.state.genders[this.state.characters.indexOf(e)], 1])
                    }
                } 
                // if we have a speaker selected
                else {
                    if (this.state.selectedAddressee === 'Any') {
                        validChapters = []
                        for (let i = 0; i < 54; i++) {
                            if (this.state.chp_SA[i] !== undefined) {
                                for (let j = 0; j < this.state.chp_SA[i].length; j++) {
                                    if (this.state.chp_SA[i][j][0] === lockedSpeaker) {
                                        validChapters.push([this.state.chapters[i], 1])
                                        break
                                    }
                                }
                            }
                        }
                    } else {
                        validChapters = []
                        for (let i = 0; i < 54; i++) {
                            if (this.state.chp_SA[i] !== undefined) {
                                for (let j = 0; j < this.state.chp_SA[i].length; j++) {
                                    if (JSON.stringify(this.state.chp_SA[i][j]) === JSON.stringify([lockedSpeaker, this.state.selectedAddressee])) {
                                        validChapters.push([this.state.chapters[i], 1])
                                        break
                                    }
                                }
                            }
                        }
                    }
                    if (this.state.selectedChapter === 'Any') {
                        validAddressees = []
                        this.state.adjmat_SA[this.state.characters.indexOf(lockedSpeaker)].forEach((value, i) => {
                            if (value) {
                                validAddressees.push(this.state.characters[i])
                            }
                        })
                        validAddressees = validAddressees.map(e => [e, this.state.genders[this.state.characters.indexOf(e)], 1])
                    } else {
                        validAddressees = new Set()
                        this.state.chp_SA[parseInt(this.state.selectedChapter)-1].forEach(pair => {
                            if (pair[0] === lockedSpeaker){
                                validAddressees.add(pair[1])
                            }
                        })
                        validAddressees = Array.from(validAddressees).sort().map(e => [e, this.state.genders[this.state.characters.indexOf(e)], 1])
                    }
                }
            } else if (type === 'addresseeGender') {
                lockedAddresseeGender = event.target.value
                if (lockedAddresseeGender === "Any") {
                    for (let i = 0; i < validSpeakers.length; i++) {
                            validSpeakers[i][2] = 1
                    }
                    for (let i = 0; i < validAddressees.length; i++) {
                        validAddressees[i][2] = 1
                    }
                    for (let i = 0; i < validChapters.length; i++) {
                        console.log(validChapters[i])
                        validChapters[i][validChapters[i].length-1] = 1
                    }
                } else {
                    for (let i = 0; i < validAddressees.length; i++) {
                        if (validAddressees[i][1] !== lockedAddresseeGender) {
                            validAddressees[i][2] = 0
                        }
                        else {
                            validAddressees[i][2] = 1
                        }
                    }
                    validAddressees.forEach(addr => {
                        validSpeakers.every(spkr => {
                            let s = this.state.characters.indexOf(spkr[0])
                            if (!this.state.adjmat_SA[s][this.state.characters.indexOf(addr[0])]) {
                                validSpeakers[validSpeakers.indexOf(spkr)][2] = 0
                                return false
                            }
                        })
                    })
                    validSpeakerGenders = Array.from(new Set(validSpeakers.filter(row => row[2]).map(spkr => spkr[1])))
                    validChapters.forEach(chp => {
                        let count = 0
                        let emptyls = [42, 43, 44]
                        if (!emptyls.includes(parseInt(chp[0]))) {
                            let exchanges = this.state.chp_SA[parseInt(chp[0])-1]
                            for (let i= 0; i < exchanges.length; i++) {
                                let sg = this.state.genders[this.state.characters.indexOf(exchanges[i][0])]
                                let ag = this.state.genders[this.state.characters.indexOf(exchanges[i][1])]
                                if (ag === lockedAddresseeGender && validSpeakerGenders.includes(sg)) {
                                    count = 1
                                    break
                                }
                            }
                        }
                        if (!count) {
                            let rm = validChapters.indexOf(chp)
                        validChapters[rm][validChapters[rm].length-1] = 0
                        }
                    })
                    // remove after entering the missing chapters
                    validChapters.forEach(chp => {
                        if (parseInt(chp[0]) === 43){
                            let rm = validChapters.indexOf(chp)
                            validChapters.splice(rm, 1)
                        }
                    })
                }
            } else {
                // when the addressee filter is changed
                lockedAddressee = event.target.value
                if (lockedAddressee === 'Any') {
                    if (this.state.selectedSpeaker === 'Any') {
                        validChapters = this.state.chapters.map(row => [row, 1])
                    } else {
                        // chapters are pushed in order so no need to sort
                        validChapters = []
                        for (let i = 0; i < 54; i++) {
                            if (this.state.chp_SA[i] !== undefined) {
                                for (let j = 0; j < this.state.chp_SA[i].length; j++) {
                                    if (this.state.chp_SA[i][j][0] === this.state.selectedSpeaker) {
                                        validChapters.push([this.state.chapters[i], 1])
                                        break
                                    }
                                }
                            }
                        }
                    }
                    if (this.state.selectedChapter === 'Any') {
                        validSpeakers = this.state.speakers.map(e => [e, this.state.genders[this.state.characters.indexOf(e)], 1])
                    } else {
                        validSpeakers = Array.from(new Set(this.state.chp_SA[parseInt(this.state.selectedChapter)-1].map(pair => pair[0]))).sort().map(e => [e, this.state.genders[this.state.characters.indexOf(e)], 1])
                    }
                }
                // if we have an addressee selected
                else {
                    if (this.state.selectedSpeaker === 'Any') {
                        validChapters = []
                        for (let i = 0; i < 54; i++) {
                            if (this.state.chp_SA[i] !== undefined) {
                                for (let j = 0; j < this.state.chp_SA[i].length; j++) {
                                    if (this.state.chp_SA[i][j][1] === lockedAddressee) {
                                        validChapters.push([this.state.chapters[i], 1])
                                        break
                                    }
                                }
                            }
                        }
                    } else {
                        validChapters = []
                        for (let i = 0; i < 54; i++) {
                            if (this.state.chp_SA[i] !== undefined) {
                                for (let j = 0; j < this.state.chp_SA[i].length; j++) {
                                    if (JSON.stringify(this.state.chp_SA[i][j]) === JSON.stringify([this.state.selectedSpeaker, lockedAddressee])) {
                                        validChapters.push([this.state.chapters[i], i])
                                        break
                                    }
                                }
                            }
                        }
                    }
                    if (this.state.selectedChapter === 'Any') {
                        validSpeakers = new Set()
                        console.log(_.unzip(this.state.adjmat_SA)[this.state.characters.indexOf(lockedAddressee)])
                        _.unzip(this.state.adjmat_SA)[this.state.characters.indexOf(lockedAddressee)].forEach((value, i) => {
                            if (value) {
                                validSpeakers.add(this.state.characters[i])
                            }
                        })
                        validSpeakers = Array.from(validSpeakers).map(e => [e, this.state.genders[this.state.characters.indexOf(e)], 1])
                    } else {
                        validSpeakers = new Set()
                        this.state.chp_SA[parseInt(this.state.selectedChapter)-1].forEach(pair => {
                            if (pair[1] === lockedAddressee){
                                validSpeakers.add(pair[0])
                            }
                        })
                        validSpeakers = Array.from(validSpeakers).sort().map(e => [e, this.state.genders[this.state.characters.indexOf(e)], 1])
                    }
                }
                // update display based on the gender filters
                if (selectedSpeakerGender !== 'Any') {
                    validSpeakers.filter(e => e[1] !== selectedSpeakerGender).forEach(row =>row[row.length-1] = 0)
                }
                if (selectedAddresseeGender !== 'Any') {
                    validSpeakers.filter(e => e[1] !== selectedAddresseeGender).forEach(row => row[row.length-1] = 0)
                }
            }
            this.setState({
                chapterList: validChapters,
                speakerList: validSpeakers,
                addresseeList: validAddressees,
                speakerGenderList: validSpeakerGenders,
                speakerAddresseeList: validAddresseeGenders,
            }, 
            () => {
                console.log(this.state.speakerList)
                switch (type) {
                    case 'chapter':
                        this.setState({
                            selectedChapter: lockedChapter[0],
                        }, () => {
                            console.log(this.state.speakerList)
                            console.log('selections set')
                        }) 
                        break
                    case 'speaker':
                        this.setState({
                            selectedSpeaker: lockedSpeaker,
                        }, () => {
                            console.log(this.state.speakerList)
                            console.log('selections set')
                        }) 
                        break
                    case 'addressee':
                        this.setState({
                            selectedAddressee: lockedAddressee,
                        }, () => {
                            console.log('selections set')
                        }) 
                        break
                    case 'speakerGender':
                            this.setState({
                                selectedSpeakerGender: lockedSpeakerGender,
                            }, () => {
                                console.log('selections set')
                            }) 
                            break
                    case 'addresseeGender':
                                this.setState({
                                    selectedAddresseeGender: lockedAddresseeGender,
                                }, () => {
                                    console.log('selections set')
                                }) 
                                break
                    default:
                        console.log('unknown select type caught')
                }
            })
        }
        return (
            <div>
                <form>
                    <label htmlFor="chapter">Choose a chapter</label>
                    <br />
                    <select 
                        id="chapter"
                        value={this.state.selectedChapter}
                        onChange={updateSelection}
                        name="chapter"
                    >
                        <option value="Any">Any</option>
                        {this.state.chapterList.filter(row => row[row.length-1]).map((row) => <option key={row[0]} value={row[0]}>{row[0]+' '+row[1]+' '+row[2]}</option>)}
                    </select>
                </form>
                <form>
                    <label htmlFor="speakerGender">Speaker's gender</label>
                    <br />
                    <select 
                        id="speakerGender"
                        //value={formData.speaker}
                        onChange={updateSelection}
                        name="speakerGender"
                    >
                        <option value="Any">Any</option>
                        <option value="male">male</option>
                        <option value="female">female</option>
                    </select>
                </form>
                <form>
                    <label htmlFor="speaker">Choose a speaker</label>
                    <br />
                    <select 
                        id="speaker"
                        value={this.state.selectedSpeaker}
                        onChange={updateSelection}
                        name="speaker"
                    >
                        <option value="Any">Any</option>
                        {this.state.speakerList.filter(row => row[2]).map(row => <option key={row[0]+'_s'} value={row[0]}>{row[0]}</option>)}
                    </select>
                </form>
                <form>
                    <label htmlFor="addresseeGender">Addressee's gender</label>
                    <br />
                    <select 
                        id="addresseeGender"
                        //value={formData.speaker}
                        onChange={updateSelection}
                        name="addresseeGender"
                    >
                        <option value="Any">Any</option>
                        <option value="male">male</option>
                        <option value="female">female</option>
                        <option value="nonhuman">nonhuman</option>
                    </select>
                </form>
                <form>
                <label htmlFor="addressee">Choose an addressee</label>
                <br />
                <select 
                    id="addressee"
                    //value={formData.speaker}
                    onChange={updateSelection}
                    name="addressee"
                >
                    <option value="Any">Any</option>
                    {this.state.addresseeList.filter(row => row[2]).map((row) => <option key={row[0]+'_a'}>{row[0]}</option>)}
                </select>
            </form>
        </div>
        )
    }
}