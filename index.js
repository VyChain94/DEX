
//   DEX


const BigNumber = require('bignumber.js');
//installing browserify allows us to require ('modules') in the browser by bundling up all our dependencies
// https://browserify.org/
// npm install -g browserify
// replace indexjs to bundlejs in html
const qs = require('qs');
const Web3 = require('web3');

let currentTrade = {};
let currentSelectSide;
let tokens;

async function init() {
    await listAvailableTokens();
}

async function listAvailableTokens(){
    console.log("initializing");
    let response = await fetch('https://www.gemini.com/uniswap/manifest.json');
    // alternatives for better : images, less token options.
    // https://tokens.coingecko.com/uniswap/all.json
    // https://www.gemini.com/uniswap/manifest.json
    let tokenListJSON = await response.json();
    console.log("listing available tokens: ", tokenListJSON);
    tokens = tokenListJSON.tokens;
    console.log("tokens: ", tokens);

    // Create token list for modal
    let parent = document.getElementById("token_list");
    for (const i in tokens){
        // Token row in the modal token list
        let div = document.createElement("div");
        div.className = "token_row";
        let html = `
        <img class="token_list_img" src="${tokens[i].logoURI}">
          <span class="token_list_text">${tokens[i].symbol}</span>
          `;
        div.innerHTML = html;
        div.onclick = () => {
            selectToken(tokens[i]);
        };
        parent.appendChild(div);
    };
}

async function selectToken(token){
    closeModal();
    currentTrade[currentSelectSide] = token;
    console.log("currentTrade: ", currentTrade);
    renderInterface();
}

function renderInterface(){
    if (currentTrade.from){
        console.log(currentTrade.from)
        document.getElementById("from_token_img").src = currentTrade.from.logoURI;
        document.getElementById("from_token_text").innerHTML = currentTrade.from.symbol;
    }
    if (currentTrade.to){
        console.log(currentTrade.to)
        document.getElementById("to_token_img").src = currentTrade.to.logoURI;
        document.getElementById("to_token_text").innerHTML = currentTrade.to.symbol;
    }
}

async function connect() {
    if (typeof window.ethereum !== "undefined") {
        try {
            console.log("connecting");
            await ethereum.request({ method: "eth_requestAccounts" });
        } catch (error) {
            console.log(error);
        }
        document.getElementById("login_button").innerHTML = "Connected";
        // const accounts = await ethereum.request({ method: "eth_accounts" });
        document.getElementById("swap_button").disabled = false;
    } else {
        document.getElementById("login_button").innerHTML = "Please install MetaMask";
    }
}

function openModal(side){
    currentSelectSide = side;
    document.getElementById("token_modal").style.display = "block";
}

function closeModal(){
    document.getElementById("token_modal").style.display = "none";
}



async function getPrice(){
    console.log("Getting Price");
//only trigger if these are a go, if not then dont trigger
    if (!currentTrade.from || !currentTrade.to || !document.getElementById("from_amount").value){ return};
    //to get amount a user wants to trade, convert from input number to base unit of the token.. 
    //multiply from_amount by 10 to the power of decimals the token has (10)BECAUSE ITS IN WEI..WE COUNT 18 DECIMALS
    let amount = Number(document.getElementById("from_amount").value * 10 ** currentTrade.from.decimals);
  
    const params = {
        //ADRESS FOR SELL TOKEN
        sellToken: currentTrade.from.address,
        //ADDRESS TO TO TOKEN WE WANT TO TRADE
        buyToken: currentTrade.to.address,
        //AMOUNT WE CREATED ABOVE.. AMOUNT + 18 ZEROS
        sellAmount: amount,
    }
  
    // Fetch the swap price.
    //CALL TO MAINNET, USE PRICE AND PUT OUT PARAMS INTO THE REQUEST WITH QS STRINGIFY
    const response = await fetch(`https://api.0x.org/swap/v1/price?${qs.stringify(params)}`);
    // PARSE OUT WHAT IS RETURNED IN JSON AND PROPERLY DISPLAY IN UI
    swapPriceJSON = await response.json();
    //console log json inside price object
    console.log("Price: ", swapPriceJSON);
    
    // display in UI
    document.getElementById("to_amount").value = swapPriceJSON.buyAmount / (10 ** currentTrade.to.decimals);
    document.getElementById("gas_estimate").innerHTML = swapPriceJSON.gas
}

