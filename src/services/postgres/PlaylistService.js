const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class PlaylistService {
  constructor(songService, collaborationService) {
    this._pool = new Pool();
    this._songService = songService;
    this._collaborationService = collaborationService;
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Playlist failed to add');
    }

    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    const query = {
      text:
      `SELECT p.id, p.name, u.username
      FROM playlists AS p
      JOIN users AS u
      ON p.owner = u.id
      WHERE u.id = $1 OR
      p.id IN (SELECT playlist_id FROM collaborations WHERE user_id = $1)`,
      values: [owner],
    };

    const result = await this._pool.query(query);

    return result.rows;
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1',
      values: [id],
    };

    await this._pool.query(query);
  }

  async addPlaylistSong(playlistId, { songId, userId }) {
    await this._songService.verifySongId(songId, 'Song', 'add');
    const id = nanoid(16);

    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Song failed to add into playlist');
    }

    this.addPlaylistSongActivity(playlistId, { songId, userId, action: 'add' });
  }

  async getPlaylistSongsByPlaylistId(id) {
    const playlistQuery = {
      text:
      `SELECT p.id, p.name, u.username
      FROM playlists AS p
      JOIN users AS u
      ON p.owner = u.id
      WHERE p.id = $1`,
      values: [id],
    };
    const songQuery = {
      text: `
      SELECT s.id, s.title, s.performer
      FROM songs AS s
      JOIN playlist_songs AS ps
      ON ps.song_id = s.id
      WHERE ps.playlist_id = $1`,
      values: [id],
    };

    const playlist = await this._pool.query(playlistQuery);
    const songResult = await this._pool.query(songQuery);

    return {
      ...playlist.rows[0],
      songs: songResult.rows,
    };
  }

  async deletePlaylistSongBySongId(playlistId, { songId, userId }) {
    await this._songService.verifySongId(songId, 'Song', 'delete');

    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2',
      values: [playlistId, songId],
    };

    await this._pool.query(query);

    this.addPlaylistSongActivity(playlistId, { songId, userId, action: 'delete' });
  }

  async getPlaylistSongActivitiesById(id) {
    const query = {
      text: `
      SELECT u.username, s.title, psa.action, psa.time 
      FROM 
      playlist_song_activities AS psa,
      users AS u,
      songs AS s 
      WHERE psa.song_id = s.id 
      AND psa.user_id = u.id
      AND psa.playlist_id = $1
      ORDER BY psa.time`,
      values: [id],
    };

    const result = await this._pool.query(query);

    return {
      playlistId: id,
      activities: result.rows,
    };
  }

  async addPlaylistSongActivity(playlistId, {
    songId, userId, action,
  }) {
    const id = nanoid(16);
    const time = new Date().toISOString();

    const query = {
      text: 'INSERT INTO playlist_song_activities VALUES($1, $2, $3, $4, $5, $6)',
      values: [id, playlistId, songId, userId, action, time],
    };

    await this._pool.query(query);
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist not found');
    }

    const note = result.rows[0];

    if (note.owner !== owner) {
      throw new AuthorizationError('You are not authorized to access this resource');
    }
  }

  async verifyPlaylistAccess(id, user) {
    try {
      await this.verifyPlaylistOwner(id, user);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      try {
        await this._collaborationService.verifyCollaborator({ playlistId: id, userId: user });
      } catch {
        throw error;
      }
    }
  }
}

module.exports = PlaylistService;
