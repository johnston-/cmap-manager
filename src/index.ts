// MODELS
	interface TripleConfig {
		subId: string,      // subject id
		relId: string,      // relationship id
		objId: string,      // object id
		sourceId: string,   // subject -> relationship link id
		targetId: string,   // relationship -> target link id
		fork?: boolean,     // true if this proposition shares relationship in a fork configuration
		join?: boolean,     // true if this proposition shares relationship in a join configuration
		style?: string      // used in composite maps
		agreement?: number  // used in composite maps
	}

	interface Node {
		id: string,
		type: string,
		value: string,
		[propName: string]: any
	}

	interface Link {
		id: string,
		type: string,
		source: any,
		target: any,
		[propName: string]: any
	}

	interface SCNode {
		nodeId: string,
		nodeValue: string
	}

	type RawTriple = [string, string, string];

	export interface Triple {
		id: string,
		value: RawTriple,
		config: TripleConfig
	}

	interface Cmap {
		triples: Array<Triple>,
		nodes: Array<Node>,
		links: Array<Link>
	}

	interface ForkJoinData {
		[index: string]: {members: Array<string>, source: string, target: string}
	}

	enum GraphActionType {
		addNode = "add node",
		addLink = "add link",
		addTriple = "add triple",
		removeNode = "remove node",
		removeLink = "remove link",
		removeTriple = "remove triple",
		updateTriple = "update triple"
	}

	type GraphAction = [GraphActionType, any]

	interface IDMap {
		[index: string]: Node | Link
	}
	
export class CmapManager {

	TRIPLES: Array<Triple> = []
	NODES: Array<Node> = []
	LINKS: Array<Link> = []
	SC: SCNode = {nodeValue: "", nodeId: ""};

	IDMAP: IDMap = {}
	LOG: Array<any> = []

	constructor(){}

	// GET
		getNodes(): Array<Node> { return this.NODES }
		getLinks(): Array<Link> { return this.LINKS }
		getTriples(): Array<Triple> { return this.TRIPLES }
		getSuperConcept(): SCNode { return this.SC }
		getLog() { return this.LOG }
		getGraphObject(): Cmap {
			// to remove duplicates
			//this.NODES = this.NODES
			//this.LINKS = this.LINKS
			//this.TRIPLES = this.TRIPLES.map(triple => [triple.id, triple])).values()]
			return {
				nodes: this.NODES,
				links: this.LINKS,
				triples: this.TRIPLES
			}
		}
		getGraphObject_(): Cmap {
			// to remove duplicates
			this.NODES = [...new Map(this.NODES.map(node => [node.id, node])).values()]
			this.LINKS = [...new Map(this.LINKS.map(link => [link.id, link])).values()]
			this.TRIPLES = [...new Map(this.TRIPLES.map(triple => [triple.id, triple])).values()]
			return {
				nodes: this.NODES,
				links: this.LINKS,
				triples: this.TRIPLES
			}
		}
		
	// SET
		setSuperConcept(value, nodeId) {
			this.SC.nodeId = nodeId; 
			this.SC.nodeValue = value; 
		}

		setNodes(newNodes): CmapManager {
			this.NODES = newNodes.map(x => getNewNode(x));
			this.LINKS = [];
			this.TRIPLES = [];
			return this;
		}
	
		loadTriples(rawTriples) : CmapManager {
			//let [nodes, links, triples] = this.setMetadata(rawTriples)
			let formattedSimpleTriples = preformatSimpleTriples(rawTriples);
			let cmap = getCmapFromSimpleTriples(formattedSimpleTriples);
			this.NODES = cmap.nodes;
			this.NODES.forEach(node => {
				node["settings"] = node["settings"] || {};
				Object.assign(node["settings"], {
					"dim": false,
					"superConcept-initial": false,
					"superConcept-select": false,
					"SKEItemNumber": [],
					"disconnectedNode": false,
					"missingText": false,
					"incompleteProps": false,
					"superConcept-map": false,
					"pronoun": false
				})
			});
			
			//this.NODES.forEach(n => n.value = n.value.replace(/\s+/g, " "));
			this.LINKS = cmap.links;
			this.LINKS.forEach(link => {
				link["settings"] = link["settings"] || {}
				Object.assign(link["settings"], {
					"dim": false,
					"superConcept-select": false,
					"undefinedNode": false
				})
			});
			this.TRIPLES = cmap.triples;
			return this
		}

		loadGraph(graphObject) : CmapManager {
			this.NODES = graphObject.NODES;
			this.NODES.forEach(node => node["settings"] = {"dim": false, "superConcept-initial": false, "superConcept-select": false, "SKEItemNumber": [], "disconnectedNode": false, "missingText": false, "incompleteProps": false, "superConcept-map": false, "pronoun": false});
			this.NODES.forEach(n => n.value = n.value.replace(/\s+/g, " "));
			this.LINKS = graphObject.LINKS;
			this.LINKS.forEach(link => link["settings"] = {"dim": false, "superConcept-select": false, "undefinedNode": false});
			this.TRIPLES = graphObject.TRIPLES;
			return this
		}

		loadCmap(graphObject) : CmapManager {
			this.NODES = graphObject.nodes;
			this.NODES.forEach(node => {
				node["settings"] = node["settings"] || {};
				Object.assign(node["settings"], {
					"dim": false,
					"superConcept-initial": false,
					"superConcept-select": false,
					"SKEItemNumber": [],
					"disconnectedNode": false,
					"missingText": false,
					"incompleteProps": false,
					"superConcept-map": false,
					"pronoun": false
				})
			});
			//this.NODES.forEach(n => n.value = n.value.replace(/\s+/g, " "));

			this.LINKS = graphObject.links;
			this.LINKS.forEach(link => {
				link["settings"] = link["settings"] || {}
				Object.assign(link["settings"], {
					"dim": false,
					"superConcept-select": false,
					"undefinedNode": false
				})
			});

			this.TRIPLES = graphObject.triples;	        
			return this	
		}

	// TRIPLE ACTIONS
		commitAction(action) : void {
			
			switch(action[0]){
				case "add node":
					this.NODES.push(action[1])
				break
				case "add link":
					this.LINKS.push(action[1])
				break
				case "add triple":
					this.TRIPLES.unshift(action[1])
				break
				case "remove node":
					this.NODES = this.NODES.filter(z => z.id !== action[1].id)
					//this.LINKS = this.LINKS.filter(z => typeof z.source == "string" ? z.source === action[1] : z.source.id === action[1] )
					//this.TRIPLES = this.TRIPLES.filter(z => z.config.subId != action[1] && z.config.relId != action[1] && z.config.objId != action[1])
				break
				case "remove link":
					this.LINKS = this.LINKS.filter(z => z.id !== action[1].id)
					//this.TRIPLES = this.TRIPLES.filter(z => z.config.sourceId != action[1] && z.config.targetId != action[1])
				break
				case "remove triple":
					this.TRIPLES = this.TRIPLES.filter(x => x.id !== action[1].id)
				break
				case "update node":
					// [type, node, nType, newVal, oldVal]
					if(action[1].type == 'concept'){
						let existingNode = findNodeByValue(this.getGraphObject(), action[3], "concept");
						let oldNode = this.findConceptNode(action[1].id);
						
						if(existingNode && existingNode.id == oldNode.id){
							this.NODES.find(x => x.id == action[1].id)[action[2]] = action[3];
							this.TRIPLES.forEach(z => {
								z.value[0] = this.NODES.find(y => y.id == z.config.subId).value;
								z.value[1] = this.NODES.find(y => y.id == z.config.relId).value;
								z.value[2] = this.NODES.find(y => y.id == z.config.objId).value;
							})
						}
						else{
							/*this.LINKS.forEach(l => {
								if(l.source.id == action[1].id) l.source = existingNode.id;
								if(l.target.id == action[1].id) l.target = existingNode.id;
							})*/
							this.TRIPLES.forEach(t => {
								if(t.config.subId == oldNode.id) {
									t.value[0] = action[3];
								}
								if(t.config.objId == oldNode.id) {
									t.value[2] = action[3];
								}
							})
							//this.removeNodeOrdered(action[1]);
						}
						
					}
					else{
						this.NODES.find(x => x.id == action[1].id)[action[2]] = action[3];
						this.TRIPLES.forEach(z => {
							z.value[0] = this.NODES.find(y => y.id == z.config.subId).value;
							z.value[1] = this.NODES.find(y => y.id == z.config.relId).value;
							z.value[2] = this.NODES.find(y => y.id == z.config.objId).value;
							console.log(z)
						})
					}
					console.log(this.NODES, this.TRIPLES)		
				break
				case "update link":
					this.LINKS.find(x => x.id == action[1])[action[2]] = action[3];
				break
				case "update triple":
					this.TRIPLES.find(x => x.id == action[1]).config[action[2]] = action[3]
				break
				default:
					console.log("!", action)
				break
			}
		}

