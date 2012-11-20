/**
 * 
 */

(function() {

	//Variables for force-based graph
	var w, h, force, nodes, links;
	var linkContainter, nodeContainer, labelContainter; 
	
	//Settings for the bottom dendrogram tree:
	var treeHeight = 100,
	    treeSideMargins = 50,
	    treeBottomMargin = 10;

	//Link type constants
	/** @const */ var IS_A_LINK = "is_a";
	/** @const */ var CROSSLINK = "crossLink";

	// Node type constants
	/** @const */ var CROSSLINK_TARGET = "crosslinkTarget";
	/** @const */ var CROSSLINK_SOURCE = "crosslinkSource";

	// Variables for dendrogram
	var cluster, treeVis, diagonal;
	
	termviz = function(settings){

	if (!settings) {
		// Set sume defaults if settings were not provided
		settings = {
				visualizationDomContainerSelector: '#graphBox' ,	
				distance: {
				default: 50,
				doi: {use: true, multiplicator: 10}
				},
				charge: {
				default: -200,
				doi: {use: true, multiplicator: -300}
				},
				friction: 0.85, // 1=no friction, 0=nothing moves (glued stuck)
				gravity: 0.05,
				linkStrength: {
					is_a: 1,
					crossLink: 0.1,
				default: 0.5
				}
		};
	}

	var targetElement = d3.select(settings.visualizationDomContainerSelector);
	w = parseInt(targetElement.style("width") , 10); // Parsing w/ radix 10. Removes the css 'px' suffix
	h = parseInt(targetElement.style("height"), 10);

	if (w < 5 || h < 5) alert("The DOM node selected by the expression "+settings.visualizationDomContainerSelector+" has a size of less than 5x5 pixels. Please make it bigger using e.g CSS style properties)");

	var vis = targetElement.append("svg:svg")
	.attr("id", "mainVis")
	.attr("width", w)
	.attr("height", h);

	console.log("targetElement,w,h:",targetElement,w,h)


//	TODO: Perhaps try collosion detection later, see view-source:http://mbostock.github.com/d3/talk/20110921/collision.html?1352276129034
	force = d3.layout.force()
	.gravity(settings.gravity)
	.distance(
			function(d, i){
				if (d.hoover_doi && d.hoover_doi > 0 && settings.distance.doi.use) {
					var newDist = settings.distance.default + (d.hoover_doi*settings.distance.doi.multiplicator);
					//console.log("Distance ", d , i, " with ", newDist); 
					return newDist;
				} else {
					return settings.distance.default;	
				}
			}
	) // End of .distance (originally was 50) 
	.charge(
			function(d, i){
				// console.log("Charge: ", d , i, this, d.active); 
				if (d.hoover_doi && d.hoover_doi > 0 && settings.charge.doi.use) {
					var newCharge = settings.charge.default + (d.hoover_doi*settings.charge.doi.multiplicator);
					//console.log("Charge node ", d , i, " with ", newCharge); 
					return newCharge;
				} else {
					//console.log("Charge normalized: ", d , i, this, d.hoover_doi);
					return -200;	
				}
			}		
	) // End of .charge (was originally -100)
	.size([w, h])
	.linkStrength(function(d, i){
		var strength = settings.linkStrength[d.type]
		if (!strength) strength = settings.linkStrength["default"]
		//console.log(d.type, " -strength- ", strength)
		return strength;
	})
	.friction(settings.friction);

	nodes = force.nodes();
	links = force.links();

	linkContainter = vis.append("svg:g").attr("id", "linkContainter");

	nodeContainer = vis.append("svg:g").attr("id", "nodeContainer"); 

	labelContainter = vis.append("svg:g").attr("id", "labelContainter"); 


//	Define and name some reusable markers for arrow-formed ends
//	See http://www.w3.org/TR/SVG/painting.html#Markers for info
//	Also see http://bl.ocks.org/1153292 and https://groups.google.com/forum/?fromgroups=#!topic/d3-js/6QEenzf1fdI 
	var defs = vis.append("svg:defs")

	defs.append("svg:marker")
	.attr("id", IS_A_LINK) // IS-A links
	.attr("viewBox", "0 -5 10 10")
	.attr("refX", 20) // Adjusts how far from the target center the sharp arrowend will be
	.attr("refY", 0)
	.attr("markerWidth", 6)
	.attr("markerHeight", 6)
	.attr("orient", "auto")
	.append("svg:path")
	.attr("d", "M0,-5L10,0L0,5,Z") // Draw a triangle


	defs.append("svg:marker")
	.attr("id", "other")
	.attr("viewBox", "0 -5 10 10")
	.attr("refX", 20) // Adjusts how far from the target center the sharp arrowend will be
	.attr("refY", 0)
	.attr("markerWidth", 6)
	.attr("markerHeight", 6)
	.attr("orient", "auto")
	.append("svg:path")
	.attr("d", "M0,-5L10,0L0,5")


	/*
<svg id="mainVis" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" >
<defs>
	  <style>
	  </style>
	  <filter id="contour">
	    <feMorphology in="SourceAlpha" operator="dilate" radius="2"/>
	    <feComposite in="SourceGraphic"/>
	  </filter>
 <filter id="dropshadow" height="130%">
    <feColorMatrix in = "SourceGraphic"  result = "matrixOut"  type = "matrix" values = "0.8 0 0 0 0   0 0 0 0 0   0 0 0.2 0 0   0 0 0 1 0"/>   
    <feGaussianBlur in="matrixOut" stdDeviation="3"/> 
    <feOffset dx="0" dy="0" result="offsetblur"/> 
    <feMerge> 
      <feMergeNode/>
      <feMergeNode in="SourceGraphic"/> 
    </feMerge>
  </filter>
</defs>
</svg>
	 */

	force.on("tick", function() {
		// Move all nodes on each tick...	
		vis.selectAll("g.node")
		.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

		// ...and move node texts...
		vis.selectAll("g.label")
		.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

		// ...and repaint force-layout links
		vis.selectAll("line.link")
		.attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; });
	}); // End force.on("tick"...

	return vis;

} // End of termviz initialization

