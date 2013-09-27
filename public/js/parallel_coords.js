var ParallelCoords = function(data, selector, options) {

  var outerWidth = options.outerWidth || 960
  var outerHeight = options.outerHeight || 500

  this.data = data
  this.margins = [30, 10, 10, 10] // Defines margins [top, right, left, bottom]
  this.width = outerWidth - this.margins[1] - this.margins[3]
  this.height = outerHeight - this.margins[0] - this.margins[2]

  this.recode = options.recode;
  this.x = d3
      .scale
      .ordinal()
      .rangePoints([0, this.width], 1)

  this.y = {}
  this.extents = {}

  this.line = d3
      .svg
      .line()

  this.axis = d3
      .svg
      .axis()
      .orient("left")

  this.background = null
  this.foreground = null
  this.circles = null // Circles of the mean

  this.svg = d3
      .select(selector)
      .append("svg:svg")
      .attr("width", outerWidth)
      .attr("height", outerHeight)
      .append("svg:g")
      .attr("transform", "translate(" + this.margins[3] + "," + this.margins[0] + ")")

  this.exclude = {"ParentEducation": []}

  this.dimensions = null // Determined by data later
  // Every dimension in this array will be hidden from view
  this.hiddenDimensions = options.hiddenDimensions
  //Can only be one, this serves to be the dimension that is colored
  this.coloredDimension = options.coloredDimension
  this.coloredCategories = this.getColoredCategories()
  this.properties = options.properties;

  // This variable determines if we compute the mean by Category or not
  this.byCategory = false

  this.colorableDimensions = options.colorableDimensions || []
  this.dimensionData = null // Determined by data later
  this.header = []

  this.dimensionScales = options.dimensionScales || {}
  for (var key in this.dimensionScales) {
    if (this.dimensionScales.hasOwnProperty(key)) {
      this.dimensionScales[key].y = d3
          .scale
          .linear()
          .domain(d3.extent(this.data, function(p) {
            return +p[key]
          }))
          .range(this.dimensionScales[key].range)
    }
  }
  this.data = this.data.map(function(d) {
    for (var key in this.dimensionScales) {
      if (this.dimensionScales.hasOwnProperty(key)) {
        d[key] = this.dimensionScales[key].y(d[key])
      }
    }
    return d
  }.bind(this))

  this.brushTimeout = null;

}

ParallelCoords.prototype.getColoredCategories = function() {
  // This gets all unique categories from the colored dimension
  var categories = []
  this.data.forEach(function(d) {
    if (categories.indexOf(d[this.coloredDimension]) === -1)
      categories.push(d[this.coloredDimension])
  }.bind(this))
  return categories
}

ParallelCoords.prototype.setDomain = function(data) {
  var keys = d3.keys(data[0])
  for (var idx in keys) {
    if (this.hiddenDimensions.indexOf(keys[idx]) === -1)
      this.header.push(d3.keys(data[0])[idx])
  }
  var tmp = this.header[0]
  this.header[0] = this.header[1]
  this.header[1] = tmp
  tmp = this.header[1]
  this.header[1] = this.header[2]
  this.header[2] = tmp
  this.dimensionData = this.header
      .filter(function(d) {
        this.y[d] = d3
            .scale
            .linear()
            .domain(this.extents[d] = d3.extent(this.data, function(p) {
              return +p[d]
            }))
            .range([this.height, 0])
        return d != "name" && this.y[d]
      }.bind(this))

  this.x.domain(this.dimensionData)

}

ParallelCoords.prototype.toggleActivation = function(property, category) {
  if (this.exclude.hasOwnProperty(property)) {
    var index_of_el = this.exclude[property].indexOf(category);
    if (index_of_el > -1) {
      this.exclude[property].splice(index_of_el,1);
    } else {
      this.exclude[property].push(category);
    }
  }
  this.update();
};

/*
 * #_isFiltered
 * Uses the exclude array (see #update for more info) to decide if we should filter datum
 */
ParallelCoords.prototype._isFiltered = function(d, exclude) {
  var isFiltered = false
  for (var property in exclude) {
    if (d.hasOwnProperty(property) && (exclude[property].indexOf(this.properties[property][+d[property]]) > -1)) {
      isFiltered = true;
    }
  }
  return isFiltered;
};

