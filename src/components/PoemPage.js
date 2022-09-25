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
    const [notes, setNotes] = useState("")
    if (number.length === 1) {
        number = '0' + number.toString()
    } else {
        number = number.toString()
    }
    useMemo(() => {
        let get = 'match poem=(g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "'+chapter+'"}), exchange=(s:Character)-[:SPEAKER_OF]->(g)<-[a:ADDRESSEE_OF]-(:Character), trans=(g)-[:TRANSLATION_OF]-(:Translation)-[:TRANSLATOR_OF]-(:People) where g.pnum ends with "'+number+'" return poem, exchange, trans'
        const _ = async () => {
            initDriver( process.env.REACT_APP_NEO4J_URI, 
                process.env.REACT_APP_NEO4J_USERNAME, 
                process.env.REACT_APP_NEO4J_PASSWORD )
            const driver = getDriver()
            const session = driver.session()
            const res = await session.readTransaction(tx => tx.run(get))
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
            <Divider></Divider>
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
                <Divider type="vertical"/>
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
            <Divider></Divider>
            <Row>
                <Col flex={1}>
                    <b>Allusion</b>
                </Col>
                <Col flex={1}>
                    <b>Allusion</b>
                </Col>
                <Col flex={1}>
                    <b>Allusion</b>
                </Col>
                <Col flex={1}>
                    <b>Allusion</b>
                </Col>
                <Col flex={1}>
                    <b>Allusion</b>
                </Col>
            </Row>
            <Divider></Divider>
            <Row>
                <Col flex={1}>
                    <b>Related Poem</b>
                </Col>
                <Col flex={1}>
                    <b>Related Poem</b>
                </Col>
                <Col flex={1}>
                    <b>Related Poem</b>
                </Col>
                <Col flex={1}>
                    <b>Related Poem</b>
                </Col>
                <Col flex={1}>
                    <b>Related Poem</b>
                </Col>
            </Row>
            <Divider></Divider>
            <Row>
                <b>Tags:</b>
                <br/>
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