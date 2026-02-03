const url = "https://restcountries.com/v3.1/all?fields=name,currencies,capitalInfo,borders,flags";

let countriesData;

fetch(url)
  .then(response => response.json())
  .then(data => {
    countriesData = data;
    console.log("Data loaded:", countriesData.length, "countries");
    renderGrid();
    setupPagination();
  })
  .catch(error => console.error("Error:", error));
let currentPage = 1;
const itemsPerPage = 16;
function renderGrid() {
  const container = document.getElementById("flags-container");
  container.innerHTML = "";
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageData = countriesData.slice(startIndex, endIndex);
  pageData.forEach(country => {
    const card = document.createElement("div");
    card.className = "country-card";
    const img = document.createElement("img");
    img.src = country.flags.png;
    img.alt = `Flag of ${country.name.common}`;
    const name = document.createElement("h3");
    name.textContent = country.name.common;

    card.appendChild(img);
    card.appendChild(name);
    container.appendChild(card);
  });
  updatePaginationControls();
}
function updatePaginationControls() {
  const totalPages = Math.ceil(countriesData.length / itemsPerPage);
  document.getElementById("page-info").textContent = `Page ${currentPage} of ${totalPages}`;
  document.getElementById("prev-btn").disabled = currentPage === 1;
  document.getElementById("next-btn").disabled = currentPage === totalPages;
}
function setupPagination() {
  document.getElementById("prev-btn").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderGrid();
    }
  });
  document.getElementById("next-btn").addEventListener("click", () => {
    const totalPages = Math.ceil(countriesData.length / itemsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderGrid();
    }
  });
}
