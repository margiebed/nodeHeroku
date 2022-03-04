import { Response, Request } from "express";
import { StatusCodes } from "http-status-codes";

import userModel from "../../models/user.model";
import validateEditProfile from "./validateEditProfile";

const editProfile = async (req: Request, res: Response) => {
  console.log("edit profile");
  const { error } = validateEditProfile(req.body);
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).send(error.details[0].message);
  }
  const user = await userModel.findById(req.params.id);
  if (!user) return res.status(StatusCodes.NOT_FOUND).send("User not found");

  let userEmail = await userModel.findOne({ email: req.body.email });

  res.locals.email = userEmail;

  if (userEmail) {
    return res.status(400).send("That email already exisits!");
  }
  const userProf = await userModel.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
    },
    { new: true }
  );
  return res.status(StatusCodes.OK).send(userProf);
};

export default editProfile;
