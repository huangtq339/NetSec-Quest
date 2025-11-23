// 任务状态的初始状态
const initialState = {
  tasks: [],
  currentTask: null,
  taskHistory: [],
  isLoading: false,
  error: null
};

// 任务相关的action types
export const TASK_ACTIONS = {
  SET_TASKS: 'SET_TASKS',
  SET_CURRENT_TASK: 'SET_CURRENT_TASK',
  SET_TASK_HISTORY: 'SET_TASK_HISTORY',
  ADD_TASK_HISTORY_ITEM: 'ADD_TASK_HISTORY_ITEM',
  LOADING: 'LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  RESET_CURRENT_TASK: 'RESET_CURRENT_TASK'
};

// 任务reducer
const taskReducer = (state = initialState, action) => {
  switch (action.type) {
    case TASK_ACTIONS.LOADING:
      return {
        ...state,
        isLoading: action.payload,
        error: null
      };
    case TASK_ACTIONS.SET_TASKS:
      return {
        ...state,
        tasks: action.payload,
        isLoading: false,
        error: null
      };
    case TASK_ACTIONS.SET_CURRENT_TASK:
      return {
        ...state,
        currentTask: action.payload,
        isLoading: false,
        error: null
      };
    case TASK_ACTIONS.SET_TASK_HISTORY:
      return {
        ...state,
        taskHistory: action.payload,
        isLoading: false,
        error: null
      };
    case TASK_ACTIONS.ADD_TASK_HISTORY_ITEM:
      return {
        ...state,
        taskHistory: [action.payload, ...state.taskHistory],
        error: null
      };
    case TASK_ACTIONS.RESET_CURRENT_TASK:
      return {
        ...state,
        currentTask: null,
        taskHistory: []
      };
    case TASK_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    case TASK_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

export default taskReducer;
