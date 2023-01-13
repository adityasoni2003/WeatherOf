let API_Key = "d6a51e4e2f0e56cbfd15ee02e35f5b91";
let daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thr", "Fri", "Sat"];

let cityLocation;
let cityText;


//A function to return the source URL for icons
function getIcon(icon) {
    return `http://openweathermap.org/img/wn/${icon}@2x.png`;
}

// Function to formate the temperature string into our degree celcius
function formateTemp(str) {
    format = `${str?.toFixed(1)}°`
    return format;
}

// Function to return a Map of Day wise forecast
function calculateDayWiseForecast(hourlyFore) {
    let dayWise = new Map();
    for (let forecast of hourlyFore) {
        let date = forecast.dt_txt.split(' ')[0];

        let day = daysOfWeek[new Date(date).getDay()];

        if (dayWise.has(day)) {
            let forecastDay = dayWise.get(day);
            forecastDay.push(forecast);
            dayWise.set(day, forecastDay)
        } else {
            dayWise.set(day, [forecast])
        }
    }
    for (let [key, value] of dayWise.entries()) {
        let minimumTemp = Math.min(...Array.from(value, val => val.temp_min));
        let maximumTemp = Math.min(...Array.from(value, val => val.temp_max));
        dayWise.set(key, { minimumTemp, maximumTemp, icon: value.find(v => v.icon).icon })
    };

    return dayWise;
}


async function getCurrentWeather() {
    let city = "Pune";
    let response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_Key}&units=metric`);
    return response.json();
}

async function getHourlyData({ name }) {
    let response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${name}&appid=${API_Key}&units=metric`);
    let data = await response.json();
    console.log(data);

    return data.list.map(fore => {
        let { main: { temp, temp_min, temp_max }, dt_txt, weather: [{ icon }] } = fore;
        return { temp, temp_max, temp_min, dt_txt, icon };
    });


}



function loadCurrentWeather({ main: { temp, temp_min, temp_max, }, name, weather: [{ description, icon }] }) {
    document.querySelector("#city").textContent = name;
    document.querySelector("#current-temp").textContent = formateTemp(temp);
    document.querySelector("#high-low").textContent = `High:${formateTemp(temp_max)} Low:${formateTemp(temp_min)}`;
    document.querySelector(".current-temp #desc").textContent = description;
    document.querySelector("#current-icon").setAttribute("scr", getIcon(icon));
}

function loadHourlyWeather({ main: { temp: TempNow }, weather: [{ icon: IconNow }] }, hourlyData) {
    let interValForecast = hourlyData.slice(1, 14);
    const timeFormatter = Intl.DateTimeFormat("en", { hour12: true, hour: "2-digit" });
    const hourlySection = document.querySelector("#hourly-forecast");
    let innerHourlyHtml = `<div class="hourly-div">
    <h2 class="hourly-temp">${formateTemp(TempNow)}</h2>
    <img src="${getIcon(IconNow)}" alt="" class="icon">
    <h4 class="hourly-time">Now</h4>
</div>`;
    for (let { temp, dt_txt, icon } of interValForecast.slice(2, 14)) {
        innerHourlyHtml += `<div class="hourly-div">
        <h2 class="hourly-temp">${formateTemp(temp)}</h2>
        <img src="${getIcon(icon)}" alt="" class="icon">
        <h4 class="hourly-time">${timeFormatter.format(new Date(dt_txt))}</h4>
    </div>`;

    }
    hourlySection.innerHTML = innerHourlyHtml;




}
function loadFiveDaysWeather(hourlyData) {
    const dayWiseForecast = calculateDayWiseForecast(hourlyData);
    const fiveDaySection = document.querySelector("#five-days");
    let dayWiseHtml = ``;

    Array.from(dayWiseForecast).map(([day, { minimumTemp, maximumTemp, icon }], index) => {
        dayWiseHtml += `<div class="day-wise">
        <h1 class="day">${index === 0 ? "Today" : day}</h1>
        <img class="day-icon" src="${getIcon(icon)}" alt="" height="100px" width="100px">
        <h4 class="day-high">High:${formateTemp(maximumTemp)}'</h4>
        <h4 class="day-low">Low:${formateTemp(minimumTemp)}'</h4>

    </div>`}
    );
    fiveDaySection.innerHTML = dayWiseHtml;


}

function loadFeelsLikeHumidity({ main: { feels_like, humidity } }) {
    let humidityElement = document.querySelector("#humidity-value");
    let feelsLike = document.querySelector("#feels-like-temp");
    humidityElement.textContent = `${humidity}%`;
    feelsLike.textContent = `${formateTemp(feels_like)}`

}



document.addEventListener("DOMContentLoaded", async () => {
    const weatherInfo = await getCurrentWeather();
    console.log(weatherInfo);
    loadCurrentWeather(weatherInfo);

    const hourlyData = await getHourlyData(weatherInfo);
    loadHourlyWeather(weatherInfo, hourlyData);
    loadFeelsLikeHumidity(weatherInfo);
    loadFiveDaysWeather(hourlyData);





})