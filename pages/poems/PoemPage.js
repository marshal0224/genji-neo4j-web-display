import React, { useMemo, useState, useReducer, useEffect } from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j.js'
import { toNativeTypes } from '../utils'
import { Button, Col, Divider, Input, Row, Space, Spin, Select, Tag, } from 'antd';
import 'antd/dist/antd.min.css';
import TextArea from 'antd/lib/input/TextArea';
import Link from 'next/link.js';

// export async function getServerSideProps({ query }) {
//     let chapter = query.chapter
//     let number = query.number
//     let speaker = []
//     let addressee = []
//     let JPRM = []
//     let notes = ''
//     let trans = {
//         Waley: 'N/A',
//         Seidensticker: 'N/A',
//         Tyler: 'N/A',
//         Washburn: 'N/A',
//         Cranston: 'N/A'
//     }
//     let source = {}
//     let rel = []
//     let tag = []
//     let tagTypes = []
//     let pnum = []
//     let get = 'match poem=(g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), exchange=(s:Character)-[:SPEAKER_OF]->(g)<-[:ADDRESSEE_OF]-(a:Character), trans=(g)-[:TRANSLATION_OF]-(:Translation)-[:TRANSLATOR_OF]-(:People) where g.pnum ends with "' + number + '" return poem, exchange, trans'
//     let getHonkaInfo = 'match (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (g)-[n:ALLUDES_TO]->(h:Honka)-[r:ANTHOLOGIZED_IN]-(s:Source), (h)<-[:AUTHOR_OF]-(a:People), (h)<-[:TRANSLATION_OF]-(t:Translation)<-[:TRANSLATOR_OF]-(p:People) where g.pnum ends with "' + number + '" return h.Honka as honka, h.Romaji as romaji, s.title as title, a.name as poet, r.order as order, p.name as translator, t.translation as translation, n.notes as notes'
//     let getRel = 'match (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (g)-[:INTERNAL_ALLUSION_TO]->(s:Genji_Poem) where g.pnum ends with "' + number + '" return s.pnum as rel'
//     let getPnum = 'match (g:Genji_Poem) return g.pnum as pnum'
//     let getTag = 'match (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (g)-[:TAGGED_AS]->(t:Tag) where g.pnum ends with "' + number + '" return t.Type as type'
//     let getTagTypes = 'match (t:Tag) return t.Type as type'
//     initDriver(process.env.REACT_APP_NEO4J_URI,
//         process.env.REACT_APP_NEO4J_USERNAME,
//         process.env.REACT_APP_NEO4J_PASSWORD)
//     const driver = getDriver()
//     const session = driver.session()
//     const res = await session.readTransaction(tx => tx.run(get))
//     const resHonkaInfo = await session.readTransaction(tx => tx.run(getHonkaInfo))
//     const resRel = await session.readTransaction(tx => tx.run(getRel))
//     const resTag = await session.readTransaction(tx => tx.run(getTag))
//     const resType = await session.readTransaction(tx => tx.run(getTagTypes))
//     const resPnum = await session.readTransaction(tx => tx.run(getPnum))
//     // holds unique values of speaker & addressee & Japanese & Romaji (top row)
//     let exchange = new Set()
//     res.records.map(e => JSON.stringify(toNativeTypes(e.get('exchange')))).forEach(e => exchange.add(e))
//     exchange = Array.from(exchange).map(e => JSON.parse(e))
//     speaker = [exchange[0].start.properties.name]
//     addressee = exchange.map(e => e.end.properties.name)
//     JPRM = [exchange[0].segments[0].end.properties.Japanese, exchange[0].segments[0].end.properties.Romaji]
//     notes = exchange[0].segments[0].end.properties.notes
//     let transTemp = res.records.map(e => toNativeTypes(e.get('trans'))).map(e => [e.end.properties.name, e.segments[0].end.properties.translation, e.segments[1].start.properties.WaleyPageNum])
//     transTemp.forEach(e =>
//         trans = prev => ({
//             ...prev,
//             [e[0]]: e[0] !== 'Waley' ? e[1] : [e[1], e[2]]
//         }))
//     let sources = resHonkaInfo.records.map(e => [Object.values(toNativeTypes(e.get('honka'))).join(''), Object.values(toNativeTypes(e.get('title'))).join(''), Object.values(toNativeTypes(e.get('romaji'))).join(''), Object.values(toNativeTypes(e.get('poet'))).join(''), Object.values(toNativeTypes(e.get('order'))).join(''), Object.values(toNativeTypes(e.get('translator'))).join(''), Object.values(toNativeTypes(e.get('translation'))).join(''), e.get('notes') !== null ? Object.values(toNativeTypes(e.get('notes'))).join('') : 'N/A'])
//     let src_obj = []
//     let index = 0
//     let entered_honka = []
//     sources.forEach(e => {
//         if (entered_honka.includes(e[0])) {
//             src_obj[src_obj.findIndex(el => el.honka === e[0])].translation.push([e[5], e[6]])
//         } else {
//             src_obj.push({id: index, honka: e[0], source: e[1], romaji: e[2], poet: e[3], order: e[4], translation:  [[e[5], e[6]]], notes: e[7]})
//             entered_honka.push(e[0])
//         }
//     })
//     source = src_obj
//     let related = new Set()
//     resRel.records.map(e => toNativeTypes(e.get('rel'))).forEach(e => related.add([Object.values(e).join('')]))
//     related = Array.from(related).flat()
//     related = related.map(e => [e, true])
//     rel = related
//     let tags = new Set()
//     resTag.records.map(e => toNativeTypes(e.get('type'))).forEach(e => tags.add([Object.values(e).join('')]))
//     tags = Array.from(tags).flat()
//     tags = tags.map(e => [e, true])
//     tag = tags
//     let types = resType.records.map(e => e.get('type'))
//     let ls = []
//     types.forEach(e => ls.push({value: e, label: e})) 
//     tagTypes = ls
//     let temp = resPnum.records.map(e => e.get('pnum'))
//     let pls = []
//     temp.forEach(e => {
//         pls.push({value:e, label:e})
//     })
//     pnum = pls
//     session.close()
//     closeDriver()
//     return {
//         props: {
//             initSpeaker: speaker,
//             initAddressee: addressee,
//             initJPRM: JPRM,
//             initNotes: notes,
//             initTrans: trans,
//             initSource: source,
//             initRel: rel,
//             initTag: tag,
//             initTagTypes: tagTypes,
//             initPnum: pnum
//         }
//     }
// }

