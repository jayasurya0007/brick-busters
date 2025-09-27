// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/// @title Identity Registry for KYC/AML verification
contract IdentityRegistry is Ownable {
    mapping(address => bool) private verifiedWallets;
    mapping(address => bool) private pendingVerifications;
    mapping(address => string) private kycDocuments;
    mapping(address => uint256) private verificationTimestamp;

    event WalletVerified(address indexed wallet);
    event WalletRevoked(address indexed wallet);
    event VerificationRequested(address indexed wallet, string kycDocument);
    event VerificationApproved(address indexed wallet);
    event VerificationRejected(address indexed wallet);

    // Admin functions
    function verifyWallet(address wallet) external onlyOwner {
        verifiedWallets[wallet] = true;
        pendingVerifications[wallet] = false;
        verificationTimestamp[wallet] = block.timestamp;
        emit WalletVerified(wallet);
    }

    function revokeWallet(address wallet) external onlyOwner {
        verifiedWallets[wallet] = false;
        pendingVerifications[wallet] = false;
        emit WalletRevoked(wallet);
    }

    // Self-service KYC functions
    function requestVerification(string memory kycDocument) external {
        require(!verifiedWallets[msg.sender], "Wallet already verified");
        require(!pendingVerifications[msg.sender], "Verification already pending");
        require(bytes(kycDocument).length > 0, "KYC document required");
        
        // Auto-verify after document upload
        verifiedWallets[msg.sender] = true;
        pendingVerifications[msg.sender] = false;
        kycDocuments[msg.sender] = kycDocument;
        verificationTimestamp[msg.sender] = block.timestamp;
        emit VerificationRequested(msg.sender, kycDocument);
        emit WalletVerified(msg.sender);
    }

    function approveVerification(address wallet) external onlyOwner {
        require(pendingVerifications[wallet], "No pending verification");
        verifiedWallets[wallet] = true;
        pendingVerifications[wallet] = false;
        verificationTimestamp[wallet] = block.timestamp;
        emit VerificationApproved(wallet);
    }

    function rejectVerification(address wallet) external onlyOwner {
        require(pendingVerifications[wallet], "No pending verification");
        pendingVerifications[wallet] = false;
        delete kycDocuments[wallet];
        emit VerificationRejected(wallet);
    }

    // View functions
    function isVerified(address wallet) external view returns (bool) {
        return verifiedWallets[wallet];
    }

    function isPendingVerification(address wallet) external view returns (bool) {
        return pendingVerifications[wallet];
    }

    function getKycDocument(address wallet) external view returns (string memory) {
        return kycDocuments[wallet];
    }

    function getVerificationTimestamp(address wallet) external view returns (uint256) {
        return verificationTimestamp[wallet];
    }

    function getVerificationStatus(address wallet) external view returns (
        bool verified,
        bool pending,
        string memory kycDoc,
        uint256 timestamp
    ) {
        return (
            verifiedWallets[wallet],
            pendingVerifications[wallet],
            kycDocuments[wallet],
            verificationTimestamp[wallet]
        );
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
        uint256 propertyValue; // Property valuation in wei
        uint256 totalTokens; // Total tokens to be minted
        uint256 tokenPrice; // Price per token in wei
        bool isActive; // Whether property is active for trading
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
    event PropertyAdded(uint256 indexed propertyId, string name, string symbol, address tokenAddress, address creator, uint256 propertyValue, uint256 totalTokens, uint256 tokenPrice);
    event TokensMinted(uint256 indexed propertyId, address indexed to, uint256 amount);
    event TokensPurchased(uint256 indexed propertyId, address indexed buyer, uint256 amount, uint256 totalCost);
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
        bytes32 kycDocHash_,
        uint256 propertyValue_,
        uint256 totalTokens_
    ) external onlyOwner whenNotPaused returns (uint256) {
        require(creator_ != address(0), "Invalid creator");
        require(propertyValue_ > 0, "Invalid property value");
        require(totalTokens_ > 0, "Invalid total tokens");

        uint256 propertyId = nextPropertyId++;
        uint256 tokenPrice = propertyValue_ / totalTokens_; // Price per token
        
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
            tokenContract: token,
            propertyValue: propertyValue_,
            totalTokens: totalTokens_,
            tokenPrice: tokenPrice,
            isActive: true
        });

        emit PropertyAdded(propertyId, name_, symbol_, address(token), creator_, propertyValue_, totalTokens_, tokenPrice);
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

    /// @notice Buy tokens directly from the property creator
    function buyTokens(uint256 propertyId, uint256 amount) external payable whenNotPaused onlyVerified(msg.sender) {
        Property storage prop = properties[propertyId];
        require(address(prop.tokenContract) != address(0), "Property not found");
        require(prop.isActive, "Property not active for trading");
        
        uint256 totalCost = prop.tokenPrice * amount;
        require(msg.value >= totalCost, "Insufficient payment");
        
        // Check if creator has enough tokens to sell
        uint256 creatorBalance = prop.tokenContract.balanceOf(prop.creator);
        require(creatorBalance >= amount, "Insufficient tokens available");
        
        // Transfer tokens from creator to buyer
        prop.tokenContract.transferFrom(prop.creator, msg.sender, amount);
        
        // Transfer payment to creator
        payable(prop.creator).transfer(totalCost);
        
        // Refund excess payment
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
        
        emit TokensPurchased(propertyId, msg.sender, amount, totalCost);
    }

    /// @notice Get property market data
    function getPropertyMarketData(uint256 propertyId) external view returns (
        uint256 propertyValue,
        uint256 totalTokens,
        uint256 tokenPrice,
        uint256 availableTokens,
        bool isActive
    ) {
        Property storage prop = properties[propertyId];
        require(address(prop.tokenContract) != address(0), "Property not found");
        
        uint256 creatorBalance = prop.tokenContract.balanceOf(prop.creator);
        
        return (
            prop.propertyValue,
            prop.totalTokens,
            prop.tokenPrice,
            creatorBalance,
            prop.isActive
        );
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
