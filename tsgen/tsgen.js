
module.exports = function(RED) {

  function TSGen( config )
  {
    RED.nodes.createNode( this, config );

    var self = this;
    this.interval = parseInt( config.interval );
    if( isNaN( this.interval ) || this.interval < 1 ) this.interval = 1;

    this.genAmount = parseInt( config.genAmount );
    if( isNaN( this.genAmount ) || this.genAmount < 0 ) this.genAmount = 0;

    this.genCount = 0;

    this.updateInterval = setInterval( this.updateStatus.bind( this ) , 1000 );
    this.genInterval = setInterval( this.gen.bind( this ) , this.interval );

    this.on( "close" , function() {
      clearInterval( this.updateInterval );
      clearInterval( this.genInterval );
    } );
  }

  RED.nodes.registerType( "timeseries-gen", TSGen );

  TSGen.prototype.gen = function() {
    var now = ( new Date() ).getTime();
    this.genCount += this.genAmount;

    for( var i = 0; i < this.genAmount; i++ )
    {
      this.send( { payload: {
        id : 1,
        tstamp : { $date : now },
        json_data : { value : Math.floor( Math.random() * 100 ) }
      } } );
    }
  };

  TSGen.prototype.updateStatus = function() {
    this.status( {
      fill : "green",
      shape : "dot",
      text : "Rate: " + this.genCount + "/s"
    } );

    this.genCount = 0;
  };
};
