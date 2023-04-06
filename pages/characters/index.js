import React, { useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { concatObj, toNativeTypes } from '../utils';
import GeneologyMap from '../GeneologyMap';
import { traj } from '../traj'
import 'reactflow/dist/style.css';

export default function Characters() {
    const [graph, setGraph] = React.useState([])
    const [isLoading, setIsLoading] = React.useState(true)
    /**
     * @param {Array} l the array of edges
     */
    function generateGeneology(l) {
        let counts = l.reduce((acc, subArr) => {
            subArr.forEach(str => {
                    if (!str.includes('_')){
                        if (!acc[str]) {
                            acc[str] = 1;
                        } else {
                            acc[str]++;
                    }}});
            return acc;
        }, {});
        delete counts.Genji
        let ranked = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(pair => pair[0]);
        let nodes = [{
            id: '1',
            data: {
                label: 'Genji'
            }, 
            position: {x: traj[0][0], y: traj[0][0]}
        }]
        let edges = []
        let id = 2
        ranked.forEach(e => {
            nodes.push({
                id: id.toString(),
                data: {
                    label: e
                },
                position: {x : traj[1750-id*2][0], y: traj[1750-id*2][1]},
                draggable: true,
            })
            id += 1
        })
        id = 1
        l.forEach(e => {
            let s = nodes.findIndex(element => element.data.label === e[0])
            let t = nodes.findIndex(element => element.data.label === e[2])
            s = (s+1).toString()
            t = (t+1).toString()
            edges.push({
                id: 'e'+id.toString(),
                source: s,
                target: t,
                label: e[1]
            })
            id += 1
        })
        return [nodes, edges]
    }

    useEffect(() => {
        const _ = async() => {
            initDriver(process.env.REACT_APP_NEO4J_URI,
                process.env.REACT_APP_NEO4J_USERNAME,
                process.env.REACT_APP_NEO4J_PASSWORD)
            const driver = getDriver()
            const session = driver.session()
            let resGraph = await session.readTransaction(tx => tx.run('MATCH (a:Character)-[r]-(b:Character) return a.name as startName, TYPE(r) as rel, b.name as endName'))
            resGraph = resGraph.records.map(e => [concatObj(toNativeTypes(e.get('startName'))), concatObj(toNativeTypes(e.get('rel'))), concatObj(toNativeTypes(e.get('endName')))])
            setGraph(generateGeneology(resGraph))
            session.close()
            closeDriver()
            setIsLoading(false)
        }
        _().catch(console.error)
    }, [])

    return (
        <>{isLoading 
            ? null 
            :<ReactFlowProvider>
                <GeneologyMap l={graph}/>
            </ReactFlowProvider>}
        </>
    );
};