// Make some variables reachable	
termviz.nodes = function(){return nodes};
termviz.links = function(){return links};

	
termviz.clear =	function(){	  
		  nodes.length = 0;
		  links.length = 0;
		  termviz.restart();
	}

	function findTopNodes(nodes) {
		var topNodes = []
		for (var i = 0; i < nodes.length; i++) {
			if ((nodes[i].outgoing === undefined || nodes[i].outgoing.length == 0) && nodes[i].tvizType!="crosslink") topNodes.push(nodes[i]);
		}
		return topNodes;
	};
	

//var linkArray
//var assignNodeDomClass  // Used for seting DOM class
//var neigbourAttributeName // Used to pick nodes from the right end of links
//var state // boolean indicating if we are turning on or off the flag and class
function processLinkArray(state, linkArray,  neigbourAttributeName, assignNodeDomClass, assignLinkDomClass){
	// ...and add the class assignNodeDomClass to links and nodes
	for (var linkIndex = 0; linkIndex < linkArray.length; linkIndex++) {
		// var neighbourNodeClassSelector = ".L"+linkArray[linkIndex][neigbourAttributeName].id+"";
		// var neighbourNode = d3.selectAll(neighbourNodeClassSelector);
		var neighbourNode = findDomNodeBasedOnData(linkArray[linkIndex][neigbourAttributeName], d3.selectAll("g.node"));
		var neighbourNodeLabel = findDomNodeBasedOnData(linkArray[linkIndex][neigbourAttributeName], d3.selectAll("#labelContainter g"));
		//console.log("neighbourNode", neighbourNode);
		if(assignLinkDomClass){
			var neighbourLink = findDomNodeBasedOnData(linkArray[linkIndex], d3.selectAll(".link"));
			neighbourLink.classed(assignLinkDomClass, state);			
		}
		//console.log("neighbourLink:", neighbourLink, linkArray[linkIndex]);
		if (neighbourNode) {
			neighbourNode.classed(assignNodeDomClass, state);
			neighbourNodeLabel.classed(assignNodeDomClass, state);
			if (state) {
				linkArray[linkIndex][neigbourAttributeName].hoover_doi=1; // Set doi on node
				linkArray[linkIndex].hoover_doi=1; // Set doi on link				
			} else {
				linkArray[linkIndex][neigbourAttributeName].hoover_doi=0;
				linkArray[linkIndex].hoover_doi=0; // Set doi on link
			}
		}
		// console.log([assignNodeDomClass+"["+linkIndex+"]: ", linkArray[linkIndex][neigbourAttributeName].name, neighbourNodeClassSelector, neighbourNode]);
	} // End for
} // End processNeighbours	  	


