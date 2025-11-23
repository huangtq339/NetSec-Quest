// 技能树状态的初始状态
const initialState = {
  courses: [],
  skillTree: null,
  userProgress: {},
  selectedNode: null,
  isLoading: false,
  error: null
};

// 技能树相关的action types
export const SKILL_TREE_ACTIONS = {
  SET_COURSES: 'SET_COURSES',
  SET_SKILL_TREE: 'SET_SKILL_TREE',
  SET_USER_PROGRESS: 'SET_USER_PROGRESS',
  UPDATE_NODE_PROGRESS: 'UPDATE_NODE_PROGRESS',
  SET_SELECTED_NODE: 'SET_SELECTED_NODE',
  LOADING: 'LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// 技能树reducer
const skillTreeReducer = (state = initialState, action) => {
  switch (action.type) {
    case SKILL_TREE_ACTIONS.LOADING:
      return {
        ...state,
        isLoading: action.payload,
        error: null
      };
    case SKILL_TREE_ACTIONS.SET_COURSES:
      return {
        ...state,
        courses: action.payload,
        isLoading: false,
        error: null
      };
    case SKILL_TREE_ACTIONS.SET_SKILL_TREE:
      return {
        ...state,
        skillTree: action.payload,
        isLoading: false,
        error: null
      };
    case SKILL_TREE_ACTIONS.SET_USER_PROGRESS:
      return {
        ...state,
        userProgress: action.payload,
        isLoading: false,
        error: null
      };
    case SKILL_TREE_ACTIONS.UPDATE_NODE_PROGRESS:
      return {
        ...state,
        userProgress: {
          ...state.userProgress,
          [action.payload.nodeId]: action.payload.progress
        },
        error: null
      };
    case SKILL_TREE_ACTIONS.SET_SELECTED_NODE:
      return {
        ...state,
        selectedNode: action.payload
      };
    case SKILL_TREE_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    case SKILL_TREE_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

export default skillTreeReducer;
