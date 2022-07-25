/// <reference path="jquery-3.4.1.js" />

(function () { // IIFE



    $(function () {

        let coinsCachedArray = [];
        let openInfo = new Set();
        let toggledCoins = new Set();
        let temporaryMoreCoinInfoMap = new Map();
        let isModalOpen = false;
        let chartIntervalId;


        let url = `https://api.coingecko.com/api/v3/coins/`;

        $.get(url).then(function (coinsArray) {
            $("#loader").hide();
            $("#charts-div-container").empty().hide();
            $("#aboutBody").empty().hide();
            coinsInitialization(coinsArray);
            printCoinsToPage(coinsCachedArray);
        }).catch(function (error) {
            console.log(error);
            alert("Failed to get user data");
        });

        $("#aboutBtn").click(onAboutPage);

        //Search coins function through search bar//    
        $("#showCoins").click(function () {
            $(".coins-container").html("");
            let userCoinSearch = $("#searchCoins").val().toLowerCase();
            let filteredCoins = coinsCachedArray.filter(function (coin) {
                return coin.symbol.toLowerCase().includes(userCoinSearch) || coin.name.toLowerCase().includes(userCoinSearch);
            })
            printCoinsToPage(filteredCoins);
            if (filteredCoins == "") {
                alert("No Coins Found Under This Search")
                printCoinsToPage(coinsCachedArray);
            }
            $("#searchCoins").val("");
        });

        //Allows search to happen once "Enter" is clicked//
        $("#searchCoins").keyup(function (event) {
            if (event.keyCode === 13) {
                $("#showCoins").click();
            }
        });

        $("#homeBtn").click(onAddHomePageContainerToUiCliked);
        $("#title-button").click(onAddHomePageContainerToUiCliked);

        function onAddHomePageContainerToUiCliked() {
            clearHTML();
            $('#backgroundImg').show();
            $('.coins-container').show();
            printCoinsToPage(coinsCachedArray);
        }

        //By Click Takes To Live Reports Page//
        $("#live-report").click(function () {
            if (toggledCoins.size == 0) {
                alert("Please choose 1-5 coins");
            }

            else {
                clearHTML();
                $("#charts-div-container").show();
                let chartsContainerElement = `<div id="chartContainer" style="height: 320px; width: 100%;"></div>`
                $("#charts-div-container").append(chartsContainerElement);
                showLiveReports();
            }
        });


        //Generates which coins to be pulled//
        function coinsInitialization(coins) {
            for (let coinIndex = 0; coinIndex < coins.length; coinIndex++) {
                coinsCachedArray.push(coins[coinIndex]);
            }
        }

        //Prints coin cards to page//
        function printCoinsToPage(coins) {
            $(".coins-container").show();
            for (let coin of coins) {
                let coinCard =
                    `<div id="${coin.id}" class="coin-card">
                    <div id="${coin.id}Title" class="card-title form-switch"></div>

                            <div class="symbol">${coin.symbol}</div>
                            <div class="coin-body">${coin.name}</div>
                            <button class="more-info-btn" id="${coin.id}Button">More Info</button>
                            <div class="more-info" id="${coin.id}InfoDiv"></div>
                        </div>`

                        let liveReportSwitch = $(`<input class="form-check-input" id="${coin.id}Switch" type="checkbox">`);

                        $(liveReportSwitch).on("click", function () {
                            liveReportSwitchToggled(coin, `${coin.id}Switch`);
                        })

                $(".coins-container").append(coinCard);
                $(`#${coin.id}Title`).append(liveReportSwitch);
                $(`#${coin.id}Button`).click(function () {
                    getMoreInfo(coin)
                });
            
                if (toggledCoins.has(coin)) {
                $(liveReportSwitch).prop("checked", true);
                }

                if (openInfo.has(coin.id)) {
                getMoreInfo(coin, temporaryMoreCoinInfoMap.get(coin.id));
                }
            }
        }

        //Function that collects toggled coins//
        function liveReportSwitchToggled(coin, switchId) {
            if (toggledCoins.size < 5 && !toggledCoins.has(coin)) {
                toggledCoins.add(coin);
            }

            else {
                if (toggledCoins.has(coin)) {
                    toggledCoins.delete(coin);
                    $(`#${switchId}`).prop("checked", false);
                }

                if (toggledCoins.size == 5) {
                    if (!isModalOpen) {
                        openModal(coin);
                    }

                    else {
                        alert("Please note that only 5 coins are allowed.");

                    }

                    $(`#${switchId}`).prop("checked", false);
                }
            }
        }

        //Refreshes coin prices after two minutes//
        function saveMoreInfoToCache(coin) {
            temporaryMoreCoinInfoMap.set(coin.id, coin);
            setTimeout(function () {
                temporaryMoreCoinInfoMap.delete(coin.id)
            }, 120000);
        }

        //Opens Modal to screen//
        function openModal(coin) {
            isModalOpen = true;
            $("#modalBody").html("");
            $("#modalFooter").html("");
            for (let item of toggledCoins) {
                addCoinToModal(item, "modalBody");
            }
            addCoinToModal(coin, "modalFooter")

            $("#coinSwitchModal").modal("toggle");

            $("#modalCloseButton").on("click", function () {
                isModalOpen = false;
                $('.coins-container').html("");
                printCoinsToPage(coinsCachedArray);
            });
        }

        //Adds toggled coins to Modal//
        function addCoinToModal(coin, targetDivId) {
            let coinDiv = $(`<div class="modal-coin form-switch"><img src=${coin.image.thumb}>  ${coin.name}</div>`);
            let coinSwitch = $(`<input class="form-check-input" id="${coin.id}ModalSwitch" checked type="checkbox">`);
            $(coinSwitch).on("click", function () {
                liveReportSwitchToggled(coin, `${coin.id}ModalSwitch`);
            })
            coinDiv.append(coinSwitch);
            $(`#${targetDivId}`).append(coinDiv);

            if (toggledCoins.has(coin)) {
                $(`#${coin.id}ModalSwitch`).prop("checked", true);
            }

            else {
                $(`#${coin.id}ModalSwitch`).prop("checked", false);
            }
        }

        //Each coin More Info Div along with initialization function//
        function getMoreInfo(coin) {

            if (isMoreInfoOpen(coin.id)) {
                openInfo.delete(coin.id);
                $(`#${coin.id}InfoDiv`).html("");
            }
            else {
                let gif = `<img class="loading-gif" src="VAyR.gif" width="150px" height="150px">`;
                $(`#${coin.id}InfoDiv`).html(gif);


                openInfo.add(coin.id);
                let url = `https://api.coingecko.com/api/v3/coins/${coin.id}`;

                $.get(url).then(function (coin) {
                    temporaryMoreCoinInfoMap.set(coin.id, coin);
                    saveMoreInfoToCache(coin);

                    let imgUrl = coin.image.large;
                    let ils = coin.market_data.current_price.ils;
                    let usd = coin.market_data.current_price.usd;
                    let eur = coin.market_data.current_price.eur;

                    let moreInfoDiv =
                        `<div class="more-info-div">
                                <img id="coin-img" src ="${imgUrl}"<br><br>
                                <div class ="more-price-div">
                                    ILS: ₪${ils}<br>
                                    USD: $${usd}<br>
                                    EUR: €${eur}   
                                </div>   
                            </div>`
                    $(`#${coin.id}InfoDiv`).html(moreInfoDiv);
                })
                    .catch(function (error) {
                        alert("Failed to recieve user data")
                    });
            }

            function isMoreInfoOpen(id) {
                if (openInfo.has(id)) {
                    return true;
                }
                return false;
            }
        }

        //All info printed to About page//
        function onAboutPage() {
            clearHTML();
            let about =
                `                
                <div class="aboutDiv">
                <h2>Welcome to the About Page!</h2>

                <h3>A Bit About Myself</h3>
                <img id="aboutImg" src="aboutImg.png">
                <h4>Roee Hezi</h4>
                <p>Hi! I am Roee Hezi, an Israeli/American 25 years old, and am currently studying Full Stack at John Bryce in Tel Aviv.</p>
                
                <h3>A Bit About This Site</h3>
                <p>This is a fast and easy way to get updated about a variety of Crypto Coins!</p>
                <p>On this website you can browse through different coins and find out their current market price!</p>
                <p>This website is part of the John Bryce "Full Stack Curriculum"</p>
                <p>The "Crypto World" website was put together using
                    <li>HTML</li>
                    <li>CSS</li>
                    <li>JavaScript</li>
                    <li>Bootstrap</li>
                    <li>J-Query</li>
                </p>
                <p>Select your coin, compare them in our "Live Report" area!</p>
                <h3>But Most Importantly...<h3>
                <h2>Stay Updated!!!</h2>
                </div>`;

            $("#aboutBody").show();
            $("#aboutBody").append(about);
        }

        //Clears whole HTML page//
        function clearHTML() {
            clearInterval(chartIntervalId);
            $("#backgroundImg").hide();
            $(".coins-container").empty().hide();
            $("#aboutBody").empty().hide();
            $("#charts-div-container").empty().hide();
        }

        //Collects chosen coins and displays them on Live Reports//
        function showLiveReports() {
            let coinsChosenArray = new Array();
            for (let coinId of toggledCoins) {
                let [currentCoin] = coinsCachedArray.filter(coin => coinId == coin);
                coinsChosenArray.push(currentCoin);
            }
            let incompleteCoinsPricesUrl = "https://min-api.cryptocompare.com/data/pricemulti?fsyms="
            for (let coin of coinsChosenArray) {
                incompleteCoinsPricesUrl = incompleteCoinsPricesUrl + coin.symbol.toUpperCase() + ",";
            }
            //removing the spare ','
            incompleteCoinsPricesUrl = incompleteCoinsPricesUrl.substring(0, incompleteCoinsPricesUrl.length - 1);
            let coinPricesUrl = incompleteCoinsPricesUrl + "&tsyms=USD";

            var dataPoints = [];
            for (let i = 0; i < 5; i++) {
                dataPoints[i] = [];
            }
            var options = {
                title: {
                    text: "Crypto Coin Price Value"
                },
                axisX: {
                    title: "Time"
                },
                axisY: {
                    title: "USD",
                    suffix: "$"
                },
                toolTip: {
                    shared: true
                },
                legend: {
                    cursor: "pointer",
                    verticalAlign: "top",
                    fontSize: 22,
                    fontColor: "dimGrey",
                    itemclick: toggleDataSeries
                },
                data: []
            };

            for (let i = 0; i < coinsChosenArray.length; i++) {
                options.data.push({
                    type: "line",
                    xValueType: "dateTime",
                    yValueFormatString: "###.00$",
                    showInLegend: true,
                    name: coinsChosenArray[i].name,
                    dataPoints: dataPoints[i]
                });
            }

            var chart = $("#chartContainer").CanvasJSChart(options);

            function toggleDataSeries(e) {
                if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                    e.dataSeries.visible = false;
                }

                else {
                    e.dataSeries.visible = true;
                }
                e.chart.render();
            }

            var updateInterval = 2000;
            // initial value
            let yValue = [5];
            var time = new Date;

            function setChartValues(coinsObject) {
                for (let i = 0; i < coinsChosenArray.length; i++) {
                    let currentSymbol = coinsChosenArray[i].symbol.toUpperCase();
                    yValue[i] = coinsObject[currentSymbol].USD;
                }
            }

            $.get(coinPricesUrl).then(function (coinsObject) {
                setChartValues(coinsObject);
                chartIntervalId = setInterval(function () {
                    updateChart()
                }, updateInterval);
            })
                .catch(function (error) {
                    console.log(error);
                    alert("Failed to get coins data - charts");
                });

            function updateChart() {

                $.get(coinPricesUrl).then(function (coinsObject) {
                    setChartValues(coinsObject);
                })
                    .catch(function (error) {
                        console.log(error);
                        alert("Failed to get coins data - charts");
                    });
                time.setTime(time.getTime() + updateInterval);
                // pushing the new values
                dataPoints[0].push({
                    x: time.getTime(),
                    y: yValue[0]
                });
                dataPoints[1].push({
                    x: time.getTime(),
                    y: yValue[1]
                });
                dataPoints[2].push({
                    x: time.getTime(),
                    y: yValue[2]
                });
                dataPoints[3].push({
                    x: time.getTime(),
                    y: yValue[3]
                });
                dataPoints[4].push({
                    x: time.getTime(),
                    y: yValue[4]
                });
                // updating legend text with  updated with y Value 
                for (let i = 0; i < coinsChosenArray; i++) {
                    options.data[i].legendText = coin.name + " : " + yValue1 + "$";
                }
                $("#chartContainer").CanvasJSChart().render();
            }
        }
    });
})();