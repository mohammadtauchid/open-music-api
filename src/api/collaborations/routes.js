const collborationRoute = (collaborationHandler) => [
  {
    method: 'POST',
    path: '/collaborations',
    handler: collaborationHandler.postCollaborationHandler,
    options: {
      auth: 'musicapp_jwt',
    },
  },
  {
    method: 'DELETE',
    path: '/collaborations',
    handler: collaborationHandler.deleteCollaborationHandler,
    options: {
      auth: 'musicapp_jwt',
    },
  },
];

module.exports = collborationRoute;
