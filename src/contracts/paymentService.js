import { ethers } from 'ethers';
import { PaymentContractABI, PaymentContractAddress } from './PaymentContract';

// Sepolia 네트워크 정보
const SEPOLIA_CHAIN_ID = '0xaa36a7';  // 11155111 (16진수)
const SEPOLIA_RPC_URL = 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
const SEPOLIA_CHAIN_NAME = 'Sepolia Test Network';
const SEPOLIA_CURRENCY_SYMBOL = 'ETH';
const SEPOLIA_EXPLORER_URL = 'https://sepolia.etherscan.io';

// 환율 설정 (API에서 가져오지 못할 경우 폴백으로 사용)
// 0.0011 ETH = 2.2 USD 기준으로 계산
// 따라서 1 USD = 0.0005 ETH
const FALLBACK_USD_TO_ETH_RATE = 0.0005;

// CoinGecko API를 사용하여 현재 ETH 가격(USD) 가져오기
async function getCurrentEthPrice() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
    const data = await response.json();
    
    if (data && data.ethereum && data.ethereum.usd) {
      const ethPriceInUSD = data.ethereum.usd;
      console.log(`현재 ETH 가격: ${ethPriceInUSD} USD`);
      
      // 1 USD당 ETH 가격으로 변환 (1/ethPriceInUSD)
      return 1 / ethPriceInUSD;
    }
    
    console.warn('ETH 가격 데이터를 찾을 수 없습니다. 폴백 비율 사용.');
    return FALLBACK_USD_TO_ETH_RATE;
  } catch (error) {
    console.error('ETH 가격 조회 오류:', error);
    console.warn('폴백 비율 사용.');
    return FALLBACK_USD_TO_ETH_RATE;
  }
}

// 현재 네트워크 확인
export async function checkNetwork() {
  try {
    if (!window.ethereum) {
      return {
        success: false,
        message: '메타마스크를 설치해주세요!'
      };
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const { chainId } = await provider.getNetwork();

    return {
      success: true,
      isSepoliaNetwork: chainId.toString() === '11155111',
      currentChainId: chainId.toString()
    };
  } catch (error) {
    console.error('네트워크 확인 오류:', error);
    return {
      success: false,
      message: error.message || '네트워크 확인 중 오류가 발생했습니다.'
    };
  }
}

// Sepolia 네트워크로 전환
export async function switchToSepoliaNetwork() {
  try {
    if (!window.ethereum) {
      return {
        success: false,
        message: '메타마스크를 설치해주세요!'
      };
    }

    try {
      // 메타마스크에 Sepolia 네트워크로 전환 요청
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (switchError) {
      // 네트워크가 메타마스크에 추가되어 있지 않으면 추가
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: SEPOLIA_CHAIN_ID,
              chainName: SEPOLIA_CHAIN_NAME,
              rpcUrls: [SEPOLIA_RPC_URL],
              nativeCurrency: {
                name: 'Sepolia ETH',
                symbol: SEPOLIA_CURRENCY_SYMBOL,
                decimals: 18
              },
              blockExplorerUrls: [SEPOLIA_EXPLORER_URL]
            },
          ],
        });
      } else {
        throw switchError;
      }
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('네트워크 전환 오류:', error);
    return {
      success: false,
      message: error.message || '네트워크 전환 중 오류가 발생했습니다.'
    };
  }
}

// 메타마스크 지갑 연결 상태 확인 (팝업 표시 없음)
export async function checkWalletConnection() {
  try {
    if (!window.ethereum) {
      return {
        success: false,
        connected: false,
        message: '메타마스크를 설치해주세요!'
      };
    }

    // 현재 연결된 계정 확인 (팝업 없음)
    const accounts = await window.ethereum.request({ 
      method: 'eth_accounts' 
    });
    
    if (!accounts || accounts.length === 0) {
      return {
        success: true,
        connected: false
      };
    }
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    
    // 현재 네트워크 확인
    const networkCheck = await checkNetwork();
    
    return {
      success: true,
      connected: true,
      signer,
      address,
      isSepoliaNetwork: networkCheck.success && networkCheck.isSepoliaNetwork,
      currentNetwork: networkCheck.success ? 
        (networkCheck.isSepoliaNetwork ? 'Sepolia' : `다른 네트워크 (Chain ID: ${networkCheck.currentChainId})`) 
        : '알 수 없는 네트워크'
    };
  } catch (error) {
    console.error('지갑 연결 상태 확인 오류:', error);
    return {
      success: false,
      connected: false,
      message: error.message || '지갑 연결 상태 확인 중 오류가 발생했습니다.'
    };
  }
}

