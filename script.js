const url = "https://restcountries.com/v3.1/all?fields=name,flags,latlng,borders,capital,population";
let allCountries = [];
let filteredCountries = [];
let currentPage = 1;
const itemsPerPage = 16;
const container = document.getElementById("flags-container");
const paginationControls = document.getElementById("pagination-controls");
const modal = document.getElementById("country-modal");
const modalDetails = document.getElementById("modal-details");
const modalWeather = document.getElementById("modal-weather");
const closeBtn = document.querySelector(".close");
const searchInput = document.getElementById("search-input");
const ACCUWEATHER_API_KEY = window.ENV ? window.ENV.accuweather_api_key : "";

searchInput.addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase();
  filteredCountries = allCountries.filter(country =>
    country.name.common.toLowerCase().includes(searchTerm)
  );
  currentPage = 1;
  renderGrid();
});
fetch(url)
  .then(res => res.json())
  .then(data => {
    allCountries = data;
    filteredCountries = [...allCountries];
    renderGrid();
  })
  .catch(err => console.error("Error loading data:", err));
function renderGrid() {
  container.innerHTML = "";
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageData = filteredCountries.slice(startIndex, endIndex);
  if (pageData.length === 0) {
    container.innerHTML = "<p>No countries found.</p>";
  }
  pageData.forEach(country => {
    const card = document.createElement("div");
    card.className = "country-card";
    const img = document.createElement("img");
    img.src = country.flags.png;
    img.alt = country.name.common;
    const name = document.createElement("h3");
    name.textContent = country.name.common;
    card.appendChild(img);
    card.appendChild(name);
    card.addEventListener("click", () => showModal(country));
    container.appendChild(card);
  });
  updatePagination();
}
function updatePagination() {
  const totalPages = Math.ceil(filteredCountries.length / itemsPerPage) || 1;
  paginationControls.innerHTML = "";
  const createBtn = (text, page, isActive = false, isDisabled = false) => {
    const btn = document.createElement("button");
    btn.className = `pg-btn ${isActive ? "active" : ""}`;
    btn.innerHTML = text;
    btn.disabled = isDisabled;
    if (!isDisabled && !isActive) {
      btn.addEventListener("click", () => {
        currentPage = page;
        renderGrid();
      });
    }
    return btn;
  };
  const createEllipsis = () => {
    const span = document.createElement("span");
    span.className = "pg-ellipsis";
    span.textContent = "...";
    return span;
  };
  const prevBtn = createBtn("< Pre", currentPage - 1, false, currentPage === 1);
  paginationControls.appendChild(prevBtn);

  const pgNumbers = document.createElement("div");
  pgNumbers.className = "pg-numbers";

  const pages = [];
  const range = 1;
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > range + 2) pages.push("...");
    const start = Math.max(2, currentPage - range);
    const end = Math.min(totalPages - 1, currentPage + range);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - (range + 1)) pages.push("...");
    pages.push(totalPages);
  }

  pages.forEach(p => {
    if (p === "...") {
      pgNumbers.appendChild(createEllipsis());
    } else {
      pgNumbers.appendChild(createBtn(p, p, p === currentPage));
    }
  });

  paginationControls.appendChild(pgNumbers);

  const nextBtn = createBtn("Next >", currentPage + 1, false, currentPage === totalPages || filteredCountries.length === 0);
  paginationControls.appendChild(nextBtn);
}
function showModal(country) {
  const name = country.name.common;
  let nativeOfficial = "N/A";
  if (country.name.nativeName) {
    const nativeKeys = Object.keys(country.name.nativeName);
    if (nativeKeys.length > 0) {
      nativeOfficial = country.name.nativeName[nativeKeys[0]].official;
    }
  }
  const latitude = country.latlng && country.latlng.length > 0 ? country.latlng[0] : null;
  const longitude = country.latlng && country.latlng.length > 1 ? country.latlng[1] : null;
  const borders = country.borders || [];
  const lastTwoBorders = borders.slice(-2);
  const borderText = lastTwoBorders.length > 0 ? lastTwoBorders.join(", ") : "No borders";
  modalDetails.innerHTML = `
        <h2>${name}</h2>
        <img src="${country.flags.png}" style="width: 100%; max-height: 200px; object-fit: contain; margin-bottom: 15px;">
        <div class="modal-info-item"><strong>Native Official Name:</strong> ${nativeOfficial}</div>
        <div class="modal-info-item"><strong>Longitude:</strong> ${longitude || "N/A"}</div>
        <div class="modal-info-item"><strong>Borders (Last 2):</strong> ${borderText}</div>
    `;
  modalWeather.innerHTML = `<div class="loading-weather">Loading weather data...</div>`;
  modal.style.display = "block";
  if (latitude !== null && longitude !== null) {
    fetchWeather(latitude, longitude);
  } else {
    modalWeather.innerHTML = `<div class="weather-error">Weather data unavailable (No coordinates).</div>`;
  }
}
async function fetchWeather(lat, lng) {
  if (!ACCUWEATHER_API_KEY || ACCUWEATHER_API_KEY.includes("YOUR_") || ACCUWEATHER_API_KEY.includes("https")) {
    modalWeather.innerHTML = `<div class="weather-error">Please provide a valid AccuWeather API Key.</div>`;
    return;
  }
  try {
    const locUrl = `https://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${ACCUWEATHER_API_KEY}&q=${lat},${lng}`;
    const locRes = await fetch(locUrl);
    const locData = await locRes.json();
    if (!locData || !locData.Key) {
      throw new Error("Location not found");
    }
    const locationKey = locData.Key;
    const locationName = locData.LocalizedName;
    const weatherUrl = `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${ACCUWEATHER_API_KEY}`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();
    if (!weatherData || weatherData.length === 0) {
      throw new Error("Weather data not found");
    }
    const current = weatherData[0];
    displayWeather(current, locationName);
  } catch (error) {
    console.error("Weather fetch error:", error);
    modalWeather.innerHTML = `<div class="weather-error">Failed to load weather data.</div>`;
  }
}
function displayWeather(data, locationName) {
  const temp = data.Temperature.Metric.Value;
  const unit = data.Temperature.Metric.Unit;
  const text = data.WeatherText;
  const humidity = data.RelativeHumidity !== undefined ? data.RelativeHumidity : "N/A";
  modalWeather.innerHTML = `
        <div class="modal-info-item"><strong>Temperature:</strong> ${temp}°${unit}</div>
        <div class="modal-info-item"><strong>Weather:</strong> ${text}</div>
        <div class="modal-info-item"><strong>Humidity:</strong> ${humidity}%</div>
    `;
}
closeBtn.onclick = () => modal.style.display = "none";
window.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
};
