import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import {useEffect, useState } from 'react';
import moment from 'moment'
import {GetNormallyDistributedRandomNumber} from './normal_distribution';
import {getDailyPriceChangeAverageAndSD} from './average_and_SD';

const finnhub = require('finnhub');


function App() {

    const [graphData,setGraphData]= useState([]);
    const [ticker,setTicker]= useState('aapl');
    const [run,setRun]= useState(true);

    function run_function(){
        setRun(!run);
    }

       
    useEffect(() => {
        
        let formatted_received_data  = [];


        function getdata(callback){

            //create a connection with finnhub

            const api_key = finnhub.ApiClient.instance.authentications['api_key'];
            api_key.apiKey = "ckb23k9r01ql5f1naln0ckb23k9r01ql5f1nalng"
            const finnhubClient = new finnhub.DefaultApi()

            //start_date = unix timestamp seconds
            //Date.now() = unix timestamp milisecond

            //the start date is today minus 365 days
            let start_date = Math.floor(Date.now()/1000-(24*60*60) * 365)

            //make finnhub api call

            finnhubClient.stockCandles(ticker, "D", start_date , Date.now(), (error, data_received, response) => {
                
                for (let x in data_received.c){
                    let time = data_received.t[x]
                    let price = data_received.c[x]
                    formatted_received_data.push({time:time*1000,price:price})                
                }

                callback()
            })
            
        }

        function monteCarlo(){
        
            //the function below will return an object with the average and standard deviation of the daily price change
            
            let daily_price_change_average_and_SD= getDailyPriceChangeAverageAndSD(formatted_received_data)

            let average = daily_price_change_average_and_SD.average

            let standard_deviation = daily_price_change_average_and_SD.standard_deviation


            //create the first object of the array "predicted prices"
            //take the info from the last object of formatted_received_data i.e. the most current data point
            //add one day (in milliseconds) to the time
            //add one random number (that follows a normal distribution of given mean and std) to price

            let predicted_prices = [{
                time:(formatted_received_data[formatted_received_data.length-1].time+(24*60*60*1000)),
                predicted_price: formatted_received_data[formatted_received_data.length-1].price+GetNormallyDistributedRandomNumber(average, standard_deviation)
            }]

            //create the rest of predicted_prices array

            for (let i = 0; i < 250; i += 1){
                predicted_prices.push(
                    {
                        time:predicted_prices[predicted_prices.length-1].time+(24*60*60*1000),
                        predicted_price: predicted_prices[predicted_prices.length-1].predicted_price+GetNormallyDistributedRandomNumber(average, standard_deviation)
                    }
                )
            }

            //final step: merge the data received from finnhub and the predicted prices
            
            let final_array = formatted_received_data.concat(predicted_prices)

            //store that data in graphData

            setGraphData(final_array)

        }

        //the functions need to use callback because otherwise monteCarlo wont have the data to work with
        //the api call takes time and monteCarlo will try to run without data

        getdata(monteCarlo)

 
    },[run]);



    return (
        <div>
        <h1>Yahoo API</h1>
        <label>
            Stock Ticker: <input name="stock_ticker" onChange={e => setTicker(e.target.value)}/>
        </label>
        <button onClick={run_function}>
            Run
        </button>
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
            />
            <YAxis 
                domain={['auto', 'auto']}
            />
            <Tooltip />
            <Legend />
            <Line
                type="line"
                dataKey="price"
                stroke="#8884d8"
                dot={false}
            />
            <Line type="line" dataKey="predicted_price" stroke="#82ca9d" dot={false}/>
        </LineChart>
        </div>
    );
}

export default App;