function setActiveStates(currentNode, data, state) {
	if (state) {
		data.hoover_doi=3;
	} else {
		data.hoover_doi=0;
	}

	d3.select(currentNode).classed("active", state);  // Add the class "assignNodeDomClass" to this node... 

	// Don't forget the separate label objects: add the class "active" to this node's label object...
	var labelOfActive = vis.selectAll(".L"+data.id);
	if (labelOfActive) labelOfActive.classed("active", state)

	processLinkArray(state, data.incoming, "source", "active-incoming", "active-incoming");
	processLinkArray(state, data.outgoing, "target", "active-outgoing", "active-outgoing");

	// Restart the force so that changed force parameters etc take effect
	force.start();
}

function setActiveStatesOfLink(domNode, data, state){
	// TODO: Activate text labels too
	d3.select(domNode).classed("active", state);
	var sourceNode = findDomNodeBasedOnData(data.source, d3.selectAll("g.node"));
	sourceNode.classed("active-incoming", state);
	var targetNode = findDomNodeBasedOnData(data.target, d3.selectAll("g.node"));
	targetNode.classed("active-outgoing", state);
}

termviz.restart = function(){

	// TODO: Consider if we should call force.stop() here?	 

	// *** Links ***

	var link = linkContainter.selectAll("line.link")
	.data(links, function(d) { return d.source.id + "-" + d.target.id; });

	link.enter().insert("svg:line", "g.node")
	.attr("class", function(d) { return "link "+d.type; })
	.attr("marker-end", function(d) { return "url(#" + d.type + ")"; }) // Add arrow to end of line, see svg:defs above 
	.on("mouseover", function(data, index){
		setActiveStatesOfLink(this, data, true);
	}) 
	.on("mouseout", function(data, index){
		setActiveStatesOfLink(this, data, false);
	})

	link.exit().remove();    

	// *** Nodes ***
	var node = nodeContainer.selectAll("g.node")
	.data(nodes, function(d) { return d.id;});

	var nodeEnter = node.enter().append("svg:g")
	.attr("id", function(data, index){return "node_"+data.id})
	.on("click", function(data, index){
		console.log("Clicked node data:",data," index:",index," this:", this);
		d3.select(this).classed("active", true);
		if(data.type != CROSSLINK_SOURCE){
			// Toggle state of data fixed
			data.fixed=!data.fixed; 
			d3.select(this).classed("fixed", data.fixed); // Set/reset node class fixed
			var labelOfFixed = vis.selectAll(".L"+data.id);
			labelOfFixed.classed("fixed", data.fixed); // Set/reset node class fixed			   
		}
		force.resume() //Raise force based simulation temperature in order to let go of recently unfixed nodes
	})
	.on("mouseover", function(data, index){
		setActiveStates(this, data, true);
	}) 
	.on("mouseout", function(data, index){
		setActiveStates(this, data, false);
	})
	.call(force.drag);

	nodeEnter.append("circle")
	.attr("r", 12)
	.classed("nodeCircle", true);

	// Update/default for all nodes (both new and already existing ones)
	node.attr("class", function(d){return d.type==null ?  "node" : "node "+d.type })

	node.exit().remove(); // TODO: Adjust other nodes that have incoming and outgoing links listed to/from this node 

	// SVG does not seem to support Z-ordered layers, so we make a sperate node selection
	// to add text labels _after_ all the circles have been drawn. We also add a white 
	// semitransparent "shadow" text to make lables more readable.
	// More info, see: http://bl.ocks.org/1153292 and http://stackoverflow.com/questions/11102795/d3-node-labeling 

	var text = labelContainter
		.selectAll("g.label")
		.data(force.nodes())

	var enteringText = text.enter().append("svg:g")
	//.attr("class", function(data, index){return "label L"+data.id+(data.type ? " "+data.type : "")})
	.attr("id", function(data, index){return "label_"+data.id})

	// If the string is longer than breakIfLongerThan then break the line at the first space after the middle of the string.  
	var breakIfLongerThan = 10; // Allow one-line multi-word labels with maximum 10 charachters    

	enteringText.each(function(d, i){
		if(d.name){
			var currentDomNode = d3.select(this);
			var incomingText = d.name;
			var firstHalf = d.name;
			var secondHalf = null;
			var breakIt = (incomingText.length > breakIfLongerThan);
			if (breakIt) {
				var splitAt = incomingText.indexOf(" ", incomingText.length/2); // Find first space after middle
				if (splitAt < 0) splitAt = incomingText.lastIndexOf(" "); // Backup plan: if there was no space after the middle, then break at the last space
				if (splitAt < 0 ) splitAt = incomingText.length/2; // If there was no space at all, then split in half
				firstHalf = incomingText.substring(0, splitAt);
				secondHalf = incomingText.substring(splitAt, incomingText.length);    
			}
			// console.log(" ----------> ", breakIt, incomingText, incomingText.length, " > ", breakIfLongerThan, " ---> ", firstHalf, " || ", secondHalf);
			currentDomNode.append("svg:text").text(firstHalf).attr("class", "labelText shadow"); // First draw a "shadow" copy of the text with a thick white stroke for legibility.
			currentDomNode.append("svg:text").text(firstHalf).attr("class", "labelText"); // ...then on top of that draw the visible text itself

			// TODO: add this downwards correction if single !secondHalf
			//  .attr("y", ".31em")

			//  .attr("x", 8) // Get closer to center of circle

			// or EVEN BETTER: move all this to css and add class indicating labelSolo, labelFirst, labelSecond

			if(secondHalf) currentDomNode.append("svg:text").text(secondHalf).attr('dy', '.9em').attr('text-anchor', 'middle').attr("class", "labelText shadow");
			if(secondHalf) currentDomNode.append("svg:text").text(secondHalf).attr('dy', '.9em').attr('text-anchor', 'middle').attr("class", "labelText");        	
		}
	});

	enteringText.attr("measure", function(data){
		var tw = this.getBBox().width;
		data.tw = tw;
		return tw;
	});    	

	//??? Update/default for all nodes (both new and already existing ones)
	text.attr("class", function(data, index){return "label L"+data.id+(data.type ? " "+data.type : "")})

	text.exit().remove(); // TODO: check if this is really needed...

	var spread = 50; // x-axis distance between fixed top/root nodes
	var topNodes=findTopNodes(nodes);
	for (var t = 0; t < topNodes.length; t++) {
		topNodes[t].fixed=true;
		fixedNode = d3.select(document.getElementById(topNodes[t].id));
		fixedNode.classed("fixed", true); // Set/reset node class fixed
		var labelOfFixed = vis.selectAll(".L"+topNodes[t].id);
		labelOfFixed.classed("fixed", true); // Set/reset node class fixed
		var foo =  w/2 + t*spread - (topNodes.length-1)*spread/2; // Spread evenly around the center
		topNodes[t].x = foo;
		topNodes[t].y = 20; // 20 pixels from top
	}

	force.start();

} // End of termviz.restart()

