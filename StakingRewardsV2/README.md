# StakingRewardsV2
This project enables staking and earning ERC20 tokens.

### Setup
### Install dependencies
1. Run "npm install" to install the project dependencies

### Run the test
1. Run "npx hardhat test" for testing. 


### Staking Process
1. Contract Owner/Deployer will mint new ERC20 staking tokens.

2. Contract Owner will transfer some ERC20 staking tokens to a User.

3. Contract Owner will transfer some ERC20 staking tokens to the Staking contract as reward payment for staking.

4. User will approve the Staking contract.

5. User can stake on the Staking contract for a 14-day or 1-month staked period.

6. User can later unstake and obtain the staked tokens including staked token rewards, when the time exceeds the released date for the staked period. The rewards are based on the corresponding APR(90%, 120%) for each staked period(14 days, 30 days).

7. There is a minimum required staking amount(2000 tokens).

8. There is a pool limit (20,000,000 tokens) for each 14-day and 1-month pool over which the contract will not allow staking for that pool.


