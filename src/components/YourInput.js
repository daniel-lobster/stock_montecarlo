

export default function YourInput(
    {
        ticker,
        setTicker,
        needTicker,
        days_in_the_future,
        setDays_in_the_future,
        needForecast,
        number_of_simulations,
        setNumber_of_simulations,
        needNumberOfSimulations,
        run_function,
        API_daily_limit_reached
    }
){



    return (
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
                <tr>
                    <label style={{height:'3em'}}>
                        The API call imports 100 days of historical data for the simulation. 
                    </label>
                </tr>
                <button id = "run_button" onClick={run_function} className="button">
                    Run
                </button>
                <tr>
                    {API_daily_limit_reached ? <div style={{height:'1em'}} className="warning">Maximum 25 API calls in one day</div>:<div style={{height:'1em'}}></div>}
                </tr>

            </table>
        </div> 


    )
}