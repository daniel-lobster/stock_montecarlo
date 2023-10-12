


export function getDailyPriceChangeAverageAndSD(formatted_received_data){

    //compute the average daily price change, the oldest observation will be lost

    let delta_sum = 0;
    let count = 0;
    let daily_price_change = [];
    for (let i =1;i<formatted_received_data.length;i++){
        let delta = formatted_received_data[i].price-formatted_received_data[i-1].price
        daily_price_change.push(delta)
        delta_sum = delta_sum + delta
        count ++               
    }

    let average = delta_sum/count

    //compute the standard deviation of the daily price changes

    let sum_deviation_from_average_squared = 0;
    for (let i =0;i<daily_price_change.length;i++){
        let delta = (daily_price_change[i]-average)**2
        sum_deviation_from_average_squared += delta             
    }

    let standard_deviation = Math.sqrt(sum_deviation_from_average_squared/(count-1))

    return {
        average:average, 
        standard_deviation:standard_deviation
    }
}