let API_Key = "d6a51e4e2f0e56cbfd15ee02e35f5b91";
let daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thr", "Fri", "Sat"];

let cityLocation;
let cityText;


//A function to return the source URL for icons
function getIcon(icon) {
    let res = `http://openweathermap.org/img/wn/${icon}@2x.png`
    return res ;
}

// Function to formate the temperature string into our degree celcius
function formateTemp(str) {
    format = `${str?.toFixed(1)}°`
    return format;
}


async function getCurrentWeather({ lat, lon, name: city }) {
    let url = lat && lon ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_Key}&units=metric` :
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_Key}&units=metric`;

    let response = await fetch(url);
    return response.json();
}

async function getHourlyData({ name }) {
    let response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${name}&appid=${API_Key}&units=metric`);
    let data = await response.json();


    return data.list.map(fore => {
        let { main: { temp, temp_min, temp_max }, dt_txt, weather: [{ icon }] } = fore;
        return { temp, temp_max, temp_min, dt_txt, icon };
    });


}



function loadCurrentWeather({ main: { temp, temp_min, temp_max, }, name, weather: [{ description, icon }] }) {
    document.querySelector("#city").textContent = name;
    document.querySelector("#current-temp").textContent = formateTemp(temp);
    document.querySelector("#high-low").textContent = `High:${formateTemp(temp_max)}   Low:${formateTemp(temp_min)}`;
    document.querySelector(".current-temp #desc").textContent = description;
    console.log(icon)

    document.querySelector("#current-icon").setAttribute("scr", getIcon(icon));
}


function loadHourlyWeather({ main: { temp: TempNow }, weather: [{ icon: IconNow }] }, hourlyData) {
    let interValForecast = hourlyData.slice(1, 14);
    const timeFormatter = Intl.DateTimeFormat("en", { hour12: true, hour: "2-digit" });
    const hourlySection = document.querySelector("#hourly-forecast");
    let innerHourlyHtml = `<section>
    <h2 class="hourly-temp">${formateTemp(TempNow)}</h2>
    <img src="${getIcon(IconNow)}" alt="Icon" class="icon">
    <h4 class="hourly-time">Now</h4>
</section>`;
    for (let { temp, dt_txt, icon } of interValForecast.slice(2, 14)) {
        innerHourlyHtml += `<section>
        <h2 class="hourly-temp">${formateTemp(temp)}</h2>
        <img src="${getIcon(icon)}" alt="Icon" class="icon">
        <h4 class="hourly-time">${timeFormatter.format(new Date(dt_txt))}</h4>
    </section>`;

    }
    hourlySection.innerHTML = innerHourlyHtml;




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
        dayWise.set(key, { minimumTemp, maximumTemp, icon: value.find(v => v.icon).icon})
        
    };

    return dayWise;
}




function loadFiveDaysWeather(hourlyData) {
    const dayWiseForecast = calculateDayWiseForecast(hourlyData);
    const fiveDaySection = document.querySelector("#five-days");
    let dayWiseHtml = ``;

    Array.from(dayWiseForecast).map(([day, { minimumTemp, maximumTemp, icon }], index) => {
        
        dayWiseHtml += `<div class="day-wise">
        <h1 class="day">${index === 0 ? "Today" : day}</h1>
        <img class="day-icon" src="${getIcon(icon)}" alt="">
        <h4 class="day-high">High:${formateTemp(maximumTemp)}</h4>
        <h4 class="day-low">Low:${formateTemp(minimumTemp)}</h4>

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


async function loadData() {
    const weatherInfo = await getCurrentWeather(cityLocation);

    loadCurrentWeather(weatherInfo);

    const hourlyData = await getHourlyData(weatherInfo);
    loadHourlyWeather(weatherInfo, hourlyData);
    loadFeelsLikeHumidity(weatherInfo);
    loadFiveDaysWeather(hourlyData);

}


function loadForecastUsingGeolocation() {
    navigator.geolocation.getCurrentPosition(({ coords }) => {

        const { longitude, latitude } = coords;

        cityLocation = { lat: latitude, lon: longitude };

        loadData();
    }, error => console.error(error));


}


//Implementing search functionality

async function getCities(searchText) {
    const list = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${searchText}&limit=5&appid=${API_Key}`)
    return list.json();

}
async function searchCity(event) {
    const { value } = event.target;
    if (!value) {
        cityLocation = null;
        cityText = '';

    }
    if (value && (cityLocation !== value)) {
        const citiesList = await getCities(value);
        console.log(citiesList)
        let options = ``;
        for (let { lat, lon, name, state, country } of citiesList) {
            options += `<option data-city='${JSON.stringify({ lat, lon, name })}' value="${name},${state},${country}"></option>`;
        }
        document.querySelector("#cities").innerHTML = options;
    }



}

//debounce function for search
function debounce(fn) {
    let timer;
    return (...args) => {
        clearTimeout();

        timer = setTimeout(() => {
            fn.apply(this, args);
        }, 300)

    }
}
const debounceSearch = debounce(event => searchCity(event));

function handleCitySelected(event) {
    cityText = event.target.value;
    let options = document.querySelectorAll("#cities option");
    if (options?.length) {
        let selectedCity = Array.from(options).find(obj => obj.value === cityText);
        cityLocation = JSON.parse(selectedCity.getAttribute("data-city"));
        loadData();
    }
}



document.addEventListener("DOMContentLoaded", async () => {
    loadForecastUsingGeolocation();
    const searchText = document.querySelector("#search");
    searchText.addEventListener("input", debounceSearch);
    searchText.addEventListener("change", handleCitySelected)
})