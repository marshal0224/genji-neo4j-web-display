import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
    addEdge,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
} from 'reactflow';
import { initDriver, getDriver, closeDriver } from '../neo4j'
// import { nodes as initialNodes, edges as initialEdges } from './initial-elements';
import { generateGeneology, nodes as initialNodes, edges as initialEdges } from './initial-elements'
import 'reactflow/dist/style.css';
import { concatObj, toNativeTypes } from './utils';
import GeneologyMap from './GeneologyMap';
// import './overview.css';
import { traj } from './traj'


export default function Characters() {
    // const nodeTypes = {
    //     custom: CustomNode,
    // };  
    const minimapStyle = {
        height: 120,
    };

    const onInit = (reactFlowInstance) => console.log('flow loaded:', reactFlowInstance);
    const [graph, setGraph] = React.useState([])
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    // const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);

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
                position: {x : traj[id - 1][0], y: traj[id - 1][1]}
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
            // let [nodes, edges] = generateGeneology(resGraph)
            // setNodes(nodes)
            // setEdges(edges)
            setGraph(generateGeneology(resGraph))
            session.close()
            closeDriver()
        }
        _().catch(console.error)
    }, [])

    // we are using a bit of a shortcut here to adjust the edge type
    // this could also be done with a custom edge for example
    // const edgesWithUpdatedTypes = edges.map((edge) => {
    //     if (edge.sourceHandle) {
    //         const edgeType = nodes.find((node) => node.type === 'custom').data.selects[edge.sourceHandle];
    //         edge.type = edgeType;
    //     }

    //     return edge;
    // });

    return (
        // <ReactFlow
        //     nodes={nodes}
        //     // edges={edgesWithUpdatedTypes}
        //     edges={edges}
        //     onNodesChange={onNodesChange}
        //     onEdgesChange={onEdgesChange}
        //     onConnect={onConnect}
        //     onInit={onInit}
        //     fitView
        //     attributionPosition="top-right"
        //     // nodeTypes={nodeTypes}
        // >
        //     <MiniMap style={minimapStyle} zoomable pannable />
        //     <Controls />
        //     <Background color="#aaa" gap={16} />
        // </ReactFlow>
        <GeneologyMap l={graph}/>
    );
};
