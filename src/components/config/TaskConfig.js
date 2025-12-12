/**
 * @file TaskConfig.js
 * @description Configuration for Blockchain Task Manager smart contract
 * @author CertifiedBlockchain
 *
 * Contains the deployed contract address and ABI for the Task contract.
 * The address is loaded from environment variables for deployment flexibility.
 *
 * Contract Functions:
 * - addTask(taskText, isDeleted): Create a new task
 * - deleteTask(taskId, isDeleted): Mark task as deleted
 * - getMyTasks(): Get all tasks for current user
 *
 * Events:
 * - AddTask: Emitted when task is created (recipient, taskId)
 * - DeleteTask: Emitted when task is deleted (taskId, isDeleted)
 *
 * TaskItems Structure:
 * - id: Task identifier
 * - taskText: Task description (may include " @ timestamp")
 * - isDeleted: Soft delete flag
 *
 * Used By: Task.jsx
 *
 * Environment Variable: VITE_TASK_ADDRESS
 */

export const TASK_ADDRESS = import.meta.env.VITE_TASK_ADDRESS;
export const TASK_ABI = [{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"recipient","type":"address"},{"indexed":false,"internalType":"uint256","name":"taskId","type":"uint256"}],"name":"AddTask","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"taskId","type":"uint256"},{"indexed":false,"internalType":"bool","name":"isDeleted","type":"bool"}],"name":"DeleteTask","type":"event"},{"inputs":[{"internalType":"string","name":"taskText","type":"string"},{"internalType":"bool","name":"isDeleted","type":"bool"}],"name":"addTask","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"taskId","type":"uint256"},{"internalType":"bool","name":"isDeleted","type":"bool"}],"name":"deleteTask","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getMyTasks","outputs":[{"components":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"string","name":"taskText","type":"string"},{"internalType":"bool","name":"isDeleted","type":"bool"}],"internalType":"struct Task.TaskItems[]","name":"","type":"tuple[]"}],"stateMutability":"view","type":"function"}]