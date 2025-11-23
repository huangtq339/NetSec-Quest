import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import store from './store';
import './styles.css';

// 在开发环境中过滤findDOMNode警告
if (process.env.NODE_ENV === 'development') {
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    // 过滤掉findDOMNode已废弃的警告
    if (args[0]?.includes('findDOMNode is deprecated')) {
      return;
    }
    // 其他警告正常显示
    originalConsoleWarn.apply(console, args);
  };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
