# MocaNFT

Deployed and verified on Sepolia Testnet
MocaNFT contract: https://sepolia.etherscan.io/address/0x4129f441C0F7cB6bc8a75E703467D9Fe6d4cc0DB#code

## Running test
After installing dependencies, you can run:

```bash
npx hardhat test
```

## Design consideration
Used Sepolia testnet as its widely supported at the time of development, also used Hardhat and Chai for solidity compilation and testing. 

Tested mostly the solution by TDD approach.

I combined NFT Staking and Email Registration, with this it provides a streamlined way to associate email addresses with NFT ownership. This could be useful for creating a reputation system, linking real-world identities with digital assets, or enabling future features dependent on email verification. Also the contract prevents multiple wallets from registering the same email and avoids an email being associated with multiple wallets. This is achieved through the checks in registerEmail and the mappings registeredEmails and walletEmails.

Effective emitting of events for important actions like staking, email registration, and minting. This helps in tracking activities on the blockchain, which can be useful for both users and external applications interacting with the contract.


## What would I improve if I have the time
Would make the NFT minting in another contract and have separate contracts per each major functionalities, have full utilization with frontend (https://mocaversedapp-cjbn.vercel.app/).