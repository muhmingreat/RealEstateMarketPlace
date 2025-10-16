// //  SPDX-License-Identifier: MIT
// pragma solidity ^0.8.24;

// // OpenZeppelin
// import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
// import "@openzeppelin/contracts/utils/Address.sol";

// // Chainlink price feed interface (kept for price data)
// import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

// import "./IKYCVerifier.sol";
// import "./RealEstateNft.sol";

// /// @notice Minimal interface for a mock oracle (optional)
// interface IMockOracle {
//     function mockRequestDocs(uint256 propertyId, string calldata docsHash) external returns (bytes32);
// }

// /**
//  * @title RealEstate
//  * @dev Refactored: removed ChainlinkClient dependency. Document verification remains
//  *      but the contract expects an external actor (mock or oracle) to call fulfill(...)
//  *      with the (requestId, verified, docHash) tuple.
//  */
// contract RealEstate is ReentrancyGuard {
//     using Address for address;

//     address public admin;
//     AggregatorV3Interface internal pricefeed;
//     IKYCVerifier public kycVerifier;
//     RealEstateNFT public propertyNFT;

//     // Chainlink-like config (kept for compatibility / off-chain coordination)
//     address public chainlinkOracle; // address allowed to call fulfill in "prod" mode
//     bytes32 public chainlinkJobId;
//     uint256 public chainlinkFee;

//     // Mock oracle support
//     bool public useMock; // when true, use mockOracle.mockRequestDocs to generate requestIds
//     IMockOracle public mockOracle;

//     // map requestId -> propertyId
//     mapping(bytes32 => uint256) private requestToProperty;

//     // -------------------------
//     // Structs (kept same as original)
//     // -------------------------
//     struct Property {
//         uint256 productID;
//         address payable owner;
//         uint256 nftId;
//         uint256 price; 
//         string propertyTitle;
//         string category;
//         string[] images;
//         string propertyAddress;
//         string description;
//         address[] reviewers;
//         string[] reviews;
//         bool sold;
//         string metadataURI; // IPFS/URI for docs

//         // verification & lifecycle
//         bool verified;        // set by oracle/admin
//         uint256 verifiedAt;
//         bytes32 verifiedDocHash; // doc hash returned by verifier (optional)
//         uint256 soldAt;
//         bool deleted;         // soft-delete flag
//     }

//     struct Escrow {
//         address buyer;
//         uint256 amount;
//         bool confirmed;
//         bool refunded;
//         uint256 createdAt;
//         uint256 expiresAt;
//     }

//     struct Review {
//         address reviewer;
//         uint256 productId;
//         uint256 rating;
//         string comment;
//         uint256 likes;
//     }

//     struct Product {
//         uint256 productId;
//         uint256 totalRating;
//         uint256 numReviews;
//     }

//     // -------------------------
//     // Storage (kept same)
//     // -------------------------
//     mapping(uint256 => Property) private properties;
//     mapping(uint256 => Escrow) public escrows;
//     mapping(uint256 => Product) private products;
//     mapping(uint256 => Review[]) private reviews;
//     mapping(address => uint256[]) private userReviews;
//     mapping(uint256 => mapping(address => bool)) public hasLikedReview;

//     mapping(uint256 => bool) public verifiedDocMinted; 

//     uint256 public propertyIndex;
//     uint256 public reviewsCounter;

//     // ===== Escrow timing =====
//     uint256 public constant MAX_ESCROW_DURATION = 15 minutes;
//     uint256 public constant MIN_ESCROW_DURATION = 10 minutes;

//     // retention period for cleanup (optional)
//     uint256 public constant RETENTION_PERIOD = 30 days;

//     // ===== events =====
//     event PropertyListed(uint256 indexed id, address indexed owner, uint256 price);
//     event PaymentDeposited(uint256 indexed id, address indexed buyer, uint256 amount, uint256 expiresAt);
//     event PropertySold(uint256 indexed id, address indexed oldOwner, address indexed newOwner, uint256 price);
//     event ReviewAdded(uint256 indexed productId, address indexed reviewer, uint256 rating, string comment);
//     event ReviewLiked(uint256 indexed productId, uint256 indexed reviewIndex, address indexed liker, uint256 likes);
//     event DisputeResolved(uint256 indexed id, address recipient, bool refunded);
//     event PropertyDeleted(uint256 indexed propertyId);
//     event NFTMinted(uint256 indexed nftId, address indexed owner, uint256 indexed propertyId);

//     // verification events
//     event DocsVerificationRequested(uint256 indexed propertyId, string docsHash, bytes32 requestId);
//     event DocumentsVerified(uint256 indexed propertyId, bool status, bytes32 docHash);
//     event BuyerAlerted(uint256 indexed propertyId, address indexed buyer);
//     event DocumentNFTMinted(uint256 indexed propertyId, uint256 indexed docNftId, address indexed buyer);

//     // -------------------------
//     // Modifiers
//     // -------------------------
//     modifier validProperty(uint256 id) {
//         require(id < propertyIndex, "Invalid property id");
//         require(properties[id].owner != address(0), "Property not found");
//         require(!properties[id].deleted, "Property deleted");
//         _;
//     }
//     modifier onlyAdmin() {
//         require(msg.sender == admin, "Only admin");
//         _;
//     }

//     // -------------------------
//     // Constructor
//     // -------------------------
//     constructor(
//         address _chainlinkOracle,
//         bytes32 _chainlinkJobId,
//         uint256 _chainlinkFee,
//         address _linkTokenOrZero,
//         address _mockOracle
//     ) {
//         admin = msg.sender;

//         chainlinkOracle = _chainlinkOracle;
//         chainlinkJobId = _chainlinkJobId;
//         chainlinkFee = _chainlinkFee;

//         if (_mockOracle != address(0)) {
//             mockOracle = IMockOracle(_mockOracle);
//             useMock = true;
//         } else {
//             useMock = false;
//         }

//         // keep original initializations (these addresses you had in original)
//         pricefeed = AggregatorV3Interface(
//             address(0x022F9dCC73C5Fb43F2b4eF2EF9ad3eDD1D853946)
//         );
//         kycVerifier = IKYCVerifier(
//             address(0x73be0078b59FFfE2CE9f0007496258D11eE746De)
//         );

//         propertyNFT = new RealEstateNFT();
//         propertyNFT.setMinter(address(this));
//     }

//     // -------------------------
//     // Admin / configuration
//     // -------------------------
//     function setMockOracle(address _mockOracle) external onlyAdmin {
//         mockOracle = IMockOracle(_mockOracle);
//     }

