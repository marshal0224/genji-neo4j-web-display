import React from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes, getPoemTableContent, parseChp, parseOrder } from '../utils'
import Edit from './edit'

export default class Poem extends React.Component { 

    constructor(props) {
        super(props)
        this.state = {
            ptHeader: [], // pnum, Waley#, speaker, addressee
            info: {}, 
            uri: this.props.uri,
            user: this.props.user,
            password: this.props.password,
            chapter: this.props.chapter,
            speaker: this.props.speaker,
            addressee: this.props.addressee,
            spkrGen: this.props.spkrGen,
            addrGen: this.props.addrGen,
            propname: [], // a matrix of Edit propertyNames
            key: true,
        }
        this.setCharColor = this.setCharColor.bind(this)
        this.changePTKey = this.changePTKey.bind(this)
    }

    async componentDidMount() {
        initDriver(this.state.uri, this.state.user, this.state.password)
        const driver = getDriver()
        const session = driver.session()
        const chapter = this.state.chapter
        const speaker = this.state.speaker
        const addressee = this.state.addressee
        const spkrGen = this.state.spkrGen
        const addrGen = this.state.addrGen
        let getSpeaker, getAddressee, getChapter
        if (speaker === 'Any' && spkrGen === 'Any') {
            getSpeaker = '(:Character)'
        } else if (speaker === 'Any' && spkrGen !== 'Any') {
            getSpeaker = '(:Character {gender: "'+spkrGen+'"})'
        } else{
            getSpeaker = '(:Character {name: "'+speaker+'"})'
        } 
        if (addressee === 'Any' && addrGen === 'Any') {
            getAddressee = '(:Character)'
        } else if (addressee === 'Any' && addrGen !== 'Any') {
            getAddressee = '(:Character {gender: "'+addrGen+'"})'
        } else {
            getAddressee = '(:Character {name: "'+addressee+'"})'
        }
        if (chapter === 'Any') {
            getChapter = ', (g)-[:INCLUDED_IN]-(:Chapter), '
        } else {
            //as of Apirl 2022, the chapter numbers are in string
            getChapter = ', (g)-[:INCLUDED_IN]-(:Chapter {chapter_number: "'+chapter+'"}), '
        }
        let get =   'match exchange='+getSpeaker+'-[:SPEAKER_OF]-(g:Genji_Poem)-'
                        +'[:ADDRESSEE_OF]-'+getAddressee 
                        +getChapter
                        +'trans=(g)-[:TRANSLATION_OF]-(t:Translation) '
                        +' return exchange, trans'
        const res = await session.readTransaction(tx => tx.run(get, { speaker, addressee, chapter}))
        let poemRes = res.records.map(row => {return toNativeTypes(row.get('exchange'))})
        let transTemp = res.records.map(row => {return toNativeTypes(row.get('trans'))}).map(row => [Object.keys(row.end.properties), Object.values(row.end.properties)])
        let [plist, info, propname] = getPoemTableContent(poemRes, transTemp)
        // if (JSON.stringify(this.state.ptHeader) !== JSON.stringify(plist) && JSON.stringify(this.state.info) !== JSON.stringify(info) && JSON.stringify(this.state.propname) !== JSON.stringify(propname)) {
            this.setState({
                ptHeader: plist,
                info: info,
                propname: propname,
            }, () => {
                this.props.updateCount(new Set(plist.map(e => e[0])).size)
            })
        session.close()
        closeDriver()
    }

    async componentDidUpdate() {
        console.log('PT component did update')
        initDriver(this.state.uri, this.state.user, this.state.password)
        const driver = getDriver()
        const session = driver.session()
        const chapter = this.props.chapter
        const speaker = this.props.speaker
        const addressee = this.props.addressee
        const spkrGen = this.props.spkrGen
        const addrGen = this.props.addrGen
        let getSpeaker, getAddressee, getChapter
        if (speaker === 'Any' && spkrGen === 'Any') {
            getSpeaker = '(:Character)'
        } else if (speaker === 'Any' && spkrGen !== 'Any') {
            getSpeaker = '(:Character {gender: "'+spkrGen+'"})'
        } else{
            getSpeaker = '(:Character {name: "'+speaker+'"})'
        } 
        if (addressee === 'Any' && addrGen === 'Any') {
            getAddressee = '(:Character)'
        } else if (addressee === 'Any' && addrGen !== 'Any') {
            getAddressee = '(:Character {gender: "'+addrGen+'"})'
        } else {
            getAddressee = '(:Character {name: "'+addressee+'"})'
        }
        if (chapter === 'Any') {
            getChapter = ', (g)-[:INCLUDED_IN]-(:Chapter), '
        } else {
            //as of April 2022, the chapter numbers are in string
            getChapter = ', (g)-[:INCLUDED_IN]-(:Chapter {chapter_number: "'+chapter+'"}), '
        }
        let get =   'match exchange='+getSpeaker+'-[:SPEAKER_OF]-(g:Genji_Poem)-'
                        +'[:ADDRESSEE_OF]-'+getAddressee 
                        +getChapter
                        +'trans=(g)-[:TRANSLATION_OF]-(t:Translation) '
                        +' return exchange, trans'
        const res = await session.readTransaction(tx => tx.run(get, { speaker, addressee, chapter}))
        let poemRes = res.records.map(row => {return toNativeTypes(row.get('exchange'))})
        let transTemp = res.records.map(row => {return toNativeTypes(row.get('trans'))}).map(row => [Object.keys(row.end.properties), Object.values(row.end.properties)])
        let [plist, info, propname] = getPoemTableContent(poemRes, transTemp)
        if (JSON.stringify(this.state.info) !== JSON.stringify(info) || (JSON.stringify(this.state.ptHeader) !== JSON.stringify(plist) && JSON.stringify(this.state.propname) !== JSON.stringify(propname))) {
            console.log('before set state')
            this.setState({
                ptHeader: plist,
                info: info,
                propname: propname,
            }, () => {
                this.props.updateCount(new Set(plist.map(e => e[0])).size)
            })
        }
        session.close()
        closeDriver()
    }

