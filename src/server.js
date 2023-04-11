require('dotenv').config();

const Hapi = require('@hapi/hapi');
const ClientError = require('./exceptions/ClientError');

// albums
const albums = require('./api/albums');
const AlbumService = require('./services/postgres/AlbumService');
const AlbumsValidator = require('./validator/albums');

// songs
const songs = require('./api/songs');
const SongService = require('./services/postgres/SongService');
const SongsValidator = require('./validator/songs');

const init = async () => {
  const albumsService = new AlbumService();
  const songsService = new SongService();
  const server = Hapi.server({
    host: process.env.HOST,
    port: process.env.PORT,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register([
    {
      plugin: albums,
      options: {
        service: albumsService,
        validator: AlbumsValidator,
      },
    },
    {
      plugin: songs,
      options: {
        service: songsService,
        validator: SongsValidator,
      },
    },
  ]);

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

      if (!response.isServer) {
        return h.response;
      }

      const newResponse = h.response({
        status: 'error',
        message: 'Something went wrong. Please try again later',
      });
      newResponse.code(500);

      return newResponse;
    }

    return h.continue;
  });

  await server.start();
  console.log(`Server is running on ${server.info.uri}`);
};

init();