//     function setUseMock(bool _useMock) external onlyAdmin {
//         useMock = _useMock;
//     }

//     function setChainlinkConfig(address _oracle, bytes32 _jobId, uint256 _fee) external onlyAdmin {
//         chainlinkOracle = _oracle;
//         chainlinkJobId = _jobId;
//         chainlinkFee = _fee;
//     }

//     // -------------------------
//     // Price oracle helper (existing)
//     // -------------------------
//     function getLatestEthPrice() public view returns (uint256 price) {
//         (, int256 answer, , uint256 updatedAt, ) = pricefeed.latestRoundData();
//         uint8 decimals = pricefeed.decimals();

//         require(answer > 0, "Invalid ETH price from oracle");
//         require(block.timestamp - updatedAt <= 1 hours, "Stale oracle price");

//         if (decimals < 18) {
//             price = uint256(answer) * (10 ** (18 - decimals));
//         } else if (decimals > 18) {
//             price = uint256(answer) / (10 ** (decimals - 18));
//         } else {
//             price = uint256(answer);
//         }
//     }

//     /// @dev returns required wei to pay property.price (assumes property.price is USD with 18 decimals)
//     function getRequiredEth(uint256 propertyId) public view returns (uint256) {
//         Property memory prop = properties[propertyId];
//         require(!prop.sold, "Already sold");

//         uint256 ethPrice = getLatestEthPrice();
//         require(ethPrice > 0, "ETH price is zero");

//         // ceil division: requiredWei = ceil( (prop.price * 1e18) / ethPrice )
//         uint256 numerator = prop.price * 1e18;
//         uint256 requiredEth = numerator / ethPrice;
//         if (numerator % ethPrice != 0) requiredEth += 1;
//         return requiredEth;
//     }

//     // -------------------------
//     // Listing
//     // -------------------------
//     function listProperty(
//         address payable owner,
//         uint256 price,
//         string memory _propertyTitle,
//         string memory _category,
//         string[] memory _images,
//         string memory _propertyAddress,
//         string memory _description,
//         string memory _metadataURI
//     ) external returns (uint256) {
//         require(price > 0, "Price must be > 0");
//         require(msg.sender == owner, "Caller must be owner");
//         require(msg.sender != address(0), "Address cannot be zero");
//         require(kycVerifier.isKYCApproved(owner), "Owner not KYC approved");

//         uint256 productId = propertyIndex++;
//         Property storage property = properties[productId];
//         property.productID = productId;
//         property.owner = owner;
//         property.price = price;
//         property.propertyTitle = _propertyTitle;
//         property.category = _category;
//         property.propertyAddress = _propertyAddress;
//         property.description = _description;
//         property.metadataURI = _metadataURI;
//         property.sold = false;
//         property.verified = false;
//         property.verifiedAt = 0;
//         property.verifiedDocHash = bytes32(0);
//         property.soldAt = 0;
//         property.deleted = false;

//         for (uint i = 0; i < _images.length; i++) {
//             property.images.push(_images[i]);
//         }

//         uint256 nftId = propertyNFT.mintProperty(address(this), _metadataURI);
//         property.nftId = nftId;

//         emit PropertyListed(productId, owner, price);
//         emit NFTMinted(nftId, address(this), productId);
//         return productId;
//     }

//     // -------------------------
//     // Escrow & verification flow
//     // -------------------------
//     function _requestDocsVerification(uint256 propertyId, string memory docsHash) internal {
//         bytes32 requestId;

//         if (useMock && address(mockOracle) != address(0)) {
//             // call mock oracle to generate requestId (mock may emit event)
//             try mockOracle.mockRequestDocs(propertyId, docsHash) returns (bytes32 rid) {
//                 requestId = rid;
//             } catch {
//                 // fallback to predictable request id if mock call fails
//                 requestId = keccak256(abi.encodePacked(propertyId, docsHash, block.timestamp));
//             }
//         } else {
//             // Generate a pseudo requestId that off-chain worker / oracle can use to reference
//             requestId = keccak256(abi.encodePacked(propertyId, docsHash, block.timestamp, address(this)));
//         }

//         requestToProperty[requestId] = propertyId;
//         emit DocsVerificationRequested(propertyId, docsHash, requestId);
//     }

//     function depositPayment(uint256 id, uint256 duration)
//         external
//         payable
//         nonReentrant
//         validProperty(id)
//     {
//         Property storage property = properties[id];
//         require(!property.sold, "Already sold");
//         require(escrows[id].amount == 0, "Already deposited");
//         require(duration >= MIN_ESCROW_DURATION && duration <= MAX_ESCROW_DURATION, "Duration out of bounds");

//         // 1) KYC check with try/catch so we provide clear revert
//         bool buyerApproved;
//         try kycVerifier.isKYCApproved(msg.sender) returns (bool ok) {
//             buyerApproved = ok;
//         } catch {
//             revert("KYC check call failed for buyer");
//         }
//         require(buyerApproved, "Buyer not KYC approved");

//         // 2) Compute required ETH and check msg.value
//         uint256 required = getRequiredEth(id); // may revert if pricefeed stale/zero
//         require(msg.value >= required, "Insufficient ETH");

//         escrows[id] = Escrow({
//             buyer: msg.sender,
//             amount: msg.value,
//             confirmed: false,
//             refunded: false,
//             createdAt: block.timestamp,
//             expiresAt: block.timestamp + duration
//         });

//         emit PaymentDeposited(id, msg.sender, msg.value, escrows[id].expiresAt);

//         // Trigger doc verification: will either call mock or emit a request that external oracle uses.
//         _requestDocsVerification(id, property.metadataURI);
//     }

//     /// Fulfillment: called by authorized oracle or admin (external oracle or your mock manager)
//     /// `requestId` must match the value emitted in DocsVerificationRequested.
//     function fulfill(bytes32 requestId, bool verified, bytes32 docHash) external {
//         // Accept calls from configured chainlinkOracle, mockOracle (if set), or admin.
//         // This keeps it flexible: off-chain node can call fulfill directly.
//         require(
//             msg.sender == chainlinkOracle
//             || (address(mockOracle) != address(0) && msg.sender == address(mockOracle))
//             || msg.sender == admin,
//             "Unauthorized fulfill caller"
//         );

//         uint256 propertyId = requestToProperty[requestId];
//         require(propertyId < propertyIndex, "Unknown property for request");