/*
 * #update(exclude)
 *
 * Takes an array of properties and values that are filtered on. For example if you want to filter on region
 * and the value 1, you would pass in this:
 * exclude = [{ property: "region", values: [1] }]
 */
ParallelCoords.prototype.update = function(exclude) {

  this.exclude = exclude == undefined ? this.exclude : exclude

  this.coloredCategories = this.getColoredCategories()

  var actives = this.dimensionData.filter(function(p) {
    return !this.y[p].brush.empty();
  }.bind(this))

  var extents = actives.map(function(p) {
    return this.y[p].brush.extent();
  }.bind(this));

  this.updateMeans(actives, extents)

  this.foreground = d3
      .selectAll(".foreground path")
      .style("stroke", function(d) {
        if (this._isFiltered(d, this.exclude)) {
          return "rgb(200,200,200)";
        } else {
          return this.colorPicker(d[this.coloredDimension]);
        }
      }.bind(this))
      .attr("class", function(d) {
        return d[this.coloredDimension]
      }.bind(this))
      .style("stroke-opacity", function(d) {
        if (this._isFiltered(d, this.exclude)) {
          return ".0";
        } else {
          return ".4";
        }
      }.bind(this))

  this.updateCounts()
}

/*
 * #colorPicker (integer)
 * Takes a integer and returns a color
 * TODO: Use special colors that humans are best at distinguishing.
 */
ParallelCoords.prototype.colorPicker = function(integer) {
  switch(parseInt(integer)) {
    case 0:
      return "blue"
    case 1:
      return "red"
    case 2:
      return "green"
    case 3:
      return "yellow"
    case 4:
      return "purple"
    default:
      return "fuchsia"
  }
}

ParallelCoords.prototype.buttonColorPicker = function(integer) {
  switch(parseInt(integer)) {
    case 0:
      return "btn-blue"
    case 1:
      return "btn-red"
    case 2:
      return "btn-green"
    case 3:
      return "btn-yellow"
    case 4:
      return "btn-purple"
    default:
      return "btn-fuchsia"
  }
}

ParallelCoords.prototype.recodeDimensions = function(data, recode) {
  data.forEach(function(d) {
    for (var dimension in recode) {
      if (recode.hasOwnProperty(dimension)) {
        d[dimension] = recode[dimension][+d[dimension]];
      }
    }
  });
}


ParallelCoords.prototype.jitterDimensions = function(data, dimensions) {
  var multiplier_range = .02;
  var jitter_dict = {};
  dimensions.forEach(function(dimension) {
    minmax = d3.extent(data, function(d) {
      return +d[dimension];
    });
    jitter_by = minmax[1] - minmax[0];
    jitter_by *= multiplier_range;
    jitter_dict[dimension] = jitter_by;
  });
  data.forEach(function(d) {
    dimensions.forEach(function(dimension) {
      var value = +d[dimension] + d3.random.normal(0,0.5)() * jitter_dict[dimension];
      if (value > this.extents[dimension][1])
        value = this.extents[dimension][1]
      else if (value < this.extents[dimension][0])
        value = this.extents[dimension][0]
      d[dimension] = value
    }.bind(this));
  }.bind(this));
}

/*
 * #render
 * Does the initial rendering, only called when object is first created. Use update if changes to the chart
 * need to be made
 */
