/**
 * @file list.jsx
 * @description Poll card list item component for poll overview
 * @author CertifiedBlockchain
 *
 * Displays a poll as a clickable card with:
 * - Poll image
 * - Question text (truncated)
 * - Total vote count
 * - Voted status badge
 *
 * Features:
 * - Image thumbnail display
 * - Vote count calculation using lodash sum
 * - "Voted" badge for completed votes
 * - Clickable card for navigation to details
 *
 * Used By: Poll.jsx (poll listing)
 *
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.poll - Poll data object
 * @param {string} props.poll.question - Poll question text
 * @param {string} props.poll.image - Poll image URL
 * @param {Array} props.poll.votes - Array of vote counts per option
 * @param {boolean} props.poll.voted - Whether user has voted
 * @param {Function} props.onClick - Click handler for card selection
 *
 * @example
 * <CardList poll={pollData} onClick={() => selectPoll(poll)} />
 */

import React, { Component } from 'react';
import _ from 'lodash';

class CardList extends Component {
    state = {  } 
    render() {
        let {question,image,votes,voted} = this.props.poll;
        let result = votes.map(i=>Number(i));
        return (
            <div className="card mb-4" onClick={this.props.onClick}>
                <img src={image} alt="" className="card-img-top"/>
                <div className="card-body">
                    <p className="card-text text-truncate fw-bold">
                       {question}
                    </p>
                    <div className="d-flex justify-content-between">
                        <small className="text-muted">votes: {_.sum(result)}</small>
                        {voted && <span className="badge bg-success">voted</span>}
                    </div>

                </div>
            </div>
        );
    }
}
 
export default CardList;