		remTripleActions(tid): Array<GraphAction> {
			let actions = [];
			let triple = this.TRIPLES.find(x => x.id == tid);
			//if fork
			console.log("rem triple actions", tid, triple)
			if(triple.config.fork || isTripleinFork(triple, this.TRIPLES)){
				//check number of items in fork
				console.log(0)
				let otherForks = this.TRIPLES.filter(x => x.id !== triple.id && x.config.relId == triple.config.relId);
				if(otherForks.length == 1){
					//remove fork
					actions.push([GraphActionType.updateTriple, otherForks[0].id, "fork", false])
				}
				let tl = this.LINKS.find(x => x.id === triple.config.targetId)
				actions.push([GraphActionType.removeLink, tl])
				actions.push([GraphActionType.removeTriple, triple])

				if(!this.TRIPLES.find(x => x.id != triple.id && x.config.subId == triple.config.objId) && !this.TRIPLES.find(x => x.id != triple.id && x.config.objId == triple.config.objId)){
					let n = this.NODES.find(z => z.id === triple.config.objId)
					actions.push([GraphActionType.removeNode, n]);
				}
			}
			else if(triple.config.join || isTripleinJoin(triple, this.TRIPLES)){
				console.log(1)
				//check other triples in the join
				let otherJoins = this.TRIPLES.filter(x => x.id != triple.id && x.config.relId == triple.config.relId);
				if(otherJoins.length == 1){
					actions.push([GraphActionType.updateTriple, otherJoins[0].id, "join", false])
				}
				let sl = this.LINKS.find(x => x.id === triple.config.sourceId)
				actions.push([GraphActionType.removeLink, sl])
				actions.push([GraphActionType.removeTriple, triple])
			}
			else {
				// if single
				console.log(2)
				let sl = this.LINKS.find(x => x.id === triple.config.sourceId)
				actions.push([GraphActionType.removeLink, sl])
				let tl = this.LINKS.find(x => x.id === triple.config.targetId)
				actions.push([GraphActionType.removeLink, tl])
				let rn = this.NODES.find(z => z.id === triple.config.relId)
				actions.push([GraphActionType.removeNode, rn])
				actions.push([GraphActionType.removeTriple, triple])
				//  remove triple
				if(!this.TRIPLES.find(x => x.id != triple.id && x.config.subId == triple.config.subId) && !this.TRIPLES.find(x => x.id != triple.id && x.config.objId == triple.config.subId)){
					console.log("remove subject?", triple.config.subId)
					let sn = this.NODES.find(z => z.id === triple.config.subId)
					actions.push([GraphActionType.removeNode, sn]);
				}
				if(!this.TRIPLES.find(x => x.id != triple.id && x.config.subId == triple.config.objId) && !this.TRIPLES.find(x => x.id != triple.id && x.config.objId == triple.config.objId)){
					console.log("remove object?", triple.config.objId)
					let on = this.NODES.find(z => z.id === triple.config.objId)
					actions.push([GraphActionType.removeNode, on]);
				}
			}
			return actions
		}

		reverseTripleAction(action){
			console.log("reverse->", action)
			switch(action[0]){
				case "add node":
					this.NODES = this.NODES.filter(z => z.id !== action[1].id)
				break
				case "add link":
					this.LINKS = this.LINKS.filter(z => z.id !== action[1].id)
				break
				case "add triple":
					this.TRIPLES = this.TRIPLES.filter(z => z.id !== action[1].id)
				break
				case "remove node":
					this.NODES.push(action[1])
					//this.LINKS = this.LINKS.filter(z => typeof z.source == "string" ? z.source === action[1] : z.source.id === action[1] )
					//this.TRIPLES = this.TRIPLES.filter(z => z.config.subId != action[1] && z.config.relId != action[1] && z.config.objId != action[1])
				break
				case "remove link":
					this.LINKS.push(action[1])
					//this.TRIPLES = this.TRIPLES.filter(z => z.config.sourceId != action[1] && z.config.targetId != action[1])
				break
				case "remove triple":
					this.TRIPLES.push(action[1])
				break
				case "update node":
					this.NODES.find(x => x.id === action[1].id)[action[2]] = action[4]
					this.TRIPLES.forEach(x => {
						if(x.config.subId === action[1].id) x.value[0] = action[4];
						if(x.config.relId === action[1].id) x.value[1] = action[4];
						if(x.config.objId === action[1].id) x.value[2] = action[4];
					})
				break
				default:
					console.log("!", action)
				break
			}
		}

		undoLastStep(step: Array<any>) {
			// reverse each action in the step in correct order
			while(step.length > 0){
				let r = step.pop()
				this.reverseTripleAction(r)
			}
		}

		undoAction(): boolean {
			console.log("undoing...")
			if(this.LOG.length > 0) {
				this.undoLastStep(this.LOG.pop())
				return this.LOG.length > 0
			}
			return false
		}

	// UPDATE CMAP DATA
		updateNodeValue(nid: string, newVal: string) {
			let n = this.NODES.find(x => x.id === nid);
			if(n){
				console.log("{--}", n.value, newVal)
				let actions = [["update node", n, "value", newVal, n.value]];
      	commitLog(this, actions)	
			}
		}

		updateNodeSettings(nodes){
			// this.NODES = nodes;
			this.NODES.forEach(n => {
				n.settings = nodes.find(node => node.id == n.id).settings;
			})
		}

		updateLinkSettings(links){
			// this.LINKS = links;
			this.LINKS.forEach(l => {
				l.settings = links.find(link => link.id == l.id).settings;
			})
		}
	
