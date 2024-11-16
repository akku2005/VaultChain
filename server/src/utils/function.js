'use strict';
const getRawData = (data) => {
  return JSON.parse(JSON.stringify(data));
};

module.exports = {
  getRawData,
};
