/**
 * Algortithm and implementation by: Anne Randorff Højen, Aalborg Universitet, Denmark
 * Modifications by: Erik Sundvall, Linköping University, Sweden
 */

 /** Input parameters: 
  		linkArray = an array of links representing the entire links tructure in the graph 
  		focusIDs = focus node ids (comma separated string) 
  	 Result:
  	     Outputs result to console	*/   
  function consoleLCP(linkArray, focusIdArray) {
    console.log("Links:", linkArray, "focus-nodes:", focusIdArray); 

	//Call to function get Path. Returns an array of paths - one path for each input concept with a 'source-target' representation of the path from concept to SCT root concept
  	paths = getPaths(focusIdArray, linkArray);  	
  	console.log("paths:", paths);
  		
	//Call to function getCP. Determines all common concepts of the paths.
	cp = getCP(paths); 
	console.log("all common concepts of the paths:", cp);

 	//Call to function getLCP. Determines the least common concepts of the interest concepts. The LCP is returned as an array of objects. Each object consist of a lcp and an array of concepts which the lcp is least common for.
	lcp = getLCP(cp, paths);
	console.log("The LCP is returned as an array of objects. Each object consist of a lcp and an array of concepts which the lcp is least common for.:", lcp);	
  }

  /** Input parameters: 
	linkArray = an array of links representing the entire links structure in the graph
	nodeArray = an array of all nodes in the graph 
	focusIDs = focus node ids as an array
 Result:
     Annotates nodes in the NodeArray with differant kinds of (least) common parent attributes	*/   
  function lcpDecorator(linkArray, nodeArray, focusIdArray) {
	  //console.log("Links:", linkArray, "focus-nodes:", focusIdArray) 
	  // First clear all previous cp & lcp info 
	  nodeArray.forEach(function(currentNodeInArray){
		  currentNodeInArray.cp=false;
		  currentNodeInArray.lcp=false;
		  currentNodeInArray.cp_dist=null;
	  });

//	  Call to function get Path. Returns an array of paths - one path for each input concept with a 'source-target' representation of the path from concept to SCT root concept
	  paths = getPaths(focusIdArray, linkArray);  	
	  //console.log("paths:", paths);

//	  Call to function getCP. Determines all common concepts of the paths.
	  commonParents = getCP(paths); 
	  console.log("all common concepts of the paths:", commonParents);

	  // Add common-parent info to nodes
	  nodeArray.forEach(function(currentNodeInArray){
		  commonParents.forEach(function(currentParent){
			 console.log(currentParent.id+" == "+currentNodeInArray.id);
			 if (currentParent.id == currentNodeInArray.id) {
				 currentNodeInArray.cp=true;
				 currentNodeInArray.cp_dist=currentParent.dist;
				 console.log("HIT: "+currentNodeInArray.cp, currentNodeInArray);
			 } else {
				 // currentNodeInArray.cp=false;
			 };
		  });
	  });
	  
	  // Call to function getLCP. Determines the least common concepts of the interest concepts. The LCP is returned as an array of objects. Each object consist of a lcp and an array of concepts which the lcp is least common for.
	  var leastCommonParents = getLCP(commonParents, paths);
	  
	  // Add common-parent info to nodes
	  nodeArray.forEach(function(currentNodeInArray){
		  leastCommonParents.forEach(function(currentParent){
			 if (currentParent.cp == currentNodeInArray.id) {
				 currentNodeInArray.lcp=true;
				 //currentNodeInArray.lcp_dist=currentParent.dist; //Same value as cp_dist, thus not needed
				 currentNodeInArray.lcp_ic=currentParent.ic;
			 } else {
				 // currentNodeInArray.lcp=false;
			 };
		  });
	  });

	  console.log("The decorated array of nodes:", nodeArray);
	  
  }

  function getPaths(IC, linkArray){
      
       var arrayOfPaths = [];	
       for (i=0;i<IC.length;i++)
          { 
              var relations = [];
              id = IC[i];
			  //Initialize step, as the first step from our interest concept to the next
			   var step = 1;
			   //Get the parent concepts. Returns an array of objects with a source-target representation of the path from the id to the root.
              parents = getParents(id, linkArray, relations, step);
              //Put the array into the path array
              var path = {id: id, parents: parents};
              arrayOfPaths.push(path);
          }	
          return arrayOfPaths;
      }
  
  
  
  
  function getParents(child, links, relations, step){
       if(child != 138875005){
              for(var i = 0, n = links.length; i < n; i++) {
          		//traverse all the links in the serverResponse/ the whole tree to find the places where the actual concept is a child	
                  //if the concept is child in a relationship - the parent/target should be included in the graph traversing
				  if(links[i].source == child){
                       // the parent concept is target in the source-target relationship
                      var parent = links[i].target;
                      
					  //b is used to state if the the relation has already been found - to avoid dublicates
					  var b=true;
					  
                      for (j=0; j<relations.length;j++){
                          
						  if(relations[j].source==child){
							  step = relations[j].dist;
							  }
						  
						  if(relations[j].target==parent){
							  if(relations[j].source==child){
							  b=false;
                              }
                          }             
                      }
                      
					  //This is not a dublicate relation --> therefore it should be added to the path and the next parent/relation should be found
					  if(b){		 
                     		var relation = {source: child, target: parent, dist: step};
                      		relations.push(relation);
					  		//Step is increased by one as we go one step further from our starting point
							step = step+1;
					 		getParents(parent, links, relations, step); 
					  	}
          
                  }		
              }
       }
       else if(child == 138875005){    
           }
		//The relations array is returned   
      return relations;	
      }
          
  
  
  function getCP(paths){
      // Initialize an empty array for the common parents
      var commonParents = [];
     
	 // Loop through all the paths for all interest concepts to determine the first concept to compare
	  for (i1=0;i1<paths.length;i1++)
          { 
		  // Loop through all the paths, but the first, for all interest concepts to determine the concept to compare with
          for (i2=i1+1;i2<paths.length;i2++)
                  {
                      focusId1 = paths[i1].id; // Id's of the first path beeing traversed
                      focusId2 = paths[i2].id; // Id's of the second path beeing traversed
					  
					  //Loop through all the Source-target relationsships 
                      for (c1=0;c1<paths[i1].parents.length;c1++)
                          { 
						  		//We compare by target
                              id1 = paths[i1].parents[c1].target;
                              //document.getElementById("main").innerHTML+=" Id1   >>>>>>>>   " + id1 +"<br />";		
                      
					  		//Loop through all the Source-target relationsships of the path to compare with 	
                              for (c2=0;c2<paths[i2].parents.length;c2++)
                                  { 
                                      id2 = paths[i2].parents[c2].target;
                                      
									  //If a match is found means that the concept is present as target in both paths - i.e. this is a common parent.
									  if(id1 == id2){
										 var bool = true;
										  // If the common parent has already been found it shouldn't be included again - to avoid dublicates                               
									  	for (j=0; j<commonParents.length;j++){
                          					if(commonParents[j].id==id1){
												//Only save the shortest dist. if this common parent has a shorter dist - then this should be added and the old should be removed
												if(commonParents[j].dist> paths[i1].parents[c1].dist ){
												commonParents[j].dist = paths[i1].parents[c1].dist;
												}
												bool=false;
                              					}
                      					}
									 //This cp is a new cp - and therefore it should be added to the commonParents array
									 if(bool){
										 var cp = {id: id1, dist: paths[i1].parents[c1].dist};
										 commonParents.push(cp);
										 }								 
                                      //Slutter if - hvis der er fælles begreber i de 2 arrays (id1 og id2)
                                      }			
         							//Slutter for der kører igennem 2. array
                                  }            
                          //Slutter for der kører igennem første array
						  }
                  //slutter 2. for / bestemmer 2. array
				  }                                      
         //slutter første for / besttemer første array
		  }	
		  
	//Return the array and all common concepts for the interest concepts	  
    return commonParents;
    }

