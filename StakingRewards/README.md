# StakingRewards

This project enables staking and earning rewards from staking ERC20 tokens.

### Setup
### Install dependencies
1. Run "npm install" to install the project dependencies

### Run the test
1. Run "npx hardhat test" for testing. 


### Staking Process
1. Contract Owner/Deployer will mint new ERC20 staking tokens and ERC20 reward tokens.

2. Contract Owner will transfer some ERC20 reward tokens to the StakingRewards contract.

3. Contract Owner will set the duration for the staking rewards, e.g. 1200 seconds.

4. Contract Owner will set the rewards per second e.g. 100 reward tokens per second for the StakingRewards contract.

5. Contract Owner will transfer some ERC20 staking tokens to a User.

6. User will approve the StakingRewards contract.

7. User will stake on the StakingRewards contract.

8. User can withdraw the stake from the contract.

9. User can call and get the rewards from the contract.