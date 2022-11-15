import React, { useEffect, useState } from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes, getChpList } from '../utils'
import { Select, Col, Row, Button, Space, BackTop, Divider, Table } from 'antd';
import { useParams } from 'react-router-dom';
import 'antd/dist/antd.min.css';

export default function AllusionTable() {
    const columns = [
        {
            title: 'Honka',
            dataIndex: 'Honka',
            key: 'Honka',
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
            title: 'link',
            key: 'link',
            render: (_, record) => (
                <Row>
                    <Select
                        options={[
                            {
                                value: record.key,
                                label: record.key
                            }
                        ]}
                    ></Select>
                    <Button>Link</Button>
                </Row>
            )
        }
    ]
    let [data, setData] = useState([])
    useEffect(() => {
        let get = 'match (a:Honka) return (a) as honka'
        const _ = async () => {
            initDriver( process.env.REACT_APP_NEO4J_URI, 
                process.env.REACT_APP_NEO4J_USERNAME, 
                process.env.REACT_APP_NEO4J_PASSWORD )
            const driver = getDriver()
            const session = driver.session()
            const res = await session.readTransaction(tx => tx.run(get))
            let ans = []
            res.records.map(e => toNativeTypes(e.get('honka'))).forEach(e => {
                delete Object.assign(e.properties, {['key']: e.properties['id'] })['id']
                ans.push(e.properties)
            })
            setData(ans)
            session.close()
            closeDriver()
        }
        _().catch(console.error)
    }, [])
    return(
        <div>
            {/* {JSON.stringify(data)} */}
            <Table dataSource={data} columns={columns} />
        </div>
    )
}