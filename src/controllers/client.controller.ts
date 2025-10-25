import { Request, Response } from 'express';
import prisma from '../services/prisma.service';
import bcrypt from 'bcrypt';
import { successResponse, errorResponse } from '../utils/response.handler';
import _ from 'lodash';

export interface ClientController {
  register: (req: Request, res: Response) => Promise<Response>;
  login: (req: Request, res: Response) => Promise<Response>;
}

async function register(req: Request, res: Response) {
  try {
    const { email, name, password } = req.body;
    const client = await prisma.client.create({
      data: { email, name, password },
    });
    return successResponse(req, res, {
      result: client,
      message: 'Client registered successfully',
      statusCode: 201
    });
  } catch (err) {
    console.error('Error in client registration:', err);
    return errorResponse(res, 500, 'Internal server error');
  }
}

async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, 'Email and password are required');
    }

    const user = await prisma.client.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return errorResponse(res, 401, 'Invalid password');
    }

    if (!user.isActive) {
      return errorResponse(res, 403, 'Account is not active');
    }

    return successResponse(req, res, {
      result: _.omit(user, 'password'),
      message: 'Login successful',
      statusCode: 200
    });
  } catch (err) {
    console.error('Error in client login:', err);
    return errorResponse(res, 500, 'Internal server error');
  }
}

export default {
  register,
  login,
} as ClientController;