		updateTriplesValue(triples){
			triples.forEach(triple => {
				let currTriple = this.TRIPLES.find(t => t.id == triple.id);
				currTriple.value = triple.value;

				let currSub = this.NODES.find(n => n.id == triple.config.subId);
				currSub.value = currTriple.value[0];
				// this.TRIPLES.find(t => t.config.subId == triple.config.subId).value[0] = currTriple.value[0];
				
				let currObj = this.NODES.find(n => n.id == triple.config.objId);
				currObj.value = currTriple.value[2];
				// this.TRIPLES.find(t => t.config.objId == triple.config.objId).value[2] = currTriple.value[2];
				
				let currRel = this.NODES.find(n => n.id == triple.config.relId);
				currRel.value = currTriple.value[1];
				// this.TRIPLES.find(t => t.config.relId == triple.config.relId).value[1] = currTriple.value[1];

				this.TRIPLES.forEach(t => {
					let currIds = [t.config.subId, t.config.relId, t.config.objId];
					if(currIds.includes(triple.config.subId)){
						if(t.config.subId == triple.config.subId) t.value[0] = currTriple.value[0];
						else if(t.config.relId == triple.config.subId) t.value[1] = currTriple.value[0];
						else if(t.config.objId == triple.config.subId) t.value[2] = currTriple.value[0];
					}
					else if(currIds.includes(triple.config.relId)){
						if(t.config.subId == triple.config.relId) t.value[0] = currTriple.value[1];
						else if(t.config.relId == triple.config.relId) t.value[1] = currTriple.value[1];
						else if(t.config.objId == triple.config.relId) t.value[2] = currTriple.value[1];
					}
					else if(currIds.includes(triple.config.objId)){
						if(t.config.subId == triple.config.objId) t.value[0] = currTriple.value[2];
						else if(t.config.relId == triple.config.objId) t.value[1] = currTriple.value[2];
						else if(t.config.objId == triple.config.objId) t.value[2] = currTriple.value[2];
					}
				})
			})
			return this
		}

	// ADD

		// FROM TEXT
		addTriple(rawTriple: Array<string>): void {
			let newTriple = rawTriple.map(x => formatNodeText(x))
			let actions = getTripleActions(this, newTriple, this.getGraphObject())
			commitLog(this, actions);
		}

		addTriples(newTriples: Array<RawTriple>): CmapManager {
			//newTriples.forEach(x => this.addTriple(x))
			return this
		}

		addTripleIds(newTriple, config) {
			let actions = getTripleActions(this, newTriple, this.getGraphObject(), config)
			commitLog(this, actions);
			return this
		}

		// FROM GRAPH

			addNewNode(config) {
				let nn = getNewNode(config);
				commitLog(this, [[GraphActionType.addNode, nn]])
				return nn
			}

			addNewLink(config) {
				let nl = getNewLink(config);
				let log: any = [[GraphActionType.addLink, nl]];			

				if(nl.type === "source"){
					let targets = this.LINKS.filter(x => findLinkId(x.source) === findLinkId(config.target))
					targets.map(tl => {
						let sub = this.NODES.find(z => z.id === findLinkId(nl.source));
						let rel = this.NODES.find(z => z.id === findLinkId(nl.target));
						let obj = this.NODES.find(z => z.id === findLinkId(tl.target));

						return getNewTriple({value: [sub.value, rel.value, obj.value], config: {subId: sub.id, relId: rel.id, objId: obj.id, sourceId: nl.id, targetId: tl.id}})
					})
						.forEach((x: Triple) => { log.push([GraphActionType.addTriple, x]) })
				}
				else if(nl.type === "target"){
					let sources = this.LINKS.filter(x => findLinkId(x.target) === findLinkId(config.source))
					sources.map(sl => {
						let sub = this.NODES.find(z => z.id === findLinkId(sl.source));
						let rel = this.NODES.find(z => z.id === findLinkId(nl.source));
						let obj = this.NODES.find(z => z.id === findLinkId(nl.target));
						return getNewTriple({value: [sub.value, rel.value, obj.value], config: {subId: sub.id, relId: rel.id, objId: obj.id, sourceId: sl.id, targetId: nl.id}})
					})
						.forEach((x: Triple) => { log.push([GraphActionType.addTriple, x]) })
					//console.log("sources", sources)
				}
				commitLog(this, log);
				//this.newTripleCheck(nl)
				return nl
			}

			addNewNodeAndLink(sourceNode, targetConfig) {
				let lType = sourceNode.type == "concept" ? "source" : "target"
				let no = getNewNode(targetConfig);
				let nl = getNewLink({source: sourceNode, target: no, type: lType})

				let log: any = [
					[GraphActionType.addNode, no],
					[GraphActionType.addLink, nl]
				]

				if(lType === "target"){
					let sources = this.LINKS.filter(x => findLinkId(x.target) === sourceNode.id)
					sources.map(sl => {
						let sub = this.NODES.find(z => z.id === findLinkId(sl.source));
						let rel = this.NODES.find(z => z.id === findLinkId(sl.target));

						return getNewTriple({value: [sub.value, rel.value, no.value], config: {subId: sub.id, relId: rel.id, objId: no.id, sourceId: sl.id, targetId: nl.id}})
					})
						.forEach((x: Triple) => { log.push([GraphActionType.addTriple, x]) })
				}

				commitLog(this, log)
				//this.newTripleCheck(nl)
				return no
			}

			addPropositionFromConcepts(sourceNode, targetNode, mx, my) {
				let nlp = getNewNode({type: "relation", value: "???", x: mx, y: my})
				let ns = getNewLink({source: sourceNode, target: nlp, type: "source"})
				let nt = getNewLink({source: nlp, target: targetNode, type: "target"})
				let nTrip = getNewTriple({value: [sourceNode.value, nlp.value, targetNode.value], config: {subId: sourceNode.id, relId: nlp.id, objId: targetNode.id, sourceId: ns.id, targetId: nt.id}})
				commitLog(this, [
					[GraphActionType.addNode, nlp],
					[GraphActionType.addLink, ns],
					[GraphActionType.addLink, nt],
					[GraphActionType.addTriple, nTrip]
				])
				//this.newTripleCheck(nt)
				return nlp
			}

			addPropositionFromSingleConcept(sourceNode, tx, ty) {
				let [mx, my] = getMidpoint(sourceNode.x, sourceNode.y, tx, ty);
				let no = getNewNode({type: "concept", value: "???", x: tx, y: ty});
				let nlp = getNewNode({type: "relation", value: "???", x: mx, y: my});
				let ns = getNewLink({source: sourceNode, target: nlp, type: "source"});
				let nt = getNewLink({source: nlp, target: no, type: "target"});
				let nTrip = getNewTriple({value: [sourceNode.value, nlp.value, no.value], config: {subId: sourceNode.id, relId: nlp.id, objId: no.id, sourceId: ns.id, targetId: nt.id}})
				commitLog(this, [
					[GraphActionType.addNode, no],
					[GraphActionType.addNode, nlp],
					[GraphActionType.addLink, ns],
					[GraphActionType.addLink, nt],
					[GraphActionType.addTriple, nTrip]
				])
				return no
			}