//Add nodes and links.
termviz.loadFromUri = function(graphURI) {
	d3.json(graphURI,
			function (jsondata) {
		//console.log(jsondata);
		termviz.loadFromObject(jsondata);
	});
}

termviz.loadFromObject = function(serverResponse) {

	var graphValidationError = "";
	var existingNodeMap = {};
	var mergeDuplicates = true;

	nodes.forEach(function(d){
		existingNodeMap[d.id] = true;
	});

	// Add response nodes to nodes array 	
	serverResponse.nodes.forEach(function(responseNode){		  	    
		var alreadyPresent = false;
		var currentNodeId = responseNode.id.trim(); // TODO: remove extra spaces on server side!
		if (existingNodeMap[currentNodeId] && existingNodeMap[currentNodeId] == true) alreadyPresent = true;

		var snode = {id: currentNodeId, name: responseNode.term, group: responseNode.group, incoming: [], outgoing:[]}; 
		if (!alreadyPresent) {
			existingNodeMap[currentNodeId] = true;
			nodes.push(snode);
			console.log("Added node: id="+snode.id+" name="+snode.name, snode);
		} else {
			console.log("NODE ALREADY PRESENT: id="+snode.id+" name="+snode.name+" ..thus it was not added again");			    	
		}
	}); // end serverResponse.nodes.forEach...


	// Iterate over all links from server response
	serverResponse.links.forEach(function(d){
		var sourceNode = null; 
		var targetNode = null;   

		// For each link iterate over all nodes
		nodes.forEach(function(value){
			currentNodeId = value.id;
			if (d.source.trim() == currentNodeId.trim()) {
				sourceNode = value;
				//console.log("Found source id="+currentNodeId, value, d);
			}
			if (d.target.trim() == currentNodeId.trim()) {
				targetNode = value;
				//console.log("Found target id="+currentNodeId, value, d);
			}
		});

		if (sourceNode != null && targetNode != null) {
			var linkAlreadyPresent = false;

			if(mergeDuplicates){
				links.forEach(function(value) {
					if (value.source.id == sourceNode.id && value.target.id == targetNode.id) linkAlreadyPresent = true;
				});
			} // end if(mergeDuplicates)

			if (linkAlreadyPresent){
				console.log("LINK ALREADY PRESENT:" +sourceNode.id+" -> "+targetNode.id+" ..thus it was not added again");	
			} else {	
				var newLink = {source: sourceNode, target: targetNode, type: IS_A_LINK};
				links.push(newLink); // TODO: Type (e.g. is_a) should come
				// from server instead
				// Add link info to nodes also
				sourceNode.outgoing.push(newLink);
				targetNode.incoming.push(newLink);
				console.log("Added link:"+sourceNode.id+" -> "+targetNode.id);	    	
			}
		} else {
			graphValidationError = graphValidationError + "BROKEN LINK: "+d.source+" -> "+d.target+"\r\n";
			console.log("#### BROKEN LINK - d:",d," - d.source:", d.source, sourceNode, " -> d.target:", d.target, targetNode );
		}
	}); // end serverResponse.links.forEach...

	console.log("links:", links);
	console.log("nodes:", nodes);

	termviz.restart();

	if (graphValidationError.length > 1) {
		alert("Some errors in the indata were detected:\r\n"+ graphValidationError + "...but the graph will be built using the remaining connected nodes and links.")
		console.log(graphValidationError);
	}

} // End importData


