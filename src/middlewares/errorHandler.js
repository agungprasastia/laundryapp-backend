function errorHandler(err, req, res, _next) {
  console.error('Error:', err.message);

  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validasi gagal',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }

  if (err.name === 'MulterError') {
    const messages = {
      LIMIT_FILE_SIZE: 'Ukuran file terlalu besar (maks 5MB)',
      LIMIT_UNEXPECTED_FILE: 'Field upload tidak sesuai',
    };
    return res.status(400).json({
      error: messages[err.code] || 'Error upload file'
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Terjadi kesalahan server'
  });
}

module.exports = errorHandler;