//The function that remove common concepts which are not least.
  function getLCP(cp, paths){
	  //initialze array for the least common concepts
	  var lcp = [];
	  //Loop through all commonParents
	   for (i=0;i<cp.length;i++)
          { 
		  var ic_array = [];
		   cp_id = cp[i].id;
		   
		   
		   //Loop through all paths for all interest concepts
		   for (j=0;j<paths.length;j++)
          { 
		  ic_id = paths[j].id;
		  		//gennemløber alle paths-parents
	      		for (k=0; k<paths[j].parents.length;k++){
					
						  parent_id = paths[j].parents[k].target;
						  //If the common parent exist as target in a path, then the interest concept is added to the array of interest concepts for that common parent
						  if(cp_id==parent_id){	  
							  //Should we add this interest concept to the array of interest concepts for the specific common parent
							  var addIC = true;
							  //Loop through the array of IC to see if it already exist - if not, then add it - if yes, then break the loop, as the IC has already been found				
							  for (m=0; m<ic_array.length;m++){
								  if(ic_array[m] == ic_id){
									    addIC = false;
										break;
									  }
							  }
							  if(addIC){
							 	ic_array.push(ic_id);
								break;
								}						  
						  //slutter if parent = cp
						  }
                      }
		  		}
	  
	  //All paths has been traversed and the ic_array for the concerned common parent has been found
	  			var c_lcp = {cp: cp_id, ic:ic_array, dist: cp[i].dist};
				//So, this is a new lcp candidate
	  			var newCandidate = true;
							 
							  //Loop throung the LCP array to see if it has already been found
							  for (n=0; n<lcp.length;n++){
								  //If it already exist then it shouldn't be added and we should break the current search
								  if(lcp[n] == c_lcp){
									   newCandidate = false;
									   break;
									  }
								  //If the length of the IC-array is equal it should be examined if the content of the ic_array is equal
								  if(lcp[n].ic.length == c_lcp.ic.length ){

										   for (p=0; p<lcp[n].ic.length;p++){
										   		for (s=0; s<c_lcp.ic.length;s++){
										   		//The content is the same 
												if(lcp[n].ic[p]==lcp[n].ic[s]){
													newCandidate = false;
													}
										   		}	
										   }
										   if(!newCandidate){
											   //Only keep the common parent with the smallest dist - because this is the least common parent
											   if(lcp[n].dist > c_lcp.dist){
												   delete lcp[n];
												   lcp.push(c_lcp);
												   }
											   }
										  }					  
							  }
							  //New candidate is found
							  if(newCandidate){
								lcp.push(c_lcp);
								//Slutter IF - new Candidate
								}
		  }
	//REturn array of LCP's
	  return lcp;
	  }
 