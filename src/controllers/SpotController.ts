import {Response} from "express";
import {db, functions, admin} from "../infra/firebase";
import * as geofire from "geofire-common";
import {
  fetchSpotWaveForecast,
  fetchSpotTide,
  getSpotWaveForecast} from "../common/SpotForecastAPIManager";

type Request = {
    params: {spotId: string}
}

type RequestCitySpots = {
    params: {city: string}
}

type RequestSearch = {
    params: {searchText: string}
}

type RequestMapRect = {
  params: {
    centerLat: number,
    centerLong: number,
    radius: number
  }
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

interface SpotWF {
  id: string,
  name: string,
  address: string,
  city: string,
  state: string,
  country: string,
  coords: string,
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

interface SpotType {
  id: string,
  name: string,
  address: string,
  city: string,
  state: string,
  country: string,
  coords: admin.firestore.GeoPoint,
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const getSpot = async (req: Request, resp: Response) => {
  const spotId = req.params.spotId;

  try {
    const spotDoc = db.collection("Spots").doc(spotId);
    const spot = (await spotDoc.get()).data() || [];

    const spotTide = fetchSpotTide(
        spot.coords.latitude,
        spot.coords.longitude);

    const highTide: Tide[] = (await spotTide).filter((item) => {
      return (item.type == "high");
    });
    const lowTide: Tide[] = (await spotTide).filter((item) => {
      return (item.type == "low");
    });

    const waveForecast = fetchSpotWaveForecast(
        spot.coords.latitude,
        spot.coords.longitude);

    const spotDetail: SpotWF[] = (await waveForecast).map(function(item) {
      const spotItem: SpotWF = {
        id: spot.id,
        name: spot.name,
        address: spot.address,
        city: spot.city,
        state: spot.state,
        country: spot.country,
        coords: spot.coords,
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
      return spotItem;
    });

    return resp.status(200).json(spotDetail);
  } catch (error) {
    return resp.status(500).json(error);
  }
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const getAllSpot = async (req: Request, resp: Response) => {
  try {
    const querySnapshot = await db.collection("Spots").get();
    const favoriteSpots: SpotWF[] = [];
    for (const spotDoc of querySnapshot.docs) {
      const spot = spotDoc.data();
      const spotTide = await fetchSpotTide(
          spot.coords.latitude,
          spot.coords.longitude);

      const highTide: Tide[] = (spotTide).filter((item) => {
        return (item.type == "high");
      });

      const lowTide: Tide[] = (spotTide).filter((item) => {
        return (item.type == "low");
      });
      functions.logger.info(
          "teste low"+lowTide.toString, {structuredData: true});
      const waveForecast = await fetchSpotWaveForecast(
          spot.coords.latitude,
          spot.coords.longitude);

      for (const item of waveForecast) {
        const spotItem: SpotWF = {
          id: spot.id,
          name: spot.name,
          address: spot.address,
          city: spot.city,
          state: spot.state,
          country: spot.country,
          coords: spot.coords,
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
        favoriteSpots.push(spotItem);
      }
    }
    return resp.status(200).json(favoriteSpots);
  } catch (error) {
    return resp.status(500).json(error);
  }
};

const getCitySpots = async (req: RequestCitySpots, resp: Response):
Promise<void> => {
  const city = req.params.city;
  const spot: SpotType[] = [];
  try {
    const querySnapshot = await db.collection("Spots")
        .where("city", "==", city)
        .get();
    // querySnapshot.forEach((doc: any) => spot.push(doc.data()));
    querySnapshot.forEach(
        (doc: FirebaseFirestore.DocumentData) => spot.push(doc.data())
    );
    resp.status(200).json(spot);
  } catch (error) {
    resp.status(500).json(error);
  }
};


const spotSeacrh = async (req: RequestSearch, resp:Response):
Promise<void> => {
  const searchText = req.params.searchText;

  const searchedSpots: SpotType[] = [];
  try {
    const searchSnapshot = await db.collection("Spots")
        .orderBy("name")
        .startAt(searchText)
        .endAt(searchText + "\uf8ff")
        .get();
    // searchSnapshot.forEach((doc: any) => searchedSpots.push(doc.data()));
    searchSnapshot.forEach(
        (doc: FirebaseFirestore.DocumentData) => searchedSpots.push(doc.data())
    );

    resp.status(200).json(searchedSpots);
  } catch (error) {
    resp.status(500).json(error);
  }
};

const spotCitySeacrh = async (req: RequestSearch, resp:Response):
Promise<void> => {
  const searchText = req.params.searchText;

  const searchedSpots: SpotType[] = [];
  try {
    const searchSnapshot = await db.collection("Spots")
        .orderBy("city")
        .startAt(searchText)
        .endAt(searchText + "\uf8ff")
        .get();
    // searchSnapshot.forEach((doc: any) => searchedSpots.push(doc.data()));
    searchSnapshot.forEach(
        (doc: FirebaseFirestore.DocumentData) => searchedSpots.push(doc.data())
    );

    resp.status(200).json(searchedSpots);
  } catch (error) {
    resp.status(500).json(error);
  }
};

const searchSpotsByGeoLocation = async (req: RequestMapRect, resp: Response):
Promise<void> => {
  const centerLat = Number(req.params.centerLat);
  const centerLong = Number(req.params.centerLong);
  const radius = req.params.radius * 1000;
  const center = [centerLat, centerLong];
  const bounds = geofire.geohashQueryBounds(center, radius);
  const promises = [];

  try {
    for (const b of bounds) {
      const query = db.collection("Spots")
          .orderBy("geohash")
          .startAt(b[0])
          .endAt(b[1]);
      promises.push(query.get());
    }

    const matchingSpots = [];
    const snapshots = await Promise.all(promises);
    for (const snap of snapshots) {
      for (const doc of snap.docs) {
        const lat = Number(doc.get("coords").latitude);
        const long = Number(doc.get("coords").longitude);

        const distanceInKm = geofire.distanceBetween([lat, long], center);
        const distanceInM = distanceInKm * 1000;

        if (distanceInM <= radius) {
          const jsonDoc = JSON.stringify(doc.data());
          functions.logger.info(
              "teste json 01 - "+jsonDoc,
              {structuredData: true});

          const fieldsProto = JSON.parse(jsonDoc);

          functions.logger.info(
              "teste json 02 - "+fieldsProto.id,
              {structuredData: true});

          const spotObject: SpotType = {
            id: fieldsProto.id,
            name: fieldsProto.name,
            address: fieldsProto.address,
            city: fieldsProto.city,
            state: fieldsProto.state,
            country: fieldsProto.country,
            coords: new admin.firestore.GeoPoint(
                fieldsProto.coords._latitude, fieldsProto.coords._longitude),
          };

          const spotWF = await getSpotWaveForecast(spotObject);

          matchingSpots.push(spotWF[0]);
        }
      }
    }
    resp.status(200).json(matchingSpots);
  } catch (error) {
    resp.status(500).json(error);
  }
};

export {
  getSpot,
  getAllSpot,
  getCitySpots,
  spotSeacrh,
  spotCitySeacrh,
  searchSpotsByGeoLocation,
};