		newTripleCheck(newLink){
			console.log("check sub", findLinkId(newLink.source), this.NODES)
			if(newLink.type == "source"){
				console.log(this.LINKS.filter(x => findLinkId(x.source) == findLinkId(newLink.target) && x.type != newLink.type))
				let triplesWithLink: Array<Triple> = this.LINKS.filter(x => findLinkId(x.source) == findLinkId(newLink.target) && x.type != newLink.type)
						.map(x => {
							let sub: Node = this.NODES.find(y => y.id == findLinkId(newLink.source));
							let rel: Node = this.NODES.find(y => y.id == findLinkId(x.source));
							let obj: Node = this.NODES.find(y => y.id == findLinkId(x.target));
							return { 
								id: this.getGraphId(),
								value: [sub.value, rel.value, obj.value],
								config: {
									subId: sub.id,
									relId: rel.id,
									objId: obj.id,
									sourceId: newLink.id,
									targetId: x.id
							}}
						})
				// if not in this.TRIPLES add it
				triplesWithLink.forEach(n => {
					let sameTriple = this.TRIPLES.find(x => x.value.join() == n.value.join())
					if((sameTriple && n.value[1] == '???' && sameTriple.config.relId != n.config.relId) || !sameTriple ){
						this.TRIPLES.push(n)
					}
				})
				
			}
			else{
				let triplesWithLink: Array<Triple> = this.LINKS
					.filter(x => findLinkId(x.target) == findLinkId(newLink.source) && x.type != newLink.type)
					.map(x => {
						let sub: Node = this.NODES.find(y => y.id == findLinkId(x.source));
						let rel: Node = this.NODES.find(y => y.id == findLinkId(newLink.source));
						let obj: Node = this.NODES.find(y => y.id == findLinkId(newLink.target));
						return { 
							id: this.getGraphId(),
							value: [sub.value, rel.value, obj.value],
							config: {
								subId: sub.id,
								relId: rel.id,
								objId: obj.id,
								sourceId: x.id,
								targetId: newLink.id
						}}
					})
				// if not in this.TRIPLES add it
				triplesWithLink.forEach(n => {
					let sameTriple = this.TRIPLES.find(x => x.value.join() == n.value.join())
					if((sameTriple && n.value[1] == '???' && sameTriple.config.relId != n.config.relId) || !sameTriple ){
						this.TRIPLES.push(n)
					}
				})
			}
		}

	// REMOVE
		removeNodeOrdered(nodeId) {
			removeNodeOrdered(this, this.getGraphObject(), nodeId)
			//this.NODES = ng.nodes;
			//this.LINKS = ng.links;
			//this.TRIPLES = ng.triples;
			//console.log(this.TRIPLES, this.NODES)
		}

		removeNodesOrdered(nodeIds) {
			removeNodesOrdered(this, this.getGraphObject(), nodeIds);
		}

		removeLinkOrdered(linkId) {
			let ng = removeLinkOrdered(this.getGraphObject(), linkId)
			this.NODES = ng.nodes;
			this.LINKS = ng.links;
			this.TRIPLES = ng.triples;	
		}

		removeLink(linkId) {
			let actions = removeLink(this.getGraphObject(), linkId)
			commitLog(this, actions);
		}

		removeTriple(triple) {
			let tid = this.TRIPLES.find(x => x.value[0] == triple.value[0] && x.value[1] == triple.value[1] && x.value[2] == triple.value[2]).id;
			console.assert(tid !== undefined, `Error no triple found for ${triple.value.join(' ')}`)
			let actions = this.remTripleActions(tid);
			commitLog(this, actions);		
			return this
		}	

	// FIND
		findConceptNode(cid: string) : Node {
			return this.NODES.find(x => x.id == cid) 
		}

		findConceptId(cvalue: string) : string {
			//resolve capitals
			let potSub = this.TRIPLES.find(x => x.value[0] == cvalue || x.value[0].toLowerCase() == cvalue.toLowerCase() )
			let potObj = this.TRIPLES.find(x => x.value[2] == cvalue || x.value[2].toLowerCase() == cvalue.toLowerCase())
			return potSub ? potSub.config.subId : potObj ? potObj.config.objId : undefined
		}

		findLinksByValue(so: string, ta: string, type: string) : Array<Link> {
			let linkIds = type == "source" ? this.TRIPLES.filter(x => x.value[0] == so && x.value[1] == ta).map(x => x.config.sourceId) : this.TRIPLES.filter(x => x.value[1] == so && x.value[2] == ta).map(x => x.config.targetId)
			return this.LINKS.filter(x => linkIds.includes(x.id))
		}

		findLinkByValue(so: string, ta: string, type: string) : Link {
			return this.findLinksByValue(so, ta, type).shift()
		}

		findTripleByTerms(checkTriple) : Triple {
			return this.TRIPLES.find(x => x.value[0] == checkTriple[0] && x.value[1] == checkTriple[1] && x.value[2] == checkTriple[2])
		}

	// MERGE

		processConceptSimilarity(lxsm) {
			let ng = processConceptSim(lxsm, {nodes: this.NODES, links: this.LINKS, triples: this.TRIPLES});
			this.NODES = ng.nodes; 
			this.LINKS = ng.links;
			this.TRIPLES = ng.triples;
			return this;
		}

		processRelationSimilarity(lxsm, ruleType) {
			//processRelationSim(lxsm, {nodes: this.NODES, links: this.LINKS, triples: this.TRIPLES});
			lxsm.triples.forEach((t: any) => { //t is from the ari submission
				let ot = this.TRIPLES.find(x => x.id === t.id) //actual triple present
				if(ot.value[1] !== t.predicate){
					// console.log("ot: ", ot, " t: ", t);
					let nt: RawTriple;
					if(ruleType == "semantic_similarity") nt = [ot.value[0], lxsm.word, ot.value[2]];
					else nt = [t.subject, t.predicate, t.object];
					
					let remActions = this.remTripleActions(t.id)				
					remActions.forEach(a => this.commitAction(a));

					let addActions = getTripleActions(this, nt, {nodes: this.NODES, links: this.LINKS, triples: this.TRIPLES})
					addActions.forEach(a => this.commitAction(a));		
					
					//console.log("t", remActions, addActions)
				}
			})
			
			return this;
		}

		processMergeNodes(sourceNodeId, targetNodeIds) {
			reduceOneToManyConcept(sourceNodeId, targetNodeIds, {nodes: this.NODES, links: this.LINKS, triples: this.TRIPLES})
			return this
		}

	// UTIL
		getGraphId(type?: string) : string {
			let newId = getGraphId(type);
			while(this.NODES.map(n => n.id).includes(newId) || this.LINKS.map(l => l.id).includes(newId) ||
			this.TRIPLES.map(t => t.id).includes(newId)){
				newId = getGraphId(type);
			}
		  	return newId;
		}

}

//// PURE FNS

function commitAction(){

}

function commitLog(that, steps) {
	that.LOG.push(steps)
	steps.forEach(x => { that.commitAction(x) });
	console.log("current log:", that.LOG)
}

function getMidpoint (x1,y1,x2,y2){ return [(x1+x2)/2,(y1+y2)/2]; };

