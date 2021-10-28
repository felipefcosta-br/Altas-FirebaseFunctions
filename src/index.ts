import * as functions from "firebase-functions";
import * as express from "express";
import {
  getSpot,
  getAllSpot,
  getCitySpots,
  spotSeacrh,
  spotCitySeacrh,
  searchSpotsByGeoLocation,
} from "./controllers/SpotController";
import {
  addFavotiteSpot,
  getUserFavotiteSpots,
  getFavoriteSpot,
  getFavoriteSpotBySpotId,
  deleteFavoriteSpot} from "./controllers/FavoriteSpotController";
import {
  addUser,
  getUser} from "./controllers/UserController";

const app = express();

// SpotController functions
app.get("/spot/:spotId", getSpot);
app.get("/citySpots/:city", getCitySpots);
app.get("/spotSearch/:searchText", spotSeacrh);
app.get("/spotSearch/city/:searchText", spotCitySeacrh);
app.get("/spots/", getAllSpot);
app.get("/spots/:centerLat/:centerLong/:radius", searchSpotsByGeoLocation);

// FavoriteSpotController functions
app.get("/favoriteSpots/:fireUserId", getUserFavotiteSpots);
app.get("/favoriteSpot/:favSpotId", getFavoriteSpot);
app.get("/favoriteSpot/:fireUserId/:spotId", getFavoriteSpotBySpotId);
app.post("/favoriteSpot", addFavotiteSpot);
app.delete("/favoriteSpot/:fireUserId/:favSpotId", deleteFavoriteSpot);

// UserController functions
app.get("/user/:authUserId", getUser);
app.post("/user", addUser);


exports.app = functions.https.onRequest(app);

