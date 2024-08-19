// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";


contract MocaNft {
    struct Stake {
        address owner;
        uint256 tokenId;
        uint256 stakedAt;
        bool delegated;
        address delegatedWallet;
    }

    mapping(address => Stake) public stakes;
    mapping(string => address) public registeredEmails;  // Map emails to wallet addresses
    mapping(address => string) public walletEmails;      // Map wallet addresses to emails

    uint256 public MIN_STAKE_TIME = 1 weeks;  // Minimum staking time

    // Event for logging stake action
    event NFTStaked(address indexed owner, uint256 indexed tokenId, uint256 timestamp);

    // Event for logging email registration
    event EmailRegistered(address indexed owner, string email);

    // Event for logging NFT minting
    event NFTMinted(address indexed owner, uint256 indexed tokenId);

    // Event for updating minimum staking time
    event MinStakeTimeUpdated(uint256 newMinStakeTime);

    // Mint NFT function
    function mintNFT(uint256 tokenId) public {
        emit NFTMinted(msg.sender, tokenId);
    }

    // Stake NFT function
    function stakeNFT(uint256 tokenId) public {
        require(stakes[msg.sender].tokenId == 0, "Already staked");

        stakes[msg.sender] = Stake({
            owner: msg.sender,
            tokenId: tokenId,
            stakedAt: block.timestamp,
            delegated: false,
            delegatedWallet: address(0)
        });

        emit NFTStaked(msg.sender, tokenId, block.timestamp);
    }

    // Delegate staking to another wallet
    function delegateStake(uint256 tokenId, address delegateWallet) public {
        require(stakes[msg.sender].tokenId == 0, "Already staked");

        stakes[msg.sender] = Stake({
            owner: msg.sender,
            tokenId: tokenId,
            stakedAt: block.timestamp,
            delegated: true,
            delegatedWallet: delegateWallet
        });

        emit NFTStaked(delegateWallet, tokenId, block.timestamp);
    }

    // Register email after staking
    function registerEmail(string memory email) public {
        Stake memory stake = stakes[msg.sender];

        require(stake.tokenId != 0, "NFT not staked");
        require(block.timestamp >= stake.stakedAt + MIN_STAKE_TIME, "Staking period not met");
        require(bytes(walletEmails[msg.sender]).length == 0, "Wallet already registered an email");
        require(registeredEmails[email] == address(0), "Email already registered");

        registeredEmails[email] = stake.delegated ? stake.owner : msg.sender;
        walletEmails[msg.sender] = email;

        emit EmailRegistered(msg.sender, email);
    }

    // Verify email ownership
    function verifyEmail(string memory email) public view returns (bool) {
        return registeredEmails[email] == msg.sender;
    }
    
    function isEmailRegistered(string memory email) public view returns (bool) {
        return registeredEmails[email] != address(0);
    }
    
    // Update minimum staking time
    function updateMinStakeTime(uint256 newMinStakeTime) public {
        MIN_STAKE_TIME = newMinStakeTime;
        emit MinStakeTimeUpdated(newMinStakeTime);
    }
}
