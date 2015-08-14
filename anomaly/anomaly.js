
module.exports = function(RED) {

  function floatOrNull( v )
  {
    v = parseFloat( v );
    return isNaN( v ) ? null : v;
  }

  function Anomaly( config )
  {
    RED.nodes.createNode( this, config );

    var self = this;

    this.sampleCount = parseInt( config.sampleCount );
    if( !this.sampleCount ) this.sampleCount = 30;

    this.valueField = config.valueField;

    this.alertRate = config.alertRate;
    this.alertRateTimeout = null;

    if( this.alertRate === "interval" ) this.alertRateTimeout = floatOrNull( config.alertRateTimeout );
    if( this.alertRateTimeout === null ) this.alertRateTimeout = 1;
    this.alertRateTimeout *= 1000;

    this.okTimeoutDuration = floatOrNull( config.okTimeout );
    if( !this.okTimeoutDuration ) this.okTimeoutDuration = 5;
    this.okTimeoutDuration *= 1000;

    this.thresholdEnabled = config.threshold;
    this.averageEnabled = config.average;

    if( this.thresholdEnabled )
    {
      this.thresholdMin = floatOrNull( config.thresholdMin );
      this.thresholdMax = floatOrNull( config.thresholdMax );
    }

    if( this.averageEnabled )
    {
      this.averageBelow = floatOrNull( config.averageBelow );
      if( this.averageBelow !== null ) this.averageBelow = -this.averageBelow / 100.0;

      this.averageAbove = floatOrNull( config.averageAbove );
      if( this.averageAbove !== null ) this.averageAbove /= 100.0;
    }

    this.lastAlertTimestamp = 0;
    this.okTimeout = null;

    this.samples = [];

    this.average = 0;
    this.sampleSum = 0;

    this.on( "input" , function( msg ) {

      if( !msg.hasOwnProperty( "payload" ) ) return;

      if( !self.valueField )
      {
        v = msg.payload;
      }
      else
      {
        if( msg.payload.hasOwnProperty( self.valueField ) ) v = msg.payload[ self.valueField ];
        else
        {
          try
          {
            v = self.valueField.split( "." ).reduce( function( obj , i ) {
              return obj[i];
            } , msg.payload );
          }
          catch( e ) { v = undefined; }
        }
      }

      if( v === undefined ) return;

      if( typeof v === "string" )
      {
        v = parseFloat( v );
        if( isNaN( v ) ) return;
      }
      else if( typeof v !== "number" ) return;

      if( self.samples.length === self.sampleCount ) self.removeSample();

      var now = ( new Date() ).getTime();
      var generateAlerts = true;
      if( self.alertRate === "interval" && now - self.lastAlertTimestamp < self.alertRateTimeout ) generateAlerts = false;

      var alerts = self.addSample( v , generateAlerts );

      if( alerts.length > 0 )
      {
        self.lastAlertTimestamp = now;
        for( var i in alerts )
        {
          self.send( {
            payload: {
              alert: alerts[i],
              tstamp: now
            }
          } );
        }

        if( self.okTimeout !== null ) clearTimeout( self.okTimeout );
        self.okTimeout = setTimeout( self.okCallback.bind( self ) , self.okTimeoutDuration );
      }
    } );

    this.okCallback = function()
    {
      var now = ( new Date() ).getTime();
      this.send( {
        payload: {
          tstamp: now,
          alert: { type: "ok" }
        }
      } );
    };

    this.removeSample = function()
    {
      var v = this.samples.shift();

      this.sampleSum -= v;
    };

    this.addSample = function( v , generateAlerts )
    {
      var alerts = [];

      this.samples.push( v );
      this.sampleSum += v;

      if( generateAlerts )
      {
        if( this.thresholdEnabled )
        {
          if( this.thresholdMin !== null && v < this.thresholdMin )
          {
            alerts.push( {
              type : "threshold",
              value : v,
              threshold : this.thresholdMin
            } );
          }
          else if( this.thresholdMax !== null && v > this.thresholdMax )
          {
            alerts.push( {
              type : "threshold",
              value : v,
              threshold : this.thresholdMax
            } );
          }
        }

        if( this.averageEnabled && this.average !== 0 )
        {
          var devPercent = ( v - this.average ) / this.average;
          if( this.averageBelow !== null && devPercent < this.averageBelow )
          {
            alerts.push( {
              type : "average",
              average : this.average,
              deviation : devPercent,
              value : v
            } );
          }
          else if( this.averageAbove !== null && devPercent > this.averageAbove )
          {
            alerts.push( {
              type : "average",
              average : this.average,
              deviation : devPercent,
              value : v
            } );
          }
        }
      }

      this.average = this.sampleSum / this.samples.length;

      return alerts;
    };
  }

  RED.nodes.registerType( "anomaly", Anomaly );
};
