import { isInt, isDate, isDateTime, isTime, isLocalDateTime, isLocalTime, isDuration } from 'neo4j-driver'

// tag::toNativeTypes[]
/**
 * Convert Neo4j Properties back into JavaScript types
 *
 * @param {Record<string, any>} properties
 * @return {Record<string, any>}
 */
export function toNativeTypes(properties) {
    return Object.fromEntries(Object.keys(properties).map((key) => {
        let value = valueToNativeType(properties[key])

        return [ key, value ]
    }))
}

/**
 * Convert an individual value to its JavaScript equivalent
 *
 * @param {any} value
 * @returns {any}
 */
function valueToNativeType(value) {
    if ( Array.isArray(value) ) {
        value = value.map(innerValue => valueToNativeType(innerValue))
    }
    else if ( isInt(value) ) {
        value = value.toNumber()
    }
    else if (
        isDate(value) ||
        isDateTime(value) ||
        isTime(value) ||
        isLocalDateTime(value) ||
        isLocalTime(value) ||
        isDuration(value)
    ) {
        value = value.toString()
    }
    else if (typeof value === 'object' && value !== undefined  && value !== null) {
        value = toNativeTypes(value)
    }

    return value
}
// end::toNativeTypes[]


export function getPoemTableContent(poemRes, transTemp) {
    let speakers = poemRes.map(row => row.segments[0].start.properties.name)
    let addressees = poemRes.map(row => row.segments[1].end.properties.name)
    let Japanese = poemRes.map(row => row.segments[1].start.properties)
    let info = {}
    let plist = new Set()
    for (let i = 0; i < Japanese.length; i++) {
        plist.add(JSON.stringify([Japanese[i].pnum, speakers[i], addressees[i]]))
    }
    plist = Array.from(plist).map(item => JSON.parse(item))
    // sorting the list of poems
    for (let i = 0; i < plist.length-1; i++) {
        for (let j = 0; j < plist.length-i-1; j++) {
            if ((parseInt(plist[j][0].substring(0, 2)) > parseInt(plist[j+1][0].substring(0, 2))) 
            || (parseInt(plist[j][0].substring(0, 2)) >= parseInt(plist[j+1][0].substring(0, 2)) 
            && parseInt(plist[j][0].substring(4, 6)) > parseInt(plist[j+1][0].substring(4, 6)))) {
                let temp = plist[j+1]
                plist[j+1] = plist[j]
                plist[j] = temp
            }
        }
    }
    // make Japanese non-repetitive
    let jsonObject = Japanese.map(JSON.stringify);
    let uniqueSet = new Set(jsonObject);
    Japanese = Array.from(uniqueSet).map(JSON.parse);
    // prepares translations, notes, Waley#, etc., in info
    transTemp.forEach(element => {
        // element: [keys, properties]
        if (element[0].length !== 0 && element[0].includes('id')) {
            let auth, pnum
            pnum = element[1][element[0].indexOf('id')].substring(0, 6)
            auth = element[1][element[0].indexOf('id')].substring(6, 7)
            if (info[pnum] === undefined) {
                info[pnum] = {}
            }
            if (auth === 'A') {
                auth = 'Waley'
            } else if (auth === 'C') {
                auth = 'Cranston'
            } else if (auth === 'S') {
                auth = 'Seidensticker'
            } else if (auth === 'T') {
                auth = 'Tyler'
            } else {
                auth = 'Washburn'
            }
            if (element[0].includes('translation')) {
                info[pnum][auth] = element[1][element[0].indexOf('translation')]
            } else {
                info[pnum][auth] = 'N/A'
            }
            if (element[0].includes('WaleyPageNum')) {
                info[pnum]['WaleyPageNum'] = element[1][element[0].indexOf('WaleyPageNum')]
            } else if (typeof(info[pnum]['WaleyPageNum']) !== 'number') {
                info[pnum]['WaleyPageNum'] = 'N/A'
            }
        } 
        if (element[0].length === 1 ) {
            console.log('DB entry issue at: '+element)
        }
    });
    Japanese.forEach(e => {
        let n = e.pnum
        if (info[n] === undefined) {
            info[n] = {}
            info[n]['WaleyPageNum'] = 'N/A'
            console.log('manually creating info object for '+n)
        }
        info[n].Japanese = e.Japanese
        info[n].Romaji = e.Romaji
    })
    // preparing a matrix of edit propertyNames
    let propname = Array.from(Array(plist.length), () => new Array(4))
    propname.forEach(row => {
        row[0] = 'Japanese'
        row[1] = 'Romaji'
        row[2] = 'empty'
        row[3] = 'empty'
    })
    return [plist, info, propname]
}