export default function PoemPage( props ) {
    let chapter = props.chapter
    let number = props.number
    const [speaker, setSpeaker] = useState([])
    const [addressee, setAddressee] = useState([])
    // Japanese and Romaji
    const [JPRM, setJPRM] = useState([])
    const [trans, setTrans] = useState({
        Waley: 'N/A',
        Seidensticker: 'N/A',
        Tyler: 'N/A',
        Washburn: 'N/A',
        Cranston: 'N/A'
    })
    const [source, setSource] = useState([]) // currently linked honka
    const [rel, setRel] = useState([]) // currently linked related poems
    const [IA, setIA] = useState('') // internal allusion selection
    const [pnum, setPnum] = useState([]) 
    const [query, setQuery] = useState([])
    const [tag, setTag] = useState([]) // currently linked tags
    const [tagType, setTagType] = useState([''])
    const [select, setSelect] = useState('')
    const [notes, setNotes] = useState("")
    const [auth, setAuth] = useState(false)
    const [usr, setUsr] = useState('')
    const [pwd, setPwd] = useState('')

    const forceUpdate = useReducer(x => x + 1, 0)[1]

    // const vincent = [process.env.REACT_APP_USERNAME, process.env.REACT_APP_PASSWORD]
    if (number.length === 1) {
        number = '0' + number.toString()
    } else {
        number = number.toString()
    }

    const createTag = () => {
        if (select === '') {
            alert('Need to select a tag!')
        } else if (tag.includes(select)) {
            alert('Poem is already tagged as ' + select)
        } else {
            let bool = window.confirm('About to tag this poem as ' + select + '. ')
            if (bool) {
                setQuery(['MATCH (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (t:Tag {Type: "' + select + '"}) where g.pnum ends with "' + number + '" merge (g)-[:TAGGED_AS]->(t) return (g)', 'create tag'])
                let ls = tag
                ls.push([select, true])
                setTag(ls)
            }
        }
        setSelect('')
    }

    const deleteTag = (i) => (event) => {
        let type = event.target.textContent
        if (auth) {
            let bool = window.confirm('About to delete a tag.')
            if (bool) {
                let temp = tag
                temp[i][1] = false
                setTag(temp)
                forceUpdate()
                setQuery(['MATCH (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (g)-[r:TAGGED_AS]->(t:Tag {Type: "' + type + '"}) where g.pnum ends with "' + number + '" delete r return (g)', 'delete tag'])
            }
        }
    }

    const createRel = () => {
        let selfCheck = false
        if ((parseInt(IA.substring(0, 2)) === parseInt(chapter)) && (parseInt(IA.substring(4, 6)) === parseInt(number))) {
            selfCheck = true
        }
        if (IA === '') {
            alert('Need to select a poem!')
        } else if (selfCheck) {
            alert('Cannot self-link!')
        } else if (rel.includes(IA)) {
            alert('Relation already exists')
        } else {
            let bool = window.confirm('About to relate this poem to ' + IA + '. ')
            if (bool) {
                setQuery(['MATCH (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (s:Genji_Poem {pnum: "' + IA + '"}) where g.pnum ends with "' + number + '" merge (g)-[:INTERNAL_ALLUSION_TO]->(s) merge (s)-[:INTERNAL_ALLUSION_TO]->(g) return (g)', 'create rel'])
                let ls = rel
                ls.push([IA, true])
                setRel(ls)
            }
        }
        setIA('')
    }

    /**
     * 
     * @param {Number} i index of an internal allusion inside the rel state variable
     */
    const deleteRel = (i) => (event) => {
        let p = event.target.textContent
        if (auth) {
            let bool = window.confirm('About to delete a internal allusion link.')
            if (bool) {
                let temp = rel
                temp[i][1] = false
                setRel(temp)
                forceUpdate()
                setQuery(['MATCH (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (g)-[r:INTERNAL_ALLUSION_TO]->(s:Genji_Poem {pnum: "' + p + '"}), (s)-[t:INTERNAL_ALLUSION_TO]->(g) where g.pnum ends with "' + number + '" delete r delete t return (g)', 'delete rel'])
            }
        }
    }

    const updateNotes = () => {
        let bool = window.confirm('About to update the notes')
        if (bool) {
            let n = notes
            n = n.toString().replace(/"/g, '\\"');
            setQuery(['MATCH (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}) where g.pnum ends with "' + number + '" SET g.notes = "' + n + '" return (g)', 'notes'])
        }
    }

    // pulls the content of a poem page based on chapter and number
    // useEffect(() => {
    //     setInitRender(false)
    //     let get = 'match poem=(g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), exchange=(s:Character)-[:SPEAKER_OF]->(g)<-[:ADDRESSEE_OF]-(a:Character), trans=(g)-[:TRANSLATION_OF]-(:Translation)-[:TRANSLATOR_OF]-(:People) where g.pnum ends with "' + number + '" return poem, exchange, trans'
    //     let getHonkaInfo = 'match (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (g)-[n:ALLUDES_TO]->(h:Honka)-[r:ANTHOLOGIZED_IN]-(s:Source), (h)<-[:AUTHOR_OF]-(a:People), (h)<-[:TRANSLATION_OF]-(t:Translation)<-[:TRANSLATOR_OF]-(p:People) where g.pnum ends with "' + number + '" return h.Honka as honka, h.Romaji as romaji, s.title as title, a.name as poet, r.order as order, p.name as translator, t.translation as translation, n.notes as notes'
    //     let getRel = 'match (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (g)-[:INTERNAL_ALLUSION_TO]->(s:Genji_Poem) where g.pnum ends with "' + number + '" return s.pnum as rel'
    //     let getPnum = 'match (g:Genji_Poem) return g.pnum as pnum'
    //     let getTag = 'match (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (g)-[:TAGGED_AS]->(t:Tag) where g.pnum ends with "' + number + '" return t.Type as type'
    //     let getTagTypes = 'match (t:Tag) return t.Type as type'
    //     setTrans({
    //         Waley: 'N/A',
    //         Seidensticker: 'N/A',
    //         Tyler: 'N/A',
    //         Washburn: 'N/A',
    //         Cranston: 'N/A'
    //     })
    //     const _ = async () => {
    //         initDriver(process.env.REACT_APP_NEO4J_URI,
    //             process.env.REACT_APP_NEO4J_USERNAME,
    //             process.env.REACT_APP_NEO4J_PASSWORD)
    //         const driver = getDriver()
    //         const session = driver.session()
    //         const res = await session.readTransaction(tx => tx.run(get))
    //         const resHonkaInfo = await session.readTransaction(tx => tx.run(getHonkaInfo))
    //         const resRel = await session.readTransaction(tx => tx.run(getRel))
    //         const resTag = await session.readTransaction(tx => tx.run(getTag))
    //         const resType = await session.readTransaction(tx => tx.run(getTagTypes))
    //         const resPnum = await session.readTransaction(tx => tx.run(getPnum))
    //         // holds unique values of speaker & addressee & Japanese & Romaji (top row)
    //         let exchange = new Set()
    //         res.records.map(e => JSON.stringify(toNativeTypes(e.get('exchange')))).forEach(e => exchange.add(e))
    //         exchange = Array.from(exchange).map(e => JSON.parse(e))
    //         setSpeaker([exchange[0].start.properties.name])
    //         setAddressee(exchange.map(e => e.end.properties.name))
    //         setJPRM([exchange[0].segments[0].end.properties.Japanese, exchange[0].segments[0].end.properties.Romaji])
    //         setNotes(exchange[0].segments[0].end.properties.notes)
    //         let transTemp = res.records.map(e => toNativeTypes(e.get('trans'))).map(e => [e.end.properties.name, e.segments[0].end.properties.translation, e.segments[1].start.properties.WaleyPageNum])
    //         transTemp.forEach(e =>
    //             setTrans(prev => ({
    //                 ...prev,
    //                 [e[0]]: e[0] !== 'Waley' ? e[1] : [e[1], e[2]]
    //             })))
    //         let sources = resHonkaInfo.records.map(e => [Object.values(toNativeTypes(e.get('honka'))).join(''), Object.values(toNativeTypes(e.get('title'))).join(''), Object.values(toNativeTypes(e.get('romaji'))).join(''), Object.values(toNativeTypes(e.get('poet'))).join(''), Object.values(toNativeTypes(e.get('order'))).join(''), Object.values(toNativeTypes(e.get('translator'))).join(''), Object.values(toNativeTypes(e.get('translation'))).join(''), e.get('notes') !== null ? Object.values(toNativeTypes(e.get('notes'))).join('') : 'N/A'])
    //         let src_obj = []
    //         let index = 0
    //         let entered_honka = []
    //         sources.forEach(e => {
    //             if (entered_honka.includes(e[0])) {
    //                 src_obj[src_obj.findIndex(el => el.honka === e[0])].translation.push([e[5], e[6]])
    //             } else {
    //                 src_obj.push({id: index, honka: e[0], source: e[1], romaji: e[2], poet: e[3], order: e[4], translation:  [[e[5], e[6]]], notes: e[7]})
    //                 entered_honka.push(e[0])
    //             }
    //         })
    //         setSource(src_obj)
    //         let related = new Set()
    //         resRel.records.map(e => toNativeTypes(e.get('rel'))).forEach(e => related.add([Object.values(e).join('')]))
    //         related = Array.from(related).flat()
    //         related = related.map(e => [e, true])
    //         setRel(related)
    //         let tags = new Set()
    //         resTag.records.map(e => toNativeTypes(e.get('type'))).forEach(e => tags.add([Object.values(e).join('')]))
    //         tags = Array.from(tags).flat()
    //         tags = tags.map(e => [e, true])
    //         setTag(tags)
    //         let types = resType.records.map(e => e.get('type'))
    //         let ls = []
    //         types.forEach(e => ls.push({value: e, label: e})) 
    //         setTagType(ls)
    //         let temp = resPnum.records.map(e => e.get('pnum'))
    //         let pls = []
    //         temp.forEach(e => {
    //             pls.push({value:e, label:e})
    //         })
    //         setPnum(pls)
    //         session.close()
    //         closeDriver()
    //     }
    //     _().catch(console.error)
    // }, [chapter, number])

    // // async func for tag queries
    // useMemo(() => {
    //     const _ = async () => {
    //         initDriver(process.env.REACT_APP_NEO4J_URI,
    //             process.env.REACT_APP_NEO4J_USERNAME,
    //             process.env.REACT_APP_NEO4J_PASSWORD)
    //         const driver = getDriver()
    //         const session = driver.session()
    //         let write = await session.writeTransaction(tx => tx.run(query[0]))
    //         session.close()
    //         closeDriver()
    //     }
    //     if (query.length > 0) {
    //         if (query[1] === 'create tag') {
    //             _().catch(console.error)
    //             alert('tag created!')
    //         } else if (query[1] === 'delete tag') {
    //             _().catch(console.error)
    //             alert('tag deleted!')
    //         } else if (query[1] === 'create rel') {
    //             _().catch(console.error)
    //             alert('link created!')
    //         } else if (query[1] === 'delete rel') {
    //             _().catch(console.error)
    //             alert('link delete!')
    //         } else if (query[1] === 'notes' && query[0] !== '') {
    //             _().catch(console.error)
    //             alert('Notes updated!')
    //             setQuery([])
    //         }
    //     } 
    // }, [query])

    return (
        <div>
            <Row>
                <Col span={4}>
                    <b>Speaker</b>
                    {speaker.length !== 0 && speaker.map(e =>
                        <p key={e}>{e}</p>
                    )}
                    <b>Proxy</b>
                    <br />
                    <p>N/A</p>
                </Col>
                <Col span={8}>
                    <b>Japanese</b>
                    <br />
                    <p type='JP'>{JPRM[0]}</p>
                </Col>
                <Col span={8}>
                    <b>Romaji</b>
                    <br />
                    <p type='non-JP'>{JPRM[1]}</p>
                </Col>
                <Col span={4}>
                    <b>Addressee</b>
                    {addressee.length !== 0 && addressee.map(e =>
                        <p key={e}>{e}</p>
                    )}
                </Col>
            </Row>
            <Divider>Translations</Divider>
            <Row>
                <Col flex={1}>
                    <b>Waley</b>
                    <br />
                    <p type='non-JP'>{trans['Waley'][0]}</p>
                    <p>Page: {trans['Waley'][1] === '-1' ? 'N/A' : trans['Waley'][1]}</p>
                </Col>
                <Divider type="vertical" />
                <Col flex={1}>
                    <b>Seidensticker</b>
                    <br />
                    <p type='non-JP'>{trans['Seidensticker']}</p>
                </Col>
            </Row>
            <Divider type="vertical" />
            <Row>
                <Col flex={1}>
                    <b>Tyler</b>
                    <br />
                    <p type='non-JP'>{trans['Tyler']}</p>
                </Col>
                <Divider type="vertical" />
                <Col flex={1}>
                    <b>Washburn</b>
                    <br />
                    <p type='non-JP'>{trans['Washburn']}</p>
                </Col>
                <Divider type="vertical" />
                <Col flex={1}>
                    <b>Cranston</b>
                    <br />
                    <p type='non-JP'>{trans['Cranston']}</p>
                </Col>
            </Row>
            <Divider>Allusions</Divider>
            <Row>
                {source.length !== 0 ?
                <>
                    {source.map(e => 
                        <Row>
                            <Col span={6}>
                                <label><b>Poet</b></label>
                                <br/>
                                <p>{e.poet}</p>
                            </Col>
                            <Col span={6}>
                                <label><b>Source</b></label>
                                <br/>
                                {e.order !== undefined ? <p>{e.source + ' ' + e.order}</p> : <p>{e.source}</p>}
                            </Col>
                            <Col span={6}>
                                <label><b>Honka</b></label>
                                <br/>
                                <p type={'JP'}>{e.honka}</p>
                            </Col>
                            <Col span={6}>
                                <label><b>Romaji</b></label>
                                <br/>
                                <p>{e.romaji}</p>
                            </Col>
                            <br/>
                            <Col span={24}>
                                <label><b>Notes</b></label>
                                <br/>
                                <p>{e.notes}</p>
                            </Col>
                            <br/>
                            {
                                e.translation.map(el => 
                                    <Col flex={1}>
                                        <label><b>{el[0]}</b></label>
                                        <br/>
                                        <p>{el[1]}</p>
                                    </Col>
                                )
                            }
                            <Divider />
                        </Row>
                    )}
                    {/* <Table 
                        dataSource={source} 
                        columns={allusionColumns} 
                        pagination={false}
                    /> */}
                    </> : null
                }
            </Row>
            <Divider>Related Poems</Divider>
            <Row>
                <Col span={24}>
                    {rel.map(e =>
                        <Link 
                            to={`/poems/${parseInt(e[0].substring(0, 2))}/${parseInt(e[0].substring(4, 6))}`}
                            target="_blank"
                            onClick={(event) => auth ? event.preventDefault() : event}
                        >
                            <Tag
                                visible={e[1]}
                                onClick={deleteRel(rel.indexOf(e))}
                            >
                                {e[0]}
                            </Tag>
                        </Link>
                    )}
                </Col>
                <Divider></Divider>
                <Col span={24}>
                    {auth === true
                        ? <><Select
                            showSearch
                            options={pnum}
                            value={IA}
                            style={{
                                width: '20%',
                            }}
                            onChange={(value) => {
                                setIA(value)
                            }}
                        ></Select>
                        <Button
                            onClick={() => createRel()}
                        >
                            Link
                        </Button></>
                        : null}
                </Col>
            </Row>
            <Divider>Tags</Divider>
            <Row>
                <Col span={24}>
                    {tag.map(e =>
                        <Tag 
                            visible={e[1]}
                            onClick={deleteTag(tag.indexOf(e))}
                        >
                            {e[0]}
                        </Tag>
                    )}
                </Col>
                <Divider></Divider>
                <Col span={24}>
                    {auth === true
                        ? <><Select
                            showSearch
                            options={tagType}
                            value={select}
                            style={{
                                width: '20%',
                            }}
                            onChange={(value) => setSelect(value)}
                        />
                        <Button
                            onClick={() => createTag()}
                        >
                            Link
                        </Button></>
                        : null}
                </Col>
            </Row>
            <Divider></Divider>
            <Row>
                <b>Notes:</b>
                <br />
                <p type="non-JP">{notes}</p>
                {auth === true 
                    ? <><TextArea 
                        defaultValue={notes} 
                        onChange={(event) => setNotes(event.target.value)}
                    />
                    <Button onClick={() => updateNotes()}>Update</Button></>
                : null}
            </Row>
            <Divider></Divider>
            <Row align='middle'>
                <Col offset={10}>
                    <Space direction='vertical'>
                        <Input
                            placeholder="input username"
                            onChange={(event) => setUsr(event.target.value)}
                        />
                        <Input.Password
                            placeholder="input password"
                            onChange={(event) => setPwd(event.target.value)}
                        />
                    </Space>
                    <Button disabled={auth} onClick={() => (usr === vincent[0]) && (pwd === vincent[1]) ? setAuth(true) : null}>Login</Button>
                    <Button disabled={!auth} onClick={() => setAuth(false)}>Logout</Button>
                </Col>
            </Row>
        </div>
    )
}