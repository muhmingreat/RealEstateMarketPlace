// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./IKYCVerifier.sol";
import "./RealEstateNft.sol";

contract RealEstate is ReentrancyGuard {
    address public admin;
    AggregatorV3Interface internal pricefeed;
    IKYCVerifier public kycVerifier;
    RealEstateNFT public propertyNFT;

    constructor() {
        admin = msg.sender;
        pricefeed = AggregatorV3Interface(
            address(0x022F9dCC73C5Fb43F2b4eF2EF9ad3eDD1D853946)
        );
        kycVerifier = IKYCVerifier(
            address(0x73be0078b59FFfE2CE9f0007496258D11eE746De)
        );
        
        propertyNFT = new RealEstateNFT();
        propertyNFT.setMinter(address(this));
    }

    //  RealEstateNFT public propertyNFT

    struct Property {
        uint256 productID;
        address payable owner;
        uint256 nftId;
        uint256 price;
        string propertyTitle;
        string category;
        string[] images;
        string propertyAddress;
        string description;
        address[] reviewers;
        string[] reviews;
        bool sold;
    }

    struct Escrow {
        address buyer;
        uint256 amount;
        bool confirmed;
        bool refunded;
        uint256 createdAt;
        uint256 expiresAt;
    }

    struct Review {
        address reviewer;
        uint256 productId;
        uint256 rating;
        string comment;
        uint256 likes;
    }

    struct Product {
        uint256 productId;
        uint256 totalRating;
        uint256 numReviews;
    }

    mapping(uint256 => Property) private properties;
    mapping(uint256 => Escrow) public escrows;
    mapping(uint256 => Product) private products;
    mapping(uint256 => Review[]) private reviews;
    mapping(address => uint256[]) private userReviews;
    mapping(uint256 => mapping(address => bool)) public hasLikedReview;

    uint256 public propertyIndex;
    uint256 public reviewsCounter;

    // ===== Escrow timing =====
    uint256 public constant MIN_ESCROW_DURATION = 5 minutes;
    uint256 public constant MAX_ESCROW_DURATION = 7 days;

    // ===== events =====
    event PropertyListed(
        uint256 indexed id,
        address indexed owner,
        uint256 price
    );
    event PaymentDeposited(
        uint256 indexed id,
        address indexed buyer,
        uint256 amount,
        uint256 expiresAt
    );
    event PropertySold(
        uint256 indexed id,
        address indexed oldOwner,
        address indexed newOwner,
        uint256 price
    );
    event ReviewAdded(
        uint256 indexed productId,
        address indexed reviewer,
        uint256 rating,
        string comment
    );
    event ReviewLiked(
        uint256 indexed productId,
        uint256 indexed reviewIndex,
        address indexed liker,
        uint256 likes
    );
    event DisputeResolved(uint256 indexed id, address recipient, bool refunded);

    event NFTMinted(
        uint256 indexed nftId,
        address indexed owner,
        uint256 indexed propertyId
    );

    modifier validProperty(uint256 id) {
        require(id < propertyIndex, "Invalid property id");
        require(properties[id].owner != address(0), "Property not found");
        _;
    }
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    // ===== Chainlink ETH price =====
    function getLatestEthPrice() public view returns (uint256 price) {
        (, int256 answer, , uint256 updatedAt, ) = pricefeed.latestRoundData();
        uint8 decimals = pricefeed.decimals();

        require(answer > 0, "Invalid ETH price from oracle");
        require(block.timestamp - updatedAt <= 1 hours, "Stale oracle price");

        if (decimals < 18) {
            price = uint256(answer) * (10 ** (18 - decimals));
        } else if (decimals > 18) {
            price = uint256(answer) / (10 ** (decimals - 18));
        } else {
            price = uint256(answer);
        }
    }

    function getRequiredEth(uint256 propertyId) public view returns (uint256) {
        Property memory prop = properties[propertyId];
        require(!prop.sold, "Already sold");

        uint256 ethPrice = getLatestEthPrice();
        require(ethPrice > 0, "ETH price is zero");

        uint256 requiredEth = (prop.price * 1e18) / ethPrice;
        if ((prop.price * 1e18) % ethPrice != 0) requiredEth += 1;

        return requiredEth;
    }

    
    function listProperty(
        address payable owner,
        uint256 price,
        string memory _propertyTitle,
        string memory _category,
        string[] memory _images,
        string memory _propertyAddress,
        string memory _description
    ) external returns (uint256) {
        require(price > 0, "Price must be > 0");
        require(msg.sender == owner, "Caller must be owner");
        require(kycVerifier.isKYCApproved(owner), "Owner not KYC approved");

        uint256 productId = propertyIndex++;
        Property storage property = properties[productId];
        property.productID = productId;
        property.owner = owner;
        property.price = price;
        property.propertyTitle = _propertyTitle;
        property.category = _category;
        property.propertyAddress = _propertyAddress;
        property.description = _description;
        for (uint i = 0; i < _images.length; i++) {
            property.images.push(_images[i]);
        }

        uint256 nftId = propertyNFT.mintProperty(address(this), _images[0]);
        property.nftId = nftId;

        emit PropertyListed(productId, owner, price);
        emit NFTMinted(nftId, address(this), productId);
        return productId;
    }

    // ===== escrow =====
    function depositPayment(
        uint256 id,
        uint256 duration
    ) external payable nonReentrant validProperty(id) {
        Property storage property = properties[id];
        require(!property.sold, "Already sold");
        require(msg.value >= getRequiredEth(id), "Insufficient ETH");
        require(escrows[id].amount == 0, "Already deposited");
        require(
            kycVerifier.isKYCApproved(msg.sender),
            "Buyer not KYC approved"
        );
        require(
            duration >= MIN_ESCROW_DURATION && duration <= MAX_ESCROW_DURATION,
            "Duration out of bounds"
        );

        escrows[id] = Escrow({
            buyer: msg.sender,
            amount: msg.value,
            confirmed: false,
            refunded: false,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + duration
        });

        emit PaymentDeposited(id, msg.sender, msg.value, escrows[id].expiresAt);
    }

    function confirmPurchase(
        uint256 id
    ) external nonReentrant validProperty(id) {
        Escrow storage escrow = escrows[id];
        Property storage property = properties[id];

        require(msg.sender == escrow.buyer, "Not buyer");
        require(!escrow.confirmed, "Already confirmed");
        require(escrow.amount > 0, "No escrowed funds");
        require(block.timestamp <= escrow.expiresAt, "Escrow expired");

        escrow.confirmed = true;
        property.sold = true;

        uint256 amount = escrow.amount;
        escrow.amount = 0;

        propertyNFT.safeTransferFrom(
            address(this),
            escrow.buyer,
            property.nftId
        );
        require(
            propertyNFT.ownerOf(property.nftId) == escrow.buyer,
            "NFT transfer failed"
        );

        (bool sent, ) = property.owner.call{value: amount}("");
        require(sent, "Transfer failed");

        address oldOwner = property.owner;
        property.owner = payable(escrow.buyer);
        emit PropertySold(id, oldOwner, property.owner, property.price);
    }

    function claimExpiredEscrow(uint256 id) external nonReentrant validProperty(id) {
        Escrow storage escrow = escrows[id];
        require(block.timestamp >= escrow.expiresAt, "Escrow not expired yet");
        require(
            !escrow.confirmed && !escrow.refunded,
            "Escrow already processed"
        );
        require(
            msg.sender == escrow.buyer,
            "Only buyer can claim expired escrow"
        );

        escrow.refunded = true;
        uint256 amount = escrow.amount;
        escrow.amount = 0;

        (bool sent, ) = payable(escrow.buyer).call{value: amount}("");
        require(sent, "Refund failed");

        emit DisputeResolved(id, escrow.buyer, true);
    }

    function resolveDispute(
        uint256 id,
        bool refundBuyer
    ) external nonReentrant onlyAdmin validProperty(id) {
        require(msg.sender == admin, "Only admin");
        Escrow storage escrow = escrows[id];
        Property storage property = properties[id];
        require(!escrow.confirmed, "Already confirmed");
        require(escrow.amount > 0, "No escrowed funds");

        escrow.confirmed = true;
        escrow.refunded = refundBuyer;
        property.sold = true;

        uint256 amount = escrow.amount;
        escrow.amount = 0;

        address recipient = refundBuyer ? escrow.buyer : property.owner;
        (bool sent, ) = payable(recipient).call{value: amount}("");
        require(sent, "Transfer failed");

        if (!refundBuyer) {
            address oldOwner = property.owner;
            property.owner = payable(escrow.buyer);

            propertyNFT.safeTransferFrom(
                address(this),
                escrow.buyer,
                property.nftId
            );

            emit PropertySold(id, oldOwner, property.owner, property.price);
        }

        emit DisputeResolved(id, recipient, refundBuyer);
    }

    // ===== property updates =====
    function updateProperty(
        address owner,
        uint256 productId,
        string[] memory _images,
        string memory _propertyAddress,
        string memory _propertyTitle,
        string memory _category,
        string memory _description
    ) external returns (uint256) {
        Property storage property = properties[productId];

        require(msg.sender == property.owner, "Not owner");

        property.propertyTitle = _propertyTitle;
        property.category = _category;
        property.propertyAddress = _propertyAddress;
        property.description = _description;

        delete property.images;
        for (uint i = 0; i < _images.length; i++) {
            property.images.push(_images[i]);
        }

        return productId;
    }

    function updatePrice(
        uint256 productId,
        uint256 price
    ) external returns (string memory) {
        Property storage property = properties[productId];
        require(msg.sender == property.owner, "Not owner");
        property.price = price;
        return "Price updated";
    }

    // ===== getters =====
    function getAllProperties() public view returns (Property[] memory) {
        uint256 itemCount = propertyIndex;
        Property[] memory items = new Property[](itemCount);
        for (uint256 i = 0; i < itemCount; i++) {
            items[i] = properties[i];
        }
        return items;
    }

    function getProperty(
        uint256 id
    )
        external
        view
        returns (
            uint256,
            address,
            uint256,
            string memory,
            string memory,
            string[] memory,
            string memory,
            string memory,
            bool
        )
    {
        Property memory property = properties[id];
        return (
            property.productID,
            property.owner,
            property.price,
            property.propertyTitle,
            property.category,
            property.images,
            property.propertyAddress,
            property.description,
            property.sold
        );
    }

    function getUserProperties(
        address user
    ) external view returns (Property[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < propertyIndex; i++) {
            if (properties[i].owner == user) {
                count++;
            }
        }
        Property[] memory items = new Property[](count);
        uint256 j = 0;
        for (uint256 i = 0; i < propertyIndex; i++) {
            if (properties[i].owner == user) {
                items[j++] = properties[i];
            }
        }
        return items;
    }

    // ===== Reviews =====
    function addReview(
        uint256 productId,
        uint256 rating,
        string calldata comment,
        address user
    ) external {
        require(rating >= 1 && rating <= 5, "Rating must be 1-5");

        Property storage property = properties[productId];
        property.reviewers.push(user);
        property.reviews.push(comment);

        reviews[productId].push(Review(user, productId, rating, comment, 0));
        userReviews[user].push(productId);

        products[productId].totalRating += rating;
        products[productId].numReviews++;

        emit ReviewAdded(productId, user, rating, comment);
        reviewsCounter++;
    }

    function getProductReview(
        uint256 productId
    ) external view returns (Review[] memory) {
        return reviews[productId];
    }

    function likeReview(
        uint256 productId,
        uint256 reviewIndex,
        address user
    ) external {
        require(!hasLikedReview[productId][user], "Already liked");
        hasLikedReview[productId][user] = true;

        Review storage review = reviews[productId][reviewIndex];
        review.likes++;

        emit ReviewLiked(productId, reviewIndex, user, review.likes);
    }

    function getHighestRatedProduct() external view returns (uint256) {
        uint256 highestRating = 0;
        uint256 highestRatedProductId = 0;
        for (uint256 i = 0; i < propertyIndex; i++) {
            if (products[i].numReviews > 0) {
                uint256 avgRating = products[i].totalRating /
                    products[i].numReviews;
                if (avgRating > highestRating) {
                    highestRating = avgRating;
                    highestRatedProductId = i;
                }
            }
        }
        return highestRatedProductId;
    }
}

