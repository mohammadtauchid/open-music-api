exports.up = (pgm) => {
  pgm.createTable('songs', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    title: {
      type: 'TEXT',
      notNull: true,
    },
    year: {
      type: 'SMALLINT',
      notNull: true,
    },
    genre: {
      type: 'TEXT',
      notNull: true,
    },
    performer: {
      type: 'TEXT',
      notNull: true,
    },
    duration: {
      type: 'SMALLINT',
      allowNull: true,
    },
    albumId: {
      type: 'VARCHAR(50)',
      allowNull: true,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('songs');
};
