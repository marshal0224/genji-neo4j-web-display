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
import 'reactflow/dist/style.css';
import { concatObj, toNativeTypes } from './utils';
import { traj } from './traj'

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

/**
 * @param {Array} l the array of edges
 */
export default function GeneologyMap({l}) {
    // const [initNodes, initEdges] = generateGeneology(l)
    const [nodes, setNodes, onNodesChange] = useNodesState(l[0]);
    const [edges, setEdges, onEdgesChange] = useNodesState(l[1]);
    const onInit = (reactFlowInstance) => console.log('flow loaded:', reactFlowInstance);
    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);
    const minimapStyle = {
        height: 120,
    };

    // useEffect(() => {
    //     // setNodes(initNodes)
    // }, [])
    return (
        <ReactFlow
            nodes={nodes}
            // edges={edgesWithUpdatedTypes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={onInit}
            fitView
            attributionPosition="top-right"
            // nodeTypes={nodeTypes}
        >
            <MiniMap style={minimapStyle} zoomable pannable />
            <Controls />
            <Background color="#aaa" gap={16} />
        </ReactFlow>
    )
}