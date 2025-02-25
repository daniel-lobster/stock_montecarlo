import {useEffect, useState } from 'react';

import {GetNormallyDistributedRandomNumber} from './normal_distribution';
import {getDailyPriceChangeAverageAndSD} from './get_daily_price_change_histogram';
import {getPredictedPriceHistogram} from './get_predicted_price_histogram';

import Footer from './components/Footer';
import CompanyProfile from './components/CompanyProfile';
import HistogramPredictedPrices from './components/HistogramPredictedPrices';
import HistogramDailyPriceChanges from './components/HistogramDailyPriceChanges';
import HistoricalPriceAndPrediction from './components/HistoricalPriceAndPrediction';
import YourInput from './components/YourInput';

const finnhub = require('finnhub');


function App() {

    const [graphPriceAndPrediction,setGraphPriceAndPrediction]= useState([]);
    const [ticker,setTicker]= useState('AAPL');
    const [lastPrice,setLastPrice]= useState(0);

    const [companyName,setCompanyName]= useState('');
    const [companyLogo,setCompanyLogo]= useState('');
    const [companyExchange,setCompanyExchange]= useState('');
    const [companyIndustry,setCompanyIndustry]= useState('');
    const [companyIPO,setCompanyIPO]= useState('');
    const [companyMarketCap,setCompanyMarketCap]= useState('');
    const [companySharesOutstanding,setCompanySharesOutstanding]= useState('');
    const [company52WeekHighPrice,setCompany52WeekHighPrice]= useState('');
    const [company52WeekHighDate,setCompany52WeekHighDate]= useState('');
    const [company52WeekLowPrice,setCompany52WeekLowPrice]= useState('');
    const [company52WeekLowDate,setCompany52WeekLowDate]= useState('');
    const [companyBeta,setCompanyBeta]= useState('');
    const [companyPERatio,setCompanyPERatio]= useState('');


    const [needTicker,setNeedTicker] = useState(false)

    const [days_in_the_future,setDays_in_the_future]= useState(100);
    const [needForecast,setNeedForecast] = useState(false)
    const [number_of_simulations,setNumber_of_simulations]= useState(100);
    const [needNumberOfSimulations,setNeedNumberOfSimulations] = useState(false)
    const [API_daily_limit_reached,setAPI_daily_limit_reached] = useState(false)


    const [futureDay,setFutureDay]= useState("");
    const [run,setRun]= useState(true);
    const [predictedDatakeys, setPredictedDatakeys] =useState([]);

    const [predictedPriceHistogram,setPredictedPriceHistogram]= useState([]);
    const [predictedPriceAverage,setPredictedPriceAverage]= useState(0);
    const [predictedPriceStandardDeviation,setPredictedPriceStandardDeviation]= useState(0);

    const [dailyPriceChangeHistogram,setDailyPriceChangeHistogram]= useState([]);
    const [dailyPriceChangeAverage,setDailyPriceChangeAverage]= useState(0);
    const [dailyPriceChangeStandardDeviation,setDailyPriceChangeStandardDeviation]= useState(0);

    function run_function(){
        setRun(!run);
    }




       
    useEffect(() => {

        //Clear graphData to make sure that if data validation fails there isn't a graph
        setGraphPriceAndPrediction([])
        setPredictedPriceHistogram([]);
        setPredictedPriceAverage(0);
        setPredictedPriceStandardDeviation(0);
            
        setDailyPriceChangeHistogram([]);
        setDailyPriceChangeAverage(0);
        setDailyPriceChangeStandardDeviation(0);
        setLastPrice(0)
        setFutureDay("")

        // getData() and monteCarlo() share formatted_received_data    
        let formatted_received_data  = [];

        // Clear all warnings to make sure you don't have unnecessary ones    
        setNeedNumberOfSimulations(false)
        setNeedForecast(false)
        setNeedTicker(false)
        setAPI_daily_limit_reached(false)

        //Data validation

        if (days_in_the_future < 0 || days_in_the_future=='') { 
            setNeedForecast(true)
        }
        if (number_of_simulations < 0 || number_of_simulations=='') { 
            setNeedNumberOfSimulations(true)
        }

        // This odd set up has to do with the desire that all data validation that fails is flagged.

        if(ticker ==""){
            setNeedTicker(true)
        } else if (days_in_the_future < 0 || days_in_the_future=='') { 
            setNeedForecast(true)
        } else if (number_of_simulations < 0 || number_of_simulations=='') { 
            setNeedNumberOfSimulations(true)
        } else {
            //the functions need to use callback because otherwise monteCarlo wont have the data to work with
            //the api call takes time and monteCarlo will try to run without data
            getdata(monteCarlo)
        }


        function getdata(callback){

            // stock historical price coming from alphavantage
            // this uses a free account with a limit of 25 API calls per day
            // it gets 100 days of data
            var url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&datatype=json&apikey=DHDLO2H70JGALA6R`;


            fetch(url)
                .then(response => {
                    if (response.ok) {
                        return response.json(); // Parse the response data as JSON
                    } else {
                        throw new Error('API request failed');
                    }
                })
                .then(data => {

                    // validate whether the API call has data
                    // there may be a response but it could be an error message
                    if (data['Time Series (Daily)']){

                        // we get an object back from alphavantage
                        // we iterate through the object to get the data out
                        for (const [key, value] of Object.entries(data['Time Series (Daily)'])) {

                            let time = new Date(key).getTime()
                            let price = Number(value['4. close'])
                            formatted_received_data.push({time:time,price:price})
                        }

                        // the order of the list of objects matters
                        // if not reversed the latest date will show on the left of the graph
                        formatted_received_data.reverse()

                        setLastPrice(formatted_received_data[formatted_received_data.length-1].price)
                        callback()

                    // this Error Message comes when an invalid ticker is used
                    } else if (data['Error Message']){
                        setNeedTicker(true)

                    // this comes when the daily limit has been reached
                    } else if (data['Information']) {
                        setAPI_daily_limit_reached(true)
                    }

                })
                .catch(error => {
                    // Handle any errors here
                    console.log(error); 
                });

            //create a connection with finnhub
            const api_key = finnhub.ApiClient.instance.authentications['api_key'];
            api_key.apiKey = "cupruspr01qk8dnm1nb0cupruspr01qk8dnm1nbg"
            const finnhubClient = new finnhub.DefaultApi()

            // we use finnhub to get information on the company
            finnhubClient.companyProfile2({'symbol': ticker}, (error, data, response) => {

                setCompanyName(data.name)
                setCompanyLogo(data.logo)
                setCompanyExchange(data.exchange)

                let IPO_day = new Date(data.ipo)
                let IPO_day_string = IPO_day.toUTCString().slice(5,16)
                setCompanyIPO(IPO_day_string)

                setCompanyIndustry(data.finnhubIndustry)
                setCompanyMarketCap(data.marketCapitalization)
                setCompanySharesOutstanding(data.shareOutstanding)
            });

            finnhubClient.companyBasicFinancials(ticker, "all", (error, data, response) => {
                setCompanyBeta(data.metric.beta)
                let AnnualHigh = '52WeekHigh'
                setCompany52WeekHighPrice(data.metric[AnnualHigh])
                let AnnualHighDate = '52WeekHighDate'
                setCompany52WeekHighDate(data.metric[AnnualHighDate])
                let AnnualLow = '52WeekLow'
                setCompany52WeekLowPrice(data.metric[AnnualLow])
                let AnnualLowDate = '52WeekLowDate'
                setCompany52WeekLowDate(data.metric[AnnualLowDate])
                setCompanyPERatio(data.metric.peTTM)

            });
 
        }



        function monteCarlo(){

            //the function below will return an object with the average and standard deviation of the daily price change
            let daily_price_change_average_and_SD= getDailyPriceChangeAverageAndSD(formatted_received_data)

            //We have to unpack what comes back in two steps
            //the reason? If we try to use the state average and SD for the simulation
            //the numbers don't have time to arrive to state before the montecarlo for loop starts
            let daily_price_change_average_non_state = daily_price_change_average_and_SD.average

            let daily_price_change_standard_deviation_non_state = daily_price_change_average_and_SD.standard_deviation
            
            setDailyPriceChangeAverage(daily_price_change_average_non_state)

            setDailyPriceChangeStandardDeviation(daily_price_change_standard_deviation_non_state)

            setDailyPriceChangeHistogram(daily_price_change_average_and_SD.graph_histogram)

            //create the first object of the array "predicted prices"

            let predicted_prices = [{
                time:formatted_received_data[formatted_received_data.length-1].time
            }]

            //this for loop will determine how far in the future we will make predictions
            for (let i = 0; i < days_in_the_future; i += 1){
                predicted_prices.push(
                    {
                        time:predicted_prices[predicted_prices.length-1].time+(24*60*60*1000)
                    }
                )
            }

            // montecarlo simulations

            let predictedDatakeys_non_state = []

            //this for loop will determine the number of simulations i.e. how many montecarlo lines
            for(let number = 0 ; number < number_of_simulations ; number++){

                let key ='predicted_price_'+number

                predictedDatakeys_non_state.push(key)

                predicted_prices[0][key] = formatted_received_data[formatted_received_data.length-1].price

                //this for loop actually creates each montecarlo line
                for (let i = 1; i<predicted_prices.length; i += 1){
                    predicted_prices[i][key] = predicted_prices[i-1][key]+GetNormallyDistributedRandomNumber(daily_price_change_average_non_state, daily_price_change_standard_deviation_non_state)  
                }
            }

            // this will allow to graph each montecarlo line
            setPredictedDatakeys(predictedDatakeys_non_state)


            // getting the last object in predicted prices and making it an array of values
            let last_predicted_prices = Object.values(predicted_prices[predicted_prices.length-1])

            //dropping the first element of the array because it is the date
            last_predicted_prices.shift()

            // sending the array of last predicted prices to the function
            let last_price_average_SD_histogram = getPredictedPriceHistogram(last_predicted_prices)

            // decompose the object that comes back from getPredictedPriceHistogram()
            setPredictedPriceAverage(last_price_average_SD_histogram.last_price_average)

            setPredictedPriceStandardDeviation(last_price_average_SD_histogram.last_price_standard_deviation)

            // set the data for the last price histogram
            setPredictedPriceHistogram(last_price_average_SD_histogram.last_price_graph_histogram)

            //get and set the date of the last predicted price
            let final_day = new Date(predicted_prices[predicted_prices.length-1].time)

            let final_day_string = final_day.toUTCString().slice(5,16)

            setFutureDay(final_day_string)

            //final step: merge the data received from finnhub and the predicted prices
            let final_array = formatted_received_data.concat(predicted_prices)

            //store data in graphData
            setGraphPriceAndPrediction(final_array)

        }

        //the following lines is to run the program when the user clicks "Enter"

        const keyDownHandler = event => {
            if (event.key === 'Enter') {
                run_function()
            }
        };
      
        document.addEventListener('keydown', keyDownHandler);

        return () => {
            document.removeEventListener('keydown', keyDownHandler);
          };  


 
    },[run]);



    return (
        <div className = "d-flex justify-content-center" style={{padding:"2em 0"}}>
            <div>
                <div className = "d-flex" style= {{marginBottom:""}}>
                    <h1 >Monte Carlo Simulation for {companyName} </h1>
                    <img src={companyLogo} alt="logo" style={{height:"55.99px", marginLeft:"1em"}}></img>
                </div>
                <div className = "d-flex" style= {{marginBottom:"1em"}}>
                    <h6>Stock price from alphavantage.co (25 free API calls per day)</h6>
                </div>
                <div className = "d-flex" style={{marginBottom:"3em"}}>
                    <YourInput
                        ticker = {ticker}
                        setTicker = {setTicker}
                        needTicker = {needTicker}
                        days_in_the_future = {days_in_the_future}
                        setDays_in_the_future = {setDays_in_the_future}
                        needForecast = {needForecast}
                        number_of_simulations = {number_of_simulations}
                        setNumber_of_simulations = {setNumber_of_simulations}
                        needNumberOfSimulations = {needNumberOfSimulations}
                        run_function = {run_function}
                        API_daily_limit_reached = {API_daily_limit_reached}
                    />
                    <HistoricalPriceAndPrediction
                        lastPrice = {lastPrice}
                        graphPriceAndPrediction = {graphPriceAndPrediction}
                        predictedDatakeys = {predictedDatakeys}
                    
                    />            
                </div>
                <div className = "d-flex" style={{marginBottom:"3em"}}>
                    <HistogramDailyPriceChanges
                        dailyPriceChangeAverage = {dailyPriceChangeAverage}
                        dailyPriceChangeStandardDeviation = {dailyPriceChangeStandardDeviation}
                        dailyPriceChangeHistogram = {dailyPriceChangeHistogram}
                    
                    />
                    <HistogramPredictedPrices
                        futureDay = {futureDay}
                        predictedPriceAverage = {predictedPriceAverage}
                        predictedPriceStandardDeviation = {predictedPriceStandardDeviation}
                        predictedPriceHistogram = {predictedPriceHistogram}
                    />
                </div>
                <CompanyProfile
                    companyName = {companyName}
                    companyExchange = {companyExchange}
                    companyIndustry = {companyIndustry}
                    companyIPO = {companyIPO}
                    companyMarketCap = {companyMarketCap}
                    companyBeta = {companyBeta}
                    companyPERatio = {companyPERatio}
                    companySharesOutstanding = {companySharesOutstanding}
                    company52WeekHighPrice = {company52WeekHighPrice}
                    company52WeekHighDate = {company52WeekHighDate}
                    company52WeekLowPrice = {company52WeekLowPrice}
                    company52WeekLowDate = {company52WeekLowDate}
                />
                <Footer/>
            </div>
        </div>
    );
}

export default App;
