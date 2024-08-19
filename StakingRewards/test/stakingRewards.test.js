const { time, loadFixture,} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("Staking", function () {
  
  async function deployStakingFixture() {

    const stakingToken = await ethers.getContractFactory('ERC20');
    const stakingTokenContract = await stakingToken.deploy('Staking Token', 'ST', 18);
    // console.log(`stakingTokenContract.target = ${stakingTokenContract.target}`)

    const rewardToken = await ethers.getContractFactory('ERC20');
    const rewardTokenContract = await rewardToken.deploy('Reward Token', 'RT', 18);
    // console.log(`rewardTokenContract.target = ${rewardTokenContract.target}`)

    const stakingRewards = await ethers.getContractFactory('StakingRewards');
    const stakingRewardsContract = await stakingRewards.deploy(
                                      stakingTokenContract.target, 
                                      rewardTokenContract.target);
    // console.log(`stakingRewardsContract.target = ${stakingRewardsContract.target}`)

    const [deployer, user] = await ethers.getSigners();

    const STContractDecimals_bn = await stakingTokenContract.decimals()

    // console.log("STContractDecimals_bn = ", STContractDecimals_bn)

    const RTContractDecimals_bn = await rewardTokenContract.decimals()

    // console.log("RTContractDecimals_bn = ", RTContractDecimals_bn)

    const mint_RT_deployer_tx_response = await rewardTokenContract.connect(deployer)
                                        .mint( ethers.parseUnits("1000000000", 
                                              RTContractDecimals_bn) )

    // console.log("mint_RT_deployer_tx_response.hash = ", mint_RT_deployer_tx_response.hash)

    const RTdeployer0_balance_bn = await rewardTokenContract.balanceOf(deployer.address)
    const RTdeployer0_balance = ethers.formatUnits(RTdeployer0_balance_bn, RTContractDecimals_bn)
    console.log("RTdeployer0_balance = ", RTdeployer0_balance)
    // RTdeployer0_balance =  1000000000.0

    const mint_ST_deployer_tx_response = await stakingTokenContract.connect(deployer)
                                        .mint( ethers.parseUnits("1000000000", 
                                              STContractDecimals_bn) )

    // console.log("mint_ST_deployer_tx_response.hash = ", mint_ST_deployer_tx_response.hash)


    const STdeployer0_balance_bn = await stakingTokenContract.balanceOf(deployer.address)
    const STdeployer0_balance = ethers.formatUnits(STdeployer0_balance_bn, STContractDecimals_bn)
    console.log("STdeployer0_balance = ", STdeployer0_balance)
    // STdeployer0_balance =  1000000000.0


    const transfer_RT_deployer_to_SRC_tx_response = await rewardTokenContract.connect(deployer)
                                        .transfer( 
                                          stakingRewardsContract.target,
                                           ethers.parseUnits("12000000", 
                                              RTContractDecimals_bn) 
                                             )

    // console.log("transfer_RT_deployer_to_SRC_tx_response.hash = ", transfer_RT_deployer_to_SRC_tx_response.hash)

    const RTdeployer1_balance_bn = await rewardTokenContract.balanceOf(deployer.address)
    const RTdeployer1_balance = ethers.formatUnits(RTdeployer1_balance_bn, RTContractDecimals_bn)
    console.log("RTdeployer1_balance = ", RTdeployer1_balance)
    // RTdeployer1_balance =  988000000.0


    const RT_SRC0_balance_bn = await rewardTokenContract.balanceOf(stakingRewardsContract.target)
    const RT_SRC0_balance = ethers.formatUnits(RT_SRC0_balance_bn, RTContractDecimals_bn)
    console.log("RT_SRC0_balance = ", RT_SRC0_balance)
    // RT_SRC0_balance =  12000000.0

    const transfer_ST_deployer_to_user_tx_response = await stakingTokenContract.connect(deployer)
                                        .transfer( 
                                          user.address,
                                          ethers.parseUnits("12000", 
                                              STContractDecimals_bn) 
                                             )

    // console.log("transfer_ST_deployer_to_user_tx_response.hash = ", transfer_ST_deployer_to_user_tx_response.hash)

    const STdeployer1_balance_bn = await stakingTokenContract.balanceOf(deployer.address)
    const STdeployer1_balance = ethers.formatUnits(STdeployer1_balance_bn, STContractDecimals_bn)
    console.log("STdeployer1_balance = ", STdeployer1_balance)
    // STdeployer1_balance =  999988000.0


    const ST_user0_balance_bn = await stakingTokenContract.balanceOf(user.address)
    const ST_user0_balance = ethers.formatUnits(ST_user0_balance_bn, STContractDecimals_bn)
    console.log("ST_user0_balance = ", ST_user0_balance)
    // ST_user0_balance =  12000.0


    return { deployer, user, stakingTokenContract, 
            rewardTokenContract, stakingRewardsContract,
            STContractDecimals_bn, RTContractDecimals_bn };

  }

  describe("Stake", function () {
    
    
    it("Should set the right duration; right reward rate;", async function () {
      const { user, deployer, stakingTokenContract, 
          rewardTokenContract, stakingRewardsContract,
          RTContractDecimals_bn, STContractDecimals_bn
            } = await loadFixture(deployStakingFixture);

      // set duration 1200 seconds
      const setRewardsDuration_tx_response = await stakingRewardsContract.setRewardsDuration(1200)
      // console.log("setRewardsDuration_tx_response.hash = ", setRewardsDuration_tx_response.hash)

      // 20 minutes; 20 x 60 = 1200 seconds; reward amount 120000; reward rate = 120000/1200 = 100 per second

      // Set reward rate
      const notifyRewardAmount_tx_response = await stakingRewardsContract.connect(deployer)
                                        .notifyRewardAmount( 
                                          ethers.parseUnits("120000", 
                                              RTContractDecimals_bn) 
                                             )
      
      // console.log("notifyRewardAmount_tx_response.hash = ", notifyRewardAmount_tx_response.hash)

      const rewardRate_bn = await stakingRewardsContract.rewardRate()
      const rewardRate = ethers.formatUnits(rewardRate_bn, RTContractDecimals_bn)
      console.log("rewardRate = ", rewardRate)
      // rewardRate = 100.0


      expect(await stakingRewardsContract.duration()).to.eq(1200); // 20 minutes; 20 x 60 = 1200 seconds
      
      expect(Number(rewardRate)).to.eq(100); // notifyRewardAmount

      
    });

    it("Should set the right staked balance after 3rd stake in contract and the right updated reward per token.", async function () {
      const { user, deployer, stakingTokenContract, 
          rewardTokenContract, stakingRewardsContract,
          RTContractDecimals_bn, STContractDecimals_bn
            } = await loadFixture(deployStakingFixture);

      // Set reward duration to 1200 seconds
      const setRewardsDuration_tx_response = await stakingRewardsContract.setRewardsDuration(1200)

      // console.log("setRewardsDuration_tx_response.hash = ", setRewardsDuration_tx_response.hash)

      // 20 minutes; 20 x 60 = 1200 seconds; reward amount 120000; reward rate = 120000/1200 = 100 per second
      // Set reward rate
      const notifyRewardAmount_tx_response = await stakingRewardsContract.connect(deployer)
                                        .notifyRewardAmount( 
                                          ethers.parseUnits("120000", 
                                            RTContractDecimals_bn)
                                             )
      
      // console.log("notifyRewardAmount_tx_response.hash = ", notifyRewardAmount_tx_response.hash)

      const rewardRate_bn = await stakingRewardsContract.rewardRate()
      const rewardRate = ethers.formatUnits(rewardRate_bn, RTContractDecimals_bn)
      // console.log("rewardRate = ", rewardRate)
      // rewardRate =  100.0

      // User  staking token approve staking reward contract

      const approve_user_to_SRC_tx_response = await stakingTokenContract.connect(user)
                                        .approve( 
                                          stakingRewardsContract.target,
                                          ethers.parseUnits("1200", 
                                              STContractDecimals_bn)
                                             )


      // console.log("approve_user_to_SRC_tx_response.hash = ", approve_user_to_SRC_tx_response.hash)

      const ST_SRC0_allowance_bn = await stakingTokenContract.allowance(user.address, stakingRewardsContract.target)
      const ST_SRC0_allowance = ethers.formatUnits(ST_SRC0_allowance_bn, STContractDecimals_bn)
      // console.log("ST_SRC0_allowance = ", ST_SRC0_allowance)

      // stake, first time

      const stake_tx_response = await stakingRewardsContract.connect(user)
                                        .stake( 
                                          ethers.parseUnits("1200", 
                                              STContractDecimals_bn) 
                                             )

      // console.log("stake_tx_response.hash = ", stake_tx_response.hash)

      const stake_time_stamp_0 = (await time.latest())
      // console.log("stake_time_stamp_0 = ", stake_time_stamp_0)

      // updated reward per token
      const SRC0_rewardPerTokenUpdated_bn = await stakingRewardsContract.rewardPerTokenUpdated()
      // console.log("SRC0_rewardPerTokenUpdated_bn = ", SRC0_rewardPerTokenUpdated_bn)
      const SRC0_rewardPerTokenUpdated = ethers.formatUnits(SRC0_rewardPerTokenUpdated_bn, RTContractDecimals_bn)
      console.log("SRC0_rewardPerTokenUpdated = ", SRC0_rewardPerTokenUpdated)
      // SRC0_rewardPerTokenUpdated =  0.0
      expect(Number(SRC0_rewardPerTokenUpdated)).to.be.eq(0) // first stake, totalSupply = 0, hence rewardPerTokenUpdated = 0

      const ST_SRC0_balance_bn = await stakingTokenContract.balanceOf(stakingRewardsContract.target)
      const ST_SRC0_balance = ethers.formatUnits(ST_SRC0_balance_bn, STContractDecimals_bn)
      console.log("ST_SRC0_balance = ", ST_SRC0_balance)
      // ST_SRC0_balance =  1200.0


      const SRC0_totalSupply_bn = await stakingRewardsContract.totalSupply()
      const SRC0_totalSupply = ethers.formatUnits(SRC0_totalSupply_bn,STContractDecimals_bn)
      console.log("SRC0_totalSupply = ", SRC0_totalSupply)
      // SRC0_totalSupply =  1200.0

      expect(Number(SRC0_totalSupply)).to.be.eq(1200)

      // approve again for staking the second time

      const ST_SRC1_allowance_bn = await stakingTokenContract.allowance(user.address, stakingRewardsContract.target)
      const ST_SRC1_allowance = ethers.formatUnits(ST_SRC1_allowance_bn, STContractDecimals_bn)
      // console.log("ST_SRC1_allowance = ", ST_SRC1_allowance)

      const approve_user_to_SRC_2_tx_response = await stakingTokenContract.connect(user)
                                        .approve( 
                                          stakingRewardsContract.target,
                                          ethers.parseUnits("1200", 
                                              STContractDecimals_bn)
                                             )

      // console.log("approve_user_to_SRC_2_tx_response.hash = ", approve_user_to_SRC_2_tx_response.hash)

      const ST_SRC1_2_allowance_bn = await stakingTokenContract.allowance(user.address, stakingRewardsContract.target)
      const ST_SRC1_2_allowance = ethers.formatUnits(ST_SRC1_2_allowance_bn, STContractDecimals_bn)
      // console.log("ST_SRC1_2_allowance = ", ST_SRC1_2_allowance)

      // stake, second time, stake same amount i.e. 1200

      const stake_2_tx_response = await stakingRewardsContract.connect(user)
                                      .stake( 
                                        ethers.parseUnits("1200", 
                                            STContractDecimals_bn) 
                                          )

      // console.log("stake_2_tx_response.hash = ", stake_2_tx_response.hash)
      

      const stake_time_stamp_1 = (await time.latest())
      // console.log("stake_time_stamp_1 = ", stake_time_stamp_1)


      const ST_SRC1_balance_bn = await stakingTokenContract.balanceOf(stakingRewardsContract.target)
      const ST_SRC1_balance = ethers.formatUnits(ST_SRC1_balance_bn, STContractDecimals_bn)
      console.log("ST_SRC1_balance = ", ST_SRC1_balance)
      // ST_SRC1_balance =  2400.0


      const SRC1_rewardPerTokenUpdated_bn = await stakingRewardsContract.rewardPerTokenUpdated()
      // console.log("SRC1_rewardPerTokenUpdated_bn = ", SRC1_rewardPerTokenUpdated_bn)
      const SRC1_rewardPerTokenUpdated = ethers.formatUnits(SRC1_rewardPerTokenUpdated_bn, RTContractDecimals_bn)
      console.log("SRC1_rewardPerTokenUpdated = ", SRC1_rewardPerTokenUpdated)
      // SRC1_rewardPerTokenUpdated =  0.166666666666666666

      const stake_time_passed_bn = BigInt(stake_time_stamp_1 - stake_time_stamp_0)
      // console.log("stake_time_passed_bn = ", stake_time_passed_bn)
      // stake_time_passed_bn =  2n

      const rewardPerTokenStore_1_bn = SRC0_rewardPerTokenUpdated_bn + rewardRate_bn * (stake_time_passed_bn) * BigInt("1000000000000000000")
                / SRC0_totalSupply_bn
      // console.log("rewardPerTokenStore_1_bn = ", rewardPerTokenStore_1_bn)
      const rewardPerTokenStore_1 = ethers.formatUnits(rewardPerTokenStore_1_bn, RTContractDecimals_bn)
      console.log("rewardPerTokenStore_1 = ", rewardPerTokenStore_1)
      // rewardPerTokenStore_1 =  0.166666666666666666

      const RPT_diff_bn = SRC1_rewardPerTokenUpdated_bn - rewardPerTokenStore_1_bn
      // console.log("RPT_diff_bn = ", RPT_diff_bn)
      const RPT_diff = ethers.formatUnits(RPT_diff_bn, RTContractDecimals_bn)
      console.log("RPT_diff = ", RPT_diff)
      // RPT_diff =  0.0

      expect(Number(SRC1_rewardPerTokenUpdated)).to.be.eq(Number(rewardPerTokenStore_1))
      // SRC1_rewardPerTokenUpdated =  0.166666666666666666
      // rewardPerTokenStore_1 =  0.166666666666666666

      const SRC1_totalSupply_bn = await stakingRewardsContract.totalSupply()
      const SRC1_totalSupply = ethers.formatUnits(SRC1_totalSupply_bn,STContractDecimals_bn)
      console.log("SRC1_totalSupply = ", SRC1_totalSupply)

      expect(Number(SRC1_totalSupply)).to.be.eq(2400)

      // to stake the third time

      // approve again

      const ST_SRC2_allowance_bn = await stakingTokenContract.allowance(user.address, stakingRewardsContract.target)
      const ST_SRC2_allowance = ethers.formatUnits(ST_SRC2_allowance_bn, STContractDecimals_bn)
      // console.log("ST_SRC2_allowance = ", ST_SRC2_allowance)

      const approve_user_to_SRC_3_tx_response = await stakingTokenContract.connect(user)
                                        .approve( 
                                          stakingRewardsContract.target,
                                          ethers.parseUnits("1200", 
                                              STContractDecimals_bn) 
                                             )

      // console.log("approve_user_to_SRC_3_tx_response.hash = ", approve_user_to_SRC_3_tx_response.hash)

      const ST_SRC1_3_allowance_bn = await stakingTokenContract.allowance(user.address, stakingRewardsContract.target)
      const ST_SRC1_3_allowance = ethers.formatUnits(ST_SRC1_3_allowance_bn, STContractDecimals_bn)
      // console.log("ST_SRC1_3_allowance = ", ST_SRC1_3_allowance)


      const stake_3_tx_response = await stakingRewardsContract.connect(user)
                                      .stake( 
                                        ethers.parseUnits("1200", 
                                            STContractDecimals_bn)
                                          )

      // console.log("stake_3_tx_response.hash = ", stake_3_tx_response.hash)
      

      const stake_time_stamp_2 = (await time.latest())
      // console.log("stake_time_stamp_2 = ", stake_time_stamp_2)

      const ST_SRC2_balance_bn = await stakingTokenContract.balanceOf(stakingRewardsContract.target)
      const ST_SRC2_balance = ethers.formatUnits(ST_SRC2_balance_bn, STContractDecimals_bn)
      console.log("ST_SRC2_balance = ", ST_SRC2_balance)
      // ST_SRC2_balance =  3600.0

      const SRC2_totalSupply_bn = await stakingRewardsContract.totalSupply()
      const SRC2_totalSupply = ethers.formatUnits(SRC2_totalSupply_bn,STContractDecimals_bn)
      console.log("SRC2_totalSupply = ", SRC2_totalSupply)
      // SRC2_totalSupply =  3600.0

      
      const SRC2_rewardPerTokenUpdated_bn = await stakingRewardsContract.rewardPerTokenUpdated()
      // console.log("SRC2_rewardPerTokenUpdated_bn = ", SRC2_rewardPerTokenUpdated_bn)
      const SRC2_rewardPerTokenUpdated = ethers.formatUnits(SRC2_rewardPerTokenUpdated_bn, RTContractDecimals_bn)
      console.log("SRC2_rewardPerTokenUpdated = ", SRC2_rewardPerTokenUpdated)
      // SRC2_rewardPerTokenUpdated =  0.249999999999999999

      const stake_time_passed_2_bn = BigInt(stake_time_stamp_2 - stake_time_stamp_1)
      // console.log("stake_time_passed_2_bn = ", stake_time_passed_2_bn)

      const rewardPerTokenStore_2_bn = SRC1_rewardPerTokenUpdated_bn + rewardRate_bn * (stake_time_passed_2_bn) * BigInt("1000000000000000000")
                                        / SRC1_totalSupply_bn
      // console.log("rewardPerTokenStore_2_bn = ", rewardPerTokenStore_2_bn)
      const rewardPerTokenStore_2 = ethers.formatUnits(rewardPerTokenStore_2_bn, RTContractDecimals_bn)
      console.log("rewardPerTokenStore_2 = ", rewardPerTokenStore_2)
      // rewardPerTokenStore_2 =  0.249999999999999999


      const RPT_diff_between_stakes_bn = SRC1_rewardPerTokenUpdated_bn - SRC0_rewardPerTokenUpdated_bn
      // SRC1_rewardPerTokenUpdated =  0.166666666666666666
      // console.log("RPT_diff_between_stakes_bn = ", RPT_diff_between_stakes_bn)
      const RPT_diff_between_stakes = ethers.formatUnits(RPT_diff_between_stakes_bn, RTContractDecimals_bn)
      console.log("RPT_diff_between_stakes = ", RPT_diff_between_stakes)
      // RPT_diff_between_stakes =  0.166666666666666666

      const SRC_diff_totalSupply_bn = SRC1_totalSupply_bn - SRC0_totalSupply_bn
      // console.log("SRC_diff_totalSupply_bn = ", SRC_diff_totalSupply_bn)
      const SRC_diff_totalSupply = ethers.formatUnits(SRC_diff_totalSupply_bn, STContractDecimals_bn)
      console.log("SRC_diff_totalSupply = ", SRC_diff_totalSupply)
      // SRC_diff_totalSupply =  1200.0

      expect(Number(ST_SRC2_balance)).to.eq(3600); // stake balance

      expect(Number(SRC2_rewardPerTokenUpdated)).to.eq(Number(rewardPerTokenStore_2)); // reward per token
      // SRC2_rewardPerTokenUpdated =  0.249999999999999999
      // / rewardPerTokenStore_2 =  0.249999999999999999
    });

    
    it("Should provide the right balances after withdrawal and should get the correct rewards", async function () {
      const { user, deployer, stakingTokenContract, 
          rewardTokenContract, stakingRewardsContract,
          RTContractDecimals_bn, STContractDecimals_bn
            } = await loadFixture(deployStakingFixture);

      // Set reward duration to 1200 seconds
      const setRewardsDuration_tx_response = await stakingRewardsContract.setRewardsDuration(1200)

      // console.log("setRewardsDuration_tx_response.hash = ", setRewardsDuration_tx_response.hash)

      // 20 minutes; 20 x 60 = 1200 seconds; reward amount 120000; reward rate = 120000/1200 = 100 per second
      // Set reward rate
      const notifyRewardAmount_tx_response = await stakingRewardsContract.connect(deployer)
                                        .notifyRewardAmount( 
                                          ethers.parseUnits("120000", 
                                            RTContractDecimals_bn)
                                             )
      
      // console.log("notifyRewardAmount_tx_response.hash = ", notifyRewardAmount_tx_response.hash)

      const rewardRate_bn = await stakingRewardsContract.rewardRate()
      const rewardRate = ethers.formatUnits(rewardRate_bn, RTContractDecimals_bn)
      // console.log("rewardRate = ", rewardRate)
      // rewardRate =  100.0

      // User  staking token approve staking reward contract

      const approve_user_to_SRC_tx_response = await stakingTokenContract.connect(user)
                                        .approve( 
                                          stakingRewardsContract.target,
                                          ethers.parseUnits("1200", 
                                              STContractDecimals_bn)
                                             )


      // console.log("approve_user_to_SRC_tx_response.hash = ", approve_user_to_SRC_tx_response.hash)

      const ST_SRC0_allowance_bn = await stakingTokenContract.allowance(user.address, stakingRewardsContract.target)
      const ST_SRC0_allowance = ethers.formatUnits(ST_SRC0_allowance_bn, STContractDecimals_bn)
      // console.log("ST_SRC0_allowance = ", ST_SRC0_allowance)

      // stake, first time

      const stake_tx_response = await stakingRewardsContract.connect(user)
                                        .stake( 
                                          ethers.parseUnits("1200", 
                                              STContractDecimals_bn) 
                                             )

      // console.log("stake_tx_response.hash = ", stake_tx_response.hash)

      const stake_time_stamp_0 = (await time.latest())
      // console.log("stake_time_stamp_0 = ", stake_time_stamp_0)

      // updated reward per token
      const SRC0_rewardPerTokenUpdated_bn = await stakingRewardsContract.rewardPerTokenUpdated()
      // console.log("SRC0_rewardPerTokenUpdated_bn = ", SRC0_rewardPerTokenUpdated_bn)
      const SRC0_rewardPerTokenUpdated = ethers.formatUnits(SRC0_rewardPerTokenUpdated_bn, RTContractDecimals_bn)
      // console.log("SRC0_rewardPerTokenUpdated = ", SRC0_rewardPerTokenUpdated)
      // SRC0_rewardPerTokenUpdated =  0.0
      // expect(Number(SRC0_rewardPerTokenUpdated)).to.be.eq(0) // first stake, totalSupply = 0, hence rewardPerTokenUpdated = 0

      const ST_SRC0_balance_bn = await stakingTokenContract.balanceOf(stakingRewardsContract.target)
      const ST_SRC0_balance = ethers.formatUnits(ST_SRC0_balance_bn, STContractDecimals_bn)
      // console.log("ST_SRC0_balance = ", ST_SRC0_balance)
      // ST_SRC0_balance =  1200.0


      const SRC0_totalSupply_bn = await stakingRewardsContract.totalSupply()
      const SRC0_totalSupply = ethers.formatUnits(SRC0_totalSupply_bn,STContractDecimals_bn)
      // console.log("SRC0_totalSupply = ", SRC0_totalSupply)
      // SRC0_totalSupply =  1200.0

      // expect(Number(SRC0_totalSupply)).to.be.eq(1200)

      // approve again for staking the second time

      const ST_SRC1_allowance_bn = await stakingTokenContract.allowance(user.address, stakingRewardsContract.target)
      const ST_SRC1_allowance = ethers.formatUnits(ST_SRC1_allowance_bn, STContractDecimals_bn)
      // console.log("ST_SRC1_allowance = ", ST_SRC1_allowance)

      const approve_user_to_SRC_2_tx_response = await stakingTokenContract.connect(user)
                                        .approve( 
                                          stakingRewardsContract.target,
                                          ethers.parseUnits("1200", 
                                              STContractDecimals_bn)
                                             )

      // console.log("approve_user_to_SRC_2_tx_response.hash = ", approve_user_to_SRC_2_tx_response.hash)

      const ST_SRC1_2_allowance_bn = await stakingTokenContract.allowance(user.address, stakingRewardsContract.target)
      const ST_SRC1_2_allowance = ethers.formatUnits(ST_SRC1_2_allowance_bn, STContractDecimals_bn)
      // console.log("ST_SRC1_2_allowance = ", ST_SRC1_2_allowance)

      // stake, second time, stake same amount i.e. 1200

      const stake_2_tx_response = await stakingRewardsContract.connect(user)
                                      .stake( 
                                        ethers.parseUnits("1200", 
                                            STContractDecimals_bn) 
                                          )

      // console.log("stake_2_tx_response.hash = ", stake_2_tx_response.hash)
      

      const stake_time_stamp_1 = (await time.latest())
      // console.log("stake_time_stamp_1 = ", stake_time_stamp_1)


      const ST_SRC1_balance_bn = await stakingTokenContract.balanceOf(stakingRewardsContract.target)
      const ST_SRC1_balance = ethers.formatUnits(ST_SRC1_balance_bn, STContractDecimals_bn)
      // console.log("ST_SRC1_balance = ", ST_SRC1_balance)
      // ST_SRC1_balance =  2400.0


      const SRC1_rewardPerTokenUpdated_bn = await stakingRewardsContract.rewardPerTokenUpdated()
      // console.log("SRC1_rewardPerTokenUpdated_bn = ", SRC1_rewardPerTokenUpdated_bn)
      const SRC1_rewardPerTokenUpdated = ethers.formatUnits(SRC1_rewardPerTokenUpdated_bn, RTContractDecimals_bn)
      // console.log("SRC1_rewardPerTokenUpdated = ", SRC1_rewardPerTokenUpdated)
      // SRC1_rewardPerTokenUpdated =  0.166666666666666666

      const stake_time_passed_bn = BigInt(stake_time_stamp_1 - stake_time_stamp_0)
      // console.log("stake_time_passed_bn = ", stake_time_passed_bn)
      // stake_time_passed_bn =  2n

      const rewardPerTokenStore_1_bn = SRC0_rewardPerTokenUpdated_bn + rewardRate_bn * (stake_time_passed_bn) * BigInt("1000000000000000000")
                / SRC0_totalSupply_bn
      // console.log("rewardPerTokenStore_1_bn = ", rewardPerTokenStore_1_bn)
      const rewardPerTokenStore_1 = ethers.formatUnits(rewardPerTokenStore_1_bn, RTContractDecimals_bn)
      // console.log("rewardPerTokenStore_1 = ", rewardPerTokenStore_1)
      // rewardPerTokenStore_1 =  0.166666666666666666

      const RPT_diff_bn = SRC1_rewardPerTokenUpdated_bn - rewardPerTokenStore_1_bn
      // console.log("RPT_diff_bn = ", RPT_diff_bn)
      const RPT_diff = ethers.formatUnits(RPT_diff_bn, RTContractDecimals_bn)
      // console.log("RPT_diff = ", RPT_diff)
      // RPT_diff =  0.0

      // expect(Number(SRC1_rewardPerTokenUpdated)).to.be.eq(Number(rewardPerTokenStore_1))
      // SRC1_rewardPerTokenUpdated =  0.166666666666666666
      // rewardPerTokenStore_1 =  0.166666666666666666

      const SRC1_totalSupply_bn = await stakingRewardsContract.totalSupply()
      const SRC1_totalSupply = ethers.formatUnits(SRC1_totalSupply_bn,STContractDecimals_bn)
      // console.log("SRC1_totalSupply = ", SRC1_totalSupply)

      // expect(Number(SRC1_totalSupply)).to.be.eq(2400)

      // to stake the third time

      // approve again

      const ST_SRC2_allowance_bn = await stakingTokenContract.allowance(user.address, stakingRewardsContract.target)
      const ST_SRC2_allowance = ethers.formatUnits(ST_SRC2_allowance_bn, STContractDecimals_bn)
      // console.log("ST_SRC2_allowance = ", ST_SRC2_allowance)

      const approve_user_to_SRC_3_tx_response = await stakingTokenContract.connect(user)
                                        .approve( 
                                          stakingRewardsContract.target,
                                          ethers.parseUnits("1200", 
                                              STContractDecimals_bn) 
                                             )

      // console.log("approve_user_to_SRC_3_tx_response.hash = ", approve_user_to_SRC_3_tx_response.hash)

      const ST_SRC1_3_allowance_bn = await stakingTokenContract.allowance(user.address, stakingRewardsContract.target)
      const ST_SRC1_3_allowance = ethers.formatUnits(ST_SRC1_3_allowance_bn, STContractDecimals_bn)
      // console.log("ST_SRC1_3_allowance = ", ST_SRC1_3_allowance)


      const stake_3_tx_response = await stakingRewardsContract.connect(user)
                                      .stake( 
                                        ethers.parseUnits("1200", 
                                            STContractDecimals_bn)
                                          )

      // console.log("stake_3_tx_response.hash = ", stake_3_tx_response.hash)
      

      const stake_time_stamp_2 = (await time.latest())
      // console.log("stake_time_stamp_2 = ", stake_time_stamp_2)

      const ST_SRC2_balance_bn = await stakingTokenContract.balanceOf(stakingRewardsContract.target)
      const ST_SRC2_balance = ethers.formatUnits(ST_SRC2_balance_bn, STContractDecimals_bn)
      console.log("ST_SRC2_balance = ", ST_SRC2_balance)
      // ST_SRC2_balance =  3600.0

      const SRC2_totalSupply_bn = await stakingRewardsContract.totalSupply()
      const SRC2_totalSupply = ethers.formatUnits(SRC2_totalSupply_bn,STContractDecimals_bn)
      console.log("SRC2_totalSupply = ", SRC2_totalSupply)
      // SRC2_totalSupply =  3600.0

      
      const SRC2_rewardPerTokenUpdated_bn = await stakingRewardsContract.rewardPerTokenUpdated()
      // console.log("SRC2_rewardPerTokenUpdated_bn = ", SRC2_rewardPerTokenUpdated_bn)
      const SRC2_rewardPerTokenUpdated = ethers.formatUnits(SRC2_rewardPerTokenUpdated_bn, RTContractDecimals_bn)
      // console.log("SRC2_rewardPerTokenUpdated = ", SRC2_rewardPerTokenUpdated)
      // SRC2_rewardPerTokenUpdated =  0.249999999999999999

      const stake_time_passed_2_bn = BigInt(stake_time_stamp_2 - stake_time_stamp_1)
      // console.log("stake_time_passed_2_bn = ", stake_time_passed_2_bn)

      const rewardPerTokenStore_2_bn = SRC1_rewardPerTokenUpdated_bn + rewardRate_bn * (stake_time_passed_2_bn) * BigInt("1000000000000000000")
                                        / SRC1_totalSupply_bn
      // console.log("rewardPerTokenStore_2_bn = ", rewardPerTokenStore_2_bn)
      const rewardPerTokenStore_2 = ethers.formatUnits(rewardPerTokenStore_2_bn, RTContractDecimals_bn)
      // console.log("rewardPerTokenStore_2 = ", rewardPerTokenStore_2)
      // rewardPerTokenStore_2 =  0.249999999999999999


      const RPT_diff_between_stakes_bn = SRC1_rewardPerTokenUpdated_bn - SRC0_rewardPerTokenUpdated_bn
      // console.log("RPT_diff_between_stakes_bn = ", RPT_diff_between_stakes_bn)

      // SRC0_rewardPerTokenUpdated =  0.0
      const RPT_diff_between_stakes = ethers.formatUnits(RPT_diff_between_stakes_bn, RTContractDecimals_bn)
      // console.log("RPT_diff_between_stakes = ", RPT_diff_between_stakes)
      // SRC1_rewardPerTokenUpdated =  0.166666666666666666
      // RPT_diff_between_stakes =  0.166666666666666666

      const SRC_diff_totalSupply_bn = SRC1_totalSupply_bn - SRC0_totalSupply_bn
      // console.log("SRC_diff_totalSupply_bn = ", SRC_diff_totalSupply_bn)
      const SRC_diff_totalSupply = ethers.formatUnits(SRC_diff_totalSupply_bn, STContractDecimals_bn)
      // console.log("SRC_diff_totalSupply = ", SRC_diff_totalSupply)
      // SRC_diff_totalSupply =  1200.0

      // expect(Number(ST_SRC2_balance)).to.eq(3600); // stake balance

      // expect(Number(SRC2_rewardPerTokenUpdated)).to.eq(Number(rewardPerTokenStore_2)); // reward per token
      // SRC2_rewardPerTokenUpdated =  0.249999999999999999
      // / rewardPerTokenStore_2 =  0.249999999999999999


      // withdraw stake 1200

      const withdraw_0_tx_response = await stakingRewardsContract.connect(user)
                                      .withdraw( 
                                        ethers.parseUnits("1200", 
                                            STContractDecimals_bn) 
                                          )

      // console.log("withdraw_0_tx_response.hash = ", withdraw_0_tx_response.hash)
      
      const withdraw_time_stamp_0 = (await time.latest())
      // console.log("withdraw_time_stamp_0 = ", withdraw_time_stamp_0)

      const ST_SRC3_balance_bn = await stakingTokenContract.balanceOf(stakingRewardsContract.target)
      const ST_SRC3_balance = ethers.formatUnits(ST_SRC3_balance_bn, STContractDecimals_bn)
      console.log("ST_SRC3_balance = ", ST_SRC3_balance)
      // ST_SRC3_balance =  2400.0

      const SRC3_rewardPerTokenUpdated_bn = await stakingRewardsContract.rewardPerTokenUpdated()
      // console.log("SRC3_rewardPerTokenUpdated_bn = ", SRC3_rewardPerTokenUpdated_bn)
      // SRC3_rewardPerTokenUpdated_bn =  277777777777777776n
      const SRC3_rewardPerTokenUpdated = ethers.formatUnits(SRC3_rewardPerTokenUpdated_bn, RTContractDecimals_bn)
      console.log("SRC3_rewardPerTokenUpdated = ", SRC3_rewardPerTokenUpdated)
      // SRC3_rewardPerTokenUpdated =  0.277777777777777776
      
      const last_transaction_time_passed_0_bn = BigInt(withdraw_time_stamp_0 - stake_time_stamp_2)
      // console.log("last_transaction_time_passed_0_bn = ", last_transaction_time_passed_0_bn)
      // last_transaction_time_passed_0_bn =  1n

      const rewardPerTokenStore_3_bn = SRC2_rewardPerTokenUpdated_bn + rewardRate_bn * (last_transaction_time_passed_0_bn) * BigInt("1000000000000000000")
                / SRC2_totalSupply_bn
      // console.log("rewardPerTokenStore_3_bn = ", rewardPerTokenStore_3_bn)
      // rewardPerTokenStore_3_bn =  277777777777777776n
      const rewardPerTokenStore_3 = ethers.formatUnits(rewardPerTokenStore_3_bn, RTContractDecimals_bn)
      console.log("rewardPerTokenStore_3 = ", rewardPerTokenStore_3)
      // rewardPerTokenStore_3 =  0.277777777777777776


      const SRC3_totalSupply_bn = await stakingRewardsContract.totalSupply()
      const SRC3_totalSupply = ethers.formatUnits(SRC3_totalSupply_bn,STContractDecimals_bn)
      console.log("SRC3_totalSupply = ", SRC3_totalSupply)
      // SRC3_totalSupply =  2400.0


      const RPT_diff_between_stakes_1_bn = SRC3_rewardPerTokenUpdated_bn - SRC2_rewardPerTokenUpdated_bn
      // SRC3_rewardPerTokenUpdated =  0.277777777777777776
      // SRC2_rewardPerTokenUpdated =  0.249999999999999999

      // console.log("RPT_diff_between_stakes_1_bn = ", RPT_diff_between_stakes_1_bn)
      // RPT_diff_between_stakes_1_bn =  27777777777777777n
      const RPT_diff_between_stakes_1 = ethers.formatUnits(RPT_diff_between_stakes_1_bn, RTContractDecimals_bn)
      console.log("RPT_diff_between_stakes_1 = ", RPT_diff_between_stakes_1)
      // RPT_diff_between_stakes_1 =  0.027777777777777777

      
      const SRC_diff_totalSupply_1_bn = SRC3_totalSupply_bn - SRC2_totalSupply_bn
      // console.log("SRC_diff_totalSupply_1_bn = ", SRC_diff_totalSupply_1_bn)
      // SRC_diff_totalSupply_1_bn =  -1200000000000000000000n
      const SRC_diff_totalSupply_1 = ethers.formatUnits(SRC_diff_totalSupply_1_bn, STContractDecimals_bn)
      console.log("SRC_diff_totalSupply_1 = ", SRC_diff_totalSupply_1)
      // SRC_diff_totalSupply_1 =  -1200.0

      expect(Number(SRC3_totalSupply)).to.eq(2400.0);

      expect(SRC3_rewardPerTokenUpdated).to.eq(rewardPerTokenStore_3);
      // SRC3_rewardPerTokenUpdated =  0.277777777777777776
      // rewardPerTokenStore_3 =  0.277777777777777776
      

      expect(Number(SRC_diff_totalSupply_1)).to.be.eq(-1200.0)

      // get rewards
      
      const rewards_user_0_bn = await stakingRewardsContract.rewards(user.address)
      const rewards_user_0 = ethers.formatUnits(rewards_user_0_bn,RTContractDecimals_bn)
      console.log("rewards_user_0 = ", rewards_user_0)
      // rewards_user_0 =  499.9999999999999956


      const RT0_user_balance_bn = await rewardTokenContract.balanceOf(user.address)
      const RT0_user_balance = ethers.formatUnits(RT0_user_balance_bn,RTContractDecimals_bn)
      console.log("RT0_user_balance = ", RT0_user_balance)
      // RT0_user_balance =  0.0

      const get_reward_0_tx_response = await stakingRewardsContract.connect(user)
                                          .getReward()

      // console.log("get_reward_0_tx_response.hash = ", get_reward_0_tx_response.hash)


      const get_reward_time_stamp_0 = (await time.latest())
      // console.log("get_reward_time_stamp_0 = ", get_reward_time_stamp_0)

      const last_transaction_time_passed_1_bn = BigInt(get_reward_time_stamp_0 - withdraw_time_stamp_0)
      // console.log("last_transaction_time_passed_1_bn = ", last_transaction_time_passed_1_bn)


      const rewardPerTokenStore_4_bn = SRC3_rewardPerTokenUpdated_bn + rewardRate_bn * (last_transaction_time_passed_1_bn) * BigInt("1000000000000000000")
                / SRC3_totalSupply_bn
      // console.log("rewardPerTokenStore_4_bn = ", rewardPerTokenStore_4_bn)
      const rewardPerTokenStore_4 = ethers.formatUnits(rewardPerTokenStore_4_bn, RTContractDecimals_bn)
      console.log("rewardPerTokenStore_4 = ", rewardPerTokenStore_4)
      // rewardPerTokenStore_4 =  0.319444444444444442

      const RT0_SRC_user_balance_bn = await stakingRewardsContract.balanceOf(user.address)

      const additional_reward_0_bn = RT0_SRC_user_balance_bn
            * (rewardPerTokenStore_4_bn - rewardPerTokenStore_3_bn) / BigInt("1000000000000000000")
      const additional_reward_0 = ethers.formatUnits(additional_reward_0_bn,RTContractDecimals_bn)
      console.log("additional_reward_0 = ", additional_reward_0)
      // additional_reward_0 =  99.9999999999999984


      const rewards_user_1_bn = await stakingRewardsContract.rewards(user.address)
      const rewards_user_1 = ethers.formatUnits(rewards_user_1_bn,RTContractDecimals_bn)
      console.log("rewards_user_1 = ", rewards_user_1)
      // rewards_user_1 =  0.0

      const RT1_user_balance_bn = await rewardTokenContract.balanceOf(user.address)
      const RT1_user_balance = ethers.formatUnits(RT1_user_balance_bn,RTContractDecimals_bn)
      console.log("RT1_user_balance = ", RT1_user_balance)
      // RT1_user_balance =  599.999999999999994

      
      expect(Number(rewards_user_1)).to.eq(0.0)

      expect(Number(rewards_user_0)+ Number(additional_reward_0)).to.eq(Number(RT1_user_balance));
      // rewards_user_0 =  499.9999999999999956
      // additional_reward_0 =  99.9999999999999984
      // RT1_user_balance =  599.999999999999994

    });

  });

});
