import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import authReducer from './reducers/authReducer';
import skillTreeReducer from './reducers/skillTreeReducer';
import taskReducer from './reducers/taskReducer';
import userReducer from './reducers/userReducer';

// 组合所有reducer
const rootReducer = combineReducers({
  auth: authReducer,
  skillTree: skillTreeReducer,
  task: taskReducer,
  user: userReducer
});

// 配置Redux DevTools
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

// 创建store
const store = createStore(
  rootReducer,
  composeEnhancers(applyMiddleware(thunk))
);

export default store;
