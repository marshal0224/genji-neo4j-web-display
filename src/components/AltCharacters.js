import { ForceGraph2D } from "react-force-graph";
import SpriteText from 'three-spritetext';
import { React, useEffect, useState } from "react";
import { closeDriver, getDriver, initDriver } from "../neo4j";
import { concatObj, toNativeTypes } from "./utils";

export default function AltChar() {
    const [graph, setGraph] = useState({nodes: [], links: []})
    /**
     * @param {Array} l the array of edges
     */
    // group 1: male; 2: female; 3: nonhuman; 4: poemless; 5: male and female; 6: multiple 
    function generateGeneology(l) {
        let counts = l.reduce((acc, subArr) => {
            subArr.forEach(str => {
                    if (!str.includes('_') && str !== 'male' && str !== 'female' && str !== 'nonhuman' && str !== 'poemless' && str !== 'male and female' && str !== 'multiple'){
                        if (!acc[str]) {
                            let index = subArr.indexOf(str)
                            let code = -1
                            switch (subArr[index + 1]) {
                                case 'male': 
                                    code = 1
                                    break
                                case 'female': 
                                    code = 2
                                    break
                                case 'nonhuman': 
                                    code = 3
                                    break
                                case 'poemless': 
                                    code = 4
                                    break
                                case 'male and female': 
                                    code = 5
                                    break
                                case 'multiple': 
                                    code = 6
                                    break
                            }
                            acc[str] = [1, code];
                        } else {
                            acc[str][0]++;
                    }}});
            return acc;
        }, {});
        delete counts.Genji
        let ranked = Object.entries(counts)
            .sort((a, b) => b[1][0] - a[1][0])
            .map(pair => [pair[0], pair[1][1]]);
        let nodes = [{
            id: '1',
            name: 'Genji',
            group: '1'
        }]
        let links = []
        let id = 2
        ranked.forEach(e => {
            nodes.push({
                id: id.toString(),
                name: e[0],
                group: e[1]
            })
            id += 1
        })
        id = 1
        l.forEach(e => {
            let s = nodes.findIndex(element => element.name === e[0])
            let t = nodes.findIndex(element => element.name === e[3])
            s = (s+1).toString()
            t = (t+1).toString()
            links.push({
                id: 'e'+id.toString(),
                source: s,
                target: t,
                name: e[2]
            })
            id += 1
        })
        return {nodes, links}
    }

    useEffect(() => {
        const _ = async() => {
            initDriver(process.env.REACT_APP_NEO4J_URI,
                process.env.REACT_APP_NEO4J_USERNAME,
                process.env.REACT_APP_NEO4J_PASSWORD)
            const driver = getDriver()
            const session = driver.session()
            let resGraph = await session.readTransaction(tx => tx.run('MATCH (a:Character)-[r]-(b:Character) return a.name as startName, a.gender as startGender, TYPE(r) as rel, b.name as endName, b.gender as endGender'))
            resGraph = resGraph.records.map(e => [concatObj(toNativeTypes(e.get('startName'))), concatObj(toNativeTypes(e.get('startGender'))),  concatObj(toNativeTypes(e.get('rel'))), concatObj(toNativeTypes(e.get('endName'))), concatObj(toNativeTypes(e.get('endGender')))])
            setGraph(generateGeneology(resGraph))
            session.close()
            closeDriver()
        }
        _().catch(console.error)
    }, [])

    return (
        <>
        <ForceGraph2D
            graphData={graph}
            width={window.innerWidth * 0.9}
            height={window.innerHeight}
            nodeAutoColorBy="group"
            linkDirectionalArrowLength={3.5}
            linkDirectionalArrowRelPos={1}
            linkCurvature={0.25}
            linkThreeObjectExtend={true}
            linkThreeObject={(link) => {
                // extend link with text sprite
                // const sprite = new SpriteText(`${link.source} > ${link.target}`);
                const sprite = new SpriteText(`${link.name}`);
                sprite.color = 'lightgrey';
                sprite.textHeight = 1.5;
                return sprite;
            }}
            linkPositionUpdate={(sprite, { start, end }) => {
                const middlePos = Object.assign(...['x', 'y'].map(c => ({
                  [c]: start[c] + (end[c] - start[c]) / 2 // calc middle point
                })));
    
                // Position sprite
                Object.assign(sprite.position, middlePos);
            }}
            nodeCanvasObject={(node, ctx, globalScale) => {
                const label = node.name;
                const fontSize = 12/globalScale;
                ctx.font = `${fontSize}px Sans-Serif`;
                const textWidth = ctx.measureText(label).width;
                const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding
    
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);
    
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = node.color;
                ctx.fillText(label, node.x, node.y);
    
                node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
            }}
            nodePointerAreaPaint={(node, color, ctx) => {
                ctx.fillStyle = color;
                const bckgDimensions = node.__bckgDimensions;
                bckgDimensions && ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);
            }}
        />
        </>
    );
}