//         Property storage property = properties[propertyId];
//         property.verified = verified;
//         property.verifiedAt = block.timestamp;
//         property.verifiedDocHash = docHash;

//         emit DocumentsVerified(propertyId, verified, docHash);

//         // alert buyer (frontend should listen to this)
//         if (verified && escrows[propertyId].buyer != address(0)) {
//             emit BuyerAlerted(propertyId, escrows[propertyId].buyer);
//         }

//         // cleanup mapping
//         delete requestToProperty[requestId];
//     }

//     // -------------------------
//     // Confirm purchase (buyer must call after seeing docs & verifying)
//     // -------------------------
//     function confirmPurchase(uint256 id) external nonReentrant validProperty(id) {
//         Escrow storage escrow = escrows[id];
//         Property storage property = properties[id];

//         require(msg.sender == escrow.buyer, "Not buyer");
//         require(!escrow.confirmed, "Already confirmed");
//         require(escrow.amount > 0, "No escrowed funds");
//         require(block.timestamp <= escrow.expiresAt, "Escrow expired");
//         require(property.verified, "Documents not verified");

//         escrow.confirmed = true;
//         property.sold = true;
//         property.soldAt = block.timestamp;

//         uint256 amount = escrow.amount;
//         escrow.amount = 0;

//         // Transfer NFT to buyer
//         propertyNFT.safeTransferFrom(address(this), escrow.buyer, property.nftId);
//         require(propertyNFT.ownerOf(property.nftId) == escrow.buyer, "NFT transfer failed");

//         // Mint Document NFT for buyer (if verification returned a docHash/metadataURI)
//         if (!verifiedDocMinted[id] && property.verifiedDocHash != bytes32(0)) {
//             // use the same metadataURI as property.metadataURI for doc NFT (or change as needed)
//             uint256 docNftId = propertyNFT.mintProperty(escrow.buyer, property.metadataURI);
//             verifiedDocMinted[id] = true;
//             emit DocumentNFTMinted(id, docNftId, escrow.buyer);
//         }

//         // Transfer funds to seller (old owner)
//         address oldOwner = property.owner;
//         property.owner = payable(escrow.buyer);
//         (bool sent, ) = payable(oldOwner).call{value: amount}("");
//         require(sent, "Transfer failed");

//         emit PropertySold(id, oldOwner, property.owner, property.price);
//     }

//     // Buyer can claim refund if escrow expired
//     function claimExpiredEscrow(uint256 id) external nonReentrant validProperty(id) {
//         Escrow storage escrow = escrows[id];
//         require(block.timestamp >= escrow.expiresAt, "Escrow not expired yet");
//         require(!escrow.confirmed && !escrow.refunded, "Escrow already processed");
//         require(msg.sender == escrow.buyer, "Only buyer can claim expired escrow");

//         escrow.refunded = true;
//         uint256 amount = escrow.amount;
//         escrow.amount = 0;

//         (bool sent, ) = payable(escrow.buyer).call{value: amount}("");
//         require(sent, "Refund failed");

//         emit DisputeResolved(id, escrow.buyer, true);
//     }

//     // Admin resolves dispute (refund or award)
//     function resolveDispute(uint256 id, bool refundBuyer) external nonReentrant onlyAdmin validProperty(id) {
//         Escrow storage escrow = escrows[id];
//         Property storage property = properties[id];
//         require(!escrow.confirmed, "Already confirmed");
//         require(escrow.amount > 0, "No escrowed funds");

//         // If refundBuyer true, send funds to buyer; else award to seller and transfer NFT
//         uint256 amount = escrow.amount;
//         escrow.amount = 0;

//         if (refundBuyer) {
//             escrow.refunded = true;
//             (bool sent, ) = payable(escrow.buyer).call{value: amount}("");
//             require(sent, "Refund failed");
//             emit DisputeResolved(id, escrow.buyer, true);
//         } else {
//             // award to seller and transfer ownership to buyer
//             address oldOwner = property.owner;
//             property.owner = payable(escrow.buyer);

//             propertyNFT.safeTransferFrom(address(this), escrow.buyer, property.nftId);
//             require(propertyNFT.ownerOf(property.nftId) == escrow.buyer, "NFT transfer failed");

//             (bool sent, ) = payable(oldOwner).call{value: amount}("");
//             require(sent, "Transfer failed");

//             property.sold = true;
//             emit PropertySold(id, oldOwner, property.owner, property.price);
//             emit DisputeResolved(id, property.owner, false);
//         }
//     }

//     // -------------------------
//     // Soft delete (mark deleted, do not shift IDs)
//     // -------------------------
//     function deleteProperty(uint256 propertyId) external validProperty(propertyId) {
//         Property storage property = properties[propertyId];

//         // Allow original owner or admin
//         require(msg.sender == property.owner || msg.sender == admin, "Not authorized");
//         // Prevent deletion if escrow is active
//         require(escrows[propertyId].amount == 0, "Active escrow exists");

//         // If contract still owns NFT, burn it
//         if (property.nftId != 0 && propertyNFT.ownerOf(property.nftId) == address(this)) {
//             propertyNFT.burn(property.nftId);
//         }

//         // Soft-delete flag (keep slot to preserve ID)
//         property.deleted = true;

//         // Clear heavy fields to free gas/storage
//         delete property.images;
//         delete property.reviewers;
//         delete property.reviews;
//         property.metadataURI = "";
//         property.owner = payable(address(0));
//         property.price = 0;
//         property.propertyTitle = "";
//         property.category = "";
//         property.propertyAddress = "";
//         property.description = "";
//         property.nftId = 0;

//         // Remove related mappings
//         delete escrows[propertyId];
//         delete products[propertyId];
//         delete reviews[propertyId];

//         emit PropertyDeleted(propertyId);
//     }

//     // Optional cleanup for sold properties after retention period (no shifting)
//     function cleanupSoldProperty(uint256 propertyId) external validProperty(propertyId) {
//         Property storage property = properties[propertyId];
//         require(property.sold, "Property not sold");
//         require(block.timestamp > property.soldAt + RETENTION_PERIOD, "Too early to cleanup");
//         require(escrows[propertyId].amount == 0, "Active escrow exists");

//         // burn NFT if contract holds it
//         if (property.nftId != 0 && propertyNFT.ownerOf(property.nftId) == address(this)) {
//             propertyNFT.burn(property.nftId);
//         }

//         property.deleted = true;

