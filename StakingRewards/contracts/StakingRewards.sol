// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;


import "./console.sol";


interface IERC20 {
    function totalSupply() external view returns (uint);
    function balanceOf(address account) external view returns (uint);
    function transfer(address recipient, uint amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint);
    function approve(address spender, uint amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint amount) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint value);
    event Approval(address indexed owner, address indexed spender, uint value);
}

contract StakingRewards {
    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardsToken;

    address public owner;

    // Duration of rewards to be paid out (in seconds)
    uint256 public duration;

    // Timestamp of when the rewards ends
    uint256 public RewardsEndAt;

    // Minimum of last updated time and reward ends time
    uint256 public lastUpdate;

    // Reward to be paid out per second
    uint256 public rewardRate;

    // Sum of (reward rate * delta time period * MULTIPLIER / total supply)
    uint256 public rewardPerTokenUpdated;

    // User address => rewardPerTokenUpdated
    mapping(address => uint256) public userRewardPerTokenPaid;

    // User address => rewards to be claimed
    mapping(address => uint256) public rewards;

    // Total staked
    uint256 public totalSupply;

    uint256 private constant MULTIPLIER = 1e18;

    // User address => staked amount
    mapping(address => uint256) public balanceOf;

    constructor(address _stakingToken, address _rewardToken) {
        owner = msg.sender;
        stakingToken = IERC20(_stakingToken);
        rewardsToken = IERC20(_rewardToken);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }


    function rewardPerToken() public view returns (uint256) {
        if (totalSupply == 0) {
            return rewardPerTokenUpdated;
        }

        return rewardPerTokenUpdated +
            (rewardRate * ((RewardsEndAt <= block.timestamp ? RewardsEndAt : block.timestamp) - lastUpdate) * MULTIPLIER)
                / totalSupply;

    }

    function stake(uint256 _amount) external {

        require(_amount > 0, "amount = 0");

        rewardPerTokenUpdated = rewardPerToken();
        lastUpdate = (RewardsEndAt <= block.timestamp ? RewardsEndAt : block.timestamp);

        if (msg.sender != address(0)) {
            rewards[msg.sender] = (
                (balanceOf[msg.sender]
                        * (rewardPerTokenUpdated - userRewardPerTokenPaid[msg.sender])
                ) / MULTIPLIER
            ) + rewards[msg.sender];
        
            userRewardPerTokenPaid[msg.sender] = rewardPerTokenUpdated;
        }

        stakingToken.transferFrom(msg.sender, address(this), _amount);
        balanceOf[msg.sender] += _amount;
        totalSupply += _amount;
        console.log("block.timestamp from contract = ", block.timestamp);
    }

    function withdraw(uint256 _amount) external  {
        require(_amount > 0, "amount = 0");

        rewardPerTokenUpdated = rewardPerToken();
        lastUpdate = (RewardsEndAt <= block.timestamp ? RewardsEndAt : block.timestamp);

        if (msg.sender != address(0)) {
            rewards[msg.sender] = (
                (balanceOf[msg.sender]
                        * (rewardPerTokenUpdated - userRewardPerTokenPaid[msg.sender])
                ) / MULTIPLIER
            ) + rewards[msg.sender];
        
            userRewardPerTokenPaid[msg.sender] = rewardPerTokenUpdated;
        }

        balanceOf[msg.sender] -= _amount;
        totalSupply -= _amount;
        stakingToken.transfer(msg.sender, _amount);

        console.log("block.timestamp from contract = ", block.timestamp);

    }

    function earned(address _account) public view returns (uint256) {
        return (
            ( balanceOf[_account]
                    * (rewardPerToken() - userRewardPerTokenPaid[_account])
            ) / MULTIPLIER
        ) + rewards[_account];
    }

    function getReward() external {
        rewardPerTokenUpdated = rewardPerToken();
        lastUpdate = (RewardsEndAt <= block.timestamp ? RewardsEndAt : block.timestamp);

        rewards[msg.sender] = earned(msg.sender);
        userRewardPerTokenPaid[msg.sender] = rewardPerTokenUpdated;
        
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardsToken.transfer(msg.sender, reward);
        }
    }

    function setRewardsDuration(uint256 _duration) external onlyOwner {
        require(RewardsEndAt < block.timestamp, "reward duration not ended");
        duration = _duration;
    }

    function notifyRewardAmount(uint256 _amount) external onlyOwner  
    {
        rewardPerTokenUpdated = rewardPerToken();
        lastUpdate = (RewardsEndAt <= block.timestamp ? RewardsEndAt : block.timestamp);

        if (block.timestamp >= RewardsEndAt) {
            rewardRate = _amount / duration;
        } else {
            uint256 remainingRewards = (RewardsEndAt - block.timestamp) * rewardRate;
            rewardRate = (_amount + remainingRewards) / duration;
        }

        require(rewardRate > 0, "reward rate = 0");
        require(
            rewardRate * duration <= rewardsToken.balanceOf(address(this)),
            "reward amount > balance"
        );

        RewardsEndAt = block.timestamp + duration;
        lastUpdate = block.timestamp;
    }

}

contract ERC20 is IERC20 {

    mapping(address => uint) public balanceOf;
    mapping(address => mapping(address => uint)) public allowance;

    uint public totalSupply;
    
    address public owner;

    string public name;
    string public symbol;
    uint8 public decimals;

    constructor(string memory _name, 
                string memory _symbol, 
                uint8 _decimals){

                name = _name;
                symbol = _symbol;
                decimals = _decimals;  
                owner = msg.sender;   
        }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function approve(address spender, uint amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address recipient, uint amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[recipient] += amount;
        emit Transfer(msg.sender, recipient, amount);
        return true;
    }

    function transferFrom(
        address sender,
        address recipient,
        uint amount
    ) external returns (bool) {
        allowance[sender][msg.sender] -= amount;
        balanceOf[sender] -= amount;
        balanceOf[recipient] += amount;
        emit Transfer(sender, recipient, amount);
        return true;
    }

    function mint(uint amount) public onlyOwner {
        balanceOf[msg.sender] += amount;
        totalSupply += amount;
        emit Transfer(address(0), msg.sender, amount);
    }


}




