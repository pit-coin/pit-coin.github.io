"use strict";

(function () {
    var mainAddress = '0x99cbe93AFee15456a1115540e7F534F6629bAB3f';
    var ropstenAddress = '0x6342A5c056F71E7E3a6Bf89560Dc1F97210bDb51';
    var goerliAddress = '0x6011b6573fA152ded3d3188Ee6a90842BEa38b42';
    var networkMain = 1;
    var networkRopsten = 3;
    var networkGoerli = 5;
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

    var network = null;
    var contract;
    var account = null;
    var blocked = false;
    var accountEth = null;
    var accountTokens = null;

    window.onload = function () {
        document.getElementById('connect').onclick = connect;
        document.getElementById('buy').onclick = buy;
        document.getElementById('sell').onclick = sell;
        document.getElementById('reinvest').onclick = reinvest;
        document.getElementById('withdraw').onclick = withdraw;

        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/web3@latest/dist/web3.min.js';
        script.onload = function () {
            if (typeof window.ethereum === 'undefined') {
                document.getElementById('startMessage').innerHTML = 'install ' +
                    '<a href="https://metamask.io/download.html" target="_blank" rel="noopener">' +
                    'metamask</a> or use ' +
                    '<a href="https://opera.com" target="_blank" rel="noopener">opera</a>';
            } else {
                document.getElementById('startMessage').innerHTML = '';
                document.getElementById('startMessage').style.display = 'none';
                document.getElementById('connect').style.display = 'block';
                window.web3 = new Web3(ethereum);
                load();
                if (typeof ethereum.on !== 'undefined') {
                    ethereum.on('chainChanged', load);
                    ethereum.on('accountsChanged', load);
                    ethereum.autoRefreshOnNetworkChange = false;
                }
            }
        };
        document.body.appendChild(script);

        document.getElementById('buyValue').onkeyup = function (event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                buy();
            }
        };
        document.getElementById('refAddress').onkeyup = function (event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                buy();
            }
        };
        document.getElementById('sellValue').onkeyup = function (event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                sell();
            }
        };
    };

    function load() {
        web3.eth.getChainId().then(function (newNetwork) {
            newNetwork = Number(newNetwork);
            if (newNetwork !== networkMain && newNetwork !== networkRopsten &&
                newNetwork !== networkGoerli) {
                network = null;
                account = null;
                document.getElementById('startMessage').innerHTML =
                    'switch to the main, ropsten or goerli network';
                document.getElementById('startMessage').style.display = 'block';
                document.getElementById('connect').style.display = 'block';
                printContractLink(networkMain);
                clearContractBalance();
                clearAccount();
                document.getElementById('logs').innerHTML = '';
                return;
            }
            if (network !== newNetwork) {
                network = newNetwork;
                account = null;
                if (network === networkMain) {
                    contract = new web3.eth.Contract(abi, mainAddress);
                } else if (network === networkRopsten) {
                    contract = new web3.eth.Contract(abi, ropstenAddress);
                } else if (network === networkGoerli) {
                    contract = new web3.eth.Contract(abi, goerliAddress);
                }
                document.getElementById('startMessage').innerHTML = '';
                document.getElementById('startMessage').style.display = 'none';
                printContractLink(network);
                clearContractBalance();
                loadContractBalance();
                document.getElementById('logs').innerHTML = '';
                printNetwork();
                contract.events.allEvents().on('data', function () {
                    if (network !== null) {
                        loadContractBalance();
                        if (account !== null) {
                            loadAccount();
                        }
                    }
                });
            }

            web3.eth.getAccounts().then(function (accounts) {
                if (accounts.length === 0) {
                    account = null;
                    document.getElementById('connect').style.display = 'block';
                    clearAccount();
                    document.getElementById('logs').innerHTML = '';
                    return;
                }
                if (accounts[0] === account) {
                    return;
                }
                account = accounts[0];
                document.getElementById('connect').style.display = 'none';
                clearAccount();
                loadAccount();
                logAccount();
            }).catch(error);
        }).catch(error);
    }

    function connect() {
        if (typeof window.ethereum === 'undefined') {
            alert('ethereum is not loaded');
            return;
        }
        var f;
        if (typeof ethereum.request === 'undefined') {
            f = ethereum.enable();
        } else {
            f = ethereum.request({method: 'eth_requestAccounts'});
        }
        f.then(function () {
            return web3.eth.getChainId();
        }).then(function (newNetwork) {
            newNetwork = Number(newNetwork);
            if (newNetwork !== networkMain && newNetwork !== networkRopsten &&
                newNetwork !== networkGoerli) {
                alert('switch to the main, ropsten or goerli network');
            }
        }).catch(error);
    }

    function buy() {
        document.getElementById('buyValueHint').innerHTML = '';
        document.getElementById('refAddressHint').innerHTML = '';
        if (!check()) {
            return;
        }
        if (accountEth && accountEth.isZero()) {
            document.getElementById('buyValueHint').innerHTML = 'you have no eth';
            return;
        }
        var value = new BigNumber(document.getElementById('buyValue').value);
        if (value.isNaN()) {
            document.getElementById('buyValueHint').innerHTML = 'enter a number';
            document.getElementById('buyValue').focus();
            return;
        }
        if (value.isNegative() || value.isZero()) {
            document.getElementById('buyValueHint').innerHTML = 'enter a positive number';
            document.getElementById('buyValue').focus();
            return;
        }
        if (accountEth && value.isGreaterThan(accountEth)) {
            document.getElementById('buyValueHint').innerHTML =
                'enter a number less than ' + accountEth.toFixed(6, BigNumber.ROUND_FLOOR);
            document.getElementById('buyValue').focus();
            return;
        }
        var address = document.getElementById('refAddress').value;
        if (address !== '' && !web3.utils.isAddress(address)) {
            document.getElementById('refAddressHint').innerHTML = 'enter correct address';
            document.getElementById('refAddress').focus();
            return;
        }

        blocked = true;
        if (address !== '') {
            contract.methods.balanceOf(address).call().then(function (balance) {
                if (new BigNumber(balance).shiftedBy(-18).isLessThan(10)) {
                    document.getElementById('refAddressHint').innerHTML = 'not a referral';
                    document.getElementById('refAddress').focus();
                    blocked = false;
                } else {
                    doTx();
                }
            }).catch(error);
        } else {
            address = '0x0000000000000000000000000000000000000000';
            doTx();
        }

        function doTx() {
            var message;
            contract.methods.buy(address).send({
                from: account,
                value: value.shiftedBy(18)
            }).on('transactionHash', function (hash) {
                document.getElementById('buyValue').value = '';
                document.getElementById('refAddress').value = '';
                message = logTx('purchase for ' + value + ' ETH', hash);
                blocked = false;
            }).on('confirmation', function (confirmationNumber, receipt) {
                if (confirmationNumber != 0) {
                    return;
                }
                if (!receipt.status) {
                    message.innerHTML = ' - rejected';
                } else {
                    loadContractBalance();
                    loadAccount();
                    message.innerHTML = ' - confirmed';
                }
            }).catch(error);
        }
    }

    function sell() {
        document.getElementById('sellValueHint').innerHTML = '';
        if (!check()) {
            return;
        }
        if (accountTokens && accountTokens.isZero()) {
            document.getElementById('sellValueHint').innerHTML = 'you have no tokens';
            document.getElementById('buyValue').focus();
            return;
        }
        var value = new BigNumber(document.getElementById('sellValue').value);
        if (value.isNaN()) {
            document.getElementById('sellValueHint').innerHTML = 'enter a number';
            document.getElementById('sellValue').focus();
            return;
        }
        if (value.isNegative() || value.isZero()) {
            document.getElementById('sellValueHint').innerHTML = 'enter a positive number';
            document.getElementById('sellValue').focus();
            return;
        }
        if (accountTokens && value.isGreaterThan(accountTokens)) {
            document.getElementById('sellValueHint').innerHTML =
                'enter a number less than ' + accountTokens.toFixed(6, BigNumber.ROUND_FLOOR);
            document.getElementById('sellValue').focus();
            return;
        }

        blocked = true;
        var message;
        contract.methods.sell(value.shiftedBy(18).toFixed(0)).send({
            from: account
        }).on('transactionHash', function (hash) {
            document.getElementById('sellValue').value = '';
            message = logTx('sale of ' + value + ' PIT', hash);
            blocked = false;
        }).on('confirmation', function (confirmationNumber, receipt) {
            if (confirmationNumber != 0) {
                return;
            }
            if (!receipt.status) {
                message.innerHTML = ' - rejected';
            } else {
                loadAccount();
                message.innerHTML = ' - confirmed';
            }
        }).catch(error);
    }

    function withdraw() {
        if (!check()) {
            return;
        }

        blocked = true;
        var message;
        contract.methods.withdraw().send({
            from: account
        }).on('transactionHash', function (hash) {
            message = logTx('withdrawal', hash);
            blocked = false;
        }).on('confirmation', function (confirmationNumber, receipt) {
            if (confirmationNumber != 0) {
                return;
            }
            if (!receipt.status) {
                message.innerHTML = ' - rejected';
            } else {
                loadContractBalance();
                loadAccount();
                message.innerHTML = ' - confirmed';
            }
        }).catch(error);
    }

    function reinvest() {
        if (!check()) {
            return;
        }

        blocked = true;
        var message;
        contract.methods.reinvest().send({
            from: account
        }).on('transactionHash', function (hash) {
            message = logTx('reinvest', hash);
            blocked = false;
        }).on('confirmation', function (confirmationNumber, receipt) {
            if (confirmationNumber != 0) {
                return;
            }
            if (!receipt.status) {
                message.innerHTML = ' - rejected';
            } else {
                loadAccount();
                message.innerHTML = ' - confirmed';
            }
        }).catch(error);
    }


    function printContractLink(network) {
        if (network === networkMain) {
            document.getElementById('contract').innerHTML = mainAddress;
            document.getElementById('contract').href =
                'https://etherscan.io/address/' + mainAddress;
        } else if (network === networkRopsten) {
            document.getElementById('contract').innerHTML = ropstenAddress;
            document.getElementById('contract').href =
                'https://ropsten.etherscan.io/address/' + ropstenAddress;
        } else if (network === networkGoerli) {
            document.getElementById('contract').innerHTML = goerliAddress;
            document.getElementById('contract').href =
                'https://goerli.etherscan.io/address/' + goerliAddress;
        }
    }

    function clearContractBalance() {
        document.getElementById('contractBalance').title = '';
        document.getElementById('contractBalance').innerHTML = '...';
    }

    function loadContractBalance() {
        web3.eth.getBalance(contract.options.address).then(function (balance) {
            balance = new BigNumber(balance).shiftedBy(-18);
            printValue(balance, document.getElementById('contractBalance'));
        }).catch(error);
    }

    function clearAccount() {
        accountEth = null;
        accountTokens = null;
        document.getElementById('balance').title = '';
        document.getElementById('balance').innerHTML = '...';
        document.getElementById('buyValueHint').innerHTML = '';
        document.getElementById('buyValue').value = '';
        document.getElementById('refAddressHint').innerHTML = '';
        document.getElementById('refAddress').value = '';
        document.getElementById('sellValueHint').innerHTML = '';
        document.getElementById('sellValue').value = '';
        document.getElementById('dividend').title = '';
        document.getElementById('dividend').innerHTML = '...';
        document.getElementById('refDividend').title = '';
        document.getElementById('refDividend').innerHTML = '...';
    }

    function loadAccount() {
        var refDividend;
        contract.methods.refDividendsOf(account).call().then(function (dividends) {
            refDividend = new BigNumber(dividends).shiftedBy(-19);
            printValue(refDividend, document.getElementById('refDividend'));
            return contract.methods.dividendsOf(account).call();
        }).then(function (dividends) {
            if (dividends === '1') {
                dividends = '0';
            }
            dividends = new BigNumber(dividends).shiftedBy(-19).plus(refDividend);
            printValue(dividends, document.getElementById('dividend'));
        }).catch(error);
        contract.methods.balanceOf(account).call().then(function (balance) {
            accountTokens = new BigNumber(balance).shiftedBy(-18);
            printValue(accountTokens, document.getElementById('balance'));
        }).catch(error);
        web3.eth.getBalance(account).then(function (balance) {
            accountEth = new BigNumber(balance).shiftedBy(-18);
        }).catch(error);
    }

    function logAccount() {
        var p = document.createElement('p');
        p.className = 'onestring';
        var span = document.createElement('span');
        span.innerHTML = 'account ';
        p.appendChild(span);
        var a = document.createElement('a');
        a.innerHTML = web3.utils.toChecksumAddress(account);
        switch (network) {
            case networkRopsten:
                a.href = 'https://ropsten.etherscan.io/address/' + account;
                break;
            case networkGoerli:
                a.href = 'https://goerli.etherscan.io/address/' + account;
                break;
            default:
                a.href = 'https://etherscan.io/address/' + account;
        }
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
        p.appendChild(a);
        var div = document.getElementById('logs');
        div.insertBefore(p, div.firstChild);
    }

    function logTx(message, hash) {
        var p = document.createElement('p');
        p.classList.add('onestring');
        var span = document.createElement('span');
        span.innerHTML = message + ', tx ';
        p.appendChild(span);
        var a = document.createElement('a');
        a.innerHTML = hash;
        if (network === networkMain) {
            a.href = 'https://etherscan.io/tx/' + hash;
        } else if (network === networkRopsten) {
            a.href = 'https://ropsten.etherscan.io/tx/' + hash;
        } else if (network === networkGoerli) {
            a.href = 'https://goerli.etherscan.io/tx/' + hash;
        }
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
        p.appendChild(a);
        span = document.createElement('span');
        span.innerHTML = ' - unconfirmed';
        p.appendChild(span);
        var logs = document.getElementById('logs');
        logs.insertBefore(p, logs.firstChild);
        return span;
    }

    function printNetwork() {
        var p = document.createElement('p');
        if (network === networkMain) {
            p.innerHTML = 'ethereum mainnet';
        } else if (network === networkRopsten) {
            p.innerHTML = 'ropsten test network';
        } else if (network === networkGoerli) {
            p.innerHTML = 'goerli test network';
        }
        var logs = document.getElementById('logs');
        logs.insertBefore(p, logs.firstChild);
    }


    function check() {
        if (typeof window.ethereum === 'undefined') {
            alert('ethereum is not loaded');
        } else if (network === null) {
            alert('switch to the main, ropsten or goerli network');
        } else if (account === null) {
            connect();
        } else if (blocked) {
            alert('confirm or reject previous tx');
        } else {
            return true;
        }
        return false;
    }

    function error(error) {
        console.error(error);
        if (error.message) {
            error = error.message;
        }
        alert('error: ' + error);
        blocked = false;
    }

    function printValue(value, element) {
        if (value.isZero()) {
            element.title = '';
            element.innerHTML = '0';
        } else {
            element.title = value.toFixed(18);
            if (value.isGreaterThan(0.001)) {
                element.innerHTML = value.toFixed(3, BigNumber.ROUND_DOWN);
            } else if (value.isGreaterThan(0.000001)) {
                element.innerHTML = value.toFixed(6, BigNumber.ROUND_DOWN);
            } else {
                element.innerHTML = value.toExponential(3, BigNumber.ROUND_DOWN);
            }
        }
    }
})();