// UTILITIES
	function getGraphId(type?: string) : string {
	  let abc = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"]
	  let snip = new Date().getTime()+"";
	  snip = snip.substring(snip.length - 6, snip.length - 1);
	  let first = (+snip.substring(2,5)) + Math.floor(Math.random()*400);
	  let last = (+snip.substring(0,2)) + Math.floor(Math.random()*40);
	  let ii = (+first) % 26;
	  let jj = (+last) % 13;
	  let lLetter = type || abc[jj];
	  let rLetter = abc[ii];
	  return lLetter+first+"-"+rLetter+last;
	}

	function formatNodeText(rawText: string): string {
		let formatted = rawText.toLowerCase()
		return formatted
	}

	function isTripleinJoin(triple, triples): boolean {
		let isJoin = false;
		triples.forEach(t => {
			if(t.id != triple.id && t.config.relId == triple.config.relId && t.config.objId == triple.config.objId && t.config.targetId == triple.config.targetId){
				isJoin = true
			}
		})
		return isJoin;
	}

	function isTripleinFork(triple, triples){
		let isFork = false;
		triples.forEach(t => {
			if(t.id != triple.id && t.config.relId == triple.config.relId && t.config.subId == triple.config.subId && t.config.sourceId == triple.config.sourceId){
				isFork = true
			}
		})
		return isFork;
	}

	function findLinkId(ref) {
		return typeof ref == 'string' ? ref : ref.id 
	}

	function findNodeByValue(cmap, text, type, changedNodeId?) {
		if(changedNodeId) {
			let existingNode = cmap.nodes.filter(x => x.value === text && x.type === type);
			// let existingNode = cmap.nodes.find(x => x.value === text && x.type === type);
			
			if(existingNode.length == 1) return existingNode[0];
			else{
				existingNode = cmap.nodes.find(x => x.value === text && x.type === type);
				while(existingNode.id == changedNodeId){
					existingNode = cmap.nodes.find(x => x.value === text && x.type === type);
				}
				return existingNode;
			}
		}
		else {
			return cmap.nodes.find(x => x.value.toLowerCase() === text.toLowerCase() && x.type === type);
		}
	}

	function findLinksByValue(cmap, source, target) {
		return cmap.links.filter(x => {
			return cmap.nodes.find(y => y.id == findLinkId(x.source)).value === source
			&& cmap.nodes.find(y => y.id == findLinkId(x.target)).value === target
		})
	}

	function findLinkByValue(cmap, source, target) {
		let r = findLinksByValue(cmap, source, target)
		return r.length > 0 ? r[0] : null;
	}

	function findTripleByValue(cmap, cmapValue) {
		return cmap.triples.find(x => x.value.join() === cmapValue.join())
	}

// PROCESS
	function preformatSimpleTriples(rawTriples: Array<[string, string, string]>): Array<[string, string, string]> {
		rawTriples.forEach(x => x.forEach(v => {v = v.replace(/\s+/g, " ")}))
		return rawTriples
	}

	function processIDMap(metaTriples: Array<Triple>) : [Array<Node>, Array<Link>] {
		let idMap = metaTriples.reduce((s,c) => {
			// node data
			s[c.config.subId] = s[c.config.subId] || {value: c.value[0], type: "concept", id: c.config.subId};
			s[c.config.relId] = s[c.config.relId] || {value: c.value[1], type: "relation", id: c.config.relId};
			s[c.config.objId] = s[c.config.objId] || {value: c.value[2], type: "concept", id: c.config.objId};
			// link data
			s[c.config.sourceId] = s[c.config.sourceId] || {source: c.config.subId, target: c.config.relId, type: "source", id: c.config.sourceId};
			s[c.config.targetId] = s[c.config.targetId] || {source: c.config.relId, target: c.config.objId, type: "target", id: c.config.targetId};
			
			return s;
		}, {});

		let nodes = (<Array<Node>>Object.values(idMap))
			.filter((x: Node) => ["concept", "relation"].includes(x.type))
			.map(x => <Node>x)

		let links = (<Array<Link>>Object.values(idMap))
			.filter((x: Link) => ["source", "target"].includes(x.type))
			.map(x => <Link>x)
		return [nodes, links]
	}

	function getForkData(metaTriples: Array<Triple>): ForkJoinData {
		let forkMap = metaTriples.reduce((s,c,i) => {
			let exists = Object.keys(s).find(x => s[x].source === c.value[0] && s[x].target === c.value[1])

			if(exists){
				s[exists].members.push(c.id);
			} else {
				let predId = getGraphId();
				s[predId] = {members:[], source: c.value[0], target: c.value[1]};
				s[predId].members.push(c.id);
			}
			return s
		}, {})
		
		//remove any forks with a single member
		Object.keys(forkMap)
			.filter(x => forkMap[x].members.length == 1)
			.forEach(x => { delete forkMap[x] })

		return forkMap
	}

	function getJoinData(metaTriples: Array<Triple>): ForkJoinData {
		let joinMap = metaTriples.reduce((s,c,i) => {
			let exists = Object.keys(s).find(x => s[x].source === c.value[1] && s[x].target === c.value[2])
			
			if(exists){
				s[exists].members.push(c.id)
			} else {
				let joinId = getGraphId()
				s[joinId] = {members: [], source: c.value[1], target: c.value[2]}
			}
			return s
		}, {})

		//remove any forks with a single member
		Object.keys(joinMap)
			.filter(x => joinMap[x].members.length == 1)
			.forEach(x => { delete joinMap[x] })

		return joinMap
	}

	function getCmapFromSimpleTriples(triples: Array<[string, string, string]>): Cmap {
		let metaTriples = triples.map(x => ({id: getGraphId("t"), value: x, config: {subId: undefined, relId: undefined, objId: undefined, sourceId: undefined, targetId: undefined, fork: undefined, join: undefined}}))

		//concepts
		let nm = metaTriples.reduce((s,c) => {
			if(!s.includes(c.value[0])){ s.push(c.value[0])}
			if(!s.includes(c.value[2])){ s.push(c.value[2])}
			return s
		}, []).reduce((s,c) => {
			s[c] = getGraphId()
			return s
		}, {})

		//fork data
		let fm = getForkData(metaTriples)
		Object.keys(fm).forEach(x => {
			let sourceId = getGraphId("so")

			fm[x].members.forEach(tid => {
				let ct = metaTriples.find(y => y.id === tid)
				ct.config.fork = true;
				ct.config.subId = nm[ct.value[0]];
				ct.config.relId = x;
				ct.config.objId = nm[ct.value[2]];
				ct.config.sourceId = sourceId;
				ct.config.targetId = getGraphId("ta");
			})
		})

		//join data
		let jm = getJoinData(metaTriples)
		Object.keys(jm).forEach(x => {
			let targetId = getGraphId("ta")

			jm[x].members.forEach(tid => {
				let ct = metaTriples.find(y => y.id === tid)
				ct.config.join = true;
				ct.config.subId = nm[ct.value[0]];
				ct.config.relId = x;
				ct.config.objId = nm[ct.value[2]];
				ct.config.sourceId = getGraphId("so");
				ct.config.targetId = targetId;
			})
		})

		//single triple data
		metaTriples.filter(x => !x.config.join && !x.config.fork)
			.forEach(ct => {
				ct.config.subId = nm[ct.value[0]];
				ct.config.relId = getGraphId("r");
				ct.config.objId = nm[ct.value[2]];
				ct.config.sourceId = getGraphId("so");
				ct.config.targetId = getGraphId("ta");
			})

		let [nodes, links] = processIDMap(metaTriples)
		//console.log("getCmapFromSimpleTriples", nodes, links)
		return {nodes: nodes, links: links, triples: metaTriples}
	}

// NEW
	function getNewNode(config) : Node {
		return {
			id: config.id || getGraphId(),
			type: config.type,
			value: formatNodeText(config.value),
			x: config.x,
			y: config.y,
			fx: config.fx,
			fy: config.fy,
			settings: {"dim": false, "superConcept-initial": false, "superConcept-select": false, "SKEItemNumber": [], "disconnectedNode": false, "missingText": false, "incompleteProps": false, "superConcept-map": false, "pronoun": false},
			reusable: config.reusable
		};
	}

	function getNewLink(config): Link {
		return {
			id: getGraphId(),
			type: config.type,
			source: findLinkId(config.source),
			target: findLinkId(config.target),
			settings: {"dim": false, "superConcept-select": false, "undefinedNode": false}
		};
	}

	function getNewTriple(config): Triple {
		return {
			id: config.id || getGraphId(),
			value: config.value,
			config: config.config
		}
	}

