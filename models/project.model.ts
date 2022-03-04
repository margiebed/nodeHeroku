import mongoose from "mongoose";
import Project from "../interfaces/project.interface";

const projectSchema = new mongoose.Schema<Project>({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxLength: 50,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  content: {
    type: String,
    required: true,
    minlength: 3,
    maxLength: 255,
    default: null,
  },
});

const projectModel = mongoose.model<Project & mongoose.Document>("Project", projectSchema);

export default projectModel;
