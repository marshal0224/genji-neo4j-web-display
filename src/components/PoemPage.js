import React, { useMemo, useState } from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes, getChpList } from '../utils'
import { Select, Col, Row, Button, Space, BackTop, Divider } from 'antd';
import { useParams } from 'react-router-dom';
import 'antd/dist/antd.min.css';

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
    const [source, setSource] = useState([])
    const [rel, setRel] = useState([])
    const [tag, setTag] = useState([])
    const [notes, setNotes] = useState("")
    if (number.length === 1) {
        number = '0' + number.toString()
    } else {
        number = number.toString()
    }
    useMemo(() => {
        let get = 'match poem=(g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "'+chapter+'"}), exchange=(s:Character)-[:SPEAKER_OF]->(g)<-[:ADDRESSEE_OF]-(a:Character), trans=(g)-[:TRANSLATION_OF]-(:Translation)-[:TRANSLATOR_OF]-(:People) where g.pnum ends with "'+number+'" return poem, exchange, trans'
        let getHonka =  'match poem=(g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "'+chapter+'"}), allusions=(g)-[:ALLUDES_TO]->(:Honka) where g.pnum ends with "'+number+'" return allusions'
        let getSrc = 'match (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "'+chapter+'"}), (g)-[:ALLUDES_TO]->(h:Honka)-[:ANTHOLOGIZED_IN]-(s:Source) where g.pnum ends with "' + number +'" return h.Honka as text, s.title as title'
        let getRel = 'match (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "'+chapter+'"}), (g)-[:INTERNAL_ALLUSION_TO]->(s:Genji_Poem) where g.pnum ends with "' + number +'" return s.pnum as rel'
        let getTag = 'match (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "'+chapter+'"}), (g)-[:TAGGED_AS]->(t:Tag) where g.pnum ends with "' + number +'" return t.Type as type'
        const _ = async () => {
            initDriver( process.env.REACT_APP_NEO4J_URI, 
                process.env.REACT_APP_NEO4J_USERNAME, 
                process.env.REACT_APP_NEO4J_PASSWORD )
            const driver = getDriver()
            const session = driver.session()
            const res = await session.readTransaction(tx => tx.run(get))
            const resHonka = await session.readTransaction(tx => tx.run(getHonka))
            const resSrc = await session.readTransaction(tx => tx.run(getSrc))
            const resRel = await session.readTransaction(tx => tx.run(getRel))
            const resTag = await session.readTransaction(tx => tx.run(getTag))
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
            related = Array.from(related)
            setRel(related)
            let tags = new Set()
            resTag.records.map(e => toNativeTypes(e.get('type'))).forEach(e => tags.add([Object.values(e).join('')]))  
            tags = Array.from(tags)
            setTag(tags)
            session.close()
            closeDriver()
        }
        _().catch(console.error)
    }, [chapter, number])
    return(
        <div>
            <Row>
                <Col span={4}>
                    <b>Speaker</b>
                    {speaker.length !== 0 && speaker.map(e => 
                        <p>{e}</p>    
                    )}
                    <b>Proxy</b>
                    <br/>
                    <p>N/A</p>
                </Col>
                <Col span={8}>
                    <b>Japanese</b>
                    <br/>
                    <p type='JP'>{JPRM[0]}</p>
                </Col>
                <Col span={8}>
                    <b>Romaji</b>
                    <br/>
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
                    <br/>
                    <p type='non-JP'>{trans['Waley']}</p>
                </Col>
                <Divider type="vertical"/>
                <Col flex={1}>
                    <b>Seidensticker</b>
                    <br/>
                    <p type='non-JP'>{trans['Seidensticker']}</p>
                </Col>
            </Row>
            <Divider type="vertical"/>
            <Row>
                <Col flex={1}>
                    <b>Tyler</b>
                    <br/>
                    <p type='non-JP'>{trans['Tyler']}</p>
                </Col>
                <Divider type="vertical"/>
                <Col flex={1}>
                    <b>Washburn</b>
                    <br/>
                    <p type='non-JP'>{trans['Washburn']}</p>
                </Col>
                <Divider type="vertical"/>
                <Col flex={1}>
                    <b>Cranston</b>
                    <br/>
                    <p type='non-JP'>{trans['Cranston']}</p>
                </Col>
            </Row>
            <Divider>Allusions</Divider>
            <Row>
                {source.map(e => 
                    <Col flex={1}>
                        {e[0]}
                        <br/>
                        <b>{e[1]}</b>
                    </Col>
                )}
            </Row>
            <Divider>Related Poems</Divider>
            <Row>
                {rel.map(e => 
                    <Col flex={1}>
                        {e[0]}
                    </Col>
                )}
            </Row>
            <Divider>Tags</Divider>
            <Row>
                {tag.map(e => 
                    <Col flex={1}>
                        {e[0]}
                    </Col>
                )}
            </Row>
            <Divider></Divider>
            <Row>
                <b>Notes:</b>
                <br/>
                <p type="non-JP">{notes}</p>
            </Row>
        </div>
    )
}