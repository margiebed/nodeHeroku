import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import projectModel from "../models/project.model";
import mongoose from "mongoose";

export default class ProjectController {
  public path = "/project";
  public router = express.Router();

  constructor() {
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.get(this.path, this.getAll);
    this.router.post(`${this.path}/create`, this.create);
    this.router.put(`${this.path}/:id`, this.edit);
  }

  async create(req: Request, res: Response) {
    console.log("create", req.body);

    let project = await projectModel.findOne({ name: req.body.name });
    if (project) {
      return res.status(400).send("Project already exists");
    } else {
      console.log("creating");
      project = new projectModel({
        name: req.body.name,
        userId: mongoose.Types.ObjectId(req.body.userId),
        mentorId: mongoose.Types.ObjectId(req.body.mentorId),
        // mentorId: req.body.mentorId,
        content: req.body.content,
      });

      await project.save();
      res.send(project);
    }
  }

  async edit(req: Request, res: Response) {
    console.log("edit", req.body);

    let project = await projectModel.findById(req.params.id);
    if (!project)
      return res.status(StatusCodes.NOT_FOUND).send("Project not found");

    project = await projectModel.findByIdAndUpdate(req.params.id, {
      ...req.body,
    });

    return res.status(StatusCodes.OK).send(project);
  }

  async getAll(req: Request, res: Response) {
    console.log("getAll", req.body);

    const projects = await projectModel.find().select("-_id");
    res.status(StatusCodes.OK).send(projects);
  }
}
