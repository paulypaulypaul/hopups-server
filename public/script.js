
    //obs need to be able to specify in config the name of this
    if (typeof  clientVariable === "undefined"){
      clientVariable = {};
    }

    var SessionData = function() {
      this.name = 'hopups_user';
      this.data;
    }
    SessionData.prototype = {
      get: function(){
        if (!this.data[this.name]){
          this.data[this.name] = {};
        }
        return this.data[name];
      },
      set: function(value){
        this.data[this.name] = value;
      },
      getFromSession: function(){
        if (localStorage[this.name] && localStorage[this.name] !== 'undefined'){
          this.data = JSON.parse(localStorage[this.name]);
        } else {
          this.data = {};
        }
      },
      persistToSession: function(){
        localStorage[this.name] = JSON.stringify(this.data);
      },
      getTags: function(){
        if (!this.data.sessionData){
          this.data.sessionData = {};
          if (!this.data.sessionData.tags){
            this.data.sessionData.tags = {};
          }
        }
        return this.data.sessionData.tags;
      },
      setTags: function(value){
        if (!this.data.sessionData){
          this.data.sessionData = {};
        }
        return this.data.sessionData.tags = value;
      },
      getBfp: function(){
        return this.data.bfp;
      },
      setBfp: function(value){
        return this.data.bfp = value;
      },
      getLastActive: function(){
        return this.data.lastActive;
      },
      setLastActive: function(value){
        return this.data.lastActive = value;
      }
    }

  var ClientApp = function(config){
    this._siteId = config.siteId;
    this._domain = config.domain;

    this._config = {};

    this._actionsessiondata = this.getUrlParam('actionsessiondata');
    this._action = this.getUrlParam('action');

    this.fetchAndwireConfig();

  }
  ClientApp.prototype = {
    _dataQ : [],
    _eventQ : null,
    _registeredInitialPageView: false,
    getUrlParam: function(name){
      var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
      if (results){
        return results[1] || 0;
      }
      return 0;
    },
    getQueryString: function(){
      return window.location.href.split('?')[1];
    },
    getLocation: function(){
      return window.location.pathname;
    },
    fetchAndwireConfig: function(){
      var self = this;
      $.ajax({
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        type: "GET",
        url: "http://" + this._domain + "/api/widget/" + this._siteId + "/config",
      })
      .done(function(response) {
        self._config.events = response;
        self.wireEvents();
        self.startSync();
      })
      .always(function(config) {
      });
    },
    wireEvents: function(){
      var config = this._config;
      var events = config.events;

      //if this page is loaded from an action - an iframe with an action instance url parameter
      //we look at the action to determine the events which need to be added to the page
      if (this._action){
        for (var i = 0; i < this._action.events.length; i++){
          //add the parent session instance to the event so when it if sent to the server
          //it can be matched to an action instance
          this._action.events[i].parent = this._actionsessiondata;

          //augment selector with action id if we are adding html - not the replace pathway
          if (this._action.responsetype !== "html-replace"){
            this._action.events[i].selector = this._action.events[i].selector + '-' + this._action._id;
          }

          if (this.pageMatch(this._action.events[i])){
            this.addEvent(this._action.events[i])
          }
        }
      } else {
        for (var i = 0; i < events.length; i++){
          if (this.pageMatch(events[i])){
              this.addEvent(events[i])
          }
        }
      }
    //number family by Georgina Harland
    //7+6=13 13-7=6
    //6+7=13 13-6=7
  },
  addEvent: function(itemToWire){
      var self = this;
      $(itemToWire.selector).each(function() {
          $(this)
          .off('.hopup')
          .on(itemToWire.event + '.hopup', function(event, eventItem) {

            var item = itemToWire;
            var type = 'event';

            //if we fire this from our created event we get the item as a parameter
            if (eventItem){
              //simple way to identify action fired - need to change
              if (eventItem.type === 'and'){
                type = 'action';
              }
              item = eventItem;
            }

            var dataFrom;
            if(item.dataFrom){
               dataFrom =  $(this).find(item.dataFrom).text();
            }

            var data = {
              userId : sessionData.data._id,
              event : item,
              context: {
                parent: item.parent,
                dataFrom : dataFrom,
                location: location.pathname,
                userAgent: navigator.userAgent
              }
            };

            self._dataQ.push(data);

            //if link we want to pause navigation untill we have registered the view
            if ($(this).attr('href') && $(this).attr('href') != ''){

              var originalEvent = this;
              self.sync(function(){
                if (originalEvent.href.indexOf('#') < 0){
                  window.location = $(originalEvent).attr('href');
                }
              })

              event.preventDefault();
              event.stopPropagation();
            }

          });
      });
    },
    pathname : null,
    getPathname: function(){
      if (!this.pathname && this.pathname != ''){
        this.pathname = window.location.pathname;
        if (this.pathname.charAt(0) == "/"){
          this.pathname = this.pathname.substr(1);
        }
      }
      return this.pathname;
    },
    pageMatch: function(item){
        var pathname = this.getPathname();

        var page = item.page;
        if (!page){
          return false;
        }
        if (page.charAt(0) == "/"){
          page = page.substr(1);
        }
        if (page == pathname || page == '*' ){
            return true
        }
        var re = new RegExp(page)
        if (pathname.match(re)){
          return true;
        }
        return false;
    },
    startSync : function(){
      setInterval(function (self) {
        self.sync(self.syncCallback);
      }, 3000, this);
    },
    _syncing : false,
    sync: function(callback){
      if (this._syncing) return;
      this._syncing = true;

      var self = this;

      //copy and reset the current dataQ
      var currentDataQ = this._dataQ.concat();
      this._dataQ = [];

      var data = {
        userId: 'none',
        siteId: self._siteId,
        dataQ: currentDataQ,
        queryString: self.getQueryString(),
        location: self.getLocation(),
        clientVariable: clientVariable || {},
        InitialPageView: !self._registeredInitialPageView,
        completedActions: self.completedActions
      }

      if (sessionData.data){
        data.userId = sessionData.data._id;
      }

      $.ajax({
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        type: "POST",
        url: "http://" + this._domain + "/api/sync/",
        data: JSON.stringify(data)
      }).done(function(response) {
        self._syncing = false;
        callback(response, self);
      })
      .fail(function() {
        //we had an error - try again;
        self._syncing = false;
        console.log( "error" );
      })
      .always(function() {
        console.log( "complete" );
      });
    },
    syncCallback: function(response, self){
      var self = self;

      var user = response.user;
      var actions = response.actions;

      sessionData.data = user;
      sessionData.persistToSession();

      console.log(user._id);
      console.log(user.phoneNo);

      if (!self._registeredInitialPageView){
        //a custom event we add to register the initial page load
        $( "body" ).trigger( "initialpageload" );

        if (ga){
          ga('set', 'dimension1', user._id);
          ga('send', 'pageview');
        }

        self._registeredInitialPageView = true;
      }

      self.actionActions(actions);
      self.updatePhoneNumber(user.phoneNo);

      //set local session data to now - this will get overwritten when the server version comes down
      sessionData.setLastActive(new Date().getTime())
    },
    updatePhoneNumber: function(number, divLocator){
      if (divLocator){
        $(divLocator).html(number);
      } else {
        //will remove these just for testing until the div specifier is built
        $('li.last-menu').html(number);
        $('#small-links-list').html(number);
        $('#phoneNo').html(number);
      }
    },
    completedActions : [],
    actionActions: function(actions){
      //these are the events we get back from the server - the will be action immidiatly
      //mabee we could send down event to soon be required to they are there immidiatly - hmmmmm.
      for (var i = 0; i < actions.length; i++){

        //checks if the action has already been applied to the page before it
        //adds it again - but the server still sends it down so we need to send
        //completedActions to the server to prevent firing in the first place
        if (this.completedActions.indexOf(actions[i]._id) < 0){
          this.completedActions.push(actions[i]._id);

          if (actions[i].responsetype === 'html'){
            this.attachHTML(actions[i]);
            $( "body" ).trigger( "eventfired", [actions[i]] );

          } else if (actions[i].responsetype === 'html-replace'){
            this.replaceHTML(actions[i]);
            $( "body" ).trigger( "eventfired", [actions[i]] );

          } else if (actions[i].responsetype === 'template'){
            var justTextModal = nanoModal('<iframe src="' + actions[i].responsedatalocation + '" width="500" height="400" frameBorder="0"></iframe>');
            //var justTextModal = nanoModal('<iframe src="' + actions[i].responsedatalocation + '?action=' + actions[i].payload.action + '&actionsessiondata=' + actions[i].payload.actionsessiondata + '" width="500" height="400" frameBorder="0"></iframe>');
            justTextModal.show();
            $( "body" ).trigger( "eventfired", [actions[i]] );
          }

        }

      }
    },
    attachHTML: function(item){
      var self = this;

      //here we set the _actionsessiondata and _action values from the item
      //so that when we are attaching events to the new code we have added
      //we know we are in action firing mode!
      this._actionsessiondata = item.payload.actionsessiondata;
      this._action = item;

      if (item.responsedatafrom === 'code' || item.responsedatafrom === 'predefined'){
        $('body').append(item.responsedata);
        //add any events to the new html weve added

        //for events attached as tags
        var itemToWire = {
          selector : '[data-hopups-click]',
          event : 'click',
          parent : item.payload.actionsessiondata
        };

        self.wireEvents(itemToWire);

        //$('[data-hopups-click]')

        //for events attached as normal in the ui
        //for (var j = 0; j < item.actionEvents.length; j++){
        //  wireEvents(item.actionEvents[j]);
        //}

      } else if (item.responsedatafrom === 'uri'){

        $.get( item.responsedatalocation , function( data ) {
          $('body').append(data);
          //add any events to the new html weve added
          self.wireEvents();

        });
      }
    },
    replaceHTML: function(item){
      var self = this;

      //here we set the _actionsessiondata and _action values from the item
      //so that when we are attaching events to the new code we have added
      //we know we are in action firing mode!
      this._actionsessiondata = item.payload.actionsessiondata;
      this._action = item;

      if (item.responsedatafrom === 'code' || item.responsedatafrom === 'predefined'){
        $(item.elementtoreplace).replaceWith(item.responsedata);
        //add any events to the new html weve added

        //for events attached as tags
        var itemToWire = {
          selector : '[data-hopups-click]',
          event : 'click',
          parent : item.payload.actionsessiondata
        };

        self.wireEvents(itemToWire);

        //$('[data-hopups-click]')

        //for events attached as normal in the ui
        //for (var j = 0; j < item.actionEvents.length; j++){
        //  wireEvents(item.actionEvents[j]);
        //}

      } else if (item.responsedatafrom === 'uri'){

        $.get( item.responsedatalocation , function( data ) {
          $(item.elementtoreplace).replaceWith(data);
          //add any events to the new html weve added
          self.wireEvents();

        });
      }
    }
  }

  var clientApp;
  var sessionData;
  var start = function(){

    clientApp = new ClientApp([%CONFIG%]);

    sessionData = new SessionData();
    sessionData.getFromSession();
    sessionData.data.lastActive = new Date().getTime();

    new Fingerprint2().get(function(result){
      sessionData.setBfp(result);
      sessionData.persistToSession();
    });

  }


//load jquery if its not here
if (typeof jQuery == 'undefined') {

	function getScript(url, success) {
		var script     = document.createElement('script');
		script.src = url;
		var head = document.getElementsByTagName('head')[0],
		done = false;
		// Attach handlers for all browsers
		script.onload = script.onreadystatechange = function() {
			if (!done && (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete')) {
			done = true;
				// callback function provided as param
				success();
				script.onload = script.onreadystatechange = null;
				head.removeChild(script);
			};
		};
		head.appendChild(script);
	};

	getScript('https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js', function() {
    start();
  });
} else {
  start();
};
