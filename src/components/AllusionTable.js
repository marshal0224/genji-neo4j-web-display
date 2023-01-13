import React, { useContext, useEffect, useMemo, useState, useReducer, useRef } from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes, getChpList, concatObj } from '../utils'
import { Col, BackTop, Button, Divider, Form, Input, Row, Select, Space, Table, Tag } from 'antd';
import 'antd/dist/antd.min.css';
import TextArea from 'antd/lib/input/TextArea';

// Editable cell code from antd doc
const EditableContext = React.createContext(null);
const EditableRow = ({ index, ...props }) => {
    const [form] = Form.useForm();
    return (
        <Form form={form} component={false}>
            <EditableContext.Provider value={form}>
                <tr {...props} />
            </EditableContext.Provider>
        </Form>
    );
};
const EditableCell = ({
    title,
    editable,
    children,
    dataIndex,
    record,
    handleSave,
    ...restProps
}) => {
    const [editing, setEditing] = useState(false);
    const inputRef = useRef(null);
    const form = useContext(EditableContext);
    useEffect(() => {
        if (editing) {
            inputRef.current.focus();
        }
    }, [editing]);
    const toggleEdit = () => {
        setEditing(!editing);
        form.setFieldsValue({
            [dataIndex]: record[dataIndex],
        });
    };
    const save = async () => {
        try {
            const values = await form.validateFields();
            toggleEdit();
            handleSave({
                ...record,
                ...values,
            });
        } catch (errInfo) {
            console.log('Save failed:', errInfo);
        }
    };
    let childNode = children;
    if (editable) {
        childNode = editing ? (
            <Form.Item
                style={{
                    margin: 0,
                }}
                name={dataIndex}
                rules={[
                    {
                        required: true,
                        message: `${title} is required.`,
                    },
                ]}
            >
                <TextArea ref={inputRef} onPressEnter={save} onBlur={save} />
            </Form.Item>
        ) : (
            <div
                className="editable-cell-value-wrap"
                style={{
                    paddingRight: 24,
                }}
                onClick={toggleEdit}
            >
                {children}
            </div>
        );
    }
    return <td {...restProps}>{childNode}</td>;
};
// end of antd code
export default function AllusionTable() {
    const [pnum, setPnum] = useState([{ value: '', label: '' }])
    const [data, setData] = useState([])
    const [selectedPnum, setSelectedPnum] = useState('')
    const [query, setQuery] = useState([])
    const [poet, setPoet] = useState([])
    const [translators, setTranslators] = useState([{value: 'Tyler', label: 'Tyler'},{value: 'Vincent', label: 'Vincent'},{value: 'Washburn', label: 'Washburn'}])
    const [source, setSource] = useState([])
    const [auth, setAuth] = useState(false)
    const [usr, setUsr] = useState('')
    const [pwd, setPwd] = useState('')
    const [allusion, setAllusion] = useState({})
    const [maxID, setMaxID] = useState(0)
    const [newHonka, setNewHonka] = useState('')
    const [newRomaji, setNewRomaji] = useState('')
    const [newTranslator, setNewTranslator] = useState('')
    const [newTranslation, setNewTranslation] = useState('')
    const [newPoet, setNewPoet] = useState('')
    const [newSource, setNewSource] = useState('')
    const [newOrder, setNewOrder] = useState('N/A')
    const [selectedTranslation, setSelectedTranslation] = useState('Vincent')
    const [editSource, setEditSource] = useState('')
    const [editOrder, setEditOrder] = useState('N/A')
    const [sourceQuery, setSourceQuery] = useState('')

    const forceUpdate = useReducer(x => x + 1, 0)[1]

    const chapters = getChpList()
    const vincent = [process.env.REACT_APP_USERNAME, process.env.REACT_APP_PASSWORD]
    const defaultColumns = [
        {
            title: 'ID',
            dataIndex: 'key',
            key: 'ID',
            sorter: (a, b) => parseInt(a.key.slice(1)) - parseInt(b.key.slice(1)),
            defaultSortOrder: 'ascend',
            editable: true,
        },
        {
            title: 'Honka',
            dataIndex: 'Honka',
            key: 'Honka',
            width: 280,
            textWrap: 'word-break',
            editable: true,
        },
        {
            title: 'Romaji',
            dataIndex: 'Romaji',
            key: 'Romaji',
            editable: true,
        },
        {
            title: 'Poet',
            dataIndex: 'Poet', 
            key: 'Poet',
            editable: true,
        },
        {
            title: 'Source',
            dataIndex: 'Source',
            key: 'Source',
            render: (text, record) => (
                <Row>
                    <Col span={24}>
                        {text !== undefined ? text.map(e => 
                            <Tag
                                visible={e[2]}
                                onClick={(event) => deleteHonkaSourceLink(record.key, e[0], e[1])}
                            >
                                {e[1] !== 'N/A' ? e[0]+' '+e[1] : e[0]}
                            </Tag>) 
                        : null}
                    </Col>
                    <Divider></Divider>
                    <Col span={24}>
                        {auth === true
                            ? <>
                                <label>Source</label>
                                <Select
                                    showSearch
                                    options={source}
                                    style={{
                                        width: '100%',
                                    }}
                                    onChange={(value) => setEditSource(value)}
                                />
                                <label>Order</label>
                                <Input 
                                    defaultValue={'N/A'}
                                    onChange={(event) => setEditOrder(event.target.value)}
                                />
                                <Button
                                    onClick={(event) => createSourceEdge(record.key)}
                                >
                                    Link
                                </Button>
                            </>
                            : null}
                    </Col>
                </Row>
            )
        },
        {
            title: (
                <Select 
                    value={selectedTranslation} 
                    onChange={(value) => setSelectedTranslation(value)}  
                    // options={[{value: 'Tyler', label: 'Tyler'},{value: 'Vincent', label: 'Vincent'},{value: 'Washburn', label: 'Washburn'}]}
                    options={translators}
                    width={100}
                />
            ),
            dataIndex: 'name',
            key: 'name',
            editable: true,
            render: (value, record) => {
                // console.log(record[selectedTranslation])
                if (record['translations'] !== undefined) {
                    return record['translations'][selectedTranslation]
                }
            },
        },
        {
            title: 'Notes',
            dataIndex: 'notes',
            key: 'notes',
            editable: true,
        },
        {
            title: 'Alluded to by',
            key: 'link',
            render: (_, record) => (
                <Row>
                    <Col span={24}>
                        {allusion[record.key] !== undefined 
                            ? allusion[record.key].map(e => 
                                <Tag
                                    visible={e[1]}
                                    onClick={auth ? deleteLink(e[0], record.key) : null}
                                >
                                    {e[0]}
                                </Tag>) 
                            : null}
                    </Col>
                    <Divider></Divider>
                    <Col span={24}>
                        {allusion[record.key] !== undefined 
                        ? Array.from(new Set(allusion[record.key].map(e => chapters[parseInt(e[0].substring(0, 2)) - 1]))).map(e =>
                            <Tag>
                                {e}
                            </Tag>) 
                        : null}
                    </Col>
                    <Col span={24}>
                        {auth === true
                            ? <>
                                <Divider></Divider>
                                <Select
                                    showSearch
                                    options={pnum}
                                    style={{
                                        width: '60%',
                                    }}
                                    onChange={(value) => setSelectedPnum(value)}
                                ></Select>
                                <Button
                                    onClick={() => createLink(record.key)}
                                >
                                    Link
                                </Button>
                            </>
                            : null}
                    </Col>
                </Row>
            )
        }
    ]

    const components = {
        body: {
            row: EditableRow, 
            cell: EditableCell,
        },
    }

    const columns = defaultColumns.map((col) => {
        if (!col.editable) {
            return col;
        } else {
            return {
                ...col, 
                onCell: (record) => ({
                    record, 
                    editable: col.editable,
                    dataIndex: col.dataIndex,
                    title: col.title,
                })
            }
        }
    })

    const createSourceEdge = (id) => {
        if (editSource === '') {
            alert('Need to select a source title!')
        } else {
            let bool = window.confirm('About to link ' + editSource + ' to ' + id + ' as a source with order ' + editOrder)
            if (bool) {
                setSourceQuery('Match (s:Source {title:"' + editSource + '"}), (h:Honka {id:"' + id + '"}) merge p=(s)<-[:ANTHOLOGIZED_IN {order: "' + editOrder + '"}]-(h) return p')
                let temp = data
                for (let i = 0; i < data.length; i++) {
                    if (temp[i].key === id) {
                        if (temp[i].Source === undefined) {
                            temp[i].Source = [[editSource, editOrder, true]]
                        } else {
                            temp[i].Source.push([editSource, editOrder, true])
                        }
                    }
                }
                setData(temp)
                // forceUpdate()
            } else {
                alert('Link canceled!')
            }
        }
    }

    useMemo(() => {
        const _ = async () => {
            initDriver(process.env.REACT_APP_NEO4J_URI,
                process.env.REACT_APP_NEO4J_USERNAME,
                process.env.REACT_APP_NEO4J_PASSWORD)
            const driver = getDriver()
            const session = driver.session()
            let write = await session.writeTransaction(tx => tx.run(sourceQuery))
            session.close()
            closeDriver()
        }
        if (sourceQuery !== '') {
            _().catch(console.error)
            setSourceQuery('')
            alert('Link created!')
        }
    }, [sourceQuery])

    const createLink = (key) => {
        if (selectedPnum === '') {
            alert('Need to select a pnum!')
        } else {
            let bool = window.confirm('About to link between ' + key + ' and ' + selectedPnum + '. ')
            if (bool) {
                setQuery(["MATCH (g:Genji_Poem {pnum:'" + selectedPnum + "'}), (h:Honka {id:'" + key + "'}) MERGE (g)-[:ALLUDES_TO]->(h) MERGE (h)-[:ALLUDED_TO_IN]->(g) return (h)", 'link'])
                let al = allusion
                if (key in al) {
                    al[key].push([selectedPnum, true])
                } else {
                    al[key] = [[selectedPnum, true]]
                }
                setAllusion(al)
            } else {
                alert('Canceled. If you still want to link between ' + key + ' and ' + selectedPnum + ', choose another poem and switch back.')
            }
        }
        setSelectedPnum('')
    }

    const deleteLink = (pnum, id) => () => {
        if (auth) {
            let bool = window.confirm('About to delete a honka link.')
            if (bool) {
                let index = allusion[id].findIndex(e => JSON.stringify(e) === JSON.stringify([pnum, true]))
                let a = allusion
                a[id][index][1] = false
                setAllusion(a)
                setQuery(["MATCH (g:Genji_Poem {pnum:'" + pnum + "'})-[r:ALLUDES_TO]->(h:Honka {id:'" + id + "'}), (h)-[s:ALLUDED_TO_IN]->(g) delete r delete s return (g)", 'delete'])
            }
        }
    }

    const deleteHonkaSourceLink = (id, title, order) => {
        if (auth) {
            let bool = window.confirm(`About to delete a link between ${id} and ${title} ${order}.`)
            if (bool) {
                let d = data
                let index = d[parseInt(id.slice(1))]['Source'].findIndex(element => element[0] === title && element[1] === order);
                d[parseInt(id.slice(1))]['Source'][index][2] = false
                setData(d)
                // forceUpdate()
                setQuery([`MATCH (h:Honka {id:"${id}"})-[r:ANTHOLOGIZED_IN {order:"${order}"}]->(s:Source {title:"${title}"}) delete r return (h)`, 'delete'])
            }
        }
    }

    const newEntry = () => {
        let id = 'H' + (maxID + 1)
        if (newPoet === '') {
            alert("Need a poet!")
        } else if (newTranslator === '') {
            alert("Need a translator!")
        } else if (newSource === '') {
            alert("Need a source!")
        } else {
            setQuery(['match (p:People {name:"' + newPoet + '"}), (t:People {name: "'+newTranslator+'"}), (s:Source {title:"' + newSource + '"}) create entry=(p)-[:AUTHOR_OF]->(h:Honka {id: "' + id + '"})-[:ANTHOLOGIZED_IN {order: "' + newOrder + '"}]->(s), (h)<-[:TRANSLATION_OF]-(:Translation {translation: "'+newTranslation+'"})<-[:TRANSLATOR_OF]-(t) set h.Honka="' + newHonka + '", h.Romaji="' + newRomaji + '" return entry as res', 'entry'])
            console.log(query)
            setNewHonka('')
            setNewRomaji('')
            setNewPoet('')
            setNewTranslator('')
            setNewTranslation('')
            setNewSource('')
            setNewOrder('N/A')
            forceUpdate()
        }
    }

    useMemo(() => {
        const _ = async () => {
            initDriver(process.env.REACT_APP_NEO4J_URI,
                process.env.REACT_APP_NEO4J_USERNAME,
                process.env.REACT_APP_NEO4J_PASSWORD)
            const driver = getDriver()
            const session = driver.session()
            let write = await session.writeTransaction(tx => tx.run(query[0]))
            session.close()
            closeDriver()
        }
        if (query.length > 0) {
            if (query[1] === 'entry') {
                let bool = window.confirm('About to create a new Honka!')
                if (bool) {
                    _().catch(console.error)
                    setMaxID(maxID + 1)
                }
                alert('Honka created! Please refresh the honka table to see it.')
            } else if (query[1] === 'link') {
                _().catch(console.error)
                alert('Linked created!')
            } else if (query[1] === 'delete') {
                _().catch(console.error)
                alert('Linked deleted!')
            }
        }
    }, [query])

    // table content
    useEffect(() => {
        let get = 'match (a:Honka) return (a) as honka'
        let getPnum = 'match (g:Genji_Poem) return g.pnum as pnum'
        let getLinks = 'MATCH (n:Honka)-[]-(p:Genji_Poem) RETURN n.id as id, p.pnum as pnum'
        let getPoet = 'match (p:People) return p.name as poet'
        let getHonkaPoet = 'match (h:Honka)<-[:AUTHOR_OF]-(p:People) return h.id as id, p.name as name'
        let getSource = 'match (s:Source) return s.title as source'
        let getHonkaSource = 'match (h:Honka)-[r:ANTHOLOGIZED_IN]-(s:Source) return h.id as id, r.order as order, s.title as title'
        let getTrans = 'match (h:Honka)<-[:TRANSLATION_OF]-(t:Translation)<-[:TRANSLATOR_OF]-(p:People) return h.id as id, t.translation as trans, p.name as name'
        const _ = async () => {
            initDriver(process.env.REACT_APP_NEO4J_URI,
                process.env.REACT_APP_NEO4J_USERNAME,
                process.env.REACT_APP_NEO4J_PASSWORD)
            const driver = getDriver()
            const session = driver.session()
            const res = await session.readTransaction(tx => tx.run(get))
            const resPnum = await session.readTransaction(tx => tx.run(getPnum))
            const resLink = await session.readTransaction(tx => tx.run(getLinks))
            const resPoet = await session.readTransaction(tx => tx.run(getPoet))
            const resPoetEdge = await session.readTransaction(tx => tx.run(getHonkaPoet))
            const resSrc = await session.readTransaction(tx => tx.run(getSource))
            const resSourceEdge = await session.readTransaction(tx => tx.run(getHonkaSource))
            const resTrans = await session.readTransaction(tx => tx.run(getTrans))
            let ans = []
            let max = 0
            let key = 0
            let translators = new Set()
            let transLs = resTrans.records.map(e => [concatObj(toNativeTypes(e.get('id'))), concatObj(toNativeTypes(e.get('trans'))), concatObj(toNativeTypes(e.get('name')))])
            let transObj = {}
            transLs.forEach(e => {
                translators.add(e[2])
                if (transObj[e[0]] === undefined) {
                    transObj[e[0]] = {}
                    transObj[e[0]][e[2]] = e[1]
                } else {
                    transObj[e[0]][e[2]] = e[1]
                }
            })
            translators = Array.from(translators).map(e => ({value: e, label: e}))
            setTranslators(translators)
            res.records.map(e => toNativeTypes(e.get('honka'))).forEach(e => {
                delete Object.assign(e.properties, { ['key']: e.properties['id'] })['id']
                // e.properties.translations = { Vincent: e.properties.Vincent, Washburn: e.properties.Washburn, Tyler: e.properties.Tyler }
                e.properties.translations = transObj[e.properties.key]
                ans.push(e.properties)
                key = parseInt(e.properties.key.slice(1))
                if (max < key) {
                    max = key
                }
            })
            let tempEdgeList = resSourceEdge.records.map(e => [concatObj(toNativeTypes(e.get('id'))), concatObj(toNativeTypes(e.get('title'))), concatObj(toNativeTypes(e.get('order')))])
            let tempEdgeObj = {}
            tempEdgeList.forEach(e => {
                if (tempEdgeObj[e[0]] === undefined) {
                    tempEdgeObj[e[0]] = [[e[1], e[2], true]]
                } else {
                    tempEdgeObj[e[0]].push([e[1], e[2], true])
                }
            })
            ans.forEach(e => {
                if (tempEdgeObj[e.key] !== undefined) {
                    e.Source = tempEdgeObj[e.key]
                } 
            })
            let poetEdge = resPoetEdge.records.map(e => [concatObj(toNativeTypes(e.get('id'))), concatObj(toNativeTypes(e.get('name')))])
            poetEdge.forEach(e => {
                let index = ans.findIndex(ele => ele.key === e[0])
                ans[index].Poet = e[1]
            })
            setData(ans)
            if (maxID !== max) {
                setMaxID(max)
            }
            let temp = resPnum.records.map(e => e.get('pnum'))
            let ls = []
            temp.forEach(e => {
                ls.push({ value: e, label: e })
            })
            setPnum(ls)
            let ll = Array.from(new Set(resLink.records.map(e => JSON.stringify([e.get('id'), e.get('pnum')])))).map(e => JSON.parse(e))
            let links = {}
            ll.forEach(e => {
                if (e[0] in links) {
                    links[e[0]].push([e[1], true])
                } else {
                    links[e[0]] = [[e[1], true]]
                }
            })
            setAllusion(links)
            temp = resPoet.records.map(e => e.get('poet'))
            let poets = []
            temp.forEach(e => {
                poets.push({ value: e, label: e })
            })
            setPoet(poets)
            temp = resSrc.records.map(e => e.get('source'))
            let sources = []
            temp.forEach(e => {
                sources.push({ value: e, label: e })
            })
            setSource(sources)
            session.close()
            closeDriver()
        }
        _().catch(console.error)
    }, [])

    return (
        <div>
            <Row>
                <Col span={21}>
                    <Table 
                        columns={auth ? columns : defaultColumns} 
                        components={components} 
                        dataSource={data} 
                        rowClassName={() => 'editable-row'}
                    />
                </Col>
                <Col span={3}>
                    <Space direction='vertical'>
                        <Input
                            placeholder="input username"
                            onChange={(event) => setUsr(event.target.value)}
                        />
                        <Input.Password
                            placeholder="input password"
                            onChange={(event) => setPwd(event.target.value)}
                        />
                    </Space>
                    <Button disabled={auth} onClick={() => (usr === vincent[0]) && (pwd === vincent[1]) ? setAuth(true) : console.log(usr, pwd)}>Login</Button>
                    <Button disabled={!auth} onClick={() => setAuth(false)}>Logout</Button>
                    <Divider></Divider>
                    {auth === true
                        ? <>
                            <p>ID: H{maxID + 1}</p>
                            <label>Honka</label>
                            <TextArea
                                onChange={(event) => setNewHonka(event.target.value)}
                            />
                            <label>Romaji</label>
                            <TextArea
                                onChange={(event) => setNewRomaji(event.target.value)}
                            />
                            <label>Translator</label>
                            <Select
                                showSearch
                                style={{
                                    width: '100%'
                                }}
                                options={poet}
                                value={newTranslator}
                                onChange={(value) => setNewTranslator(value)}
                            />
                            <label>Translation</label>
                            <TextArea
                                onChange={(event) => setNewTranslation(event.target.value)}
                            />
                            <label>Poet</label>
                            <Select
                                showSearch
                                style={{
                                    width: '100%'
                                }}
                                options={poet}
                                value={newPoet}
                                onChange={(value) => setNewPoet(value)}
                            />
                            <label>Source</label>
                            <Select
                                showSearch
                                style={{
                                    width: '100%'
                                }}
                                options={source}
                                value={newSource}
                                onChange={(value) => setNewSource(value)}
                            />
                            <label>Order</label>
                            <Input 
                                defaultValue={"N/A"}
                                onChange={(value) => setNewOrder(value)}
                            />
                            <Button onClick={newEntry}>Create</Button>
                        </>
                        : null}
                    <BackTop>
                        <div>Back to top</div>
                    </BackTop>
                </Col>
            </Row>
        </div>
    )
}