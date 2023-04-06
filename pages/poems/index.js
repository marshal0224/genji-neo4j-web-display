import React, { lazy, useMemo, useState } from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j.js'
import { toNativeTypes, getChpList } from '../utils'
import { Select, Col, Row, Button } from 'antd';
import dynamic from 'next/dynamic'
import Link from 'next/link';
import { useRouter } from 'next/router';
import 'antd/dist/antd.min.css';
const { Option } = Select;

const PoemPage = lazy(() => import('./PoemPage.js'))

function updatePrevNext(chapter, number, chps) {
    let prev, next
    if (chapter === "1" && number === "1") {
        prev = ['1', 1]
        next = ['1', 2]
    } else if (chapter === '54') {
        prev = ['53', 28]
        next = ['54', 1]
    } else if (chapter === '42') {
        prev = ['41', 26]
        next = ['43', 1]
    } else if (number === "1") {
        prev = [(parseInt(chapter) - 1).toString(), chps[parseInt(chapter) - 2].count]
        next = [chapter, 2]
    } else if (parseInt(number) === chps[parseInt(chapter) - 1].count) {
        prev = [chapter, parseInt(number) - 1]
        next = [(parseInt(chapter) + 1).toString(), 1]
    } else {
        prev = [chapter, parseInt(number) - 1]
        next = [chapter, parseInt(number) + 1]
    } 
    return [prev, next]
}

export async function getServerSideProps({ query }) {
    let get = 'match (:Genji_Poem)-[r:INCLUDED_IN]->(c:Chapter) return c.chapter_number as num, c.chapter_name as name, count(r) as count'
    let chapter = query.chapter
    let number = query.number
    let chp = []
    let chpSelect = [false, null, null]
    let buttonLock = true
    let prevNext = [[null, null], [null, null]]
    initDriver( process.env.REACT_APP_NEO4J_URI, 
        process.env.REACT_APP_NEO4J_USERNAME, 
        process.env.REACT_APP_NEO4J_PASSWORD )
    const driver = getDriver()
    const session = driver.session()
    const res = await session.readTransaction(tx => tx.run(get))
    const ls = getChpList()
    res.records.forEach(element => {
        chp.push({
            num: Object.values(toNativeTypes(element.get('num'))).join(''),
            count: toNativeTypes(element.get('count')).low,
            name: ls[chp.length]
        })
    });
    // access via url
    if (chapter !== undefined && number !== undefined) {
        chpSelect = [true, chapter, number]
        buttonLock = false
        prevNext = updatePrevNext(chapter, number, chp)
    }
    session.close()
    closeDriver()
    return {
        props: {
            initChp: chp,
            initChpSelect: chpSelect,
            initButtonLock: buttonLock,
            initPrevNext: prevNext
        }
    }
}

export default function PoemQuery( props ) {
    // chapters: [{num: '1', count: 9, name: 'Kiritsubo 桐壺'},...]
    // count: number of poems in a chapter
    const [chapters, setChapters] = useState(props.initChp)
    // values of the selects, e.g., [true, "1", "1"]
    const [chpSelect, setChpSelect] = useState(props.initChpSelect)
    const [count, setCount] = useState([])
    // prevNext: [["prevChp", "nextChp"], ["prevNum", "nextNum"]]
    const [prevNext, setPrevNext] = useState(props.initPrevNext)
    // use this state variable to disable the previous and next buttons (not query), becomes false once a poem page is loaded
    const [buttonLock, setButtonLock] = useState(props.initButtonLock)
    const [showPoemPage, setShowPoemPage] = useState(false)
    // keeps track of the url
    const loc = useRouter()

    let { chapter, number } = loc.query

    const PoemPage = dynamic(
        () => import(`./PoemPage.js`),
        { ssr: false }
    )

    useMemo(() => {
        if (chapters.length && chapter !== undefined && number !== undefined) {
            setPrevNext(updatePrevNext(chapter, number, chapters))
            setChpSelect([true, chapter, number])
            console.log('line 103')
            setShowPoemPage(true)
        }
    }, [loc.asPath, chapters])

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
                        // updateNext(value, false)
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
                    href={{ 
                        pathname: '/poems', 
                        query: { 
                            chapter:chpSelect[1], 
                            number: chpSelect[2] 
                        }}} 
                        scroll={false}
                >
                    <Button 
                        disabled={chpSelect[2] === null}
                        onClick={
                            () => {
                                setButtonLock(false)
                            }
                        }
                    >
                        Query
                    </Button>
                </Link>
                <br />
                <Link
                    href={{ 
                        pathname: '/poems', 
                        query: { 
                            chapter: prevNext[0][0], 
                            number: prevNext[0][1] 
                        }}}   
                        scroll={false}
                >
                    <Button
                        disabled={buttonLock}
                        onClick={() => {
                            setCount(Array.from({length: chapters[parseInt(prevNext[0]) - 1].count}, (_, i) => i + 1))
                        }}
                    >
                        Previous
                    </Button>
                </Link>
                <Link
                    href={{ 
                        pathname: '/poems', 
                        query: { 
                            chapter: prevNext[1][0], 
                            number: prevNext[1][1] 
                        }}}  
                        scroll={false}
                >
                    <Button
                        disabled={buttonLock}
                        onClick={() => {
                            setCount(Array.from({length: chapters[parseInt(prevNext[1]) - 1].count}, (_, i) => i + 1))
                        }}
                    >
                        Next
                    </Button>
                </Link>
            </Col>
            <Col span={19}>
                {showPoemPage && <PoemPage chapter={chapter} number={number}/>}
            </Col>
        </Row>
    )
}