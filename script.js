let btc =document.getElementById("btc");
let eth =document.getElementById("eth");
// let link =document.getElementById("link");
let celo =document.getElementById("celo");
let algo =document.getElementById("algo");
let xlm =document.getElementById("xlm");

let settings = {
    "async":"true",
    "scrossDomain":"true",
    "url":"https://api.coingecko.com/api/v3/simple/price?ids=bitcoin%2Cethereum%2Calgorand%2C0x%2Cstellar&vs_currencies=usd",
    "method":"GET",
    "headers":{}
}
$.ajax(settings).done(function(response){
    console.log(response);
    btc.innerHTML = response.bitcoin.usd
    eth.innerHTML = response.ethereum.usd
    // link.innerHTML = response.chainlink.usd
    algo.innerHTML = response.algorand.usd
    xlm.innerHTML = response.stellar.usd
});



