require([
    "splunkjs/ready!",
    "splunkjs/mvc/simplexml/ready!",
    "underscore",
    "../app/pas_ref_app/components/d3/d3",
    "splunkjs/mvc/searchmanager",
], function(
    mvc,
    ignored,
    _,
    d3,
    SearchManager
) {
    // Display the policy violations in the donut series view.
    // 
    // HACK: Wait until end of the current event loop for the browser
    //       to finish rendering the div in which the donut series
    //       viz will be inserted. If not done, the div will be width
    //       zero which will prevert the viz from calculating how to
    //       render itself.
    window.setTimeout(function() {
        var donutSeriesView = new DonutSeriesView(
            d3.select(".donut_series"),
            200);
        
        // Fetch and display initial policy violation data
        updatePolicyViolations(donutSeriesView);
    }, 0);
    
    // Fetches the latest policy violation information and
    // displays it as a donut series in the dashboard.
    function updatePolicyViolations(donutSeriesView) {
        var dataSearch = mvc.Components.get('policy_violations_color_summary');
        
        // Rerun search
        dataSearch.startSearch();
        
        dataSearch.data("results").on("data", function(resultsModel) {
            var rows = resultsModel.data().rows;

            // if rows is not empty, hide the "No violations detected" message container
            if(rows) 
                $('#no-violations-message').addClass('hide');

            // From the search results, compute what data the donut series
            // chart should display.
            var donutSeriesData = [];
            _.each(rows, function(row) {
                var department = row[0];
                var numYellows = row[1];
                var numReds = row[2];
                var totalWeight = row[3];
                
                if (totalWeight == null) {
                    totalWeight = 0;
                } else {
                    totalWeight = Math.round(totalWeight);
                }
                
                var colorData = [];
                if (numYellows == 0 && numReds == 0) {
                    colorData = [{ color: 'gray', size: 1 }];
                } else if (numYellows != 0 && numReds == 0) {
                    colorData = [{ color: 'orange', size: numYellows }];
                } else if (numYellows == 0 && numReds != 0) {
                    colorData = [{ color: 'red', size: numReds }];
                } else {
                    colorData = [
                        { color: 'red', size: numReds },
                        { color: 'orange', size: numYellows }
                    ];
                }
                
                donutSeriesData.push({
                    data: colorData,
                    titleText: department,
                    centerText: totalWeight,
                    // TODO: Compute % difference from last period
                    lowerText: ""
                });
            });
            
            // Display the donut series chart
            donutSeriesView.setData(donutSeriesData);
        });
    }
    
    // Displays the donut series chart with a nice set of canned data.
    // TODO: Remove. Unused.
    function createDefaultDonutSeriesPanel() {
        var standardData = [
            {
                color: 'red',
                size: 2704659
            }, {
                color: 'orange',
                size: 4499890
            }, {
                color: 'purple',
                size: 2159981
            }
        ];

        createDonutSeriesPanel([
            {
                data: standardData,
                titleText: "Research",
                centerText: 67,
                lowerText: "+117%"
            }, {
                data: standardData,
                titleText: "Marketing",
                centerText: 128,
                lowerText: "+12%"
            }, {
                data: standardData,
                titleText: "Human Resources",
                centerText: 118,
                lowerText: "-16%"
            }/*, {
                data: standardData,
                titleText: "Retail",
                centerText: 118,
                lowerText: "-16%"
            }*/
        ], d3.select(".donut_series"), 200);
    }
    
    var DonutSeriesView = function() {
        DonutSeriesView.prototype.initialize.apply(this, arguments);
    };
    _.extend(DonutSeriesView.prototype, {
        // The parameter "data" is optional.
        initialize: function(container, maxHeight, data) {
            this.container = container;
            this.maxHeight = maxHeight;
            this.data = data;
            
            this._start();
        },
        
        setData: function(data) {
            this.data = data;
            this._renderDonutSeriesPanel();
        },
        
        _start: function() {
            var that = this;
            
            // Perform initial rendering
            this._renderDonutSeriesPanel();
            
            // Rerender whenever the page resizes
            window.addEventListener("resize", function() {
                that._renderDonutSeriesPanel();
            }, false);
        },
        
        _renderDonutSeriesPanel: function() {
            var DONUT_SPACING = 10;
            
            var data = this.data;
            var container = this.container;
            var maxHeight = this.maxHeight;
            
            // Destroy old rendering
            var containerNode = container.node();
            while (containerNode.hasChildNodes()) {
                containerNode.removeChild(containerNode.lastChild);
            }
            
            // TODO: Render a spinner
            if (!data) {
                return;
            }
            
            var totalWidth = container.node().offsetWidth;
            var numDonuts = data.length;
            // NOTE: 4 is magic to work around rounding error somewhere...
            var widthPerDonut = Math.floor(totalWidth / numDonuts) - 4;
            
            if (totalWidth < 0 || widthPerDonut < 0) {
                console.warn("Cannot draw donut series in container with width zero.");
                return;
            }
            
            // Clamp height to maximum if necessary
            if (widthPerDonut > maxHeight) {
                widthPerDonut = maxHeight;
            }
            
            // Add donuts
            _.each(data, function(donutData) {
                var donutContainer = container.append("span").attr("class", "donut");
                
                var donutSize = widthPerDonut - 2*DONUT_SPACING;
                this._renderDonutChart(
                    donutData.data,
                    donutData.titleText,
                    donutData.centerText,
                    donutData.lowerText,
                    donutContainer,
                    donutSize,
                    30/170 * widthPerDonut);
                
                donutContainer.node().style.marginLeft = DONUT_SPACING + "px";
                donutContainer.node().style.marginRight = DONUT_SPACING + "px";
            }, this);
            
            // Center the donuts by adding the correct padding
            container.node().style.paddingLeft = (totalWidth - (widthPerDonut * numDonuts)) / 2 + "px";
        },
        
        _renderDonutChart: function(
            data, titleText, centerText, lowerText,
            container, size, thickness)
        {
            var TITLE_AREA_HEIGHT = 30;
            var TITLE_TEXT_PX_HEIGHT = 14;
            
            var radius = size / 2;

            var arc = d3.svg.arc()
                .outerRadius(radius)
                .innerRadius(radius - thickness);

            var pie = d3.layout.pie()
                .sort(null)
                .value(function(d) { return d.size; });

            var svg = container.append("svg")
                .attr("width", size)
                .attr("height", size + TITLE_AREA_HEIGHT)
              .append("g")
                .attr("transform", "translate(" + size/2 + "," + (size/2 + TITLE_AREA_HEIGHT) + ")");
            
            // Add title
            svg.append("text")
                .attr("class", "titleText")
                .attr("dy", (-(size / 2) - (TITLE_AREA_HEIGHT - TITLE_TEXT_PX_HEIGHT)/2) + "px")
                .style("text-anchor", "middle")
                .style("font-size", TITLE_TEXT_PX_HEIGHT + "px")
                .text(titleText);
            
            // Add center text
            svg.append("text")
                .attr("class", "centerText")
                .attr("dy", ".35em")
                .style("text-anchor", "middle")
                .style("font-size", size * 0.20 + "px")
                .text(centerText);
            
            // Add lower text
            svg.append("text")
                .attr("class", "lowerText")
                .attr("dy", "2.2em")
                .style("text-anchor", "middle")
                .style("font-size", size * 0.08 + "px")
                .text(lowerText);
            
            // Draw arc segments
            svg.selectAll(".arc")
                .data(pie(data))
              .enter().append("g")
                .attr("class", "arc")
                .append("path")
                .attr("d", arc)
                .style("fill", function(d) { return d.data.color; });
        }
    });
});
