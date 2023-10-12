import { LineChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import {useEffect, useState } from 'react';
import moment from 'moment'
import {GetNormallyDistributedRandomNumber} from './normal_distribution';
import {getDailyPriceChangeAverageAndSD} from './daily_price_change_average_SD';
import {getPredictedPriceHistogram} from './get_predicted_price_histogram';

const finnhub = require('finnhub');


function App() {

    const [graphData,setGraphData]= useState([]);
    const [ticker,setTicker]= useState('AAPL');
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
    const [graphDataHistogram,setGraphDataHistogram]= useState([]);

    function run_function(){
        setRun(!run);
    }




       
    useEffect(() => {

        //Clear graphData to make sure that if data validation fails there isn't a graph

        setGraphData([])

        // getData() and monteCarlo() share formatted_received_data    
        let formatted_received_data  = [];

        // Clear all warnings to make sure you don't have unnecessary ones    
        setNeedNumberOfSimulations(false)
        setNeedForecast(false)
        setNeedMinusDays(false)
        setNeedTicker(false)

        //test individualy each warning

        if (today_minus_x_days < 0 || today_minus_x_days=='') { 
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
        } else if (today_minus_x_days < 0 || today_minus_x_days=='') { 
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

                    callback()

                } else {
                    // if nothing came back it is likely because the ticker is invalid
                    setNeedTicker(true)

                }
               
            })
 
        }



        function monteCarlo(){
        
            //the function below will return an object with the average and standard deviation of the daily price change
            
            let daily_price_change_average_and_SD= getDailyPriceChangeAverageAndSD(formatted_received_data)

            let average = daily_price_change_average_and_SD.average

            let standard_deviation = daily_price_change_average_and_SD.standard_deviation

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
                    predicted_prices[i][key] = predicted_prices[i-1][key]+GetNormallyDistributedRandomNumber(average, standard_deviation)  
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

            // decompose the object that comes back from the function
            let last_price_average = last_price_average_SD_histogram.last_price_average

            let last_price_standard_deviation = last_price_average_SD_histogram.last_price_standard_deviation

            let last_price_graph_histogram = last_price_average_SD_histogram.last_price_graph_histogram

            // set the data for the last price histogram
            setGraphDataHistogram(last_price_graph_histogram)

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
        <fieldset className = "container d-flex justify-content-center" style={{padding:"2em 0"}}>
            <div>
                <h1 style= {{marginBottom:"1em"}}>Yahoo API</h1>
                <table>
                    <tr>
                        <label>
                            Stock Ticker: <input value = {ticker} name="stock_ticker" onChange={e => setTicker(e.target.value)}/>
                        </label>
                    </tr>
                    <tr>
                        {needTicker ? <div style={{height:'1em'}} className="warning">Please include a valid stock ticker</div>:<div style={{height:'1em'}}></div>}
                    </tr>
                    <tr>
                        <label>
                            Today minus <input value = {today_minus_x_days} type="number" min="0" onChange={e => setToday_minus_x_days(e.target.value)}/> days
                        </label>
                    </tr>
                    <tr>
                        {needMinusDays ? <div style={{height:'1em'}} className="warning">Please include a positive number</div>:<div style={{height:'1em'}}></div>}
                    </tr>
                    <tr>
                        <label>
                            How many days in the future? <input value = {days_in_the_future} type="number" min="0" onChange={e => setDays_in_the_future(e.target.value)}/>
                        </label>
                    </tr>
                    <tr>
                        {needForecast ? <div style={{height:'1em'}} className="warning">Please include a positive number</div>:<div style={{height:'1em'}}></div>}
                    </tr>
                    <tr>
                        <label>
                            Number of simulations <input value = {number_of_simulations} type="number" min="0" onChange={e => setNumber_of_simulations(e.target.value)}/>
                        </label>
                    </tr>
                    <tr>
                        {needNumberOfSimulations ? <div style={{height:'1em'}} className="warning">Please include a positive number</div>:<div style={{height:'1em'}}></div>}
                    </tr>
                    <button onClick={run_function} className="btn button">
                        Run
                    </button>

                </table>

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
                    {/* <Legend /> */}
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
            <div>
                <p>{futureDay}</p>
                <BarChart
                    width={500}
                    height={300}
                    data={graphDataHistogram}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5
                    }}
                    barSize={20}
                >
                    <XAxis dataKey="name" scale="band" padding={{ left: 10, right: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Bar dataKey="frequency" fill="#ff66fe" />
                </BarChart>
            </div>
        </fieldset>
    );
}

export default App;
