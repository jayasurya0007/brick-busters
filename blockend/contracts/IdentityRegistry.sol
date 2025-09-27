// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/// @title Identity Registry for KYC/AML verification
contract IdentityRegistry is Ownable {
    mapping(address => bool) private verifiedWallets;

    event WalletVerified(address indexed wallet);
    event WalletRevoked(address indexed wallet);

    function verifyWallet(address wallet) external onlyOwner {
        verifiedWallets[wallet] = true;
        emit WalletVerified(wallet);
    }

    function revokeWallet(address wallet) external onlyOwner {
        verifiedWallets[wallet] = false;
        emit WalletRevoked(wallet);
    }

    function isVerified(address wallet) external view returns (bool) {
        return verifiedWallets[wallet];
    }
}

/// @title Compliance Module enforcing transfer rules
contract ComplianceModule is Ownable {
    IdentityRegistry public identityRegistry;

    event ComplianceModuleUpdated(address indexed newModule);

    constructor(address _identityRegistry) {
        identityRegistry = IdentityRegistry(_identityRegistry);
    }

    function checkCompliance(address to) public view returns (bool) {
        return identityRegistry.isVerified(to);
    }

    function setIdentityRegistry(address _identityRegistry) external onlyOwner {
        identityRegistry = IdentityRegistry(_identityRegistry);
        emit ComplianceModuleUpdated(_identityRegistry);
    }
}

/// @title ERC20 token representing fractional ownership of one property with transfer restrictions
contract PropertyERC20 is ERC20, Ownable, Pausable {
    ComplianceModule public complianceModule;
    IdentityRegistry public identityRegistry;

    modifier onlyVerified(address wallet) {
        require(identityRegistry.isVerified(wallet), "Wallet not verified");
        _;
    }

    constructor(
        string memory name_,
        string memory symbol_,
        address identityRegistry_,
        address complianceModule_
    ) ERC20(name_, symbol_) {
        identityRegistry = IdentityRegistry(identityRegistry_);
        complianceModule = ComplianceModule(complianceModule_);
    }

    /// @notice Mint tokens to a verified wallet, callable only by owner/property creator
    function mint(address to, uint256 amount) external onlyOwner whenNotPaused onlyVerified(to) {
        _mint(to, amount);
    }

    /// @notice Transfer compliance and verification check
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);

        if (from == address(0) || to == address(0)) return; // mint or burn

        require(identityRegistry.isVerified(from), "Sender wallet not verified");
        require(identityRegistry.isVerified(to), "Recipient wallet not verified");
        require(complianceModule.checkCompliance(to), "Compliance check failed");
    }

    function setComplianceModule(address newModule) external onlyOwner {
        complianceModule = ComplianceModule(newModule);
    }

    function setIdentityRegistry(address newRegistry) external onlyOwner {
        identityRegistry = IdentityRegistry(newRegistry);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}

