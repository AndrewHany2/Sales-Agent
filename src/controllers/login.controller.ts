import { Request, Response } from 'express';
import prisma from '../services/prisma.service';
import bcrypt from 'bcrypt';
import { successResponse, errorResponse } from '../utils/response.handler';

const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, 'Email and password are required');
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
      },
    });

    if (!user) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    return successResponse(req, res, {
      statusCode: 200,
      message: 'Login successful',
      result: user,
    });
  } catch (error) {
    console.error('Error during login:', error);
    return errorResponse(res, 500, 'Internal Server Error');
  }
};

export default { login };
