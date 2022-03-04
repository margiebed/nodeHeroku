import express, { Request, Response } from "express";

import registerUser from "../src/users/registerUser";
import getAllUsers from "../src/users/getAllUsers";
import getUser from "../src/users/getUser";
import editProfile from "../src/users/editProfile";
import sendEmailToUser from "../src/users/sendEmail";
import confirmation from "../src/users/confirmation";
import deleteUser from "../src/users/deleteUser";
export default class UserController {
  public path = "/users";
  public router = express.Router();

  constructor() {
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.get(this.path, this.getAllUsers);
    this.router.post(`${this.path}/register`, this.registerUser);
    this.router.put(`${this.path}/:id`, this.editProfile);
    this.router.get(`${this.path}/:id`, this.getUser);
    this.router.post(`${this.path}/email`, this.sendEmailToUser);
    this.router.get(`${this.path}/confirmation/:token`, this.confirmation);
    this.router.delete(`${this.path}/:id`, this.deleteUser);
  }

  editProfile(req: Request, res: Response) {
    editProfile(req, res);
  }

  registerUser(req: Request, res: Response) {
    registerUser(req, res);
  }

  getAllUsers(req: Request, res: Response) {
    getAllUsers(req, res);
  }

  getUser(req: Request, res: Response) {
    getUser(req, res);
  }

  sendEmailToUser(req: Request, res: Response) {
    sendEmailToUser(req, res);
  }

  confirmation(req: Request, res: Response) {
    confirmation(req, res);
  }

  deleteUser(req: Request, res: Response) {
    deleteUser(req, res);
  }
}
