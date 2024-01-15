const { Pool } = require('pg');
const { nanoid } = require('nanoid');

const { mapDBToModelSong, mapDBToModelSongs } = require('../../utils');

const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class SongsService {
  constructor() {
    this._pool = new Pool();
  }

  async addSong({
    title, year, performer, genre, duration, albumId,
  }) {
    const id = nanoid(16);

    const query = {
      text: 'INSERT INTO songs VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      values: [`song-${id}`, title, year, performer, genre, duration, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Lagu gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getSongs(title = '', performer = '') {
    const query = {
      text: 'SELECT * FROM songs WHERE',
      values: [],
    };

    if (performer || title) {
      if (title) {
        query.text += ' title ILIKE $1';
        query.values.push(`%${title}%`);
      }

      if (performer) {
        if (title) {
          query.text += ' AND';
        }
        query.text += ` performer ILIKE $${query.values.length + 1}`;
        query.values.push(`%${performer}%`);
      }

      const result = await this._pool.query(query);
      return result.rows.map(mapDBToModelSong);
    }

    const result = await this._pool.query('SELECT * FROM songs');
    return result.rows.map(mapDBToModelSong);
  }

  async getSongById(id) {
    const query = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }

    return mapDBToModelSongs(result.rows[0]);
  }

  async getSongsByAlbumId(id) {
    const query = {
      text: `SELECT * FROM songs
      LEFT JOIN albums ON albums.id = songs.albumid
      WHERE songs.albumid = $1`,
      values: [id],
    };

    const result = await this._pool.query(query);
    return result.rows.map(mapDBToModelSong);
  }

  async editSongById(id, {
    title, year, performer, genre, duration, albumId,
  }) {
    const query = {
      text: 'UPDATE songs SET title = $1, year = $2, performer = $3, genre = $4, duration = $5, albumid = $6 WHERE id = $7 RETURNING id',
      values: [title, year, performer, genre, duration, albumId, id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal memperbarui lagu. Id tidak ditemukan');
    }
  }

  async deleteSongById(id) {
    const query = {
      text: 'DELETE FROM songs WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Lagu gagal dihapus. Id tidak ditemukan');
    }
  }
}

module.exports = SongsService;
