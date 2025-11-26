import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// 地球网格组件
const EarthMesh = () => {
  const earthRef = useRef();
  const { scene } = useThree();
  const [isRotating, setIsRotating] = useState(true);
  const [rotationProgress, setRotationProgress] = useState(0);
  const [targetRotation, setTargetRotation] = useState({ x: 0, y: 0 });
  const [initialRotation, setInitialRotation] = useState({ x: 0, y: 0 });
  
  // 添加和配置光照
  useEffect(() => {
    // 移除可能存在的旧光源
    const oldLights = [];
    scene.traverse(obj => {
      if (obj.isLight && !obj.userData.isOriginal) {
        oldLights.push(obj);
      }
    });
    oldLights.forEach(light => scene.remove(light));
    
    // 降低环境光强度（减少1/5）
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // 从0.5降低到0.4
    ambientLight.userData.isOriginal = false;
    scene.add(ambientLight);
    
    // 大幅降低主方向光强度，避免产生过亮的白色圆点
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8); // 进一步降低到0.8
    directionalLight1.position.set(1, 1, 1).normalize();
    directionalLight1.castShadow = false; // 禁用阴影以避免增强高亮区域
    directionalLight1.userData.isOriginal = false;
    scene.add(directionalLight1);
    
    // 移除辅助方向光以减少重复照明
    // const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    // directionalLight2.position.set(-1, 0.5, -0.5).normalize();
    // directionalLight2.userData.isOriginal = false;
    // scene.add(directionalLight2);
    
    // 降低半球光强度（减少1/5）
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x0c0c0c, 0.64); // 从0.8降低到0.64
    hemiLight.position.set(0, 1, 0);
    hemiLight.userData.isOriginal = false;
    scene.add(hemiLight);
    
    // 配置阴影映射
    directionalLight1.shadow.mapSize.width = 1024;
    directionalLight1.shadow.mapSize.height = 1024;
    directionalLight1.shadow.camera.near = 0.1;
    directionalLight1.shadow.camera.far = 100;
    directionalLight1.shadow.camera.left = -20;
    directionalLight1.shadow.camera.right = 20;
    directionalLight1.shadow.camera.top = 20;
    directionalLight1.shadow.camera.bottom = -20;
  }, [scene]);
  
  // 加载高清纹理 - 使用支持CORS的jsdelivr CDN纹理，带本地备用
  const [textures, setTextures] = useState(null);
  
  useEffect(() => {
    // 创建THREE.TextureLoader实例
    const textureLoader = new THREE.TextureLoader();
    
    // 设置跨域属性
    textureLoader.crossOrigin = 'anonymous';
    
    // 纹理URL配置
    const textureUrls = {
      map: 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg',
      bumpMap: 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png',
      specularMap: 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-water.png'
    };
    
    const localTextureUrls = {
      map: '/assets/textures/earth-blue-marble.jpg',
      bumpMap: '/assets/textures/earth-topology.png',
      specularMap: '/assets/textures/earth-water.png'
    };
    
    // 加载单个纹理的函数，支持回退
    const loadTextureWithFallback = (type, cdnUrl, localUrl) => {
      return new Promise((resolve, reject) => {
        textureLoader.load(
          cdnUrl,
          // 成功回调
          (texture) => {
            console.log(`${type} 纹理从CDN加载成功`);
            resolve(texture);
          },
          // 进度回调
          undefined,
          // 错误回调
          () => {
            console.warn(`${type} 纹理CDN加载失败，尝试本地纹理`);
            textureLoader.load(
              localUrl,
              (texture) => {
                console.log(`${type} 纹理从本地加载成功`);
                resolve(texture);
              },
              undefined,
              (error) => {
                console.error(`${type} 纹理本地加载也失败:`, error);
                reject(error);
              }
            );
          }
        );
      });
    };
    
    // 并行加载所有纹理
    const loadAllTextures = async () => {
      try {
        const loadedTextures = {
          map: await loadTextureWithFallback('漫反射', textureUrls.map, localTextureUrls.map),
          bumpMap: await loadTextureWithFallback('法线/高度', textureUrls.bumpMap, localTextureUrls.bumpMap),
          specularMap: await loadTextureWithFallback('高光/水面', textureUrls.specularMap, localTextureUrls.specularMap)
        };
        
        setTextures(loadedTextures);
      } catch (error) {
        console.error('部分或全部纹理加载失败:', error);
      }
    };
    
    loadAllTextures();
  }, []);
  
  // 设置纹理过滤参数以提升清晰度
  // 确保所有纹理都使用最佳过滤方式并开启mipmap
  useEffect(() => {
    if (textures) {
      Object.values(textures).forEach(texture => {
        // 设置更清晰的过滤方式
        texture.minFilter = THREE.NearestFilter; // 使用最近邻过滤保持细节
        texture.magFilter = THREE.LinearFilter;
        // 确保生成mipmap以提升不同距离的渲染质量
        texture.generateMipmaps = true;
        // 启用各向异性过滤，大幅提高纹理清晰度
        texture.anisotropy = 16;
      });
    }
  }, [textures]);
  
  // 地球材质 - 进一步降低反光效果，消除过亮的白色圆点
  const material = new THREE.MeshPhongMaterial({
    // 只有当textures存在时才使用纹理，避免传递undefined
    ...(textures && {
      map: textures.map,
      bumpMap: textures.bumpMap,
      bumpScale: 0.06, // 保持地形凹凸程度
      specularMap: textures.specularMap
    }),
    specular: new THREE.Color(0xaaaaaa), // 降低高光颜色亮度
    shininess: 20, // 大幅降低光泽度，消除过强的高光
    reflectivity: 0.2, // 大幅降低反光强度
    transparent: false,
    opacity: 1.0,
    side: THREE.FrontSide
  });
  
  // 移除了省份边界材质创建
  
  // 移除了所有GeoJSON数据加载和解析相关代码
  
  // 计算中国中心点的旋转角度 - 确保初始加载时自动旋转到中国位置
  useEffect(() => {
    // 使用中国的中心点坐标：东经105°、北纬35°
    const chinaLongitude = 105; // 东经105°
    const chinaLatitude = 35;   // 北纬35°
    
    // 为中国区域优化的旋转角度计算
    const adjustedLongitude = chinaLongitude - 5; // 微调经度使中国更居中
    const targetY = -THREE.MathUtils.degToRad(adjustedLongitude);
    
    // 稍微调整纬度，使中国版图稍微偏上，获得更好的显示效果
    const adjustedLatitude = chinaLatitude + 2;
    const targetX = -THREE.MathUtils.degToRad(90 - adjustedLatitude);
    
    // 保存初始旋转状态
    if (earthRef.current) {
      // 为了获得更好的动画效果，初始旋转设置一个稍微随机的位置
      const randomInitialY = Math.random() * 2 - 1; // -1 到 1 之间的随机值
      
      earthRef.current.rotation.x = 0;
      earthRef.current.rotation.y = randomInitialY;
      
      setInitialRotation({
        x: 0,
        y: randomInitialY
      });
      setTargetRotation({ x: targetX, y: targetY });
      setIsRotating(true);
      setRotationProgress(0);
    }
  }, []);
  
  // 动画循环 - 优化旋转效果
  useFrame((state, delta) => {
    if (earthRef.current) {
      if (isRotating && rotationProgress < 1) {
        // 旋转到目标省份位置 - 使用更自然的缓动函数
        const progress = Math.min(rotationProgress + delta * 0.8, 1); // 增加旋转速度
        
        // 使用easeInOutQuad缓动函数，提供更自然的加速和减速效果
        let easeProgress;
        if (progress < 0.5) {
          easeProgress = 2 * progress * progress;
        } else {
          easeProgress = -1 + (4 - 2 * progress) * progress;
        }
        
        // 使用球面插值而非线性插值，使旋转路径更自然
        const currentRotation = {
          x: initialRotation.x + (targetRotation.x - initialRotation.x) * easeProgress,
          y: initialRotation.y + (targetRotation.y - initialRotation.y) * easeProgress
        };
        
        earthRef.current.rotation.x = currentRotation.x;
        earthRef.current.rotation.y = currentRotation.y;
        
        setRotationProgress(progress);
        
        if (progress >= 1) {
          setIsRotating(false);
        }
      } else if (!isRotating) {
        // 缓慢自动旋转 - 轻微的周期性变化，模拟真实地球自转
        const time = state.clock.getElapsedTime();
        // 添加微小的周期性变化，使旋转更自然
        const subtleVariation = 0.0001 * Math.sin(time * 0.5);
        earthRef.current.rotation.y += 0.0004 + subtleVariation;
      }
    }
  });
  
  // 移除了省份边界创建函数
  
  return (
    <group>
      {/* 地球主体 - 增大尺寸至1.6并大幅提高分段数以增强清晰度 */}
      <mesh 
        ref={earthRef}
        geometry={new THREE.SphereGeometry(1.6, 256, 256)} // 大幅增加分段数，提高表面精度
        material={material}
      />
      
      {/* 移除了省份边界渲染代码 */}
      
      {/* 移除大气层效果，避免出现过亮的白色球体 */}
    </group>
  );
};

