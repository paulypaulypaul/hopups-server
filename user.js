var user = function (config, siteId, userSessionId) {
  this.phoneNo;
  this.lastActive = new Date().getTime();
  this.bfps = [];
  this.siteId = siteId;
  this.currentSessionId = userSessionId;
};

module.exports = user;