//         delete property.images;
//         delete property.reviewers;
//         delete property.reviews;
//         property.metadataURI = "";
//         property.owner = payable(address(0));
//         property.price = 0;
//         property.propertyTitle = "";
//         property.category = "";
//         property.propertyAddress = "";
//         property.description = "";
//         property.nftId = 0;

//         delete escrows[propertyId];
//         delete products[propertyId];
//         delete reviews[propertyId];

//         emit PropertyDeleted(propertyId);
//     }

//     // -------------------------
//     // Getters (skip deleted)
//     // -------------------------
//     function getAllProperties() public view returns (Property[] memory) {
//         uint256 total = propertyIndex;
//         uint256 count = 0;
//         for (uint256 i = 0; i < total; i++) {
//             if (!properties[i].deleted && properties[i].owner != address(0)) count++;
//         }

//         Property[] memory items = new Property[](count);
//         uint256 j = 0;
//         for (uint256 i = 0; i < total; i++) {
//             if (!properties[i].deleted && properties[i].owner != address(0)) {
//                 items[j++] = properties[i];
//             }
//         }
//         return items;
//     }

//     function getPropertyBasic(uint256 id) external view validProperty(id)
//         returns (
//             uint256 productID,
//             address owner,
//             uint256 price,
//             string memory propertyTitle,
//             string memory category,
//             string[] memory images
//         )
//     {
//         Property storage property = properties[id];

//         return (
//             property.productID,
//             property.owner,
//             property.price,
//             property.propertyTitle,
//             property.category,
//             property.images
//         );
//     }

//     // Return extended info
//     function getPropertyExtended(uint256 id) external view validProperty(id)
//         returns (
//             string memory propertyAddress,
//             string memory description,
//             bool sold,
//             bool verified,
//             uint256 verifiedAt,
//             bytes32 verifiedDocHash
//         )
//     {
//         Property storage property = properties[id];

//         return (
//             property.propertyAddress,
//             property.description,
//             property.sold,
//             property.verified,
//             property.verifiedAt,
//             property.verifiedDocHash
//         );
//     }
 
//     function getUserProperties(address user) external view returns (Property[] memory) {
//         uint256 count = 0;
//         for (uint256 i = 0; i < propertyIndex; i++) {
//             if (!properties[i].deleted && properties[i].owner == user) count++;
//         }
//         Property[] memory items = new Property[](count);
//         uint256 j = 0;
//         for (uint256 i = 0; i < propertyIndex; i++) {
//             if (!properties[i].deleted && properties[i].owner == user) items[j++] = properties[i];
//         }
//         return items;
//     }

//     // -------------------------
//     // Reviews
//     // -------------------------
//     function addReview(uint256 productId, uint256 rating, string calldata comment) external {
//         require(rating >= 1 && rating <= 5, "Rating must be 1-5");
//         Property storage property = properties[productId];
//         property.reviewers.push(msg.sender);
//         property.reviews.push(comment);

//         reviews[productId].push(Review(msg.sender, productId, rating, comment, 0));
//         userReviews[msg.sender].push(productId);

//         products[productId].totalRating += rating;
//         products[productId].numReviews++;

//         emit ReviewAdded(productId, msg.sender, rating, comment);
//         reviewsCounter++;
//     }

//     function getProductReview(uint256 productId) external view returns (Review[] memory) {
//         return reviews[productId];
//     }

//     function likeReview(uint256 productId, uint256 reviewIndex) external {
//         require(!hasLikedReview[productId][msg.sender], "Already liked");
//         hasLikedReview[productId][msg.sender] = true;

//         Review storage review = reviews[productId][reviewIndex];
//         review.likes++;

//         emit ReviewLiked(productId, reviewIndex, msg.sender, review.likes);
//     }

//     function getHighestRatedProduct() external view returns (uint256) {
//         uint256 highestRating = 0;
//         uint256 highestRatedProductId = 0;
//         for (uint256 i = 0; i < propertyIndex; i++) {
//             if (products[i].numReviews > 0) {
//                 uint256 avgRating = products[i].totalRating / products[i].numReviews;
//                 if (avgRating > highestRating) {
//                     highestRating = avgRating;
//                     highestRatedProductId = i;
//                 }
//             }
//         }
//         return highestRatedProductId;
//     }

//     // -------------------------
//     // Utils
//     // -------------------------
//     function _uint2str(uint256 _i) internal pure returns (string memory str) {
//         if (_i == 0) return "0";
//         uint256 j = _i;
//         uint256 length;
//         while (j != 0) { length++; j /= 10; }
//         bytes memory bstr = new bytes(length);
//         uint256 k = length;
//         j = _i;
//         while (j != 0) { k--; bstr[k] = bytes1(uint8(48 + j % 10)); j /= 10; }
//         str = string(bstr);
//     }

//     // -------------------------
//     // (Removed) Link withdraw & ChainlinkClient specifics
//     // -------------------------
//     // Note: ChainlinkClient utilities (setChainlinkToken, sendChainlinkRequestTo,
//     // recordChainlinkFulfillment, chainlinkTokenAddress, withdrawLink, etc.)
//     // are intentionally removed in this refactor. If you need LINK/ERC20 withdrawal,
//     // I can add a generic ERC20 withdraw function protected by onlyAdmin.

//     // -------------------------
//     // Update property details (title, category, address, description, metadata)
//     // -------------------------
//     function updateProperty(
//         uint256 propertyId,
//         string memory _propertyTitle,
//         string memory _category,
//         string[] memory _images,
//         string memory _propertyAddress,
//         string memory _description,
//         string memory _metadataURI
//     ) external validProperty(propertyId) {
//         Property storage property = properties[propertyId];
//         require(msg.sender == property.owner || msg.sender == admin, "Not authorized");
//         require(!property.sold, "Already sold");

//         property.propertyTitle = _propertyTitle;
//         property.category = _category;
//         property.propertyAddress = _propertyAddress;
//         property.description = _description;
//         property.metadataURI = _metadataURI;

//         // Reset images
//         delete property.images;
//         for (uint i = 0; i < _images.length; i++) {
//             property.images.push(_images[i]);
//         }
//     }

//     // Update price only
//     function updatePrice(uint256 propertyId, uint256 newPrice) external validProperty(propertyId) {
//         Property storage property = properties[propertyId];
//         require(msg.sender == property.owner || msg.sender == admin, "Not authorized");
//         require(!property.sold, "Already sold");
//         require(newPrice > 0, "Price must be > 0");

//         property.price = newPrice;
//     }
// }



// pragma solidity ^0.8.24;

// // OpenZeppelin
// import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// // Chainlink
// import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";

