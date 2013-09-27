function renderColorableDimensions(dims) {
  var html = ""
  for (var index in dims) {
    html += "<input class=\"dims\" type=\"radio\" name=\"dims\" value=\"" + dims[index] + "\">"
    html += dims[index]
    html += "</input>"
  }

  $("body").append(html)
}

function createCategorySelector(property, categories) {
  var button_el;
  var row_el = document.createElement("tr");
  var td_el = document.createElement("td");
  td_el.id = property;
  td_el.className = "btn-group";
  categories.forEach(function(category, i) {
    button_el = document.createElement("button");
    button_el.type = "button";
    button_el.id = i
    button_el.value = i;
    button_el.className = "btn active " + parallelCoords.buttonColorPicker(i);
    button_el.setAttribute("data-toggle","button");
    button_el.textContent = category;
    span_el = document.createElement("span")
    span_el.textContent = " ()"
    button_el.addEventListener("click", function() {
      parallelCoords.toggleActivation(property, category);
    });
    button_el.appendChild(span_el)
    var text;
    if (category === "High School"){
      text = "Up to a high school level education"
    } else if (category === "College") {
      text = "Up to a 4 year college level education"
    } else {
      text = "Graduate degree"
    }
    var options = {
      title: text
    }
    $(button_el).tooltip(options)
    td_el.appendChild(button_el);
  });
  row_el.appendChild(td_el);
  return row_el;
};

function populatePropertySelector(properties) {
  var row_el;
  var div = document.getElementById("property_selectors");
  var table_el = document.createElement("table");
  for (var property in properties) {
    if (properties.hasOwnProperty(property)) {
      row_el = createCategorySelector(property, properties[property]);
    }
    table_el.appendChild(row_el);
  }
  div.appendChild(table_el);
};

$(document).ready(function() {
  $(".dims").live("change", function() {
    parallelCoords.coloredDimension = $(this).val()
    parallelCoords.update()
  })

  $("#byCategory").live("change", function() {
    parallelCoords.switchMeanView()
  })

  window.parallelCoords = null

  d3.csv("/data/KidsDataUpdate.csv", function(KidsData) {
    var options = {}
    options.colorableDimensions = [
        "FeelGood",
        "Region",
        "ChanceLuckImportant",
        "DoThingsAsWellAsOthers",
        "Misbehaving",
        "ChatAboutActivities",
        "ParentEducation",
        ];
    options.hiddenDimensions = options.colorableDimensions.concat([])

    options.properties = {"ParentEducation": ["High School", "College", "Graduate"]};
    options.recode = {"Income ($)": { 2: 1, 3: 1000, 4: 3000, 5: 5000, 6: 7500, 7: 10000, 8: 15000, 9: 20000, 10: 25000, 11: 35000, 12: 50000, 13: 75000, 14: 100000, 15: 200000 }};
    options.coloredDimension = "ParentEducation"

    parallelCoords = new ParallelCoords(KidsData, "#parallel_coords", options)
    populatePropertySelector(options.properties);

    parallelCoords.render()
    parallelCoords.update()
  })
})
