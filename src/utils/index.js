/* eslint-disable linebreak-style */
/* eslint-disable camelcase */

const mapDBToModelAlbum = ({
  id,
  name,
  year,
  cover,
}) => ({
  id,
  name,
  year,
  coverUrl: cover,
});

const mapDBToModelAlbums = ({
  id,
  name,
  year,
  songs,
}) => ({
  id,
  name,
  year,
  songs,
});

const mapDBToModelSong = ({
  id,
  title,
  performer,
}) => ({
  id,
  title,
  performer,
});

const mapDBToModelSongs = ({
  id,
  title,
  year,
  performer,
  genre,
  duration,
  albumId,
}) => ({
  id,
  title,
  year,
  performer,
  genre,
  duration,
  albumId,
});

module.exports = {
  mapDBToModelAlbum,
  mapDBToModelAlbums,
  mapDBToModelSong,
  mapDBToModelSongs,
};
