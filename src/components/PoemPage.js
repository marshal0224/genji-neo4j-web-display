import React, { useMemo, useState } from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes, getChpList } from '../utils'
import { Select, Col, Row, Button, Space, BackTop } from 'antd';
import { useParams } from 'react-router-dom';
import 'antd/dist/antd.min.css';

export default function PoemPage() {
    let { chapter, number } = useParams()
    const [poem, setPoem] = useState({})
    const [trans, setTrans] = useState({
        Waley: 'N/A',
        Seidensticker: 'N/A',
        Tyler: 'N/A',
        Washburn: 'N/A', 
        Cranston: 'N/A'
    })
    console.log(number)
    if (number.length === 1) {
        number = '0' + number.toString()
    } else {
        number = number.toString()
    }
    useMemo(() => {
        let get = 'match poem=(g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "'+chapter+'"}), exchange=(s:Character)-[:SPEAKER_OF]->(g)<-[a:ADDRESSEE_OF]-(:Character), trans=(g)-[:TRANSLATION_OF]-(:Translation) where g.pnum ends with "'+number+'" return poem, exchange, trans'
        console.log(get)
        const _ = async () => {
            initDriver( process.env.REACT_APP_NEO4J_URI, 
                process.env.REACT_APP_NEO4J_USERNAME, 
                process.env.REACT_APP_NEO4J_PASSWORD )
            const driver = getDriver()
            const session = driver.session()
            const res = await session.readTransaction(tx => tx.run(get))
            let exchange = res.records.map(e => toNativeTypes(e.get('exchange')))
            console.log(exchange)
            session.close()
            closeDriver()
        }
        _().catch(console.error)
    })
    return(
        <div>
            <Row>
                <Col span={4}>
                    <b>Speaker</b>
                    <br />
                    <b>Proxy</b>
                </Col>
                <Col span={8}>
                    <p>Japanese goes here</p>
                    <p>{chapter}</p>
                    <p>{number}</p>
                </Col>
                <Col span={8}>
                    <p>Romaji goes here</p>
                </Col>
                <Col span={4}>
                    <b>Addressee</b>
                </Col>
            </Row>
            <Row>
                <Col flex={1}>
                    <b>Waley</b>
                </Col>
                <Col flex={1}>
                    <b>Seidensticker</b>
                </Col>
                <Col flex={1}>
                    <b>Tyler</b>
                </Col>
                <Col flex={1}>
                    <b>Washburn</b>
                </Col>
                <Col flex={1}>
                    <b>Cranston</b>
                </Col>
            </Row>
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
        </div>
    )
}