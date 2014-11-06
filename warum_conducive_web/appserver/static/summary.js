// Define a fake require module "tagmanager" that wraps the
// non-require-compatible 3rd-party tagmanager.js JQuery plugin.
require.config({
    paths: {
        "bootstrap-tagsinput": "../app/warum_conducive_web/bootstrap-tagsinput",
    },
    shim: {
        "bootstrap-tagsinput": {
            deps: ["jquery"]
        }
    }
});

require([
    "splunkjs/ready!",
    "splunkjs/mvc/simplexml/ready!",
    "underscore",
    "../app/warum_conducive_web/filter_component",
    "../app/warum_conducive_web/components/d3/d3"   // for donut series
], function(
    mvc,
    ignored,
    _,
    FilterComponent,
    d3
) {
    var trendChart = mvc.Components.getInstance("trend_chart");
    var userTable = mvc.Components.getInstance("user_table");
    var documentTable = mvc.Components.getInstance("document_table");
    
    var tokens = mvc.Components.get("default");
    
    FilterComponent.initialize(mvc);
    
    // TODO: Filtering functionality triggered by clicking on the legend
    //       of the Trend chart is currently broken. Please fix or remove.
    tokens.set("command", "*");
    trendChart.on("click:legend", function(e) {
        e.preventDefault();
        tokens.set("command", e.name2);
        $("#filter_header").show();
    });

    var menuData = [
        {
            text: 'Include', 
            splunk_action: 'include'
        },
        {
            text: 'Exclude', 
            splunk_action: 'exclude'
        },
        {
            text: 'Drilldown', 
            splunk_action: 'drilldown',
            search: "index=* sourcetype=Events $criteria$ | table _time Event_ID User_Name, Computer_Name, Application, Operation, Email_Domain, DNS_Hostname, Source_Directory, Source_File_Extension, Destination_Directory, Destination_File_Extension"
        }
    ];

    // Setup custom contextual menu that appears when clicking on the tables
    context.init({preventDoubleContext: false});
    context.attachToChart(trendChart, menuData);
    context.attachToTable(userTable, menuData);
    context.attachToTable(documentTable, menuData);
    
    // HACK: Wait until end of the current event loop for the browser
    //       to finish rendering the div in which the donut series
    //       viz will be inserted. If not done, the div will be width
    //       zero which will prevert the viz from calculating how to
    //       render itself.
    window.setTimeout(function() {
        createDonutSeriesVisualization();
    }, 0);
    
    function createDonutSeriesVisualization() {
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

    function createDonutSeriesPanel(data, container, maxHeight) {
        // Perform initial rendering
        renderDonutSeriesPanel(data, container, maxHeight);
        
        // Rerender whenever the page resizes
        window.addEventListener("resize", function() {
            // Destroy old rendering
            var containerNode = container.node();
            while (containerNode.hasChildNodes()) {
                containerNode.removeChild(containerNode.lastChild);
            }
            
            // Perform new rendering
            renderDonutSeriesPanel(data, container, maxHeight);
        }, false);
    }

    function renderDonutSeriesPanel(data, container, maxHeight) {
        var DONUT_SPACING = 10;
        
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
            renderDonutChart(
                donutData.data,
                donutData.titleText,
                donutData.centerText,
                donutData.lowerText,
                donutContainer,
                donutSize,
                30/170 * widthPerDonut);
            
            donutContainer.node().style.marginLeft = DONUT_SPACING + "px";
            donutContainer.node().style.marginRight = DONUT_SPACING + "px";
        });
        
        // Center the donuts by adding the correct padding
        container.node().style.paddingLeft = (totalWidth - (widthPerDonut * numDonuts)) / 2 + "px";
    }

    function renderDonutChart(
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
