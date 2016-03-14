var user = function (config, siteId, userSessionId) {
  this.phoneNo;
  this.lastActive = new Date().getTime();
  this.bfps = [];
  this.siteId = siteId;
  this.currentSession = userSessionId;
};

module.exports = user;
