import React from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes } from '../utils'

export default class Poem extends React.Component { 

    constructor(props) {
        super(props)
        initDriver(this.props.uri, this.props.user, this.props.password)
        this.driver = getDriver()
        this.state = {
            Japanese: [],
            Translation: {}
        }
        this.parsePnum = this.parsePnum.bind(this)
    }

    parsePnum(pnum) {
        let [chp, _, order] = pnum.match(/.{1,2}/g)
        switch(chp){
            case '01':
                chp = "Kiritsubo 桐壺"
                break
            case '02':
                chp = "Hahakigi 帚木"
                break
            case '03': 
                chp = "Utsusemi 空蝉"
                break
            case '04': 
                chp = "Yūgao 夕顔"
                break
            case '05': 
                chp = "Wakamurasaki 若紫"
                break
            case '06': 
                chp = "Suetsumuhana 末摘花"
                break
            case '07': 
                chp = "Momiji no Ga 紅葉賀"
                break
            case '08': 
                chp = "Hana no En 花宴"
                break
            case '09': 
                chp = "Aoi 葵"
                break
            case '10': 
                chp = "Sakaki 榊"
                break
            case '11': 
                chp = "Hana Chiru Sato 花散里"
                break
            case '12': 
                chp = "Suma 須磨"
                break
            case '13': 
                chp = "Akashi 明石"
                break
            case '14': 
                chp = "Miotsukushi 澪標"
                break
            case '15': 
                chp = "Yomogiu 蓬生"
                break
            case '16': 
                chp = "Sekiya 関屋"
                break
            case '17': 
                chp = "E Awase 絵合"
                break
            case '18': 
                chp = "Matsukaze 松風"
                break
            case '19': 
                chp = "Usugumo 薄雲"
                break
            case '20': 
                chp = "Asagao 朝顔"
                break
            case '21': 
                chp = "Otome 乙女"
                break
            case '22': 
                chp = "Tamakazura 玉鬘"
                break
            case '23': 
                chp = "Hatsune 初音"
                break
            case '24': 
                chp = "Kochō 胡蝶"
                break
            case '25': 
                chp = "Hotaru 螢"
                break
            case '26': 
                chp = "Tokonatsu 常夏"
                break
            case '27': 
                chp = "Kagaribi 篝火"
                break
            case '28': 
                chp = "Nowaki 野分"
                break
            case '29': 
                chp = "Miyuki 行幸"
                break
            case '30': 
                chp = "Fujibakama 藤袴"
                break
            case '31': 
                chp = "Makibashira 真木柱"
                break
            case '32': 
                chp = "Umegae 梅枝"
                break
            case '33': 
                chp = "Fuji no Uraba 藤裏葉"
                break
            case '34': 
                chp = "Wakana: Jō 若菜上"
                break
            case '35': 
                chp = "Wakana: Ge 若菜下"
                break
            case '36': 
                chp = "Kashiwagi 柏木"
                break
            case '37': 
                chp = "Yokobue 横笛"
                break
            case '38': 
                chp = "Suzumushi 鈴虫"
                break
            case '39':
                chp = "Yūgiri 夕霧"
                break
            case '40': 
                chp = "Minori 御法"
                break
            case '41': 
                chp = "Maboroshi 幻"
                break
            case '42': 
                chp = "Niō Miya 匂宮"
                break
            case '43': 
                chp = "Kōbai 紅梅"
                break
            case '44': 
                chp = "Takekawa 竹河"
                break
            case '45': 
                chp = "Hashihime 橋姫"
                break
            case '46': 
                chp = "Shii ga Moto 椎本"
                break
            case '47': 
                chp = "Agemaki 総角"
                break
            case '48': 
                chp = "Sawarabi 早蕨"
                break
            case '49': 
                chp = "Yadorigi 宿木"
                break
            case '50': 
                chp = "Azumaya 東屋"
                break
            case '51':
                chp = "Ukifune 浮舟"
                break
            case '52':
                chp = "Kagerō 蜻蛉"
                break
            case '53':
                chp = "Tenarai 手習"
                break
            case '54':
                chp = "Yume no Ukihashi 夢浮橋"
                break
            default: 
                console.log('unknown chapter caught')
        }
        order = parseInt(order)
        return (
            <p>{chp} {order}</p>
        )
    }

