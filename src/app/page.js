'use client';

import Image from "next/image";
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  connectWallet as connectWalletService, 
  checkWalletConnection,
  makePayment,
  switchToSepoliaNetwork
} from '../contracts/paymentService';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [network, setNetwork] = useState('');
  const [showNetworkAlert, setShowNetworkAlert] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [subscribedServices, setSubscribedServices] = useState({});
  const [servicesList, setServicesList] = useState([
    { id: 1, name: '넷플릭스', icon: '/netflix_logo.png', price: 5.5, period: '개월', sales: 10431 },
    { id: 2, name: 'ChatGPT', icon: '/chatgpt_logo.png', price: 4.29, period: '개월', sales: 8798 },
    { id: 3, name: '디즈니+', icon: '/disneyplus_logo.png', price: 14.29, period: '년', soldOut: true, sales: 7777 },
    { id: 4, name: 'Spotify', icon: '/spotify_logo.png', price: 15.78, period: '년', sales: 6015 },
    { id: 5, name: 'Crunchyroll', icon: '/crunchyroll_logo.png', price: 2.98, period: '개월', soldOut: true, sales: 429 },
    { id: 6, name: 'QuillBot', icon: '/quillbot_logo.png', price: 29.99, period: '년', sales: 309 },
    { id: 7, name: 'DeepL', icon: '/deepl_logo.png', price: 50, period: '년', sales: 289 },
    { id: 8, name: 'Discovery+', icon: '/discoveryplus_logo.png', price: 24.99, period: '년', sales: 268 }
  ]);
  
  // 서비스별 고정 계정 정보
  const SERVICE_ACCOUNTS = {
    '넷플릭스': { 
      email: 'Dnk9923kis@proto.com', 
      password: 'houseparty@29480'
    },
    'ChatGPT': { 
      email: 'S14qxr88b1n59@outlook.com', 
      password: 'familypro@25036'
    },
    'Spotify': { 
      email: 'J8334ndb1ss0k@hotworld.com', 
      password: 'studentgod@99102'
    },
    'QuillBot': { 
      email: 'L7sn2nbv114x7e@razer.com', 
      password: 'universitytall@84733'
    },
    'DeepL': { 
      email: 'O90xncjmme332u@revaty.com', 
      password: 'glassesjail@15532'
    },
    'Discovery+': { 
      email: 'N8m2xbxf33r@innon.com', 
      password: 'mouseboat@67228'
    }
  };

  // 서버 세션 관리를 위한 상태
  const [serverStartTime, setServerStartTime] = useState(null);

  // 로컬 스토리지 접근을 위한 클라이언트 사이드 코드
  useEffect(() => {
    // 판매 수 로드
    const loadSalesCount = () => {
      try {
        const savedSales = localStorage.getItem('salesCount');
        if (savedSales) {
          const parsedSales = JSON.parse(savedSales);
          setServicesList(prevServices => 
            prevServices.map(service => ({
              ...service,
              sales: parsedSales[service.id] || service.sales
            }))
          );
        }
      } catch (error) {
        console.error('판매 수 로드 오류:', error);
      }
    };

    // 서버 시작 시간 로드
    const loadServerStartTime = () => {
      try {
        const savedStartTime = localStorage.getItem('serverStartTime');
        if (savedStartTime) {
          setServerStartTime(parseInt(savedStartTime));
        } else {
          // 새로운 서버 세션일 경우에만 새 타임스탬프 생성
          const newStartTime = Date.now();
          localStorage.setItem('serverStartTime', newStartTime.toString());
          setServerStartTime(newStartTime);
        }
      } catch (error) {
        console.error('서버 시작 시간 로드 오류:', error);
      }
    };

    // 구독 정보 로드
    const loadSubscriptions = () => {
      try {
        const savedSubscriptions = localStorage.getItem('subscriptions');
        if (savedSubscriptions) {
          const parsedSubscriptions = JSON.parse(savedSubscriptions);
          
          // 만료된 구독 필터링
          const now = new Date().getTime();
          const validSubscriptions = Object.entries(parsedSubscriptions).reduce((acc, [id, data]) => {
            if (data.expiryDate > now) {
              acc[id] = data;
            }
            return acc;
          }, {});
          
          setSubscribedServices(validSubscriptions);
        }
      } catch (error) {
        console.error('구독 정보 로드 오류:', error);
      }
    };
    
    // 클라이언트 사이드에서만 실행
    if (typeof window !== 'undefined') {
      loadSalesCount();
      loadServerStartTime();
      loadSubscriptions();
    }
  }, []);
  
  // 구독 정보 저장
  const saveSubscriptions = (subscriptions) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
      }
    } catch (error) {
      console.error('구독 정보 저장 오류:', error);
    }
  };
  
  // 남은 구독 기간 계산
  const calculateRemainingDays = (expiryDate) => {
    const now = new Date().getTime();
    const diffTime = expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // 지갑 연결 상태 초기 확인 (페이지 로드 시)
  useEffect(() => {
    async function checkInitialConnection() {
      try {
        const result = await checkWalletConnection();
        
        if (result.success && result.connected) {
          setSigner(result.signer);
          setAccount(result.address);
          setIsConnected(true);
          setNetwork(result.currentNetwork);
          setIsCorrectNetwork(result.isSepoliaNetwork);
        }
      } catch (error) {
        console.error('초기 연결 확인 오류:', error);
      }
    }
    
    checkInitialConnection();
  }, []);

  // 메타마스크 연결 함수
  async function connectWallet() {
    try {
      setLoading(true);
      setConnecting(true);
      setErrorMessage('');
      
      // 연결 시도 메시지 표시
      setSuccessMessage('메타마스크 팝업 창을 확인해주세요. 지갑 연결을 선택하시면 연결됩니다.');
      
      // 팝업창이 나타날 시간을 주기 위해 약간의 지연 추가
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = await connectWalletService();
      
      // 연결 완료 메시지 제거
      setSuccessMessage('');
      
      if (result.success) {
        setSigner(result.signer);
        setAccount(result.address);
        setIsConnected(true);
        setNetwork(result.currentNetwork);
        setIsCorrectNetwork(result.isSepoliaNetwork);
        
        setSuccessMessage('지갑이 성공적으로 연결되었습니다!');
        
        if (!result.isSepoliaNetwork) {
          setShowNetworkAlert(true);
        }
      } else {
        setErrorMessage(result.message);
      }
    } catch (error) {
      console.error('연결 오류:', error);
      
      // 연결 취소 시 명확한 메시지 표시
      if (error.message && (error.message.includes('User rejected') || error.message.includes('user rejected') || error.message.includes('취소'))) {
        setErrorMessage('지갑 연결이 취소되었습니다. 다시 시도해주세요.');
      } else {
        setErrorMessage('지갑 연결 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'));
      }
    } finally {
      setLoading(false);
      setConnecting(false);
    }
  }

  // Sepolia 네트워크로 전환
  async function handleSwitchNetwork() {
    try {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('메타마스크 팝업 창을 확인해주세요. 네트워크 전환을 승인해주세요.');
      
      const result = await switchToSepoliaNetwork();
      
      setSuccessMessage('');
      
      if (result.success) {
        setShowNetworkAlert(false);
        // 네트워크 전환 후 지갑 정보 업데이트
        const walletInfo = await checkWalletConnection();
        if (walletInfo.success && walletInfo.connected) {
          setSigner(walletInfo.signer);
          setAccount(walletInfo.address);
          setNetwork(walletInfo.currentNetwork);
          setIsCorrectNetwork(walletInfo.isSepoliaNetwork);
          setSuccessMessage('성공적으로 Sepolia 테스트넷으로 전환되었습니다.');
        }
      } else {
        setErrorMessage(result.message);
      }
    } catch (error) {
      console.error('네트워크 전환 오류:', error);
      
      // 전환 취소 시 명확한 메시지 표시
      if (error.message && (error.message.includes('User rejected') || error.message.includes('user rejected'))) {
        setErrorMessage('네트워크 전환이 취소되었습니다. 다시 시도해주세요.');
      } else {
        setErrorMessage('네트워크 전환 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'));
      }
    } finally {
      setLoading(false);
    }
  }

  // 알림 팝업 표시 함수
  const showAlertPopup = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
    // 3초 후 자동으로 닫기
    setTimeout(() => {
      setShowAlert(false);
      setAlertMessage('');
    }, 3000);
  };

  // 판매 수 업데이트 및 저장 함수
  const updateSalesCount = (serviceId) => {
    setServicesList(prevServices => {
      const updatedServices = prevServices.map(s => 
        s.id === serviceId 
          ? { ...s, sales: s.sales + 1 }
          : s
      );
      
      // 판매 수를 로컬 스토리지에 저장
      if (typeof window !== 'undefined') {
        const salesCount = updatedServices.reduce((acc, s) => ({
          ...acc,
          [s.id]: s.sales
        }), {});
        localStorage.setItem('salesCount', JSON.stringify(salesCount));
      }
      
      return updatedServices;
    });
  };

  // 서비스 구독 결제 함수
  async function handleSubscribe(service) {
    try {
      if (!isConnected) {
        await connectWallet();
        return;
      }

      // Sepolia 네트워크 체크
      if (!isCorrectNetwork) {
        setShowNetworkAlert(true);
        return;
      }
      
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');
      setSelectedService(service);
      
      setSuccessMessage('메타마스크 팝업 창을 확인해주세요. 트랜잭션을 승인해주세요.');
      
      const result = await makePayment(signer, service.id, service.price);
      
      setSuccessMessage('');
      
      if (result.success) {
        const subscriptionPeriod = service.period === '개월' ? 30 : 365;
        const expiryDate = new Date().getTime() + (subscriptionPeriod * 24 * 60 * 60 * 1000);
        
        const accountInfo = SERVICE_ACCOUNTS[service.name] || {};
        
        const updatedSubscriptions = {
          ...subscribedServices,
          [service.id]: {
            name: service.name,
            expiryDate,
            periodType: service.period,
            email: accountInfo.email,
            password: accountInfo.password,
            transactionHash: result.hash
          }
        };
        
        setSubscribedServices(updatedSubscriptions);
        saveSubscriptions(updatedSubscriptions);

        // 판매 수 증가
        updateSalesCount(service.id);
        
        setSuccessMessage(`${service.name} 구독 결제가 완료되었습니다! 
        결제 금액: ${result.amount} ETH (${result.amountUSD} USD)
        트랜잭션 해시: ${result.hash.substring(0, 10)}...
        구독 기간: ${subscriptionPeriod}일`);
      } else {
        if (result.needNetworkSwitch) {
          setShowNetworkAlert(true);
        } else {
          setErrorMessage('결제가 실패했습니다. 다시 시도해주세요.');
        }
      }
    } catch (error) {
      console.error('결제 오류:', error);
      setErrorMessage('결제 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  // 성공 메시지 자동 닫기
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // 지갑 연결 상태 감지
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          setIsConnected(false);
          setSigner(null);
          setAccount('');
        } else if (accounts[0] !== account && account !== '') {
          window.location.reload();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [account]);

  return (
    <div className="bg-[#f8f8f8] min-h-screen">
      {/* 헤더 */}
      <header className="bg-[#5fcebd] text-white p-4 flex justify-between items-center">
        <div className="flex items-center">
          <span className="font-bold text-3xl"><strong>Junha's Share Market</strong></span>
        </div>
        <nav className="space-x-4">
          <a href="/" className="hover:underline">마트</a>
          <a href="/subscriptions" className="hover:underline">구독</a>
          <a href="#" className="hover:underline">한국어</a>
        </nav>
      </header>

      {/* 메타마스크 연결 상태 */}
      {isConnected && (
        <div className={`p-2 text-center ${isCorrectNetwork ? 'bg-green-100' : 'bg-yellow-100'}`}>
          <p className={`${isCorrectNetwork ? 'text-green-800' : 'text-yellow-800'}`}>
            지갑 연결됨: {account.substring(0, 6)}...{account.substring(account.length - 4)} ({network})
          </p>
        </div>
      )}
      
      {/* 알림 메시지 */}
      {errorMessage && (
        <div className="bg-red-100 p-4 mx-4 mt-4 rounded-md">
          <p className="text-red-800">{errorMessage}</p>
          <button 
            className="mt-2 text-sm text-red-700 underline"
            onClick={() => setErrorMessage('')}
          >
            닫기
          </button>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 p-4 mx-4 mt-4 rounded-md">
          <p className="text-green-800 whitespace-pre-line">{successMessage}</p>
          <button 
            className="mt-2 text-sm text-green-700 underline"
            onClick={() => setSuccessMessage('')}
          >
            닫기
          </button>
        </div>
      )}

      {/* 알림 팝업 */}
      {showAlert && (
        <div className="fixed top-4 right-4 bg-white shadow-lg rounded-lg p-4 z-50 animate-fade-in">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {alertMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <main className="px-4">
        {/* 헤더 배경 */}
        <div className="my-8 py-16 px-8 md:px-16 bg-[#FFD7B4] text-black rounded-md relative overflow-hidden">
          <div className="container mx-auto">
            <div className="max-w-2xl z-10 relative">
              <h2 className="text-3xl font-bold mb-4">쌩돈 쓰지 말고 공유 계정을 사용해보세요!</h2>
              <p className="text-xl">Junha's Share Market을 통해 저렴한 요금제를 즐기세요!</p>
            </div>
            <div className="absolute right-[10%] top-0 h-full w-1/2 md:w-1/2">
              <Image 
                src="/background.png"
                alt="사람이 TV 보는 일러스트" 
                fill
                priority
                style={{
                  objectFit: 'contain',
                  objectPosition: '75% center'
                }}
                className="z-0"
              />
            </div>
          </div>
        </div>

        {/* 구독 서비스 카드 */}
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            {servicesList.map((service) => {
              // 현재 서비스의 구독 정보 확인
              const subscription = subscribedServices[service.id];
              const isSubscribed = Boolean(subscription);
              const remainingDays = isSubscribed ? calculateRemainingDays(subscription.expiryDate) : 0;
              
              return (
                <div key={service.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-4">
                    <div className="bg-gray-100 rounded-lg p-4 flex justify-center items-center">
                      <div className="w-20 h-20 flex items-center justify-center">
                        <Image
                          src={service.icon}
                          alt={`${service.name} 로고`}
                          width={80}
                          height={80}
                          style={{ objectFit: 'contain' }}
                        />
                      </div>
                    </div>
                    <div className="mt-4 min-h-[20px] flex justify-between">
                      <h3 className="text-lg font-semibold text-black">{service.name}</h3>
                      <div>
                        {service.soldOut && !isSubscribed && <span className="text-red-500 text-sm">품절</span>}
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center min-h-[60px]">
                      <div>
                        <div className="text-2xl font-bold text-black">
                          $ {service.price} <span className="text-sm text-black">/ {service.period}</span>
                        </div>
                        {service.sales && <div className="text-xs text-gray-500">판매량: {service.sales}</div>}
                      </div>
                      {isSubscribed && (
                        <div className="text-right">
                          <div className="text-green-500 text-sm">구독중</div>
                          <div className="text-xs text-green-600">남은 기간: {remainingDays}일</div>
                        </div>
                      )}
                    </div>
                    <button 
                      className="mt-4 w-full bg-[#FF6B3D] text-white py-2 px-4 rounded-full hover:bg-[#E55A2C] disabled:bg-gray-400 disabled:cursor-not-allowed"
                      onClick={isConnected ? () => handleSubscribe(service) : connectWallet}
                      disabled={service.soldOut || loading || connecting || isSubscribed}
                    >
                      {loading && selectedService?.id === service.id ? '처리 중...' : 
                       connecting ? '지갑 연결 중...' : 
                       isSubscribed ? '구독중' :
                       isConnected ? '가입하기' : '지갑연결'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      
      {/* 네트워크 전환 알림 */}
      {showNetworkAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-bold text-gray-900 mb-2">네트워크 전환 필요</h3>
              <p className="text-gray-600 text-center mb-4">
                Sepolia 테스트넷으로 연결됩니다! 현재 다른 네트워크에 연결되어 있습니다. 결제를 진행하기 위해 Sepolia 테스트넷으로 전환해야 합니다.
              </p>
              <div className="flex space-x-3">
                <button 
                  className="px-4 py-2 bg-[#5fcebd] text-white rounded-lg hover:bg-[#4db5a6]"
                  onClick={handleSwitchNetwork}
                >
                  네트워크 전환
                </button>
                <button 
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  onClick={() => setShowNetworkAlert(false)}
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 로딩 상태 */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#5fcebd] mb-4"></div>
              <p className="text-gray-800">처리 중입니다...</p>
              {selectedService && (
                <p className="text-gray-600 mt-2">서비스: {selectedService.name}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
