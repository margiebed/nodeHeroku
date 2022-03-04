import { Request, Response } from "express";
import bcrypt from "bcrypt";

import userModel from "../../models/user.model";
import { loginValidation } from "../../src/auth/validateAuth";

// import { register } from "../../controllers/users.controller";

// const router = express.Router();
// router.post("/register", register);

// export default router;

export default async function authUser(req: Request, res: Response) {
    //validate the data before we a user
    const { error } = loginValidation(req.body);
	if (error) {
		return res.status(400).send(error.details[0].message);
	}
    //checkinf if the email exist in the database
    let user = await userModel.findOne({ email: req.body.email });
	if (!user) {
		return res.status(400).send("Invalid email or password.");
	} 
    //password is correct
    const validPassword = await bcrypt.compare(req.body.password, user.password)
    if (!validPassword) {return res.status(400).send("Invalid email or password.")}
    

    res.send('Logged In!');
    
}