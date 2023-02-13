import React, { useMemo, useState, useReducer, useEffect } from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes, getChpList, concatObj } from '../utils'
import { Select, Col, Row, Button, Space, BackTop, Divider, Tag, Input, Form } from 'antd';
import 'antd/dist/antd.min.css';
import TextArea from 'antd/lib/input/TextArea';

export default function EditPage() {
    let labels = [{value: 'nickname', label: 'nickname'}, {value: 'nicktitle', label: 'nicktitle'}, {value: 'people', label: 'people'}, {value: 'source', label: 'source'}, {value: 'translation', label: 'translation'}]
    // list of objects that describe the property key(s) of a label, e.g., [{Nickname: nickname}]
    const [form] = Form.useForm()
    const [props, setProps] = React.useState({})

    const onLabelChange = (value) => {
        switch (value) {
            default:
                form.setFieldValue({label: value})
                break;
        }
        // setSelectedLabel(value)
    };

    useEffect(() => {
        let ls = labels.map(e => "'"+e.label+"'")
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
            console.log(keysObj)
            setProps(keysObj)
            session.close()
            closeDriver()
        }
        _().catch(console.error)
    }, [])

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
                                span: 8,
                            },
                            wrapperCol: {
                                span: 16,
                            },
                        }}
                        form={form}
                        name="nodeProps"
                        onFinish={(values) => {
                            console.log(values);
                        }}
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
                                // props[getFieldValue('label')].props.forEach(e => 
                                getFieldValue('label') === 'nickname' ?
                                    <Form.Item
                                        name={'nickname'}
                                        label={'nickname'}
                                        rules={[
                                            {
                                                required: true,
                                            },
                                        ]}
                                    >
                                        <Input />
                                    </Form.Item>
                                : getFieldValue('label') === 'nicktitle' ?
                                    <Form.Item
                                        name={'nicktitle'}
                                        label={'nicktitle'}
                                        rules={[
                                            {
                                                required: true,
                                            },
                                        ]}
                                    >
                                        <Input />
                                    </Form.Item>
                                : null
                            }
                        </Form.Item>
                    </Form>
                </Col>
                <Col span={3}/>
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