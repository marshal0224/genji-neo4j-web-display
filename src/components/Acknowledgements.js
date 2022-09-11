import { Col, Row } from 'antd';
import React from 'react';
import { useLocation } from 'react-router-dom';

export const Acknowledgements = () => {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <Row gutter={[16, 48]}>
                <Col span={6}></Col>
                <Col span={12}>
                <p style={{ textAlign: 'left' }}>
                    <br></br>
                    <br></br>
                    <br></br>
                    <br></br>
                    This website would never have been possible without the help of the many students in LJ 250 over the years who have painstakingly entered and tagged the poems.
                </p>
                <p style={{ textAlign: 'left' }}>
                    Special thanks to Rebekah Machemer, who designed and built the first iteration of the website, to Elijah Woo, who heroically entered all the Uji chapters and more all by himself, and finally to Marshal Dong, who has selflessly invested countless hours to bring the site to its current state.
                </p>
                <p style={{ textAlign: 'left' }}>
                    This website is powered by <a href='https://reactjs.org/'>React.js</a>, and the database is powered by <a href='https://neo4j.com/'>Neo4j</a>.
                </p>
                </Col>
                <Col span={6}></Col>
            </Row>
        </div>

    )
}