// REMOVE

	function removeNodeAtomic(cmap, nodeId) {
		// remove the node, do not update links or triples
	}

	function removeNodeOrdered(that, cmap, nodeId) {
		// remove node + update links + update triples
		// remove unattached links

		let ts = cmap.triples.filter(x => x.config.subId === nodeId || x.config.relId === nodeId || x.config.objId === nodeId).map(x => [GraphActionType.removeTriple, x])
		let ls = cmap.links.filter(x => findLinkId(x.source) === nodeId || findLinkId(x.target) === nodeId).map(x => [GraphActionType.removeLink, x])
		let ns = cmap.nodes.filter(x => x.id == nodeId).map(x => [GraphActionType.removeNode, x])

		let actions = ts.concat(ls).concat(ns)
		console.log(actions)
		commitLog(that, actions)
		//cmap.triples = cmap.triples.filter(x => !(x.config.subId === nodeId || x.config.relId === nodeId || x.config.objId === nodeId))
		//cmap.nodes = cmap.nodes.filter(x => x.id !== nodeId)
		//cmap.links = cmap.links.filter(x => !(findLinkId(x.source) === nodeId || findLinkId(x.target) === nodeId))
		//return that.getGraphObject();
	}

	function removeNodesOrdered(that, cmap, nodeIds) {
		let ts = cmap.triples.filter(x => nodeIds.includes(x.config.subId) || nodeIds.includes(x.config.relId) || nodeIds.includes(x.config.objId)).map(x => ["remove triple", x])
		let ls = cmap.links.filter(x => nodeIds.includes(findLinkId(x.source)) || nodeIds.includes(findLinkId(x.target))).map(x => [GraphActionType.removeLink, x])
		let ns = cmap.nodes.filter(x => nodeIds.includes(x.id)).map(x => [GraphActionType.removeNode, x])

		let actions = ts.concat(ls).concat(ns)
		console.log(actions)
		commitLog(that, actions)
	}

	function removeLink(cmap, linkId) {
		// remove link + any triples that include it
		// convert into action set
		let actions = []

		cmap.triples
			.filter(x => x.config.sourceId === linkId || x.config.targetId === linkId)
			.forEach(t => {
				actions.push([GraphActionType.removeTriple, t])				
			})

		cmap.links.filter(x => x.id == linkId)
			.forEach(x => {
				actions.push([GraphActionType.removeLink, x])
			})

			return actions

			

		//cmap.triples = cmap.triples.filter(x => !(x.config.sourceId === linkId || x.config.targetId === linkId))
		//cmap.links = cmap.links.filter(x => x.id !== linkId)
		//return cmap;

	}

	function removeLinkOrdered(cmap, linkId) {
		// remove link + update nodes + update triples
		// remove unattached nodes
		console.log("remove link ordered")

		let removeTriples = cmap.triples.filter(x => x.config.sourceId === linkId || x.config.targetId === linkId);
		console.log("triples to remove", removeTriples);

		let isSharedRelation = cmap.triples.filter(t => !removeTriples.find(y => y.id == t.id))
														.find(z => removeTriples.find(y => y.config.relId == z.config.relId))

		console.log("shares relation", isSharedRelation);

		let removeNodes = []
		let removeLinks = []

		removeTriples.forEach(triple => {
			// check that each item in config can be removed.
			// do not remove any items that are still in the graph
			Object.entries(triple.config).forEach(([type, id]) => {
				// subId, objId
				if(isSharedRelation){
					if(type == "sourceId" && isSharedRelation.config.sourceId != id) removeLinks.push(id);
					if(type == "targetId" && isSharedRelation.config.targetId != id) removeLinks.push(id);
					if(type == "relId" && !isSharedRelation) removeNodes.push(id);
				}
				else {
					let c = triple.config;
					removeLinks.push(c.sourceId, c.targetId);
					removeNodes.push(c.relId);
				}
				// relId
				// sourceId, targetId			
			})
		})

		console.log("remove nodes", removeNodes)
		console.log("remove links", removeLinks)
		/*let removeNodes = removeTriples.reduce((s,c) => s.concat(c.config.relId), [])
			.reduce((s,c) => { 
				if(!s.includes(c)) s.push(c); 
				return s
			}, []);
		//console.log("nodes to remove", removeNodes.map(x => x.id).join())

		let removeLinks = removeTriples.reduce((s,c) => s.concat(c.config.sourceId, c.config.targetId), [])
			.reduce((s,c) => { 
				if(!s.includes(c)) s.push(c);
				return s
			}, []);
		//console.log("links to remove", removeLinks.map(x => x.id).join())
		*/

		cmap.triples = cmap.triples.filter(x => !(x.config.sourceId === linkId || x.config.targetId === linkId))
		cmap.nodes = cmap.nodes.filter(x => !removeNodes.includes(x.id))
		cmap.links = cmap.links.filter(x => !removeLinks.includes(x.id))
		return cmap;
	}

// UNDO

