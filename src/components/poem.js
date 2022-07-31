import React from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes } from '../utils'
import Edit from './edit'

export default class Poem extends React.Component { 

    constructor(props) {
        super(props)
        this.driver = getDriver()
        this.state = {
            ptHeader: [], // pnum, Waley#, speaker, addressee
            info: {}, 
            uri: this.props.uri,
            user: this.props.user,
            password: this.props.password,
            propname: [], // a matrix of Edit propertyNames
        }
        this.parseOrder = this.parseOrder.bind(this)
        this.parseChp = this.parseChp.bind(this)
        this.setCharColor = this.setCharColor.bind(this)
        // this.WaleyPageNum = this.WaleyPageNum.bind(this)
        this.col3Ref = React.createRef()
        initDriver(this.state.uri, this.state.user, this.state.password)
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
                chp_name = "Niō Miya 匂宮"
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
        const session = this.driver.session()
        const chapter = this.props.chapter
        const speaker = this.props.speaker
        const addressee = this.props.addressee
        const spkrGen = this.props.spkrGen
        const addrGen = this.props.addrGen
        
        // try {
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
            // let waley_pages = res.records.map(row => {return toNativeTypes(row.get('waley'))})
            let speakers = poemRes.map(row => row.segments[0].start.properties.name)
            let addressees = poemRes.map(row => row.segments[1].end.properties.name)
            let Japanese = poemRes.map(row => row.segments[1].start.properties)
            let info = {}
            let plist = new Set()
            for (let i = 0; i < Japanese.length; i++) {
                plist.add(JSON.stringify([Japanese[i].pnum, speakers[i], addressees[i]]))
            }
            plist = Array.from(plist).map(item => JSON.parse(item))
            // sorting the list of poems
            for (let i = 0; i < plist.length-1; i++) {
                for (let j = 0; j < plist.length-i-1; j++) {
                    if ((parseInt(plist[j][0].substring(0, 2)) > parseInt(plist[j+1][0].substring(0, 2))) 
                    || (parseInt(plist[j][0].substring(0, 2)) >= parseInt(plist[j+1][0].substring(0, 2)) 
                    && parseInt(plist[j][0].substring(4, 6)) > parseInt(plist[j+1][0].substring(4, 6)))) {
                        let temp = plist[j+1]
                        plist[j+1] = plist[j]
                        plist[j] = temp
                    }
                }
            }
            // make Japanese non-repetitive
            let jsonObject = Japanese.map(JSON.stringify);
            let uniqueSet = new Set(jsonObject);
            Japanese = Array.from(uniqueSet).map(JSON.parse);
            // prepares translations, notes, Waley#, etc., in info
            transTemp.forEach(element => {
                // element: [keys, properties]
                if (element[0].length !== 0 && element[0].includes('id')) {
                    let auth, pnum
                    pnum = element[1][element[0].indexOf('id')].substring(0, 6)
                    auth = element[1][element[0].indexOf('id')].substring(6, 7)
                    if (info[pnum] === undefined) {
                        info[pnum] = {}
                    }
                    if (auth === 'A') {
                        auth = 'Waley'
                    } else if (auth === 'C') {
                        auth = 'Cranston'
                    } else if (auth === 'S') {
                        auth = 'Seidensticker'
                    } else if (auth === 'T') {
                        auth = 'Tyler'
                    } else {
                        auth = 'Washburn'
                    }
                    if (element[0].includes('translation')) {
                        info[pnum][auth] = element[1][element[0].indexOf('translation')]
                    } else {
                        info[pnum][auth] = 'N/A'
                    }
                    if (element[0].includes('WaleyPageNum')) {
                        info[pnum]['WaleyPageNum'] = element[1][element[0].indexOf('WaleyPageNum')]
                    } else if (typeof(info[pnum]['WaleyPageNum']) !== 'number') {
                        info[pnum]['WaleyPageNum'] = 'N/A'
                    }
                } 
                if (element[0].length === 1 ) {
                    console.log('DB entry issue at: '+element)
                }
            });
            Japanese.forEach(e => {
                let n = e.pnum
                if (info[n] === undefined) {
                    info[n] = {}
                    info[n]['WaleyPageNum'] = 'N/A'
                    console.log('manually creating info object for '+n)
                }
                info[n].Japanese = e.Japanese
                info[n].Romaji = e.Romaji
            })
            // preparing a matrix of edit propertyNames
            let propname = Array.from(Array(plist.length), () => new Array(4))
            propname.forEach(row => {
                row[0] = 'Japanese'
                row[1] = 'Romaji'
            })
            this.setState({
                ptHeader: plist,
                info: info,
                propname: propname,
            }, () => {
                this.props.updateCount(plist.length)
            })
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
                target.innerHTML = this.state.info[pnum][type]+'\n'+'Waley Page: '+this.state.info[pnum]['WaleyPageNum']
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
        let j = options.indexOf('Japanese')
        let r = options.indexOf('Romaji')
        if (w > -1) {
            options.splice(w, 1)
        }
        // notice that one can improve this by taking care of the below two while preparing for info
        if (j > -1) {
            options.splice(j, 1)
        }
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
                            p.innerHTML = this.state.info[pnum][type]+'\n'+'Waley Page: '+this.state.info[pnum]['WaleyPageNum']
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
        } else {
            return (
                <p className='female-char'>{name}</p>
            )
        }
    }

    // WaleyPageNum(pnum) {
    //     return( 
    //         <div>
    //             <p>{this.state.info[pnum]['WaleyPageNum']}</p>
    //             {this.props.auth && <Edit uri={this.state.uri} user={this.state.user} password={this.state.password} propertyName={'page'} pnum={pnum} changeKey={this.props.changeKey}/>}
    //         </div> 
    //     )
    // }

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
                            <select className='ptheader3' onChange={this.setColumnOptions}>
                                <option>Translation A</option>
                                <option>Cranston</option>
                                <option>Seidensticker</option>
                                <option>Tyler</option>
                                <option>Waley</option>
                                <option>Washburn</option>
                            </select>
                        </th>
                        <th>
                            <select className='ptheader4' onChange={this.setColumnOptions}>
                                <option>Translation B</option>
                                <option>Cranston</option>
                                <option>Seidensticker</option>
                                <option>Tyler</option>
                                <option>Waley</option>
                                <option>Washburn</option>
                            </select></th>
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
                                <p type='JP' className={row[0]}>
                                    {this.state.info[row[0]]['Japanese']}
                                </p>
                                {this.props.auth && <Edit uri={this.state.uri} user={this.state.user} password={this.state.password} propertyName={this.state.propname[parseInt(row[0].substring(4,6))-1][0]} pnum={row[0]} changeKey={this.props.changeKey}/>}
                            </td>
                            <td className='ptcol2'>
                                <p className={row[0]}>{this.state.info[row[0]]['Romaji']}</p>
                                {this.props.auth && <Edit uri={this.state.uri} user={this.state.user} password={this.state.password} propertyName={this.state.propname[parseInt(row[0].substring(4,6))-1][1]} pnum={row[0]} changeKey={this.props.changeKey}/>}
                            </td>
                            <td className='ptcol3'>
                                <select onChange={this.updateSelection} ref={(col3Ref) => {this.col3Ref = col3Ref}}>
                                    <option>select:</option>
                                    {this.getOptions(row[0]).map((item) => <option key={this.state.info[row[0]][item]}>{item}</option>)}
                                </select>
                                <p className={row[0]}></p>
                                {this.props.auth && <Edit uri={this.state.uri} user={this.state.user} password={this.state.password} propertyName={this.state.propname[parseInt(row[0].substring(4,6))-1][2]} pnum={row[0]} changeKey={this.props.changeKey}/>}
                                {/* {this.props.auth &&<Edit uri={this.state.uri} user={this.state.user} password={this.state.password} propertyName={'page'} pnum={row[0]} changeKey={this.props.changeKey}/>} */}
                            </td>
                            <td className='ptcol4'>
                                <select onChange={this.updateSelection}>
                                    <option>select:</option>
                                    {this.getOptions(row[0]).map((item) => <option key={this.state.info[row[0]][item]}>{item}</option>)}
                                </select>
                                <p className={row[0]}></p>
                                {this.props.auth && <Edit uri={this.state.uri} user={this.state.user} password={this.state.password} propertyName={this.state.propname[parseInt(row[0].substring(4,6))-1][3]} pnum={row[0]} changeKey={this.props.changeKey}/>}
                            </td>
                        </tr>)}
                </tbody>
            </table>
            </div>
        )
    }
}