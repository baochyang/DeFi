const { loadFixture,} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");


describe("MultiTokenVault", function () {
  
  async function deployMultiTokenVaultFixture() {

    const tokenA = await ethers.getContractFactory('ERC20');
    const tokenA_Contract = await tokenA.deploy('Token A', 'TA', 18);
    // console.log(`tokenA_Contract.target = ${tokenA_Contract.target}`)


    const MultiTokenVault = await ethers.getContractFactory('MultiTokenVault');
    const MultiTokenVaultContract = await MultiTokenVault.deploy();
    // console.log(`MultiTokenVaultContract.target = ${MultiTokenVaultContract.target}`)

    const [deployer, user] = await ethers.getSigners();

    const TA_ContractDecimals_bn = await tokenA_Contract.decimals()
    // console.log("TA_ContractDecimals_bn = ", TA_ContractDecimals_bn)


    const mint_TA_deployer_tx_response = await tokenA_Contract.connect(deployer)
                                        .mint( ethers.parseUnits("1000000000", 
                                              TA_ContractDecimals_bn ))
    // console.log("mint_TA_deployer_tx_response.hash = ", mint_TA_deployer_tx_response.hash)


    const TA_deployer_0_balance_bn = await tokenA_Contract.balanceOf(deployer.address)
    const TA_deployer_0_balance = ethers.formatUnits(TA_deployer_0_balance_bn, TA_ContractDecimals_bn)
    // console.log("TA_deployer_0_balance = ", TA_deployer_0_balance)
    // TA_deployer_0_balance = 1000000000


    return { deployer, user, tokenA_Contract, 
            MultiTokenVaultContract,
            TA_ContractDecimals_bn };

  }

  describe("Deposit and withdraw ERC20 token and ether", function () {
    
    it("Should deposit and withdraw the right amount of ERC20 token;", async function () {
      const { user, deployer, tokenA_Contract, 
        MultiTokenVaultContract, TA_ContractDecimals_bn
            } = await loadFixture(deployMultiTokenVaultFixture);

      
      const approve_deployer_to_MTV_tx_response = await tokenA_Contract.connect(deployer)
                                        .approve( 
                                          MultiTokenVaultContract.target,
                                          ethers.parseUnits("1000", 
                                              TA_ContractDecimals_bn) 
                                             )
      // console.log("approve_deployer_to_MTV_tx_response.hash = ", approve_deployer_to_MTV_tx_response.hash)

      const TA_MTV_0_allowance_bn = await tokenA_Contract.allowance(deployer.address, MultiTokenVaultContract.target)
      const TA_MTV_0_allowance = ethers.formatUnits(TA_MTV_0_allowance_bn, TA_ContractDecimals_bn)
      // console.log("TA_MTV_0_allowance = ", TA_MTV_0_allowance)
      // TA_MTV_0_allowance =  1000.0

      // deposit

      const deposit_tx_response = await MultiTokenVaultContract.connect(deployer)
                                        .deposit(tokenA_Contract.target, 
                                          ethers.parseUnits("12", 
                                            TA_ContractDecimals_bn) 
                                             )
      // console.log("deposit_tx_response.hash = ", deposit_tx_response.hash)

      const TA_MTV_0_balance_bn = await tokenA_Contract.balanceOf(MultiTokenVaultContract.target)
      // console.log("TA_MTV_0_balance_bn = ", TA_MTV_0_balance_bn)
      const TA_MTV_0_balance = ethers.formatUnits(TA_MTV_0_balance_bn, TA_ContractDecimals_bn)
      console.log("TA_MTV_0_balance = ", TA_MTV_0_balance)

      const MTV_TA_0_deployer_balance_bn = await MultiTokenVaultContract.balanceOf(tokenA_Contract.target, deployer.address)
      // console.log("MTV_TA_0_deployer_balance_bn = ", MTV_TA_0_deployer_balance_bn)
      const MTV_TA_0_deployer_balance = ethers.formatUnits(MTV_TA_0_deployer_balance_bn, TA_ContractDecimals_bn)
      console.log("MTV_TA_0_deployer_balance = ", MTV_TA_0_deployer_balance)

      expect(MTV_TA_0_deployer_balance_bn).to.eq(TA_MTV_0_balance_bn)

      // withdraw

      const withdraw_tx_response = await MultiTokenVaultContract.connect(deployer)
                                        .withdraw(tokenA_Contract.target,
                                        ethers.parseUnits("12", 
                                          TA_ContractDecimals_bn)
                                        )
      // console.log("withdraw_tx_response.hash = ", withdraw_tx_response.hash)
      
      const TA_MTV_1_balance_bn = await tokenA_Contract.balanceOf(MultiTokenVaultContract.target)
      // console.log("TA_MTV_1_balance_bn = ", TA_MTV_1_balance_bn)
      const TA_MTV_1_balance = ethers.formatUnits(TA_MTV_1_balance_bn, TA_ContractDecimals_bn)
      console.log("TA_MTV_1_balance = ", TA_MTV_1_balance)
      

      const MTV_TA_1_deployer_balance_bn = await MultiTokenVaultContract.balanceOf(tokenA_Contract.target, deployer.address)
      // console.log("MTV_TA_1_deployer_balance_bn = ", MTV_TA_1_deployer_balance_bn)
      const MTV_TA_1_deployer_balance = ethers.formatUnits(MTV_TA_1_deployer_balance_bn, TA_ContractDecimals_bn)
      console.log("MTV_TA_1_deployer_balance = ", MTV_TA_1_deployer_balance)


      expect(TA_MTV_1_balance_bn).to.eq(BigInt("0"))
      expect(MTV_TA_1_deployer_balance_bn).to.eq(BigInt("0"))

    });


    it("Should deposit and withdraw the right amount of ether;", async function () {
      const { user, deployer, tokenA_Contract, 
        MultiTokenVaultContract, TA_ContractDecimals_bn
            } = await loadFixture(deployMultiTokenVaultFixture);

      // deposit ETH

      const deposit_eth_tx_response = await MultiTokenVaultContract.connect(user)
                                        .depositEth( 
                                          {value: ethers.parseUnits("1", 
                                            'ether')}
                                             )
      // console.log("deposit_eth_tx_response.hash = ", deposit_eth_tx_response.hash)

      const ETH_MTV_0_balance_bn = await ethers.provider.getBalance(MultiTokenVaultContract.target)
      // console.log("ETH_MTV_0_balance_bn = ", ETH_MTV_0_balance_bn)
      const ETH_MTV_0_balance = ethers.formatUnits(ETH_MTV_0_balance_bn, 'ether')
      console.log("ETH_MTV_0_balance = ", ETH_MTV_0_balance)

      const ETH_user_0_balance_bn = await ethers.provider.getBalance(user.address)
      // console.log("ETH_user_0_balance_bn = ", ETH_user_0_balance_bn)
      const ETH_user_0_balance = ethers.formatUnits(ETH_user_0_balance_bn, 'ether')
      console.log("ETH_user_0_balance = ", ETH_user_0_balance)
      

      const ETH_MTV_0_user_balance_bn = await MultiTokenVaultContract.balanceOfEth(user.address)
      // console.log("ETH_MTV_0_user_balance_bn = ", ETH_MTV_0_user_balance_bn)
      const ETH_MTV_0_user_balance = ethers.formatUnits(ETH_MTV_0_user_balance_bn, 'ether')
      console.log("ETH_MTV_0_user_balance = ", ETH_MTV_0_user_balance)

      expect(Number(ETH_user_0_balance)).to.lt(10000-1)
      expect(ETH_MTV_0_user_balance_bn).to.eq(ETH_MTV_0_balance_bn)

      // withdraw ETH

      const withdraw_eth_tx_response = await MultiTokenVaultContract.connect(user)
                                        .withdrawEth(
                                      ethers.parseUnits("1", 'ether'))
        
      // console.log("withdraw_eth_tx_response.hash = ", withdraw_eth_tx_response.hash)
 
      const ETH_MTV_1_balance_bn = await ethers.provider.getBalance(MultiTokenVaultContract.target)
      // console.log("ETH_MTV_1_balance_bn = ", ETH_MTV_1_balance_bn)
      const ETH_MTV_1_balance = ethers.formatUnits(ETH_MTV_1_balance_bn, 'ether')
      console.log("ETH_MTV_1_balance = ", ETH_MTV_1_balance)

      const ETH_user_1_balance_bn = await ethers.provider.getBalance(user.address)
      // console.log("ETH_user_1_balance_bn = ", ETH_user_1_balance_bn)
      const ETH_user_1_balance = ethers.formatUnits(ETH_user_1_balance_bn, 'ether')
      console.log("ETH_user_1_balance = ", ETH_user_1_balance)

      const ETH_MTV_1_user_balance_bn = await MultiTokenVaultContract.balanceOfEth(user.address)
      // console.log("ETH_MTV_1_user_balance_bn = ", ETH_MTV_1_user_balance_bn)
      const ETH_MTV_1_user_balance = ethers.formatUnits(ETH_MTV_1_user_balance_bn, 'ether')
      console.log("ETH_MTV_1_user_balance = ", ETH_MTV_1_user_balance)
 
      expect(Number(ETH_user_1_balance)).to.gt(10000-1)
      expect(ETH_MTV_1_balance_bn).to.eq(BigInt("0"))
      expect(ETH_MTV_1_user_balance_bn).to.eq(BigInt("0"))

    });

  });

});
