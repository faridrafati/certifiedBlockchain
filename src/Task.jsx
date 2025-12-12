/**
 * @file Task.jsx
 * @description Blockchain-based personal task/todo manager
 * @author CertifiedBlockchain
 *
 * This component provides a decentralized task management system where:
 * - Each user has their own private task list
 * - Tasks are permanently stored on the blockchain
 * - Users can add tasks with descriptions and deadlines
 * - Tasks can be marked as completed (deleted)
 *
 * Features:
 * - Per-wallet task isolation (each user sees only their tasks)
 * - DateTime picker for task deadlines
 * - Clean task card UI with delete functionality
 * - Automatic date parsing from task text
 * - Auto-refresh every 12 seconds
 *
 * Smart Contract: Task.sol
 * CSS: ./components/css/task.css
 *
 * Task Storage Format:
 * - Task text includes deadline: "Task description @ YYYY-MM-DDTHH:MM"
 * - The UI parses this format to display date separately
 *
 * @example
 * // Each wallet manages their own tasks
 * <Task />
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Web3 from 'web3';
import { TextField, Button, IconButton, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { toast } from 'react-toastify';
import detectEthereumProvider from '@metamask/detect-provider';
import { TASK_ABI, TASK_ADDRESS } from './components/config/TaskConfig';
import ContractInfo from './components/ContractInfo';
import LoadingSpinner from './components/LoadingSpinner';
import './components/css/task.css';

const Task = () => {
  const [web3, setWeb3] = useState(null);
  const [network, setNetwork] = useState('');
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [owner, setOwner] = useState('');
  const [chainId, setChainId] = useState('');
  const [currentAccount, setCurrentAccount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState(null);

  // Task state
  const [tasks, setTasks] = useState([]);
  const [taskText, setTaskText] = useState('');
  const [taskDateTime, setTaskDateTime] = useState('');

  const checkMetamask = useCallback(async () => {
    try {
      const { ethereum } = window;
      const provider = await detectEthereumProvider();

      if (!provider) {
        toast.error('Please install MetaMask!');
        setLoading(false);
        return;
      }

      const chain = await ethereum.request({ method: 'eth_chainId' });
      setChainId(chain);

      ethereum.on('chainChanged', () => window.location.reload());
      ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setCurrentAccount(accounts[0]);
          setAccount(accounts[0]);
          window.location.reload();
        }
      });
    } catch (error) {
      console.error('Error checking MetaMask:', error);
      toast.error('Failed to connect to MetaMask');
      setLoading(false);
    }
  }, []);

  const loadTasks = useCallback(async (contractInstance, userAccount) => {
    try {
      const taskList = await contractInstance.methods
        .getMyTasks()
        .call({ from: userAccount });
      setTasks(taskList);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Failed to load tasks');
    }
  }, []);

  const initializeContract = useCallback(async () => {
    try {
      if (!window.ethereum) {
        toast.error('Please install MetaMask to use this application');
        setLoading(false);
        return;
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);

      const chainId = await web3Instance.eth.getChainId();
      const networkNames = {
        1n: 'mainnet',
        5n: 'goerli',
        11155111n: 'sepolia',
        137n: 'polygon',
        80001n: 'mumbai',
        56n: 'bsc',
        97n: 'bsc-testnet',
      };
      const networkType = networkNames[chainId] || `chain-${chainId}`;
      const accounts = await web3Instance.eth.getAccounts();
      const userAccount = accounts[0];

      setNetwork(networkType);
      setAccount(userAccount);
      setCurrentAccount(userAccount);

      const contractInstance = new web3Instance.eth.Contract(TASK_ABI, TASK_ADDRESS);
      setContract(contractInstance);

      // Get owner
      let contractOwner = '';
      const ownerMethods = ['getOwner', 'getOwnerAddress', 'owner'];
      for (const method of ownerMethods) {
        try {
          contractOwner = await contractInstance.methods[method]().call();
          if (contractOwner) break;
        } catch (err) {
          // Method doesn't exist, try next one
        }
      }
      setOwner(contractOwner);

      // Load tasks
      await loadTasks(contractInstance, userAccount);

      setLoading(false);
    } catch (error) {
      console.error('Error initializing contract:', error);
      toast.error('Failed to initialize smart contract');
      setLoading(false);
    }
  }, [loadTasks]);

  useEffect(() => {
    checkMetamask();
    initializeContract();
  }, [checkMetamask, initializeContract]);

  // Auto-refresh every 12 seconds (Ethereum block time)
  useEffect(() => {
    if (!contract) return;

    const interval = setInterval(() => {
      loadTasks(contract);
    }, 12000);

    return () => clearInterval(interval);
  }, [contract, loadTasks]);

  const handleRefresh = async () => {
    if (!contract) return;
    try {
      await loadTasks(contract, account);
      toast.success('Data refreshed!');
    } catch (error) {
      console.error('Refresh failed:', error);
      toast.error('Failed to refresh data');
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();

    if (!contract || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!taskText.trim()) {
      toast.error('Please enter a task');
      return;
    }

    if (!taskDateTime) {
      toast.error('Please select a date and time');
      return;
    }

    const taskWithDate = `${taskText} @ ${taskDateTime}`;

    try {
      setSubmitting(true);
      toast.info('Adding task. Please confirm in MetaMask...');

      await contract.methods
        .addTask(taskWithDate, false)
        .send({ from: account, gas: '1000000' })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', async () => {
          toast.success('Task added successfully!');
          setTaskText('');
          setTaskDateTime('');
          await loadTasks(contract, account);
        })
        .on('error', (error) => {
          console.error('Add task error:', error);
          toast.error(`Failed to add task: ${error.message}`);
        });
    } catch (error) {
      console.error('Add task failed:', error);
      toast.error(`Failed to add task: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!contract || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setDeletingTaskId(taskId);
      toast.info('Deleting task. Please confirm in MetaMask...');

      await contract.methods
        .deleteTask(taskId, true)
        .send({ from: account, gas: '1000000' })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', async () => {
          toast.success('Task deleted successfully!');
          await loadTasks(contract, account);
        })
        .on('error', (error) => {
          console.error('Delete task error:', error);
          toast.error(`Failed to delete task: ${error.message}`);
        });
    } catch (error) {
      console.error('Delete task failed:', error);
      toast.error(`Failed to delete task: ${error.message || 'Unknown error'}`);
    } finally {
      setDeletingTaskId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading task manager..." />;
  }

  return (
    <div className="task-container">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-title-row">
            <h1 className="display-4 fw-bold mb-3">📝 Todo Manager</h1>
            <ContractInfo
              contractAddress={TASK_ADDRESS}
              contractName="Task Contract"
              network={import.meta.env.VITE_NETWORK_ID}
              owner={owner}
              account={account}
            />
            <Tooltip title="Refresh Data">
              <IconButton onClick={handleRefresh} className="hero-refresh-btn">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </div>
          <p className="lead mb-4">
            Manage your tasks on the blockchain with transparency and permanence
          </p>
        </div>
      </section>

      <div className="task-content">
        <div className="add-task-card">
          <h3>➕ Add New Task</h3>
          <p className="add-task-description">
            Create a new task with a deadline
          </p>

          <form onSubmit={handleAddTask}>
            <div className="task-form-group">
              <TextField
                label="Task Description"
                variant="outlined"
                fullWidth
                value={taskText}
                onChange={(e) => setTaskText(e.target.value)}
                placeholder="What needs to be done?"
                disabled={submitting}
                multiline
                rows={2}
              />

              <TextField
                label="Date & Time"
                type="datetime-local"
                variant="outlined"
                fullWidth
                value={taskDateTime}
                onChange={(e) => setTaskDateTime(e.target.value)}
                disabled={submitting}
                InputLabelProps={{ shrink: true }}
              />

              <Button
                variant="contained"
                color="primary"
                size="large"
                type="submit"
                fullWidth
                disabled={submitting || !taskText.trim() || !taskDateTime}
                className="add-task-button"
              >
                {submitting ? 'Adding Task...' : 'Add Task'}
              </Button>
            </div>
          </form>
        </div>

        <div className="tasks-section">
          <div className="tasks-header">
            <h3>📋 Your Tasks</h3>
            <span className="tasks-count">
              {tasks.filter((task) => !task.isDeleted).length} task
              {tasks.filter((task) => !task.isDeleted).length !== 1 ? 's' : ''}
            </span>
          </div>

          {tasks.length === 0 ? (
            <div className="no-tasks">
              <div className="no-tasks-icon">✨</div>
              <h4>No Tasks Yet</h4>
              <p>Add your first task to get started!</p>
            </div>
          ) : (
            <div className="tasks-list">
              {tasks
                .filter((task) => !task.isDeleted)
                .map((task, index) => {
                  // Extract date from task text if it exists
                  const taskParts = task.taskText.split(' @ ');
                  const mainText = taskParts[0];
                  const dateText = taskParts[1] || '';

                  return (
                    <div key={task.id || index} className="task-card">
                      <div className="task-icon">
                        <CheckCircleOutlineIcon />
                      </div>

                      <div className="task-details">
                        <p className="task-text">{mainText}</p>
                        {dateText && (
                          <div className="task-date">
                            <AccessTimeIcon fontSize="small" />
                            <span>{dateText}</span>
                          </div>
                        )}
                      </div>

                      <IconButton
                        className="delete-task-button"
                        onClick={() => handleDeleteTask(task.id)}
                        disabled={deletingTaskId === task.id}
                        aria-label="Delete task"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

Task.propTypes = {};

export default Task;