function findDomNodeBasedOnData(data, container) {
//	if (container){
		return container.filter(function(d, i) {if (d === data) return true })
//	} else {
//		return d3.select(function(d, i) {if (d === data) return this })
//
//	}
}


/* ************************* DENDROGRAM ****************************** */

//var cluster, diagonal, treeVis;

/** Perhaps using an "Indented Tree (Collapsible)" as in http://bl.ocks.org/1093025 would be better? */
termviz.dendrogram = function (enclosingVisualization ){

	dendroWidth = parseInt(enclosingVisualization.style("width"), 10);
	console.log("Starting dendrogram, enclosingVisualization width=",dendroWidth, treeHeight, treeSideMargins, treeBottomMargin);

	treeWidth = dendroWidth-2*treeSideMargins; //300,

	cluster = d3.layout.cluster()
	// .size([treeWidth - 160, treeHeight]);
	.size([treeWidth, treeHeight]);

	diagonal = d3.svg.diagonal()
	.projection(function(d) { return [d.x, treeHeight-d.y]; });
	//.projection(function(d) { return [d.x, treeHeight-d.y+(h-treeHeight)]; });
	//.projection(function(d) { return [d.y, d.x]; });

	treeVis = enclosingVisualization.append("g")
	.attr("id", "dendrogram")
	.attr("width", treeHeight)
	.attr("height", treeWidth);

	treeVis.attr("transform", "translate("+treeSideMargins+", "+ (h-treeHeight-treeBottomMargin)+")");

	// console.log("treeVis:", treeVis)
	return treeVis; 

} // End of function termviz.dendrogram 

