
module.exports = function(RED) {

  function FlowSensor( config )
  {
    RED.nodes.createNode( this, config );

    var self = this;
    this.config = config;

    this.msgCount = 0;

    this.on( "input" , function( msg ) {
      this.msgCount++;
      this.send( msg );
    } );

    this.on( "close" , function() {
      clearInterval( this.tickInterval );
    } );

    this.tickInterval = setInterval( this.tick.bind( this ) , 1000 );
  }

  RED.nodes.registerType( "flow-sensor", FlowSensor );

  FlowSensor.prototype.tick = function()
  {
    this.status( {
      fill : "green",
      shape : "dot",
      text : "Rate: " + this.msgCount + "/s"
    } );

    this.msgCount = 0;
  };
};
