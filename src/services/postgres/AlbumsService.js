const { Pool } = require('pg');
const { nanoid } = require('nanoid');

const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

const { mapDBToModelAlbum } = require('../../utils');
const SongsService = require('./SongsService');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = nanoid(16);

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3) RETURNING id',
      values: [`album-${id}`, name, year],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getAlbums() {
    const result = await this._pool.query('SELECT * FROM albums');
    return result.rows.map(mapDBToModelAlbum);
  }

  async getAlbumById(id) {
    const query = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    try {
      const songsService = new SongsService();
      const songsAlbum = await songsService.getSongsByAlbumId(id);
      const res = {
        ...result.rows.map(mapDBToModelAlbum)[0],
        songs: songsAlbum,
      };
      return res;
    } catch (err) {
      return mapDBToModelAlbum(result.rows[0]);
    }
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
  }

  async editAlbumCoverById(id, filename) {
    const query = {
      text: 'UPDATE albums SET cover = $1 WHERE id = $2 RETURNING id',
      values: [filename, id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }

  async addAlbumLike(id, userId) {
    const likeId = nanoid(16);

    const query = {
      text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id',
      values: [`albumLike-${likeId}`, userId, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Gagal menyukai album');
    }

    await this._cacheService.delete(`albumLikes:${id}`);
    return result.rows[0].id;
  }

  async verifyAlbumLike(id, userId) {
    const query = {
      text: `SELECT * FROM user_album_likes
      WHERE EXISTS (
        SELECT 1 FROM albums
        WHERE albums.id = user_album_likes.album_id AND albums.id = $1
      )
      AND EXISTS (
        SELECT 1 FROM users
        WHERE users.id = user_album_likes.user_id AND users.id = $2
      )`,
      values: [id, userId],
    };
    const result = await this._pool.query(query);

    if (result.rowCount > 0) {
      throw new InvariantError('User sudah menyukai album');
    }
  }

  async getAlbumLikes(id) {
    try {
      // mendapatkan Album likes dari cache
      const result = await this._cacheService.get(`albumLikes:${id}`);
      return {
        likes: JSON.parse(result),
        source: 'cache',
      };
    } catch (error) {
      const query = {
        text: 'SELECT * FROM user_album_likes WHERE album_id = $1',
        values: [id],
      };

      const result = await this._pool.query(query);

      // Jumlah album likes akan disimpan pada cache sebelum fungsi getAlbumLikes dikembalikan
      await this._cacheService.set(`albumLikes:${id}`, result.rowCount);

      return {
        likes: result.rowCount,
      };
    }
  }

  async deleteAlbumLikeById(id, userId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE album_id = $1 AND user_id = $2 RETURNING id',
      values: [id, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('User belum menyukai album');
    }

    await this._cacheService.delete(`albumLikes:${id}`);
  }
}

module.exports = AlbumsService;
