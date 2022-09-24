import React, { useMemo, useState } from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes, getChpList } from '../utils'
import { Select, Col, Row, Button, Space, BackTop } from 'antd';
import 'antd/dist/antd.min.css';
import { Link, Outlet } from 'react-router-dom';
const { Option } = Select;

export default function PoemQuery() {
    const [chapters, setChapters] = useState([])
    const [chpSelect, setChpSelect] = useState([false])
    const [count, setCount] = useState([])
    useMemo(() => {
        let get = 'match (:Genji_Poem)-[r:INCLUDED_IN]->(c:Chapter) return c.chapter_number as num, c.chapter_name as name, count(r) as count'
        const _ = async () => {
            initDriver( process.env.REACT_APP_NEO4J_URI, 
                process.env.REACT_APP_NEO4J_USERNAME, 
                process.env.REACT_APP_NEO4J_PASSWORD )
            const driver = getDriver()
            const session = driver.session()
            const res = await session.readTransaction(tx => tx.run(get))
            let chp = []
            const ls = getChpList()
            res.records.forEach(element => {
                chp.push({
                    num: Object.values(toNativeTypes(element.get('num'))).join(''),
                    count: toNativeTypes(element.get('count')).low,
                    name: ls[chp.length]
                })
            });
            setChapters(chp)
            session.close()
            closeDriver()
        }
        _().catch(console.error)
    }, [])

    return (
        <Row>
            <Col span={4}>
                <Select 
                    showSearch
                    placeholder="Select a chapter"
                    style={{ width:220 }}
                    onChange={(value, option) => {
                        setChpSelect([true, value])
                        setCount(Array.from({length: chapters[value-1].count}, (_, i) => i + 1))
                    }}
                >
                    {chapters.map(chp => 
                        <Option
                            key={chp.num}
                            value={chp.num}
                        >
                            {chp.num + ' ' + chp.name}
                        </Option>
                    )}
                </Select>
                <Select
                    showSearch
                    placeholder="#"
                    disabled={!chpSelect[0]}
                    onChange={(value, option) => {
                        setChpSelect([...chpSelect, value])
                    }}
                >
                    {count.map(ct => 
                        <Option
                            key={ct}
                            value={ct}
                        >
                            {ct}
                        </Option>
                    )}
                </Select>
                <br/>
                <Link
                    to={`/poem/${chpSelect[1]}/${chpSelect[2]}`}
                >
                    <Button>Query</Button>
                </Link>
            </Col>
            <Col span={16}>
                <Outlet />
            </Col>
            <Col span={4}></Col>
        </Row>
    )
}