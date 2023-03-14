import React from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes, getPoemTableContent, parseChp, parseOrder } from '../utils'
import _ from 'lodash'

export default class KeywordSearch extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            exchange: [], // pnum, Waley#, speaker, addressee
            chp: [],
            trans_mat: [], 
            uri: this.props.uri,
            user: this.props.user,
            password: this.props.password,
            keyword: this.props.keyword,
            key: true,
        }
        this.setCharColor = this.setCharColor.bind(this)
        this.changePTKey = this.changePTKey.bind(this)
        this.col3Ref = React.createRef()
        this.setColumnOptions = this.setColumnOptions.bind(this)
    }
    
    async componentDidMount() {
        initDriver(this.state.uri, this.state.user, this.state.password)
        const driver = getDriver()
        const session = driver.session()
        const keyword = this.state.keyword
        let get 
        if (keyword.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/) !== null) {
            if (keyword.includes(' ')){
                keyword = keyword.replaceAll(' ', "' and g.Japanese contains '")
            }
            get = "match exchange=(:Character)-[:SPEAKER_OF]->(g:Genji_Poem)<-[:ADDRESSEE_OF]-(:Character), chp=(g)-[:INCLUDED_IN]->(:Chapter), trans = (g)-[:TRANSLATION_OF]-(:Translation)-[:TRANSLATOR_OF]-(:People) where g.Japanese contains '"+keyword+"' return exchange, chp, trans"
        } else {
            get = "match exchange=(:Character)-[:SPEAKER_OF]->(g:Genji_Poem)<-[:ADDRESSEE_OF]-(:Character), chp=(g)-[:INCLUDED_IN]->(:Chapter), trans = (g)-[:TRANSLATION_OF]-(t:Translation)-[:TRANSLATOR_OF]-(:People) where t.translation contains '"+keyword+"' return exchange, chp, trans"
        }
        const res = await session.readTransaction(tx => tx.run(get, { keyword }))
        let exchange = res.records.map(row => {return toNativeTypes(row.get('exchange'))}).map(row => row.segments)
        let unique_exchange = []
        let pnums = new Set()
        for (let i = 0; i < exchange.length; i++) {
            let pnum = exchange[i][0].end.properties.pnum
            if (!pnums.has(pnum)) {
                pnums.add(pnum)
                unique_exchange.push(exchange[i])
            }
        }
        exchange= unique_exchange
        for (let i = 0; i < exchange.length-1; i++) {
            for (let j = 0; j < exchange.length-i-1; j++) {
                if ((parseInt(exchange[j][0].end.properties.pnum.substring(0, 2)) > parseInt(exchange[j+1][0].end.properties.pnum.substring(0, 2))) 
                || (parseInt(exchange[j][0].end.properties.pnum.substring(0, 2)) >= parseInt(exchange[j+1][0].end.properties.pnum.substring(0, 2)) 
                && parseInt(exchange[j][0].end.properties.pnum.substring(4, 6)) > parseInt(exchange[j+1][0].end.properties.pnum.substring(4, 6)))) {
                    let temp = exchange[j+1]
                    exchange[j+1] = exchange[j]
                    exchange[j] = temp
                }
            }
        }
        // console.log(exchange)
        let trans = res.records.map(row => {return toNativeTypes(row.get('trans'))})
        let trans_mat = trans.map(row => [row.segments[0].start.properties.pnum, row.segments[0].end.properties.translation, row.segments[1].end.properties.name])
        // console.log(trans)
        for (let i = 0; i < trans_mat.length; i++) {
            if (trans_mat[i][2] === 'Waley'){
                if (trans[i].segments[0].end.properties.WaleyPageNum !== undefined) {
                    trans_mat[i].push(trans[i].segments[0].end.properties.WaleyPageNum)
                } else {
                    trans_mat[i].push('N/A')
                }
            }
        }
        this.setState({
            exchange: exchange,
            trans_mat: trans_mat,
        }, () => console.log(trans_mat))
        session.close()
        closeDriver()
    }

    async componentDidUpdate() {
        console.log('component did update')
        initDriver(this.state.uri, this.state.user, this.state.password)
        const driver = getDriver()
        const session = driver.session()
        let keyword = this.props.keyword
        // keyword = keyword.replace(' ', "' and '")
        let get 
        if (keyword.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/) !== null) {
            if (keyword.includes(' ')){
                keyword = keyword.replaceAll(' ', "' and g.Japanese contains '")
            }
            get = "match exchange=(:Character)-[:SPEAKER_OF]->(g:Genji_Poem)<-[:ADDRESSEE_OF]-(:Character), chp=(g)-[:INCLUDED_IN]->(:Chapter), trans = (g)-[:TRANSLATION_OF]-(:Translation)-[:TRANSLATOR_OF]-(:People) where g.Japanese contains '"+keyword+"' return exchange, chp, trans"
        } else {
            get = "match exchange=(:Character)-[:SPEAKER_OF]->(g:Genji_Poem)<-[:ADDRESSEE_OF]-(:Character), chp=(g)-[:INCLUDED_IN]->(:Chapter), trans = (g)-[:TRANSLATION_OF]-(t:Translation)-[:TRANSLATOR_OF]-(:People) where t.translation contains '"+keyword+"' return exchange, chp, trans"
        }
        const res = await session.readTransaction(tx => tx.run(get, { keyword }))
        let exchange = res.records.map(row => {return toNativeTypes(row.get('exchange'))}).map(row => row.segments)
        let unique_exchange = []
        let pnums = new Set()
        for (let i = 0; i < exchange.length; i++) {
            let pnum = exchange[i][0].end.properties.pnum
            if (!pnums.has(pnum)) {
                pnums.add(pnum)
                unique_exchange.push(exchange[i])
            }
        }
        exchange= unique_exchange
        for (let i = 0; i < exchange.length-1; i++) {
            for (let j = 0; j < exchange.length-i-1; j++) {
                if ((parseInt(exchange[j][0].end.properties.pnum.substring(0, 2)) > parseInt(exchange[j+1][0].end.properties.pnum.substring(0, 2))) 
                || (parseInt(exchange[j][0].end.properties.pnum.substring(0, 2)) >= parseInt(exchange[j+1][0].end.properties.pnum.substring(0, 2)) 
                && parseInt(exchange[j][0].end.properties.pnum.substring(4, 6)) > parseInt(exchange[j+1][0].end.properties.pnum.substring(4, 6)))) {
                    let temp = exchange[j+1]
                    exchange[j+1] = exchange[j]
                    exchange[j] = temp
                }
            }
        }
        // console.log(exchange)
        let trans = res.records.map(row => {return toNativeTypes(row.get('trans'))})
        let trans_mat = trans.map(row => [row.segments[0].start.properties.pnum, row.segments[0].end.properties.translation, row.segments[1].end.properties.name])
        // console.log(trans)
        for (let i = 0; i < trans_mat.length; i++) {
            if (trans_mat[i][2] === 'Waley'){
                if (trans[i].segments[0].end.properties.WaleyPageNum !== undefined) {
                    trans_mat[i].push(trans[i].segments[0].end.properties.WaleyPageNum)
                } else {
                    trans_mat[i].push('N/A')
                }
            }
        }  
        if (JSON.stringify(this.state.trans_mat) !== JSON.stringify(trans_mat)) {
            this.setState({
                exchange: exchange,
                trans_mat: trans_mat,
            }, () => console.log('updated search state'))
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

    getOptions(pnum, trans) {
        let options = trans.filter(trans => trans[0] === pnum).sort((a, b) => {
            if (a[2] < b[2]) {
                return -1
            } else {
                return 1
            }
        });
        return (
            <options key={pnum+trans[2]}>{trans[2]}</options>
        )
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
            // <p>{this.state.keyword}</p>
            <div>
                <table>
                    <thead>
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
                            <select className={'ptcol3'}>
                                <option>Translation A</option>
                                <option>Cranston</option>
                                <option>Seidensticker</option>
                                <option>Tyler</option>
                                <option>Waley</option>
                                <option>Washburn</option>
                            </select>
                        </th>
                        <th>
                            <select className={'ptcol4'}>
                                <option>Translation B</option>
                                <option>Cranston</option>
                                <option>Seidensticker</option>
                                <option>Tyler</option>
                                <option>Waley</option>
                                <option>Washburn</option>
                            </select>
                        </th>
                    </thead>
                    <tbody>
                        {this.state.exchange.map(row => 
                            <tr key={row[0].end.properties.pnum}>
                                <td>{parseChp(row[0].end.properties.pnum)}</td>
                                <td className='pg'>{parseOrder(row[0].end.properties.pnum)}</td>
                                <td className='spkrCol'>{row[0].start.properties.name}</td>
                                <td className='addrCol'>{row[1].end.properties.name}</td>
                                <td type='JP'>{row[0].end.properties.Japanese}</td>
                                <td>{row[0].end.properties.Romaji}</td>
                                <td>
                                    <select>
                                        {/* {this.state.trans_mat.map(trans => this.getOptions(row[0], trans))} */}
                                    </select>
                                    <p className={row[0]}></p>
                                </td>
                            </tr>)}
                    </tbody>
                </table>
            </div>
        )
    }
}