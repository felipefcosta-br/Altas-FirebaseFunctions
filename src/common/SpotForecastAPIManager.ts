import fetch from "node-fetch";
import {functions, admin} from "../infra/firebase";

const apiKey = "[apiKey]";
interface SpotWF {
  id: string,
  name: string,
  address: string,
  city: string,
  state: string,
  country: string,
  coords: admin.firestore.GeoPoint,
  waveHeight: BaseWaveForecast
  waveDirection: BaseWaveForecast
  wavePeriod: BaseWaveForecast
  swellDirection: BaseWaveForecast
  waterTemperature: BaseWaveForecast
  windSpeed: BaseWaveForecast
  windDirection: BaseWaveForecast
  highTide: Tide[]
  lowTide: Tide[]
}


interface WaveForecast {
    waveHeight: BaseWaveForecast
    waveDirection: BaseWaveForecast
    wavePeriod: BaseWaveForecast
    swellDirection: BaseWaveForecast
    waterTemperature: BaseWaveForecast
    windSpeed: BaseWaveForecast
    windDirection: BaseWaveForecast
    highTide: BaseWaveForecast
    lowTide: BaseWaveForecast
  }

  interface BaseWaveForecast {
    dwd: number
    fcoo: number
    icon: number
    meteo: number
    noaa: number
    sg: number
  }

  interface Tide {
    height: number
    time: string
    type: string
  }

  interface Spot {
    id: string,
    name: string,
    address: string,
    city: string,
    state: string,
    country: string,
    coords: admin.firestore.GeoPoint,
  }
/**
 * fetch waveforecast of spot with parameters
 * @param {string} lat
 * @param {string} long
 */
async function fetchSpotWaveForecast(lat: string, long: string):
Promise<WaveForecast[]> {
  try {
    const params = [
      "windWaveDirection",
      "windWaveHeight",
      "windWavePeriod",
      "swellDirection",
      "swellHeight",
      "swellPeriod",
      "waveDirection",
      "waveHeight",
      "wavePeriod",
      "windDirection",
      "windSpeed",
      "gust",
      "waterTemperature",
    ].join(",");

    const todayObj = new Date();
    const today = todayObj.toISOString().slice(0, 10);

    const resp = await fetch(
        `https://[url-stormglass]?lat=${lat}&lng=${long}&start=${today}&end=${today}&params=${params}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": apiKey,
          },
        });

    const json = await resp.json() as any;

    const hoursJson = JSON.stringify(json.hours);
    const wf = <WaveForecast[]>JSON.parse(hoursJson);
    return wf;
  } catch (error) {
    functions.logger.info(`Error message - ${error}`, {structuredData: true});
    const wf: WaveForecast[] = [];
    return wf;
  }
}

/**
 * fetch tide of spot with parameters
 * @param {string} lat
 * @param {string} long
 */
async function fetchSpotTide(lat: string, long: string):
Promise<Tide[]> {
  try {
    const todayObj = new Date();
    const tomorrowObj = new Date(todayObj);
    tomorrowObj.setDate(tomorrowObj.getDate() + 1);

    const today = todayObj.toISOString().slice(0, 10);
    const tomorrow = tomorrowObj.toISOString().slice(0, 10);

    const resp = await fetch(
        `https://[url-stormglass]?lat=${lat}&lng=${long}&start=${today}&end=${tomorrow}&datum=MLLW`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": apiKey,
          },
        });

    const json = await resp.json() as any;
    functions.logger.info(json.data, {structuredData: true});
    const dataJson = JSON.stringify(json.data);
    const exTide = <Tide[]>JSON.parse(dataJson);

    return exTide;
  } catch (error) {
    functions.logger.info(`Error message - ${error}`, {structuredData: true});
    const exTide: Tide[] = [];
    return exTide;
  }
}
/**
 * return spot waveforecast by coordinate
 * @param {FirebaseFirestore.DocumentData} geoSpot
 */
async function getSpotWaveForecast(geoSpot: Spot):
Promise<SpotWF[]> {
  functions.logger.info(
      "geoSpot - "+geoSpot,
      {structuredData: true});

  const spotTide = await fetchSpotTide(
      String(geoSpot.coords.latitude),
      String(geoSpot.coords.longitude));

  const highTide: Tide[] = (spotTide).filter((item) => {
    return (item.type == "high");
  });

  const lowTide: Tide[] = (spotTide).filter((item) => {
    return (item.type == "low");
  });

  const waveForecast = await fetchSpotWaveForecast(
      String(geoSpot.coords.latitude),
      String(geoSpot.coords.longitude));

  functions.logger.info(
      "geoSpot teste - lat"+geoSpot.coords.latitude,
      {structuredData: true});

  functions.logger.info(
      "geoSpot teste - long"+geoSpot.coords.longitude,
      {structuredData: true});

  functions.logger.info(
      "geoSpot teste - WF01"+waveForecast,
      {structuredData: true});

  functions.logger.info(
      "geoSpot teste - WF02"+waveForecast.length,
      {structuredData: true});

  const spotsWF: SpotWF[] = [];
  for (const item of waveForecast) {
    const spotItem: SpotWF = {
      id: geoSpot.id,
      name: geoSpot.name,
      address: geoSpot.address,
      city: geoSpot.city,
      state: geoSpot.state,
      country: geoSpot.country,
      coords: geoSpot.coords,
      waveHeight: item.waveHeight,
      waveDirection: item.waveDirection,
      wavePeriod: item.wavePeriod,
      swellDirection: item.swellDirection,
      waterTemperature: item.waterTemperature,
      windSpeed: item.windSpeed,
      windDirection: item.windDirection,
      highTide: highTide,
      lowTide: lowTide,
    };
    functions.logger.info(
        "geoSpot - spotItem"+spotItem, {structuredData: true});
    spotsWF.push(spotItem);
  }
  return spotsWF;
}

export {
  fetchSpotWaveForecast,
  fetchSpotTide,
  getSpotWaveForecast,
};