termviz.dendrogram.clear = function(){
	console.log("treeNodes before ", cluster.nodes.length);
	if (cluster.nodes) cluster.nodes.length = 0;
	
	treeVis.selectAll("*").remove();
	console.log("treeNodes after ", cluster.nodes.length);
};

function setStateOfThisAndChildren(data, state) {

	var currentNode = findDomNodeBasedOnData(data, d3.selectAll("g.treeNode"));
	var newState;
	if (state == null) {
		newState = !currentNode.classed("activeTreeNode");
	} else {
		newState = state;
	}
	currentNode.classed("activeTreeNode", newState); // Toggle state of this node
	data.selected = newState;

//	force.stop(); // Stop the simulation while adding nodes (will be started in termviz.restart() further down) 
//
//	var templateSnomedIdSet = {};
//
//	// Check for SNOMED CT bindings and possible targets
//	if (data.sctid) {
//		templateSnomedIdSet[data.sctid]=true; // Add to set		
//		console.log(" >>>>A>>>>"+templateSnomedIdSet, nodeContainer);
//		var existingCrosslinkNode = nodeContainer.filter(function(d){
//			console.log(" >>>>B>>>>", d)
//			if (d && d.id==data.sctid) {
//				return true; // Find the node
//			} else {
//				return false;
//			}
//		});
//		
//		var targetNode = nodes.filter(function(d, i){if (d.id==data.sctid) return this})[0];
//
//		console.log(" >>> newState, existingCrosslinkNode, targetNode:",newState, existingCrosslinkNode, targetNode, "TOTAL:", newState && !existingCrosslinkNode && targetNode);
//		if (newState && !existingCrosslinkNode && targetNode) {
//
//			// Add crosslink
//			console.log("add connection to data.sctid", data.sctid)
//			var crossLinkID = "crosslink-"+(new Date().getTime()); // Create a timestampebased ID
//
//			var newNode = {id: crossLinkID, incoming: [], outgoing:[], fixed: true, x: data.x+treeSideMargins, y:h-treeBottomMargin-data.y, type: CROSSLINK_SOURCE }
//			data.crossLinkID=crossLinkID;
//			console.log("newNode", newNode);
//			nodes.push(newNode);
//
//
//			targetNode.type = CROSSLINK_TARGET;
//
//			console.log("targetNode", targetNode);
//
//			var newCrossLink = {source: newNode, target: targetNode, id:crossLinkID, type:CROSSLINK};
//			links.push(newCrossLink);
//			targetNode.incoming.push(newCrossLink);
//
//			newNode.outgoing.push(newCrossLink);
//
//		} else {
//			//console.log("remove connection to data.sctid", data.sctid, "should remove node "+data.crossLinkID)
//			if (existingCrosslinkNode) nodes.splice(nodes.indexOf(existingCrosslinkNode), 1); // Remove the node
//
//			var crosslinkLink = links.filter(function(d, i){if (d.id===data.sctid) return this})[0];
//			if (crosslinkLink) links.splice(links.indexOf(crosslinkLink), 1); // Remove the link			
//		}
//	}
	// console.log("currentNode:", currentNode, "data", data, data.sctid, data.children);
	var children = data.children;
	if (children) {
		for (var c = 0; c < children.length; c++) {
			//var childTreeNode = d3.selectAll("g.treeNode").select(function(d, i) {if (d === children[c]) return this }).node()
			// var childTreeNode = findDomNodeBasedOnData(children[c], d3.selectAll("g.treeNode"));
			// console.log("childNode:",  children[c], "childTreeNode", childTreeNode);
			setStateOfThisAndChildren(children[c], newState)
		}	
	} 
	//termviz.restart(); // Recalculate layout after posssible additions/removals
}

