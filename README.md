# ERC-20 Token Launcher Kit

## Project Overview

The **ERC-20 Token Launcher Kit** is a comprehensive smart contract suite designed to facilitate token creation, staking, vesting, and whitelisting functionalities. It enables users to launch and manage ERC-20 tokens efficiently while incorporating staking and vesting mechanisms for token distribution.

This project includes the following smart contracts:

- **Primary Token** (ERC-20 standard token)
- **Secondary Token** (Used for staking and vesting)
- **Staking Contract** (Allows users to stake tokens and earn rewards)
- **Open Vesting Contract** (Enables users to vest and claim tokens over time)
- **Whitelisted Vesting Contract** (Restricts vesting to whitelisted users)

## Deployed Contract Addresses

- **Primary Token Address:** `0x91375cd421D59B7EBA0df405Aef102e0C4D26CdF`
- **Secondary Token Address:** `0xf0E780208494a929ddDb18Dda8957221c8B1E470`
- **Staking Contract Address:** `0xB1806fb88c0A1C48cE51795410a09977B771ce3D`
- **Open Vesting Contract Address:** `0xced43ff69e982166eAEE66Bad6eF96B664f5806E`
- **Whitelisted Vesting Contract Address:** `0x20Ada9EDEf6143e3C6deC086686C685976364C9a`

---

## Smart Contract Descriptions

### 1️⃣ Primary Token Contract

The **Primary Token Contract** is a standard ERC-20 token contract that includes additional security mechanisms.

#### **Test Cases:**

1. **Deployment correctness** - Ensures the contract deploys successfully.
2. **Initial supply assignment** - Checks if the initial supply is correctly assigned to the deployer.
3. **Token transfers** - Tests token transfers between users.
4. **Transfer restrictions (zero address)** - Prevents transfers to the zero address.
5. **Approval and TransferFrom** - Verifies that token approvals and delegated transfers work correctly.
6. **Unauthorized transfer prevention** - Ensures that only approved transfers take place.
7. **Ownership transfer functionality** - Tests owner transfer capabilities if applicable.

### 2️⃣ Secondary Token Contract

The **Secondary Token Contract** extends ERC-20 functionality and interacts with staking and vesting contracts.

#### **Test Cases:**

1. **Correct deployment parameters** - Verifies contract name, symbol, and decimals.
2. **Token transfers** - Ensures tokens can be transferred successfully.
3. **Prevent transfers to zero address** - Tests that sending tokens to a zero address is restricted.
4. **Token approvals** - Ensures users can approve others to spend their tokens.
5. **Transfer using approvals** - Tests the use of `approve` and `transferFrom`.
6. **Insufficient allowance behavior** - Ensures transfers fail if allowance is insufficient.

### 3️⃣ Open Vesting Contract

The **Open Vesting Contract** allows users to purchase and claim tokens over a vesting period.

#### **Test Cases:**

1. **Purchase tokens with secondary tokens** - Tests purchasing tokens and setting up vesting.
2. **Partial claims during vesting** - Ensures users can claim vested tokens progressively.
3. **Full claim after vesting** - Tests full token claims after the vesting period ends.
4. *(Commented Out)* **Prevent multiple vesting schedules per user**.
5. *(Commented Out)* **Prevent double-claiming of tokens**.

### 4️⃣ Whitelisted Vesting Contract

This contract restricts token vesting to whitelisted users only.

#### **Test Cases:**

1. **Progressive token claiming** - Tests claiming vested tokens over time.
2. **Full claim after vesting** - Ensures full claim of vested tokens post-vesting period.
3. **Prevent multiple claims** - Ensures users cannot claim more than allocated.
4. **Restrict non-whitelisted users from purchasing** - Tests whitelist functionality.
5. **Duplicate prevention for claiming** - Ensures proper claim restrictions.

### 5️⃣ Staking Contract

The **Staking Contract** allows users to stake primary tokens and earn rewards in secondary tokens.

#### **Test Cases:**

1. **Allow staking tokens** - Ensures users can stake tokens.
2. **Prevent staking zero tokens** - Restricts zero-value staking.
3. **Prevent unstaking when no tokens are staked** - Ensures users cannot unstake without deposits.
4. **Allow withdrawing staked tokens** - Tests successful unstaking.
5. **Calculate rewards over time** - Ensures correct reward calculation.
6. **Prevent claiming when no rewards are available** - Restricts unnecessary claims.
7. **Handle multiple stakers correctly** - Ensures fairness in staking.
8. **Revert on duplicate unstake attempts** - Prevents users from unstaking multiple times.

---

## 📺 Video Demonstrations

Here are links to videos where we walk through the project and test cases:

- **Project testing Overview:** 

  https\://drive.google.com/file/d/1eTH\_TBLqdIRTG2yVytJmvIrnVmr7lRHT/view?usp=drive\_link

## 🚀 Running the Tests

To run all tests, use the following command:

```sh
npx hardhat test
```

Ensure that your `.env` file contains the correct contract addresses before running the tests.

## 🛠 Technologies Used

- Solidity
- Hardhat
- Chai (for testing)
- OpenZeppelin Contracts
- Ethers.js
- Node.js

## 📜 License

This project is licensed under the MIT License.

---

## 🤝 Contributing

Feel free to contribute by submitting issues or pull requests. Let's make token launching more efficient together!

👨‍💻 **Developed by:** Hasan Zaigam