ParallelCoords.prototype.render = function() {
  this.recodeDimensions(this.data, this.recode);
  this.setDomain(this.data);
  this.jitterDimensions(this.data, ["Income ($)", "10th Grade GPA", "8th Grade GPA"]);

  var means = this.computeMeans()

  this.background = this.svg
      .append("svg:g")
      .attr("class", "background")
      .selectAll("path")
      .data(this.data)
      .enter()
      .append("svg:path")
      .attr("d", this._path.bind(this))
      .style("stroke", function(d) {
        return this.colorPicker(d[this.coloredDimension])
      }.bind(this))

  this.foreground = this.svg
      .append("svg:g")
      .attr("class", "foreground")
      .selectAll("path")
      .data(this.data)
      .enter()
      .append("svg:path")
      .attr("d", this._path.bind(this))
      .attr("class", function(d) {
        return d[this.coloredDimension]
      }.bind(this))
      .style("stroke", function(d) {
        return this.colorPicker(d[this.coloredDimension])
      }.bind(this))

  var circleSelection = this.svg
      .append("svg:g")
      .attr("class", "means")
      .selectAll("circle")
      .data(means)

  circleSelection
      .enter()
      .append("svg:circle")

  this.renderCircles(circleSelection)

  this.dimensions = this.svg
      .selectAll(".dimension")
      .data(this.dimensionData)

  this.dimensions
      .enter()
      .append("svg:g")
      .attr("class", "dimension")
      .attr("transform", function (d) { return "translate(" + this.x(d) + ")" }.bind(this))
      .call(d3.behavior.drag()
      .origin(function(d) { return {x: this.x(d)}; }.bind(this))
      .on("dragstart", this.dragstart.bind(this))
      .on("drag", this.drag.bind(this))
      .on("dragend", this.dragend.bind(this)));

  this.renderAxis()
  this.updateCounts()

}

/*
 * #renderAxis
 * This renders the axis and title information, also adds brush to each axis
 */
ParallelCoords.prototype.renderAxis = function() {
  // Add an axis and title.
  var that = this
  this.dimensions
      .append("svg:g")
      .attr("class", "axis")
      .each(function(d) {
        d3.select(this).call(that.axis.scale(that.y[d])) }
        )
      .append("svg:text")
      .attr("class", "trait")
      .attr("text-anchor", "middle")
      .attr("y", -9)
      .style("cursor", " url(https://mail.google.com/mail/images/2/openhand.cur)")
      .text(String)

  d3.selectAll(".trait")[0].forEach(function(element) {
    var text = ""
    var dim = $(element).text()
    if (dim === "8th Grade Standardized Test Score") {
      text += "Average score on standardized tests in Mathematics, English, Science, and History"
    } else if (dim === "Income ($)") {
      text = "The student's family income"
    } else if (dim === "10th Grade GPA") {
      text = "Approximate high school GPA based on reported grades in Mathematics, English, Science, and Social Studies"
    } else if (dim === "8th Grade GPA") {
      text = "Approximate middle school GPA based on reported grades in Mathematics, English, Science, and Social Studies"
    }
    var options = {
      title: text
    }
    $(element).tooltip(options)
  })

  // Add and store a brush for each axis.
  this.dimensions
      .append("svg:g")
      .attr("class", "brush")
      .each(function(d) {
        d3.select(this).call(that.y[d].brush = d3.svg.brush().y(that.y[d])
            .on("brush", that._brush.bind(that)))
      })
      .selectAll("rect")
      .attr("x", -8)
      .attr("width", 16)

  this.dimensions
      .exit()
      .remove()
}

ParallelCoords.prototype.dragstart = function(d) {
  i = this.dimensionData.indexOf(d);
  floatingDimension = this.svg
      .selectAll(".floatingDimension")
      .data([d])
      .enter()
      .append("svg:g")
      .attr("class", "floatingDimension")
      .attr("transform", function (d) {
        return "translate(" + this.x(d) + ")";
      }.bind(this))

  floatingDimension
      .append("svg:g")
      .attr("class", "axis")
      .call(this.axis.scale(this.y[d]))
      .append("svg:text")
      .attr("class", "trait")
      .attr("text-anchor", "middle")
      .attr("y", -9)
      .style("cursor", "url(https://mail.google.com/mail/images/2/closedhand.cur)")
      .text(String)
}

ParallelCoords.prototype.drag = function(d) {
  floatingDimension.attr("transform", function(d) { return "translate(" + d3.event.x + ")"; });

  this.x.range()[i] = d3.event.x;
  this.dimensionData.sort(function(a, b) { return this.x(a) - this.x(b); }.bind(this));
  //this.dimensions.attr("transform", function(d) { return "translate(" + this.x(d) + ")"; }.bind(this));
  //this.foreground.attr("d", this._path.bind(this));
}