    async componentDidMount() {
        const session = this.driver.session()
        const chapter = this.props.chapter
        const speaker = this.props.speaker
        const addressee = this.props.addressee
        
        try {
            let getSpeaker, getAddressee, getChapter
            if (speaker === 'Any') {
                getSpeaker = '(s:Character)'
            } else {
                getSpeaker = '(s:Character {name: "'+speaker+'"})'
            } 
            if (addressee === 'Any') {
                getAddressee = '(a:Character)'
            } else {
                getAddressee = '(a:Character {name: "'+addressee+'"})'
            }
            if (chapter === 'Any') {
                getChapter = ', (j)-[r:INCLUDED_IN]-(c:Chapter), '
            } else {
                //as of Apirl 2022, the chapter numbers are in string
                getChapter = ', (j)-[r:INCLUDED_IN]-(c:Chapter {chapter_number: "'+chapter+'"}), '
            }
            let get =   'match exchange='+getSpeaker+'-[p:SPEAKER_OF]-(j:Japanese)-'
                            +'[q:ADDRESSEE_OF]-'+getAddressee 
                            +getChapter
                            +'trans=(j)-[u:TRANSLATION_OF]-(t:Translation)'
                            +' return exchange, trans'
            const res = await session.readTransaction(tx => tx.run(get, { speaker, addressee, chapter}))
            let poemRes = res.records.map(row => {return toNativeTypes(row.get('exchange'))})
            let transRes = res.records.map(row => {return toNativeTypes(row.get('trans'))})
            let Japanese = poemRes.map(row => row.segments[1].start.properties)
            let transTemp = transRes.map(row => Object.values(row.end.properties))

            let Translation = {}
            let plist = new Set()// new Array(properties.length)
            for (let i = 0; i < Japanese.length; i++) {
                plist.add(JSON.stringify([Japanese[i].pnum, Japanese[i].Japanese, Japanese[i].Romaji]))
            }
            plist = Array.from(plist).map(item => JSON.parse(item))
            for (let i = 0; i < plist.length-1; i++) {
                for (let j = 0; j < plist.length-i-1; j++) {
                    if ((parseInt(plist[j][0].substring(0, 2)) > parseInt(plist[j+1][0].substring(0, 2))) 
                    || (parseInt(plist[j][0].substring(0, 2)) >= parseInt(plist[j+1][0].substring(0, 2)) 
                    && parseInt(plist[j][0].substring(4, 6)) > parseInt(plist[j+1][0].substring(4, 6)))) {
                        let poemRes = plist[j+1]
                        plist[j+1] = plist[j]
                        plist[j] = poemRes
                    }
                }
            }
            // console.log(transTemp)
            transTemp.forEach(element => {
                if (element.length !== 1) {
                    let count
                    if (element.length === 2) {
                        count = 0
                    } else {
                        count = 1
                    }
                    if (Translation[element[count+1].substring(0,6)] === undefined) {
                        Translation[element[count+1].substring(0,6)] = {}
                    }
                    let auth = element[count+1].substring(6,7)
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
                    // console.log(element[count+1].substring(0,6))
                    Translation[element[count+1].substring(0,6)][auth] = element[count]
                }
            });
            this.setState({
                Japanese: plist,
                Translation: Translation,
            }, 
            () => {
                console.log('Japanese set')
            })
        } catch (e) {
            console.log('Error in poem: '+e)
        } finally {
            await session.close()
        }
        closeDriver()
    }

    // getDerived

    render() {
        let plist = this.state.Japanese;
        let trans = this.state.Translation
        let updateSelection = (event) => {
            let target = event.target.parentElement.querySelector('p')
            let pnum = target.className
            let auth = event.target.value
            target.innerHTML = trans[pnum][auth]
        }
        function getOptions(pnum) {
            // console.log(pnum)
            let options = Object.keys(trans[pnum]).sort();
            return (options)
        }
        return (
            <table>
                <thead>
                    <tr>
                        <th>Chapter Name</th>
                        <th>Japanese</th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {plist.map((row) => <tr key={row[0]}>
                                                <td>{this.parsePnum(row[0])}</td>
                                                <td>{row[1]}</td>
                                                <td>
                                                    <select onChange={updateSelection}>
                                                        <option>select:</option>
                                                        {getOptions(row[0]).map((item) => <option key={trans[row[0]][item]}>{item}</option>)}
                                                    </select>
                                                    <p className={row[0]}></p>
                                                </td>
                                                <td>
                                                    <select onChange={updateSelection}>
                                                        <option>select:</option>
                                                        {getOptions(row[0]).map((item) => <option key={trans[row[0]][item]}>{item}</option>)}
                                                    </select>
                                                    <p className={row[0]}></p>
                                                </td>
                                                <td>
                                                    <select onChange={updateSelection}>
                                                        <option>select:</option>
                                                        {getOptions(row[0]).map((item) => <option key={trans[row[0]][item]}>{item}</option>)}
                                                    </select>
                                                    <p className={row[0]}></p>
                                                </td>
                                            </tr>)}
                </tbody>
            </table>
        )
    }
}