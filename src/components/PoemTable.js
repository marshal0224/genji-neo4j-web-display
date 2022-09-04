import React from 'react'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes, getPoemTableContent, parseChp, parseOrder } from '../utils'
import { useLocation } from 'react-router-dom'
import Edit from './edit'

export default function Poem() { 
    const {state} = useLocation()
    // {
    //     "chapter": [
    //         1
    //     ],
    //     "speaker": [
    //         "Genji's Grandmother"
    //     ],
    //     "addressee": [
    //         "Kiritsubo Emperor"
    //     ],
    //     "spkrGen": [
    //         "male",
    //         "female"
    //     ],
    //     "addrGen": [
    //         "male",
    //         "female",
    //         "multiple",
    //         "nonhuman"
    //     ]
    // }
    return (
        <div>
            <table>
                <thead>
                    <tr>
                        <th>Chapter</th>
                        <th>Poem Number</th>
                        <th className='spkrCol'>Speaker</th>
                        <th className='addrCol'>Addressee</th>
                        <th>
                            Japanese
                        </th>
                        <th>
                            Romaji
                        </th>
                        {/* <th>
                            {this.props.auth 
                            ? 'Cranston'
                            : <select className={'ptcol3'} onChange={this.setColumnOptions}>
                                <option>Translation A</option>
                                <option>Cranston</option>
                                <option>Seidensticker</option>
                                <option>Tyler</option>
                                <option>Waley</option>
                                <option>Washburn</option>
                            </select> }
                        </th>
                        <th>{this.props.auth
                            ? 'Seidensticker'
                            : <select className={'ptcol4'} onChange={this.setColumnOptions}>
                                <option>Translation B</option>
                                <option>Cranston</option>
                                <option>Seidensticker</option>
                                <option>Tyler</option>
                                <option>Waley</option>
                                <option>Washburn</option>
                            </select>}
                        </th>
                        {this.props.auth ? <th>Tyler</th> : null}
                        {this.props.auth ? <th>Waley</th> : null}
                        {this.props.auth ? <th>Washburn</th> : null} */}
                    </tr>
                </thead>
                <tbody>
                    {/* {this.state.ptHeader.map((row) => 
                        <tr key={row[0]}>
                            <td>{parseChp(row[0])}</td>
                            <td className='pg'>{parseOrder(row[0])}</td>
                            <td className='spkrCol'>
                                {this.setCharColor(row[1])}
                                {this.props.auth && <Edit uri={this.state.uri} user={this.state.user} password={this.state.password} propertyName={'name'} name={row[1]} changeKey={this.props.changeKey}/>}
                            </td>
                            <td className='addrCol'>
                                {this.setCharColor(row[2])}
                                {this.props.auth && <Edit uri={this.state.uri} user={this.state.user} password={this.state.password} propertyName={'name'} name={row[2]} changeKey={this.props.changeKey}/>}
                            </td>
                            <td className='ptcol1'>
                                {this.props.auth 
                                ? <Edit uri={this.state.uri} user={this.state.user} password={this.state.password} propertyName={'Japanese'} currVal={this.state.info[row[0]]['Japanese']} pnum={row[0]} changeKey={this.props.changeKey}/>
                                : <p type='JP' className={row[0]}>{this.state.info[row[0]]['Japanese']}</p>}
                            </td>
                            <td className='ptcol2'>
                                {this.props.auth 
                                ? <Edit uri={this.state.uri} user={this.state.user} password={this.state.password} propertyName={'Romaji'} currVal={this.state.info[row[0]]['Romaji']} pnum={row[0]} changeKey={this.props.changeKey}/>
                                : <p className={row[0]}>{this.state.info[row[0]]['Romaji']}</p>}
                            </td>
                            {this.props.auth 
                            ? <td className='ptcol3'>
                                <Edit uri={this.state.uri} user={this.state.user} password={this.state.password} propertyName={'Cranston'} currVal={this.state.info[row[0]]['Cranston']} pnum={row[0]} changeKey={this.props.changeKey}/>
                            </td> 
                            : <td  className='ptcol3'>
                                <select onChange={this.updateSelection}>
                                    <option>select:</option>
                                    {this.getOptions(row[0]).map((item) => <option key={this.state.info[row[0]][item]}>{item}</option>)}
                                </select>
                                <p className={row[0]}></p>
                            </td>}
                            {this.props.auth 
                            ? <td className='ptcol4'>
                                <Edit uri={this.state.uri} user={this.state.user} password={this.state.password} propertyName={'Seidensticker'} currVal={this.state.info[row[0]]['Seidensticker']} pnum={row[0]} changeKey={this.props.changeKey}/>
                            </td>  
                            : <td className='ptcol4'>
                                <select onChange={this.updateSelection}>
                                    <option>select:</option>
                                    {this.getOptions(row[0]).map((item) => <option key={this.state.info[row[0]][item]}>{item}</option>)}
                                </select>
                                <p className={row[0]}></p>
                            </td>}
                            {this.props.auth 
                            ? <td className='ptcol5'>
                                <Edit uri={this.state.uri} user={this.state.user} password={this.state.password} propertyName={'Tyler'} currVal={this.state.info[row[0]]['Tyler']} pnum={row[0]} changeKey={this.props.changeKey}/>
                            </td> 
                            : null}
                            {this.props.auth 
                            ? <td className='ptcol6'>
                                <Edit uri={this.state.uri} user={this.state.user} password={this.state.password} propertyName={'Waley'} currVal={this.state.info[row[0]]['Waley']} pnum={row[0]} changeKey={this.props.changeKey}/>
                                <Edit uri={this.state.uri} user={this.state.user} password={this.state.password} propertyName={'page'} currVal={this.state.info[row[0]]['WaleyPageNum']} pnum={row[0]} changeKey={this.props.changeKey}/>
                            </td> 
                            : null}
                            {this.props.auth 
                            ? <td className='ptcol7'>
                                <Edit uri={this.state.uri} user={this.state.user} password={this.state.password} propertyName={'Washburn'} currVal={this.state.info[row[0]]['Washburn']} pnum={row[0]} changeKey={this.props.changeKey}/>
                            </td> 
                            : null}
                    </tr>)} */}
                </tbody>
            </table>
        </div>
    )
}