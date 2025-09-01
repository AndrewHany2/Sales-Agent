import prisma from "../services/prisma.service";
import { Request, Response } from "express";

async function register(req: Request, res: Response) {
    const { email, name } = req.body;
    const user = await prisma.user.create({
        data: { email, name }
    });
    res.status(201).json(user);
}

export default { register };
