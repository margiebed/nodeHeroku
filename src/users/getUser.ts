import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import userModel from '../../models/user.model'

const getUser = async (req: Request, res: Response) => {
  const user = await userModel.findById(req.params.id).select('-password')
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).send('User not found')
  }
  res.status(StatusCodes.OK).send(user)
}

export default getUser