// import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
// import "./IKYCVerifier.sol";
// import "./RealEstateNft.sol";

// contract RealEstate is ReentrancyGuard, ChainlinkClient {
//     using Chainlink for Chainlink.Request;

//     address public admin;
//     AggregatorV3Interface internal pricefeed;
//     IKYCVerifier public kycVerifier;
//     RealEstateNFT public propertyNFT;

//     // Chainlink oracle config
//     address public chainlinkOracle;
//     bytes32 public chainlinkJobId;
//     uint256 public chainlinkFee;
//     // map requestId -> propertyId
//     mapping(bytes32 => uint256) private requestToProperty;

//     constructor(address _chainlinkOracle, bytes32 _chainlinkJobId,
//      uint256 _chainlinkFee, address _linkToken) {
//         admin = msg.sender;
        
//         chainlinkOracle = _chainlinkOracle;
//         chainlinkJobId = _chainlinkJobId;
//         chainlinkFee = _chainlinkFee;
//         if (_linkToken != address(0)) {
//             setChainlinkToken(_linkToken);
//         }

//         // keep original initializations
//         pricefeed = AggregatorV3Interface(
//             address(0x022F9dCC73C5Fb43F2b4eF2EF9ad3eDD1D853946)
//         );
//         kycVerifier = IKYCVerifier(
//             address(0x73be0078b59FFfE2CE9f0007496258D11eE746De)
//         );

//         propertyNFT = new RealEstateNFT();
//         propertyNFT.setMinter(address(this));
//     }

//     // -------------------------
//     // Structs
//     // -------------------------
//     struct Property {
//         uint256 productID;
//         address payable owner;
//         uint256 nftId;
//         uint256 price; 
//         string propertyTitle;
//         string category;
//         string[] images;
//         string propertyAddress;
//         string description;
//         address[] reviewers;
//         string[] reviews;
//         bool sold;
//         string metadataURI; // IPFS/URI for docs

//         // verification & lifecycle
//         bool verified;        // set by Chainlink/or admin
//         uint256 verifiedAt;
//         bytes32 verifiedDocHash; // doc hash returned by verifier (optional)
//         uint256 soldAt;
//         bool deleted;         // soft-delete flag
//     }

//     struct Escrow {
//         address buyer;
//         uint256 amount;
//         bool confirmed;
//         bool refunded;
//         uint256 createdAt;
//         uint256 expiresAt;
//     }

//     struct Review {
//         address reviewer;
//         uint256 productId;
//         uint256 rating;
//         string comment;
//         uint256 likes;
//     }

//     struct Product {
//         uint256 productId;
//         uint256 totalRating;
//         uint256 numReviews;
//     }

    
//     mapping(uint256 => Property) private properties;
//     mapping(uint256 => Escrow) public escrows;
//     mapping(uint256 => Product) private products;
//     mapping(uint256 => Review[]) private reviews;
//     mapping(address => uint256[]) private userReviews;
//     mapping(uint256 => mapping(address => bool)) public hasLikedReview;

//     mapping(uint256 => bool) public verifiedDocMinted; 

//     uint256 public propertyIndex;
//     uint256 public reviewsCounter;

//     // ===== Escrow timing =====
//     // fixed MIN < MAX
//     uint256 public constant MIN_ESCROW_DURATION = 10 minutes;
//     uint256 public constant MAX_ESCROW_DURATION = 15 minutes;

//     // retention period for cleanup (optional)
//     uint256 public constant RETENTION_PERIOD = 30 days;

//     // ===== events =====
//     event PropertyListed(uint256 indexed id, address indexed owner, uint256 price);
//     event PaymentDeposited(uint256 indexed id, address indexed buyer, uint256 amount, uint256 expiresAt);
//     event PropertySold(uint256 indexed id, address indexed oldOwner, address indexed newOwner, uint256 price);
//     event ReviewAdded(uint256 indexed productId, address indexed reviewer, uint256 rating, string comment);
//     event ReviewLiked(uint256 indexed productId, uint256 indexed reviewIndex, address indexed liker, uint256 likes);
//     event DisputeResolved(uint256 indexed id, address recipient, bool refunded);
//     event PropertyDeleted(uint256 indexed propertyId);
//     event NFTMinted(uint256 indexed nftId, address indexed owner, uint256 indexed propertyId);

//     // verification events
//     event DocsVerificationRequested(uint256 indexed propertyId, string docsHash, bytes32 requestId);
//     event DocumentsVerified(uint256 indexed propertyId, bool status, bytes32 docHash);
//     event BuyerAlerted(uint256 indexed propertyId, address indexed buyer);
//     event DocumentNFTMinted(uint256 indexed propertyId, uint256 indexed docNftId, address indexed buyer);

//     // -------------------------
//     // Modifiers
//     // -------------------------
//     modifier validProperty(uint256 id) {
//         require(id < propertyIndex, "Invalid property id");
//         require(properties[id].owner != address(0), "Property not found");
//         require(!properties[id].deleted, "Property deleted");
//         _;
//     }
//     modifier onlyAdmin() {
//         require(msg.sender == admin, "Only admin");
//         _;
//     }

//     // -------------------------
//     // Chainlink helper
//     // -------------------------
//     /// @notice Configure Chainlink parameters (admin only)
//     function setChainlinkConfig(address _oracle, bytes32 _jobId, uint256 _fee, address _linkToken) external onlyAdmin {
//         chainlinkOracle = _oracle;
//         chainlinkJobId = _jobId;
//         chainlinkFee = _fee;
//         if (_linkToken != address(0)) {
//             setChainlinkToken(_linkToken);
//         }
//     }

//     // -------------------------
//     // Price oracle helper (existing)
//     // -------------------------
//     function getLatestEthPrice() public view returns (uint256 price) {
//         (, int256 answer, , uint256 updatedAt, ) = pricefeed.latestRoundData();
//         uint8 decimals = pricefeed.decimals();

//         require(answer > 0, "Invalid ETH price from oracle");
//         require(block.timestamp - updatedAt <= 1 hours, "Stale oracle price");

//         if (decimals < 18) {
//             price = uint256(answer) * (10 ** (18 - decimals));
//         } else if (decimals > 18) {
//             price = uint256(answer) / (10 ** (decimals - 18));
//         } else {
//             price = uint256(answer);
//         }
//     }

//     /// @dev returns required wei to pay property.price (assumes property.price is USD with 18 decimals)
//     function getRequiredEth(uint256 propertyId) public view returns (uint256) {
//         Property memory prop = properties[propertyId];
//         require(!prop.sold, "Already sold");

