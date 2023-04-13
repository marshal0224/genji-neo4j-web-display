import React, { lazy, useMemo, useState } from 'react'
import { initDriver, closeDriver } from '../neo4j.js'
import { toNativeTypes, getChpList } from '../utils'
import { Select, Col, Row, Button } from 'antd';
import dynamic from 'next/dynamic'
import Link from 'next/link';
import { useRouter } from 'next/router';
import 'antd/dist/antd.min.css';
const { Option } = Select;

const PoemPage = lazy(() => import('./PoemPage.js'))

const driver = initDriver()
const session = driver.session()
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

export async function getServerSideProps ({ query }) {
    let get = 'match (:Genji_Poem)-[r:INCLUDED_IN]->(c:Chapter) return c.chapter_number as num, c.chapter_name as name, count(r) as count'
    let chapter = query.chapter
    let number = query.number
    let chp = []
    let chpSelect = [false, null, null]
    let buttonLock = true
    let prevNext = [[null, null], [null, null]]
    // var session = driver.session()
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
    // session.close()
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
    const [poemPageProps, setPoemPageProps] = useState({
        initSpeaker: [],
        initAddressee: [],
        initJPRM: [],
        initTrans: {
            Waley: 'N/A',
            Seidensticker: 'N/A',
            Tyler: 'N/A',
            Washburn: 'N/A',
            Cranston: 'N/A'
        }, 
        initSource: {},
        initRel: [],
        initTag: [],
        initTagTypes: [],
        initPnum: []
    })
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
        if (chapters !== undefined && chapters.length && chapter !== undefined && number !== undefined) {
            setPrevNext(updatePrevNext(chapter, number, chapters))
            setChpSelect([true, chapter, number])
            console.log('line 118')

            let get = 'match poem=(g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), exchange=(s:Character)-[:SPEAKER_OF]->(g)<-[:ADDRESSEE_OF]-(a:Character), trans=(g)-[:TRANSLATION_OF]-(:Translation)-[:TRANSLATOR_OF]-(:People) where g.pnum ends with "' + number + '" return poem, exchange, trans'
            let getHonkaInfo = 'match (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (g)-[n:ALLUDES_TO]->(h:Honka)-[r:ANTHOLOGIZED_IN]-(s:Source), (h)<-[:AUTHOR_OF]-(a:People), (h)<-[:TRANSLATION_OF]-(t:Translation)<-[:TRANSLATOR_OF]-(p:People) where g.pnum ends with "' + number + '" return h.Honka as honka, h.Romaji as romaji, s.title as title, a.name as poet, r.order as order, p.name as translator, t.translation as translation, n.notes as notes'
            let getRel = 'match (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (g)-[:INTERNAL_ALLUSION_TO]->(s:Genji_Poem) where g.pnum ends with "' + number + '" return s.pnum as rel'
            let getPnum = 'match (g:Genji_Poem) return g.pnum as pnum'
            let getTag = 'match (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (g)-[:TAGGED_AS]->(t:Tag) where g.pnum ends with "' + number + '" return t.Type as type'
            let getTagTypes = 'match (t:Tag) return t.Type as type'
            const _ = async() => {
                // initDriver(process.env.REACT_APP_NEO4J_URI,
                //     process.env.REACT_APP_NEO4J_USERNAME,
                //     process.env.REACT_APP_NEO4J_PASSWORD)
                const resPromise = session.readTransaction(async (tx) => {
                    const r = await tx.run(get)
                    return r
                })
                const res = await resPromise
                console.log(res)
                // const resHonkaInfo = await session.readTransaction(tx => tx.run(getHonkaInfo))
                // const resHonkaInfo = session.run(getHonkaInfo)
                // const resRel = await session.readTransaction(tx => tx.run(getRel))
                // const resRel = session.run(getRel)
                // const resTag = await session.readTransaction(tx => tx.run(getTag))
                // const resTag = session.run(getTag)
                // const resType = await session.readTransaction(tx => tx.run(getTagTypes))
                // const resType = session.run(getTagTypes)
                // const resPnum = await session.readTransaction(tx => tx.run(getPnum))
                // const resPnum = session.run(getPnum)
                // holds unique values of speaker & addressee & Japanese & Romaji (top row)
                // let exchange = new Set()
                // res.records.map(e => JSON.stringify(toNativeTypes(e.get('exchange')))).forEach(e => exchange.add(e))
                // exchange = Array.from(exchange).map(e => JSON.parse(e))
                // speaker = [exchange[0].start.properties.name]
                // addressee = exchange.map(e => e.end.properties.name)
                // JPRM = [exchange[0].segments[0].end.properties.Japanese, exchange[0].segments[0].end.properties.Romaji]
                // notes = exchange[0].segments[0].end.properties.notes
                // let transTemp = res.records.map(e => toNativeTypes(e.get('trans'))).map(e => [e.end.properties.name, e.segments[0].end.properties.translation, e.segments[1].start.properties.WaleyPageNum])
                // transTemp.forEach(e =>
                //     trans = prev => ({
                //         ...prev,
                //         [e[0]]: e[0] !== 'Waley' ? e[1] : [e[1], e[2]]
                //     }))
                // let sources = resHonkaInfo.records.map(e => [Object.values(toNativeTypes(e.get('honka'))).join(''), Object.values(toNativeTypes(e.get('title'))).join(''), Object.values(toNativeTypes(e.get('romaji'))).join(''), Object.values(toNativeTypes(e.get('poet'))).join(''), Object.values(toNativeTypes(e.get('order'))).join(''), Object.values(toNativeTypes(e.get('translator'))).join(''), Object.values(toNativeTypes(e.get('translation'))).join(''), e.get('notes') !== null ? Object.values(toNativeTypes(e.get('notes'))).join('') : 'N/A'])
                // let src_obj = []
                // let index = 0
                // let entered_honka = []
                // sources.forEach(e => {
                //     if (entered_honka.includes(e[0])) {
                //         src_obj[src_obj.findIndex(el => el.honka === e[0])].translation.push([e[5], e[6]])
                //     } else {
                //         src_obj.push({id: index, honka: e[0], source: e[1], romaji: e[2], poet: e[3], order: e[4], translation:  [[e[5], e[6]]], notes: e[7]})
                //         entered_honka.push(e[0])
                //     }
                // })
                // let source = src_obj
                // let related = new Set()
                // resRel.records.map(e => toNativeTypes(e.get('rel'))).forEach(e => related.add([Object.values(e).join('')]))
                // related = Array.from(related).flat()
                // related = related.map(e => [e, true])
                // rel = related
                // let tags = new Set()
                // resTag.records.map(e => toNativeTypes(e.get('type'))).forEach(e => tags.add([Object.values(e).join('')]))
                // tags = Array.from(tags).flat()
                // tags = tags.map(e => [e, true])
                // let tag = tags
                // let types = resType.records.map(e => e.get('type'))
                // let ls = []
                // types.forEach(e => ls.push({value: e, label: e})) 
                // tagTypes = ls
                // let temp = resPnum.records.map(e => e.get('pnum'))
                // let pls = []
                // temp.forEach(e => {
                //     pls.push({value:e, label:e})
                // })
                // pnum = pls
                // // session.close()
                // // closeDriver()
                // console.log(chp)
                // setPoemPageProps({
                //     initSpeaker: speaker,
                //     initAddressee: addressee,
                //     initJPRM: JPRM,
                //     initNotes: notes,
                //     initTrans: trans,
                //     initSource: source,
                //     initRel: rel,
                //     initTag: tag,
                //     initTagTypes: tagTypes,
                //     initPnum: pnum
                // })
                // setShowPoemPage(true)
            }
            _().catch(console.error)
        }
    }, [loc.asPath])

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
                <Button
                    onClick={() => console.log(poemPageProps)}
                >
                    Click
                </Button>
            </Col>
            <Col span={19}>
                {showPoemPage && <PoemPage chapter={chapter} number={number}/>}
            </Col>
        </Row>
    )
}