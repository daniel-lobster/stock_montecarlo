import { LineChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Label } from 'recharts';
import {useEffect, useState } from 'react';
import moment from 'moment'
import {GetNormallyDistributedRandomNumber} from './normal_distribution';
import {getDailyPriceChangeAverageAndSD} from './get_daily_price_change_histogram';
import {getPredictedPriceHistogram} from './get_predicted_price_histogram';

const finnhub = require('finnhub');


function App() {

    const [graphData,setGraphData]= useState([]);
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
    const [companyNews,setCompanyNews]= useState([]);

    const [needTicker,setNeedTicker] = useState(false)
    const [today_minus_x_days,setToday_minus_x_days]= useState(365);
    const [needMinusDays,setNeedMinusDays] = useState(false)
    const [days_in_the_future,setDays_in_the_future]= useState(100);
    const [needForecast,setNeedForecast] = useState(false)
    const [number_of_simulations,setNumber_of_simulations]= useState(100);
    const [needNumberOfSimulations,setNeedNumberOfSimulations] = useState(false)
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
        setGraphData([])
        setPredictedPriceHistogram([]);
        setPredictedPriceAverage(0);
        setPredictedPriceStandardDeviation(0);
            
        setDailyPriceChangeHistogram([]);
        setDailyPriceChangeAverage(0);
        setDailyPriceChangeStandardDeviation(0);

        // getData() and monteCarlo() share formatted_received_data    
        let formatted_received_data  = [];

        // Clear all warnings to make sure you don't have unnecessary ones    
        setNeedNumberOfSimulations(false)
        setNeedForecast(false)
        setNeedMinusDays(false)
        setNeedTicker(false)

        //Data validation

        if (today_minus_x_days <= 0 || today_minus_x_days=='') { 
            setNeedMinusDays(true)
        }
        if (days_in_the_future < 0 || days_in_the_future=='') { 
            setNeedForecast(true)
        }
        if (number_of_simulations < 0 || number_of_simulations=='') { 
            setNeedNumberOfSimulations(true)
        }

        // This is the only set up that ended up working
        // Tryed callbacks, async functions and many other things
        // This odd set up has to do with the desire that all data validation that fails is flagged.

        if(ticker ==""){
            setNeedTicker(true)
        } else if (today_minus_x_days <= 0 || today_minus_x_days=='') { 
            setNeedMinusDays(true)
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

            //create a connection with finnhub

            const api_key = finnhub.ApiClient.instance.authentications['api_key'];
            api_key.apiKey = "ckb23k9r01ql5f1naln0ckb23k9r01ql5f1nalng"
            const finnhubClient = new finnhub.DefaultApi()

            //start_date = unix timestamp seconds
            //Date.now() = unix timestamp milisecond

            //the start date is today minus 365 days
            let start_date = Math.floor(Date.now()/1000-(24*60*60) * today_minus_x_days)

            //make finnhub api call

            finnhubClient.stockCandles(ticker, "D", start_date , Date.now(), (error, data_received, response) => {
                
                //check whether data came back from the call
                if (data_received.s == "ok"){
                    
                    for (let x in data_received.c){
                        let time = data_received.t[x]
                        let price = data_received.c[x]
                        formatted_received_data.push({time:time*1000,price:price})                
                    }
                    console.log(formatted_received_data)
                    setLastPrice(formatted_received_data[formatted_received_data.length-1].price)
                    callback()

                } else {
                    // if nothing came back it is likely because the ticker is invalid
                    setNeedTicker(true)

                }
               
            })

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

            setGraphData(final_array)

        }

 
    },[run]);



    return (
        <div className = "d-flex justify-content-center" style={{padding:"2em 0"}}>
            <div>
                <div className = "d-flex" style= {{marginBottom:"2em"}}>
                    <h1 >Monte Carlo Simulation for {companyName} </h1>
                    <img src={companyLogo} alt="logo" style={{height:"55.99px", marginLeft:"1em"}}></img>
                </div>
                <div className = "d-flex" style={{marginBottom:"3em"}}>
                    <div style={{width:"50%"}}>
                        <h5 style= {{marginBottom:"1em"}}>Your Input</h5>
                        <table>
                            <tr>
                                <label>
                                    Stock Ticker: <input value = {ticker} name="stock_ticker" onChange={e => setTicker(e.target.value)}/>
                                </label>
                            </tr>
                            <tr>
                                {needTicker ? <div style={{height:'1em'}} className="warning">Please type a valid stock ticker</div>:<div style={{height:'1em'}}></div>}
                            </tr>
                            <tr>
                                <label>
                                    Today minus <input value = {today_minus_x_days} type="number" min="0" onChange={e => setToday_minus_x_days(e.target.value)}/> days
                                </label>
                            </tr>
                            <tr>
                                {needMinusDays ? <div style={{height:'1em'}} className="warning">Please type a positive number</div>:<div style={{height:'1em'}}></div>}
                            </tr>
                            <tr>
                                <label>
                                    How many days in the future? <input value = {days_in_the_future} type="number" min="0" onChange={e => setDays_in_the_future(e.target.value)}/>
                                </label>
                            </tr>
                            <tr>
                                {needForecast ? <div style={{height:'1em'}} className="warning">Please type number zero or higher</div>:<div style={{height:'1em'}}></div>}
                            </tr>
                            <tr>
                                <label>
                                    Number of simulations <input value = {number_of_simulations} type="number" min="0" onChange={e => setNumber_of_simulations(e.target.value)}/>
                                </label>
                            </tr>
                            <tr>
                                {needNumberOfSimulations ? <div style={{height:'1em'}} className="warning">Please type number zero or higher</div>:<div style={{height:'1em'}}></div>}
                            </tr>
                            <button onClick={run_function} className="btn button">
                                Run
                            </button>

                        </table>
                    </div>
                    <div style={{width:"50%", paddingLeft:"2em"}}>
                        <h5 style= {{marginBottom:"1em"}}>Historical Price and Prediction</h5>
                        <p style= {{marginBottom:"1em"}}>
                            Last reported price ${lastPrice}
                        </p>
                        <LineChart
                            width={500}
                            height={300}
                            data={graphData}
                            margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="time" 
                                tickFormatter = {unixTime => moment(unixTime).format("MMM-YY")}
                                style={{fill:"white"}}
                            />
                            <YAxis 
                                domain={['auto', 'auto']}
                                style={{fill:"white"}}
                            />
                            <Tooltip />
                            <Line
                                type="line"
                                dataKey="price"
                                stroke="#f38518"
                                dot={false}
                            />
                            {predictedDatakeys.map((element)=>{
                                return <Line type="line" dataKey={element} stroke="#ff66fe" dot={false}/>
                            })}

                        </LineChart>
                    </div>                   
                </div>
                <div className = "d-flex" style={{marginBottom:"3em"}}>
                    <div style={{width:"50%"}}>
                        <h5 style= {{marginBottom:"1em"}}>Histogram of daily price changes</h5>
                        <p>
                            Daily price change average ${Math.round((dailyPriceChangeAverage + Number.EPSILON) * 100) / 100}
                        </p>
                        <p style= {{marginBottom:"1em"}}>
                            Daily price change standard deviation ${Math.round((dailyPriceChangeStandardDeviation + Number.EPSILON) * 100) / 100}
                        </p>
                        <BarChart
                            width={500}
                            height={300}
                            data={dailyPriceChangeHistogram}
                            margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 10
                            }}
                            barSize={20}
                        >
                            <XAxis 
                                dataKey="name" 
                                scale="band" 
                                padding={{ left: 10, right: 10 }} 
                                style={{fill:"white"}}
                            >
                                <Label value="Daily Price Change (intervals)" offset={-10} position="insideBottom" fill="white"/>
                            </XAxis>
                            <YAxis style={{fill:"white"}}>
                                <Label value="Frequency" angle="-90" offset={12} position="insideLeft" fill="white" />
                            </YAxis>
                            <Tooltip />
                            <CartesianGrid strokeDasharray="3 3" />
                            <Bar dataKey="frequency" fill="#f38518" />
                        </BarChart>
                    </div>
                    <div style={{width:"50%" , paddingLeft:"2em"}}>
                        <h5 style= {{marginBottom:"1em"}}>Histogram of predicted prices for {futureDay}</h5>
                        
                        <p>
                            Average price ${Math.round((predictedPriceAverage + Number.EPSILON) * 100) / 100} 
                        </p>
                        <p style= {{marginBottom:"1em"}}>
                            Standard deviation of the prices ${Math.round((predictedPriceStandardDeviation + Number.EPSILON) * 100) / 100} 
                        </p>

                        <BarChart
                            width={500}
                            height={300}
                            data={predictedPriceHistogram}
                            margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 10
                            }}
                            barSize={20}
                        >
                            <XAxis 
                                dataKey="name" 
                                scale="band" 
                                padding={{ left: 10, right: 10 }} 
                                style={{fill:"white"}}
                            >
                                <Label value="Predicted Price (intervals)" offset={-10} position="insideBottom" fill="white"/>
                            </XAxis>
                            <YAxis style={{fill:"white"}}>
                                <Label value="Frequency" angle="-90" offset={12} position="insideLeft" fill="white" />
                            </YAxis>
                            <Tooltip />
                            <CartesianGrid strokeDasharray="3 3" />
                            <Bar dataKey="frequency" fill="#ff66fe" />
                        </BarChart>
                    </div>

                </div>
                <div>
                    <h5 style= {{marginBottom:"1em"}}>{companyName} profile  </h5>
                    <div className = "d-flex" style={{marginBottom:"3em"}}>
                        <div style={{width:"50%"}}>
                            <table>
                                <tr>
                                    <td style={{width:"170px"}}><p>Exchange:</p></td><td style={{textAlign:"right", width:"245px"}}><p>{companyExchange}</p></td>
                                </tr>
                                <tr>
                                    <td><p>Industry: </p></td><td style={{textAlign:"right"}}><p>{companyIndustry} </p></td>
                                </tr>
                                <tr>
                                    <td><p>IPO: </p></td><td style={{textAlign:"right"}}><p>{companyIPO} </p></td>
                                </tr>
                                <tr>
                                    <td><p>Market Capitalization:</p></td><td style={{textAlign:"right"}}><p>{Math.round((companyMarketCap/1000 + Number.EPSILON) * 100) / 100 } Billion </p></td>
                                </tr>
                                <tr>
                                    <td><p>Beta: </p></td> <td style={{textAlign:"right"}}><p>{Math.round((companyBeta + Number.EPSILON) * 100) / 100} </p></td>
                                </tr>
                                <tr>
                                    <td><p>PE Ratio (TTM): </p></td> <td style={{textAlign:"right"}}><p>{Math.round((companyPERatio + Number.EPSILON) * 100) / 100 } </p></td>
                                </tr>
                            </table>
                        </div>
                        <div style={{width:"50%", paddingLeft:"2em"}}>
                            <table>
                                <tr>
                                    <td style={{width:"170px"}}><p>Shares Outstanding: </p></td> <td style={{textAlign:"right", width:"245px"}}><p>{companySharesOutstanding} Million</p></td>
                                </tr>
                                <tr>
                                    <td><p>52 Week High Price: </p></td> <td style={{textAlign:"right"}}><p>{company52WeekHighPrice} dollars</p></td>
                                </tr>
                                <tr>
                                    <td><p>52 Week High Date: </p></td> <td style={{textAlign:"right"}}><p>{company52WeekHighDate} </p></td>
                                </tr>
                                <tr>
                                    <td><p>52 Week Low Price: </p></td> <td style={{textAlign:"right"}}><p>{company52WeekLowPrice} dollars</p></td>
                                </tr>
                                <tr>
                                    <td><p>52 Week Low Date: </p></td> <td style={{textAlign:"right"}}><p>{company52WeekLowDate} </p></td>
                                </tr>
                            </table>

                        </div>
                        
                    </div>
                </div>
                <div className="row d-flex justify-content-center">
                    <div className="col-lg-2 col-md-2 col-sm-12  pt-5 d-flex justify-content-center align-items-center ">
                        <a href="https://github.com/daniel-lobster" target="_blank" className="">
                            <img src="./images/lobster.png" className=" float-lg-end " style={{borderRadius: "50%", width :"5em"}}/>
                        </a>
                    </div>

                    <div className="col-lg-7 col-md-7 col-sm-12  pt-5 ">
                        <p className="fs-5 text-light mt-lg-0 mt-5">
                            Created by Daniel Pulido-Mendez
                        </p>
                        <p className="text-light ">
                        I help companies improve their on-line interactions with customers. My objective is to build intuitive and efficient software that helps businesses grow.
                        </p>
                        <a href="https://github.com/daniel-lobster" target="_blank" className="mt-5"  style={{ color: '#439cd6'}}>Learn More <span><i className="fa fa-angle-right" aria-hidden="true"></i></span></a>
                    </div>
                </div>
                <div className="row d-flex justify-content-center">
                    <div style={{width:"1162px"}}>
                        <br/>
                        <hr style={{color:'white', height:'2px', opacity:'1'}}/>
                        <p> Copyright © 2023  Daniel Pulido-Mendez</p>

                        <p>This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3 of the License.</p>

                        <p>This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.</p>

                        <p>For GNU General Public License see https://www.gnu.org/licenses/.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