//         uint256 ethPrice = getLatestEthPrice();
//         require(ethPrice > 0, "ETH price is zero");

//         // ceil division: requiredWei = ceil( (prop.price * 1e18) / ethPrice )
//         uint256 numerator = prop.price * 1e18;
//         uint256 requiredEth = numerator / ethPrice;
//         if (numerator % ethPrice != 0) requiredEth += 1;
//         return requiredEth;
//     }

//     // -------------------------
//     // Listing
//     // -------------------------
//     function listProperty(
//         address payable owner,
//         uint256 price,
//         string memory _propertyTitle,
//         string memory _category,
//         string[] memory _images,
//         string memory _propertyAddress,
//         string memory _description,
//         string memory _metadataURI
//     ) external returns (uint256) {
//         require(price > 0, "Price must be > 0");
//         require(msg.sender == owner, "Caller must be owner");
//         require(msg.sender != address(0), "Address cannot be zero");
//         require(kycVerifier.isKYCApproved(owner), "Owner not KYC approved");

//         uint256 productId = propertyIndex++;
//         Property storage property = properties[productId];
//         property.productID = productId;
//         property.owner = owner;
//         property.price = price;
//         property.propertyTitle = _propertyTitle;
//         property.category = _category;
//         property.propertyAddress = _propertyAddress;
//         property.description = _description;
//         property.metadataURI = _metadataURI;
//         property.sold = false;
//         property.verified = false;
//         property.verifiedAt = 0;
//         property.verifiedDocHash = bytes32(0);
//         property.soldAt = 0;
//         property.deleted = false;

//         for (uint i = 0; i < _images.length; i++) {
//             property.images.push(_images[i]);
//         }

//         uint256 nftId = propertyNFT.mintProperty(address(this), _metadataURI);
//         property.nftId = nftId;

//         emit PropertyListed(productId, owner, price);
//         emit NFTMinted(nftId, address(this), productId);
//         return productId;
//     }

//     // -------------------------
//     // Escrow & verification flow
//     // -------------------------
//     /// Buyer deposits funds (in wei). This triggers a Chainlink verification request for property documents.
//     // function depositPayment(uint256 id, uint256 duration)
//     //     external
//     //     payable
//     //     nonReentrant
//     //     validProperty(id)
//     // {
//     //     Property storage property = properties[id];
//     //     require(!property.sold, "Already sold");
//     //     uint256 required = getRequiredEth(id);
//     //     require(msg.value >= required, "Insufficient ETH");
//     //     require(escrows[id].amount == 0, "Already deposited");
//     //     require(kycVerifier.isKYCApproved(msg.sender), "Buyer not KYC approved");
//     //     require(duration >= MIN_ESCROW_DURATION && duration <= MAX_ESCROW_DURATION, "Duration out of bounds");

//     //     escrows[id] = Escrow({
//     //         buyer: msg.sender,
//     //         amount: msg.value,
//     //         confirmed: false,
//     //         refunded: false,
//     //         createdAt: block.timestamp,
//     //         expiresAt: block.timestamp + duration
//     //     });

//     //     emit PaymentDeposited(id, msg.sender, msg.value, escrows[id].expiresAt);

//     //     // Trigger Chainlink doc verification immediately
//     //     _requestDocsVerification(id, property.metadataURI);
//     // }

//     // /// Internal: build and send Chainlink request to verify docs
//     function _requestDocsVerification(uint256 propertyId, string memory docsHash) internal {
//         require(chainlinkOracle != address(0), "Chainlink oracle not set");
//         Chainlink.Request memory req = buildChainlinkRequest(chainlinkJobId, address(this), this.fulfill.selector);

//         // Pass params the external adapter expects
//         req.add("propertyId", _uint2str(propertyId));
//         req.add("docsHash", docsHash);

//         bytes32 requestId = sendChainlinkRequestTo(chainlinkOracle, req, chainlinkFee);
//         requestToProperty[requestId] = propertyId;

//         emit DocsVerificationRequested(propertyId, docsHash, requestId);
//     }

// function depositPayment(uint256 id, uint256 duration)
//     external
//     payable
//     nonReentrant
//     validProperty(id)
// {
//     Property storage property = properties[id];
//     require(!property.sold, "Already sold");
//     require(escrows[id].amount == 0, "Already deposited");
//     require(duration >= MIN_ESCROW_DURATION && duration 
//     <= MAX_ESCROW_DURATION, "Duration out of bounds");

//     // 1) KYC check with try/catch so we provide clear revert
//     bool buyerApproved;
//     try kycVerifier.isKYCApproved(msg.sender) returns (bool ok) {
//         buyerApproved = ok;
//     } catch {
//         revert("KYC check call failed for buyer");
//     }
//     require(buyerApproved, "Buyer not KYC approved");

//     // 2) Compute required ETH and check msg.value
//     uint256 required = getRequiredEth(id); // may revert if pricefeed stale/zero
//     require(msg.value >= required, "Insufficient ETH");

//     escrows[id] = Escrow({
//         buyer: msg.sender,
//         amount: msg.value,
//         confirmed: false,
//         refunded: false,
//         createdAt: block.timestamp,
//         expiresAt: block.timestamp + duration
//     });

//     emit PaymentDeposited(id, msg.sender, msg.value, escrows[id].expiresAt);

//     // Trigger Chainlink doc verification immediately
//     _requestDocsVerification(id, property.metadataURI);
// }

//     /// Chainlink callback: expects (requestId, bool verified, bytes32 docHash)
//     /// External adapter must call the Chainlink node to fulfill this signature
//     function fulfill(bytes32 requestId, bool verified, bytes32 docHash)
//         public
//         recordChainlinkFulfillment(requestId)
//     {
//         uint256 propertyId = requestToProperty[requestId];
//         require(propertyId < propertyIndex, "Unknown property for request");

//         Property storage property = properties[propertyId];
//         property.verified = verified;
//         property.verifiedAt = block.timestamp;
//         property.verifiedDocHash = docHash;

//         emit DocumentsVerified(propertyId, verified, docHash);

//         // alert buyer (frontend should listen to this)
//         if (verified && escrows[propertyId].buyer != address(0)) {
//             emit BuyerAlerted(propertyId, escrows[propertyId].buyer);
//         }

//         // cleanup mapping
//         delete requestToProperty[requestId];
//     }

