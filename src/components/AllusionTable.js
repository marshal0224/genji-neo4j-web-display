import React, { useEffect, useMemo, useState } from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes, getChpList } from '../utils'
import { Select, Col, Row, Button, Space, BackTop, Divider, Table } from 'antd';
import { useParams } from 'react-router-dom';
import 'antd/dist/antd.min.css';
import { getAllByPlaceholderText } from '@testing-library/react';

const { Column, ColmnGroup } = Table;

export default function AllusionTable() {
    let [pnum, setPnum] = useState([{ value: '', label: '' }])
    let [data, setData] = useState([])
    let [select, setSelect] = useState('')
    let [query, setQuery] = useState('')

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
                    <Select
                        showSearch
                        options={pnum}
                        style={{
                            width: '60%',
                        }}
                        onChange={handleSelect}
                    ></Select>
                    <Button
                        onClick={() => createLink(record.key)}
                    >Link</Button>
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
            }
        }
        setSelect('')
    }

    useEffect(() => {
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
        const _ = async () => {
            initDriver(process.env.REACT_APP_NEO4J_URI,
                process.env.REACT_APP_NEO4J_USERNAME,
                process.env.REACT_APP_NEO4J_PASSWORD)
            const driver = getDriver()
            const session = driver.session()
            const res = await session.readTransaction(tx => tx.run(get))
            const resPnum = await session.readTransaction(tx => tx.run(getPnum))
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
            session.close()
            closeDriver()
        }
        _().catch(console.error)
    }, [])
    return (
        <div>
            {/*   <Table dataSource={data}>
        <ColumnGroup title="Name">
        <Column title="First Name" dataIndex="firstName" key="firstName" />
        <Column title="Last Name" dataIndex="lastName" key="lastName" />
        </ColumnGroup>
        <Column title="Age" dataIndex="age" key="age" />
        <Column title="Address" dataIndex="address" key="address" />
        <Column
        title="Tags"
        dataIndex="tags"
        key="tags"
        render={(tags) => (
            <>
            {tags.map((tag) => (
                <Tag color="blue" key={tag}>
                {tag}
                </Tag>
            ))}
            </>
        )}
        />
        <Column
        title="Action"
        key="action"
        render={(_, record) => (
            <Space size="middle">
            <a>Invite {record.lastName}</a>
            <a>Delete</a>
            </Space>
        )}
        />
    </Table> */}
            <Table dataSource={data} columns={columns}>
                {/* <Column title="Honka" width={1}/> */}
            </Table>
        </div>
    )
}