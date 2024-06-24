document.addEventListener("DOMContentLoaded", async () => {
  let routeSearchedList = document.querySelector(".routeSearchedList");
  let searchbox = document.querySelector("#searchbox");
  let searchBtn = document.querySelector("#searchBtn");
  let stopID_name = {};
  let stopSearchedList = document.querySelector(".stopList");
  let etaList = document.querySelector(".etaList");
  // Fetch and store stop names
  try {
    const stopNamesResponse = await axios("https://data.etabus.gov.hk/v1/transport/kmb/stop");
    stopNamesResponse.data.data.forEach(stoplist => {
      stopID_name[stoplist.stop] = stoplist.name_tc;
    });
  } catch (error) {
    console.error("Error fetching stop names:", error);
    return; // Exit if we can't fetch stop names
  }
  searchBtn.addEventListener("click", async () => {
    routeSearchedList.innerHTML = "";
    stopSearchedList.innerHTML = "";
    try {
      const routesResponse = await axios("https://data.etabus.gov.hk/v1/transport/kmb/route/");
      const routes = routesResponse.data.data;
      let routeChecked = routes.filter(route => route.route === searchbox.value.toUpperCase());
      routeChecked.forEach((route, i) => {
        const routeSearched = document.createElement("button");
        routeSearched.id = `routeNumber-${i}`;
        routeSearched.innerHTML = `${route.orig_tc}->${route.dest_tc}`;
        routeSearchedList.appendChild(routeSearched);
        routeSearched.addEventListener("click", () => loadStops(route, i));
      });
    } catch (error) {
      console.error("Error fetching routes:", error);
    }
  });
  async function loadStops(route, index) {
    stopSearchedList.innerHTML = "";
    const routeboundConverted = route.bound === "O" ? "outbound" : "inbound";
    try {
      const stopsResponse = await axios(`https://data.etabus.gov.hk/v1/transport/kmb/route-stop/${route.route}/${routeboundConverted}/${route.service_type}`);
      const stopIDList = stopsResponse.data.data.map(stopInfo => stopInfo.stop);
      
      stopsResponse.data.data.forEach((stopInfo, j) => {
        if (stopID_name[stopInfo.stop]) {
          stopSearchedList.innerHTML += `
            <div class="stopNumber" tabindex="0" style="border-radius: 20px; padding: 5px" id="stopNumber-${j}">
              ${j + 1} ${stopID_name[stopInfo.stop]}
            </div>`;
        }
      });
      document.querySelectorAll(".stopNumber").forEach((element, index) => {
        element.addEventListener("focus", () => loadEta(stopIDList[index], route, index));
        element.addEventListener("blur", () => etaList.classList.remove("show"));
      });
    } catch (error) {
      console.error("Error fetching stops:", error);
    }
  }
  async function loadEta(stopID, route, seqIndex) {
    etaList.innerHTML = "";
    try {
      const etaResponse = await axios(`https://data.etabus.gov.hk/v1/transport/kmb/eta/${stopID}/${route.route}/${route.service_type}`);
      const arrayOfEtas = etaResponse.data.data.filter(info => (
        info.dir === route.bound && info.service_type === route.service_type && info.seq === seqIndex + 1
      ));
      arrayOfEtas.forEach(etaInfo => {
        const etaTime = etaInfo.eta.slice(11, 16);
        const etaMode = etaInfo.rmk_tc || "實時班次";
        etaList.innerHTML += `
          <div class="eta">
            <div>時間</div>
            <div>${etaTime}</div>
            <div>${etaMode}</div>
          </div>`;
      });
      etaList.classList.add("show");
    } catch (error) {
      console.error("Error fetching ETA:", error);
    }
  }
});