//     // -------------------------
//     // Confirm purchase (buyer must call after seeing docs & verifying)
//     // -------------------------
//     function confirmPurchase(uint256 id) external nonReentrant validProperty(id) {
//         Escrow storage escrow = escrows[id];
//         Property storage property = properties[id];

//         require(msg.sender == escrow.buyer, "Not buyer");
//         require(!escrow.confirmed, "Already confirmed");
//         require(escrow.amount > 0, "No escrowed funds");
//         require(block.timestamp <= escrow.expiresAt, "Escrow expired");
//         require(property.verified, "Documents not verified");

//         escrow.confirmed = true;
//         property.sold = true;
//         property.soldAt = block.timestamp;

//         uint256 amount = escrow.amount;
//         escrow.amount = 0;

//         // Transfer NFT to buyer
//         propertyNFT.safeTransferFrom(address(this), escrow.buyer, property.nftId);
//         require(propertyNFT.ownerOf(property.nftId) == escrow.buyer, "NFT transfer failed");

//         // Mint Document NFT for buyer (if verification returned a docHash/metadataURI)
//         if (!verifiedDocMinted[id] && property.verifiedDocHash != bytes32(0)) {
//             // use the same metadataURI as property.metadataURI for doc NFT (or change as needed)
//             uint256 docNftId = propertyNFT.mintProperty(escrow.buyer, property.metadataURI);
//             verifiedDocMinted[id] = true;
//             emit DocumentNFTMinted(id, docNftId, escrow.buyer);
//         }

//         // Transfer funds to seller (old owner)
//         address oldOwner = property.owner;
//         property.owner = payable(escrow.buyer);
//         (bool sent, ) = payable(oldOwner).call{value: amount}("");
//         require(sent, "Transfer failed");

//         emit PropertySold(id, oldOwner, property.owner, property.price);
//     }

//     // Buyer can claim refund if escrow expired
//     function claimExpiredEscrow(uint256 id) external nonReentrant validProperty(id) {
//         Escrow storage escrow = escrows[id];
//         require(block.timestamp >= escrow.expiresAt, "Escrow not expired yet");
//         require(!escrow.confirmed && !escrow.refunded, "Escrow already processed");
//         require(msg.sender == escrow.buyer, "Only buyer can claim expired escrow");

//         escrow.refunded = true;
//         uint256 amount = escrow.amount;
//         escrow.amount = 0;

//         (bool sent, ) = payable(escrow.buyer).call{value: amount}("");
//         require(sent, "Refund failed");

//         emit DisputeResolved(id, escrow.buyer, true);
//     }

//     // Admin resolves dispute (refund or award)
//     function resolveDispute(uint256 id, bool refundBuyer) external nonReentrant onlyAdmin validProperty(id) {
//         Escrow storage escrow = escrows[id];
//         Property storage property = properties[id];
//         require(!escrow.confirmed, "Already confirmed");
//         require(escrow.amount > 0, "No escrowed funds");

//         // If refundBuyer true, send funds to buyer; else award to seller and transfer NFT
//         uint256 amount = escrow.amount;
//         escrow.amount = 0;

//         if (refundBuyer) {
//             escrow.refunded = true;
//             (bool sent, ) = payable(escrow.buyer).call{value: amount}("");
//             require(sent, "Refund failed");
//             emit DisputeResolved(id, escrow.buyer, true);
//         } else {
//             // award to seller and transfer ownership to buyer
//             address oldOwner = property.owner;
//             property.owner = payable(escrow.buyer);

//             propertyNFT.safeTransferFrom(address(this), escrow.buyer, property.nftId);
//             require(propertyNFT.ownerOf(property.nftId) == escrow.buyer, "NFT transfer failed");

//             (bool sent, ) = payable(oldOwner).call{value: amount}("");
//             require(sent, "Transfer failed");

//             property.sold = true;
//             emit PropertySold(id, oldOwner, property.owner, property.price);
//             emit DisputeResolved(id, property.owner, false);
//         }
//     }

//     // -------------------------
//     // Soft delete (mark deleted, do not shift IDs)
//     // -------------------------
//     function deleteProperty(uint256 propertyId) external validProperty(propertyId) {
//         Property storage property = properties[propertyId];

//         // Allow original owner or admin
//         require(msg.sender == property.owner || msg.sender == admin, "Not authorized");
//         // Prevent deletion if escrow is active
//         require(escrows[propertyId].amount == 0, "Active escrow exists");

//         // If contract still owns NFT, burn it
//         if (property.nftId != 0 && propertyNFT.ownerOf(property.nftId) == address(this)) {
//             propertyNFT.burn(property.nftId);
//         }

//         // Soft-delete flag (keep slot to preserve ID)
//         property.deleted = true;

//         // Clear heavy fields to free gas/storage
//         delete property.images;
//         delete property.reviewers;
//         delete property.reviews;
//         property.metadataURI = "";
//         property.owner = payable(address(0));
//         property.price = 0;
//         property.propertyTitle = "";
//         property.category = "";
//         property.propertyAddress = "";
//         property.description = "";
//         property.nftId = 0;

//         // Remove related mappings
//         delete escrows[propertyId];
//         delete products[propertyId];
//         delete reviews[propertyId];

//         emit PropertyDeleted(propertyId);
//     }

//     // Optional cleanup for sold properties after retention period (no shifting)
//     function cleanupSoldProperty(uint256 propertyId) external validProperty(propertyId) {
//         Property storage property = properties[propertyId];
//         require(property.sold, "Property not sold");
//         require(block.timestamp > property.soldAt + RETENTION_PERIOD, "Too early to cleanup");
//         require(escrows[propertyId].amount == 0, "Active escrow exists");

//         // burn NFT if contract holds it
//         if (property.nftId != 0 && propertyNFT.ownerOf(property.nftId) == address(this)) {
//             propertyNFT.burn(property.nftId);
//         }

//         property.deleted = true;

//         delete property.images;
//         delete property.reviewers;
//         delete property.reviews;
//         property.metadataURI = "";
//         property.owner = payable(address(0));
//         property.price = 0;
//         property.propertyTitle = "";
//         property.category = "";
//         property.propertyAddress = "";
//         property.description = "";
//         property.nftId = 0;

//         delete escrows[propertyId];
//         delete products[propertyId];
//         delete reviews[propertyId];

//         emit PropertyDeleted(propertyId);
//     }

//     // -------------------------
//     // Getters (skip deleted)
//     // -------------------------
//     function getAllProperties() public view returns (Property[] memory) {
//         uint256 total = propertyIndex;
//         uint256 count = 0;
//         for (uint256 i = 0; i < total; i++) {
//             if (!properties[i].deleted && properties[i].owner != address(0)) count++;
//         }

