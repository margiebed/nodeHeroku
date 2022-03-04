import mongoose from "mongoose";

interface Project extends mongoose.Document {
  name: string;
  userId: number;
  mentorId?: number;
  content: string;
}

export default Project;
