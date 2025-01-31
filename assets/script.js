(function () {
    'use strict';

    var page, chain, account, ethProvider, ethContract, trxProvider, trxContract;
    var eth = {
        name: 'Ethereum mainnet',
        isEth: true,
        chainId: 1,
        address: '0x99cbe93AFee15456a1115540e7F534F6629bAB3f',
        coin: 'ETH',
        contractLink: 'https://etherscan.io/token/',
        addressLink: 'https://etherscan.io/address/',
        txLink: 'https://etherscan.io/tx/',
        pitPrice: 0.1,
        pitRefRequirement: 10
    };
    var ethTest = {
        name: 'Ethereum Goerli testnet',
        isEth: true,
        chainId: 5,
        address: '0x6011b6573fA152ded3d3188Ee6a90842BEa38b42',
        coin: 'goETH',
        contractLink: 'https://goerli.etherscan.io/token',
        addressLink: 'https://goerli.etherscan.io/address',
        txLink: 'https://goerli.etherscan.io/tx',
        pitPrice: 0.1,
        pitRefRequirement: 10
    };
    var pls = {
        name: 'Pulsechain mainnet',
        isEth: true,
        chainId: 369,
        address: '0x429791801b8FDc5525e008c7a98c96CaCF5eEea3',
        coin: 'PLS',
        contractLink: 'https://otter.pulsechain.com/address/',
        addressLink: 'https://otter.pulsechain.com/address/',
        txLink: 'https://otter.pulsechain.com/tx/',
        pitPrice: 1,
        pitRefRequirement: 1000
    };
    var plsTest = {
        name: 'Pulsechain testnet',
        isEth: true,
        chainId: 943,
        address: '0x429791801b8FDc5525e008c7a98c96CaCF5eEea3',
        coin: 'tPLS',
        contractLink: 'https://scan.v4.testnet.pulsechain.com/#/token/',
        addressLink: 'https://scan.v4.testnet.pulsechain.com/#/address/',
        txLink: 'https://scan.v4.testnet.pulsechain.com/#/tx/',
        pitPrice: 1,
        pitRefRequirement: 1000
    };
    var trx = {
        name: 'Tron mainnet',
        isEth: false,
        chainId: 'https://api.trongrid.io',
        address: 'TBxWTtKLUX4JcBbow9C41Q5EomdtQNZp97',
        coin: 'TRX',
        contractLink: 'https://tronscan.org/#/token20/',
        addressLink: 'https://tronscan.org/#/address/',
        txLink: 'https://tronscan.org/#/transaction/',
        pitPrice: 1,
        pitRefRequirement: 1000
    };
    var trxTest = {
        name: 'Tron Shasta testnet',
        isEth: false,
        chainId: 'https://api.shasta.trongrid.io',
        address: 'TKd1M1kRJ2gJV5KwTphxE9a7jPNHztZzc7',
        coin: 'tTRX',
        contractLink: 'https://shasta.tronscan.org/#/token20/',
        addressLink: 'https://shasta.tronscan.org/#/address/',
        txLink: 'https://shasta.tronscan.org/#/transaction/',
        pitPrice: 1,
        pitRefRequirement: 1000
    };
    var abi = [
        'function balanceOf(address) view returns (uint256)',
        'function refDividendsOf(address) view returns (uint256)',
        'function dividendsOf(address) view returns (uint256)',
        'function buy(address) payable',
        'function sell(uint256)',
        'function withdraw()',
        'function reinvest()',
        'event Withdraw(address indexed, uint256)',
        'event Transfer(address indexed, address indexed, uint256)'
    ];
    
    window.onload = function () {
        document.getElementById('pls').onclick = function () {
            openPage(pls);
        };
        document.getElementById('eth').onclick = function () {
            openPage(eth);
        };
        document.getElementById('trx').onclick = function () {
            openPage(trx);
        };
        document.getElementById('connect').onclick = connect;
        document.getElementById('buy').onclick = buy;
        document.getElementById('sell').onclick = sell;
        document.getElementById('reinvest').onclick = reinvest;
        document.getElementById('withdraw').onclick = withdraw;
        document.getElementById('buyValue').onkeyup = function (event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                buy();
            } else if (event.keyCode === 27) {
                document.getElementById('buyValue').value = '';
            }
        };
        document.getElementById('sellValue').onkeyup = function (event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                sell();
            } else if (event.keyCode === 27) {
                document.getElementById('sellValue').value = '';
            }
        };

        openPage(pls);
    };

    window.onerror = function (message, source, lineno, colno, error) {
        try {
            fetch('https://aqoleg.com/log', {
                method: 'POST',
                body: JSON.stringify({
                    file: 'pitcoin',
                    error: error.stack ? error.stack : error.toString()
                })
            });
        } catch(e) {}
        return true;
    };

    function openPage(newPage) {
        page = newPage;
        chain = null;
        account = null;
        document.getElementById('eth').className = page === eth ? 'active' : '';
        document.getElementById('pls').className = page === pls ? 'active' : '';
        document.getElementById('trx').className = page === trx ? 'active' : '';
        printMessage();
        initPage();
        if (page.isEth) {
            setEth();
        } else {
            setTrx();
        }
    }

    function setEth() {
        if (!page.isEth) {
            return;
        }
        if (!ethProvider) {
            window.providers = [];
            window.addEventListener('eip6963:announceProvider', function (provider) {
                providers.push(provider.detail);
            });
            window.dispatchEvent(new Event('eip6963:requestProvider'));
            var provider = providers.length > 0 ? providers[0].provider : window.ethereum;
            if (provider) {
                ethProvider = new ethers.providers.Web3Provider(provider, 'any');
                if (provider.on) {
                    provider.on('chainChanged', setEth);
                    provider.on('accountsChanged', setEth);
                }
            }
        }
        if (!ethProvider) {
            document.getElementById('connect').style.display = 'none';
            return printMessage('use ethereum browser');
        }
        document.getElementById('connect').style.display = 'block';

        ethProvider.getNetwork().then(function (newChainId) {
            if (!page.isEth) {
                return;
            }
            newChainId = Number(newChainId.chainId);
            if (page === eth && newChainId !== eth.chainId && newChainId !== ethTest.chainId) {
                chain = null;
                account = null;
                initPage();
                return printMessage('switch to ethereum mainnet or goerli testnet');
            } else if (page === pls && newChainId !== pls.chainId && newChainId !== plsTest.chainId) {
                chain = null;
                account = null;
                initPage();
                return printMessage('switch to pulsechain mainnet or testnet');
            }
            if (!chain || chain.chainId !== newChainId) {
                if (newChainId === eth.chainId) {
                    chain = eth;
                } else if (newChainId === ethTest.chainId) {
                    chain = ethTest;
                } else if (newChainId === pls.chainId) {
                    chain = pls;
                } else if (newChainId === plsTest.chainId) {
                    chain = plsTest;
                }
                account = null;
                ethContract = new ethers.Contract(chain.address, abi, ethProvider.getSigner());
                ethContract.on('Transfer', loadEth);
                ethContract.on('Withdraw', loadEth);
                initPage();
            }
            setAccount();
        }).catch(error);

        function setAccount() {
            ethProvider.getSigner().getAddress().then(function (newAccount) {
                if (!chain || !chain.isEth) {
                    return;
                } else if (!newAccount) {
                    throw Error();
                } else if (newAccount !== account) {
                    account = newAccount;
                    printMessage();
                    initAccount();
                }
                loadEth();
            }).catch(function () {
                account = null;
                printMessage('no accounts connected');
                initAccount();
                loadEth();
            });
        }
    }

    function setTrx() {
        if (page.isEth) {
            return;
        } else if (!window.tronWeb) {
            document.getElementById('connect').style.display = 'none';
            return printMessage('use tron browser');
        } else if (!trxProvider) {
            trxProvider = true;
            addEventListener('message', function (event) {
                if (event.data.isTronLink && event.data.message) {
                    event = event.data.message.action;
                    if (event === 'setNode' || event === 'accountsChanged') {
                        setTrx();
                    }
                }
            });
        }
        document.getElementById('connect').style.display = 'block';

        var newChainId = tronWeb.solidityNode.host;
        var newAccount = tronWeb.defaultAddress.base58;
        if (!tronLink.ready || !newChainId || !newAccount) {
            chain = null;
            account = null;
            initPage();
            return printMessage('unlock and connect tronlink');
        } else if (newChainId !== trx.chainId && newChainId !== trxTest.chainId) {
            chain = null;
            account = null;
            initPage();
            return printMessage('switch to the main or shasta network');
        }
        if (!chain || chain.chainId !== newChainId) {
            if (newChainId === trx.chainId) {
                chain = trx;
            } else if (newChainId === trxTest.chainId) {
                chain = trxTest;
            }
            account = null;
            tronWeb.contract().at(chain.address).then(function (contract) {
                trxContract = contract;
                trxContract.Transfer().watch(loadTrx);
                trxContract.Withdraw().watch(loadTrx);
                initPage();
            }).then(function () {
                if (!chain || chain.isEth) {
                    return;
                }
                account = newAccount;
                printMessage();
                initAccount();
                loadTrx();
            }).catch(error);
        } else if (newAccount !== account) {
            account = newAccount;
            printMessage();
            initAccount();
            loadTrx();
        }
    }

    function loadEth() {
        if (!chain || !chain.isEth) {
            return;
        }
        var chainId = chain.chainId;
        ethProvider.getBalance(chain.address).then(function (balance) {
            if (!chain || chain.chainId !== chainId) {
                return;
            }
            printValue(balance, 'contractBalance');
        }).catch(error);
        if (!account) {
            return;
        }
        ethContract.balanceOf(account).then(function (balance) {
            if (!chain || chain.chainId !== chainId) {
                return;
            }
            printValue(balance, 'balance');
            if (balance.gte(ethers.utils.parseUnits(chain.pitRefRequirement.toString()))) {
                var link = window.location.hostname + window.location.pathname + '?eth=' + account;
                document.getElementById('ref').style.display = 'block';
                document.getElementById('reflink').innerHTML = '<a target="_blank" rel="noopener" ' +
                    'href="https://' + link + '">' + link + '</a>';
            } else {
                document.getElementById('ref').style.display = 'none';
                document.getElementById('reflink').innerHTML = '';
            }
        }).catch(error);
        var refDividends;
        ethContract.refDividendsOf(account).then(function (dividends) {
            if (!chain || chain.chainId !== chainId || !account) {
                return;
            }
            refDividends = dividends.mul(1000).div(1000 * chain.pitPrice);
            printValue(refDividends, 'refDividend');
            return ethContract.dividendsOf(account);
        }).then(function (dividends) {
            if (!chain || chain.chainId !== chainId) {
                return;
            }
            if (dividends.eq(1)) {
                dividends = ethers.constants.Zero;
            }
            dividends = dividends.mul(1000).div(1000 * chain.pitPrice).add(refDividends);
            printValue(dividends, 'dividend');
        }).catch(error);
    }

    function loadTrx() {
        if (!chain || chain.isEth || !account) {
            return;
        }
        var chainId = chain.chainId;
        tronWeb.trx.getUnconfirmedBalance(chain.address).then(function (balance) {
            if (!chain || chain.chainId !== chainId) {
                return;
            }
            balance = new tronWeb.BigNumber(balance).shiftedBy(-6);
            printValue(balance, 'contractBalance');
        }).catch(error);
        trxContract.balanceOf(account).call().then(function (balance) {
            if (!chain || chain.chainId !== chainId) {
                return;
            }
            balance = new tronWeb.BigNumber(balance._hex).shiftedBy(-18);
            printValue(balance, 'balance');
            if (balance.isGreaterThan(chain.pitRefRequirement)) {
                var link = window.location.hostname + window.location.pathname + '?trx=' + account;
                document.getElementById('ref').style.display = 'block';
                document.getElementById('reflink').innerHTML = '<a target="_blank" rel="noopener" ' +
                    'href="http://' + link + '">' + link + '</a>';
            } else {
                document.getElementById('ref').style.display = 'none';
                document.getElementById('reflink').innerHTML = '';
            }
        }).catch(error);
        var refDividends;
        trxContract.refDividendsOf(account).call().then(function (dividends) {
            if (!chain || chain.chainId !== chainId) {
                return;
            }
            refDividends = new tronWeb.BigNumber(dividends._hex).shiftedBy(-18).div(chain.pitPrice);
            printValue(refDividends, 'refDividend');
            return trxContract.dividendsOf(account).call();
        }).then(function (dividends) {
            if (!chain || chain.chainId !== chainId) {
                return;
            }
            dividends = dividends._hex;
            if (dividends == '0x01') {
                dividends = '0';
            }
            dividends = new tronWeb.BigNumber(dividends).shiftedBy(-18).div(chain.pitPrice);
            dividends = dividends.plus(refDividends);
            printValue(dividends, 'dividend');
        }).catch(error);
    }

    function connect() {
        startLoading();
        if (page.isEth) {
            connectEth().then(function () {
                stopLoading();
                loadEth();
            }).catch(error);
        } else {
            connectTrx().then(function () {
                stopLoading();
                loadTrx();
            }).catch(error);
        }
    }

    function connectEth() {
        return ethereum.request({method: 'eth_requestAccounts'}).then(function () {
            if (page === eth && chain !== eth && chain !== ethTest) {
                return ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{chainId: '0x1'}]
                });
            } else if (page === pls && chain !== pls && chain !== plsTest) {
                return ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{chainId: '0x171'}]
                });
            }
        }).catch(function (error) {
            if (page === pls && error.code === 4902) {
                return ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0x171',
                        chainName: 'PulseChain',
                        nativeCurrency: {symbol: 'PLS', decimals: 18},
                        rpcUrls: ['https://rpc.pulsechain.com'],
                        blockExplorerUrls: ['https://otter.pulsechain.com']
                    }]
                }).then(connectEth);
            } else {
                throw error;
            }
        });
    }

    function connectTrx() {
        return tronLink.request({method: 'tron_requestAccounts'}).then(function (result) {
            if (!result) {
                throw Error('unlock tronlink');
            } else if (result.code !== 200) {
                throw Error(result.message);
            }
        });
    }

    function buy() {
        printMessage();
        document.getElementById('buyValueHint').innerHTML = '';
        var value = document.getElementById('buyValue').value;
        if (!value || isNaN(value)) {
            document.getElementById('buyValueHint').innerHTML = 'enter a number';
            document.getElementById('buyValue').focus();
            return;
        } else if (value <= 0) {
            document.getElementById('buyValueHint').innerHTML = 'enter a positive number';
            document.getElementById('buyValue').focus();
            return;
        }
        startLoading();
        if (page.isEth) {
            buyEth(value);
        } else {
            buyTrx(value);
        }
    }

    function buyEth(value) {
        var eth = ethers.utils.parseUnits(value);
        var ref = parse('eth');
        if (!ref || !ethers.utils.isAddress(ref) || ref === account) {
            ref = ethers.constants.AddressZero;
        }
        var message;
        connectEth().then(function () {
            return ethProvider.getBalance(account);
        }).then(function (balance) {
            if (balance.isZero()) {
                document.getElementById('buyValueHint').innerHTML = 'you have no ' + chain.coin;
                throw Error('you have no ' + chain.coin);
            } else if (eth.gte(balance)) {
                document.getElementById('buyValueHint').innerHTML = 'insufficient funds';
                throw Error('insufficient funds');
            }
            return ethContract.buy(ref, {value: eth});
        }).then(function (txResponse) {
            document.getElementById('buyValue').value = '';
            message = logTx('purchase for ' + value + ' ' + chain.coin, txResponse.hash);
            stopLoading();
            txResponse.wait().then(function (response) {
                message.innerHTML = ' - confirmed';
                loadEth();
            }).catch(function (responseError) {
                console.error(responseError);
                message.innerHTML = responseError.reason ? responseError.reason : ' - rejected';
            });
        }).catch(error);
    }

    function buyTrx(value) {
        var trx = Math.trunc(value * 1000000);
        var ref = parse('trx');
        if (!ref || !tronWeb.isAddress(ref) || ref === account) {
            ref = 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb';
        }
        var message;
        connectTrx().then(function () {
            return tronWeb.trx.getUnconfirmedBalance(account);
        }).then(function (balance) {
            if (balance == 0) {
                document.getElementById('buyValueHint').innerHTML = 'you have no ' + chain.coin;
                throw Error('you have no ' + chain.coin);
            } else if (trx > balance) {
                document.getElementById('buyValueHint').innerHTML = 'insufficient funds';
                throw Error('insufficient funds');
            }
            return trxContract.buy(ref).send({callValue: trx});
        }).then(function (hash) {
            document.getElementById('buyValue').value = '';
            message = logTx('purchase for ' + value + ' ' + chain.coin, hash);
            stopLoading();
            checkTronTx(hash, message);
        }).catch(error);
    }

    function sell() {
        printMessage();
        document.getElementById('sellValueHint').innerHTML = '';
        var value = document.getElementById('sellValue').value;
        if (!value || isNaN(value)) {
            document.getElementById('sellValueHint').innerHTML = 'enter a number';
            document.getElementById('sellValue').focus();
            return;
        } else if (value <= 0) {
            document.getElementById('sellValueHint').innerHTML = 'enter a positive number';
            document.getElementById('sellValue').focus();
            return;
        }
        startLoading();
        if (page.isEth) {
            sellEth(value);
        } else {
            sellTrx(value);
        }
    }

    function sellEth(value) {
        var pit = ethers.utils.parseUnits(value);
        var message;
        connectEth().then(function () {
            return ethContract.balanceOf(account);
        }).then(function (balance) {
            if (balance.isZero()) {
                document.getElementById('sellValueHint').innerHTML = 'you have no PIT';
                throw Error('you have no PIT');
            } else if (pit.gt(balance)) {
                document.getElementById('sellValueHint').innerHTML = 'insufficient funds';
                document.getElementById('sellValue').value = ethers.utils.formatUnits(balance);
                throw Error('insufficient funds');
            }
            return ethContract.sell(pit);
        }).then(function (txResponse) {
            document.getElementById('sellValue').value = '';
            message = logTx('sale of ' + value + ' PIT', txResponse.hash);
            stopLoading();
            txResponse.wait().then(function (response) {
                message.innerHTML = ' - confirmed';
                loadEth();
            }).catch(function (responseError) {
                console.error(responseError);
                message.innerHTML = responseError.reason ? responseError.reason : ' - rejected';
            });
        }).catch(error);
    }

    function sellTrx(value) {
        var pit = new tronWeb.BigNumber(value);
        var message;
        connectTrx().then(function () {
            return trxContract.balanceOf(account).call();
        }).then(function (balance) {
            balance = new tronWeb.BigNumber(balance._hex).shiftedBy(-18);
            if (balance.isZero()) {
                document.getElementById('sellValueHint').innerHTML = 'you have no PIT';
                throw Error('you have no PIT');
            } else if (pit.isGreaterThan(balance)) {
                document.getElementById('sellValueHint').innerHTML = 'insufficient funds';
                document.getElementById('sellValue').value = balance.toFixed(18);
                throw Error('insufficient funds');
            }
            return trxContract.sell(pit.shiftedBy(18).toFixed(0)).send();
        }).then(function (hash) {
            document.getElementById('sellValue').value = '';
            message = logTx('sale of ' + value + ' PIT', hash);
            stopLoading();
            checkTronTx(hash, message);
        }).catch(error);
    }

    function reinvest() {
        printMessage();
        startLoading();
        if (page.isEth) {
            dividendsEth(true);
        } else {
            dividendsTrx(true);
        }
    }
    
    function withdraw() {
        printMessage();
        startLoading();
        if (page.isEth) {
            dividendsEth(false);
        } else {
            dividendsTrx(false);
        }
    }

    function dividendsEth(reinvest) {
        var sumDividends, message;
        connectEth().then(function () {
            return ethContract.dividendsOf(account);
        }).then(function (dividends) {
            sumDividends = dividends;
            return ethContract.refDividendsOf(account);
        }).then(function (refDividends) {
            sumDividends = sumDividends.add(refDividends).mul(1000).div(1000 * chain.pitPrice);
            if (sumDividends.isZero()) {
                throw Error('you have no dividends');
            }
            if (reinvest) {
                return ethContract.reinvest();
            } else {
                return ethContract.withdraw();
            }
        }).then(function (txResponse) {
            message = reinvest ? 'reinvest of ' : 'withdraw of ';
            message = message + ethers.utils.formatEther(sumDividends) + ' ' + chain.coin;
            message = logTx(message, txResponse.hash);
            stopLoading();
            txResponse.wait().then(function (response) {
                message.innerHTML = ' - confirmed';
                loadEth();
            }).catch(function (responseError) {
                console.error(responseError);
                message.innerHTML = responseError.reason ? responseError.reason : ' - rejected';
            });
        }).catch(error);
    }

    function dividendsTrx(reinvest) {
        var sumDividends, message;
        connectTrx().then(function () {
            return trxContract.dividendsOf(account).call();
        }).then(function (dividends) {
            sumDividends = new tronWeb.BigNumber(dividends._hex);
            return trxContract.refDividendsOf(account).call();
        }).then(function (refDividends) {
            sumDividends = sumDividends.plus(new tronWeb.BigNumber(refDividends._hex));
            if (sumDividends.isZero()) {
                throw Error('you have no dividends');
            }
            if (reinvest) {
                return trxContract.reinvest().send();
            } else {
                return trxContract.withdraw().send();
            }
        }).then(function (hash) {
            message = reinvest ? 'reinvest of ' : 'withdraw of ';
            message = message + sumDividends.shiftedBy(-18).div(chain.pitPrice).toFixed(18) + ' ' +
                chain.coin;
            message = logTx(message, hash);
            stopLoading();
            checkTronTx(hash, message);
        }).catch(error);
    }

    function checkTronTx(hash, message) {
        setTimeout(function () {
            if (chain.isEth) {
                return;
            }
            tronWeb.trx.getConfirmedTransaction(hash).then(function (tx) {
                if (tx.ret[0].contractRet === 'SUCCESS') {
                    message.innerHTML = ' - confirmed';
                } else {
                    message.innerHTML = ' - rejected';
                }
                loadTrx();
            }).catch(function (error) {
                if (error.toString().includes('not found')) {
                    checkTronTx(hash, message);
                }
            });
        }, 3000);
    }

    
    function error(error) {
        stopLoading();
        console.error(error);
        if (error.message) {
            error = error.message;
        }
        printMessage('error: ' + error);
    }

    function initPage() {
        var currencies = document.getElementsByClassName('currency');
        for (var i = currencies.length - 1; i >= 0; i--) {
            currencies[i].innerHTML = chain ? chain.coin : page.coin;
        }
        document.getElementById('contract').innerHTML = chain ? chain.address : page.address;
        document.getElementById('contract').href =
            chain ? chain.contractLink + chain.address : page.contractLink + page.address;
        printValue(null, 'contractBalance');
        document.getElementById('price').innerHTML = chain ? chain.pitPrice : page.pitPrice;
        document.getElementById('refAmount').innerHTML =
            chain ? chain.pitRefRequirement : page.pitRefRequirement;
        printValue(null, 'balance');
        document.getElementById('buyValueHint').innerHTML = '';
        document.getElementById('buyValue').value = '';
        document.getElementById('sellValueHint').innerHTML = '';
        document.getElementById('sellValue').value = '';
        printValue(null, 'dividend');
        printValue(null, 'refDividend');
        document.getElementById('ref').style.display = 'none';
        document.getElementById('reflink').innerHTML = '';
        var div = document.getElementById('logs');
        div.innerHTML = '';
        if (chain) {
            var p = document.createElement('p');
            p.innerHTML = 'connected to ' + chain.name;
            div.appendChild(p);
        }
    }

    function initAccount() {
        document.getElementById('buyValueHint').innerHTML = '';
        document.getElementById('sellValueHint').innerHTML = '';
        printValue(null, 'balance');
        printValue(null, 'dividend');
        printValue(null, 'refDividend');
        document.getElementById('ref').style.display = 'none';
        document.getElementById('reflink').innerHTML = '';
        if (account) {
            var p = document.createElement('p');
            p.className = 'onestring';
            var span = document.createElement('span');
            span.innerHTML = 'account ';
            p.appendChild(span);
            var a = document.createElement('a');
            a.innerHTML = account;
            a.href = chain.addressLink + account;
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener');
            p.appendChild(a);
            var div = document.getElementById('logs');
            div.insertBefore(p, div.firstChild);
        }
    }

    function printMessage(msg) {
        document.getElementById('startMessage').innerHTML = msg ? msg : '';
    }

    function printValue(value, elementId) {
        var element = document.getElementById(elementId);
        if (value === null) {
            element.innerHTML = '...';
            element.title = '';
        } else if (value.isZero()) {
            element.innerHTML = '0';
            element.title = '';
        } else if (chain.isEth) {
            value = ethers.utils.formatEther(value);
            element.innerHTML = value.substring(0, value.indexOf('.') + 7);
            element.title = value;
        } else {
            if (value.isGreaterThan(0.001)) {
                element.innerHTML = value.toFixed(3, tronWeb.BigNumber.ROUND_DOWN);
            } else if (value.isGreaterThan(0.000001)) {
                element.innerHTML = value.toFixed(6, tronWeb.BigNumber.ROUND_DOWN);
            } else {
                element.innerHTML = value.toExponential(3, tronWeb.BigNumber.ROUND_DOWN);
            }
            element.title = value.toFixed(18);
        }
    }

    function logTx(message, hash) {
        var p = document.createElement('p');
        p.classList.add('onestring');
        var span = document.createElement('span');
        span.innerHTML = message + ', tx ';
        p.appendChild(span);
        var a = document.createElement('a');
        a.innerHTML = hash;
        a.href = chain.txLink + hash;
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

    function startLoading() {
        document.getElementById('loading').style.display = 'block';
    }

    function stopLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    function parse(query) {
        var startIndex = window.location.search.indexOf(query + '=');
        if (startIndex < 0) {
            return null;
        }
        startIndex = startIndex + query.length + 1;
        var stopIndex = window.location.search.indexOf('&', startIndex);
        if (stopIndex < 0) {
            return window.location.search.substring(startIndex);
        } else {
            return window.location.search.substring(startIndex, stopIndex);
        }
    }
})();