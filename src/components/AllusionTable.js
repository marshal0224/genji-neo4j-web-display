import React, { useEffect, useMemo, useState, useReducer } from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes, getChpList } from '../utils'
import { Select, Col, Row, Button, Space, BackTop, Divider, Table, Input, Tag } from 'antd';
import { useParams } from 'react-router-dom';
import 'antd/dist/antd.min.css';
import TextArea from 'antd/lib/input/TextArea';

export default function AllusionTable() {
    const [pnum, setPnum] = useState([{ value: '', label: '' }])
    const [data, setData] = useState([])
    const [select, setSelect] = useState('')
    const [query, setQuery] = useState([])
    const [poet, setPoet] = useState([])
    const [source, setSource] = useState([])
    const [auth, setAuth] = useState(false)
    const [usr, setUsr] = useState('')
    const [pwd, setPwd] = useState('')
    const [allusion, setAllusion] = useState({})
    const [maxID, setMaxID] = useState(0)
    const [newHonka, setNewHonka] = useState('')
    const [newRomaji, setNewRomaji] = useState('')
    const [newSO, setNewSO] = useState('')
    const [newTranslator, setNewTranslator] = useState('')
    const [newTranslation, setNewTranslation] = useState('')
    const [newPoet, setNewPoet] = useState('')
    const [newSource, setNewSource] = useState('')
    const [selectedTranslation, setSelectedTranslation] = useState('Vincent')

    const forceUpdate = useReducer(x => x + 1, 0)[1]

    const vincent = [process.env.REACT_APP_USERNAME, process.env.REACT_APP_PASSWORD]
    const columns = [
        {
            title: 'ID',
            dataIndex: 'key',
            key: 'ID'
        },
        {
            title: 'Honka',
            dataIndex: 'Honka',
            key: 'Honka',
            width: 280,
            textWrap: 'word-break',
        },
        {
            title: 'Romaji',
            dataIndex: 'Romaji',
            key: 'Romaji',
        },
        {
            title: 'Source',
            dataIndex: 'source_and_number',
            key: 'Source',
            render: (text) => (
                <Row>
                    <p>{text}</p>
                    <Divider></Divider>
                    <Col span={24}>
                        {auth === true
                            ? <><Select
                                showSearch
                                options={pnum}
                                style={{
                                    width: '60%',
                                }}
                                onChange={handleSelect}
                            ></Select><Button
                            // onClick={() => createLink(record.key)}
                            >Link</Button></>
                            : null}
                    </Col>
                </Row>
            )
        },
        {
            title: (
                <Select 
                    value={selectedTranslation} 
                    onChange={(value) => setSelectedTranslation(value)}  
                    options={[{value: 'Tyler', label: 'Tyler'},{value: 'Vincent', label: 'Vincent'},{value: 'Washburn', label: 'Washburn'}]}
                    width={100}
                />
            ),
            dataIndex: 'name',
            key: 'name',
            render: (value, record) => {
                if (selectedTranslation === 'Vincent') {
                    return record.Vincent;
                } else if (selectedTranslation === 'Washburn') {
                    return record.Washburn;
                } else if (selectedTranslation === 'Tyler') {
                    return record.Tyler;
                }
            },
        },
        {
            title: 'notes',
            dataIndex: 'notes',
            key: 'notes',
        },
        {
            title: 'Alluded to by',
            key: 'link',
            width: 200,
            render: (_, record) => (
                <Row>
                    <Col span={24}>
                        {allusion[record.key] !== undefined ? allusion[record.key].map(e => <Tag
                            visible={e[1]}
                            onClick={deleteLink(e[0], record.key)}
                        >{e[0]}</Tag>) : null}
                    </Col>
                    <Divider></Divider>
                    <Col span={24}>
                        {auth === true
                            ? <><Select
                                showSearch
                                options={pnum}
                                style={{
                                    width: '60%',
                                }}
                                onChange={handleSelect}
                            ></Select><Button
                                onClick={() => createLink(record.key)}
                            >Link</Button></>
                            : null}
                    </Col>
                </Row>
            )
        }
    ]

    const handleSelect = (value) => {
        setSelect(value)
    }

    const createLink = (key) => {
        if (select === '') {
            alert('Need to select a pnum!')
        } else {
            let bool = window.confirm('About to link between ' + key + ' and ' + select + '. ')
            if (bool) {
                setQuery(["MATCH (g:Genji_Poem {pnum:'" + select + "'}), (h:Honka {id:'" + key + "'}) MERGE (g)-[:ALLUDES_TO]->(h) MERGE (h)-[:ALLUDED_TO_IN]->(g) return (h)", 'link'])
                let al = allusion
                if (key in al) {
                    al[key].push([select, true])
                } else {
                    al[key] = [[select, true]]
                }
                setAllusion(al)
            } else {
                alert('Canceled. If you still want to link between ' + key + ' and ' + select + ', choose another poem and switch back.')
            }
        }
        setSelect('')
    }

    const deleteLink = (pnum, id) => () => {
        if (auth) {
            let bool = window.confirm('About to delete a honka link.')
            if (bool) {
                let index = allusion[id].findIndex(e => JSON.stringify(e) === JSON.stringify([pnum, true]))
                let a = allusion
                a[id][index][1] = false
                setAllusion(a)
                forceUpdate()
                setQuery(["MATCH (g:Genji_Poem {pnum:'" + pnum + "'})-[r:ALLUDES_TO]->(h:Honka {id:'" + id + "'}), (h)-[s:ALLUDED_TO_IN]->(g) delete r delete s return (g)", 'delete'])
            }
        }
    }

    const newEntry = () => {
        let id = 'H' + (maxID + 1)
        setQuery(['match (p:People {name:"' + newPoet + '"}), (s:Source {title:"' + newSource + '"}) merge path=(p)-[:AUTHOR_OF]->(h:Honka {id: "' + id + '"})-[:ANTHOLOGIZED_IN]->(s) set h.Honka="' + newHonka + '", h.Romaji="' + newRomaji + '", h.source_and_number="' + newSO + '", h.' + newTranslator + '="' + newTranslation + '" return "entry" as res', 'entry'])
        setNewHonka('')
        setNewRomaji('')
        setNewSO('')
        setNewPoet('')
        setNewSource('')
    }

    useMemo(() => {
        const _ = async () => {
            initDriver(process.env.REACT_APP_NEO4J_URI,
                process.env.REACT_APP_NEO4J_USERNAME,
                process.env.REACT_APP_NEO4J_PASSWORD)
            const driver = getDriver()
            const session = driver.session()
            let write = await session.writeTransaction(tx => tx.run(query[0]))
            session.close()
            closeDriver()
        }
        if (query.length > 0) {
            if (query[1] === 'entry') {
                let bool = window.confirm('About to create a new Honka!')
                if (bool) {
                    _().catch(console.error)
                    setMaxID(maxID + 1)
                }
            } else if (query[1] === 'link') {
                _().catch(console.error)
                alert('Linked created!')
            } else if (query[1] === 'delete') {
                _().catch(console.error)
                alert('Linked deleted!')
            }
        }
    }, [query])

    // table content
    useEffect(() => {
        let get = 'match (a:Honka) return (a) as honka'
        let getPnum = 'match (g:Genji_Poem) return g.pnum as pnum'
        let getLinks = 'MATCH (n:Honka)-[]-(p:Genji_Poem) RETURN n.id as id, p.pnum as pnum'
        let getPoet = 'match (p:People) return p.name as poet'
        let getSource = 'match (s:Source) return s.title as source'
        const _ = async () => {
            initDriver(process.env.REACT_APP_NEO4J_URI,
                process.env.REACT_APP_NEO4J_USERNAME,
                process.env.REACT_APP_NEO4J_PASSWORD)
            const driver = getDriver()
            const session = driver.session()
            const res = await session.readTransaction(tx => tx.run(get))
            const resPnum = await session.readTransaction(tx => tx.run(getPnum))
            const resLink = await session.readTransaction(tx => tx.run(getLinks))
            const resPoet = await session.readTransaction(tx => tx.run(getPoet))
            const resSrc = await session.readTransaction(tx => tx.run(getSource))
            let ans = []
            let max = 0
            let key = 0
            res.records.map(e => toNativeTypes(e.get('honka'))).forEach(e => {
                delete Object.assign(e.properties, { ['key']: e.properties['id'] })['id']
                e.properties.translations = { Vincent: e.properties.Vincent, Washburn: e.properties.Washburn, Tyler: e.properties.Tyler }
                ans.push(e.properties)
                key = parseInt(e.properties.key.slice(1))
                if (max < key) {
                    max = key
                }
            })
            setData(ans)
            if (maxID !== max) {
                setMaxID(max)
            }
            let temp = resPnum.records.map(e => e.get('pnum'))
            let ls = []
            temp.forEach(e => {
                ls.push({ value: e, label: e })
            })
            setPnum(ls)
            let ll = Array.from(new Set(resLink.records.map(e => JSON.stringify([e.get('id'), e.get('pnum')])))).map(e => JSON.parse(e))
            let links = {}
            ll.forEach(e => {
                if (e[0] in links) {
                    links[e[0]].push([e[1], true])
                } else {
                    links[e[0]] = [[e[1], true]]
                }
            })
            setAllusion(links)
            temp = resPoet.records.map(e => e.get('poet'))
            let poets = []
            temp.forEach(e => {
                poets.push({ value: e, label: e })
            })
            setPoet(poets)
            temp = resSrc.records.map(e => e.get('source'))
            let sources = []
            temp.forEach(e => {
                sources.push({ value: e, label: e })
            })
            setSource(sources)
            session.close()
            closeDriver()
        }
        _().catch(console.error)
    }, [])

    return (
        <div>
            <Row>
                <Col span={21}>
                    <Table dataSource={data} columns={columns} />
                </Col>
                <Col span={3}>
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
                    <Button disabled={auth} onClick={() => (usr === vincent[0]) && (pwd === vincent[1]) ? setAuth(true) : console.log(usr, pwd)}>Login</Button>
                    <Button disabled={!auth} onClick={() => setAuth(false)}>Logout</Button>
                    <Divider></Divider>
                    {auth === true
                        ? <>
                            <p>ID: H{maxID + 1}</p>
                            <label>Honka</label>
                            <TextArea
                                onChange={(event) => setNewHonka(event.target.value)}
                            />
                            <label>Romaji</label>
                            <TextArea
                                onChange={(event) => setNewRomaji(event.target.value)}
                            />
                            <label>Source and order</label>
                            <TextArea
                                placeholder='E.g. Kokinshu 123, notice the space in between'
                                onChange={(event) => setNewSO(event.target.value)}
                            />
                            <label>Translator</label>
                            <Select
                                showSearch
                                style={{
                                    width: '100%'
                                }}
                                options={poet}
                                value={newTranslator}
                                onChange={(value) => setNewTranslator(value)}
                            />
                            <label>Translation</label>
                            <TextArea
                                onChange={(event) => setNewTranslation(event.target.value)}
                            />
                            <label>Poet</label>
                            <Select
                                showSearch
                                style={{
                                    width: '100%'
                                }}
                                options={poet}
                                value={newPoet}
                                onChange={(value) => setNewPoet(value)}
                            />
                            <label>Source</label>
                            <Select
                                showSearch
                                style={{
                                    width: '100%'
                                }}
                                options={source}
                                value={newSource}
                                onChange={(value) => setNewSource(value)}
                            />
                            <Button onClick={newEntry}>Create</Button>
                        </>
                        : null}
                    <BackTop>
                        <div>Back to top</div>
                    </BackTop>
                </Col>
            </Row>
        </div>
    )
}