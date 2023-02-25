import React, { useCallback, useState } from 'react';
import ReactFlow, {
    applyEdgeChanges,
    applyNodeChanges,
    MiniMap,
    Controls,
    Background,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { concatObj, toNativeTypes } from './utils';
/**
 * @param {Array} l the array of edges
 */
export default function GeneologyMap({l}) {
    const [nodes, setNodes] = React.useState(l[0])
    const [edges, setEdges] = React.useState(l[1])
    const onInit = (reactFlowInstance) => console.log('flow loaded:', reactFlowInstance);
    const onConnect = () => null
    const minimapStyle = {
        height: 120,
    };
    // const onChange = () => null
    const onNodesChange = useCallback( (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),[] );
    const onEdgesChange = useCallback( (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),[] );
    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={onInit}
            fitView
            attributionPosition="top-right"
        >
            <MiniMap style={minimapStyle} zoomable pannable />
            <Controls />
            <Background color="#aaa" gap={16} />
        </ReactFlow>
    )
}