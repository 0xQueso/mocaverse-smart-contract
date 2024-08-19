const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MocaNft", function () {
    let MocaNft, nftStaking, owner, addr1, addr2;
    let tokenId = 1;
    let secondTokenId = 2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        MocaNft = await ethers.getContractFactory("MocaNft");
        nftStaking = await MocaNft.deploy();
        await nftStaking.deployed();
    });

    describe("Mint NFT", function () {
        it("Should allow a user to mint an NFT", async function () {
            await expect(nftStaking.connect(owner).mintNFT(tokenId))
                .to.emit(nftStaking, "NFTMinted")
                .withArgs(owner.address, tokenId);
        });
    });

    describe("Stake NFT", function () {
        it("Should allow a user to stake an NFT", async function () {
            await nftStaking.connect(owner).stakeNFT(tokenId);
            const stake = await nftStaking.stakes(owner.address);
            expect(stake.tokenId).to.equal(tokenId);
            expect(stake.owner).to.equal(owner.address);
        });

        it("Should not allow staking if already staked", async function () {
            await nftStaking.connect(owner).stakeNFT(tokenId);
            await expect(nftStaking.connect(owner).stakeNFT(tokenId))
                .to.be.revertedWith("Already staked");
        });
    });

    describe("Delegate Stake", function () {
        it("Should allow a user to delegate staking to another wallet", async function () {
            await nftStaking.connect(owner).delegateStake(tokenId, addr1.address);
            const stake = await nftStaking.stakes(owner.address);
            expect(stake.tokenId).to.equal(tokenId);
            expect(stake.delegatedWallet).to.equal(addr1.address);
            expect(stake.delegated).to.be.true;
        });

        it("Should not allow delegation if already staked", async function () {
            await nftStaking.connect(owner).delegateStake(tokenId, addr1.address);
            await expect(nftStaking.connect(owner).delegateStake(tokenId, addr1.address))
                .to.be.revertedWith("Already staked");
        });
    });

    describe("Register Email", function () {
        it("Should allow a user to register an email after staking for the minimum stake time", async function () {
            await nftStaking.connect(owner).stakeNFT(tokenId);

            // Fast forward the minimum stake time
            await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine");

            await nftStaking.connect(owner).registerEmail("test@example.com");
            const registeredAddress = await nftStaking.registeredEmails("test@example.com");
            expect(registeredAddress).to.equal(owner.address);
        });

        it("Should not allow registration before the minimum stake time", async function () {
            await nftStaking.connect(owner).stakeNFT(tokenId);

            await expect(nftStaking.connect(owner).registerEmail("test@example.com"))
                .to.be.revertedWith("Staking period not met");
        });

        it("Should allow a user to register an email after staking", async function () {
            await nftStaking.connect(owner).mintNFT(tokenId);
            await nftStaking.connect(owner).stakeNFT(tokenId);
        
            await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine");
        
            await nftStaking.connect(owner).registerEmail("test@example.com");
        
            // Verify registration state
            const registeredAddress = await nftStaking.registeredEmails("test@example.com");
            expect(registeredAddress).to.equal(owner.address);
        });

        it("Should not allow the same email to be registered twice", async function () {
            await nftStaking.connect(owner).mintNFT(tokenId);
            await nftStaking.connect(owner).stakeNFT(tokenId);

            await nftStaking.connect(addr1).mintNFT(secondTokenId);
            await nftStaking.connect(addr1).stakeNFT(secondTokenId);

            await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine");

            await nftStaking.connect(owner).registerEmail("test@example.com");

            // Attempt to register the same email with a different address
            await expect(
                nftStaking.connect(addr1).registerEmail("test@example.com")
            ).to.be.revertedWith("Email already registered");
        });
    });

    describe("Update Minimum Stake Time", function () {
        it("Should allow the owner to update the minimum stake time", async function () {
            const newMinStakeTime = 2 * 7 * 24 * 60 * 60; // 2 weeks
            await nftStaking.updateMinStakeTime(newMinStakeTime);

            expect(await nftStaking.MIN_STAKE_TIME()).to.equal(newMinStakeTime);
        });

        it("Should apply the updated minimum stake time correctly", async function () {
            const newMinStakeTime = 2 * 7 * 24 * 60 * 60; // 2 weeks
            await nftStaking.updateMinStakeTime(newMinStakeTime);

            await nftStaking.connect(owner).stakeNFT(tokenId);

            // Fast forward only 1 week, should still revert
            await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine");

            await expect(nftStaking.connect(owner).registerEmail("test@example.com"))
                .to.be.revertedWith("Staking period not met");

            // Fast forward another week
            await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine");

            await nftStaking.connect(owner).registerEmail("test@example.com");
            const registeredAddress = await nftStaking.registeredEmails("test@example.com");
            expect(registeredAddress).to.equal(owner.address);
        });
    });

    describe("isEmailRegistered", function () {
        it("Should return true if an email is already registered", async function () {
            await nftStaking.connect(owner).mintNFT(tokenId);
            await nftStaking.connect(owner).stakeNFT(tokenId);
    
            await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine");
    
            await nftStaking.connect(owner).registerEmail("test@example.com");
    
            const isRegistered = await nftStaking.isEmailRegistered("test@example.com");
            expect(isRegistered).to.be.true;
        });
    
        it("Should return false if an email is not registered", async function () {
            // Check for an email that hasn't been registered
            const isRegistered = await nftStaking.isEmailRegistered("notregistered@example.com");
            expect(isRegistered).to.be.false;
        });
    });

    describe("Verify Email", function () {
        it("Should return true for the correct wallet and registered email", async function () {
            await nftStaking.connect(owner).stakeNFT(tokenId);

            // Fast forward the minimum stake time
            await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine");

            await nftStaking.connect(owner).registerEmail("test@example.com");
            expect(await nftStaking.connect(owner).verifyEmail("test@example.com")).to.be.true;
        });

        it("Should return false for a wallet that hasn't registered the email", async function () {
            await nftStaking.connect(owner).stakeNFT(tokenId);

            // Fast forward the minimum stake time
            await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine");

            await nftStaking.connect(owner).registerEmail("test@example.com");
            expect(await nftStaking.connect(addr1).verifyEmail("test@example.com")).to.be.false;
        });
    });
});
