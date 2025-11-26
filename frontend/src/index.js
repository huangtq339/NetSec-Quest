import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import store from './store';
import './styles.css';

// 在开发环境中过滤不需要的警告和错误
if (process.env.NODE_ENV === 'development') {
  // 过滤console.warn
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    // 过滤掉findDOMNode已废弃的警告
    if (args[0]?.includes('findDOMNode is deprecated')) {
      return;
    }
    // 过滤消息端口相关的警告
    if (args[0]?.includes('The message port closed before a response was received')) {
      return;
    }
    // 其他警告正常显示
    originalConsoleWarn.apply(console, args);
  };
  
  // 过滤console.error中特定的错误信息
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // 过滤Unchecked runtime.lastError错误
    if (args[0]?.includes('Unchecked runtime.lastError')) {
      return;
    }
    // 其他错误正常显示
    originalConsoleError.apply(console, args);
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
