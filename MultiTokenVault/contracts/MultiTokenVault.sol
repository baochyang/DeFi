// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

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



contract MultiTokenVault {
  
    mapping(address => uint256) public totalSupply;
    mapping(address => mapping(address => uint256)) public balanceOf;

    uint256 public totalSupplyEth;
    mapping(address => uint256) public balanceOfEth;

    function _mint(address tokenAddress, address _to, uint256 _shares) private {
        totalSupply[tokenAddress] += _shares;
        balanceOf[tokenAddress][_to] += _shares;
    }

    function _mintEth(address _to, uint256 _shares) private {
        totalSupplyEth += _shares;
        balanceOfEth[_to] += _shares;
    }

    function _burn(address tokenAddress, address _from, uint256 _shares) private {
        totalSupply[tokenAddress] -= _shares;
        balanceOf[tokenAddress][_from] -= _shares;
    }

    function _burnEth(address _from, uint256 _shares) private {
        totalSupplyEth -= _shares;
        balanceOfEth[_from] -= _shares;
    }


    function deposit(address tokenAddress, uint256 _amount) external {
        
        uint256 shares;
        if (totalSupply[tokenAddress] == 0) {
            shares = _amount;
        } else {
            shares = (_amount * totalSupply[tokenAddress]) / IERC20(tokenAddress).balanceOf(address(this));
        }

        _mint(tokenAddress,msg.sender, shares);
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), _amount);
    }


    function depositEth() payable external {

      require(msg.value >0, "no ether deposited");

        uint256 shares;
        if (totalSupplyEth == 0) {
            shares = msg.value;
        } else {
            shares = (msg.value * totalSupplyEth) / address(this).balance;
        }

        _mintEth(msg.sender, shares);
    }

    function withdraw(address tokenAddress, uint256 _shares) external {
        
        uint256 amount =
            (_shares * IERC20(tokenAddress).balanceOf(address(this))) / totalSupply[tokenAddress];
        _burn(tokenAddress, msg.sender, _shares);
        IERC20(tokenAddress).transfer(msg.sender, amount);
    }

    function withdrawEth(uint256 _shares) external {
        
        uint256 amount =
            (_shares * address(this).balance) / totalSupplyEth;

        _burnEth(msg.sender, _shares);

        (bool success, bytes memory data)= msg.sender.call{value: amount}("");
        require(success && data.length == 0, 'ether send fail');

    }

}



