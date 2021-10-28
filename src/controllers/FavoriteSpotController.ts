import {Response} from "express";
import {db, functions, admin} from "../infra/firebase";
import {
  fetchSpotWaveForecast,
  fetchSpotTide} from "../common/SpotForecastAPIManager";


type FavoriteSpotType = {
    id: string,
    fireUserId: string,
    spotId: string,
    spotName: string,
    address: string,
    city: string,
    state: string,
    country: string,
    coords: admin.firestore.GeoPoint,
}

type RequestPost = {
    body: FavoriteSpotType,
    params: { favSpotId: string},
}

type RequestGet = {
  params: {fireUserId: string}
}

type RequestSpotIdGet = {
  params: {
    fireUserId: string,
    spotId: string}
}

type Request = {
  params: {favSpotId: string}
}

type RequestDelete = {
  params: {
    fireUserId: string,
    favSpotId: string
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


interface FavoriteSpot {
  id: string,
  fireUserId: string,
  spotId: string,
  spotName: string,
  address: string,
  city: string,
  state: string,
  country: string,
  coords: admin.firestore.GeoPoint,
}

interface FavoriteSpotWF {
  id: string,
  fireUserId: string,
  spotId: string,
  spotName: string,
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


// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const addFavotiteSpot = async (req: RequestPost, resp: Response) => {
  const {
    fireUserId,
    spotId,
    spotName,
    address,
    city,
    state,
    country,
    coords} = req.body;


  try {
    const favoriteSpot = db.collection("Users")
        .doc(fireUserId)
        .collection("FavoriteSpots")
        .doc();

    const dataJson = JSON.stringify(coords);
    const coordsJson = JSON.parse(dataJson);

    const spotObject: FavoriteSpot = {
      id: favoriteSpot.id,
      fireUserId: fireUserId,
      spotId: spotId,
      spotName: spotName,
      address: address,
      city: city,
      state: state,
      country: country,
      coords: new admin.firestore.GeoPoint(
          coordsJson._latitude, coordsJson._longitude),
    };

    favoriteSpot.set(spotObject);
    resp.status(200).send({
      status: "success",
      message: "Spot added successfully",
      data: spotObject,
    });
  } catch (error) {
    resp.status(500).json(error);
  }
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const getUserFavotiteSpots = async (req: RequestGet, resp: Response) => {
  const userId = req.params.fireUserId;
  try {
    const userDoc = await db.collection("Users").doc(userId);

    const querySnapshot = await userDoc.collection("FavoriteSpots").get();
    const favoriteSpots: FavoriteSpotWF[] = [];
    for (const favSpotDoc of querySnapshot.docs) {
      const favSpot = favSpotDoc.data();

      functions.logger.info(
          "teste latitude"+favSpot.coords.latitude,
          {structuredData: true});
      const spotTide = await fetchSpotTide(
          favSpot.coords.latitude,
          favSpot.coords.longitude);

      const highTide: Tide[] = (spotTide).filter((item) => {
        return (item.type == "high");
      });

      const lowTide: Tide[] = (spotTide).filter((item) => {
        return (item.type == "low");
      });
      functions.logger.info(
          "teste low"+lowTide.toString, {structuredData: true});
      const waveForecast = await fetchSpotWaveForecast(
          favSpot.coords.latitude,
          favSpot.coords.longitude);

      for (const item of waveForecast) {
        const spotItem: FavoriteSpotWF = {
          id: favSpot.id,
          fireUserId: favSpot.fireUserId,
          spotId: favSpot.spotId,
          spotName: favSpot.spotName,
          address: favSpot.address,
          city: favSpot.city,
          state: favSpot.state,
          country: favSpot.country,
          coords: favSpot.coords,
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
    functions.logger.info(error, {structuredData: true});
    return resp.status(500).json(error);
  }
};


// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const getFavoriteSpot = async (req: Request, resp: Response) => {
  const favSpotId = req.params.favSpotId;
  functions.logger.info(favSpotId, {structuredData: true});

  try {
    const favSpotDoc = db.collection("FavoriteSpots").doc(favSpotId);
    const favSpot = (await favSpotDoc.get()).data() || [];
    return resp.status(200).json(favSpot);
  } catch (error) {
    return resp.status(500).json(error);
  }
};

const getFavoriteSpotBySpotId = async (
    req: RequestSpotIdGet,
    resp: Response): Promise<Response> => {
  const fireUserId = req.params.fireUserId;
  const spotId = req.params.spotId;
  const favSpot: FavoriteSpotType[] = [];

  try {
    const querySnapshot = await db.collection("Users")
        .doc(fireUserId)
        .collection("FavoriteSpots")
        .where("spotId", "==", spotId)
        .get();

    querySnapshot.forEach(
        (doc: FirebaseFirestore.DocumentData) => favSpot.push(doc.data())
    );
    return resp.status(200).json(favSpot);
  } catch (error) {
    return resp.status(500).json(error);
  }
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const deleteFavoriteSpot = async (req: RequestDelete, resp: Response) => {
  const fireUserId = req.params.fireUserId;
  const favSpotId = req.params.favSpotId;
  try {
    const favSpot = db.collection("Users")
        .doc(fireUserId)
        .collection("FavoriteSpots")
        .doc(favSpotId);

    await favSpot.delete().catch((error) => {
      return resp.status(400).json({
        message: error.message,
      });
    });
    return resp.status(200).json({
      status: "success",
      message: "Spot removed from Favorites.",
    });
  } catch (error) {
    return resp.status(500).json(error);
  }
};
export {
  addFavotiteSpot,
  getUserFavotiteSpots,
  getFavoriteSpot,
  getFavoriteSpotBySpotId,
  deleteFavoriteSpot};