    updateSelection = (event) => {
        let target = event.target.parentElement.querySelector('p') // updates the p tag each time the selection is changed
        let pnum = target.className
        let type = event.target.value
        if (type === 'select:') {
            target.innerHTML = ''
        } else {
            if (type === 'Waley') {
                target.innerHTML = this.state.info[pnum][type]+'\n'+this.state.info[pnum]['WaleyPageNum']
            } else {
                target.innerHTML = this.state.info[pnum][type]
            }
            if (type === 'Japanese') {
                target.setAttribute('type', 'JP')
            } else {
                target.setAttribute('type', 'non-JP')
            }
        }
        event.target.value = type
        let propname = this.state.propname
        let i = parseInt(pnum.substring(4,6))
        let j = parseInt(event.target.parentElement.className.substring(5,6))
        propname[i-1][j-1] = type
        this.setState({
            propname: propname,
        })
    }

    getOptions(pnum) {
        let options = Object.keys(this.state.info[pnum]).sort();
        let w = options.indexOf('WaleyPageNum')
        if (w > -1) {
            options.splice(w, 1)
        }
        // notice that one can improve this by taking care of the below two while preparing for info
        let j = options.indexOf('Japanese')
        if (j > -1) {
            options.splice(j, 1)
        }
        let r = options.indexOf('Romaji')
        if (r > -1) {
            options.splice(r, 1)
        }
        return (options)
    }

    setColumnOptions = (event) => {
        let type = event.target.value
        if (type !== 'Select:') {
            let col = '.ptcol'+JSON.stringify(event.target.className).slice(-2,-1)
            let cells = document.querySelectorAll(col)
            cells.forEach(e => {
                        e.querySelectorAll('select').forEach(e => {
                        e.value = type
                        let p = e.parentElement.querySelector('p')
                        let pnum = p.className
                        if (type === 'Waley') {
                            p.innerHTML = this.state.info[pnum][type]+'\n'+this.state.info[pnum]['WaleyPageNum']
                        } else {
                            p.innerHTML = this.state.info[pnum][type]
                        }
                        if (type === 'Japanese') {
                            p.setAttribute('type', 'JP')
                        } else {
                            p.setAttribute('type', 'non-JP')
                        }
                    })
            })
            let j = parseInt(JSON.stringify(event.target.className).slice(-2,-1))
            let propname = this.state.propname
            propname.forEach(row => row[j-1] = type)
            this.setState({
                propname: propname,
            })
        }
    }

    setCharColor(name) {
        let index = this.props.characters.indexOf(name)
        let gender = this.props.genders[index]
        if (gender === 'male'){
            return (
                <p className='male-char'>{name}</p>
            )
        } else if (gender === 'nonhuman') {
            return (
                <p className='nonhuman-char'>{name}</p>
            )
        } else {
            return (
                <p className='female-char'>{name}</p>
            )
        }
    }

    changePTKey() {
        this.setState({
            key: !this.state.key,
        })
    }