/// @title Multi-property manager with revenue distribution supporting ETH and ERC20 tokens
contract MultiPropertyTokenManager is Ownable, Pausable {
    IdentityRegistry public identityRegistry;
    ComplianceModule public complianceModule;

    // Property metadata & associated token contract
    struct Property {
        string name;
        string symbol;
        address creator; // authorized to mint tokens for property
        bytes32 deedHash;
        bytes32 appraisalHash;
        bytes32 kycDocHash;
        PropertyERC20 tokenContract;
    }

    uint256 public nextPropertyId = 1;
    mapping(uint256 => Property) public properties;

    // Revenue tracking per property and token type
    // ETH revenue
    mapping(uint256 => uint256) public totalEthRevenue;
    mapping(uint256 => mapping(address => uint256)) public withdrawnEthRevenue;

    // ERC20 revenue: propertyId => ERC20 token address => total deposited
    mapping(uint256 => mapping(address => uint256)) public totalTokenRevenue;
    mapping(uint256 => mapping(address => mapping(address => uint256))) public withdrawnTokenRevenue;

    // Events
    event PropertyAdded(uint256 indexed propertyId, string name, string symbol, address tokenAddress, address creator);
    event TokensMinted(uint256 indexed propertyId, address indexed to, uint256 amount);
    event EthRevenueDeposited(uint256 indexed propertyId, uint256 amount);
    event EthRevenueWithdrawn(uint256 indexed propertyId, address indexed wallet, uint256 amount);
    event TokenRevenueDeposited(uint256 indexed propertyId, address indexed token, uint256 amount);
    event TokenRevenueWithdrawn(uint256 indexed propertyId, address indexed wallet, address indexed token, uint256 amount);

    constructor(address identityRegistry_, address complianceModule_) {
        identityRegistry = IdentityRegistry(identityRegistry_);
        complianceModule = ComplianceModule(complianceModule_);
    }

    modifier onlyVerified(address wallet) {
        require(identityRegistry.isVerified(wallet), "Wallet not verified");
        _;
    }

    modifier onlyCreator(uint256 propertyId) {
        require(properties[propertyId].creator == msg.sender, "Not property creator");
        _;
    }

    /// @notice Add property and deploy token contract, assign creator for mint control
    function addProperty(
        string memory name_,
        string memory symbol_,
        address creator_,
        bytes32 deedHash_,
        bytes32 appraisalHash_,
        bytes32 kycDocHash_
    ) external onlyOwner whenNotPaused returns (uint256) {
        require(creator_ != address(0), "Invalid creator");

        uint256 propertyId = nextPropertyId++;
        PropertyERC20 token = new PropertyERC20(
            name_,
            symbol_,
            address(identityRegistry),
            address(complianceModule)
        );
        token.transferOwnership(creator_);

        properties[propertyId] = Property({
            name: name_,
            symbol: symbol_,
            creator: creator_,
            deedHash: deedHash_,
            appraisalHash: appraisalHash_,
            kycDocHash: kycDocHash_,
            tokenContract: token
        });

        emit PropertyAdded(propertyId, name_, symbol_, address(token), creator_);
        return propertyId;
    }

    /// @notice Mint tokens only by property creator or owner
    function mintTokens(uint256 propertyId, address to, uint256 amount) external whenNotPaused onlyVerified(to) {
        Property storage prop = properties[propertyId];
        require(address(prop.tokenContract) != address(0), "Property not found");
        require(msg.sender == prop.creator || msg.sender == owner(), "Unauthorized");

        prop.tokenContract.mint(to, amount);
        emit TokensMinted(propertyId, to, amount);
    }

    /// @notice Deposit ETH revenue for property
    function depositEthRevenue(uint256 propertyId) external payable onlyOwner whenNotPaused {
        require(msg.value > 0, "Zero deposit");
        require(address(properties[propertyId].tokenContract) != address(0), "Property not exist");

        totalEthRevenue[propertyId] += msg.value;
        emit EthRevenueDeposited(propertyId, msg.value);
    }

    /// @notice Calculate ETH withdrawable revenue for wallet
    function availableEthRevenue(uint256 propertyId, address wallet) public view returns (uint256) {
        if (!identityRegistry.isVerified(wallet)) return 0;
        Property storage prop = properties[propertyId];
        if (address(prop.tokenContract) == address(0)) return 0;

        uint256 holderBalance = prop.tokenContract.balanceOf(wallet);
        if (holderBalance == 0) return 0;

        uint256 entitled = (totalEthRevenue[propertyId] * holderBalance) / prop.tokenContract.totalSupply();
        uint256 withdrawn = withdrawnEthRevenue[propertyId][wallet];
        if (entitled <= withdrawn) return 0;
        return entitled - withdrawn;
    }

    /// @notice Withdraw ETH revenue
    function withdrawEthRevenue(uint256 propertyId) external whenNotPaused onlyVerified(msg.sender) {
        uint256 payout = availableEthRevenue(propertyId, msg.sender);
        require(payout > 0, "No ETH revenue");

        withdrawnEthRevenue[propertyId][msg.sender] += payout;
        payable(msg.sender).transfer(payout);
        emit EthRevenueWithdrawn(propertyId, msg.sender, payout);
    }

    /// @notice Deposit ERC20 token revenue for property
    function depositTokenRevenue(uint256 propertyId, address token, uint256 amount) external whenNotPaused onlyOwner {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Zero amount");
        require(address(properties[propertyId].tokenContract) != address(0), "Property not exist");

        bool success = IERC20(token).transferFrom(msg.sender, address(this), amount);
        require(success, "ERC20 transfer failed");

        totalTokenRevenue[propertyId][token] += amount;
        emit TokenRevenueDeposited(propertyId, token, amount);
    }

    /// @notice Calculate ERC20 withdrawable revenue for a wallet
    function availableTokenRevenue(uint256 propertyId, address token, address wallet) public view returns (uint256) {
        if (!identityRegistry.isVerified(wallet)) return 0;
        Property storage prop = properties[propertyId];
        if (address(prop.tokenContract) == address(0)) return 0;

        uint256 holderBalance = prop.tokenContract.balanceOf(wallet);
        if (holderBalance == 0) return 0;

        uint256 entitled = (totalTokenRevenue[propertyId][token] * holderBalance) / prop.tokenContract.totalSupply();
        uint256 withdrawn = withdrawnTokenRevenue[propertyId][token][wallet];
        if (entitled <= withdrawn) return 0;
        return entitled - withdrawn;
    }

    /// @notice Withdraw ERC20 revenue
    function withdrawTokenRevenue(uint256 propertyId, address token) external whenNotPaused onlyVerified(msg.sender) {
        uint256 payout = availableTokenRevenue(propertyId, token, msg.sender);
        require(payout > 0, "No token revenue");

        withdrawnTokenRevenue[propertyId][token][msg.sender] += payout;
        bool success = IERC20(token).transfer(msg.sender, payout);
        require(success, "ERC20 transfer failed");

        emit TokenRevenueWithdrawn(propertyId, msg.sender, token, payout);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Get property document hashes
    function getPropertyHashes(uint256 propertyId) external view returns (bytes32, bytes32, bytes32) {
        Property storage prop = properties[propertyId];
        return (prop.deedHash, prop.appraisalHash, prop.kycDocHash);
    }
}
