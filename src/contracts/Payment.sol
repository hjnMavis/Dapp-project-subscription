// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Payment {
    address public owner;
    
    event PaymentReceived(address indexed payer, uint256 amount, uint256 serviceId);
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    // 서비스 구독 결제 함수
    function makePayment(uint256 serviceId) external payable {
        require(msg.value > 0, "Payment amount must be greater than 0");
        
        // 결제 이벤트 발생
        emit PaymentReceived(msg.sender, msg.value, serviceId);
    }
    
    // 컨트랙트에 모인 자금 출금 함수
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = owner.call{value: balance}("");
        require(success, "Withdrawal failed");
    }
} 