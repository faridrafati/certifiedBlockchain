/**
 * @file details.jsx
 * @description Poll voting detail view with radio button options
 * @author CertifiedBlockchain
 *
 * Displays a single poll's question and options for voting.
 * Users select an option via radio buttons and submit their vote.
 *
 * Features:
 * - Dynamic radio button generation from poll options
 * - Filters out empty options
 * - Disabled state when user has already voted
 * - Submit button validation (must select option)
 *
 * Used By: Poll.jsx
 *
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.selectedPoll - Poll data object
 * @param {string} props.selectedPoll.question - Poll question text
 * @param {Array} props.selectedPoll.items - Voting options
 * @param {boolean} props.selectedPoll.voted - Whether user has voted
 * @param {Function} props.submitVote - Callback to submit vote
 *
 * @example
 * <Details selectedPoll={poll} submitVote={handleVote} />
 */

import React, { Component } from 'react';


class Details extends Component {
    state = { 
        btnDisabled : true,
        selectedItem:"",
    }

    btnCheck = (e) => {
        this.setState({btnDisabled:false,selectedItem:e.currentTarget.value});
    }

    render() {
        let {question,items,voted} = this.props.selectedPoll;
        return (
            <div>
                <h1>{question}</h1>
                <form action="submit">
                    <div className="form-group">
                        {items.filter(item => {return item!==""}).map((item,index)=>(
                           <div className="form-check"  key={index}>
                                <input 
                                    type="radio" 
                                    className="form-check-input" 
                                    id={index} name='selection' 
                                    value={item} 
                                    checked={this.state.selectedItem === item} 
                                    onChange={this.btnCheck}/>
                                <label htmlFor={index} className="form-check-label">{item}</label>
                            </div>
                        ))}
                        <button  onClick={(e)=>this.props.submitVote(e,this.state.selectedItem)} className='btn btn-secondary' disabled={this.state.btnDisabled || voted}>Submit Vote</button>                          
                    </div>
                </form>
            </div>
        );
    }
}
 
export default Details;