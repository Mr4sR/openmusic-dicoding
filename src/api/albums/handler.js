const autoBind = require('auto-bind');

class AlbumsHandler {
  constructor(service, validator, storageService) {
    this._service = service;
    this._validator = validator;
    this._storageService = storageService;

    autoBind(this);
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { id, name = 'untitled', year } = request.payload;

    const albumId = await this._service.addAlbum({ id, name, year });

    const response = h.response({
      status: 'success',
      message: 'Album berhasil ditambahkan',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumsHandler() {
    const albums = await this._service.getAlbums();
    return {
      status: 'success',
      data: {
        albums,
      },
    };
  }

  async getAlbumByIdHandler(request) {
    const { id } = request.params;
    const album = await this._service.getAlbumById(id);
    return {
      status: 'success',
      data: {
        album,
      },
    };
  }

  async putAlbumByIdHandler(request) {
    this._validator.validateAlbumPayload(request.payload);
    const { name, year } = request.payload;
    const { id } = request.params;

    await this._service.editAlbumById(id, { name, year });

    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;
    await this._service.deleteAlbumById(id);

    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }

  async postUploadImageHandler(request, h) {
    const data = request.payload.cover;
    const { id } = request.params;

    this._validator.validateImageHeaders(data.hapi.headers);

    const filename = await this._storageService.writeFile(data, data.hapi);
    await this._service.editAlbumCoverById(id, `http://${process.env.HOST}:${process.env.PORT}/uploads/images/${filename}`);

    const response = h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
    });
    response.code(201);
    return response;
  }

  async addAlbumLikesHandler(request, h) {
    const { id: userId } = request.auth.credentials;
    const { id } = request.params;

    await this._service.getAlbumById(id);
    await this._service.verifyAlbumLike(id, userId);
    const albumId = await this._service.addAlbumLike(id, userId);

    const response = h.response({
      status: 'success',
      message: 'Berhasil menyukai album',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumLikesHandler(request, h) {
    const { id } = request.params;
    const { likes, source } = await this._service.getAlbumLikes(id);
    const response = h.response({
      status: 'success',
      data: {
        likes,
      },
    });

    if (source) response.header('X-Data-Source', 'cache');
    response.code(200);
    return response;
  }

  async deleteAlbumLikeHandler(request) {
    const { id: userId } = request.auth.credentials;
    const { id } = request.params;

    await this._service.deleteAlbumLikeById(id, userId);
    return {
      status: 'success',
      message: 'Like berhasil dihapus dari album',
    };
  }
}

module.exports = AlbumsHandler;
