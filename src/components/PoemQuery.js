import React, { useEffect, useState } from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes, getChpList } from '../utils'
import { Select, Col, Row, Button } from 'antd';
import 'antd/dist/antd.min.css';
import { Link, Outlet, } from 'react-router-dom';
const { Option } = Select;

export default function PoemQuery() {
    // chapters: {0:{num: '1', count: 9, name: 'Kiritsubo 桐壺'},...}
    const [chapters, setChapters] = useState([])
    // values of the selects
    const [chpSelect, setChpSelect] = useState([false, "", undefined])
    const [count, setCount] = useState([])
    // prevNext: [["prevChp", "nextChp"], ["prevNum", "nextNum"]]
    const [prevNext, setPrevNext] = useState([["",""],["",""]])
    const [buttonLock, setButtonLock] = useState(true)

    // loads the dropdowns
    useEffect(() => {
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
    function updatePrev(value) {
        let currChp = parseInt(chpSelect[1])
        let prev, next
        console.log(chpSelect)
        console.log(chpSelect[1] !== '1' && value === 1)
        if (chpSelect[1] === '1' && value === 1) {
            prev = ['1', 1]
            next = ['1', 2]
        } else if (chpSelect[1] === '54') {
            prev = ['53', 28]
            next = ['54', 1]
        } else if (chpSelect[1] !== '1' && value === 1) {
            console.log("Line 52")
            prev = [chapters[currChp - 2].num, chapters[currChp - 2].count]
            next = [chapters[currChp - 1].num, 2]
        } else if (value === count.length) {
            prev = [chapters[currChp - 1].num, value - 1]
            next = [chapters[currChp].num, 1]
        } else if (value < count.length) {
            prev = [chpSelect[1], value - 1]
            next = [chpSelect[1], value + 1]
        } 
        console.log(prev)
        setPrevNext([prev, next])
        setChpSelect([true, prev[0], value])
        setCount(Array.from({length: chapters[parseInt(chpSelect[1]) - 1].count}, (_, i) => i + 1))
    }

    function updateNext(value, buttonClick) {
        let currChp = parseInt(chpSelect[1])
        let prev, next
        if (chpSelect[1] === '1' && value === 1) { // first poem
            prev = ['1', 1]
            next = ['1', 2]
        } else if (chpSelect[1] === '54') { // last poem
            prev = ['53', 28]
            next = ['54', 1]
        } else if (chpSelect[1] !== '1' && value === 1) { // for the first poem of each chapter, set the previous to be [prevChp, count] and the next to be [currChp, 2]
            prev = [chapters[currChp - 2].num, chapters[currChp - 2].count]
            next = [chapters[currChp - 1].num, 2]
        } else if (value === count.length) {
            prev = [chpSelect[1], value - 1]
            next = [chapters[currChp - 1].num, 1]
        } else if (value < count.length) {
            prev = [chpSelect[1], value - 1]
            next = [chpSelect[1], value + 1]
        } 
        setPrevNext([prev, next])
        if (buttonClick) {
            setChpSelect([true, next[0], value])
            setCount(Array.from({length: chapters[parseInt(chpSelect[1]) - 1].count}, (_, i) => i + 1))
        }
    }

    function updatePrevNext(value) {
        
    }

    return (
        <Row>
            <Col span={5}>
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
                        updateNext(value, false)
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
                <Link
                    to={`/poems/${chpSelect[1]}/${chpSelect[2]}`}
                >
                    <Button 
                        disabled={typeof chpSelect[2] === 'undefined'}
                        onClick={
                            () => {
                                updateNext(chpSelect[2], false)
                                setButtonLock(false)
                            }
                        }
                    >Query</Button>
                </Link>
                <br />
                <Link
                    to={`/poems/${prevNext[0][0]}/${prevNext[0][1]}`}    
                >
                    <Button
                        disabled={buttonLock}
                        onClick={
                            () => {
                                updatePrev(prevNext[0][1], true)
                            }
                        }
                    >Previous</Button>
                </Link>
                <Link
                    to={`/poems/${prevNext[1][0]}/${prevNext[1][1]}`}    
                >
                    <Button
                        disabled={buttonLock}
                        onClick={
                            () => {
                                updateNext(prevNext[1][1], true)
                            }
                        }
                    >Next</Button>
                </Link>
            </Col>
            <Col span={19}>
                <Outlet />
            </Col>
        </Row>
    )
}