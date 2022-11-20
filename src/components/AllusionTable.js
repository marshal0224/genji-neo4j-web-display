import React, { useEffect, useMemo, useState } from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes, getChpList } from '../utils'
import { Select, Col, Row, Button, Space, BackTop, Divider, Table, Input, Tag } from 'antd';
import { useParams } from 'react-router-dom';
import 'antd/dist/antd.min.css';

const { Column, ColmnGroup } = Table;

export default function AllusionTable() {
    let [pnum, setPnum] = useState([{ value: '', label: '' }])
    let [data, setData] = useState([])
    let [select, setSelect] = useState('')
    let [query, setQuery] = useState('')
    let [auth, setAuth] = useState(false)
    let [usr, setUsr] = useState('')
    let [pwd, setPwd] = useState('')
    let [allusion, setAllusion] = useState({})

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
            title: 'Vincent',
            dataIndex: 'Vincent',
            key: 'Vincent',
        },
        {
            title: 'Washburn',
            dataIndex: 'Washburn',
            key: 'Washburn',
        },
        {
            title: 'Tyler',
            dataIndex: 'Tyler',
            key: 'Tyler',
        },
        {
            title: 'notes',
            dataIndex: 'notes',
            key: 'notes',
        },
        {
            title: 'Referred to by',
            key: 'link',
            width: 200,
            render: (_, record) => (
                <Row>
                    <Col span={24}>
                        {allusion[record.key] !== undefined ? allusion[record.key].map(e => <Tag>{e}</Tag>) : null}
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
                setQuery("MATCH (g:Genji_Poem {pnum:'" + select + "'}), (h:Honka {id:'" + key + "'}) MERGE (g)-[:ALLUDES_TO]->(h) MERGE (h)-[:ALLUDED_TO_IN]->(g) return (h)")
                let al = allusion
                if (key in al) {
                    al[key].push(select)
                } else {
                    al[key] = [select]
                }
                setAllusion(al)
            }
        }
        setSelect('')
    }

    useMemo(() => {
        const _ = async () => {
            initDriver(process.env.REACT_APP_NEO4J_URI,
                process.env.REACT_APP_NEO4J_USERNAME,
                process.env.REACT_APP_NEO4J_PASSWORD)
            const driver = getDriver()
            const session = driver.session()
            let write = await session.writeTransaction(tx => tx.run(query))
            session.close()
            closeDriver()
        }
        if (query !== '') {
            _().catch(console.error)
            alert('Linked created!')
        }
    }, [query])

    useEffect(() => {
        let get = 'match (a:Honka) return (a) as honka'
        let getPnum = 'match (g:Genji_Poem) return g.pnum as pnum'
        let getLinks = 'MATCH (n:Honka)-[]-(p:Genji_Poem) RETURN n.id as id, p.pnum as pnum'
        const _ = async () => {
            initDriver(process.env.REACT_APP_NEO4J_URI,
                process.env.REACT_APP_NEO4J_USERNAME,
                process.env.REACT_APP_NEO4J_PASSWORD)
            const driver = getDriver()
            const session = driver.session()
            const res = await session.readTransaction(tx => tx.run(get))
            const resPnum = await session.readTransaction(tx => tx.run(getPnum))
            const resLink = await session.readTransaction(tx => tx.run(getLinks))
            let ans = []
            res.records.map(e => toNativeTypes(e.get('honka'))).forEach(e => {
                delete Object.assign(e.properties, { ['key']: e.properties['id'] })['id']
                ans.push(e.properties)
            })
            setData(ans)
            let temp = resPnum.records.map(e => e.get('pnum'))
            let ls = []
            temp.forEach(e => {
                ls.push({ value: e, label: e })
            })
            setPnum(ls)
            let ll = Array.from(new Set(resLink.records.map(e => JSON.stringify([e.get('id'), e.get('pnum')])))).map(e => JSON.parse(e))
            let links = new Object()
            ll.forEach(e => {
                if (e[0] in links) {
                    links[e[0]].push(e[1])
                } else {
                    links[e[0]] = [e[1]]
                }
            })
            setAllusion(links)
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
                    <BackTop>
                        <div>Back to top</div>
                    </BackTop>
                </Col>
            </Row>
        </div>
    )
}