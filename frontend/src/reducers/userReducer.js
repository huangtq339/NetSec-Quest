// 用户状态的初始状态
const initialState = {
  profile: null,
  achievements: [],
  statistics: {
    totalPoints: 0,
    completedTasks: 0,
    completedNodes: 0,
    rank: null
  },
  isLoading: false,
  error: null
};

// 用户相关的action types
export const USER_ACTIONS = {
  SET_PROFILE: 'SET_PROFILE',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  SET_ACHIEVEMENTS: 'SET_ACHIEVEMENTS',
  SET_STATISTICS: 'SET_STATISTICS',
  UPDATE_STATISTICS: 'UPDATE_STATISTICS',
  LOADING: 'LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  RESET_USER: 'RESET_USER'
};

// 用户reducer
const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case USER_ACTIONS.LOADING:
      return {
        ...state,
        isLoading: action.payload,
        error: null
      };
    case USER_ACTIONS.SET_PROFILE:
      return {
        ...state,
        profile: action.payload,
        isLoading: false,
        error: null
      };
    case USER_ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        profile: {
          ...state.profile,
          ...action.payload
        },
        error: null
      };
    case USER_ACTIONS.SET_ACHIEVEMENTS:
      return {
        ...state,
        achievements: action.payload,
        isLoading: false,
        error: null
      };
    case USER_ACTIONS.SET_STATISTICS:
      return {
        ...state,
        statistics: action.payload,
        isLoading: false,
        error: null
      };
    case USER_ACTIONS.UPDATE_STATISTICS:
      return {
        ...state,
        statistics: {
          ...state.statistics,
          ...action.payload
        },
        error: null
      };
    case USER_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    case USER_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    case USER_ACTIONS.RESET_USER:
      return initialState;
    default:
      return state;
  }
};

export default userReducer;
