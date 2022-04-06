import React from 'react'
//import {  } from '../neo4j'
import { initDriver, getDriver, closeDriver } from '../neo4j'
import { toNativeTypes } from '../utils'

export default class Filter extends React.Component {

    //driver

    constructor(props) {
        super(props)
        initDriver(this.props.uri, this.props.user, this.props.password)
        this.driver = getDriver()
        this.state = {
            speaker: [],
            addressee: [],
            chapter: [],
            gender: [], 
            selectedSpeaker: "",
            selectedAddressee: "",
            selectedPoems: [],
        }
    }

    async componentDidMount() {
        const getExchange = 'match path=(c:Character)-[r:SPEAKER_OF]-(j:Japanese)-[s:ADDRESSEE_OF]-(d:Character) return path'
        //const getPoem = 'match path=(c:Chapter)-[r:INCLUDED_IN]-(j:Japanese)-[s:TRANSLATION_OF]-(t:Translation) return path'
        const session = this.driver.session()

        const res1 = await session.readTransaction(tx => tx.run(getExchange))
        //this.setState({data: res.records.map(row => toNativeTypes(row.get('name')))})
        let temp1 = res1.records.map(row => {return toNativeTypes(row.get('path'))})
        let newtemp1 = temp1.map(({segments}) => segments)
        
        let zeros = []
        let ones = []
        
        newtemp1.forEach(([z, o]) => {
            zeros.push(z)
            ones.push(o)
        })

        this.setState({
            speaker: zeros.map(({start}) => start.properties.name),
                    //pnum: zeros.map(({start}) => start.properties.name),
            addressee: ones.map(({end}) => end.properties.name)
        }, () => {
            console.log('filter options set')
        })

        //const res2 = await session.readTransaction(tx => tx.run(getPoem))
        // let temp2 = res2.records.map(row => {return toNativeTypes(row.get('path'))})
        // let newtemp2 = temp2.map(({segments}) => segments)
        //console.log(newtemp2)
        await session.close()
        closeDriver()
        //console.log('filter mounted')
    }

    render() {
        let speakerForm = [...new Set(this.state.speaker)];
        let addresseeForm = [...new Set(this.state.addressee)];
        let updateSelectedSpeaker = (event) => {
            this.setState({
                selectedSpeaker: event.target.value
                }, 
                () => {
                    console.log('selected speaker now is: ' + this.state.selectedSpeaker)
                }
            )
        }
        let updateSelectedAddressee = (event) => {
            this.setState({
                selectedAddressee: event.target.value
                }, 
                () => {
                    console.log('selected addressee now is: ' + this.state.selectedAddressee)
                }
            )
        }
        return (
            <div>
                <form>
                    <label htmlFor="speaker">Choose a speaker</label>
                    <br />
                    <select 
                        id="speaker"
                        //value={formData.speaker}
                        onChange={updateSelectedSpeaker}
                        name="speaker"
                    >
                        <option value="">Any</option>
                        {speakerForm.map((row) => <option key={row}>{row}</option>)}
                    </select>
                </form>
                <form>
                <label htmlFor="addressee">Choose an addressee</label>
                <br />
                <select 
                    id="addressee"
                    //value={formData.speaker}
                    onChange={updateSelectedAddressee}
                    name="addressee"
                >
                    <option value="">Any</option>
                    {addresseeForm.map((row) => <option key={row}>{row}</option>)}
                </select>
            </form>
        </div>
        )
    }
}