termviz.dendrogram.draw = function(json){
	treeNodes = cluster.nodes(json);   
	console.log("treeNodes: ", treeNodes)

	var link = treeVis.selectAll("path.treeLink")
	.data(cluster.links(treeNodes))
	.enter().append("path")
	.attr("class", "treeLink")
	.attr("d", diagonal);

	//link.exit().remove();

	var treeNode = treeVis.selectAll("g.treeNode")
	.data(treeNodes)
	.enter().append("g")
	.attr("class", function(d,i){return "treeNode datatype-"+d.datatype})
	.attr("id", function(d){return d.id})       
	.attr("transform", function(d) { return "translate(" + d.x + ", " + (treeHeight-d.y)  + ")"; });

	//treeNode.exit().remove();

	treeNode.append("circle")
	.attr("r", 4.5);

	treeNode.append("text")
	.attr("dx", function(d) { return d.children ? -8 : 8; })
	.attr("dy", 3)
	.attr("text-anchor", function(d) { return d.children ? "end" : "start"; }) // Select if start or end text should be attached to the (branch:leaf) treeNode 
	.attr("transform", function(d) { return d.children ? "rotate(0)" : "rotate(-90)"; }) // Angle of (branch:leaf) text. TODO: Move rotation to CSS?
	.attr("class", function(d) { return d.children ? "treeText branch" : "treeText leaf"; }) // Angle of (branch:leaf) text. TODO: Move rotation to CSS?
	.text(function(d) { return d.name; });

	treeNode.on("click", function(data, index){	   
		//console.log("Clicked treeNode data:",data," index:",index," this:", this, "activeTreeNode:", d3.select(this));

		// First recursively set states...
		setStateOfThisAndChildren(data);

		// ...then update focus set list based on the now active treeNodes
		var uniqueSctIds = [];   
		treeNodes.forEach(function(d){ 
			if(d.sctid && d.selected && uniqueSctIds.indexOf(d.sctid)==-1 ) { // If it has an id & is selected & not already added
				uniqueSctIds.push(d.sctid);
			}
		});

		var sctIdsCommaString = uniqueSctIds.join(",");
		console.log("Clicked node's data:", data, " uniqueSctIds: ", uniqueSctIds);

		if ($("#focusSource").is(":checked")) {
			console.log("sctIdsCommaString: ", sctIdsCommaString, '$("#focusSource").is(":checked")', $("#focusSource").is(":checked") );   
			$("textarea#focusTextarea").val(sctIdsCommaString);
		}

		//d3.select(this).classed("active", true);
		// Toggle state of data fixed
		//data.fixed=!data.fixed; 
		//d3.select(this).classed("fixed", data.fixed); // Set/reset node class fixed
		//var labelOfFixed = vis.selectAll(".L"+data.id);
		//labelOfFixed.classed("fixed", data.fixed); // Set/reset node class fixed
		//force.resume() //Raise force based simulation temperature in order to adjust to modified nodes
	});
	
	d3.select("textarea#focusTextarea").on("change", function(dat){
		//alert("this content: "+this.text());
		console.log(this, d3.select(this).node().textContent);
	});

	var root=treeNodes.filter(function(d,i){if (!d.parent) return true})[0];
	console.log("root",root) ;  
//	$(root).children[0].click(); 
	$(root).click(); 

	//setStateOfThisAndChildren(root, true) // Select the root upon start TODO: Change to first template

}; // End of function drawDedrogramTree(json)

})(); //End of anon wrapper