//         Property[] memory items = new Property[](count);
//         uint256 j = 0;
//         for (uint256 i = 0; i < total; i++) {
//             if (!properties[i].deleted && properties[i].owner != address(0)) {
//                 items[j++] = properties[i];
//             }
//         }
//         return items;
//     }

//    // function getProperty(uint256 id) external view validProperty(id)
//     //     returns (
//     //         uint256,
//     //         address,
//     //         uint256,
//     //         string memory,
//     //         string memory,
//     //         string[] memory,
//     //         string memory,
//     //         string memory,
//     //         bool,
//     //         bool,
//     //         uint256,
//     //         bytes32
//     //     )
//     // {
//     //     // Property memory property = properties[id];
  
//     //         Property storage property = properties[id];

//     //     return (
//     //         property.productID,
//     //         property.owner,
//     //         property.price,
//     //         property.propertyTitle,
//     //         property.category,
//     //         property.images,
//     //         property.propertyAddress,
//     //         property.description,
//     //         property.sold,
//     //         property.verified,
//     //         property.verifiedAt,
//     //         property.verifiedDocHash
//     //     );
//     // }

//             // Return basic info
// function getPropertyBasic(uint256 id) external view validProperty(id)
//     returns (
//         uint256 productID,
//         address owner,
//         uint256 price,
//         string memory propertyTitle,
//         string memory category,
//         string[] memory images
//     )
// {
//     Property storage property = properties[id];

//     return (
//         property.productID,
//         property.owner,
//         property.price,
//         property.propertyTitle,
//         property.category,
//         property.images
//     );
// }

// // Return extended info
// function getPropertyExtended(uint256 id) external view validProperty(id)
//     returns (
//         string memory propertyAddress,
//         string memory description,
//         bool sold,
//         bool verified,
//         uint256 verifiedAt,
//         bytes32 verifiedDocHash
//     )
// {
//     Property storage property = properties[id];

//     return (
//         property.propertyAddress,
//         property.description,
//         property.sold,
//         property.verified,
//         property.verifiedAt,
//         property.verifiedDocHash
//     );
// }
 
//     function getUserProperties(address user) external view returns (Property[] memory) {
//         uint256 count = 0;
//         for (uint256 i = 0; i < propertyIndex; i++) {
//             if (!properties[i].deleted && properties[i].owner == user) count++;
//         }
//         Property[] memory items = new Property[](count);
//         uint256 j = 0;
//         for (uint256 i = 0; i < propertyIndex; i++) {
//             if (!properties[i].deleted && properties[i].owner == user) items[j++] = properties[i];
//         }
//         return items;
//     }

//     // -------------------------
//     // Reviews
//     // -------------------------
//     function addReview(uint256 productId, uint256 rating, string calldata comment) external {
//         require(rating >= 1 && rating <= 5, "Rating must be 1-5");
//         Property storage property = properties[productId];
//         property.reviewers.push(msg.sender);
//         property.reviews.push(comment);

//         reviews[productId].push(Review(msg.sender, productId, rating, comment, 0));
//         userReviews[msg.sender].push(productId);

//         products[productId].totalRating += rating;
//         products[productId].numReviews++;

//         emit ReviewAdded(productId, msg.sender, rating, comment);
//         reviewsCounter++;
//     }

//     function getProductReview(uint256 productId) external view returns (Review[] memory) {
//         return reviews[productId];
//     }

//     function likeReview(uint256 productId, uint256 reviewIndex) external {
//         require(!hasLikedReview[productId][msg.sender], "Already liked");
//         hasLikedReview[productId][msg.sender] = true;

//         Review storage review = reviews[productId][reviewIndex];
//         review.likes++;

//         emit ReviewLiked(productId, reviewIndex, msg.sender, review.likes);
//     }

//     function getHighestRatedProduct() external view returns (uint256) {
//         uint256 highestRating = 0;
//         uint256 highestRatedProductId = 0;
//         for (uint256 i = 0; i < propertyIndex; i++) {
//             if (products[i].numReviews > 0) {
//                 uint256 avgRating = products[i].totalRating / products[i].numReviews;
//                 if (avgRating > highestRating) {
//                     highestRating = avgRating;
//                     highestRatedProductId = i;
//                 }
//             }
//         }
//         return highestRatedProductId;
//     }

//     // -------------------------
//     // Utils
//     // -------------------------
//     function _uint2str(uint256 _i) internal pure returns (string memory str) {
//         if (_i == 0) return "0";
//         uint256 j = _i;
//         uint256 length;
//         while (j != 0) { length++; j /= 10; }
//         bytes memory bstr = new bytes(length);
//         uint256 k = length;
//         j = _i;
//         while (j != 0) { k--; bstr[k] = bytes1(uint8(48 + j % 10)); j /= 10; }
//         str = string(bstr);
//     }

//     // Emergency: allow admin to withdraw LINK token from contract (for Chainlink fees)
//     function withdrawLink(address to) external onlyAdmin {
//         LinkTokenInterface link = LinkTokenInterface(chainlinkTokenAddress());
//         require(link.transfer(to, link.balanceOf(address(this))), "LINK transfer failed");
//     }

//     // Update property details (title, category, address, description, metadata)
// function updateProperty(
//     uint256 propertyId,
//     string memory _propertyTitle,
//     string memory _category,
//     string[] memory _images,
//     string memory _propertyAddress,
//     string memory _description,
//     string memory _metadataURI
// ) external validProperty(propertyId) {
//     Property storage property = properties[propertyId];
//     require(msg.sender == property.owner || msg.sender == admin, "Not authorized");
//     require(!property.sold, "Already sold");

//     property.propertyTitle = _propertyTitle;
//     property.category = _category;
//     property.propertyAddress = _propertyAddress;
//     property.description = _description;
//     property.metadataURI = _metadataURI;

//     // Reset images
//     delete property.images;
//     for (uint i = 0; i < _images.length; i++) {
//         property.images.push(_images[i]);
//     }
// }

// // Update price only
// function updatePrice(uint256 propertyId, uint256 newPrice) external validProperty(propertyId) {
//     Property storage property = properties[propertyId];
//     require(msg.sender == property.owner || msg.sender == admin, "Not authorized");
//     require(!property.sold, "Already sold");
//     require(newPrice > 0, "Price must be > 0");

//     property.price = newPrice;
// }

// }