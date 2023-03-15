require('dotenv').config();

const Hapi = require('@hapi/hapi');
const ClientError = require('./exceptions/ClientError');

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

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    if (response instanceof Error) {
      if (response instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: response.message,
        });
        newResponse.code(response.statusCode);

        return newResponse;
      }

      if (!response.isSerrver) {
        return h.response;
      }

      const newResponse = h.response({
        status: 'error',
        message: 'Something went wrong. Please try again later',
      });
      newResponse.statusCode(500);

      return newResponse;
    }

    return h.continue;
  });

  await server.start();
  console.log(`Server is running on ${server.info.uri}`);
};

init();
