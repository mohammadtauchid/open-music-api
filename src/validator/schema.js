const Joi = require('joi');

const AlbumPayloadSchema = Joi.object({
  title: Joi.string().required(),
  year: Joi.number().integer().required(),
});

const SongPayloadSchema = Joi.object({
  title: Joi.string().required(),
  year: Joi.number().integer().required(),
  genre: Joi.string().required(),
  performer: Joi.string().required(),
  duration: Joi.number().allow(null).default(null),
  albumId: Joi.string().allow(null).default(null),
});

module.exports = {
  AlbumPayloadSchema,
  SongPayloadSchema,
};