async function getQuote(account){
    console.log("Getting Quote");
  
    if (!currentTrade.from || !currentTrade.to || !document.getElementById("from_amount").value) return;
    let amount = Number(document.getElementById("from_amount").value * 10 ** currentTrade.from.decimals);
  
    const params = {
        sellToken: currentTrade.from.address,
        buyToken: currentTrade.to.address,
        sellAmount: amount,
        takerAddress: account,

    }
  
    // Fetch the swap quote.
    const response = await fetch(`https://api.0x.org/swap/v1/quote?${qs.stringify(params)}`);
    
    swapQuoteJSON = await response.json();
    console.log("Quote: ", swapQuoteJSON);


    document.getElementById("to_sources").innerHTML = swapQuoteJSON.sources;
    document.getElementById("to_amount").value = swapQuoteJSON.buyAmount / (10 ** currentTrade.to.decimals);
    // Change estimated gas item to priceImpact or gasprice to convert to price
    document.getElementById("gas_estimate").innerHTML = swapQuoteJSON.gas;

    return swapQuoteJSON;
}



async function trySwap(){
  // The address, if any, of the most recently used account that the caller is permitted to access
  let accounts = await ethereum.request({ method: "eth_accounts" });
  let takerAddress = accounts[0];
  // log the most recently used address in our wallet
  console.log("takerAddress: ", takerAddress);

    const erc20abi= [{ "inputs": [ { "internalType": "string", "name": "name", "type": "string" }, { "internalType": "string", "name": "symbol", "type": "string" }, { "internalType": "uint256", "name": "max_supply", "type": "uint256" } ], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "spender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" } ], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" } ], "name": "Transfer", "type": "event" }, { "inputs": [ { "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" } ], "name": "allowance", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "approve", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "account", "type": "address" } ], "name": "balanceOf", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "burn", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "account", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "burnFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "decimals", "outputs": [ { "internalType": "uint8", "name": "", "type": "uint8" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "subtractedValue", "type": "uint256" } ], "name": "decreaseAllowance", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "addedValue", "type": "uint256" } ], "name": "increaseAllowance", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "name", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "symbol", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalSupply", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "transfer", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "sender", "type": "address" }, { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "transferFrom", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }]
    console.log("trying swap");    
    // Set up approval amount
        const fromTokenAddress = currentTrade.from.address;

  
    // Only work if MetaMask is connect
    // Connecting to Ethereum: Metamask
    const web3 = new Web3(Web3.givenProvider);
  
    
  
    // Set Token Allowance

    const maxApproval = new BigNumber(2).pow(256).minus(1);
    console.log("approval amount: ", maxApproval);
    
    const ERC20TokenContract = new web3.eth.Contract(erc20abi, fromTokenAddress);
    console.log("setup ERC20TokenContract: ", ERC20TokenContract);
  
    // Grant the allowance target an allowance to spend our tokens.
    const tx = await ERC20TokenContract.methods
        .approve(swapPriceJSON.allowanceTarget,maxApproval)
        .send({ from: takerAddress })
        .then(tx => {
        console.log("tx: ", tx)
    });
          // Pass this as the account param into getQuote() we built out earlier. This will return a JSON object trade order. 
const  swapQuoteJSON = await  getQuote(takerAddress);
        // Perform the swap
    const  receipt = await  web3.eth.sendTransaction(swapQuoteJSON);
    console.log("receipt: ", receipt);
}

init();



document.getElementById("login_button").onclick = connect;
document.getElementById("from_token_select").onclick = () => {
    openModal("from");
};
document.getElementById("to_token_select").onclick = () => {
    openModal("to");
};
document.getElementById("modal_close").onclick = closeModal;
// Challenge 3 complete!!
//calculate price when user enters blurs on from and to token
// document.getElementById("to_amount").onblur = getPrice;
document.getElementById("from_amount").onblur = getPrice;
document.getElementById("swap_button").onclick = trySwap;
