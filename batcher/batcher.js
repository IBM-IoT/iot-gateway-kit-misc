
module.exports = function(RED) {

  function Batcher( config )
  {
    RED.nodes.createNode( this, config );

    var self = this;
    this.batchAmount = parseInt( config.batchAmount );
    if( isNaN( this.batchAmount ) || this.batchAmount < 1 ) this.batchAmount = 100;

    this.messages = [];

    this.on( "input" , function( msg ) {

      self.messages.push( msg.payload );
      if( self.messages.length >= this.batchAmount )
      {
        var batch = this.messages;
        this.messages = [];
        self.send( {
          payload : batch
        } );
      }

    } );
  }

  RED.nodes.registerType( "batcher", Batcher );
};
