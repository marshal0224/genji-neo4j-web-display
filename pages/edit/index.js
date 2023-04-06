import React, { useMemo, useState, useReducer, useEffect } from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes, getChpList, concatObj } from '../utils'
import { Select, Col, Row, Button, Space, BackTop, Divider, Tag, Input, Form } from 'antd';
import 'antd/dist/antd.min.css';
import TextArea from 'antd/lib/input/TextArea';

export default function EditPage() {
    let labels = [{value: 'Nickname', label: 'Nickname'}, {value: 'Nicktitle', label: 'Nicktitle'}, {value: 'People', label: 'People'}, {value: 'Source', label: 'Source'}, {value: 'Translation', label: 'Translation'}]
    // list of objects that describe the property key(s) of a label, e.g., [{Nickname: nickname}]
    const [form] = Form.useForm()
    const [props, setProps] = React.useState({})
    const [nodeQuery, setNoteQuery] = React.useState('')
    const [auth, setAuth] = useState(false)
    const [usr, setUsr] = useState('')
    const [pwd, setPwd] = useState('')
    const vincent = [process.env.REACT_APP_USERNAME, process.env.REACT_APP_PASSWORD]

    const onLabelChange = (value) => {
        switch (value) {
            default:
                form.setFieldValue({label: value})
                break;
        }
        // setSelectedLabel(value)
    };

    useEffect(() => {
        let ls = labels.map(e => "'"+e.value+"'")
        const _ = async () => {
            initDriver(process.env.REACT_APP_NEO4J_URI,
                process.env.REACT_APP_NEO4J_USERNAME,
                process.env.REACT_APP_NEO4J_PASSWORD)
            const driver = getDriver()
            const session = driver.session()
            const resKeys = await session.readTransaction(tx => tx.run(`call apoc.meta.data()  yield label, property with [${ls}] as labels, property, label where label in labels return property, label`, {ls}))
            let keys = resKeys.records.map(e => [concatObj(toNativeTypes(e.get('label'))), concatObj(toNativeTypes(e.get('property')))])
            let keysObj = {}
            for (let i = 0; i < keys.length; i++) {
                let e = keys[i]
                if (!keysObj.hasOwnProperty(e[0])) {
                    if (e[1].includes('_')) {
                        keysObj[e[0]] = {props: [], rel: [e[1]]}
                    } else {
                        keysObj[e[0]] = {props: [e[1]], rel: []}
                    }
                }
                else if (e[1].includes('_')) {
                    keysObj[e[0]].rel.push(e[1])
                } else {
                    keysObj[e[0]].props.push(e[1])
                }
            }
            setProps(keysObj)
            session.close()
            closeDriver()
        }
        _().catch(console.error)
    }, [])

    // async func for notes. There is probably a way to merge them...
    useMemo(() => {
        const _ = async () => {
            initDriver(process.env.REACT_APP_NEO4J_URI,
                process.env.REACT_APP_NEO4J_USERNAME,
                process.env.REACT_APP_NEO4J_PASSWORD)
            const driver = getDriver()
            const session = driver.session()
            let write = await session.writeTransaction(tx => tx.run(nodeQuery))
            session.close()
            closeDriver()
        }
        if (nodeQuery !== '') {
            _().catch(console.error)
            alert('Node entered')
            setNoteQuery('')
        } 
    }, [nodeQuery])

    const submitNode = () => {
        let bool = window.confirm('About to create a new node!')
        if (bool) {
            let label = form.getFieldValue('label')
            let propKeys = props[label].props
            let query = `CREATE (n:${label}) SET `
            propKeys.forEach(e => {
                query = query.concat(`n.\`${e}\`="${form.getFieldValue(e)}",`)
            });
            query = query.slice(0, -1)
            query = query.concat(` return (n)`)
            setNoteQuery(query)
        } else {
            alert('Canceled!')
        }
    }

    const resetNodeForm = () => {
        form.resetFields()
    }

    // new node: label, props
    // new edge: nodes, edge label, props
    return (
        <div>
            <Row>
                <Col span={3}/>
                <Col flex='auto'>
                    <b>Add a new node</b>
                    <br/>
                    <Form
                        {...{
                            labelCol: {
                                span: 10,
                            },
                            wrapperCol: {
                                span: 14,
                            },
                        }}
                        form={form}
                        name="nodeProps"
                        onFinish={(values) => {
                            console.log(values);
                        }}
                        disabled={!auth}
                    >
                        <Form.Item
                            name="label"
                            label="Label"
                            rules={[
                            {
                                required: true,
                            },
                            ]}
                        >
                            <Select
                                showSearch
                                placeholder={'Select a label:'}
                                style={{
                                    width: '100%',
                                }}
                                options={labels}
                                onChange={onLabelChange}
                            />
                        </Form.Item>
                        <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, currentValues) => prevValues.label !== currentValues.label}
                        >
                            {({ getFieldValue }) => 
                                (getFieldValue('label') !== undefined) ? 
                                props[getFieldValue('label')].props.map(e => 
                                    <Form.Item
                                        name={e}
                                        label={e}
                                        // rules={[
                                        //     {
                                        //         required: true,
                                        //     },
                                        // ]}
                                        key={e}
                                    >
                                        <Input />
                                    </Form.Item>    
                                ) : null
                            }
                        </Form.Item>
                    </Form>
                    <br/>
                    <Button onClick={submitNode} disabled={!auth}>Submit</Button>
                    <Button onClick={resetNodeForm} disabled={!auth}>Reset</Button>
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
                    <Button disabled={auth} onClick={() => (usr === vincent[0]) && (pwd === vincent[1]) ? setAuth(true) : null}>Login</Button>
                    <Button disabled={!auth} onClick={() => setAuth(false)}>Logout</Button>
                </Col>
            </Row>
            <Divider />
            <Row>
                <Col span={3}/>
                <Col flex='auto'>
                    <b>Add a new edge</b>

                </Col>
                <Col span={3}/>
            </Row>
        </div>
    )
}