// 3D地球组件
const Earth = ({ 
  width = '100%', 
  height = '80vh'
}) => {
  return (
    <div style={{ width, height, position: 'relative' }}>
      <Canvas style={{ background: 'linear-gradient(to bottom, #050a18, #1a2541)' }}>
        {/* 相机设置 - 调整位置以适应放大后的地球 */}
      <perspectiveCamera 
        makeDefault 
        position={[0, 0, 3.5]} 
        fov={45}
      />
        
        {/* 移除Canvas中的额外光源，避免与EarthMesh中的光源重复 */}
        {/* <ambientLight intensity={0.5} /> */}
        {/* <directionalLight 
          position={[5, 3, 5]} 
          intensity={1.2} 
          color={0xffffff}
        /> */}
        
        {/* 星空背景 */}
        <Stars 
          radius={100} 
          depth={50} 
          count={5000} 
          factor={4} 
          saturation={0} 
          fade 
        />
        
        {/* 地球网格 */}
        <EarthMesh />
        
        {/* 轨道控制器 - 禁用缩放，只允许旋转 */}
        <OrbitControls 
          enablePan={false}
          enableZoom={false}
          autoRotate={false}
          rotateSpeed={0.5}
        />
      </Canvas>
      
      {/* 移除了定位信息显示 */}
    </div>
  );
};

export default Earth;