// 메타마스크 지갑 연결 요청 (반드시 사용자 상호 작용에 의해 호출되어야 함)
export async function connectWallet() {
  try {
    if (!window.ethereum) {
      return {
        success: false,
        message: '메타마스크를 설치해주세요!'
      };
    }
    
    // 기존 연결 해제를 시도 (메타마스크 API 변경에 따라 작동하지 않을 수 있음)
    try {
      const currentAccounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (currentAccounts && currentAccounts.length > 0) {
        console.log('이미 연결된 계정이 있습니다. 권한 요청을 다시 표시합니다.');
      }
    } catch (e) {
      console.log('계정 확인 실패', e);
    }
    
    // 권한 재요청 - 이미 연결되어 있더라도 항상 팝업 표시
    try {
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      });
      
      // 권한 요청 후 계정 접근
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('지갑 연결이 취소되었거나 계정을 찾을 수 없습니다.');
      }
      
      // provider와 signer 설정
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      // 현재 네트워크 확인
      const networkCheck = await checkNetwork();
      
      return {
        success: true,
        connected: true,
        signer,
        address,
        isSepoliaNetwork: networkCheck.success && networkCheck.isSepoliaNetwork,
        currentNetwork: networkCheck.success ? 
          (networkCheck.isSepoliaNetwork ? 'Sepolia' : `다른 네트워크 (Chain ID: ${networkCheck.currentChainId})`) 
          : '알 수 없는 네트워크'
      };
    } catch (error) {
      console.error('권한 요청 오류:', error);
      
      // 대체 방법으로 시도
      if (window.ethereum.isMetaMask) {
        try {
          // MetaMask 특정 방식 (강제로 연결 팝업 표시)
          await window.ethereum.request({
            method: 'eth_requestAccounts',
            params: [{ force: true }]
          });
          
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          
          // 현재 네트워크 확인
          const networkCheck = await checkNetwork();
          
          return {
            success: true,
            connected: true,
            signer,
            address,
            isSepoliaNetwork: networkCheck.success && networkCheck.isSepoliaNetwork,
            currentNetwork: networkCheck.success ? 
              (networkCheck.isSepoliaNetwork ? 'Sepolia' : `다른 네트워크 (Chain ID: ${networkCheck.currentChainId})`) 
              : '알 수 없는 네트워크'
          };
        } catch (innerError) {
          throw innerError;
        }
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('지갑 연결 오류:', error);
    return {
      success: false,
      connected: false,
      message: error.message || '지갑 연결 중 오류가 발생했습니다.'
    };
  }
}

// USD 가격을 ETH로 변환
async function convertUsdToEth(usdAmount) {
  const rate = await getCurrentEthPrice();
  const ethAmount = usdAmount * rate;
  console.log(`${usdAmount} USD = ${ethAmount} ETH (환율: 1 USD = ${rate} ETH)`);
  return ethAmount;
}

// 서비스 구독 결제
export async function makePayment(signer, serviceId, priceUSD) {
  try {
    if (!signer) {
      throw new Error('지갑이 연결되지 않았습니다.');
    }
    
    // 네트워크 확인
    const networkCheck = await checkNetwork();
    if (!networkCheck.isSepoliaNetwork) {
      return {
        success: false,
        needNetworkSwitch: true,
        message: 'Sepolia 테스트넷으로 전환해주세요.'
      };
    }
    
    // USD 가격을 ETH로 변환 (실시간 환율 사용)
    const ethAmount = await convertUsdToEth(priceUSD);
    const ethPriceInWei = ethers.parseEther(ethAmount.toFixed(18).toString());
    
    // 사용자에게 현재 환율 정보 표시
    console.log(`결제 금액: ${priceUSD} USD (${ethers.formatEther(ethPriceInWei)} ETH)`);
    
    // 컨트랙트 인스턴스 생성
    const contract = new ethers.Contract(
      PaymentContractAddress,
      PaymentContractABI,
      signer
    );
    
    // 결제 트랜잭션 전송
    const tx = await contract.makePayment(serviceId, {
      value: ethPriceInWei
    });
    
    // 트랜잭션 처리 완료 대기
    const receipt = await tx.wait();
    
    return {
      success: true,
      hash: receipt.hash,
      serviceId,
      amount: ethers.formatEther(ethPriceInWei),
      amountUSD: priceUSD
    };
  } catch (error) {
    console.error('결제 오류:', error);
    return {
      success: false,
      message: error.message || '결제 처리 중 오류가 발생했습니다.'
    };
  }
} 