// TRIPLE ACTIONS
	function getTripleActions(that, newRawTriple: Array<string>, cmap: Cmap, config?: TripleConfig): Array<GraphAction> {
		let actions = [];

		if(config){
			let sub: any;
			if(!config.subId){
				let newSub = getNewNode({type: "concept", value: newRawTriple[0]});
				actions.push([GraphActionType.addNode, newSub])
				sub = newSub;
				config.subId = sub.id;
			}
			else sub = cmap.nodes.find(x => x.id == config.subId);
			let obj: any;
			if(!config.objId){
				let newObj = getNewNode({type: "concept", value: newRawTriple[2]});
				actions.push([GraphActionType.addNode, newObj])
				obj = newObj;
				config.objId = obj.id;
			}
			else obj = cmap.nodes.find(x => x.id == config.objId);
			let rel: any;
			if(!config.relId){
				let newRel = getNewNode({type: "relation", value: newRawTriple[1]});
				actions.push([GraphActionType.addNode, newRel])
				rel = newRel;
				config.relId = rel.id;
			}
			else rel = cmap.nodes.find(x => x.id == config.relId);

			if(!config.sourceId) {
				let newSource: Link;
				newSource = getNewLink({type: "source", source: sub.id, target: config.relId});
				config.sourceId = newSource.id;
				actions.push([GraphActionType.addLink, newSource]);
			}
			else if(!config.targetId) {
				let newTarget: Link;
				newTarget = getNewLink({type: "target", source: config.relId, target: obj.id});
				config.targetId = newTarget.id;
				actions.push([GraphActionType.addLink, newTarget]);
			}

			let newTriple: Triple = getNewTriple({value: newRawTriple, config: config});
			actions.push([GraphActionType.addTriple, newTriple]);
		}
		else{
			//console.log(cmap.nodes);
			let sub = findNodeByValue(cmap, newRawTriple[0], "concept")
			//console.log(sub);
			if(!sub) {
				let newSub = getNewNode({type: "concept", value: newRawTriple[0]});
				actions.push(["add node", newSub])
				sub = newSub;
			}
			let obj = findNodeByValue(cmap, newRawTriple[2], "concept");
			if(!obj){
				let newObj = getNewNode({type: "concept", value: newRawTriple[2]});
				actions.push(["add node", newObj])
				obj = newObj;
			}
			let sourceLink; let targetLinks;
			if(newRawTriple[0] != '???' && newRawTriple[1] != '???') sourceLink = findLinkByValue(cmap, newRawTriple[0], newRawTriple[1]);
			if(newRawTriple[1] != '???' && newRawTriple[2] != '???') targetLinks = findLinksByValue(cmap, newRawTriple[1], newRawTriple[2]);

			//console.log(".", sourceLink, targetLinks)
			
			if(findTripleByValue(cmap, newRawTriple)){
				//exists...
			}
			else if(sourceLink){
				// console.log("source link")
				//return;
				let sourceTriples = cmap.triples.filter(x => x.config.sourceId == sourceLink.id);
				//console.log(sourceTriples);
				let c = sourceTriples[0].config;
				if(sourceTriples.length > 1){
					// fork				
					let newTarget: Link = getNewLink({type: "target", source: c.relId, target: obj.id});
					let newTriple: Triple = getNewTriple({value: newRawTriple, config: {subId: sub.id, relId: c.relId, objId: obj.id, sourceId: c.sourceId, targetId: newTarget.id, fork: true}})
					actions.push(["add link", newTarget])
					actions.push(["add triple", newTriple])
				}
				else {
					if(c.join){
						let newRelation: Node = getNewNode({type: "relation", value: newRawTriple[1]}) 
						let newSource: Link = getNewLink({type: "source", source: sub.id, target: newRelation.id})
						let newTarget: Link = getNewLink({type: "target", source: newRelation.id, target: obj.id})
						let oldTarget: Link = getNewLink({type: "target", source: newRelation.id, target: c.objId})
						let newTriple: Triple = getNewTriple({value: newRawTriple, config: {subId: sub.id, relId: newRelation.id, objId: obj.id, sourceId: newSource.id, targetId: newTarget.id, fork: true}})
						actions.push(["add node", newRelation])
						actions.push(["add link", newSource])
						actions.push(["add link", newTarget])
						actions.push(["add link", oldTarget])
						actions.push(["add triple", newTriple])
						
						let sl = that.LINKS.find(x => x.id === c.sourceId)
						actions.push([GraphActionType.removeLink, sl])
						actions.push(["update triple", sourceTriples[0].id, "relId", newRelation.id])
						actions.push(["update triple", sourceTriples[0].id, "sourceId", newSource.id])
						actions.push(["update triple", sourceTriples[0].id, "targetId", oldTarget.id])		
						actions.push(["update triple", sourceTriples[0].id, "fork", true])
						actions.push(["update triple", sourceTriples[0].id, "join", false])

						let otherJoins = cmap.triples.filter(x => x.config.relId === c.relId && x.id !== sourceTriples[0].id);
						if(otherJoins.length == 1){
							actions.push(["update triple", otherJoins[0].id, "join", false])
						}
					}
					else {
						let newTarget: Link = getNewLink({type: "target", source: c.relId, target:  obj.id});
						let newTriple: Triple = getNewTriple({value: newRawTriple, config: {subId: sub.id, relId: c.relId, objId: obj.id, sourceId: c.sourceId, targetId: newTarget.id, fork: true}});
						actions.push(["add link", newTarget])
						actions.push(["add triple", newTriple])
						actions.push(["update triple", sourceTriples[0].id, "fork", true])
						actions.push(["update triple", sourceTriples[0].id, "join", false])
					}
				}
			}
			else if(targetLinks && targetLinks.length > 0){
				
				let targetTriples = cmap.triples.filter(x => x.config.targetId === targetLinks[0].id)
				//console.log("target link", targetTriples)
				let c = targetTriples[0].config;
				if(targetLinks.length > 1 && targetTriples.find(x => x.config.join || isTripleinJoin(x, cmap.triples))) {
					//look for join
					let cc = targetTriples.find(x => x.config.join || isTripleinJoin(x, cmap.triples)).config
					let newSource: Link = getNewLink({type: "source", source: sub.id, target: cc.relId})
					let newTriple: Triple = getNewTriple({value: newRawTriple, config: {subId: sub.id, relId: cc.relId, objId: obj.id, sourceId: newSource.id, targetId: cc.targetId, join: true}})
					//actions.push(["add node", newRelation])
					actions.push(["add link", newSource])
					//actions.push(["add link", newTarget])
					actions.push(["add triple", newTriple])
				}
				else if(c.join) {
					//new relation
					//let newRelation = getNewNode({type: "relation", value: newRawTriple[1]})
					//let newSource: Link = getNewLink({type: "source", source: sub.id, target: newRelation.id})
					let newSource: Link = getNewLink({type: "source", source: sub.id, target: c.relId})
					//let newTarget: Link = getNewLink({type: "target", source: newRelation.id, target: obj.id})
					//let newTriple: Triple = getNewTriple({value: newRawTriple, config: {subId: sub.id, relId: newRelation.id, objId: obj.id, sourceId: newSource.id, targetId: newTarget.id, fork: true}})
					let newTriple: Triple = getNewTriple({value: newRawTriple, config: {subId: sub.id, relId: c.relId, objId: obj.id, sourceId: newSource.id, targetId: c.targetId, join: true}})
					//actions.push(["add node", newRelation])
					actions.push(["add link", newSource])
					//actions.push(["add link", newTarget])
					actions.push(["add triple", newTriple])

					//actions.push(["update triple", targetTriples[0].id, "fork", true])
					//actions.push(["update triple", targetTriples[0].id, "join", false])
					//actions.push(["update triple", targetTriples[0].id, "sourceId", newSource.id])
					//actions.push(["update triple", targetTriples[0].id, "relId", newRelation.id])
					//actions.push(["update triple", targetTriples[0].id, "targetId", newTarget.id])
				}
				else if(c.fork) {
					// new relation
					let newRelation = getNewNode({type: "relation", value: newRawTriple[1]})
					let newSource: Link = getNewLink({type: "source", source: sub.id, target: newRelation.id})
					let newTarget: Link = getNewLink({type: "target", source: newRelation.id, target: obj.id})
					let newTriple: Triple = getNewTriple({value: newRawTriple, config: {subId: sub.id, relId: newRelation.id, objId: obj.id, sourceId: newSource.id, targetId: newTarget.id}})
					actions.push(["add node", newRelation])
					actions.push(["add link", newSource])
					actions.push(["add link", newTarget])
					actions.push(["add triple", newTriple])
				}
				else {
					// create join
					let newSource: Link = getNewLink({type: "source", source: sub.id, target: c.relId})
					let newTriple: Triple = getNewTriple({value: newRawTriple, config: {subId: sub.id, relId: c.relId, objId: obj.id, sourceId: newSource.id, targetId: c.targetId, join: true}})
					actions.push(["add link", newSource])
					actions.push(["add triple", newTriple])
					actions.push(["update triple", targetTriples[0].id, "join", true])
					actions.push(["update triple", targetTriples[0].id, "fork", false])
				}
			}
			else {
				let newRelation: Node = getNewNode({type: "relation", value: newRawTriple[1]})
				let newSource: Link = getNewLink({type: "source", source: sub.id, target: newRelation.id})
				let newTarget: Link = getNewLink({type: "target", source: newRelation.id, target: obj.id})
				let newTriple: Triple = getNewTriple({value: newRawTriple, config: {subId: sub.id, relId: newRelation.id, objId: obj.id, sourceId: newSource.id, targetId: newTarget.id}})

				actions.push(["add node", newRelation])
				actions.push(["add link", newSource])
				actions.push(["add link", newTarget])
				actions.push(["add triple", newTriple])
			}
		}

		return actions
	}

	function updateTripleActions(cmap, currentTriple: Triple, newTripleValue: [string, string, string]) {
		
		let differentSub = currentTriple.value[0] !== newTripleValue[0];
		let differentRel = currentTriple.value[1] !== newTripleValue[1];
		let differentObj = currentTriple.value[2] !== newTripleValue[2];

		if(differentSub) differentSubCheck(cmap, currentTriple);
		//if(differentRel) differentRelCheck(cmap, currentTriple);
		//if(differentObj) differentObjCheck(cmap, currentTriple);

		// check new sub
	}

	function differentSubCheck(cmap, currentTriple: Triple) {
		let log = [];
		let otherTriples = cmap.triples
		//check sourceId in other triples

		// if no other triples --> remove it
		// if in other triples as a join --> checkJoin
		// else remove sourceLink
		return log;
	}

