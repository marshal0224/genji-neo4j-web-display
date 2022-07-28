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
            // lists of filter options. Note that the last element in each unit cell is EXCLUSIVELY for display toggle based on the gender filters, and should not be used for any other purposes. 
            chapterList: [], 
            // [['Hikaru Genji', 'male', 1] ... ] where 1 is used in the gender filter as a flag for display
            speakerList: [], 
            // [['Murasaki', 'female', 1] ... ]
            addresseeList: [],
            speakerGenderList: ['male', 'female'],
            addresseeGenderList: ['male', 'female', 'nonhuman'],
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

            //tempSpeakers: [{start, relationship, end}...]    
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
                    // let scount = this.state.speakers.indexOf(s)
                    this.state.addressees.forEach(a => {
                        //for each addressee stored in this.state.addressee
                        let mat_a = chars.indexOf(a)
                        if (mat[mat_s][mat_a] === 0) {
                            // if the current adjmat entry for a pair of characters is 0, first find where does the speaker first appear in all the exchanges
                            let ei = tempSpeakers.findIndex(e => e.start.properties.name === s)
                            // no need to exclude ei=-1 since si is indexed based on this.state.speakers 
                            // while ei does not increment out of bounds of speaker list and ei corresponds to the same name as the current speaker from the speaker list
                            while ((ei < tempSpeakers.length) && tempSpeakers[ei].start.properties.name === s) {
                                // if the addressee half of this exchange matches the this.state.addressee element being iterated through
                                if (tempAddressees[ei].end.properties.name === a) {
                                    mat[mat_s][mat_a] = 1
                                } 
                                ei = ei + 1
                            }
                        }
                    })
                    // console.log(mat.map(row => row.reduce((partialSum, a) => partialSum + a, 0)))
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
        // filter tests: 
        // for each of the following step, check if all filters update as expected:
        // 1. one filter to a value and back to any at a time
        // 2. two filters each to a value and back to any at a time
        // i.e. chp-sgen, chp-spkr, chp-agen, chp-addr, sgen-spkr, sgen-agen, sgen-addr, spkr-agen, spkr-addr, agen-addr, each done once an hit order. 
        // 3. three filters each to a value and back to any at time, do so with all orders
        // so on and so forth. A good chapter is 14 since it has a nonhuman addressee and a good number of spkr/addr overall
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
                    let index = parseInt(lockedChapter[0]) - 1
                    let chpExchanges = this.state.chp_SA[index]
                    validSpeakers = new Set()
                    // If no set addressee, then set speakers as defined by this chapter's speaker and the speaker gender
                    if (this.state.selectedAddressee === 'Any') {
                        if (selectedSpeakerGender === 'Any' && selectedAddresseeGender === 'Any') {
                            chpExchanges.forEach(e => validSpeakers.add(e[0]))
                        } else if (selectedSpeakerGender === 'Any') {
                            chpExchanges.filter(pair => {
                                let gen = this.state.genders[this.state.characters.indexOf(pair[1])]
                                if (gen === selectedAddresseeGender) {
                                    return true
                                } else return false
                            }).forEach(e => validSpeakers.add(e[0]))
                        } else if (selectedAddresseeGender === 'Any') {
                            chpExchanges.filter(pair => {
                                let gen = this.state.genders[this.state.characters.indexOf(pair[0])]
                                if (gen === selectedSpeakerGender) {
                                    return true
                                } else return false
                            }).forEach(e => validSpeakers.add(e[0]))
                        } else {
                            chpExchanges.filter(pair => {
                                let sgen = this.state.genders[this.state.characters.indexOf(pair[0])]
                                let agen = this.state.genders[this.state.characters.indexOf(pair[1])]
                                if (sgen === selectedSpeakerGender && agen === selectedAddresseeGender) {
                                    return true
                                } else return false
                            }).forEach(e => validSpeakers.add(e[0]))
                        }
                    } else {
                        if (selectedSpeakerGender === 'Any') {
                            chpExchanges.filter(pair => {
                                if (pair[1] === this.state.selectedAddressee) {
                                    return true
                                } else return false
                            }).forEach(e => validSpeakers.add(e[0]))
                        } else {
                            chpExchanges.filter(pair => {
                                let sgen = this.state.genders[this.state.characters.indexOf(pair[0])]
                                if (pair[1] === this.state.selectedAddressee && sgen === selectedSpeakerGender) {
                                    return true
                                } else return false
                            }).forEach(e => validSpeakers.add(e[0]))
                        }
                    }
                    validSpeakers = Array.from(validSpeakers).sort().map(e => [e, this.state.genders[this.state.characters.indexOf(e)], 1])
                    validAddressees = new Set()
                    if (this.state.selectedSpeaker === 'Any') {
                        this.state.chp_SA[index].forEach(pair => validAddressees.add(pair[1]))
                    } else {
                        this.state.chp_SA[index].forEach(pair => {
                            if (pair[0] === this.state.selectedSpeaker) {
                                validAddressees.add(pair[1])
                            }
                        })
                    }
                    validAddressees = Array.from(validAddressees).sort().map(e => [e, this.state.genders[this.state.characters.indexOf(e)], 1])
                    validSpeakerGenders = Array.from(new Set(chpExchanges.map(e => this.state.genders[this.state.characters.indexOf(e[0])])))
                    validAddresseeGenders = Array.from(new Set(validAddressees.map(e => e[1])))
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
                    for (let i = 0; i < validAddressees.length; i++) {
                        let chp = this.state.selectedChapter-1
                        let addr = validAddressees[i][0]
                        let addr_index = this.state.characters.indexOf(addr)
                        validAddressees[i][2] = 0
                        for (let j = 0; j < validSpeakers.filter(row => row[2]===1).length; j++) {
                            let spkr = validSpeakers.filter(row => row[2]===1)[j][0]
                            let spkr_index = this.state.characters.indexOf(spkr)
                            if (!isNaN(chp)) {
                                if (JSON.stringify(this.state.chp_SA[chp]).includes(JSON.stringify([spkr, addr]))) {
                                    validAddressees[i][2] = 1
                                    break
                                }
                            } else {
                                // when chapter is any
                                if (this.state.adjmat_SA[spkr_index][addr_index]===1) {
                                    validAddressees[i][2] = 1
                                    break
                                }
                            }
                        }
                    }
                    validAddresseeGenders = Array.from(new Set(validAddressees.filter(row => row[2]===1).map(addr => addr[1])))
                    // when male/female is specified for speaker, set chapters without that gender of speaker to not displaying.  
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
                }
            } else if (type === 'speaker') {
                lockedSpeaker = event.target.value
                if (lockedSpeaker === 'Any') {
                    // For all speaker and all addressee, all chapters should be made available
                    if (this.state.selectedAddressee === 'Any') {
                        validChapters = this.state.chapters.map(e => [...e, 1])
                    } else {
                        // chapters are pushed in order so no need to sort
                        validChapters = []
                        for (let i = 0; i < 54; i++) {
                            if (this.state.chp_SA[i] !== undefined) {
                                for (let j = 0; j < this.state.chp_SA[i].length; j++) {
                                    if (this.state.chp_SA[i][j][1] === this.state.selectedAddressee) {
                                        validChapters = chpGen(validChapters, selectedSpeakerGender, selectedAddresseeGender, this.state.chapters[i], this.state.chp_SA[i][j], this.state.genders, this.state.characters)
                                    }
                                }
                            }
                        }
                    }
                    let test = validChapters.map(e => JSON.stringify(e))
                    test= Array.from(new Set(test)).map(e => JSON.parse(e))
                    validChapters = test
                    if (this.state.selectedChapter === 'Any') {
                        validAddressees = this.state.addressees.map(e => [e, this.state.genders[this.state.characters.indexOf(e)], 1])
                    } else {
                        validAddressees = Array.from(new Set(this.state.chp_SA[parseInt(this.state.selectedChapter)-1].map(pair => pair[1]))).sort().map(e => [e, this.state.genders[this.state.characters.indexOf(e)], 1])
                    }
                } 
                // if we have a speaker selected
                else {
                    lockedSpeakerGender = this.state.genders[this.state.characters.indexOf(lockedSpeaker)]
                    if (this.state.selectedAddressee === 'Any') {
                        validChapters = []
                        for (let i = 0; i < 54; i++) {
                            if (this.state.chp_SA[i] !== undefined) {
                                for (let j = 0; j < this.state.chp_SA[i].length; j++) {
                                    if (this.state.chp_SA[i][j][0] === lockedSpeaker) {
                                        validChapters = chpGen(validChapters, selectedSpeakerGender, selectedAddresseeGender, this.state.chapters[i], this.state.chp_SA[i][j], this.state.genders, this.state.characters)
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
                                        validChapters = chpGen(validChapters, selectedSpeakerGender, selectedAddresseeGender, this.state.chapters[i], this.state.chp_SA[i][j], this.state.genders, this.state.characters)
                                    }
                                }
                            }
                        }
                    }
                    let test = validChapters.map(e => JSON.stringify(e))
                    test= Array.from(new Set(test)).map(e => JSON.parse(e))
                    validChapters = test
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
                    if (selectedAddresseeGender !== 'Any') {
                        validAddressees.forEach(e => {
                            if (e[1] === selectedAddresseeGender) {
                                e[2] = 1
                            } else {
                                e[2] = 0
                            }
                        })
                    }
                    validAddresseeGenders = Array.from(new Set(validAddressees.filter(e => e[2]).map(e => e[1])))
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
                    for (let i = 0; i < validSpeakers.length; i++) {
                        let chp = this.state.selectedChapter-1
                        let spkr = validSpeakers[i][0]
                        let spkr_index = this.state.characters.indexOf(spkr)
                        validSpeakers[i][2] = 0
                        for (let j = 0; j < validAddressees.filter(row => row[2]===1).length; j++) {
                            let addr = validAddressees.filter(row => row[2]===1)[j][0]
                            let addr_index = this.state.characters.indexOf(addr)
                            if (!isNaN(chp)) {
                                if (JSON.stringify(this.state.chp_SA[chp]).includes(JSON.stringify([spkr, addr]))) {
                                    validSpeakers[i][2] = 1
                                    break
                                }
                            } else {
                                // when chapter is any
                                if (this.state.adjmat_SA[spkr_index][addr_index]===1) {
                                    validSpeakers[i][2] = 1
                                    break
                                }
                            }
                        }
                    }
                    validSpeakerGenders = Array.from(new Set(validSpeakers.filter(row => row[2]===1).map(spkr => spkr[1])))
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
                }
            } else {
                // when the addressee filter is changed
                lockedAddressee = event.target.value
                if (lockedAddressee === 'Any') {
                    if (this.state.selectedSpeaker === 'Any') {
                        validChapters = this.state.chapters.map(row => [...row, 1])
                    } else {
                        // chapters are pushed in order so no need to sort
                        validChapters = []
                        for (let i = 0; i < 54; i++) {
                            if (this.state.chp_SA[i] !== undefined) {
                                for (let j = 0; j < this.state.chp_SA[i].length; j++) {
                                    if (this.state.chp_SA[i][j][0] === this.state.selectedSpeaker) {
                                        validChapters = chpGen(validChapters, selectedSpeakerGender, selectedAddresseeGender, this.state.chapters[i], this.state.chp_SA[i][j], this.state.genders, this.state.characters)
                                    }
                                }
                            }
                        }
                    }
                    let test = validChapters.map(e => JSON.stringify(e))
                    test= Array.from(new Set(test)).map(e => JSON.parse(e))
                    validChapters = test
                    if (this.state.selectedChapter === 'Any') {
                        validSpeakers = this.state.speakers.map(e => [e, this.state.genders[this.state.characters.indexOf(e)], 1])
                    } else {
                        validSpeakers = Array.from(new Set(this.state.chp_SA[parseInt(this.state.selectedChapter)-1].map(pair => pair[0]))).sort().map(e => [e, this.state.genders[this.state.characters.indexOf(e)], 1])
                    }
                }
                // if we have an addressee selected
                else {
                    lockedAddresseeGender = this.state.genders[this.state.characters.indexOf(lockedAddressee)]
                    if (this.state.selectedSpeaker === 'Any') {
                        validChapters = []
                        for (let i = 0; i < 54; i++) {
                            if (this.state.chp_SA[i] !== undefined) {
                                for (let j = 0; j < this.state.chp_SA[i].length; j++) {
                                    if (this.state.chp_SA[i][j][1] === lockedAddressee) {
                                        validChapters = chpGen(validChapters, selectedSpeakerGender, selectedAddresseeGender, this.state.chapters[i], this.state.chp_SA[i][j], this.state.genders, this.state.characters)
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
                                        validChapters = chpGen(validChapters, selectedSpeakerGender, selectedAddresseeGender, this.state.chapters[i], this.state.chp_SA[i][j], this.state.genders, this.state.characters)
                                    }
                                }
                            }
                        }
                    }
                    let test = validChapters.map(e => JSON.stringify(e))
                    test= Array.from(new Set(test)).map(e => JSON.parse(e))
                    validChapters = test
                    if (this.state.selectedChapter === 'Any') {
                        validSpeakers = new Set()
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
                    if (selectedSpeakerGender !== 'Any') {
                        validSpeakers.forEach(e => {
                            if (e[1] === selectedSpeakerGender) {
                                e[2] = 1
                            } else {
                                e[2] = 0
                            }
                        })
                    }
                    validSpeakerGenders = Array.from(new Set(validSpeakers.filter(e => e[2]).map(e => e[1])))
                }
            }
            if (validSpeakerGenders.length === 2) {
                    validSpeakerGenders = ['male', 'female']
            }
            if (validAddresseeGenders.length === 2) {
                switch((validAddresseeGenders[0]+validAddresseeGenders[1]).length) {
                    case 10:
                        validAddresseeGenders = ['male', 'female']
                        break
                    case 12:
                        validAddresseeGenders = ['male', 'nonhuman']
                        break
                    case 14:
                        validAddresseeGenders = ['female', 'nonhuman']
                        break
                    default:
                        console.log('Error occured in speaker gender filter')
                }
            } else if (validAddresseeGenders.length === 3) {
                validAddresseeGenders = ['male', 'female', 'nonhuman']
            } 
            this.setState({
                chapterList: validChapters,
                speakerList: validSpeakers,
                addresseeList: validAddressees,
                speakerGenderList: validSpeakerGenders,
                addresseeGenderList: validAddresseeGenders,
            }, 
            () => {
                switch (type) {
                    case 'chapter':
                        this.setState({
                            selectedChapter: lockedChapter[0],
                        }, () => {
                            console.log('chapter set')
                        }) 
                        break
                    case 'speaker':
                        this.setState({
                            selectedSpeaker: lockedSpeaker,
                            selectedSpeakerGender: lockedSpeakerGender,
                        }, () => {
                            console.log('speaker set')
                        }) 
                        break
                    case 'addressee':
                        this.setState({
                            selectedAddressee: lockedAddressee,
                            selectedAddresseeGender: lockedAddresseeGender
                        }, () => {
                            console.log('addressee set')
                        }) 
                        break
                    case 'speakerGender':
                            this.setState({
                                selectedSpeakerGender: lockedSpeakerGender,
                            }, () => {
                                console.log('speaker gender set')
                            }) 
                            break
                    case 'addresseeGender':
                                this.setState({
                                    selectedAddresseeGender: lockedAddresseeGender,
                                }, () => {
                                    console.log('addressee gender set')
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
                    <label htmlFor="chapter">Chapter</label>
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
                    <label htmlFor="speakerGender">Speaker Gender</label>
                    <br />
                    <select 
                        id="speakerGender"
                        value={this.state.selectedSpeakerGender}
                        onChange={updateSelection}
                        name="speakerGender"
                    >
                        <option value="Any">Any</option>
                        {this.state.speakerGenderList.map(row => <option key={row+'_sg'} value={row}>{row}</option>)}
                    </select>
                </form>
                <form>
                    <label htmlFor="speaker">Speaker</label>
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
                    <label htmlFor="addresseeGender">Addressee Gender</label>
                    <br />
                    <select 
                        id="addresseeGender"
                        value={this.state.selectedAddresseeGender}
                        onChange={updateSelection}
                        name="addresseeGender"
                    >
                        <option value="Any">Any</option>
                        {this.state.addresseeGenderList.map(row => <option key={row+'_ag'} value={row}>{row}</option>)}
                    </select>
                </form>
                <form>
                <label htmlFor="addressee">Addressee</label>
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