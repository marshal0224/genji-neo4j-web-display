import React, { useEffect } from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes } from '../utils'
// import neo4j from '../neo4j'

export default function GetPoem(uri, user, password, chapter, speaker, addressee) {
    const neo4j = require('neo4j-driver')
    console.log(uri)
    var driver = neo4j.driver(
        uri,
        neo4j.auth.basic(user, password)
    )
    const session = driver.session()

    let getPoem_S, getPoem_A, getPoem_C
    if (speaker === 'Any') {
        getPoem_S = '(s:Character)'
    } else {
        getPoem_S = '(s:Character {name: "'+speaker+'"})'
    } 
    if (addressee === 'Any') {
        getPoem_A = '(a:Character)'
    } else {
        getPoem_A = '(a:Character {name: "'+addressee+'"})'
    }
    if (chapter === 'Any') {
        getPoem_C = ''
    } else {
        // as of Apirl 2022, the chapter numbers are in string
        getPoem_C = ', (j)-[r:INCLUDED_IN]-(c:Chapter {chapter_number: "'+chapter+'"})'
    }
    let getPoemQuery =   'match '+getPoem_S+'-[p: SPEAKER_OF]-(j:Japanese)-'
                    +'[q:ADDRESSEE_OF]-'+getPoem_A 
                    +getPoem_C
                    +' return (j) as poems'

    const Get = () => {
        useEffect(() => {
            async function func() {
                const res = await session.readTransaction(tx => tx.run(getPoemQuery))
                let temp = res.records.map(row => {return toNativeTypes(row.get('poems'))})
                for (let i = 0; i < temp.length; i++) {
                    temp[i] = temp[i].properties
                }
                // properties[i]: {Japanese, Romaji, pnum}
                console.log(temp)
            }
            func();
        }, [])
    }

    return 
}