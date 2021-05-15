import { Meteor } from 'meteor/meteor';
import React, { useState, Fragment } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { TasksCollection } from '/imports/db/TasksCollection';
import { Task } from './Task';
import { TaskForm } from './TaskForm';
import { LoginForm } from './LoginForm';
import { useQuery } from "@apollo/react-hooks";
import gql from 'graphql-tag';


const tasksQuery = gql`
  query Tasks {
    tasks {
      _id
      text
    }
  }
`;


const toggleChecked = ({ _id, isChecked }) =>
  Meteor.call('tasks.setIsChecked', _id, !isChecked);

const deleteTask = ({ _id }) => {
  Meteor.call('tasks.remove', _id);
  refetch();
};

export const App = () => {
  const user = useTracker(() => Meteor.user());

  const [hideCompleted, setHideCompleted] = useState(false);

  const  {  data, loading, refetch } = useQuery(tasksQuery)

  const hideCompletedFilter = { isChecked: { $ne: true } };

  const userFilter = user ? { userId: user._id } : {};

  const pendingOnlyFilter = { ...hideCompletedFilter, ...userFilter };

  const { tasksStatus, pendingTasksCount, isLoading } = useTracker(() => {
    const noDataAvailable = { tasksStatus: [], pendingTasksCount: 0 };
    if (!Meteor.user()) {
      return noDataAvailable;
    }
    const handler = Meteor.subscribe('tasks');

    if (!handler.ready() || loading) {
      return { ...noDataAvailable, isLoading: true };
    }
    const tasksStatus = TasksCollection.find(
      hideCompleted ? pendingOnlyFilter : userFilter,
      {
        sort: { createdAt: -1 },
      }
    ).fetch();

    
    const pendingTasksCount = TasksCollection.find(pendingOnlyFilter).count();

    return { tasksStatus, pendingTasksCount };
  });

  const tasksData = data && data.tasks || [];
  const tasks = tasksData.map(({ _id, ...rest }) => ({
    _id,
    ...rest,
    isChecked: (tasksStatus.find(t => t._id === _id) || {}).isChecked,
  }));

  const pendingTasksTitle = `${
    pendingTasksCount ? ` (${pendingTasksCount})` : ''
  }`;

  const logout = () => Meteor.logout();

  return (
    <div className="app">
      <header>
        <div className="app-bar">
          <div className="app-header">
            <h1>
              📝️ To Do List
              {pendingTasksTitle}
            </h1>
          </div>
        </div>
      </header>

      <div className="main">
        {user ? (
          <Fragment>
            <div className="user" onClick={logout}>
              {user.username} 🚪
            </div>

            <TaskForm refetch={refetch} />

            <div className="filter">
              <button onClick={() => setHideCompleted(!hideCompleted)}>
                {hideCompleted ? 'Show All' : 'Hide Completed'}
              </button>
            </div>

            {isLoading && <div className="loading">loading...</div>}

            <ul className="tasks">
              {tasks.map(task => (
                <Task
                  key={task._id}
                  task={task}
                  onCheckboxClick={toggleChecked}
                  onDeleteClick={deleteTask}
                />
              ))}
            </ul>
          </Fragment>
        ) : (
          <LoginForm />
        )}
      </div>
    </div>
  );
};