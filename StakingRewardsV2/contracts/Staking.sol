// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function totalSupply() external view returns (uint);
    function balanceOf(address account) external view returns (uint);
    function transfer(address recipient, uint amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint);
    function approve(address spender, uint amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint amount) external returns (bool);
    function decimals() external view returns (uint8);

    event Transfer(address indexed from, address indexed to, uint value);
    event Approval(address indexed owner, address indexed spender, uint value);
}

contract Staking {
    IERC20 public immutable stakeToken;

    address public owner;
    uint public totalStakedAmount;
    uint public totalUnStakedAmount;

    // stake min 2000
    // 14 days, 90% APR, Pool Limit: 20,000,000
    // 30 days, 120% APR, Pool Limit: 20,000,000

    uint constant INVALID_INDEX=999;
    uint constant Two_WeekPoolLimit=20*10**6;// 20,000,000
    uint constant One_MonthPoolLimit=20*10**6;// 20,000,000

    uint constant minAmount = 2000;
    uint totalStaker;

    uint[2] public stakedPool = [0,0];
    uint[2] public APR = [90,120];


    struct StakerInfo {
        uint amount;
        uint releaseDate;
        bool isRelease;
        uint rewardDebt;
        uint termOption;
    }

    event Stake(address indexed _from, uint _duration, uint _value);
    event UnStake(address indexed _from, uint _duration, uint _value);

    mapping(address => StakerInfo[]) public stakers;

    uint256 private constant MULTIPLIER = 1e18;

    constructor(address _stakeToken) {
        owner = msg.sender;
        stakeToken = IERC20(_stakeToken);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    function getStakedPoolIndex(uint _termOption) public pure returns(uint){
        if(_termOption == 14){
            return 0;
        }

        if(_termOption == 30) return 1;

        return INVALID_INDEX; 
        
    }

    function twoWeekPoolRemain() public view returns(uint) {
        return Two_WeekPoolLimit*10**stakeToken.decimals()-stakedPool[0];
    }

    function oneMonthPoolRemain() public view returns(uint) {
        return One_MonthPoolLimit*10**stakeToken.decimals()-stakedPool[1];
    }

    modifier underTwoWeekPoolRemain(uint _amount){
        require(twoWeekPoolRemain() >= _amount, "Two week pool limit reached");
        _;
    }

    modifier underOneMonthPoolRemain(uint _amount){
        require(oneMonthPoolRemain() >= _amount, "One month pool limit reached");
        _;
    }

    function stake(uint _amount, uint _termOption) internal {
        require(_amount >= minAmount*10**stakeToken.decimals(), "Stake amount invalid");
        uint stakedPoolIndex = getStakedPoolIndex(_termOption);

        require(stakedPoolIndex!=INVALID_INDEX, "Invalid term option");
        require(stakeToken.balanceOf(msg.sender) >= _amount, "Insufficient balance");
        require(stakeToken.allowance(msg.sender, address(this)) >= _amount, "Insufficient allowance");

        StakerInfo memory staker = StakerInfo(
                                    _amount, 
                                    block.timestamp + _termOption*1 days,
                                    false,
                                    _termOption*_amount*APR[stakedPoolIndex]*MULTIPLIER/100/365,
                                    _termOption
                                    );

        stakers[msg.sender].push(staker);
        stakeToken.transferFrom(msg.sender, address(this), _amount);
        totalStakedAmount += _amount;
        stakedPool[stakedPoolIndex] += _amount;
        totalStaker += 1;

        emit Stake(msg.sender, _termOption, _amount);
    }

    function unStake(uint _index) public {
        require(_index<stakers[msg.sender].length, "Index out of bounds");
        StakerInfo storage staker = stakers[msg.sender][_index];
        require(staker.releaseDate <= block.timestamp, "You cannot unstake before release date");
        require(staker.amount >0, "Stake amount must be greater than zero");
        require(staker.isRelease == false, "Stake has already been released");
        
        uint willPaid = staker.amount + staker.rewardDebt/MULTIPLIER;

        require(willPaid <= stakeToken.balanceOf(address(this)), "Insufficient balance");
        require(staker.isRelease == false, "staked amount already released");

        staker.isRelease = true;
        stakeToken.transfer(msg.sender, willPaid);
        totalStakedAmount -= staker.amount;
        stakedPool[getStakedPoolIndex(staker.termOption)] -= staker.amount;

        totalStaker -= 1;

        emit UnStake(msg.sender, staker.termOption, staker.amount);


    }

    function twoWeekStake(uint _amount) underTwoWeekPoolRemain(_amount) public {
        stake(_amount, 14);
    }

    function oneMonthStake(uint _amount) underOneMonthPoolRemain(_amount) public {
        stake(_amount, 30);
    }

    function getStakerInfo(address _staker) public view returns(StakerInfo[] memory){
        return stakers[_staker];
    }

    function getStakerInfo(address _staker, uint from, uint to) 
        public view returns(StakerInfo[]memory){
            StakerInfo[] memory stakerInfor = stakers[_staker];
            require(0<=from && from < stakerInfor.length, "Invalid from index");
            require(0<=to && to < stakerInfor.length, "Invalid to index");

            uint length = to - from + 1;
            StakerInfo[] memory result = new StakerInfo[](length);
            for (uint i = from; i <= to; i++){
                result[i-from]=stakerInfor[i];
            }

            return result;
    }

    function getStakerInfoByTermOption(address _staker, 
            uint _termOption, 
            uint from, 
            uint to) public view returns (StakerInfo[] memory) {

            StakerInfo[] memory stakerInfo = stakers[_staker];
            require(from<to, "From must be less than To");

            uint length;

            for (uint i = 0; i< stakerInfo.length; i++){
                if(stakerInfo[i].termOption == _termOption){
                    length++;
                } 
            }

            require(0<=from && from < length, "Invalid from index");
            require(0<=to && to < length, "Invalid to index");

            uint count = 0; 
            uint index = 0;

            StakerInfo[] memory result = new StakerInfo[](to-from+1);
            for (uint i = 0; i<stakerInfo.length; i++){
                if(stakerInfo[i].termOption == _termOption){
                    if(from<=count&&count<=to){
                        result[index++] = stakerInfo[i];
                    }
                    if(count==to){
                        break;
                    }
                    count++;
                }
            }

            return result;

        }


    function getStakerInfoByRelease(address _staker, 
            bool _isRelease, 
            uint from, 
            uint to) public view returns (StakerInfo[] memory) {
            StakerInfo[] memory stakerInfo = stakers[_staker];
            require(from<to, "From must be less than To");

            uint length;
            for (uint i = 0; i< stakerInfo.length; i++){
                if(stakerInfo[i].isRelease == _isRelease){
                    length++; 
                } 
            }

            require(0<=from && from < length, "Invalid from index");
            require(0<=to && to < length, "Invalid to index");

            uint count = 0; 
            uint index = 0;

            StakerInfo[] memory result = new StakerInfo[](to-from+1);

            for (uint i = 0; i<stakerInfo.length; i++){
                if(stakerInfo[i].isRelease == _isRelease){
                    if(from<=count&&count<=to){
                        result[index++] = stakerInfo[i];
                    }
                    if(count==to){
                        break;
                    }
                    count++;
                }
            }

            return result;

        }


        function getStakerInfoByTermOptionAndRelease(address _staker, 
            uint _termOption,
            bool _isRelease, 
            uint from, 
            uint to) public view returns (StakerInfo[] memory) {
            StakerInfo[] memory stakerInfo = stakers[_staker];
            require(from<to, "From must be less than To");

            uint length;
            for (uint i = 0; i< stakerInfo.length; i++){
                if(stakerInfo[i].isRelease == _isRelease && stakerInfo[i].termOption == _termOption){
                    length++;
                } 
            }

            require(0<=from && from < length, "Invalid from index");
            require(0<=to && to < length, "Invalid to index");

            uint count = 0; 
            uint index = 0;

            StakerInfo[] memory result = new StakerInfo[](to-from+1);

            for (uint i = 0; i<stakerInfo.length; i++){
                if(stakerInfo[i].isRelease == _isRelease && stakerInfo[i].termOption == _termOption){
                    if(from<=count&&count<=to){
                        result[index++] = stakerInfo[i];
                    }
                    if(count==to){
                        break;
                    }
                    count++;
                }
            }

            return result;

        }

        function getDetailStakedPool() public view returns(uint[2] memory){
            return stakedPool;
        }

        function totalStakeByAddress(address _address) public view returns(uint){
            uint total;
            StakerInfo[] storage staker = stakers[_address];
            for (uint i=0; i<staker.length; i++){
                if(staker[i].isRelease == false){
                    total += staker[i].amount;
                }
            }

            return total;
        }


        function totalRewardDebtByAddress(address _address) public view returns (uint){
            uint total;
            StakerInfo[] storage staker = stakers[_address];
            for(uint i=0; i<staker.length; i++){
                if(staker[i].isRelease == true){
                    total += staker[i].rewardDebt/MULTIPLIER;
                } 
            }

            return total;
        }


        function getStakeCount(address _address) public view returns (uint){
            uint total;
            StakerInfo[] storage staker = stakers[_address];
            for(uint i=0; i<staker.length; i++){
                if(staker[i].isRelease == false){
                    total += 1;
                } 
            }

            return total;
        }

        function getStakeInfo(address _staker, uint _index) public view returns(uint, uint, bool, uint){
            StakerInfo memory staker = stakers[_staker][_index];
            return (staker.amount, staker.releaseDate, staker.isRelease, staker.rewardDebt/MULTIPLIER);
        }

        function totalStakerInfoByTermOption(address _staker, uint _termOption) public view returns(uint){
            uint total;
            StakerInfo[] storage staker = stakers[_staker];
            for(uint i = 0; i<staker.length;i++){
                if(staker[i].termOption == _termOption){
                    total++;
                } 
            }

            return total;
        }

        function totalStakerInfoByTermOptionAndRelease(address _staker, uint _termOption, bool _isRelease) public view returns(uint){
            uint total;
            StakerInfo[] storage staker = stakers[_staker];
            for(uint i = 0; i<staker.length;i++){
                if(staker[i].termOption == _termOption && staker[i].isRelease == _isRelease){
                    total++;
                } 
            }

            return total;
        }


        function totalStakerInfoByRelease(address _staker, bool _isRelease) public view returns(uint){
            uint total;
            StakerInfo[] storage staker = stakers[_staker];
            for(uint i = 0; i<staker.length;i++){
                if(staker[i].isRelease == _isRelease){
                    total++;
                } 
            }

            return total;
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




