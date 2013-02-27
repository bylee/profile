( function() {
	startYear= 2002;
	endYear= 2014;
	width= 900;
	margin= 0;
	axisY= 150;
	axisThickness= 3;
	axisGap= 10;
	rangeHeight= 30;
	rangeGap= 10;
	gap = ( width - 2 * margin - 2 * axisGap ) / ( endYear - startYear - 1 );
	

	
	calculate = function( date ) {
		if ( ! date ) {
			return null;
		}
		var index = date.indexOf( '.' );
		
		var year = ( index<0 )?date:date.substring( 0, index );
		var month = ( index<0 )?0:date.substring( index + 1 );
		var total = ( month / 12 ) + parseInt( year );
		return total;
	};
	
	Model = Backbone.Model.extend( {
		
	} );
	
	Collection = Backbone.Collection.extend( {
		
	} );
	
	View = Backbone.View.extend( {
		bindings:[],
		doms:[],
		bindTo: function( model, ev, callback )
		{
			model.bind( ev, callback, this );
			this.bindings.push( { model: model, ev: ev, callback: callback } );
		},
		
		unbindFromAll: function() {
			_.each( this.bindings, function( binding ) {
				binding.model.unbind( binding.ev, binding.callback );
			} );
		},
		
		render: function()
		{
			return this;
		},
		
		rect: function( x, y, w, h, r ) {
			var ret = this.paper.rect( x, y, w, h, r );
			this.doms.push( ret );
			return ret;
		},
		circle: function( x, y, r ) {
			var ret = this.paper.circle( x, y, r );
			this.doms.push( ret );
			return ret;
		},
		path: function( path ) {
			var ret = this.paper.path( path );
			this.doms.push( ret );
			return ret;
		},
		text: function( x, y, text ) {
			if ( !text ) {
				return ;
			}
			var ret = this.paper.text( x, y, text );
			this.doms.push( ret );
			return ret;
		},
		dispose: function() {
			this.unbindFromAll();
			this.unbind();
			this.remove();
			_.each( doms, function( dom ) { this.dom.remove(); }, this );
		}
	} );
	
	App = Model.extend( {
		
	} );
	
	AppView = View.extend( {
		
	} );
	
	Experience = Model.extend( {
		defaults: {
			color: '#eeeeee',
			height: 0,
			textY: 0
		}
	} );
	
	ExperienceView = View.extend( {
		initialize: function( opts ) {
			this.bindTo( this.model, 'destroy', this.dispose );
			_.extend( this, opts );
		},
		render: function() {
			var start = this.model.get( 'start' );
			var end = this.model.get( 'end' );
			var organization = this.model.get( 'organization' );
			
			var startP = margin + axisGap + gap * ( calculate( start ) - startYear - 1 );
			var endP = margin + axisGap + gap * ( calculate( end ) - startYear - 1 );

			var path = 
				"M" + startP + "," + axisY +
				"L" + ( startP + 5 - 2 * this.model.get( 'height' ) ) + "," + ( axisY - rangeHeight - rangeGap * this.model.get( 'height' ) ) +
				"H" + ( endP - 5 + 2 * this.model.get( 'height' ) ) +
				"L" + endP + "," + axisY +
				"Z";
			if ( startP < margin ) {
				path = 
					"M" + margin + "," + axisY +
					"V" + ( axisY - rangeHeight - rangeGap * this.model.get( 'height' ) ) +
					"H" + ( endP - 5 + 2 * this.model.get( 'height' ) ) +
					"L" + endP + "," + axisY +
					"Z";
			}
			
			var range = this.path( path );
			range.attr( 'fill', this.model.get( 'color' ) );
			
			// Tag
			var rangeTagX = ( Math.max( startP, margin ) + endP ) / 2;
			var rangeTagY = axisY - rangeHeight - rangeGap * this.model.get( 'height' );
			var rangeTagLength = 50 + 20 * this.model.get( 'textY' ) + rangeGap * this.model.get( 'height' );
			var textY = rangeTagY - rangeTagLength - 10;
			this.rect( rangeTagX, rangeTagY - rangeTagLength, 1, rangeTagLength );
			this.circle( rangeTagX, rangeTagY, 3 ).attr( 'fill', 'black' );
			
			var organization = this.text( rangeTagX, textY, this.model.get( 'organization' ) );
			
			if ( this.model.get( 'url' ) ) {
				var open = function() {
					window.open( this.model.get( 'url' ) );
				};
				
				range.attr( 'cursor', 'pointer' ).click( open, this );
				organization.attr( 'cursor', 'pointer' ).click( open, this );
				
			}
			

			return this;
		},
		dispose: function() {
			View.prototype.dispose.call( this );
			
		}
	} );
	
	Experiences = Collection.extend( {
		model: Experience,
	} );

	ExperiencesView = View.extend( {
		initialize: function( opts )
		{
			this.bindTo( this.collection, 'change', this.render );
			this.bindTo( this.collection, 'reset', this.reset );
			this.opts = opts;
			_.extend( this, opts );
			this.paper = new Raphael( this.el, width, 200 );
		},
		
		render: function()
		{
			// draw axis
			this.rect( margin, axisY, width - 2 * margin, axisThickness ).attr( 'fill', 'silvergray' );
			
			// draw year
			for ( var i = startYear, j = 0 ; i < endYear ; ++i, ++j ) {
				var point = margin + axisGap + j * gap;
				this.rect( point, axisY, 1, axisThickness + 6 );
				if ( i == startYear ) {
					continue;
				}
				$( 'tspan', this.text( point - gap / 2, axisY + axisThickness + 15, i ).node ).attr( 'dy', 0 );
			}
			
			// draw organization
			this.reset( this.collection );
			
			return this;
		},
		reset: function( collection )
		{
			collection.each( this.add, this );
		},
		add: function( model )
		{
			new ExperienceView( {
				parent: this,
				paper: this.paper,
				start: startYear,
				model: model
			} ).render();
		}
		
	} );
	
	ArchivementPoint = Model.extend( {
		defaults: {
			level: 1,
			direction: 'left'
		}
	} );
	
	ArchivementPointView = View.extend( {
		initialize: function( opts ) {
			this.opts = opts;
			_.extend( this, opts );
		},
		drawAnchor: function( x, y, level, right, text ) {
			
			this.path(
				'M' + x + "," + y +
				'T' + ( x + (right?1:-1) * 30 ) + ',' + ( y - 25 * level ) +
				'H' + ( x + (right?1:-1) * 110 )
			);
			this.text( x + (right?1:-1) * 70, y - 25 * level + ((0<level)?-10:10), text );
	
		},
		render: function() {
			var x = margin + axisGap + ( calculate( this.model.get( 'point' ) ) - startYear - 1 ) * gap;
			var y = 100 + 200 * this.index + ( (this.model.get( 'level' )<0 )?10:0 );

			this.drawAnchor(
					x,
					y,
					this.model.get( 'level' ),
					'right' == this.model.get( 'direction' ),
					this.model.get( 'title' )
			);
		}
	} );
	ArchivementPoints = Collection.extend( {
		model: ArchivementPoint
	} );
	ArchivementNode = Model.extend( {
		
	} );
	ArchivementNodeView = View.extend( {
		initialize: function( opts ) {
			_.extend( this, opts );
		},
		render: function() {
			var start = calculate( this.model.get( 'start' ) );
			var end = calculate( this.model.get( 'end' ) );
			var x = margin + axisGap + ( start - startYear - 1 ) * gap;
			var y = 100 + 200 * this.index;
			var w = ( end - start ) * gap;
			this.rect( x, y, w, 10 ).attr( 'fill', 'white' );
			if ( this.model.get( 'title') ) {
				this.text( x + w/2, y + (( this.model.get( 'titlelocation' ) == 'over' )?-10:20 ), this.model.get( 'title' ) )
				.attr( 'fill', 'red' ).attr( 'font-weight', 'bold' );
			}
			return this;
		}
	} );
	ArchivementNodes = Collection.extend( {
		
	} );
	Archivement = Model.extend( {
		parse: function( model ) {
			this.nodes = new ArchivementNodes( model.nodes );
			this.points = new ArchivementPoints( model.points );
			return model;
		}
	} );
	Archivements = Collection.extend( {
		model: Archivement,
	} );
	
	ArchivementView = View.extend( {
		initialize: function( opts ) {
			this.opts = opts;
			_.extend( this, opts );
			this.bindTo( this.model, 'change', this.render );
		},
		
		draHorizontalLine: function( x, y, length ) {
			this.path( 'M' + x + ',' + y + 'H' + ( x + length ) ).attr( 'stroke-dasharray', '--' );
		},
		
		render: function() {
			var x = margin + axisGap;
			var y = 105 + 200 * this.index;
			this.draHorizontalLine( x, y, width - 2 * margin );
			this.rect( x, 200 * this.index, 120, 20, 5 )
			.attr( 'stroke-width', '0' ).attr( 'fill', this.model.get( 'titlecolor') || 'green' );
			
			if ( this.model.get( 'title' ) ) {
				this.text( x + 60, 10 + 200 * this.index, this.model.get( 'title' ) )
				.attr( 'font-weight', 'bold' ).attr( 'font-size', 11 );
			}
			if ( this.model.nodes ) {
				this.model.nodes.each( function( node ) { new ArchivementNodeView( { model: node, paper: this.paper, index: this.index } ).render(); }, this );
			}
			if ( this.model.points ) {
				this.model.points.each( function( point ) { new ArchivementPointView( { model: point, paper: this.paper, index: this.index } ).render(); }, this );
			}
			
			return this;
		},
	} );
	ArchivementsView = View.extend( {
		initialize: function( opts ) {
			this.opts = opts;
			_.extend( this, opts );
			this.bindTo( this.collection, 'reset', this.reset );
			this.paper = new Raphael( this.el, width, 400 )

		},
		
		render: function() {
			this.reset( this.collection );
			return this;
		},
		
		reset: function( collection ) {
			collection.each( this.add, this );
		},
		
		add: function( model, index ) {
			new ArchivementView(
				{ model: model, paper: this.paper, index: index }
			).render();
		}
	} );
	
	Link = Model.extend( {} );
	
	Links = Collection.extend( {
		model: Link
	} );
	
	LinkView = View.extend( {
		tagName: 'a',
		className: 'link',
		initialize: function( opts ) {
			this.opts = opts;
			_.extend( this, opts );
			this.bindTo( this.model, 'destroy', this.dispose );
		},
		render: function() {
			this.$img = $( '<img></img>')
			this.$img.attr( 'src', this.model.get( 'icon' ) );
			this.$img.attr( 'width', 32 ).attr( 'height', 32 );
			this.$el.append( this.$img );
			this.$el.attr( 'href', this.model.get( 'url' ) );
			this.$el.attr( 'target', '_blank' );
			return this;
		}
	} );
	
	LinksView = View.extend( {
		initialize: function( opts ) {
			this.opts = opts;
			_.extend( this, opts );
			this.bindTo( this.collection, 'reset', this.reset );
			this.reset( this.collection );
		},
		
		render: function() {
			return this;
		},
		
		reset: function( collection ) {
			console.log( 'reset' );
			collection.each( this.add, this );
		},
		
		add: function( model, index ) {
			this.$el.append( new LinkView(
				{ model: model }
			).render().$el );
		}
		
	} );
	
	Profile = Model.extend( {
		url: function() {
			return this.get( 'user' ) + '/basic';
		}
	} );
	
	ProfileView = View.extend( {
		initialize: function( opts )
		{
			_.extend( this, opts );
			this.bindTo( this.model, 'change', this.render );
			this.$el.append( '<h1></h1>' );
			this.$el.append( '<h3 id="title"></h3>' );
			this.$el.append( '<div id="description"></div>' );
			this.$el.append( '<h2 id="exps">Experience summary</h2>' );
			this.model.fetch();
			
			var experience = new Experiences( {} );
			experience.url = this.model.get( 'user' ) + '/experience';
			experience.fetch();

			var archivement = new Archivements( {} );
			archivement.url = this.model.get( 'user' ) + '/archivement';
			archivement.fetch();
			
			this.expView = new ExperiencesView( {
				parent: this,
				collection: experience
			} );
			
			this.$el.append( '<h2 id="skills">Skills</h2>' );
			
			this.archView = new ArchivementsView( {
				parent: this,
				collection: archivement
			} );
			
		},
		render: function() {
			this.$( '#title' ).text( this.model.get( 'title' ) );
			this.$( '#description' ).text( this.model.get( 'description' ) );
			this.$( 'h1' ).text( this.model.get( 'name' ) );
			
			this.$( "h2#exps" ).after( this.expView.render().$el );
			this.$( "h2#skills" ).after( this.archView.render().$el );
			this.$( "h2#links" ).after( this.linkView.render().$el );
			
			return this;
		}
		
	} );
	
} )();