// TEXT SERVICE UPDATES

	function processConceptSim(lxsm, c: Cmap): Cmap {
		let cmap = c; //deepCloneCmap(c);
	  let targetNodeIds = lxsm.triples
	    .map(t => {
	      let trip = cmap.triples.find(x => x.id == t.id);
	      return t.nodeType === "subject" ? trip.config.subId : trip.config.objId;
	    })
	    .filter(n => n !== lxsm.id)
	    .reduce((s,c) => !s.includes(c) ? s.concat(c) : s, [])

	  return reduceOneToManyConcept(lxsm.id, targetNodeIds, cmap)
	}

	//function processRelationSim(lxsm, cmap: Cmap): Cmap {
		//lxsm.triples have the updated content...
	//}

	function reduceOneToManyConcept(sourceNodeId, targetNodeIds, cmap): Cmap {
	  return targetNodeIds.reduce((s,c) => reduceOneToOneConcept(sourceNodeId, c, s), cmap)
	}

	function reduceOneToOneConcept(sourceNodeId, targetNodeId, cmap): Cmap {
		
	  let sourceNode = cmap.nodes.find(n => n.id === sourceNodeId);
	  
	  cmap.triples.forEach(t => {
	    if(targetNodeId == t.config.subId) {
		  t.config.subId = sourceNodeId;
	      t.value[0] = sourceNode.value;
	      cmap.links
	        .filter(l => l.id == t.config.sourceId)
	        .forEach(l => { l.source = sourceNodeId })
	    }
	    else if (targetNodeId == t.config.objId) {
	      t.config.objId = sourceNodeId;
	      t.value[2] = sourceNode.value;
	      cmap.links
	        .filter(l => l.id == t.config.targetId)
	        .forEach(l => { l.target = sourceNodeId })
	    }
	  })

	  let linkMap = cmap.links.reduce((s,c) => {
	  	let cs = findLinkId(c.source)
	  	let ct = findLinkId(c.target)
	    s[`${cs}${ct}`] = s[`${cs}${ct}`] || [];
	    s[`${cs}${ct}`].push(c.id);
	    return s
	  }, {})

	  let linkMapValues = <Array<Array<string>>>Object.values(linkMap)

	  linkMapValues
	    .filter(x => x.length > 1)
	    .forEach(duplicateLinks => {
	      // x = list of link ids
	      //duplicate links
	      //choose first id as source, replace ids in triples for other link and remove
	      let sourceLinkId = duplicateLinks.shift();
	      cmap.triples
	        .forEach((t: Triple) => {
	          if(duplicateLinks.includes(t.config.sourceId)) {
	            t.config.sourceId = sourceLinkId;
	          }
	          else if(duplicateLinks.includes(t.config.targetId)) {
	            t.config.targetId = sourceLinkId
	          }
	        })

	      cmap.links = cmap.links.filter(l => !duplicateLinks.includes(l.id))
	    })

	  //check for duplicate triples
	  let tripleMap = cmap.triples.reduce((s,c) => {
	  	let checklist = [c.config.subId, c.config.relId, c.config.objId, c.config.sourceId, c.config.targetId]
	    let f = checklist.join("")
	    s[f] = s[f] || []
	    s[f].push(c.id)
	    return s 
	  }, {})

	  let tripleMapValues = <Array<Array<string>>>Object.values(tripleMap);

	  tripleMapValues
	    .filter(x => x.length > 1)
	    .forEach((duplicateTriples: Array<string>) => {

	      let sourceTriple = duplicateTriples.shift();
	      //console.log("found duplicate triples", sourceTriple, duplicateTriples.join())
	      cmap.triples = cmap.triples.filter(x => {
	      	let t = !duplicateTriples.includes(x.id)
	      	//if(!t) console.log("removing...", x.id)
	      	return t
	      })      

	    })
	  cmap.nodes = cmap.nodes.filter(n => targetNodeId !== n.id);
	  //console.log(cmap)
	  //return null
	  return cmap
	}

	function reduceOneToManyRelation(sourceNodeId, targetNodeIds, cmap: Cmap): Cmap {
		return targetNodeIds.reduce((s,c) => reduceOneToOneRelation(sourceNodeId, c, s), cmap)	
	}

	function reduceOneToOneRelation(sourceNodeId, targetNodeId, cmap): Cmap {	
		let sourceNode = cmap.nodes.find(n => n.id === sourceNodeId);
		cmap.triples.forEach(t => {
			if(t.config.relId === targetNodeId) {
				//console.log("match", targetNodeId, t)
				//replace all instances of the targetNode
				t.config.relId = sourceNodeId;
				t.value[1] = sourceNode.value;

				cmap.links
	        .filter(l => l.id == t.config.sourceId)
	        .forEach(l => { l.target = sourceNodeId })

	      cmap.links
	        .filter(l => l.id == t.config.targetId)
	        .forEach(l => { l.source = sourceNodeId })			
			}
		})

		//check for duplicate sourceLink and targetLinks
		let linkMap = cmap.links.reduce((s,c) => {
			s[`${c.source}${c.target}`] = s[`${c.source}${c.target}`] || [];
			s[`${c.source}${c.target}`].push(c.id)
			return s;
		}, {})

		console.log(linkMap)

		let linkMapValues = <Array<Array<string>>>Object.values(linkMap);

		linkMapValues
			.filter((x: Array<string>) => x.length > 1)
			.forEach((duplicateLinks: Array<string>) => {
				//use first id as the source node
				let sourceLinkId = duplicateLinks.shift()
				//replace other ids with source

				cmap.triples
	        .forEach((t: Triple) => {
	          if(duplicateLinks.includes(t.config.sourceId)) {
	            t.config.sourceId = sourceLinkId;
	          }
	          else if(duplicateLinks.includes(t.config.targetId)) {
	            t.config.targetId = sourceLinkId
	          }
	        })

	      cmap.links = cmap.links.filter(l => !duplicateLinks.includes(l.id))
	    })

	  //check for duplicate triples
	  let tripleMap = cmap.triples.reduce((s,c) => {
	    let f = Object.values(c.config).join("")
	    s[f] = s[f] || []
	    s[f].push(c.id)
	    return s 
	  }, {})

	  let tripleMapValues = <Array<Array<string>>>Object.values(tripleMap);

	  tripleMapValues
	    .filter(x => x.length > 1)
	    .forEach((duplicateTriples: Array<string>) => {
	      let sourceTriple = duplicateTriples.shift();
	      cmap.triples = cmap.triples.filter(x => !duplicateTriples.includes(x.id))      
	    })

	  cmap.nodes = cmap.nodes.filter(n => targetNodeId !== n.id);

	  return cmap
	}

	function processDuplicateLinks(sourceLinkId, otherLinkIds, cmap) {

	}
