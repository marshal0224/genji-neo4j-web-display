import React, { useMemo, useState, useReducer } from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes, getChpList } from '../utils'
import { Select, Col, Row, Button, Space, BackTop, Divider, Tag, Input } from 'antd';
import { useParams } from 'react-router-dom';
import 'antd/dist/antd.min.css';
import TextArea from 'antd/lib/input/TextArea';

export default function PoemPage() {
    let { chapter, number } = useParams()
    const [speaker, setSpeaker] = useState([])
    const [addressee, setAddressee] = useState([])
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
    const [relQuery, setRelQuery] = useState([])
    const [tag, setTag] = useState([]) // currently linked tags
    const [tagType, setTagType] = useState([''])
    const [tagQuery, setTagQuery] = useState([])
    const [noteQuery, setNoteQuery] = useState('')
    const [select, setSelect] = useState('')
    const [notes, setNotes] = useState("")
    const [auth, setAuth] = useState(false)
    const [usr, setUsr] = useState('')
    const [pwd, setPwd] = useState('')

    const forceUpdate = useReducer(x => x + 1, 0)[1]
    
    const vincent = [process.env.REACT_APP_USERNAME, process.env.REACT_APP_PASSWORD]

    if (number.length === 1) {
        number = '0' + number.toString()
    } else {
        number = number.toString()
    }

    const handleSelect = (value) => {
        setSelect(value)
    }

    const createLink = () => {
        if (select === '') {
            alert('Need to select a tag!')
        } else if (tag.includes(select)) {
            alert('Poem is already tagged as ' + select)
        } else {
            let bool = window.confirm('About to tag this poem as ' + select + '. ')
            if (bool) {
                setTagQuery(['MATCH (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (t:Tag {Type: "' + select + '"}) where g.pnum ends with "' + number + '" merge (g)-[:TAGGED_AS]->(t) return (g)', 'create'])
                let ls = tag
                ls.push([select, true])
                setTag(ls)
            }
        }
        setSelect('')
    }

    const deleteLink = (i) => (event) => {
        let type = event.target.textContent
        if (auth) {
            let bool = window.confirm('About to delete a tag link.')
            if (bool) {
                let temp = tag
                temp[i][1] = false
                setTag(temp)
                forceUpdate()
                setTagQuery(['MATCH (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (g)-[r:TAGGED_AS]->(t:Tag {Type: "' + type + '"}) where g.pnum ends with "' + number + '" delete r return (g)', 'delete'])
            }
        }
    }

    const createRel = () => {
        let selfCheck = false
        for (let i = 0; i < pnum.length; i++) {
            if ((parseInt(pnum[i].value.substring(0, 2)) === parseInt(chapter)) && (parseInt(pnum[i].value.substring(4, 6)) === parseInt(number))) {
                selfCheck = true
                break
            }
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
                setRelQuery(['MATCH (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (s:Genji_Poem {pnum: "' + IA + '"}) where g.pnum ends with "' + number + '" merge (g)-[:INTERNAL_ALLUSION_TO]->(s) merge (s)-[:INTERNAL_ALLUSION_TO]->(g) return (g)', 'create'])
                let ls = rel
                ls.push([IA, true])
                setRel(ls)
            }
        }
        setIA('')
    }

    const deleteRel = (i) => (event) => {
        let p = event.target.textContent
        if (auth) {
            let bool = window.confirm('About to delete a tag link.')
            if (bool) {
                let temp = rel
                temp[i][1] = false
                setRel(temp)
                forceUpdate()
                setRelQuery(['MATCH (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (g)-[r:INTERNAL_ALLUSION_TO]->(s:Genji_Poem {pnum: "' + p + '"}), (s)-[t:INTERNAL_ALLUSION_TO]->(g) where g.pnum ends with "' + number + '" delete r delete t return (g)', 'delete'])
            }
        }
    }

    const updateNote = () => {
        let bool = window.confirm('About to update the notes')
        if (bool) {
            let n = notes
            // n.replace("'", "\\'")
            n = n.toString().replace(/"/g, '\\"');
            // console.log(n)
            setNoteQuery('MATCH (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}) where g.pnum ends with "' + number + '" SET g.notes = "' + n + '" return (g)')
        }
    }

    useMemo(() => {
        let get = 'match poem=(g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), exchange=(s:Character)-[:SPEAKER_OF]->(g)<-[:ADDRESSEE_OF]-(a:Character), trans=(g)-[:TRANSLATION_OF]-(:Translation)-[:TRANSLATOR_OF]-(:People) where g.pnum ends with "' + number + '" return poem, exchange, trans'
        let getHonka = 'match poem=(g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), allusions=(g)-[:ALLUDES_TO]->(:Honka) where g.pnum ends with "' + number + '" return allusions'
        let getSrc = 'match (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (g)-[:ALLUDES_TO]->(h:Honka)-[:ANTHOLOGIZED_IN]-(s:Source) where g.pnum ends with "' + number + '" return h.Honka as text, s.title as title'
        let getRel = 'match (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (g)-[:INTERNAL_ALLUSION_TO]->(s:Genji_Poem) where g.pnum ends with "' + number + '" return s.pnum as rel'
        let getPnum = 'match (g:Genji_Poem) return g.pnum as pnum'
        let getTag = 'match (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (g)-[:TAGGED_AS]->(t:Tag) where g.pnum ends with "' + number + '" return t.Type as type'
        let getTagTypes = 'match (t:Tag) return t.Type as type'
        const _ = async () => {
            initDriver(process.env.REACT_APP_NEO4J_URI,
                process.env.REACT_APP_NEO4J_USERNAME,
                process.env.REACT_APP_NEO4J_PASSWORD)
            const driver = getDriver()
            const session = driver.session()
            const res = await session.readTransaction(tx => tx.run(get))
            const resHonka = await session.readTransaction(tx => tx.run(getHonka))
            const resSrc = await session.readTransaction(tx => tx.run(getSrc))
            const resRel = await session.readTransaction(tx => tx.run(getRel))
            const resTag = await session.readTransaction(tx => tx.run(getTag))
            const resType = await session.readTransaction(tx => tx.run(getTagTypes))
            const resPnum = await session.readTransaction(tx => tx.run(getPnum))
            let exchange = new Set()
            res.records.map(e => JSON.stringify(toNativeTypes(e.get('exchange')))).forEach(e => exchange.add(e))
            exchange = Array.from(exchange).map(e => JSON.parse(e))
            setSpeaker([exchange[0].start.properties.name])
            setAddressee(exchange.map(e => e.end.properties.name))
            setJPRM([exchange[0].segments[0].end.properties.Japanese, exchange[0].segments[0].end.properties.Romaji])
            setNotes(exchange[0].segments[0].end.properties.notes)
            let transTemp = res.records.map(e => toNativeTypes(e.get('trans'))).map(e => [e.end.properties.name, e.segments[0].end.properties.translation])
            transTemp.forEach(e =>
                setTrans(prev => ({
                    ...prev,
                    [e[0]]: e[1]
                })))
            let allusions = new Set()
            resHonka.records.map(e => toNativeTypes(e.get('allusions'))).forEach(e => allusions.add(JSON.stringify(e)))
            allusions = Array.from(allusions).map(e => JSON.parse(e))
            allusions = allusions.map(e => e.end.properties.Honka)
            let sources = resSrc.records.map(e => [Object.values(toNativeTypes(e.get('text'))).join(''), Object.values(toNativeTypes(e.get('title'))).join('')])
            allusions.forEach(e => {
                if (!JSON.stringify(sources).includes(JSON.stringify(e))) {
                    sources.push([e, 'N/A'])
                }
            })
            setSource(sources)
            let related = new Set()
            resRel.records.map(e => toNativeTypes(e.get('rel'))).forEach(e => related.add([Object.values(e).join('')]))
            related = Array.from(related).flat()
            related = related.map(e => [e, true])
            setRel(related)
            let tags = new Set()
            resTag.records.map(e => toNativeTypes(e.get('type'))).forEach(e => tags.add([Object.values(e).join('')]))
            tags = Array.from(tags).flat()
            tags = tags.map(e => [e, true])
            setTag(tags)
            let types = resType.records.map(e => e.get('type'))
            let ls = []
            types.forEach(e => ls.push({value: e, label: e})) 
            setTagType(ls)
            let temp = resPnum.records.map(e => e.get('pnum'))
            let pls = []
            temp.forEach(e => {
                pls.push({value:e, label:e})
            })
            setPnum(pls)
            session.close()
            closeDriver()
        }
        _().catch(console.error)
    }, [chapter, number])

    useMemo(() => {
        const _ = async () => {
            initDriver(process.env.REACT_APP_NEO4J_URI,
                process.env.REACT_APP_NEO4J_USERNAME,
                process.env.REACT_APP_NEO4J_PASSWORD)
            const driver = getDriver()
            const session = driver.session()
            let write = await session.writeTransaction(tx => tx.run(tagQuery[0]))
            session.close()
            closeDriver()
        }
        if (tagQuery.length > 0) {
            if (tagQuery[1] === 'create') {
                _().catch(console.error)
                alert('Link created!')
            } else if (tagQuery[1] === 'delete') {
                _().catch(console.error)
                alert('Link deleted!')
            }
        } 
    }, [tagQuery])

    useMemo(() => {
        const _ = async () => {
            initDriver(process.env.REACT_APP_NEO4J_URI,
                process.env.REACT_APP_NEO4J_USERNAME,
                process.env.REACT_APP_NEO4J_PASSWORD)
            const driver = getDriver()
            const session = driver.session()
            let write = await session.writeTransaction(tx => tx.run(relQuery[0]))
            session.close()
            closeDriver()
        }
        if (relQuery.length > 0) {
            if (relQuery[1] === 'create') {
                _().catch(console.error)
                alert('Link created!')
            } else if (relQuery[1] === 'delete') {
                _().catch(console.error)
                alert('Link deleted!')
            }
        } 
    }, [relQuery])

    useMemo(() => {
        const _ = async () => {
            initDriver(process.env.REACT_APP_NEO4J_URI,
                process.env.REACT_APP_NEO4J_USERNAME,
                process.env.REACT_APP_NEO4J_PASSWORD)
            const driver = getDriver()
            const session = driver.session()
            let write = await session.writeTransaction(tx => tx.run(noteQuery))
            session.close()
            closeDriver()
        }
        if (noteQuery !== '') {
            _().catch(console.error)
            alert('Notes updated!')
            setNoteQuery('')
        } 
    }, [noteQuery])

    return (
        <div>
            <Row>
                <Col span={4}>
                    <b>Speaker</b>
                    {speaker.length !== 0 && speaker.map(e =>
                        <p>{e}</p>
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
                    <p type='non-JP'>{trans['Waley']}</p>
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
                {source.map(e =>
                    <Col flex={1}>
                        {e[0]}
                        <br />
                        <b>{e[1]}</b>
                    </Col>
                )}
            </Row>
            <Divider>Related Poems</Divider>
            <Row>
                <Col span={24}>
                    {rel.map(e =>
                            <Tag
                                visible={e[1]}
                                onClick={deleteRel(rel.indexOf(e))}
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
                            options={pnum}
                            value={IA}
                            style={{
                                width: '20%',
                            }}
                        onChange={(value) => setIA(value)}
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
                            onClick={deleteLink(tag.indexOf(e))}
                        >{e[0]}</Tag>
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
                        onChange={handleSelect}
                        ></Select>
                        <Button
                            onClick={() => createLink()}
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
                    ? <><TextArea defaultValue={notes} onChange={(event) => setNotes(event.target.value)}/><Button onClick={() => updateNote()}>Update</Button></>
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