import React, { useMemo, useState } from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes, getChpList } from '../utils'
import { Select, Col, Row, Button, Space, BackTop } from 'antd';
import 'antd/dist/antd.min.css';
import { Link, Outlet } from 'react-router-dom';
const { Option } = Select;

export default function PoemQuery() {
    // chapters: {0:{num: '1', count: 9, name: 'Kiritsubo 桐壺'},...}
    const [chapters, setChapters] = useState([])
    const [chpSelect, setChpSelect] = useState([false, "", undefined])
    const [count, setCount] = useState([])
    // prevNext: [["prevChp", "nextChp"], ["prevNum", "nextNum"]]
    const [prevNext, setPrevNext] = useState([["",""],["",""]])
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

    // value: int, poem order
    function updatePrevNext(value, buttonClick) {
        let currChp = parseInt(chpSelect[1])
        // console.log(chpSelect[1], value)
        if (value < count.length) {
            setPrevNext([[chpSelect[1], value - 1],[chpSelect[1], value+1]])
        } else if (chpSelect[1] === '1' && value === 1) {
            setPrevNext([['1', 1],['1', 2]])
        } else if (chpSelect[1] === '54') {
            setPrevNext([['53', 28],['54', 1]])
        } else if (chpSelect[1] !== '1' && value === '1') {
            setPrevNext([[chapters[currChp - 2].num, chapters[currChp - 2].count],[chapters[currChp - 1].num, 2]])
            // console.log("line 54")
        } else if (value === count.length) {
            setPrevNext([[chapters[currChp - 1].num, value - 1],[chapters[currChp].num, 1]])
            // console.log("line 57")
        }
        if (buttonClick) {
            setChpSelect([true, prevNext[1][0], prevNext[1][1]])
            setCount(Array.from({length: chapters[parseInt(chpSelect[1]) - 1].count}, (_, i) => i + 1))
        }
    }

    return (
        <Row>
            <Col span={4}>
                <Select 
                    showSearch
                    placeholder="Select a chapter"
                    style={{ width:220 }}
                    value={chpSelect[1]}
                    onSelect={(value) => {
                        setChpSelect([true, value, chpSelect[2]])
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
                    value={chpSelect[2]}
                    onSelect={(value) => {
                        setChpSelect([chpSelect[0], chpSelect[1], value])
                        updatePrevNext(value, false)
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
                    <Button disabled={typeof chpSelect[2] === 'undefined'}>Query</Button>
                </Link>
            </Col>
            <Col span={16}>
                <Outlet />
            </Col>
            <Col span={4}>
                <Link
                    to={`/poem/${prevNext[1][0]}/${prevNext[1][1]}`}    
                >
                    <Button
                        onClick={
                            () => {
                                updatePrevNext(prevNext[1][1], true)
                            }
                        }
                    >Next</Button>
                </Link>
            </Col>
        </Row>
    )
}