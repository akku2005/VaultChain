// Global error handling
'use strict';
module.exports = (err, req, res, _) => {
  // Use _ for unused next
  res.status(500).json({ message: 'Internal Server Error' });
};
