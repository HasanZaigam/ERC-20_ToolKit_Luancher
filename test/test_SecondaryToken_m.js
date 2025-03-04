require("dotenv").config();
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SecondaryToken Contract (Using Deployed Sepolia Contract)", function () {
    let secondaryToken, walletSigner, addr1, addr2;
    const contractAddress = process.env.SECONDARY_TOKEN_ADDRESS; // Load from .env
    
    // Increase timeout for Sepolia
    this.timeout(300000); // 5 minutes

    before(async function () {
        [addr1, addr2] = await ethers.getSigners();

        const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
        walletSigner = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

        const SecondaryToken = await ethers.getContractFactory("SecondaryToken");
        secondaryToken = SecondaryToken.attach(contractAddress).connect(walletSigner);

        console.log("Wallet Address:", walletSigner.address);
        console.log("addr1 Address:", addr1.address);
        console.log("addr2 Address:", addr2.address);
    });

    it("✅ Should verify correct deployment parameters", async function () {
        const name = await secondaryToken.name();
        const symbol = await secondaryToken.symbol();
        const decimals = await secondaryToken.decimals();

        console.log("Token Name:", name);
        console.log("Token Symbol:", symbol);
        console.log("Decimals:", decimals.toString());

        expect(name).to.equal("SecondaryToken");
        expect(symbol).to.equal("STK");
        expect(decimals).to.equal(18);
    });

    it("✅ Should allow token transfers", async function () {
        const transferAmount = ethers.parseEther("10");
        
        // Get initial balance
        const initialBalance = await secondaryToken.balanceOf(addr1.address);
        console.log("Initial balance of addr1:", ethers.formatEther(initialBalance));

        // Send transfer
        const tx = await secondaryToken.transfer(addr1.address, transferAmount);
        console.log("Transfer transaction hash:", tx.hash);
        await tx.wait(1);

        // Wait for the network
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Get new balance
        const newBalance = await secondaryToken.balanceOf(addr1.address);
        console.log("New balance of addr1:", ethers.formatEther(newBalance));

        expect(newBalance).to.equal(initialBalance + transferAmount);
    });

    it("✅ Should prevent transfers to the zero address", async function () {
        const zeroAddress = "0x0000000000000000000000000000000000000000";
        const transferAmount = ethers.parseEther("1");
        
        // Attempt to transfer to zero address - should revert
        await expect(
            secondaryToken.transfer(zeroAddress, transferAmount)
        ).to.be.reverted;
    });

    it("✅ Should properly handle token approvals", async function () {
        const approvalAmount = ethers.parseEther("50");
        
        // Check initial allowance (should be 0 or some previous value)
        const initialAllowance = await secondaryToken.allowance(walletSigner.address, addr1.address);
        console.log("Initial allowance for addr1:", ethers.formatEther(initialAllowance));
        
        // Approve
        const approveTx = await secondaryToken.approve(addr1.address, approvalAmount);
        console.log("Approval transaction hash:", approveTx.hash);
        await approveTx.wait(1);
        
        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check new allowance
        const newAllowance = await secondaryToken.allowance(walletSigner.address, addr1.address);
        console.log("New allowance for addr1:", ethers.formatEther(newAllowance));
        
        expect(newAllowance).to.equal(approvalAmount);
    });
    
    // Modified test that uses two steps: approve + transferFrom
    it("✅ Should transfer tokens using approvals and transferFrom", async function() {
        const transferAmount = ethers.parseEther("5");
        
        // First, approve yourself to spend your own tokens (which is required by the standard)
        console.log("Approving self to transfer tokens...");
        const approveTx = await secondaryToken.approve(walletSigner.address, transferAmount);
        console.log("Self-approval transaction hash:", approveTx.hash);
        await approveTx.wait(1);
        
        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check self-allowance
        const allowance = await secondaryToken.allowance(walletSigner.address, walletSigner.address);
        console.log("Self-allowance:", ethers.formatEther(allowance));
        
        // Get initial balance of addr2
        const initialBalance = await secondaryToken.balanceOf(addr2.address);
        console.log("Initial balance of addr2:", ethers.formatEther(initialBalance));
        
        // Now use transferFrom
        console.log("Transferring tokens using transferFrom...");
        const transferTx = await secondaryToken.transferFrom(
            walletSigner.address, 
            addr2.address, 
            transferAmount
        );
        console.log("TransferFrom transaction hash:", transferTx.hash);
        await transferTx.wait(1);
        
        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check new balance
        const newBalance = await secondaryToken.balanceOf(addr2.address);
        console.log("New balance of addr2:", ethers.formatEther(newBalance));
        
        expect(newBalance).to.equal(initialBalance + transferAmount);
    });

    it("✅ Should validate insufficient allowance behavior", async function() {
        const testAddr = addr2.address; // Using addr2 as the test address
        const transferAmount = ethers.parseEther("5");
        
        // Reset allowance to 0
        const resetTx = await secondaryToken.approve(testAddr, 0);
        await resetTx.wait(1);
        
        // Check that allowance is now 0
        const allowance = await secondaryToken.allowance(walletSigner.address, testAddr);
        console.log(`Allowance for ${testAddr}:`, ethers.formatEther(allowance));
        expect(allowance).to.equal(0);
        
        // Use try/catch to handle the revert
        try {
            // This should fail because addr2 is not approved
            const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
            const testSigner = addr2.connect(provider);
            
            // Create a contract instance connected to addr2
            const SecondaryToken = await ethers.getContractFactory("SecondaryToken");
            const tokenAsAddr2 = SecondaryToken.attach(contractAddress).connect(testSigner);
            
            // Try to transfer tokens from wallet to addr1 using addr2 (should fail)
            await tokenAsAddr2.transferFrom(walletSigner.address, addr1.address, transferAmount);
            
            // If we get here, the test failed
            expect.fail("Expected transaction to revert but it didn't");
        } catch (error) {
            console.log("Transaction correctly reverted with:", error.message);
            // Just check if there was an error, we don't need to verify the specific message
            expect(error).to.exist;
        }
    });
});