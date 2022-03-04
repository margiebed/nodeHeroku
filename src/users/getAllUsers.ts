import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import userModel from "../../models/user.model";

const getAllUsers = async (req: Request, res: Response) => {
  const users = await userModel.find().select("-_id");
  if (!users) {
    return res.status(StatusCodes.NOT_FOUND).send("Users not found");
  }
  res.status(StatusCodes.OK).send(users);
};

export default getAllUsers;