ParallelCoords.prototype.dragend = function(d) {
  floatingDimension.remove()
  this.x.domain(this.dimensionData).rangePoints([0, this.width],1);
  var t = d3.transition().duration(500);
  t.selectAll(".dimension").attr("transform", function(d) { return "translate(" + this.x(d) + ")"; }.bind(this));
  t.selectAll(".foreground path").attr("d", this._path.bind(this));
}

ParallelCoords.prototype._path = function(d) {
  return this.line(this.dimensionData.map(function(p) {
      return [this.x(p), this.y[p](d[p])];
  }.bind(this)));
}

ParallelCoords.prototype.computeMeans = function(data) {
  var activeData = data || this.data
  var means = []
  var datum;

  if (this.byCategory) {
    for (var idx in this.header) {
      for (var jdx in this.coloredCategories) {
        datum = {}
        datum.dimension = this.header[idx]
        datum.mean = d3
            .median(activeData, function(d) {
              if (d[this.coloredDimension] === this.coloredCategories[jdx] &&
                  !this._isFiltered(d, this.exclude) && d[this.header[idx]])
                return +d[this.header[idx]]
            }.bind(this))
        datum.category = this.coloredCategories[jdx]
        if (datum.mean !== undefined)
          means.push(datum)
      }
    }
  } else {
    for (var idx in this.header) {
      datum = {}
      datum.dimension = [this.header[idx]]
      datum.mean = d3
          .median(activeData, function(d) {
            if (!this._isFiltered(d, this.exclude))
              return +d[this.header[idx]]
          }.bind(this))
      if (datum.mean !== undefined)
        means.push(datum)
    }
  }

  return means
}

ParallelCoords.prototype.switchMeanView = function() {
  this.byCategory = this.byCategory ? false : true
  var actives = this.dimensionData.filter(function(p) {
    return !this.y[p].brush.empty();
  }.bind(this))

  var extents = actives.map(function(p) {
    return this.y[p].brush.extent();
  }.bind(this));

  this.updateMeans(actives, extents)

}

ParallelCoords.prototype.renderCircles = function(circleSelection) {

  circleSelection
      .attr("cy", function(d) {
        if (isNaN(d.mean))
          console.log(d)
        return this.y[d.dimension](d.mean)
      }.bind(this))
      .attr("cx", function(d) {
        return this.x(d.dimension)
      }.bind(this))
      .attr("r", 10)
      .style("fill", function(d) {
        if (this.byCategory)
          return this.colorPicker(d.category)
        else
          return "none"
      }.bind(this))
      .style("stroke", "black")
      .style("stroke-width", "4")
      .style("opacity", ".6")

  circleSelection
      .exit()
      .remove()

}

ParallelCoords.prototype.updateCounts = function() {
  this.coloredCategories.forEach(function(i) {
    var count = $("path." + i).filter(function(d) {
      if ($(this).css("display") !== "none" && +$(this).css("stroke-opacity") > 0)
        return d
    }).length
    var category = $("#" + i).text().match(/[^(]+/)[0]
    $("#" + i).text(category + " (" + count + ")")
  })
}

ParallelCoords.prototype.updateMeans = function(actives, extents) {
  // Update means
  activeData = this.data
      .filter(function(d) {
          return actives.every(function(p, i) {
            return extents[i][0] <= d[p] && d[p] <= extents[i][1];
          })
      });

  var means = this.computeMeans(activeData)

  var circleSelection = d3.select(".means").selectAll("circle").data(means)

  circleSelection
      .enter()
      .append("svg:circle")

  this.renderCircles(circleSelection)

}

ParallelCoords.prototype._brush = function() {
  if (this.brushTimeout)
  {
      clearTimeout(this.brushTimeout);
  }
  this.brushTimeout = setTimeout(function()
  {
    var actives = this.dimensionData.filter(function(p) {
      return !this.y[p].brush.empty();
    }.bind(this))

    var extents = actives.map(function(p) {
      return this.y[p].brush.extent();
    }.bind(this));

    this.foreground.style("display", function(d) {
      return actives.every(function(p, i) {
        return extents[i][0] <= d[p] && d[p] <= extents[i][1];
      }) ? null : "none";
    });

    this.updateMeans(actives, extents);
    this.brushTimeout = null;
    this.updateCounts()
  }.bind(this), 80);
}
