import {Response} from "express";
import {db} from "../infra/firebase";

type UserType = {
    id: string,
    name: string,
    email: string,
    city: string,
    authUserId: string,
}

type RequestGet = {
    params: {authUserId: string}
}

type RequestPost = {
    body: UserType
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const addUser = async (req: RequestPost, resp: Response) => {
  const {name, email, city, authUserId} = req.body;
  // functions.logger.info(req.body, {structuredData: true});
  const userDoc = db.collection("Users").doc();
  try {
    const userObj = {
      id: userDoc.id,
      name,
      email,
      city,
      authUserId,
    };

    userDoc.set(userObj);
    resp.status(200).send({
      status: "success",
      message: "User added successfully",
      data: userObj,
    });
  } catch (error) {
    // functions.logger.info(error, {structuredData: true});
    resp.status(500).json(error);
  }
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const getUser = async (req: RequestGet, resp: Response) => {
  const authUserId = req.params.authUserId;
  try {
    const user: UserType[] = [];
    const querySnapshot = await db.collection("Users")
        .where("authUserId", "==", authUserId)
        .get();

    querySnapshot.forEach(
        (doc:FirebaseFirestore.DocumentData) => user.push(doc.data()));
    return resp.status(200).json(user);
  } catch (error) {
    return resp.status(500).json(error);
  }
};

export {
  getUser,
  addUser,
};
