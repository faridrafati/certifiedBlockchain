/**
 * @file Listing.jsx
 * @description Task list item component with delete functionality
 * @author CertifiedBlockchain
 *
 * Displays a single task item in a Material-UI list format
 * with a delete icon for removal.
 *
 * Features:
 * - Material-UI List components
 * - Delete icon with click handler
 * - Clean task text display
 *
 * Used By: Task.jsx (blockchain task manager)
 *
 * CSS: ./Listing.css
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.taskText - Task description text
 * @param {Function} props.onClick - Delete handler callback
 *
 * @example
 * <Listing taskText="Complete project" onClick={handleDelete} />
 */

import './Listing.css';
import {List, ListItem, ListItemText} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import React, { Component } from 'react';

class Listing extends Component {
    render() { 
        let {taskText,onClick} = this.props;
        return (
            <List className='todo_list'>
                <ListItem>
                    <ListItemText primary = {taskText}/>
                </ListItem>
                <DeleteIcon fontSize='large' style={{opacity:0.7}} onClick={onClick}></DeleteIcon>
            </List>
        );
    }
}
 
export default Listing;

