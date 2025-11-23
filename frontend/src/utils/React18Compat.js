import React from 'react';

// React 18 兼容性修复工具

/**
 * 针对React 18中findDOMNode已废弃的警告，提供兼容性功能
 * 主要用于处理第三方库(如Ant Design)在React 18中使用findDOMNode的情况
 */

export const getDOMNode = (element) => {
  // 如果元素已经是DOM节点，直接返回
  if (element && element.nodeType === Node.ELEMENT_NODE) {
    return element;
  }
  // 如果是React组件实例且有ref，使用ref
  if (element && element.ref) {
    return element.ref.current;
  }
  // 注意：这里不使用findDOMNode，而是返回null避免警告
  // 在生产环境中，如果需要可以使用 try-catch 包装 findDOMNode
  return null;
};

/**
 * 用于包装可能引起findDOMNode警告的组件
 * @param {React.ComponentType} Component - 要包装的组件
 * @returns {React.ComponentType} - 包装后的组件
 */
export const withNoFindDOMNodeWarning = (Component) => {
  const WrappedComponent = (props) => {
    return <Component {...props} />;
  };
  
  WrappedComponent.displayName = `WithNoFindDOMNodeWarning(${Component.displayName || Component.name || 'Component'})`;
  
  return WrappedComponent;
};
