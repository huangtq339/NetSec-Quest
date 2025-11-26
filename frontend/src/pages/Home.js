import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Earth from '../components/Earth';

const Home = () => {
  const { user } = useAuth();
  const [currentProvince, setCurrentProvince] = useState('北京');
  
  // 处理省份位置变化的回调函数
  const handleLocationChange = (province) => {
    console.log(`位置已更新到: ${province}`);
    setCurrentProvince(province);
    // 这里可以添加其他处理逻辑，比如保存到用户配置等
  };
  
  return (
    <div 
      className="home-page" 
      style={{ 
        margin: 0, 
        padding: 0, 
        width: '100%', 
        height: '100vh',
        overflow: 'hidden' 
      }}
    >
      {/* 3D地球组件，充满整个页面 */}
      <Earth 
        targetProvince={currentProvince}
        width="100%"
        height="100vh"
        autoLocateByIP={true} // 启用自动IP定位功能
        onLocationChange={handleLocationChange} // 位置变化回调函数
      />
    </div>
  );
};

export default Home;