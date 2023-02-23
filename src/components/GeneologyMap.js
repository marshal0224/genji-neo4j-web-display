import React, { useCallback } from 'react';
import ReactFlow, {
    addEdge,
    MiniMap,
    Controls,
    Background,
    useNodes,
    useEdges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { concatObj, toNativeTypes } from './utils';
/**
 * @param {Array} l the array of edges
 */
export default function GeneologyMap({l}) {
    const onInit = (reactFlowInstance) => console.log('flow loaded:', reactFlowInstance);
    const onConnect = () => null
    const minimapStyle = {
        height: 120,
    };
    const onChange = useCallback((evt) => {
        console.log(evt.target.value);
    }, [])
    return (
        <ReactFlow
            nodes={l[0]}
            edges={l[1]}
            onNodesChange={onChange}
            onEdgesChange={onChange}
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