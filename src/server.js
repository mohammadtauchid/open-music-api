require('dotenv').config();

const Hapi = require('@hapi/hapi');

const init = async () => {
  const server = Hapi.server({
    host: process.env.HOST,
    port: process.env.PORT,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.start();
  console.log(`Server is running on ${server.info.uri}`);
};

init();
