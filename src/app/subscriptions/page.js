'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function SubscriptionsPage() {
  const router = useRouter();
  const [subscribedServices, setSubscribedServices] = useState({});
  const [activeTab, setActiveTab] = useState('유료 중');
  const [showPassword, setShowPassword] = useState({});
  
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
  
  // 로컬 스토리지에서 구독 정보 불러오기
  useEffect(() => {
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
    
    loadSubscriptions();
  }, []);

  // 남은 구독 기간 계산
  const calculateRemainingDays = (expiryDate) => {
    const now = new Date().getTime();
    const diffTime = expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // 구독 시작일 포맷팅
  const formatStartDate = (expiryDate, periodType) => {
    const days = periodType === '개월' ? 30 : 365;
    const startDate = new Date(expiryDate - (days * 24 * 60 * 60 * 1000));
    return startDate.toLocaleDateString();
  };

  // 구독 만료일 포맷팅
  const formatExpiryDate = (expiryDate) => {
    return new Date(expiryDate).toLocaleDateString();
  };

  // 현재 탭에 따른 구독 내역 필터링
  const getFilteredSubscriptions = () => {
    const now = new Date().getTime();
    const subscriptions = Object.entries(subscribedServices).map(([id, data]) => ({
      id: parseInt(id),
      ...data
    }));

    switch (activeTab) {
      case '유료 중':
        return subscriptions.filter(sub => sub.expiryDate > now);
      case '만료됨':
        return subscriptions.filter(sub => sub.expiryDate <= now);
      case '위시리스트':
        return [];
      default:
        return [];
    }
  };

  // 탭 내용 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case '유료 중':
        if (Object.keys(subscribedServices).length === 0) {
          return (
            <div className="text-center py-12">
              <div className="flex justify-center mb-6">
                <div 
                  className="w-[200px] h-[200px] bg-contain bg-center bg-no-repeat pointer-events-none"
                  style={{ 
                    backgroundImage: 'url(/empty_box.svg)'
                  }}
                />
              </div>
              <p className="text-gray-700 font-medium mb-6">더 이상 주문 정보가 없습니다</p>
              <button
                onClick={() => router.push('/')}
                className="bg-[#FF6B3D] text-white px-6 py-2 rounded-full hover:bg-[#E55A2C]"
              >
                지금 구매
              </button>
            </div>
          );
        }
        return (
          <>
            {getFilteredSubscriptions().map((subscription) => {
              const accountInfo = SERVICE_ACCOUNTS[subscription.name] || {
                email: 'sample@example.com',
                password: '********'
              };
              
              return (
                <div key={subscription.id} className="bg-white rounded-lg shadow-md p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Image
                          src={`/${subscription.name.toLowerCase()
                            .replace('넷플릭스', 'netflix')
                            .replace('디즈니+', 'disneyplus')
                            .replace('discovery+', 'discoveryplus')
                            .replace(/\+/g, 'plus')}_logo.png`}
                          alt={`${subscription.name} 로고`}
                          width={40}
                          height={40}
                          style={{ objectFit: 'contain' }}
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-black">{subscription.name}</h3>
                        <p className="text-green-600 font-medium">활성화됨</p>
                        <p className="text-gray-700">
                          구독 시작: {formatStartDate(subscription.expiryDate, subscription.periodType)}
                        </p>
                        <p className="text-gray-700">
                          구독 만료: {formatExpiryDate(subscription.expiryDate)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-600 font-medium">구독중</p>
                      <p className="text-gray-700 font-medium">남은 기간: {calculateRemainingDays(subscription.expiryDate)}일</p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 mt-2">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">트랜잭션 해시</p>
                        <div className="flex items-center mt-1">
                          <p className="text-sm text-gray-700 truncate">{subscription.transactionHash.substring(0, 10)}...</p>
                          <button className="ml-2 text-gray-400 hover:text-gray-600" onClick={() => navigator.clipboard.writeText(subscription.transactionHash)}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">이메일</p>
                        <div className="flex items-center mt-1">
                          <p className="text-sm text-gray-700 truncate">{accountInfo.email}</p>
                          <button className="ml-2 text-gray-400 hover:text-gray-600" onClick={() => navigator.clipboard.writeText(accountInfo.email)}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">비밀번호</p>
                        <div className="flex items-center mt-1">
                          <p className="text-sm text-gray-700 truncate">
                            {showPassword[subscription.name] ? accountInfo.password : '••••••'}
                          </p>
                          <button 
                            className="ml-2 text-gray-400 hover:text-gray-600" 
                            onClick={() => setShowPassword(prev => ({
                              ...prev, 
                              [subscription.name]: !prev[subscription.name]
                            }))}
                          >
                            {showPassword[subscription.name] ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                          <button className="ml-2 text-gray-400 hover:text-gray-600" onClick={() => navigator.clipboard.writeText(accountInfo.password)}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        );
      case '만료됨':
      case '위시리스트':
        return (
          <div className="text-center py-12">
            <div className="flex justify-center mb-6">
              <div 
                className="w-[200px] h-[200px] bg-contain bg-center bg-no-repeat pointer-events-none"
                style={{ 
                  backgroundImage: 'url(/empty_box.svg)'
                }}
              />
            </div>
            <p className="text-gray-700 font-medium mb-6">
              {activeTab === '위시리스트' ? '위시리스트가 비어있습니다' : '더 이상 주문 정보가 없습니다'}
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-[#FF6B3D] text-white px-6 py-2 rounded-full hover:bg-[#E55A2C]"
            >
              지금 구매
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-[#5fcebd] text-white p-4 flex justify-between items-center">
        <div className="flex items-center">
          <span className="font-bold text-3xl cursor-pointer" onClick={() => router.push('/')}>
            <strong>Junha's Share Market</strong>
          </span>
        </div>
        <nav className="space-x-4">
          <span className="cursor-pointer hover:underline" onClick={() => router.push('/')}>마트</span>
          <span className="cursor-pointer hover:underline" onClick={() => router.push('/subscriptions')}>구독</span>
          <a href="#" className="hover:underline">한국어</a>
        </nav>
      </header>

      {/* 주문 내역 헤더 */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold py-6 text-black">주문 내역</h1>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="container mx-auto px-4 mt-6">
        <div className="flex border-b">
          {['유료 중', '만료됨', '위시리스트'].map((tab) => (
            <button
              key={tab}
              className={`py-2 px-4 font-medium ${activeTab === tab ? 'text-[#5fcebd] border-b-2 border-[#5fcebd]' : 'text-gray-700'}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 구독 목록 */}
      <div className="container mx-auto px-4 py-8">
        {renderTabContent()}
      </div>
    </div>
  );
} 