const { time, loadFixture,} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("Staking", function () {
  
  async function deployStakingFixture() {

    const stakingToken = await ethers.getContractFactory('ERC20');
    const stakingTokenContract = await stakingToken.deploy('Staking Token', 'ST', 18);
    // console.log(`stakingTokenContract.target = ${stakingTokenContract.target}`)


    const stakingRewards = await ethers.getContractFactory('Staking');
    const stakingRewardsContract = await stakingRewards.deploy(
                                      stakingTokenContract.target);
    // console.log(`stakingRewardsContract.target = ${stakingRewardsContract.target}`)

    const [deployer, user] = await ethers.getSigners();

    const STContractDecimals_bn = await stakingTokenContract.decimals()

    // console.log("STContractDecimals_bn = ", STContractDecimals_bn)

    //-------------------

    const mint_ST_deployer_tx_response = await stakingTokenContract.connect(deployer)
                                        .mint( ethers.parseUnits("1000000000", 
                                              STContractDecimals_bn) )

    // console.log("mint_ST_deployer_tx_response.hash = ", mint_ST_deployer_tx_response.hash)


    const STdeployer0_balance_bn = await stakingTokenContract.balanceOf(deployer.address)
    const STdeployer0_balance = ethers.formatUnits(STdeployer0_balance_bn, STContractDecimals_bn)
    console.log("STdeployer0_balance = ", STdeployer0_balance)
    // STdeployer0_balance =  1000000000.0

    //-------------------

    const transfer_ST_deployer_to_SRC_tx_response = await stakingTokenContract.connect(deployer)
                                        .transfer( 
                                          stakingRewardsContract.target,
                                           ethers.parseUnits("100", 
                                              STContractDecimals_bn) 
                                             )

    // console.log("transfer_ST_deployer_to_SRC_tx_response.hash = ", transfer_ST_deployer_to_SRC_tx_response.hash)

    const STdeployer1_balance_bn = await stakingTokenContract.balanceOf(deployer.address)
    const STdeployer1_balance = ethers.formatUnits(STdeployer1_balance_bn, STContractDecimals_bn)
    console.log("STdeployer1_balance = ", STdeployer1_balance)
    // STdeployer1_balance =  999999900.0


    const ST_SRC0_balance_bn = await stakingTokenContract.balanceOf(stakingRewardsContract.target)
    const ST_SRC0_balance = ethers.formatUnits(ST_SRC0_balance_bn, STContractDecimals_bn)
    console.log("ST_SRC0_balance = ", ST_SRC0_balance)
    // ST_SRC0_balance =  100.0

    const transfer_ST_deployer_to_user_tx_response = await stakingTokenContract.connect(deployer)
                                        .transfer( 
                                          user.address,
                                          ethers.parseUnits((1*10**6).toString(), 
                                              STContractDecimals_bn) 
                                             )

    // console.log("transfer_ST_deployer_to_user_tx_response.hash = ", transfer_ST_deployer_to_user_tx_response.hash)

    const STdeployer1B_balance_bn = await stakingTokenContract.balanceOf(deployer.address)
    const STdeployer1B_balance = ethers.formatUnits(STdeployer1B_balance_bn, STContractDecimals_bn)
    console.log("STdeployer1B_balance = ", STdeployer1B_balance)
    // STdeployer1B_balance =  998999900.0 


    const ST_user0_balance_bn = await stakingTokenContract.balanceOf(user.address)
    const ST_user0_balance = ethers.formatUnits(ST_user0_balance_bn, STContractDecimals_bn)
    console.log("ST_user0_balance = ", ST_user0_balance)
    // ST_user0_balance =  1*10**6.0


    return { deployer, user, stakingTokenContract, 
            stakingRewardsContract,
            STContractDecimals_bn};

  }

  describe("Stake", function () {
    
    
    it("should validate stake amount", async function () {
      const { user, deployer, stakingTokenContract,
          stakingRewardsContract, STContractDecimals_bn
            } = await loadFixture(deployStakingFixture);

      // User  staking token approve staking reward contract

      const userTokenBalance = await stakingTokenContract.balanceOf(user.address);

      const approve_user_to_SRC_tx_response = await stakingTokenContract.connect(user)
                                        .approve( 
                                          stakingRewardsContract.target,
                                          userTokenBalance)
                                          // ethers.parseUnits(
                                          //   (1*10**6).toString(), 
                                          //     STContractDecimals_bn)

      // console.log("approve_user_to_SRC_tx_response.hash = ", approve_user_to_SRC_tx_response.hash)

      const ST_SRC0_allowance_bn = await stakingTokenContract.allowance(user.address, stakingRewardsContract.target)
      const ST_SRC0_allowance = ethers.formatUnits(ST_SRC0_allowance_bn, STContractDecimals_bn)
      // console.log("ST_SRC0_allowance = ", ST_SRC0_allowance)

      await expect(stakingRewardsContract.connect(user)
                                        .twoWeekStake( 
                                          ethers.parseUnits((300).toString(), 
                                              STContractDecimals_bn) 
                                             )).to.be.revertedWith('Stake amount invalid')

      await expect(stakingRewardsContract.connect(user)
                                        .oneMonthStake( 
                                          ethers.parseUnits((300).toString(), 
                                              STContractDecimals_bn) 
                                             )).to.be.revertedWith('Stake amount invalid')

    });

    it("should reach pool limit", async function () {
      const { user, deployer, stakingTokenContract,
        stakingRewardsContract, STContractDecimals_bn
          } = await loadFixture(deployStakingFixture);

      // User  staking token approve staking reward contract

      const userTokenBalance = await stakingTokenContract.balanceOf(user.address);

      const approve_user_to_SRC_tx_response = await stakingTokenContract.connect(user)
                                        .approve( 
                                          stakingRewardsContract.target,
                                          userTokenBalance)
                                          // ethers.parseUnits(
                                          //   (1*10**6).toString(), 
                                          //     STContractDecimals_bn)
                                             

      // console.log("approve_user_to_SRC_tx_response.hash = ", approve_user_to_SRC_tx_response.hash)

      const ST_SRC0_allowance_bn = await stakingTokenContract.allowance(user.address, stakingRewardsContract.target)
      const ST_SRC0_allowance = ethers.formatUnits(ST_SRC0_allowance_bn, STContractDecimals_bn)
      // console.log("ST_SRC0_allowance = ", ST_SRC0_allowance)

      await expect(stakingRewardsContract.connect(user)
                                        .twoWeekStake( 
                                          ethers.parseUnits((21*10**6).toString(), 
                                              STContractDecimals_bn) 
                                             )).to.be.revertedWith('Two week pool limit reached')

      await expect(stakingRewardsContract.connect(user)
                                        .oneMonthStake( 
                                          ethers.parseUnits((21*10**6).toString(), 
                                              STContractDecimals_bn) 
                                             )).to.be.revertedWith('One month pool limit reached')
    });


    it("should exceed balance", async function () {
      const { user, deployer, stakingTokenContract,
        stakingRewardsContract, STContractDecimals_bn
          } = await loadFixture(deployStakingFixture);

      // User  staking token approve staking reward contract

      const userTokenBalance = await stakingTokenContract.balanceOf(user.address);

      const approve_user_to_SRC_tx_response = await stakingTokenContract.connect(user)
                                        .approve( 
                                          stakingRewardsContract.target,
                                          userTokenBalance)
                                          // ethers.parseUnits(
                                          //   (1*10**6).toString(), 
                                          //     STContractDecimals_bn)

      // console.log("approve_user_to_SRC_tx_response.hash = ", approve_user_to_SRC_tx_response.hash)

      const ST_SRC0_allowance_bn = await stakingTokenContract.allowance(user.address, stakingRewardsContract.target)
      const ST_SRC0_allowance = ethers.formatUnits(ST_SRC0_allowance_bn, STContractDecimals_bn)
      // console.log("ST_SRC0_allowance = ", ST_SRC0_allowance)

      await expect(stakingRewardsContract.connect(user)
                                        .twoWeekStake( 
                                          ethers.parseUnits((2*10**6).toString(), 
                                              STContractDecimals_bn) 
                                             )).to.be.revertedWith('Insufficient balance')

      await expect(stakingRewardsContract.connect(user)
                                        .oneMonthStake( 
                                          ethers.parseUnits((2*10**6).toString(), 
                                              STContractDecimals_bn) 
                                             )).to.be.revertedWith('Insufficient balance')
  
    });


    it("should stake 2 weeks", async function () {
      const { user, deployer, stakingTokenContract,
        stakingRewardsContract, STContractDecimals_bn
          } = await loadFixture(deployStakingFixture);

      // User  staking token approve staking reward contract

      const userTokenBalance = await stakingTokenContract.balanceOf(user.address);

      const approve_user_to_SRC_tx_response = await stakingTokenContract.connect(user)
                                        .approve( 
                                          stakingRewardsContract.target,
                                          userTokenBalance)
                                          // ethers.parseUnits(
                                          //   (1*10**6).toString(), 
                                          //     STContractDecimals_bn)

      // console.log("approve_user_to_SRC_tx_response.hash = ", approve_user_to_SRC_tx_response.hash)

      const ST_SRC0_allowance_bn = await stakingTokenContract.allowance(user.address, stakingRewardsContract.target)
      const ST_SRC0_allowance = ethers.formatUnits(ST_SRC0_allowance_bn, STContractDecimals_bn)
      // console.log("ST_SRC0_allowance = ", ST_SRC0_allowance)

      const stakingRewardsContractBalanceBefore = await stakingTokenContract.balanceOf(stakingRewardsContract.target);

      // stake two times
      await stakingRewardsContract.connect(user)
                                        .twoWeekStake( 
                                          ethers.parseUnits((500*10**3).toString(), 
                                              STContractDecimals_bn) 
                                             )

      await stakingRewardsContract.connect(user)
                                        .twoWeekStake( 
                                          ethers.parseUnits((500*10**3).toString(), 
                                              STContractDecimals_bn) 
                                            );
                                             

      expect(await stakingRewardsContract.getStakeCount(user.address
                                                  )).to.be.equal(BigInt(2))

      expect(await stakingRewardsContract.totalStakeByAddress(user.address
                                                  )).to.be.equal(
                                                ethers.parseUnits((1*10**6).toString(), 
                                                STContractDecimals_bn) 
                                                  )

      const stakingRewardsContractBalanceAfter = await stakingTokenContract.balanceOf(stakingRewardsContract.target);

      expect((BigInt(stakingRewardsContractBalanceAfter)-BigInt(stakingRewardsContractBalanceBefore))).to.be.equal(ethers.parseUnits((1*10**6).toString(), 
                                                                                                                        STContractDecimals_bn) );

      console.log("ethers.parseUnits((1*10**6).toString(), STContractDecimals_bn) = ", ethers.parseUnits((1*10**6).toString(), STContractDecimals_bn))
      
    });


    it("should stake one month", async function () {
      const { user, deployer, stakingTokenContract,
        stakingRewardsContract, STContractDecimals_bn
          } = await loadFixture(deployStakingFixture);

      // User  staking token approve staking reward contract

      const userTokenBalance = await stakingTokenContract.balanceOf(user.address);

      const approve_user_to_SRC_tx_response = await stakingTokenContract.connect(user)
                                        .approve( 
                                          stakingRewardsContract.target,
                                          userTokenBalance)
                                          // ethers.parseUnits(
                                          //   (1*10**6).toString(), 
                                          //     STContractDecimals_bn)

      // console.log("approve_user_to_SRC_tx_response.hash = ", approve_user_to_SRC_tx_response.hash)

      const ST_SRC0_allowance_bn = await stakingTokenContract.allowance(user.address, stakingRewardsContract.target)
      const ST_SRC0_allowance = ethers.formatUnits(ST_SRC0_allowance_bn, STContractDecimals_bn)
      // console.log("ST_SRC0_allowance = ", ST_SRC0_allowance)

      const stakingRewardsContractBalanceBefore = await stakingTokenContract.balanceOf(stakingRewardsContract.target);

      // stake two times
      await stakingRewardsContract.connect(user)
                                        .oneMonthStake( 
                                          ethers.parseUnits((500*10**3).toString(), 
                                              STContractDecimals_bn) 
                                             )

      await stakingRewardsContract.connect(user)
                                        .oneMonthStake( 
                                          ethers.parseUnits((500*10**3).toString(), 
                                              STContractDecimals_bn) 
                                            );
                                             
      expect(await stakingRewardsContract.getStakeCount(user.address
                                                  )).to.be.equal(BigInt(2))

      expect(await stakingRewardsContract.totalStakeByAddress(user.address
                                                  )).to.be.equal(
                                                ethers.parseUnits((1*10**6).toString(), 
                                                STContractDecimals_bn) 
                                                  )

      const stakingRewardsContractBalanceAfter = await stakingTokenContract.balanceOf(stakingRewardsContract.target);

      expect((BigInt(stakingRewardsContractBalanceAfter)-BigInt(stakingRewardsContractBalanceBefore))).to.be.equal(ethers.parseUnits((1*10**6).toString(), 
                                                                                                                        STContractDecimals_bn) );

      console.log("ethers.parseUnits((1*10**6).toString(), STContractDecimals_bn) = ", ethers.parseUnits((1*10**6).toString(), STContractDecimals_bn))
      
    });


    it("should unstake fail before release date", async function () {
      const { user, deployer, stakingTokenContract,
        stakingRewardsContract, STContractDecimals_bn
          } = await loadFixture(deployStakingFixture);

      // User  staking token approve staking reward contract

      const userTokenBalance = await stakingTokenContract.balanceOf(user.address);

      const approve_user_to_SRC_tx_response = await stakingTokenContract.connect(user)
                                        .approve( 
                                          stakingRewardsContract.target,
                                          userTokenBalance)
                                          // ethers.parseUnits(
                                          //   (1*10**6).toString(), 
                                          //     STContractDecimals_bn)

      // console.log("approve_user_to_SRC_tx_response.hash = ", approve_user_to_SRC_tx_response.hash)

      const ST_SRC0_allowance_bn = await stakingTokenContract.allowance(user.address, stakingRewardsContract.target)
      const ST_SRC0_allowance = ethers.formatUnits(ST_SRC0_allowance_bn, STContractDecimals_bn)
      // console.log("ST_SRC0_allowance = ", ST_SRC0_allowance)

      const stakingRewardsContractBalanceBefore = await stakingTokenContract.balanceOf(stakingRewardsContract.target);

      // stake two times
      await stakingRewardsContract.connect(user)
                                        .twoWeekStake( 
                                          ethers.parseUnits((500*10**3).toString(), 
                                              STContractDecimals_bn) 
                                             )

      await stakingRewardsContract.connect(user)
                                        .oneMonthStake( 
                                          ethers.parseUnits((500*10**3).toString(), 
                                              STContractDecimals_bn) 
                                            );
                                             
      await expect(stakingRewardsContract.connect(user).unStake(BigInt(10))).to.be.revertedWith('Index out of bounds')

      await expect(stakingRewardsContract.connect(user).unStake(BigInt(0))).to.be.revertedWith('You cannot unstake before release date')

      // time travel to 15 days later
      await ethers.provider.send('evm_increaseTime', [15*24*60*60]);
      await ethers.provider.send('evm_mine', []);

      // unstake 2 week success
      await stakingRewardsContract.connect(user).unStake(BigInt(0))
        
      // unstake one month false
      await expect(stakingRewardsContract.connect(user).unStake(BigInt(1))).to.be.revertedWith('You cannot unstake before release date')

    });

    it("should unstake 1 time only", async function () {
      const { user, deployer, stakingTokenContract,
        stakingRewardsContract, STContractDecimals_bn
          } = await loadFixture(deployStakingFixture);

      // User  staking token approve staking reward contract

      const userTokenBalance = await stakingTokenContract.balanceOf(user.address);

      const approve_user_to_SRC_tx_response = await stakingTokenContract.connect(user)
                                        .approve( 
                                          stakingRewardsContract.target,
                                          userTokenBalance)
                                          // ethers.parseUnits(
                                          //   (1*10**6).toString(), 
                                          //     STContractDecimals_bn)

      // console.log("approve_user_to_SRC_tx_response.hash = ", approve_user_to_SRC_tx_response.hash)

      const ST_SRC0_allowance_bn = await stakingTokenContract.allowance(user.address, stakingRewardsContract.target)
      const ST_SRC0_allowance = ethers.formatUnits(ST_SRC0_allowance_bn, STContractDecimals_bn)
      // console.log("ST_SRC0_allowance = ", ST_SRC0_allowance)

      const stakingRewardsContractBalanceBefore = await stakingTokenContract.balanceOf(stakingRewardsContract.target);

      // stake two times
      await stakingRewardsContract.connect(user)
                                        .twoWeekStake( 
                                          ethers.parseUnits((500*10**3).toString(), 
                                              STContractDecimals_bn) 
                                             )

      await stakingRewardsContract.connect(user)
                                        .oneMonthStake( 
                                          ethers.parseUnits((500*10**3).toString(), 
                                              STContractDecimals_bn) 
                                            );
                                             
      await expect(stakingRewardsContract.connect(user).unStake(BigInt(10))).to.be.revertedWith('Index out of bounds')

      await expect(stakingRewardsContract.connect(user).unStake(BigInt(0))).to.be.revertedWith('You cannot unstake before release date')

      // time travel to 15 days later
      await ethers.provider.send('evm_increaseTime', [15*24*60*60]);
      await ethers.provider.send('evm_mine', []);

      // unstake 2 week success
      await stakingRewardsContract.connect(user).unStake(BigInt(0))
        
      // false because unstake 2 times
      await expect(stakingRewardsContract.connect(user).unStake(BigInt(0))).to.be.revertedWith('Stake has already been released')

    });

    it("should exceed contract balance", async function () {
      const { user, deployer, stakingTokenContract,
        stakingRewardsContract, STContractDecimals_bn
          } = await loadFixture(deployStakingFixture);

      // User  staking token approve staking reward contract

      const userTokenBalance = await stakingTokenContract.balanceOf(user.address);

      const approve_user_to_SRC_tx_response = await stakingTokenContract.connect(user)
                                        .approve( 
                                          stakingRewardsContract.target,
                                          userTokenBalance)
                                          // ethers.parseUnits(
                                          //   (1*10**6).toString(), 
                                          //     STContractDecimals_bn)

      // console.log("approve_user_to_SRC_tx_response.hash = ", approve_user_to_SRC_tx_response.hash)

      const ST_SRC0_allowance_bn = await stakingTokenContract.allowance(user.address, stakingRewardsContract.target)
      const ST_SRC0_allowance = ethers.formatUnits(ST_SRC0_allowance_bn, STContractDecimals_bn)
      // console.log("ST_SRC0_allowance = ", ST_SRC0_allowance)

      const stakingRewardsContractBalanceBefore = await stakingTokenContract.balanceOf(stakingRewardsContract.target);

      // stake two times
      await stakingRewardsContract.connect(user)
                                        .twoWeekStake( 
                                          ethers.parseUnits((500*10**3).toString(), 
                                              STContractDecimals_bn) 
                                             )

      await stakingRewardsContract.connect(user)
                                        .twoWeekStake( 
                                          ethers.parseUnits((500*10**3).toString(), 
                                              STContractDecimals_bn) 
                                            );
                                             

      
      await expect(stakingRewardsContract.connect(user).unStake(BigInt(10))).to.be.revertedWith('Index out of bounds')

      await expect(stakingRewardsContract.connect(user).unStake(BigInt(0))).to.be.revertedWith('You cannot unstake before release date')

      // time travel to 15 days later
      await ethers.provider.send('evm_increaseTime', [15*24*60*60]);
      await ethers.provider.send('evm_mine', []);

      // unstake 2 week success
      await stakingRewardsContract.connect(user).unStake(BigInt(0))

      /// false because bank don't have enough token
      await expect(stakingRewardsContract.connect(user).unStake(BigInt(1))).to.be.revertedWith("Insufficient balance")

      const stakingRewardsContractBalanceAfter = await stakingTokenContract.balanceOf(stakingRewardsContract.target);

      expect(parseFloat(ethers.formatUnits((BigInt(stakingRewardsContractBalanceAfter)-BigInt(stakingRewardsContractBalanceBefore)), 
          STContractDecimals_bn)).toFixed(6)).to.be.equal((parseFloat((500*10**3-14*(500*10**3)*0.9/365).toFixed(18))).toFixed(6));

          console.log("(parseFloat((500*10**3-14*(500*10**3)*0.9/365).toFixed(18))).toFixed(6) = ", (parseFloat((500*10**3-14*(500*10**3)*0.9/365).toFixed(18))).toFixed(6))

          // AssertionError: expected '482739.726027397260273973' to equal '482739.726027397264260799'
          // + expected - actual
    
          // -482739.726027397260273973
          // +482739.726027397264260799

    });


    it("should get stake history", async function () {
      const { user, deployer, stakingTokenContract,
        stakingRewardsContract, STContractDecimals_bn
          } = await loadFixture(deployStakingFixture);

      const transfer_ST_deployer_to_user_tx_response = await stakingTokenContract.connect(deployer)
                                        .transfer( 
                                          user.address,
                                          ethers.parseUnits((1*10**6).toString(), 
                                              STContractDecimals_bn) 
                                             )

      // User staking token approve staking reward contract

      const userTokenBalance = await stakingTokenContract.balanceOf(user.address);

      const approve_user_to_SRC_tx_response = await stakingTokenContract.connect(user)
                                        .approve( 
                                          stakingRewardsContract.target,
                                          userTokenBalance)
                                          // ethers.parseUnits(
                                          //   (1*10**6).toString(), 
                                          //     STContractDecimals_bn)

      // console.log("approve_user_to_SRC_tx_response.hash = ", approve_user_to_SRC_tx_response.hash)

      const ST_SRC0_allowance_bn = await stakingTokenContract.allowance(user.address, stakingRewardsContract.target)
      const ST_SRC0_allowance = ethers.formatUnits(ST_SRC0_allowance_bn, STContractDecimals_bn)
      // console.log("ST_SRC0_allowance = ", ST_SRC0_allowance)

      const stakingRewardsContractBalanceBefore = await stakingTokenContract.balanceOf(stakingRewardsContract.target);

      await stakingRewardsContract.connect(user)
                                        .twoWeekStake( 
                                          ethers.parseUnits((500*10**3).toString(), 
                                              STContractDecimals_bn) 
                                             )

      await stakingRewardsContract.connect(user)
                                        .twoWeekStake( 
                                          ethers.parseUnits((500*10**3).toString(), 
                                              STContractDecimals_bn) 
                                            );

      await stakingRewardsContract.connect(user)
                                            .oneMonthStake( 
                                              ethers.parseUnits((500*10**3).toString(), 
                                                  STContractDecimals_bn) 
                                                 )
    
      await stakingRewardsContract.connect(user)
                                            .oneMonthStake( 
                                              ethers.parseUnits((500*10**3).toString(), 
                                                  STContractDecimals_bn) 
                                                );

      const stakeHistory = await stakingRewardsContract.getStakerInfo(user.address,BigInt(0),BigInt(3));
      
      console.log("stakeHistory = ", stakeHistory)
      console.log("stakeHistory[0] = ", stakeHistory[0])
      console.log("stakeHistory[1] = ", stakeHistory[1])
      console.log("stakeHistory[2] = ", stakeHistory[2])
      console.log("stakeHistory[3] = ", stakeHistory[3])
      console.log("stakeHistory[0][0] = ", stakeHistory[0][0])
      console.log("stakeHistory[1][0] = ", stakeHistory[1][0])
      console.log("stakeHistory[2][0] = ", stakeHistory[2][0])
      console.log("stakeHistory[3][0] = ", stakeHistory[3][0])
      console.log("stakeHistory.length = ", stakeHistory.length)
      
      const stakeHistoryArray = [];
      let amount;
      let releaseDate;
      let isRelease;
      let rewardDebt;
      let termOption;

      for(let i=0; i<stakeHistory.length; i++){
          amount = stakeHistory[i][0];
          releaseDate = stakeHistory[i][1];
          isRelease = stakeHistory[i][2];
          rewardDebt = stakeHistory[i][3]
          termOption = stakeHistory[i][4]
      
          stakeHistoryArray.push([amount, releaseDate, isRelease, rewardDebt, termOption])

          expect(BigInt(stakeHistory[i][0])).to.be.equal(
                                          ethers.parseUnits((500*10**3).toString(), 
                                        STContractDecimals_bn) 
                                      );
        }

    });

    it("should count stake", async function () {
      const { user, deployer, stakingTokenContract,
        stakingRewardsContract, STContractDecimals_bn
          } = await loadFixture(deployStakingFixture);

      const transfer_ST_deployer_to_user_tx_response = await stakingTokenContract.connect(deployer)
                                        .transfer( 
                                          user.address,
                                          ethers.parseUnits((3*10**6).toString(), 
                                              STContractDecimals_bn) 
                                             )

      // User staking token approve staking reward contract

      const userTokenBalance = await stakingTokenContract.balanceOf(user.address);

      const approve_user_to_SRC_tx_response = await stakingTokenContract.connect(user)
                                        .approve( 
                                          stakingRewardsContract.target,
                                          userTokenBalance)
                                          // ethers.parseUnits(
                                          //   (1*10**6).toString(), 
                                          //     STContractDecimals_bn)

      // console.log("approve_user_to_SRC_tx_response.hash = ", approve_user_to_SRC_tx_response.hash)

      const ST_SRC0_allowance_bn = await stakingTokenContract.allowance(user.address, stakingRewardsContract.target)
      const ST_SRC0_allowance = ethers.formatUnits(ST_SRC0_allowance_bn, STContractDecimals_bn)
      // console.log("ST_SRC0_allowance = ", ST_SRC0_allowance)

      const stakingRewardsContractBalanceBefore = await stakingTokenContract.balanceOf(stakingRewardsContract.target);

      await stakingRewardsContract.connect(user)
                                        .twoWeekStake( 
                                          ethers.parseUnits((500*10**3).toString(), 
                                              STContractDecimals_bn) 
                                             )

      await stakingRewardsContract.connect(user)
                                        .twoWeekStake( 
                                          ethers.parseUnits((500*10**3).toString(), 
                                              STContractDecimals_bn) 
                                            );

      await stakingRewardsContract.connect(user)
                                            .twoWeekStake( 
                                              ethers.parseUnits((500*10**3).toString(), 
                                                  STContractDecimals_bn) 
                                                );

      await stakingRewardsContract.connect(user)
                                        .twoWeekStake( 
                                          ethers.parseUnits((500*10**3).toString(), 
                                              STContractDecimals_bn) 
                                            );

      await stakingRewardsContract.connect(user)
                                        .twoWeekStake( 
                                          ethers.parseUnits((500*10**3).toString(), 
                                              STContractDecimals_bn) 
                                            );

      await stakingRewardsContract.connect(user)
                                        .twoWeekStake( 
                                          ethers.parseUnits((500*10**3).toString(), 
                                              STContractDecimals_bn) 
                                            );

      await stakingRewardsContract.connect(user)
                                            .oneMonthStake( 
                                              ethers.parseUnits((500*10**3).toString(), 
                                                  STContractDecimals_bn) 
                                                 )
    
      await stakingRewardsContract.connect(user)
                                            .oneMonthStake( 
                                              ethers.parseUnits((500*10**3).toString(), 
                                                  STContractDecimals_bn) 
                                                );

      
      expect(await stakingRewardsContract.getStakeCount(user.address)).to.be.equal(8);
                                      
      expect(await stakingRewardsContract.totalStakeByAddress(user.address)).to.be.equal(
                                        ethers.parseUnits((8*500*10**3).toString(), 
                                      STContractDecimals_bn) 
                                    );

      expect(await stakingRewardsContract.totalStakerInfoByTermOption(user.address, BigInt(14))).to.be.equal(6);

      expect(await stakingRewardsContract.totalStakerInfoByTermOption(user.address, BigInt(30))).to.be.equal(2);

      // time travel to 15 days later

      await ethers.provider.send('evm_increaseTime', [15*24*60*60]);
      await ethers.provider.send('evm_mine', []);

      // unstake 2 week success
      await stakingRewardsContract.connect(user).unStake(BigInt(1));
      await stakingRewardsContract.connect(user).unStake(BigInt(3));

      expect(await stakingRewardsContract.totalStakerInfoByTermOption(user.address, BigInt(14))).to.be.equal(6);

      expect(await stakingRewardsContract.totalStakerInfoByTermOption(user.address, BigInt(30))).to.be.equal(2);

      expect(await stakingRewardsContract.totalStakerInfoByTermOptionAndRelease(user.address, BigInt(14), true)).to.be.equal(2);
      expect(await stakingRewardsContract.totalStakerInfoByTermOptionAndRelease(user.address, BigInt(14), false)).to.be.equal(4);

      expect(await stakingRewardsContract.totalStakerInfoByTermOptionAndRelease(user.address, BigInt(30), true)).to.be.equal(0);
      expect(await stakingRewardsContract.totalStakerInfoByTermOptionAndRelease(user.address, BigInt(30), false)).to.be.equal(2);

      expect(await stakingRewardsContract.totalStakerInfoByRelease(user.address, true)).to.be.equal(2);
      expect(await stakingRewardsContract.totalStakerInfoByRelease(user.address, false)).to.be.equal(6);

      const resultGetStakerInfoByTermOption = await stakingRewardsContract.getStakerInfoByTermOption(user.address, BigInt(14), BigInt(0), BigInt(1));
      console.log("resultGetStakerInfoByTermOption = ", resultGetStakerInfoByTermOption);

      const resultTotalRewardDebtByAddress = await stakingRewardsContract.totalRewardDebtByAddress(user.address);
      console.log("resultTotalRewardDebtByAddress = ", resultTotalRewardDebtByAddress);


      const resultGetStakeInfo = await stakingRewardsContract.getStakeInfo(user.address, BigInt(0));
      console.log("resultGetStakeInfo = ", resultGetStakeInfo);


      const resultGetStakerInfoByRelease = await stakingRewardsContract.getStakerInfoByRelease(user.address, true, BigInt(0), BigInt(1));
      console.log("resultGetStakerInfoByRelease = ", resultGetStakerInfoByRelease);

      await expect(stakingRewardsContract.getStakerInfoByRelease(user.address, true, BigInt(0), BigInt(2))).to.be.revertedWith("Invalid to index");

      const resultGetStakerInfoByReleaseFalse = await stakingRewardsContract.getStakerInfoByRelease(user.address, false, BigInt(0), BigInt(4));
      console.log("resultGetStakerInfoByReleaseFalse = ", resultGetStakerInfoByReleaseFalse);

      const resultGetStakerInfoByReleaseFalse2 = await stakingRewardsContract.getStakerInfoByRelease(user.address, false, BigInt(0), BigInt(5));
      console.log("resultGetStakerInfoByReleaseFalse2 = ", resultGetStakerInfoByReleaseFalse2);

      await expect(stakingRewardsContract.getStakerInfoByRelease(user.address, false, BigInt(0), BigInt(6))).to.be.revertedWith("Invalid to index");

      const resultGetStakerInfoByTermOptionAndRelease = await stakingRewardsContract.getStakerInfoByTermOptionAndRelease(user.address, BigInt(14), true, BigInt(0), BigInt(1));
      console.log("resultGetStakerInfoByTermOptionAndRelease = ", resultGetStakerInfoByTermOptionAndRelease);

      // only 2 (i.e. 0, 1) of 14 day term unstake, not 3 (i.e. 0, 1, 2)
      await expect(stakingRewardsContract.getStakerInfoByTermOptionAndRelease(user.address, BigInt(14), true, BigInt(0), BigInt(2))).to.be.revertedWith("Invalid to index");
      
      await expect(stakingRewardsContract.getStakerInfoByTermOptionAndRelease(user.address, BigInt(30), true, BigInt(0), BigInt(1))).to.be.revertedWith("Invalid from index");
      
                         
    });

    it("should show staked pool detail", async function () {
      const { user, deployer, stakingTokenContract,
        stakingRewardsContract, STContractDecimals_bn
          } = await loadFixture(deployStakingFixture);

      const transfer_ST_deployer_to_user_tx_response = await stakingTokenContract.connect(deployer)
                                        .transfer( 
                                          user.address,
                                          ethers.parseUnits((1*10**6).toString(), 
                                              STContractDecimals_bn) 
                                             )

      // User staking token approve staking reward contract

      const userTokenBalance = await stakingTokenContract.balanceOf(user.address);

      const approve_user_to_SRC_tx_response = await stakingTokenContract.connect(user)
                                        .approve( 
                                          stakingRewardsContract.target,
                                          userTokenBalance)
                                          // ethers.parseUnits(
                                          //   (1*10**6).toString(), 
                                          //     STContractDecimals_bn)

      // console.log("approve_user_to_SRC_tx_response.hash = ", approve_user_to_SRC_tx_response.hash)

      const ST_SRC0_allowance_bn = await stakingTokenContract.allowance(user.address, stakingRewardsContract.target)
      const ST_SRC0_allowance = ethers.formatUnits(ST_SRC0_allowance_bn, STContractDecimals_bn)
      // console.log("ST_SRC0_allowance = ", ST_SRC0_allowance)

      const stakingRewardsContractBalanceBefore = await stakingTokenContract.balanceOf(stakingRewardsContract.target);

      await stakingRewardsContract.connect(user)
                                        .twoWeekStake( 
                                          ethers.parseUnits((500*10**3).toString(), 
                                              STContractDecimals_bn) 
                                             )

      await stakingRewardsContract.connect(user)
                                            .oneMonthStake( 
                                              ethers.parseUnits((500*10**3).toString(), 
                                                  STContractDecimals_bn) 
                                                 )
    
      // time travel to 15 days later

      await ethers.provider.send('evm_increaseTime', [15*24*60*60]);
      await ethers.provider.send('evm_mine', []);

      // unstake 2 week success
      await stakingRewardsContract.connect(user).unStake(BigInt(0));

      const stakedPoolDetail = await stakingRewardsContract.getDetailStakedPool()

      // uint[2] public stakedPool = [0,0];
      console.log("stakedPoolDetail = ", stakedPoolDetail);
      // stakedPoolDetail =  Result(2) [ 0n, 500000000000000000000000n ]
                   
    });


  });


});
