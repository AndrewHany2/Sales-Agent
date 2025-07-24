import prismaService from './services/prisma.service';
import express from 'express';
import cors from 'cors';
import router from './routes/api.route';

const app = express();
app.use(cors());
app.use(express.json());
app.use(`/api/v1`, router);

const server = app.listen(process.env.PORT || 3000, async () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});

(async () => {
  try {
    await prismaService.$connect();
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Failed to connect to the database:', error);
  }
})();

export default server;