pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract FairPayWithRU is ERC20 {
    using SafeMath for uint256;

    address public owner;
    uint256 public MinVP;
    uint256 public MaxVP;
    uint256 public RUAmount;
    uint256 public euroValue;
    uint256 public cvunRate;
    uint256 public cvunCap;
    uint256 public utmRate; // Taux de conversion temps en UTM (1 seconde = utmRate UTM)
    mapping(address => uint256) public userVP;
    mapping(address => uint256) public userRU;
    mapping(address => uint256) public userUTM; // Stockage des UTM
    mapping(address => uint256) public startTime; // Stockage du temps de début

    constructor() ERC20("FairPayToken", "FPT") {
        owner = msg.sender;
        MinVP = 314 * 10 ** decimals();
        MaxVP = 5314 * 10 ** decimals();
        RUAmount = 100 * 10 ** decimals();
        euroValue = 1 * 10 ** decimals();
        cvunRate = 10 * 10 ** decimals();
        cvunCap = 10000 * 10 ** decimals();
        utmRate = 1; // 1 seconde = 1 UTM par défaut
        _mint(msg.sender, 10000 * 10 ** decimals()); // Création de 10000 jetons pour le propriétaire
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    function seteuroValue(uint256 _euroValue) external onlyOwner {
        euroValue = _euroValue * 10 ** decimals();
    }

    function setCvunRate(uint256 _cvunRate) external onlyOwner {
        cvunRate = _cvunRate * 10 ** decimals();
    }

    function setCvunCap(uint256 _cvunCap) external onlyOwner {
        cvunCap = _cvunCap * 10 ** decimals();
    }

    function setUtmRate(uint256 _utmRate) external onlyOwner {
        utmRate = _utmRate;
    }

    function updateCvun(address account, uint256 value) external onlyOwner {
        uint256 cvun = userVP[account] * cvunRate;
        if (cvun > cvunCap) {
            cvun = cvunCap;
        }
        userVP[account] += cvun;
    }

    function getCvunRate() public view returns (uint256) {
        return cvunRate;
    }

    function geteuroValue() public view returns (uint256) {
        return euroValue;
    }

    function distributeRU() public {
        // Supposons que vous ayez une manière de suivre les utilisateurs.
        // Ici je simule une list d'adresse.
        address [] memory userList = new address[](2);
        userList[0] = owner;
        userList[1] = msg.sender;

        for (uint256 i = 0; i < userList.length; i++) {
            if (userVP[userList[i]] >= MinVP) {
                userRU[userList[i]] += RUAmount;
            }
        }
    }

    function claimRU() public {
        uint256 amount = userRU[msg.sender];
        require(amount > 0, "No RU to claim");
        userRU[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    function getUserLevel(address account) public view returns (uint256) {
        if (userVP[account] >= MinVP && userVP[account] < MaxVP) {
            return 1;
        } else if (userVP[account] >= MaxVP) {
            return 5;
        } else {
            return 0;
        }
    }

    function mint(address account, uint256 amount) external onlyOwner {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) external onlyOwner {
        _burn(account, amount);
    }

    function transferFrom(address sender, address recipient, uint256 amount) external onlyOwner {
        _transfer(sender, recipient, amount);
    }

    // Fonctions UTM
    function startTrackingTime() external {
        startTime[msg.sender] = block.timestamp;
    }

    function stopTrackingTime() external {
        require(startTime[msg.sender] != 0, "Tracking not started");
        uint256 elapsedTime = block.timestamp - startTime[msg.sender];
        uint256 utmEarned = elapsedTime * utmRate;
        userUTM[msg.sender] += utmEarned;
        delete startTime[msg.sender];
    }

    function claimUTM() external {
        uint256 utmToClaim = userUTM[msg.sender];
        require(utmToClaim > 0, "No UTM to claim");
        userUTM[msg.sender] = 0;
        _mint(msg.sender, utmToClaim); // Exemple : 1 UTM = 1 FPT
    }
}