    render() {
        return (
        <div>
            <table>
                <thead>
                    <tr>
                        <th>Chapter</th>
                        <th>Poem Number</th>
                        <th className='spkrCol'>Speaker</th>
                        <th className='addrCol'>Addressee</th>
                        <th>
                            Japanese
                        </th>
                        <th>
                            Romaji
                        </th>
                        <th>
                            {this.props.auth 
                            ? 'Cranston'
                            : <select className={'ptcol3'} onChange={this.setColumnOptions}>
                                <option>Translation A</option>
                                <option>Cranston</option>
                                <option>Seidensticker</option>
                                <option>Tyler</option>
                                <option>Waley</option>
                                <option>Washburn</option>
                            </select> }
                        </th>
                        <th>{this.props.auth
                            ? 'Seidensticker'
                            : <select className={'ptcol4'} onChange={this.setColumnOptions}>
                                <option>Translation B</option>
                                <option>Cranston</option>
                                <option>Seidensticker</option>
                                <option>Tyler</option>
                                <option>Waley</option>
                                <option>Washburn</option>
                            </select>}
                        </th>
                        {this.props.auth ? <th>Tyler</th> : null}
                        {this.props.auth ? <th>Waley</th> : null}
                        {this.props.auth ? <th>Washburn</th> : null}
                    </tr>
                </thead>
                <tbody>
                    {this.state.ptHeader.map((row) => 
                        <tr key={row[0]}>
                            <td>{parseChp(row[0])}</td>
                            <td className='pg'>{parseOrder(row[0])}</td>
                            <td className='spkrCol'>
                                {this.setCharColor(row[1])}
                                {this.props.auth && <Edit uri={this.state.uri} user={this.state.user} password={this.state.password} propertyName={'name'} name={row[1]} changeKey={this.props.changeKey}/>}
                            </td>
                            <td className='addrCol'>
                                {this.setCharColor(row[2])}
                                {this.props.auth && <Edit uri={this.state.uri} user={this.state.user} password={this.state.password} propertyName={'name'} name={row[2]} changeKey={this.props.changeKey}/>}
                            </td>
                            <td className='ptcol1'>
                                {this.props.auth 
                                ? <Edit uri={this.state.uri} user={this.state.user} password={this.state.password} propertyName={'Japanese'} currVal={this.state.info[row[0]]['Japanese']} pnum={row[0]} changeKey={this.props.changeKey}/>
                                : <p type='JP' className={row[0]}>{this.state.info[row[0]]['Japanese']}</p>}
                            </td>
                            <td className='ptcol2'>
                                {this.props.auth 
                                ? <Edit uri={this.state.uri} user={this.state.user} password={this.state.password} propertyName={'Romaji'} currVal={this.state.info[row[0]]['Romaji']} pnum={row[0]} changeKey={this.props.changeKey}/>
                                : <p className={row[0]}>{this.state.info[row[0]]['Romaji']}</p>}
                            </td>
                            {this.props.auth 
                            ? <td className='ptcol3'>
                                <Edit uri={this.state.uri} user={this.state.user} password={this.state.password} propertyName={'Cranston'} currVal={this.state.info[row[0]]['Cranston']} pnum={row[0]} changeKey={this.props.changeKey}/>
                            </td> 
                            : <td  className='ptcol3'>
                                <select onChange={this.updateSelection}>
                                    <option>select:</option>
                                    {this.getOptions(row[0]).map((item) => <option key={this.state.info[row[0]][item]}>{item}</option>)}
                                </select>
                                <p className={row[0]}></p>
                            </td>}
                            {this.props.auth 
                            ? <td className='ptcol4'>
                                {/* <p className={row[0]}>{this.state.info[row[0]]['Seidensticker']}</p> */}
                                <Edit uri={this.state.uri} user={this.state.user} password={this.state.password} propertyName={'Seidensticker'} currVal={this.state.info[row[0]]['Seidensticker']} pnum={row[0]} changeKey={this.props.changeKey}/>
                            </td>  
                            : <td className='ptcol4'>
                                <select onChange={this.updateSelection}>
                                    <option>select:</option>
                                    {this.getOptions(row[0]).map((item) => <option key={this.state.info[row[0]][item]}>{item}</option>)}
                                </select>
                                <p className={row[0]}></p>
                            </td>}
                            {this.props.auth 
                            ? <td className='ptcol5'>
                                {/* <p className={row[0]}>{this.state.info[row[0]]['Tyler']}</p> */}
                                <Edit uri={this.state.uri} user={this.state.user} password={this.state.password} propertyName={'Tyler'} currVal={this.state.info[row[0]]['Tyler']} pnum={row[0]} changeKey={this.props.changeKey}/>
                            </td> 
                            : null}
                            {this.props.auth 
                            ? <td className='ptcol6'>
                                {/* <p className={row[0]}>{this.state.info[row[0]]['Waley']}</p> */}
                                <Edit uri={this.state.uri} user={this.state.user} password={this.state.password} propertyName={'Waley'} currVal={this.state.info[row[0]]['Waley']} pnum={row[0]} changeKey={this.props.changeKey}/>
                                <Edit uri={this.state.uri} user={this.state.user} password={this.state.password} propertyName={'page'} currVal={this.state.info[row[0]]['WaleyPageNum']} pnum={row[0]} changeKey={this.props.changeKey}/>
                            </td> 
                            : null}
                            {this.props.auth 
                            ? <td className='ptcol7'>
                                {/* <p className={row[0]}>{this.state.info[row[0]]['Washburn']}</p> */}
                                <Edit uri={this.state.uri} user={this.state.user} password={this.state.password} propertyName={'Washburn'} currVal={this.state.info[row[0]]['Washburn']} pnum={row[0]} changeKey={this.props.changeKey}/>
                            </td> 
                            : null}
                        </tr>)}
                </tbody>
            </table>
            </div>
        )
    }
}