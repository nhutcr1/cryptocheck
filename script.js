var number_coin_binance = 2005;
var time_interval = 15;
var percent_price = 1;

var api_binace_list = "https://api3.binance.com/api/v3/exchangeInfo";
var api_ftx_list = "https://www.ftx.com/api/v5/market/tickers?instType=SPOT";
var api_ftx_coin = "https://www.ftx.com/api/v5/market/candles?instId=BTC-USDT&limit=1";
var api_FTX_list = "https://ftx.com/api/markets";
var url_proxy2 = "https://api.allorigins.win/raw?url=";

var list_a = [];
var list_b = [];
var myModal = new bootstrap.Modal(document.getElementById('myModal'),{keyboard:false, backdrop: 'static',});
myModal.show();
function main() {
    load_list_coin_binance();
}
main();


// load coin Binance //////////////////////////////////////////////////////////////////////////////////////////////////
function process_response_list_market(response) {
    console.log("Process response!");
    if (!response.ok) {
        throw Error(response.statusText);
    }
    return response.json();
}
function process_error(ex) {
    console.log("Error connect!");
    console.log(ex);
}

function process_data_list_market(data_res) {
    console.log("Process data!");
    console.log(data_res.symbols.length);
    
    for(let i=0; i< data_res.symbols.length; i++){
        if (data_res.symbols[i].symbol.indexOf("USDT") >= 1){
            let name =data_res.symbols[i].symbol.substring(0, data_res.symbols[i].symbol.lastIndexOf("USDT"));
            if(name.indexOf("NANO")==0 || name.indexOf("MCO")==0 || name.indexOf("HC")==0 
            || name.indexOf("DAI")==0
            || name.indexOf("BULL")>=0|| name.indexOf("BEAR")>=0){
                continue;
            }
            if(name.indexOf("XNO")==0){
                name = "NANO";
            }
            list_a.push({
                name:name,
                code:data_res.symbols[i].symbol
            });
        }
    }
    var list_a_tmp = list_a.sort((a, b) => {
        if (a.name > b.name){
            return 1;
        } else if (a.name < b.name){
            return -1;
        } else {
            return 0
        }
    });
    list_a = list_a_tmp;
    console.log(list_a);
}

function load_list_coin_binance() {    
    document.getElementById("loading_text").innerHTML="Loading coins.";

    fetch(url_proxy2 + encodeURIComponent(api_binace_list), {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "Origin": "cryptocheck.surge.sh",
        },
    })
    .then(process_response_list_market)
    .then(process_data_list_market)
    .then(load_list_coin_ftx)
    .catch(process_error);
}

function process_data_list_ftx(data_res) {
    console.log("Process data!");
    console.log(data_res.result.length);
        
    for(let i=0; i< data_res.result.length; i++){
        let name = "";
        if (data_res.result[i].name.indexOf("/USDT") >= 1){
            name = data_res.result[i].name.substring(0, data_res.result[i].name.lastIndexOf("/USDT"));
        } else if (data_res.result[i].name.indexOf("/USD") >= 1){
            name = data_res.result[i].name.substring(0, data_res.result[i].name.lastIndexOf("/USD"));
        }
        if (name != "") {
            if(name.indexOf("BTT")==0){
                name = "BTTC";
            }            

            list_b.push({
                name:name,
                code:data_res.result[i].name
            });
        }
    }
    list_b.sort();
    console.log(list_b);
}
function load_list_coin_ftx() {    
    document.getElementById("loading_text").innerHTML="Loading coins.";

    fetch(url_proxy2 + encodeURIComponent(api_FTX_list), {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "Origin": "cryptocheck.surge.sh",
        },
    })
    .then(process_response_list_market)
    .then(process_data_list_ftx)
    .then(mix_coin)
    .then(function(){
        load_coin();
        setInterval(function(){
            load_coin();
        }, 90000);
    });
}

function mix_coin() {
    var list_b_tmp = [];
    for (let i = 0; i < list_a.length; i++) {
        let is_have = -1;
        let j = 0;
        for (; j < list_b.length; j++) {
            if (list_a[i].name == list_b[j].name) {
                is_have = j;
                break;
            }
        }

        if (is_have == -1) {
            list_a.splice(i, 1);
            i--;
        } else {
            list_b_tmp.push(list_b[j]);
        }
    }
    list_b = list_b_tmp;
    console.log(list_a.length);
    console.log(list_b.length);
}

function check_res(response){
    if (!response.ok) {
        throw Error(response.statusText);
    }
    return response.json();
}
async function load_coin() {    
    var number_coin = 0;
    let start_date = (new Date()).getTime()/1000-90;            
    start_date = start_date.toString();
    for (let i=0; i<list_a.length; i++) {        
        let urla = url_proxy2+encodeURIComponent("https://api.binance.com/api/v3/klines?symbol="+list_a[i].code+"&interval=1m&startTime="+(start_date*1000));
        await fetch(urla)
        .then(check_res)
        .then(function(data_a){            
            // console.log(list_a[i].code);
            list_a[i].price = roundTo9(data_a[data_a.length-1][4]);
        })
        .then(function(){            
            fetch(url_proxy2 + encodeURIComponent(api_FTX_list+'/'+list_b[i].code+'/candles?resolution=60' + "&start_time="+start_date))
            .then(check_res)
            .then(function(data_b){
                // console.log(list_b[i].code);
                list_b[i].price = roundTo9(data_b.result[data_b.result.length-1].close);
                number_coin += 1;
                document.getElementById("loading_text").innerHTML="Loading "+number_coin+" coins.";
            })
            .then(function(){                
                if (number_coin == list_a.length) {
                    console.log("fin");                   
                    
                    let html = "";
                    for (let i = 0; i < list_a.length; i++) {
                        let diff = roundTo9(list_b[i].price - list_a[i].price);
                        if(isNaN(diff)) diff=list_b[i].price - list_a[i].price;
                        list_a[i].diff = diff;
                        let diff_perc = roundTo2(diff / list_a[i].price * 100);
                        if (diff_perc < 0 || diff_perc > 0) {                        
                            let class_diff = "text-success";
                            if (diff < 0) {
                                class_diff = "text-danger";
                            }
                            html +="<tr>\
                                        <td>\
                                            <span>" + list_a[i].code +' '+list_b[i].code+'</span>\
                                        </td>\
                                        <td class="text-end">\
                                            <span>' + list_a[i].price +'</span>\
                                        </td>\
                                        <td class="text-end">\
                                            <span>' +list_b[i].price +'</span>\
                                        </td>\
                                        <td class="text-end">\
                                            <span>' +diff +'</span>\
                                            <span class="' +class_diff +'">' +diff_perc +"%</span>\
                                        </td>\
                                    </tr>";
                        }
                    }
                    document.getElementById("table-body-coin").innerHTML = html;
                    myModal.hide();
                }
            });
        }).catch(process_error);
    }
}


// fetch("https://api.allorigins.win/raw?url=https://api3.binance.com/api/v3/exchangeInfo").then(response=>response.json())
// fetch("https://api.allorigins.win/raw?url="+encodeURIComponent("https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=1m&limit=1")).then(response=>response.json())
function roundTo2(num) {
    return +(Math.round(num + "e+2")  + "e-2");
}
function roundTo9(num) {
    return +(Math.round(num + "e+9")  + "e-9");
}
function roundTo12(num) {
    return +(Math.round(num + "e+12")  + "e-12");
}