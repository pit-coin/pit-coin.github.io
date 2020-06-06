"use strict";
(function () {
    var mainAddress = null;
    var ropstenAddress = "0x6342A5c056F71E7E3a6Bf89560Dc1F97210bDb51";
    var goerliAddress = null;

    var abi = [
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "balanceOf",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_ref",
                    "type": "address"
                }
            ],
            "name": "buy",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_owner",
                    "type": "address"
                }
            ],
            "name": "dividendsOf",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "refDividendsOf",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "reinvest",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "_tokens",
                    "type": "uint256"
                }
            ],
            "name": "sell",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "withdraw",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ];
    var networkMain = 1;
    var networkRopsten = 3;
    var networkGoerli = 5;
    var network = null; // current network or null (if there is no address for this network)
    var contract = null; // instance of web3.Contract or null
    var account = null; // string "0x...." or null

    var blocked = true; // block buttons if there is unfinished action or page is not loaded
    var eth = null; // BigNumber, account balance in eth, or null
    var tokens = null; // BigNumber, token balance (*10**18), or null
    var eventBlockHash; // block hash of the last event

    // set button.onclick, load scripts, then init()
    window.onload = function () {
        document.getElementById("connect").onclick = function () {
            perform(null);
        };
        document.getElementById("buy").onclick = function () {
            perform(buy);
        };
        document.getElementById("sell").onclick = function () {
            perform(sell);
        };
        document.getElementById("reinvest").onclick = function () {
            perform(reinvest);
        };
        document.getElementById("withdraw").onclick = function () {
            perform(withdraw);
        };

        loadScript("assets/bignumber.min.js", function () {
            loadScript("assets/web3.min.js", init);
        });

        function loadScript(url, callback) {
            var script = document.createElement("script");
            script.src = url;
            script.onload = callback;
            document.body.appendChild(script);
        }
    };

    // initialize web3
    function init() {
        if (typeof window.ethereum === "undefined") {
            document.getElementById("notSupported").style.display = "inline";
            document.getElementById("loading").style.display = "none";
        } else {
            window.web3 = new Web3(ethereum);
            ethereum.on("accountsChanged", function (accounts) {
                if (accounts.length > 0) {
                    if (accounts[0] !== account) {
                        account = accounts[0];
                        clearAccount();
                        loadAccount();
                        printLog("address/" + account, "account ", account, null);
                    }
                } else {
                    account = null;
                    clearAccount();
                    document.getElementById("logs").innerHTML = "";
                }
            });
            ethereum.on("networkChanged", function (newNetwork) {
                loadNetwork(newNetwork);
                clearAccount();
                loadAccount();
                document.getElementById("logs").innerHTML = "";
                printLog("address/" + account, "account ", account, null);
            });
            ethereum.autoRefreshOnNetworkChange = false;

            web3.eth.net.getId().then(function (newNetwork) {
                document.getElementById("loaded").style.display = "inline";
                document.getElementById("loading").style.display = "none";
                loadNetwork(newNetwork);
                blocked = false;
            });
        }
    }

    // set network, contract address, contract balance and event listener
    function loadNetwork(newNetwork) {
        newNetwork = Number(newNetwork);
        var address;
        var prefix;
        if (newNetwork === networkMain && mainAddress) {
            address = mainAddress;
            prefix = "https://etherscan.io/address/";
        } else if (newNetwork === networkRopsten && ropstenAddress) {
            address = ropstenAddress;
            prefix = "https://ropsten.etherscan.io/address/";
        } else if (newNetwork === networkGoerli && goerliAddress) {
            address = goerliAddress;
            prefix = "https://goerli.etherscan.io/address/";
        } else {
            document.getElementById("contractNotFound").style.display = "inline";
            document.getElementById("contractAddress").innerHTML = "";
            document.getElementById("contractBalance").title = "";
            document.getElementById("contractBalance").innerHTML = "...";
            network = null;
            contract = null;
            return;
        }
        document.getElementById("contractNotFound").style.display = "none";
        document.getElementById("contractAddress").innerHTML = address;
        document.getElementById("contractAddress").href = prefix + address;
        network = newNetwork;
        contract = new web3.eth.Contract(abi, address);
        printAccountBalance(true);

        contract.events.allEvents().on("data", function (event) {
            var hash = event.blockHash;
            if (eventBlockHash !== hash) {
                eventBlockHash = hash;
                printAccountBalance(false);
                loadAccount();
            }
        });
    }

    // load referral dividend, dividend, account balance in eth and tokens, return promise 
    function loadAccount() {
        if (contract === null || account === null) {
            return;
        }

        var refDividend;
        contract.methods.refDividendsOf(account).call().then(function (result) {
            refDividend = new BigNumber(result).shiftedBy(-19);
            if (refDividend.isZero()) {
                document.getElementById("refDividend").title = "0";
                document.getElementById("refDividend").innerHTML = "0";
            } else {
                document.getElementById("refDividend").title = refDividend;
                result = refDividend.toFixed(3, BigNumber.ROUND_DOWN);
                document.getElementById("refDividend").innerHTML = result;
            }
            return contract.methods.dividendsOf(account).call();
        }).then(function (result) {
            result = new BigNumber(result).shiftedBy(-19).plus(refDividend);
            if (result.isZero()) {
                document.getElementById("dividend").title = "0";
                document.getElementById("dividend").innerHTML = "0";
            } else {
                document.getElementById("dividend").title = result;
                result = result.toFixed(3, BigNumber.ROUND_DOWN);
                document.getElementById("dividend").innerHTML = result;
            }
        }).catch(function (error) {
            console.log(error.message);
        });

        return new Promise(function (resolve, reject) {
            web3.eth.getBalance(account).then(function (balance) {
                eth = new BigNumber(balance).shiftedBy(-18);
                return contract.methods.balanceOf(account).call();
            }).then(function (balance) {
                tokens = new BigNumber(balance).shiftedBy(-18);
                if (tokens.isZero()) {
                    document.getElementById("balance").title = "0";
                    document.getElementById("balance").innerHTML = "0";
                } else {
                    document.getElementById("balance").title = tokens;
                    balance = tokens.toFixed(3, BigNumber.ROUND_DOWN);
                    document.getElementById("balance").innerHTML = balance;
                }
                resolve();
            }).catch(function (error) {
                console.log(error.message);
                reject();
            });
        });
    }

    // check if not blocked and has network and contract, load account, perform action
    function perform(action) {
        if (blocked) {
            return;
        } else if (network === null || contract === null) {
            alert("Switch the network");
            return;
        }
        blocked = true;

        if (account !== null) {
            if (eth === null || tokens === null) {
                loadAccount().then(act);
            } else {
                act();
            }
        } else {
            ethereum.enable().then(function (accounts) {
                if (accounts.length > 0) {
                    account = accounts[0];
                    loadAccount().then(act);
                    printLog("address/" + account, "account ", account, null);
                } else {
                    account = null;
                    clearAccount();
                    document.getElementById("logs").innerHTML = "";
                    blocked = false;
                }
            }).catch(function (error) {
                console.log(error.message);
                blocked = false;
            });
        }

        function act() {
            if (action) {
                action();
            } else {
                blocked = false;
            }
        }
    }

    function buy() {
        if (eth.isZero()) {
            document.getElementById("buyValue").value = "";
            document.getElementById("buyValue").placeholder = "you have no eth";
            blocked = false;
            return;
        }
        var value = new BigNumber(document.getElementById("buyValue").value);
        if (value.isNaN() || value.isGreaterThan(eth)) {
            var message = "enter number less than " + eth.toFixed(6, BigNumber.ROUND_FLOOR);
            document.getElementById("buyValue").value = "";
            document.getElementById("buyValue").placeholder = message;
            blocked = false;
            return;
        }
        var address = document.getElementById("refAddress").value;
        if (address === "") {
            document.getElementById("refAddress").placeholder = "";
            address = "0x0000000000000000000000000000000000000000";
        } else if (!web3.utils.isAddress(address)) {
            document.getElementById("refAddress").value = "";
            document.getElementById("refAddress").placeholder = "enter correct address";
            blocked = false;
            return;
        }

        var waitMessage;
        contract.methods.buy(address).send({
            from: account,
            value: value.shiftedBy(18)
        }).on("transactionHash", function (hash) {
            document.getElementById("buyValue").value = "";
            document.getElementById("buyValue").placeholder = "";
            document.getElementById("refAddress").value = "";
            document.getElementById("refAddress").placeholder = "";
            blocked = false;
            waitMessage = document.createElement("span");
            waitMessage.innerHTML = ", waiting confirmation...";
            printLog("tx/" + hash, "buy, ", hash, waitMessage);
        }).on("confirmation", function (confirmationNumber, receipt) {
            if (confirmationNumber == 0) {
                waitMessage.innerHTML = receipt.status ? ", confirmed" : ", rejected";
            }
        }).catch(function (error) {
            blocked = false;
            console.log(error.message);
        });
    }

    function sell() {
        if (tokens.isZero()) {
            document.getElementById("sellValue").value = "";
            document.getElementById("sellValue").placeholder = "you have no tokens";
            blocked = false;
            return;
        }
        var value = new BigNumber(document.getElementById("sellValue").value);
        if (value.isNaN() || value.isGreaterThan(tokens)) {
            var message = "enter number not greater than " + tokens.toFixed(6, BigNumber.ROUND_FLOOR);
            document.getElementById("sellValue").value = "";
            document.getElementById("sellValue").placeholder = message;
            blocked = false;
            return;
        }
        value = value.shiftedBy(18).toFixed(0);

        var waitMessage;
        contract.methods.sell(value).send({
            from: account
        }).on("transactionHash", function (hash) {
            document.getElementById("sellValue").value = "";
            document.getElementById("sellValue").placeholder = "";
            blocked = false;
            waitMessage = document.createElement("span");
            waitMessage.innerHTML = ", waiting confirmation...";
            printLog("tx/" + hash, "sell, ", hash, waitMessage);
        }).on("confirmation", function (confirmationNumber, receipt) {
            if (confirmationNumber == 0) {
                waitMessage.innerHTML = receipt.status ? ", confirmed" : ", rejected";
            }
        }).catch(function (error) {
            blocked = false;
            console.log(error.message);
        });
    }

    function withdraw() {
        var waitMessage;
        contract.methods.withdraw().send({
            from: account
        }).on("transactionHash", function (hash) {
            blocked = false;
            waitMessage = document.createElement("span");
            waitMessage.innerHTML = ", waiting confirmation...";
            printLog("tx/" + hash, "withdraw, ", hash, waitMessage);
        }).on("confirmation", function (confirmationNumber, receipt) {
            if (confirmationNumber == 0) {
                waitMessage.innerHTML = receipt.status ? ", confirmed" : ", rejected";
            }
        }).catch(function (error) {
            blocked = false;
            console.log(error.message);
        });
    }

    function reinvest() {
        var waitMessage;
        contract.methods.reinvest().send({
            from: account
        }).on("transactionHash", function (hash) {
            blocked = false;
            waitMessage = document.createElement("span");
            waitMessage.innerHTML = ", waiting confirmation...";
            printLog("tx/" + hash, "reinvest, ", hash, waitMessage);
        }).on("confirmation", function (confirmationNumber, receipt) {
            if (confirmationNumber == 0) {
                waitMessage.innerHTML = receipt.status ? ", confirmed" : ", rejected";
            }
        }).catch(function (error) {
            blocked = false;
            console.log(error.message);
        });
    }

    function printAccountBalance(clear) {
        if (clear) {
            document.getElementById("contractBalance").title = "";
            document.getElementById("contractBalance").innerHTML = "...";
        }
        var address;
        if (network === networkMain) {
            address = mainAddress;
        } else if (network === networkRopsten) {
            address = ropstenAddress;
        } else if (network === networkGoerli) {
            address = goerliAddress;
        } else {
            return;
        }
        web3.eth.getBalance(address).then(function (balance) {
            balance = new BigNumber(balance).shiftedBy(-18);
            if (balance.isZero()) {
                document.getElementById("contractBalance").title = "0";
                document.getElementById("contractBalance").innerHTML = "0";
            } else {
                document.getElementById("contractBalance").title = balance;
                balance = balance.toFixed(6, BigNumber.ROUND_DOWN);
                document.getElementById("contractBalance").innerHTML = balance;
            }
        });
    }

    // clear account balances, all forms, replace account balance and dividends with "..."
    function clearAccount() {
        eth = null;
        tokens = null;
        document.getElementById("balance").title = "";
        document.getElementById("balance").innerHTML = "...";
        document.getElementById("buyValue").innerHTML = "";
        document.getElementById("buyValue").placeholder = "";
        document.getElementById("refAddress").innerHTML = "";
        document.getElementById("refAddress").placeholder = "";
        document.getElementById("sellValue").innerHTML = "";
        document.getElementById("sellValue").placeholder = "";
        document.getElementById("dividend").title = "";
        document.getElementById("dividend").innerHTML = "...";
        document.getElementById("refDividend").title = "";
        document.getElementById("refDividend").innerHTML = "...";
    }

    // print log before all logs with string prefix and element suffix
    function printLog(path, prefix, message, suffix) {
        if (message === null || network === null) {
            return;
        }
        var p = document.createElement("p");
        p.classList.add("onestring");
        if (prefix) {
            var span = document.createElement("span");
            span.innerHTML = prefix;
            p.appendChild(span);
        }
        var a = document.createElement("a");
        a.innerHTML = message;
        if (network === networkMain) {
            a.href = "https://etherscan.io/" + path;
        } else if (network === networkRopsten) {
            a.href = "https://ropsten.etherscan.io/" + path;
        } else if (network === networkGoerli) {
            a.href = "https://goerli.etherscan.io/" + path;
        }
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener");
        p.appendChild(a);
        if (suffix) {
            p.appendChild(suffix);
        }

        var logs = document.getElementById("logs");
        logs.insertBefore(p, logs.firstChild);
    }
})();
