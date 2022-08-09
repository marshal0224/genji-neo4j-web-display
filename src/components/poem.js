import React from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes, getPoemTableContent } from '../utils'
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
        this.parseOrder = this.parseOrder.bind(this)
        this.parseChp = this.parseChp.bind(this)
        this.setCharColor = this.setCharColor.bind(this)
        this.changePTKey = this.changePTKey.bind(this)
        this.col3Ref = React.createRef()
    }

    parseChp(pnum) {
        let [chp, _, smt] = pnum.match(/.{1,2}/g)
        let chp_name
        switch(chp){
            case '01':
                chp_name = "Kiritsubo 桐壺"
                break
            case '02':
                chp_name = "Hahakigi 帚木"
                break
            case '03': 
                chp_name = "Utsusemi 空蝉"
                break
            case '04': 
                chp_name = "Yūgao 夕顔"
                break
            case '05': 
                chp_name = "Wakamurasaki 若紫"
                break
            case '06': 
                chp_name = "Suetsumuhana 末摘花"
                break
            case '07': 
                chp_name = "Momiji no Ga 紅葉賀"
                break
            case '08': 
                chp_name = "Hana no En 花宴"
                break
            case '09': 
                chp_name = "Aoi 葵"
                break
            case '10': 
                chp_name = "Sakaki 榊"
                break
            case '11': 
                chp_name = "Hana Chiru Sato 花散里"
                break
            case '12': 
                chp_name = "Suma 須磨"
                break
            case '13': 
                chp_name = "Akashi 明石"
                break
            case '14': 
                chp_name = "Miotsukushi 澪標"
                break
            case '15': 
                chp_name = "Yomogiu 蓬生"
                break
            case '16': 
                chp_name = "Sekiya 関屋"
                break
            case '17': 
                chp_name = "E Awase 絵合"
                break
            case '18': 
                chp_name = "Matsukaze 松風"
                break
            case '19': 
                chp_name = "Usugumo 薄雲"
                break
            case '20': 
                chp_name = "Asagao 朝顔"
                break
            case '21': 
                chp_name = "Otome 乙女"
                break
            case '22': 
                chp_name = "Tamakazura 玉鬘"
                break
            case '23': 
                chp_name = "Hatsune 初音"
                break
            case '24': 
                chp_name = "Kochō 胡蝶"
                break
            case '25': 
                chp_name = "Hotaru 螢"
                break
            case '26': 
                chp_name = "Tokonatsu 常夏"
                break
            case '27': 
                chp_name = "Kagaribi 篝火"
                break
            case '28': 
                chp_name = "Nowaki 野分"
                break
            case '29': 
                chp_name = "Miyuki 行幸"
                break
            case '30': 
                chp_name = "Fujibakama 藤袴"
                break
            case '31': 
                chp_name = "Makibashira 真木柱"
                break
            case '32': 
                chp_name = "Umegae 梅枝"
                break
            case '33': 
                chp_name = "Fuji no Uraba 藤裏葉"
                break
            case '34': 
                chp_name = "Wakana: Jō 若菜上"
                break
            case '35': 
                chp_name = "Wakana: Ge 若菜下"
                break
            case '36': 
                chp_name = "Kashiwagi 柏木"
                break
            case '37': 
                chp_name = "Yokobue 横笛"
                break
            case '38': 
                chp_name = "Suzumushi 鈴虫"
                break
            case '39':
                chp_name = "Yūgiri 夕霧"
                break
            case '40': 
                chp_name = "Minori 御法"
                break
            case '41': 
                chp_name = "Maboroshi 幻"
                break
            case '42': 
                chp_name = "Niou Miya 匂宮"
                break
            case '43': 
                chp_name = "Kōbai 紅梅"
                break
            case '44': 
                chp_name = "Takekawa 竹河"
                break
            case '45': 
                chp_name = "Hashihime 橋姫"
                break
            case '46': 
                chp_name = "Shii ga Moto 椎本"
                break
            case '47': 
                chp_name = "Agemaki 総角"
                break
            case '48': 
                chp_name = "Sawarabi 早蕨"
                break
            case '49': 
                chp_name = "Yadorigi 宿木"
                break
            case '50': 
                chp_name = "Azumaya 東屋"
                break
            case '51':
                chp_name = "Ukifune 浮舟"
                break
            case '52':
                chp_name = "Kagerō 蜻蛉"
                break
            case '53':
                chp_name = "Tenarai 手習"
                break
            case '54':
                chp_name = "Yume no Ukihashi 夢浮橋"
                break
            default: 
                console.log('unknown chapter caught')
        }
        return (
            <p>{chp} {chp_name}</p>
        )
    }

    parseOrder(pnum) {
        let [chp, _, order] = pnum.match(/.{1,2}/g)
        order = parseInt(order)
        return (
            <p>{order}</p>
        )
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
        console.log('in PT component did update')
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
        {console.log('pt rerendering')}
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
                            <td>{this.parseChp(row[0])}</td>
                            <td className='pg'>{this.parseOrder(row[0])}</td>
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