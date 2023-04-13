import React, { lazy, useEffect, useMemo, useState } from 'react'
import { initDriver } from './neo4j.js'
import neo4j from 'neo4j-driver'
import { Button } from 'antd'

export default function test() {

    const driver = initDriver()
    const session = driver.session({
        database: 'neo4j',
        defaultAccessMode: neo4j.session.READ
    })
    const [data, setData] = useState(0)
    // useMemo(() => {
    //     console.log('line 11')
    //     // const _ = async () => {
    //     //     const result = await session.run(
    //     //         'MATCH (n) RETURN n LIMIT 25'
    //     //     )
    //     //     const singleRecord = result.records[0]
    //     //     const node = singleRecord.get(0)
    //     //     console.log(node.properties)
    //     // }
    //     // _().catch(console.error)
    //     session.run(
    //                 'MATCH (n:Character) RETURN n.name LIMIT 25'
    //             ).then(result => {
    //                 console.log(result.records)
    //             })
    // }, [data])
    return (
        <div>
            <h1>Test</h1>
            <Button 
                onClick={() => setData(data + 1)}
            >
                Click
            </Button>
        </div>
    )
}