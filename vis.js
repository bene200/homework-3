var redditSvg;
var previousData;

var POLL_SPEED = 20000;



var width = 1300,
    height = 700;

var force = d3.layout.force()
    .charge(-700)
    .linkDistance(100)
    .size([width, height]);

var links;
var nodes;

function redditVis() {
  // setup a poll requesting data, and make an immediate request
  setInterval(requestData,POLL_SPEED);
  requestData();

  // initial setup only needs to happen once 
  // - we don't want to append multiple svg elements
  redditSvg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);
}

function requestData() {
  // our jsonp url, with a cache-busting query parameter
  d3.jsonp("https://www.reddit.com/.json?jsonp=runVis&noCache=" + Math.random());
}

//////// PLEASE EDIT runVis /////////
/////////////////////////////////////
/////////////////////////////////////

function runVis(data) {
  redditSvg.selectAll("*").remove();
  // d3 never does anything automagical to your data
  // so we'll need to get data into the right format, with the
  // previous values attached
  var formatted = formatRedditData(data,previousData);
  
  links = [];
  for (i = 0; i < 25; i++) { 
    links.push({source: formatted[i].id, target: formatted[i].subreddit, radius: formatted[i].score/500, ttl: formatted[i].title, type: "suit", diff: formatted[i].diff});
    links.push({source: formatted[i].subreddit, target: "main", radius: 3, ttl: formatted[i].subreddit, type: "suit", diff: 0});
  }

  nodes = {};
  // Compute the distinct nodes from the links.
  
  links.forEach(function(link) {
    link.source = nodes[link.source] || (nodes[link.source] = {name: link.source, radius: 6, ttl: "", diff: 0});
    link.target = nodes[link.target] || (nodes[link.target] = {name: link.target, radius: 6, ttl: "", diff: 0});
  });

  for(i = 0; i < links.length; i++){
    nodes[links[i].source.name].radius = links[i].radius;
    nodes[links[i].source.name].ttl = links[i].ttl;
    nodes[links[i].source.name].diff= links[i].diff;
  }

  force
      .nodes(d3.values(nodes))
      .links(links)
      .on("tick", tick)
      .start();

  redditSvg.append("defs").selectAll("marker")
    .data(["suit", "licensing", "resolved"])
  .enter().append("marker")
    .attr("id", function(d) { return d; })
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 15)
    .attr("refY", -1.5)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
  .append("path")
    .attr("d", "M0,-5L10,0L0,5");

var path = redditSvg.append("g").selectAll("path")
    .data(force.links())
  .enter().append("path")
    .attr("class", function(d) { return "link " + d.type; })
//    .attr("marker-end", function(d) { return "url(#" + d.type + ")"; });

var circle = redditSvg.append("g").selectAll("circle")
    .data(force.nodes())
  .enter().append("circle")
    .attr("r", function(d) {return d.radius; })
    .style("fill", function(d) {
      if(d.diff>0){
        return "green";
      }
      else if(d.diff<0){
        return "red";
      }
      else {
        return "blue";
      }
    })
    .call(force.drag);

var text = redditSvg.append("g").selectAll("text")
    .data(force.nodes())
  .enter().append("text")
    .attr("x", 8)
    .attr("y", ".31em")
    .text(function(d) { return d.ttl; });

  function tick() {
  path.attr("d", linkArc);
  circle.attr("transform", transform);
  text.attr("transform", transform);
  }

  function linkArc(d) {
    var dx = d.target.x - d.source.x,
        dy = d.target.y - d.source.y,
        dr = Math.sqrt(dx * dx + dy * dy);
    //return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
    return "M" + d.source.x   + " " + d.source.y + " " + d.target.x + " " + d.target.y;
  }

  function transform(d) {
    return "translate(" + d.x + "," + d.y + ")";
  }
  /*
  // select our stories, pulling in previous ones to update
  // by selecting on the stories' class name
  var stories = redditSvg
     .selectAll("text")
     // the return value of data() is the update context - so the 'stories' var is
     // how we refence the update context from now on
     .data(formatted,function(d) {
       // prints out data in your console id, score, diff from last pulling, text
       
       //console.log(d.id,d.score,d.diff,d.title);
       // use a key function to ensure elements are always bound to the same 
       // story (especially important when data enters/exits)
       return d.id;
     });
  //data.push(i.toString());
  //console.log(stories.selectAll("test"));
  
  cities = color.domain().map(function(name) {
    return {
      name: name,
      values: data.map(function(d) {
        return {date: d.date, : +d[name]};
      })
    };
  });
  console.log(cities);
  
  // ENTER context
  
  stories.enter()
    .append("text")
    .text(function(d){return d.score + " " + d.diff + " " + d.title})
    .attr("y", function(d,i){return 1.5*i + 1 + "em"})
    .style("color","black");
  
  // UPDATE + ENTER context
  // elements added via enter() will then be available on the update context, so
  // we can set attributes once, for entering and updating elements, here
  stories
    .text(function(d){return d.score + " " + d.diff + " " + d.title})

  // EXIT content
  stories.exit()
    .remove()
  */
}


//////// PLEASE EDI runVis() /////////
/////////////////////////////////////
/////////////////////////////////////


function formatRedditData(data) {
  // dig through reddit's data structure to get a flat list of stories
  var formatted = data.data.children.map(function(story) {
    return story.data;
  });
  // make a map of storyId -> previousData
  var previousDataById = (previousData || []).reduce(function(all,d) {
    all[d.id] = d;
    return all;
  },{});
  // for each present story, see if it has a previous value,
  // attach it and calculate the diff
  formatted.forEach(function(d) {
    d.previous = previousDataById[d.id];
    d.diff = 0;
    if(d.previous) {
      d.diff = d.score - d.previous.score;
    }
  });
  // our new data will be the previousData next time
  previousData = formatted;
  return formatted;
}

redditVis();
