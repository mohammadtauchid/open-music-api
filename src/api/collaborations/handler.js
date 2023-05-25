const autoBind = require('auto-bind');

class CollaborationsHandler {
  constructor(collaborationsService, playlistsService, usersService, validator) {
    this._collaborationsService = collaborationsService;
    this._playlistsService = playlistsService;
    this._usersService = usersService;
    this._validator = validator;

    autoBind(this);
  }

  async postCollaborationHandler(request, h) {
    this._validator.validateCollaborationPayload(request.payload);

    const { id: owner } = request.auth.credentials;
    const { playlistId, userId } = request.payload;

    await this._usersService.getUserById(userId);
    await this._playlistsService.verifyPlaylistOwner(playlistId, owner);

    const collaborationId = await this._collaborationsService
      .addCollaborator({ playlistId, userId });

    const response = h.response({
      status: 'success',
      data: {
        collaborationId,
      },
    });
    response.code(201);

    return response;
  }

  async deleteCollaborationHandler(request) {
    this._validator.validateCollaborationPayload(request.payload);

    const { id: owner } = request.auth.credentials;
    const { playlistId, userId } = request.payload;

    await this._playlistsService.verifyPlaylistOwner(playlistId, owner);
    await this._collaborationsService
      .deleteCollaborator({ playlistId, userId });

    return {
      status: 'success',
      message: 'Collaborator successfully deleted',
    };
  }
}

module.exports = CollaborationsHandler;
