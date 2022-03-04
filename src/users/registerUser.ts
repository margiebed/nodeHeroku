import bcrypt from 'bcrypt'
import { Response, Request } from 'express'
import { StatusCodes } from 'http-status-codes'
import "dotenv/config";

import validate from '../auth/validateAuth'
import userModel from '../../models/user.model'
import sendEmail from '../utils/email'


const registerUser = async (req: Request, res: Response) => {
  const { error } = validate(req.body)
  if (error) {
    return res.status(400).send(error.details[0].message)
  }
  let user = await userModel.findOne({ email: req.body.email })
  if (user) {
    return res.status(400).send('That user already exisits!')
  } else {
    user = new userModel({
      username: req.body.username,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      password: req.body.password,
      date: req.body.date,
    })
    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(user.password, salt)

    const token = user.generateAuthToken();
    const url = `http://${process.env.ADDRESSPORT}/users/confirmation/${token}`;
    sendEmail(req.body.email, url);
    await user.save()
    res.status(StatusCodes.OK).send(user._id)
  }
}

export default registerUser