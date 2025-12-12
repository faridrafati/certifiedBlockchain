//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Task
 * @author CertifiedBlockchain
 * @notice A decentralized task management system with per-user task lists
 * @dev Each user has their own private task list. Tasks can be added and
 *      soft-deleted. Only the task owner can view or modify their tasks.
 *
 * Key Features:
 * - Personal task lists for each user
 * - Add tasks with custom text
 * - Soft-delete tasks (marked as deleted, not removed)
 * - Retrieve only active (non-deleted) tasks
 * - Event emission for task actions
 *
 * Usage Example:
 * ```javascript
 * // Deploy contract
 * const task = await Task.deploy();
 *
 * // Add a new task
 * await task.addTask("Complete smart contract audit", false);
 *
 * // Get all my active tasks
 * const myTasks = await task.getMyTasks();
 *
 * // Delete a task (soft delete)
 * await task.deleteTask(0, true);
 * ```
 */
contract Task {
    /*//////////////////////////////////////////////////////////////
                               EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a new task is added
    /// @param recipient Address of the task owner
    /// @param taskId The unique ID of the created task
    event AddTask(address recipient, uint taskId);

    /// @notice Emitted when a task is deleted/restored
    /// @param taskId The ID of the affected task
    /// @param isDeleted The new deletion status
    event DeleteTask(uint taskId, bool isDeleted);

    /*//////////////////////////////////////////////////////////////
                               STRUCTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Structure representing a single task
     */
    struct TaskItems {
        uint id;           // Unique task identifier
        string taskText;   // The task description/content
        bool isDeleted;    // Soft deletion flag
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Array storing all tasks (from all users)
    TaskItems[] private tasks;

    /// @notice Mapping from task ID to owner address
    /// @dev Used to verify task ownership
    mapping(uint256 => address) taskToOwner;

    /*//////////////////////////////////////////////////////////////
                         PUBLIC FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Creates a new task for the caller
     * @dev Task ID is automatically assigned based on array length
     * @param taskText The description or content of the task
     * @param isDeleted Initial deletion status (typically false)
     *
     * Emits an {AddTask} event
     */
    function addTask(string memory taskText, bool isDeleted) external {
        uint taskId = tasks.length;
        tasks.push(TaskItems(taskId, taskText, isDeleted));
        taskToOwner[taskId] = msg.sender;
        emit AddTask(msg.sender, taskId);
    }

    /**
     * @notice Deletes or restores a task (soft delete)
     * @dev Only the task owner can modify deletion status
     * @param taskId The ID of the task to modify
     * @param isDeleted True to delete, false to restore
     *
     * Note: Only the task owner can call this function successfully.
     * If caller is not the owner, the function silently does nothing.
     *
     * Emits a {DeleteTask} event if successful
     */
    function deleteTask(uint taskId, bool isDeleted) external {
        if (taskToOwner[taskId] == msg.sender) {
            tasks[taskId].isDeleted = isDeleted;
            emit DeleteTask(taskId, isDeleted);
        }
    }

    /*//////////////////////////////////////////////////////////////
                          VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Retrieves all active (non-deleted) tasks for the caller
     * @dev Filters tasks by ownership and deletion status
     * @return An array of TaskItems belonging to the caller that are not deleted
     *
     * Note: This function only returns tasks where:
     * - The caller is the task owner
     * - The task is not marked as deleted
     */
    function getMyTasks() external view returns (TaskItems[] memory) {
        TaskItems[] memory temporary = new TaskItems[](tasks.length);
        uint counter = 0;
        for (uint i = 0; i < tasks.length; i++) {
            if (taskToOwner[i] == msg.sender && tasks[i].isDeleted == false) {
                temporary[counter] = tasks[i];
                counter++;
            }
        }

        TaskItems[] memory result = new TaskItems[](counter);
        for (uint i = 0; i < counter; i++) {
            result[i] = temporary[i];
        }
        return result;
    }
}
