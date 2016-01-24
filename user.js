
var user = function (config, siteId, userSessionId) {
  this.phoneNo;
  this.lastActive = new Date().getTime();
  this.bfps = [];
  this.siteId = siteId;
  this.currentSessionId = userSessionId;
  //override values if users exists on the client cookie
  /*
    if (config){
    if (config._id){
      this._id = config._id;
    }
    if (config.phoneNo){
      this.phoneNo = config.phoneNo;
    }
    if (config.lastActive){
      this.lastActive = config.lastActive;
    }
  }
  */
};

user.prototype = {
  addFingerPrint : function(bfp){
    if (this.bfps.indexOf(bfp) < 0){
      this.bfps.push(bfp);
      this.bfp = bfp;
    }
  }
};

module.exports = user;
