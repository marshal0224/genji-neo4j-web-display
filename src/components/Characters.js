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
import { nodes as initialNodes, edges as initialEdges } from './initial-elements';

import 'reactflow/dist/style.css';
// import './overview.css';

export default function Characters() {
    // const nodeTypes = {
    //     custom: CustomNode,
    // };  

    const minimapStyle = {
        height: 120,
    };

    const onInit = (reactFlowInstance) => console.log('flow loaded:', reactFlowInstance);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);

    useEffect(() => {
        const _ = async() => {
            initDriver(process.env.REACT_APP_NEO4J_URI,
                process.env.REACT_APP_NEO4J_USERNAME,
                process.env.REACT_APP_NEO4J_PASSWORD)
            const driver = getDriver()
            const session = driver.session()
            console.log(await session.readTransaction(tx => tx.run('MATCH (a:Character)-[r]-(b:Character) return a.name as startName, TYPE(r) as rel, b.name as endName')))
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
    );
};
