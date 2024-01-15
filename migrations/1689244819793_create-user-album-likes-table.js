/* eslint-disable max-len */

exports.up = (pgm) => {
  // membuat table user_album_likes
  pgm.createTable('user_album_likes', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    user_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    album_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
  });

  /*
      Menambahkan constraint UNIQUE, kombinasi dari kolom album_id dan user_id.
      Guna menghindari duplikasi data antara nilai keduanya.
    */
  pgm.addConstraint(
    'user_album_likes',
    'unique_album_id_and_user_id',
    'UNIQUE(album_id, user_id)',
  );

  // memberikan constraint foreign key pada kolom album_id dan user_id terhadap albums.id dan users.id
  pgm.addConstraint(
    'user_album_likes',
    'fk_user_album_likes.user_id_users.id',
    'FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE',
  );
  pgm.addConstraint(
    'user_album_likes',
    'fk_user_album_likes.album_id_albums.id',
    'FOREIGN KEY(album_id) REFERENCES albums(id) ON DELETE CASCADE',
  );
};

exports.down = (pgm) => {
  // menghapus tabel user_album_likes
  pgm.dropTable('user_album_likes');
};
