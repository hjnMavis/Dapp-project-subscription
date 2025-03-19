// 결제 스마트 컨트랙트 ABI (실제 배포된 컨트랙트의 ABI로 대체해야 합니다)
export const PaymentContractABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "payer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "serviceId",
        "type": "uint256"
      }
    ],
    "name": "PaymentReceived",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "serviceId",
        "type": "uint256"
      }
    ],
    "name": "makePayment",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Sepolia 테스트넷 컨트랙트 주소
// 참고: 이 주소는 예시이므로 실제로 Sepolia 테스트넷에 배포된 컨트랙트 주소로 교체해야 합니다
export const PaymentContractAddress = "0xd8b934580fcE35a11B58C6D73aDeE468a2833fa8"; 